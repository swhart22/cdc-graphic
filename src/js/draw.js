'use strict';

import '../css/nbcotsbase.css';
import '../css/font-awesome-4.7.0/fonts/fontawesome-webfont.eot'
import '../css/font-awesome-4.7.0/fonts/fontawesome-webfont.svg'
import '../css/font-awesome-4.7.0/fonts/fontawesome-webfont.ttf'
import '../css/font-awesome-4.7.0/fonts/fontawesome-webfont.woff'
import '../css/font-awesome-4.7.0/fonts/fontawesome-webfont.woff2'
import '../css/font-awesome-4.7.0/fonts/FontAwesome.otf'
import '../css/font-awesome-4.7.0/css/font-awesome.min.css';

import L from 'leaflet';
import colors from './colors.js';
import circle from './circle.js';
import {select, selectAll} from 'd3-selection';
import {transition} from 'd3-transition';
import {extent, max, descending, quantile} from 'd3-array';
import {geoMercator, geoPath} from 'd3-geo';
import {scaleLinear, scaleQuantize} from 'd3-scale';
import {axisLeft, axisBottom} from 'd3-axis';
import {timeout} from 'd3-timer';

const topojson = require('topojson');

function draw(Data, config){
	
	let cdcFactor = config.factors[0];
	Data.objects.metro.geometries = Data.objects.metro.geometries.map(d => {
		if (d.properties['ACS 2017 MEDIAN INCOME'] == undefined) {
			d.properties['ACS 2017 MEDIAN INCOME'] = 0;
		};
		return d;
	});

	console.log(Data);
	let totalBBox = topojson.bbox(Data),
	totalBounds = L.latLngBounds([[totalBBox[1], totalBBox[0]], [totalBBox[3], totalBBox[2]]])

	let width = parseInt(select('#container').style('width')),
	height = parseInt(select('#container').style('height')),
	breakpoint = 400,
	margin = {top: 0, left:0, bottom:10, right:0},
	chartWidth = width - margin.left - margin.right,
	chartHeight = height - margin.top - margin.bottom,
	lWidth = parseInt(select('#leaflet-base').style('width')),
	lHeight = parseInt(select('#leaflet-base').style('height'));

	let isMobile = width <= breakpoint, 
	scatterWidth = isMobile ? chartWidth - 80 : 300,
	scatterX = isMobile ? 60 : 80,
	scatterY = isMobile ? (chartHeight / 2) : (chartHeight - scatterWidth) - 40,
	fitPad = isMobile ? [0, 200] : [0, 0];

	//leaflet config
	let metroView = isMobile ? totalBounds : config.metroView;

	let range = extent(Data.objects.metro.geometries.filter(d => d['properties']['ACS 2017 MEDIAN INCOME'] !== 0), d => +d.properties[cdcFactor.colName]);

	let extentShapes = [topojson.feature(Data, Data.objects.metro).features.find(feat => feat.properties[cdcFactor.colName] == range[0]), 
		topojson.feature(Data, Data.objects.metro).features.find(feat => feat.properties[cdcFactor.colName] == range[1])
	]

	let coords = extentShapes[0].geometry['coordinates'][0].concat(extentShapes[1].geometry['coordinates'][0])
	let lowest = L.latLngBounds(extentShapes[0].geometry['coordinates'][0].map(coord => L.latLng(coord[1], coord[0])));
	let highest = L.latLngBounds(extentShapes[1].geometry['coordinates'][0].map(coord => L.latLng(coord[1], coord[0])));
	let newBounds = L.latLngBounds(coords.map(coord => L.latLng(coord[1], coord[0])))

	let leafletMap = L.map("leaflet-base", {zoomControl:false});
	leafletMap.fitBounds(newBounds);
	L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
		subdomains: 'abcd',
		maxZoom: 19
	}).addTo(leafletMap);
	leafletMap.on('moveend', () => {
		console.log(leafletMap.getCenter());
	})
	// console.log();
	leafletMap.dragging.disable();
	leafletMap.touchZoom.disable();
	leafletMap.doubleClickZoom.disable();
	leafletMap.scrollWheelZoom.disable();

	let svg = select('#container').append("svg")
		.attr("width",width)
		.attr("height",height);

	let canv = select("#container").append("canvas")
		.attr('width', width)
		.attr("height", height);

	//appends g to svg that will contain all chart elements and translate them to the set chart extents
	let g = svg.append("g")
		.attr("transform",'translate(' + margin.left + ',' + margin.top + ')');

	let colorScale = scaleLinear()
		.domain(extent(Data.objects.metro.geometries, d => +d.properties[cdcFactor.colName]))
		.range([colors['green']['04'], colors['yellow']['04']]);

	let defProjection = geoMercator();

	//made a dummy geojson to fit d3's bounding box to
	function boundJSON(lb){
		return {'type':'FeatureCollection', 'features': 
			[{'type':'Feature', 
				'geometry':{'type':'Polygon','coordinates':[[
								[lb['_southWest']['lng'], lb['_southWest']['lat']], 
								[lb['_southWest']['lng'], lb['_northEast']['lat']],
								[lb['_northEast']['lng'], lb['_northEast']['lat']],
								[lb['_northEast']['lng'], lb['_southWest']['lat']],
								[lb['_southWest']['lng'], lb['_southWest']['lat']]
								]]
			}}]
		}
	}
	let topMargin = parseInt(select('#leaflet-base').style("margin-top"));
	function getCoords(coords, x, y, projection){
			
			let coords0 = coords.map(projection),
			coords1 = circle(coords0, x, y),
			d0 = 'M' + coords0.join('L') + 'Z',
			d1 = 'M' + coords1.join('L') + 'Z',
			d4 = 'M' + coords0.map(coord => [coord[0], coord[1] + topMargin]).join('L') + 'Z';

			return {'d0':d0, 'd1': d1, 'd4':d4};
	};
	//SCATTERPLOT ELEMENTS
	//scatter attributes

	let xRange =scaleLinear().domain([0, max(Data.objects.metro.geometries, d => +d.properties[cdcFactor.colName])]);

	let yRange = scaleLinear().domain([0, max(Data.objects.metro.geometries, d => +d.properties['ACS 2017 MEDIAN INCOME'])]);

	let yAxis, xAxis;

	let scatterPlot = g.append('g')
		.style('opacity',0)
		.attr('id', 'scatterplot')
		.attr('transform', 'translate(0,0)');

	let yG = scatterPlot.append('g')
		.attr('class', 'y-axis');

	let xG = scatterPlot.append('g')
		.attr('class', 'x-axis');

	let yt = scatterPlot.append('text')
		.attr('class', 'axis-label')
		.attr('transform', 'translate('+ (scatterX - 50) +', '+(scatterY + 220)+') rotate(-90)')
		.text('Median Income →');

	let xt = scatterPlot.append('text')
		.attr('class', 'axis-label')
		.attr('transform', 'translate('+(scatterX + 30)+', '+(scatterY + scatterWidth + 35)+')')
		.text('% adults reporting '+cdcFactor.title+' →');

	scatterPlot.call(updateScatter, scatterWidth, 0, scatterY, [0, 0, 0, 0]);

	let features = topojson.feature(Data, Data.objects.metro).features
		.sort((a, b) => descending(+a.properties[cdcFactor.colName], +b.properties[cdcFactor.colName]));

	let tracts = g.selectAll('.base')
		.data(features)
		.enter()
		.append('g')
		.attr('class', 'base');

	let shapes = tracts.selectAll('.shape')
		.data((d, i) => {
			return d.geometry.coordinates.map(coordSet => {
				let set = d.geometry.coordinates.length == 1 ? coordSet : coordSet[0];
				return {
					data: d,
					coords: set,
					tractI: i
				}
			})
		}).enter().append('path')
		.attr('class','shape');

	let cityBorders = g.append('path')
		.datum(topojson.mesh(Data, Data.objects.metro, function(a, b) { return a['properties']['city'] !== b['properties']['city']; }))
		.attr('class','border')
		.attr('fill','none')
		.style('stroke',colors['blue']['01'])
		.style('stroke-width',1)
		.attr('transform', 'translate(0, ' + topMargin +')')
		.style('stroke-dasharray', '4,2')
		.style("opacity", 0);

	let outerCityBorders = g.append('path')
		.datum(topojson.mesh(Data, Data.objects.metro, function(a, b) { return a === b; }))
		.attr('class','border')
		.attr('fill','none')
		.style('stroke-linejoin','round')
		.style('stroke',colors['blue']['01'])
		.style('stroke-width',1)
		.style('stroke-dasharray', '4,2')
		.attr('transform', 'translate(0, ' + topMargin +')')
		.style("opacity", 0);

	let notes = select('#notes');
	let text = select('#text');
	let noteswidth = parseInt(notes.style("width"));

	let activeButton = '#69b3f2', passiveButton = '#fafafa';

	//states
	function scatterShapes(selection, opacity, duration, delay){

		selection
			.selectAll('.shape')
			.transition()
			.duration(duration)
			.delay((d, i) => delay ? d.tractI : 0)
			.style('stroke-width', 0)
			.style('opacity', (d, i) => {
				let nullACS = d.data.properties['ACS 2017 MEDIAN INCOME'] === 0;
				let first = i == 0;
				let copacity = !nullACS & first ? opacity : 0;

				return copacity
			})
			.attr('d',d => {
				let x = xRange(d.data.properties[cdcFactor.colName]),
				y = yRange(d.data.properties['ACS 2017 MEDIAN INCOME']);
				return getCoords(d.coords, x, y, defProjection).d1;
			})
			.style('fill', d => d.data.properties[cdcFactor.colName] == 'ERROR LOCATING BP DATA' ? 'none' : colorScale(+d.data.properties[cdcFactor.colName]));
	}
	function nextButtonActive(selection){
		selection
			.on('click', nextClick)
			.style('background-color',activeButton)
			.style('color', passiveButton)
			.style('border-width', 1)
			.style('border-style', 'solid')
			.style("border-color", activeButton)
	}

	function nextButtonLoading(selection){
		selection
			.on('click', null)
			.style('background-color',passiveButton)
			.style('color', activeButton)
			.style('border-width', '1px')
			.style('border-style', 'dotted')
			.style('border-color', activeButton)
	}

	function borderShowHide(selection, opacity, projection){
		selection
			.transition()
			.duration(1000)
			.style("opacity", opacity);

		if (projection) {
			selection.attr("d", geoPath().projection(projection))
		}
	}

	function showGeoShapes(selection, projection, strokeWidth, transparent){
		 
		selection
			.style('opacity', 1)
		.selectAll('.shape')
			.style('opacity', 1)
			.style('fill', d => {
				let fill = transparent == true ? 'rgba(255,255,255, 0.3' : d.data.properties[cdcFactor.colName] == 'ERROR LOCATING BP DATA' ? 'none' : colorScale(+d.data.properties[cdcFactor.colName]);

				return fill;
			})
			.style('stroke', d => d.data.properties[cdcFactor.colName] == 'ERROR LOCATING BP DATA' ? 'none' : colorScale(+d.data.properties[cdcFactor.colName]))
			.style('stroke-width', strokeWidth + 'px')
			.attr('d', (d, i) => {
				return getCoords(d.coords, 50, 50, projection).d4;
			})

	}

	function updateScatter(selection, scatterwidth, scattery, opacity, labelpos){
		console.log(labelpos);
		let xx = labelpos[0], xy = labelpos[1], yx = labelpos[2], yy = labelpos[3];

		let ticks = scatterwidth < 290 ? 2 : 10;
		selection.style("opacity", opacity);
		xRange.range([scatterX, scatterX + scatterwidth]);
		yRange.range([scatterwidth + scattery, scattery]);
		yAxis = axisLeft(yRange).ticks(ticks).tickSize(-scatterwidth);
		xAxis = axisBottom(xRange).ticks(ticks).tickSize(-scatterwidth);
		yG.transition().duration(1000).attr('transform', 'translate('+scatterX+',0)').call(yAxis);
		xG.transition().duration(1000).attr('transform', 'translate(0,'+(scattery + scatterwidth)+')').call(xAxis)
		yt.transition().duration(1000).attr('transform', 'translate(' + yx + ',' + yy + ') rotate(-90)');
		xt.transition().duration(1000).attr('transform', 'translate(' + xx + ',' + xy + ')');
	}

	function placeGuide(selection, top, bottom, left, right){
		let leftt = isMobile ? (chartWidth / 2) - (notes.width / 2) : 15;

		selection 
			.transition()
			.duration(1000)
			.style('top', 15 + 'px')
			.style('left', leftt + 'px')
			.style('bottom', 'auto')
			.style('right', 'auto');
	}

	//phases
	function twoTracts(){
		let totalDuration = 2000;
		selectAll('.base').filter(d => {
			let max = d.properties['GEOID'] == extentShapes[1].properties['GEOID'];
			let min = d.properties['GEOID'] == extentShapes[0].properties['GEOID'];
					
					return !min & !max;
		}).call(scatterShapes, 0, 0, 0);
		function placeShapes(newlb){
			// let newlb = leafletMap.getBounds();
			let newProjection = geoMercator().fitSize([lWidth, lHeight], boundJSON(newlb));
		
			selectAll('.base')
				.filter(d => {
					
					let max = d.properties['GEOID'] == extentShapes[1].properties['GEOID'];
					let min = d.properties['GEOID'] == extentShapes[0].properties['GEOID'];
					
					return min | max;
					// return min | max;
				}).call(showGeoShapes, newProjection, 0, false);
		}

		let newlb;
		newBounds = L.latLngBounds(coords.map(coord => L.latLng(coord[1], coord[0])));
		leafletMap.once('zoomend moveend', () => {
				newlb = leafletMap.getBounds()
				placeShapes(newlb)
		})

		leafletMap.fitBounds(newBounds, {paddingTopLeft: fitPad});

		let yx = (scatterX - 50),
			yy = (scatterY + 220),
			xx = (scatterX + 30),
			xy = (scatterY + scatterWidth + 35);
		
		scatterPlot.call(updateScatter, scatterWidth, scatterY, 0, [xx, xy, yx, yy]);

		selectAll('.border').call(borderShowHide, 0, null);

		select('#leaflet-base')
			.transition()
			.duration(2000)
			.style("opacity", 1)

		text.html('These are the census tracts in the study in the '+config.metro+' metropolitan area with the highest and lowest '+config.factors[0].title+' rates.');

		let notesheight = parseInt(notes.style('height')),
		notestop = isMobile ? 85 + 'px' : (height / 2) - (notesheight / 2) + 'px', 
		notesleft = (width / 2) - (noteswidth / 2) + 'px';
		notes.call(placeGuide, notestop, 'auto', notesleft, 'auto');

	}
	function flyToHighest(){
		let totalDuration = 2000;

		select('#next').call(nextButtonLoading)

		timeout(() => {
			select('#next').call(nextButtonActive)
		}, totalDuration);

		let highestDP = extentShapes[1];
		selectAll('.base').call(scatterShapes, 0, 0, 0);
		// notes.transition().duration(1000).style('left', 10 + 'px');
		text.html('The tract with the <strong>highest</strong> prevalence of ' + config.factors[0].title + ' was in ' + highestDP.properties['city'] + '.');
		
		leafletMap.flyToBounds(highest)
		leafletMap.on('zoomend moveend', () => {
			let newlb = leafletMap.getBounds();
			let newProjection = geoMercator().fitSize([lWidth, lHeight], boundJSON(newlb));

			selectAll('.base')
				.filter(d => {
					// let min = d.properties[cdcFactor.colName] == range[0];
					let max = d.properties[cdcFactor.colName] == range[1];
					
					return max;
				}).call(showGeoShapes, newProjection, 3, true);
				
		})
		
	}
	function flyToLowest(){
		let totalDuration = 2000;
		select('#next').call(nextButtonLoading)

		timeout(() => {
			select('#next').call(nextButtonActive)
		}, totalDuration);

		let highestDP = extentShapes[0];
		selectAll('.base').call(scatterShapes, 0, 0, 0);
		
		text.html('The tract with the <strong>lowest</strong> prevalence of ' + config.factors[0].title + ' was in ' + highestDP.properties['city'] + '.');

		leafletMap.flyToBounds(lowest)
		leafletMap.on('zoomend moveend', () => {
			let newlb = leafletMap.getBounds();
			let newProjection = geoMercator().fitSize([lWidth, lHeight], boundJSON(newlb));
			selectAll('.base')
				.filter(d => {
					let min = d.properties[cdcFactor.colName] == range[0];
					// let max = d.properties[cdcFactor.colName] == range[1];
					
					return min;
				}).call(showGeoShapes, newProjection, 3, true);
		})
	}
	function preScatter(){
		let totalDuration = 1000;
		select('#next').call(nextButtonLoading)

		timeout(() => {
			select('#next').call(nextButtonActive)
		}, totalDuration);

		selectAll('.base')
			.filter(d => {
				let max = d.properties['GEOID'] == extentShapes[1].properties['GEOID'];
				let min = d.properties['GEOID'] == extentShapes[0].properties['GEOID'];
					
				return min | max;
			})	
			.style('opacity',1)
			.call(scatterShapes, 1, 1000, 0);

		select('#leaflet-base')
			.transition()
			.duration(2000)
			.style("opacity", 0)

		let yx = (scatterX - 50),
			yy = (scatterY + 220),
			xx = (scatterX + 30),
			xy = (scatterY + scatterWidth + 35);

		scatterPlot.call(updateScatter, scatterWidth, scatterY, 1, [xx, xy, yx, yy])

		text.html('These are two census tracts in a study of ' + Data.objects.metro.geometries.length + ' tracts in the ' + config.metro + ' metropolitan area that the CDC studied.')	
		
	}
	
	function scatter(){
		let totalDuration = 2000;
		select('#next').call(nextButtonLoading)

		timeout(() => {
			select('#next').call(nextButtonActive)
		}, totalDuration);

		// isMobile ? leafletMap.fitBounds(metroView) : leafletMap.setView(metroView[0], metroView[1]);
		leafletMap.fitBounds(totalBounds, {paddingTopLeft: fitPad});
		selectAll('.base')
			.call(scatterShapes, 3, 0, true);

		select('#leaflet-base')
			.transition()
			.duration(2000)
			.style("opacity", 0)

		text.html('In general, tracts with a high prevalence of '+ config.factors[0].title + ' correlated with low median incomes.')
	}
	function situate(){
		let totalDuration = 2000;
		let lb = leafletMap.getBounds();
		defProjection
			.fitSize([lWidth, lHeight], boundJSON(lb))
		select('#next').call(nextButtonLoading)

		timeout(() => {
			select('#next').call(nextButtonActive)
		}, totalDuration);

		select('#leaflet-base')
			.transition()
			.duration(2000)
			.style("opacity", 1)

		let newScatterWidth = 100;

		let yx = (scatterX - 50),
			yy = (scatterY + 300),
			xx = (scatterX),
			xy = (scatterY + scatterWidth + 35);

		scatterPlot.call(updateScatter, newScatterWidth, chartHeight - newScatterWidth - 30, 1, [xx, xy, yx, yy]);
		shapes
			.transition()
			.duration(2000)
			.attr('d', d => {
				let x = xRange(d.data.properties[cdcFactor.colName]),
				y = yRange(d.data.properties['ACS 2017 MEDIAN INCOME']);

				return getCoords(d.coords, x, y, defProjection).d1;
			});

		selectAll('.border').call(borderShowHide, 1, defProjection)

		text.html('Tracts with low income and high prevalences of ' + config.factors[0].title + ' tend to cluster geographically.')
	}

	function geoPlace50(){
		let totalDuration = 2000;
		select('#next').call(nextButtonLoading)

		timeout(() => {
			select('#next').call(nextButtonActive)
		}, totalDuration);

		let range = extent(Data.objects.metro.geometries, d => +d.properties[cdcFactor.colName]);
		let lb = leafletMap.getBounds();
		defProjection
			.fitSize([lWidth, lHeight], boundJSON(lb))
		
		select('#leaflet-base')
			.transition()
			.duration(1000)
			.style("opacity", 1)

		selectAll('.border')
			.transition()
			.duration(1000)
			.attr('d', geoPath().projection(defProjection))
			.style('opacity', 1)

		selectAll('.shape').filter(d => +d.data.properties[cdcFactor.colName] >= quantile(range, 0.50))
			.transition()
			.delay(d => 1000 + d.tractI * 2)
			.style('opacity', 1)
			.attr('d', d => {
				let r = 2;

				return getCoords(d.coords, null, null, defProjection).d4;
			})

		text.html('Broadly speaking, <strong>the top 50%</strong> of tracts with a high prevalence of ' + config.factors[0].title + ' tended to be located in urban cores of metro areas...');
	}

	function geoPlace100(){
		let totalDuration = 2000;
		select('#next').call(nextButtonLoading)

		timeout(() => {
			select('#next').call(nextButtonActive)
		}, totalDuration);

		let range = extent(Data.objects.metro.geometries, d => +d.properties[cdcFactor.colName]);
		let lb = leafletMap.getBounds();
		defProjection
			.fitSize([lWidth, lHeight], boundJSON(lb))
		
		select('#leaflet-base')
			.transition()
			.duration(1000)
			.style("opacity", 1)

		selectAll('.border')
			.transition()
			.duration(1000)
			.attr('d', geoPath().projection(defProjection))
			.style('opacity', 1)

		selectAll('.shape').filter(d => +d.data.properties[cdcFactor.colName] >= quantile(range, 0))
			.transition()
			.delay(d => d.tractI * 2)
			.style('opacity', 1)
			.attr('d', d => {
				let r = 2;

				return getCoords(d.coords, null, null, defProjection).d4;
			})

		text.html('... while the <strong>the bottom 50%</strong> of tracts with a high prevalence of ' + config.factors[0].title + ' tended to be located in wealthier urban tracts and outlying suburbs.')
	}

	//manage clickthrough experience
	let accum = 0;
	let phases = [{'func':twoTracts},{'func':flyToHighest},{'func':flyToLowest},{'func': preScatter},{'func': scatter},{'func': situate}, {'func':geoPlace50}, {'func':geoPlace100}];


	let carouselIcons =select('#carousel-icons')
		.selectAll('.carousel-icon').data(phases).enter().append("div")
		.attr('class','carousel-icon')
		.attr('id', (d, i) => 'carous-' + i)
		.html((d, i) => {
			return i == 0 ? '<i class="fa fa-circle-o" aria-hidden="true"></i>' : '<i class="fa fa-circle" aria-hidden="true"></i>';
		});

	// let progressBar = select('#progress-bar');

	function nextClick(){
		accum += 1;
			let step = Math.abs(accum % phases.length);
			phases[step].func();
			selectAll('.carousel-icon')
				.html('<i class="fa fa-circle" aria-hidden="true"></i>');

			select('#carous-' + Math.abs(accum % phases.length))
				.html('<i class="fa fa-circle-o" aria-hidden="true"></i>')


			if (step == phases.length - 1){
				timeout(() => {
					select('#next').html('Restart <i class="fa fa-refresh" aria-hidden="true"></i>')
				}, 2000)
				
			} else {
				select('#next').html('Next <i class="fa fa-arrow-right" aria-hidden="true">')
			}
	}

	select('#next')
		.on('click', nextClick)

	select('#prev')
		.on('click', () => {
			accum -= 1;
			phases[Math.abs(accum % phases.length)].func();

			selectAll('.carousel-icon')
				.html('<i class="fa fa-circle" aria-hidden="true"></i>');

			select('#carous-' + Math.abs(accum % phases.length))
				.html('<i class="fa fa-circle-o" aria-hidden="true"></i>')
		})

	phases[0].func();
	
	if (document.URL.includes('d3-video-recording')){
		window.currentTime = 0
 		performance.now = () => currentTime

 		for (let i = 1; i < phases.length; i++){
		let phase = phases[i];
		let delay = i * 3000;
		timeout(phase.func, delay);
	}
	}
		
};

export default draw;
