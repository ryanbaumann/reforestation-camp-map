'use strict'

var infile = './oaks.geojson'
var outfile = 'oaks-elev-points.geojson'

var fs = require('fs');
var path = require('path');
var line = path.join(__dirname, infile);
var tilebelt = require('tilebelt');
var turfbbox = require('@turf/bbox');
var turfdistance = require('@turf/line-distance');
var turfalong = require('@turf/along');
var getPixels = require('get-pixels');

var index = 0;

var x;
var y;
var z = 20;
var course = {
    type: 'FeatureCollection',
    features: []
}

function getTile(line, here) {

    var tile = tilebelt.pointToTile(here[0], here[1], z);

    x = tile[0];
    y = tile[1];

    var terrain = 'https://api.mapbox.com/v4/mapbox.terrain-rgb/' + z + '/' + x + '/' + y + '.pngraw?access_token=pk.eyJ1IjoiZGFzdWxpdCIsImEiOiJjaXQzYmFjYmkwdWQ5MnBwZzEzZnNub2hhIn0.EDJ-lIfX2FnKhPw3nqHcqg';

    getPixels(terrain, function(error, pixels) {
        generate(line, pixels);
    });

};

function generate(line, pixels) {

    var length = turfdistance(line, 'miles');

    for (var i = index; i <= length; i = i + 0.05) {

        var along = turfalong(line, i, 'miles');

        var lon = along.geometry.coordinates[0];
        var lat = along.geometry.coordinates[1];

        var p = tilebelt.pointToTileFraction(lon, lat, z);

        if (Math.floor(p[0]) == x && Math.floor(p[1]) == y) {

            var px = Math.floor((p[0] - Math.floor(p[0])) * 255);
            var py = Math.floor((p[1] - Math.floor(p[1])) * 255);

            var R = pixels.get(px, py, 0);
            var G = pixels.get(px, py, 1);
            var B = pixels.get(px, py, 2);

            var height = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1);

            course.features.push({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [Math.round(lon*10000)/10000, Math.round(lat*10000)/10000]
                },
                properties: {
                    'e_ft': Math.round(height*100*3.28084)/100,
                    'd_mi': Math.round(i*100)/100
                }
            });

        } else if (Math.floor(p[0]) != x || Math.floor(p[1]) != y) {

            var here = [lon, lat];
            index = i;

            getTile(line, here);
            break;

        };

        if (i + 0.05 > length) {

            fs.writeFile(outfile, JSON.stringify(course));

        };

    };

};

fs.readFile(line, (err, data) => {

    if (err) throw err;

    var line = JSON.parse(data);
    var here = line.geometry.coordinates[0];

    getTile(line, here);

});