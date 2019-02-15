'use strict';


import draw from './draw.js';
import {json} from 'd3-request';

import factors from './factors.js';

// let domain = 'https://nbcdfw.com/';
let dataDir = ENV === 'development' ? '../../data/' : 'data/';

async function render(){
	let domain = xtalk.parentDomain.includes('nbc') | 
	xtalk.parentDomain.includes('necn') ? xtalk.parentDomain.replace('stage.www.', '') : 
	'https://nbcboston.com/';

	async function loadGeometry(dFile){
		return new Promise((resolve, reject) => {
			json(dFile, (error, data) => {
				if (error) throw error;
				resolve(data)
			})
		})
	}
	let config = {
		'https://nbcchicago.com/':{
			'metro':'Chicago',
			'metroView':[[41.90855318755631, -88.51674914360048], 9],
			'factors':[factors['blood pressure']], 
			'dFile': dataDir + 'chi-topo-tracts.json'
		},
		'https://nbcnewyork.com/':{
			'metro':'New York',
			'metroView':[[40.962343848337824, -74.35934185981752], 9],
			'factors':[ factors.obesity, factors.exercise], 
			'dFile': dataDir + 'nyc-topo-tracts.json'
		}, 
		'https://nbcsandiego.com/':{
			'metro':'San Diego',
			'metroView':[[33.103522551465346, -118.02984595298769], 9],
			'factors':[factors.diabetes, factors.obesity], 
			'dFile': dataDir + 'sd-topo-tracts.json'
		},
		'https://nbcphiladelphia.com/':{
			'metro':'Philadelphia',
			'metroView':[[39.92527199411296, -75.42584717273714], 10],
			'factors':[factors.exercise, factors.obesity], 
			'dFile': dataDir + 'phi-topo-tracts.json'
		},
		'https://nbcboston.com/':{
			'metro':'Boston',
			'metroView':[[42.24971338268648, -71.49163126945497], 9],
			'factors':[factors.exercise, factors.obesity], 
			'dFile': dataDir + 'bos-topo-tracts.json'
		},
		'https://necn.com/':{
			'metro':'Boston',
			'metroView':[[42.24971338268648, -71.49163126945497], 9],
			'factors':[factors.exercise, factors.obesity], 
			'dFile': dataDir + 'bos-topo-tracts.json'
		},
		'https://nbcdfw.com/':{
			'metro':'Dallas Fort Worth',
			'metroView':[[32.944977220131506, -97.67591357231142], 9],
			'factors':[factors.exercise, factors.obesity], 
			'dFile': dataDir + 'dfw-topo-tracts.json'
		},
		'https://nbcbayarea.com/':{
			'metro':'Bay Area',
			'metroView':[[37.823548214439256, -122.95047640800477], 8],
			'factors':[factors.exercise, factors.obesity], 
			'dFile': dataDir + 'bay-topo-tracts.json'
		},
		'https://nbclosangeles.com/':{
			'metro':'Los Angeles',
			'metroView':[[34.168121042274116, -118.74389290809633], 9],
			'factors':[factors.exercise, factors.obesity], 
			'dFile': dataDir + 'la-topo-tracts.json'
		},
		'https://nbcmiami.com/':{
			'metro':'Miami',
			'metroView':[[26.284122869098, -80.37953853607179], 9],
			'factors':[factors.exercise, factors.obesity], 
			'dFile': dataDir + 'mia-topo-tracts.json'
		},
		'https://nbcwashington.com/':{
			'metro':'D.C.',
			'metroView':[[38.88374438136598, -77.21913993358613], 11],
			'factors':[factors.exercise, factors.obesity], 
			'dFile': dataDir + 'dc-topo-tracts.json'
		},
		'https://telemundohouston.com/':{
			'metro':'Houston',
			'metroView':[[29.81381015146583, -95.93068599700929], 9],
			'factors':[factors.exercise, factors.obesity], 
			'dFile': dataDir + 'hou-topo-tracts.json'
		},
		'https://nbcconnecticut.com/':{
			'metro':'Hartford',
			'metroView':[[29.81381015146583, -95.93068599700929], 9],
			'factors':[factors.exercise, factors.obesity], 
			'dFile': dataDir + 'har-topo-tracts.json'
		}
	}

	let geo = await loadGeometry(config[domain].dFile)
	draw(geo, config[domain]);
}

render();
//export default metadata;