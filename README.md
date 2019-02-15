# 500 Cities Graphic: In Case of Update
This project uses webpack to bundle javascript, so the js that is pushed to data.nbcstations is basically unreadable (sorry I like my hot reloading during dev). 

To update it, you'll need to clone this repository, install dev dependencies and dependencies, run the graphic on a local server, make any tweaks, build the graphic, and then put the code onto the server. Here's step by step instrux: 

## Before you start

You will need node installed on your machine. In the command line you can run `node -v` and `npm -v` to see if each of these is installed. If not, [install them](https://www.npmjs.com/get-npm). 

## Step One: Clone and Install

Using the command line, navigate to wherever you want to clone this repo. Then run: 

```
git clone https://github.com/swhart22/cdc-graphic.git
```

The folder and a bunch of files should be wherever you cloned them into. Navigate into the folder: 

```
cd cdc-graphic
```

And then run: 

```
npm i
```

Hopefully that worked! It may take a few seconds. You will need to have your node proxy set, or be working on C3PO.

```
sudo npm config set proxy http://proxyanbcge.nbc.com:80
sudo npm config set proxy http://proxyanbcge.nbc.com:80 -g
```

If you got an error already try updating your node version! If that doesn't work, just text me and I can make any updates. If you did not get an error, continue!

## Step Two: Run a Local Server to Update and Test Graphic

In the `cdc-graphic` directory, you should be able to run

```
npm run start
```

and have a browser window open up with the graphic in it. If that doesn't happen, make sure you don't have anything running on `localhost:3000` and then try again.

At this phase, you can make changes to the javascript. Any javascript I'm using to power the graphic is in the `/src/js/` folder. This is the javascript that will be bundled into build mode.

The majority of this project's code is d3 and leaflet, and I admit the markup is not pretty. Most everything you would need to update will be in the `src/js/draw.js` file. Each phase of the graphic is written into an individual functions. These functions are called: 

```
twoTracts // displays the tracts with the highest and lowest values for whichever CDC factor we're concerned with
flyToHighest // flies the map to the tract with highest value
flyToLowest // flies the map to the tract with lowest value
preScatter // turns each of these tracts into a circle that goes onto the scatterplot, whose axes appear
scatter // shows the rest of the tracts on the scatterplot as circles
situate // displays base map and shrinks scatter into corner to prepare for tracts to transition from circles to geoshapes on map
geoPlace50 // transitions highest 50% of tracts onto map
geoPlace1000 // transitions the rest of tracts onto map
```

If you need to edit the graphic at any phase, look for the corresponding function. If you need to update the text, you can update it in the line of code that says

```
text.html(/*new html here*/)
```

Domain business is controlled in `/src/js/proj-config.js`. Crosstalk grabs the domain of the parent container of the graphic. The fallback is set to <https://nbcboston.com>.

CDC Factors are configured in the `src/js/factors.js` file. The only ones we have available at the moment are exercise, obesity, blood pressure, heart disease and diabetes. If you need to change the factor for Boston's map, update the first element in the 'factors' array in `src/js/proj-config.js` with the following format: `factors.exercise`, `factors.obesity`, `factors['blood pressure']`, `factors['mental health']`, or `factors['binge drinking']`.

All the CSS in the graphic is include in the `src/templates/index.html` file. This is the file that will compile into our build `index.html`.

## Step Three: Build and Deploy

Once all the changes are made to the graphic, quit the local server by running Ctrl C in the terminal window you have running it. Then, again in your `cdc-graphic` directory, run 

```
npm run build
```

This compiles all javascript and css etc. into a new folder it creates that is called `dist`. The contents of that folder are what you post to data.nbcstations.com. You should have in there an `index.html` file, an `app.bundle.js` file, a `data` directory with topojson files for each market, and a bunch of font files that I included for the use of fontawesome icons. 

If you did all of this successfully, I will be so proud of my template here. If no such luck, I need to work on my template to make it more portable. You can text me and I'll make changes. 






