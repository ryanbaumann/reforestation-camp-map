'use strict'

var tilebelt = require('tilebelt');
var turfbbox = require('@turf/bbox');
var turfdistance = require('@turf/line-distance');
var turfalong = require('@turf/along');
var getPixels = require('get-pixels');

//Features queried from the map source
var geojson_feature = {
    type: 'FeatureCollection',
    features: []
}

//Gloals for Terrain RGB terrain getting
var x, y, i, here;
var index = 0;
var z = 20;
var act_id = 0;
var course = {
    type: 'FeatureCollection',
    features: []
};

// Functions for querying elevation from Terrain RGB
function getTile(line, here) {
    var tile = tilebelt.pointToTile(here[0], here[1], z);
    x = tile[0];
    y = tile[1];

    if ((x > 0) && (y > 0)) {
        var terrain = 'https://api.mapbox.com/v4/mapbox.terrain-rgb/' + z + '/' + x + '/' + y + '.pngraw?access_token=pk.eyJ1IjoicnNiYXVtYW5uIiwiYSI6IjdiOWEzZGIyMGNkOGY3NWQ4ZTBhN2Y5ZGU2Mzg2NDY2In0.jycgv7qwF8MMIWt4cT0RaQ';
        getPixels(terrain, function(error, pixels) {
            try {
                generate(line, pixels, here);
            } catch (e) {
                window.alert('that route has an issue, try another?')
                console.log(e)
                loading.style.visibility = 'hidden';
                return
            }
        });
    } else {
        window.alert('that route has an issue, try another?')
        loading.style.visibility = 'hidden';
        return
    }
};

function generate(line, pixels) {

    var length = turfdistance(line.features[0], 'miles');
    for (i = index; i <= length; i += 0.01) {
        var along = turfalong(line.features[0], i, 'miles');
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
                    type: 'Polygon',
                    coordinates: [
                        [
                            [lon, lat],
                            [lon, lat + .00025],
                            [lon - .00025, lat + .00025],
                            [lon - .00025, lat],
                            [lon, lat]
                        ]
                    ]
                },
                properties: {
                    'e': height * 3.28084
                }
            });

        } else if (Math.floor(p[0]) != x || Math.floor(p[1]) != y) {
            here = [lon, lat];
            index = i;
            getTile(line, here);
            break;

        };

        if (i + 0.01 > length) {
            console.log(course)

            // Add the source to the map

            if (!map.getSource('ride-elev')) {
                map.addSource('ride-elev', {
                    'type': 'geojson',
                    'data': course,
                    'buffer': 0.1
                });
            } else {
                map.removeLayer('ride-elev')
                map.removeSource('ride-elev')
                map.addSource('ride-elev', {
                    'type': 'geojson',
                    'data': course,
                    'buffer': 0.1
                });

            }

            map.addLayer({
                'id': 'ride-elev',
                'type': 'fill-extrusion',
                'source': 'ride-elev',
                'minzoom': 10,
                'paint': {
                    'fill-extrusion-height': {
                        'property': 'e',
                        'type': 'exponential',
                        'stops': [
                            [630, 0],
                            [700, 500]
                        ]
                    },
                    'fill-extrusion-opacity': 0.8,
                    'fill-extrusion-color': 'yellow'
                }
            }, 'waterway-label');
        }
    }
    loading.style.visibility = 'hidden'
}

module.exports = function getElevation(feature) {
    // Reset the course and index variables for querying new data
    loading.style.visibility = 'visible'

    geojson_feature = {
        "type": "FeatureCollection",
        "features": []
    };
    course = {
        type: 'FeatureCollection',
        features: []
    }
    index = 0

    var f = feature

    if (!!f.geometry) {
        geojson_feature.features.push({
            "type": "Feature",
            "geometry": f.geometry,
            "properties": f.properties
        });
    } else {
        return }

    try {
        var here = geojson_feature.features[0].geometry.coordinates[0];
    } catch (e) {
        window.alert('Select a line feature first!')
    }
    try {
        getTile(geojson_feature, here);
    } catch (e) {
        window.alert('that route didnt quite work...try another? ' + e)
        loading.style.visibility = 'hidden'
    }
};
