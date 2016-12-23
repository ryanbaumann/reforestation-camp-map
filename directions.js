'use strict'
var MapboxDirections = require('@mapbox/mapbox-gl-directions');
var mapboxgl = require('mapbox-gl')

mapboxgl.accessToken = 'pk.eyJ1IjoicnNiYXVtYW5uIiwiYSI6IjdiOWEzZGIyMGNkOGY3NWQ4ZTBhN2Y5ZGU2Mzg2NDY2In0.jycgv7qwF8MMIWt4cT0RaQ';

// remove control
var button = document.body.appendChild(document.createElement('button'));
button.style = 'z-index:10;position:absolute;top:10px;right:10px;';
button.textContent = 'Remove directions control';

// remove all waypoints
var removeWaypointsButton = document.body.appendChild(document.createElement('button'));
removeWaypointsButton.style = 'z-index:10;position:absolute;top:30px;right:10px;';
removeWaypointsButton.textContent = 'Remove all waypoints';
var directions = new MapboxDirections({
    accessToken: mapboxgl.accessToken,
    unit: 'imperial',
    profile: 'driving'
})

button.addEventListener('click', function() {
    map.removeControl(directions);
});

removeWaypointsButton.addEventListener('click', function() {
    directions.removeRoutes();
});

map.addControl(directions, 'top-right');
window.directions = directions;
