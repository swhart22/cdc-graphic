//formula for creating a circle (polygon really) from topojson coordinates
//adapted for this project from mike bostock's shape tweening block:
//  https://bl.ocks.org/mbostock/3081153'
//modified to prioritize equdistance from radius vs length of original arc on shape
//gets rid of need for d3-projection import~!!

function circle(coordinates, cx, cy){
	var radius = 3;
	var circle = [],
	i = 0,
	n = coordinates.length;

	var centroid = [cx, cy],
		angleOffset = -Math.PI / 2, 
		angle,
		i = -1,
		k = 2 * Math.PI / n;

	while(++i < n){
		angle = angleOffset + i * k;
		circle.push([
			centroid[0] + radius * Math.cos(angle),
			centroid[1] + radius * Math.sin(angle)
		])
	}
	return circle;
}
export default circle;