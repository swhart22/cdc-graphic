'use strict';


import draw from './draw.js';
import {json} from 'd3-request';

import factors from './factors.js';

// let domain = 'https://nbcdfw.com/';
let dataDir = ENV === 'development' ? '../../data/' : 'data/';

async function render(){
	let domain = xtalk.parentDomain.includes('nbc') | 
	xtalk.parentDomain.includes('necn') ? xtalk.parentDomain.replace('stage.', '') : 
	'https://www.nbcconnecticut.com/';
	console.log(domain);
	async function loadGeometry(dFile){
		return new Promise((resolve, reject) => {
			json(dFile, (error, data) => {
				if (error) throw error;
				resolve(data)
			})
		})
	}
	let config = {
		'https://www.nbcchicago.com/':{
			'metro':'the Chicago metropolitan area',
			'metroView':[[41.90855318755631, -88.51674914360048], 9],
			'factors':[factors.diabetes, factors['blood pressure'], factors.obesity], 
			'top':1,
			'dFile': dataDir + 'chi-topo-tracts.json',
			'beginnerCircles':true
		},
		'https://www.nbcnewyork.com/':{
			'metro':'the New York metropolitan area',
			'metroView':[[40.962343848337824, -74.35934185981752], 9],
			'factors':[ factors.obesity, factors.exercise], 
			'top':3,
			'dFile': dataDir + 'nyc-topo-tracts.json',
			'beginnerCircles':true
		}, 
		'https://www.nbcsandiego.com/':{
			'metro':'the San Diego metropolitan area',
			'metroView':[[33.103522551465346, -118.02984595298769], 9],
			'top':1,
			'factors':[factors.diabetes, factors.obesity], 
			'dFile': dataDir + 'sd-topo-tracts.json',
			'beginnerCircles':false
		},
		'https://www.nbcphiladelphia.com/':{
			'metro':'the Philadelphia metropolitan area',
			'metroView':[[39.92527199411296, -75.42584717273714], 10],
			'top':3,
			'factors':[factors['lack of sleep'], factors.obesity], 
			'dFile': dataDir + 'phi-topo-tracts.json',
			'beginnerCircles':true
		},
		'https://www.nbcboston.com/':{
			'metro':'the Boston metropolitan area',
			'metroView':[[42.24971338268648, -71.49163126945497], 9],
			'top':1,
			'factors':[factors.insurance, factors.smoking, factors.obesity, factors['mental health']], 
			'dFile': dataDir + 'bos-topo-tracts.json',
			'beginnerCircles':true
		},
		'https://www.necn.com/':{
			'metro':'the Boston metropolitan area',
			'metroView':[[42.24971338268648, -71.49163126945497], 9],
			'top':1,
			'factors':[factors.insurance, factors.obesity, factors['mental health']], 
			'dFile': dataDir + 'bos-topo-tracts.json',
			'beginnerCircles':true
		},
		'https://www.nbcdfw.com/':{
			'metro':'the Dallas Fort Worth metropolitan area',
			'metroView':[[32.944977220131506, -97.67591357231142], 9],
			'top':1,
			'factors':[factors.exercise, factors.obesity], 
			'dFile': dataDir + 'dfw-topo-tracts.json',
			'beginnerCircles':false
		},
		'https://www.nbcbayarea.com/':{
			'metro':'the Bay Area metropolitan area',
			'metroView':[[37.823548214439256, -122.95047640800477], 8],
			'factors':[factors.exercise, factors.obesity], 
			'top':1,
			'dFile': dataDir + 'bay-topo-tracts.json',
			'beginnerCircles':false
		},
		'https://www.nbclosangeles.com/':{
			'metro':'the Los Angeles metropolitan area',
			'metroView':[[34.168121042274116, -118.74389290809633], 9],
			'factors':[factors.exercise, factors.obesity], 
			'top':1,
			'dFile': dataDir + 'la-topo-tracts.json',
			'beginnerCircles':false
		},
		'https://www.nbcmiami.com/':{
			'metro':'the Miami metropolitan area',
			'metroView':[[26.284122869098, -80.37953853607179], 9],
			'factors':[factors.exercise, factors.obesity], 
			'top':1,
			'dFile': dataDir + 'mia-topo-tracts.json',
			'beginnerCircles':false
		},
		'https://www.nbcwashington.com/':{
			'metro':'the D.C. metropolitan area',
			'metroView':[[38.88374438136598, -77.21913993358613], 11],
			'factors':[factors.exercise, factors.obesity], 
			'top':1,
			'dFile': dataDir + 'dc-topo-tracts.json',
			'beginnerCircles':false
		},
		'https://www.telemundohouston.com/':{
			'metro':'the Houston metropolitan area',
			'metroView':[[29.81381015146583, -95.93068599700929], 9],
			'factors':[factors.exercise, factors.obesity], 
			'top':1,
			'dFile': dataDir + 'hou-topo-tracts.json',
			'beginnerCircles':false
		},
		'https://www.nbcconnecticut.com/':{
			'metro':'Connecticut',
			'metroView':[[29.81381015146583, -95.93068599700929], 9],
			'factors':[factors.sleep, factors.obesity], 
			'top':1,
			'dFile': dataDir + 'har-topo-tracts.json',
			'beginnerCircles':true
		}
	}

	let geo = await loadGeometry(config[domain].dFile)
	draw(geo, config[domain]);
}

render();
//export default metadata;