'use strict'
var mapboxgl = require('mapbox-gl')
var turf = require('@turf/turf')
var geojsonExt = require('geojson-extent')


mapboxgl.accessToken = 'pk.eyJ1IjoicnNiYXVtYW5uIiwiYSI6IjdiOWEzZGIyMGNkOGY3NWQ4ZTBhN2Y5ZGU2Mzg2NDY2In0.jycgv7qwF8MMIWt4cT0RaQ';

var refo_nordic_layerList = ['refo-nordic-nightski', 'refo-nordic-maples', 'refo-nordic-oaks',
    'refo-nordic-birches', 'refo-nordic-labels', 'refo-features-label'
];

var refo_mtb_layerList = ['refo-mtb-redloop', 'refo-mtb-labels']

var barkhausen_nordic_layerList = ['bark-features-label', 'bark-nordic-labels', 'bark-nordic-shores',
    'bark-features-poly'
]

var layerList = refo_nordic_layerList.concat(refo_mtb_layerList).concat(barkhausen_nordic_layerList)

var current = 1

var userLocation = {
    "type": "FeatureCollection",
    "features": [{
        "type": "Feature",
        "properties": {},
        "geometry": {
            "type": "Point",
            "coordinates": []
        }
    }]
}

var centers = {
	'Barkhausen' : [-88.0345, 44.5985],
	'Reforestation Camp' : [-88.0813, 44.6667]
}

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/rsbaumann/ciwyfl6jk001j2qsdtfxkr1ny',
    center: centers["Reforestation Camp"],
    zoom: 13,
    hash: true
});

window.map = map

function updateUserLocation(map, sourceName, geojson) {
    if (!map.getSource(sourceName)) {
        map.addSource(sourceName, {
            type: 'geojson',
            data: geojson
        });

        map.addLayer({
            "id": 'user-location-point',
            "type": 'circle',
            "source": sourceName,
            "paint": {
                "circle-color": 'orange',
                "circle-stroke-width": 2,
                "circle-stroke-color": 'black',
                "circle-radius": {
                	stops: [[10, 3], [10, 10]]
                }
            }
        })
    } else {
        map.getSource(sourceName).setData(userLocation)
    }

    map.setZoom(14)

    var timer = window.setInterval(blinkUserIcon(), 100)
}

function addToggleOne() {
    var toggle = document.getElementById('mapToggle');

    toggle.addEventListener('change', function(e) {
        if (map.getLayoutProperty('mapbox-mapbox-satellite', 'visibility') === 'visible') {
            map.setLayoutProperty('mapbox-mapbox-satellite', 'visibility', 'none')
        } else {
            map.setLayoutProperty('mapbox-mapbox-satellite', 'visibility', 'visible')
        }
    });
}

function addToggleTwo() {

    var refoButton = document.getElementById('refo');
    var barkButton = document.getElementById('bark');
    refoButton.addEventListener('click', function() {
        map.setCenter(centers["Reforestation Camp"]);
        map.setZoom(14)
    });

    barkButton.addEventListener('click', function() {
        map.setCenter(centers["Barkhausen"])
        map.setZoom(14)
    });
}

function addToggleThree() {

    var nordicButton = document.getElementById('nordic');
    var mtbButton = document.getElementById('mtb');

    function changeLayersVisiblity(layers, visibility) {
    	for (var i=0; i < layers.length; i++) {
    		map.setLayoutProperty(layers[i], 'visibility', visibility)
    	}
    }

    nordicButton.addEventListener('click', function() {
        changeLayersVisiblity(barkhausen_nordic_layerList.concat(refo_nordic_layerList), 'visible');
        changeLayersVisiblity(refo_mtb_layerList, 'none')
    });

    mtbButton.addEventListener('click', function() {
        changeLayersVisiblity(barkhausen_nordic_layerList.concat(refo_nordic_layerList), 'none');
        changeLayersVisiblity(refo_mtb_layerList, 'visible')
    });
}

function blinkUserIcon() {

    if (current > 0.1) {
        var newval = (current - 0.1)
    } else {
        var newval = (current + 0.1)
    }
    console.log(newval)
    map.setPaintProperty('user-location-point', 'circle-opacity', newval)
}

map.on('load', function() {
    addToggleOne();
    addToggleTwo();
    addToggleThree();

    //var directions = require('./directions.js');

    var popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
    });
    var geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        },
        watchPosition: true
    });

    map.addControl(geolocate, 'top-left')

    map.addControl(new mapboxgl.ScaleControl({
        maxWidth: 200,
        unit: 'imperial'
    }));

    var nav = new mapboxgl.NavigationControl();
    map.addControl(nav, 'top-left');

    map.on('mousemove', function(e) {
        var features = map.queryRenderedFeatures(e.point, { layers: layerList });

        map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';

        if (!features.length) {
            popup.remove();
            return;
        }

        var feature = features[0];

        popup.setLngLat(map.unproject(e.point))
            .setHTML('<li> Trail: ' + feature.properties.name + '</li>' +
                '<li> Distance: ' + feature.properties.distance + '</li>')
            .addTo(map);
    });

    map.on('click', function(e) {
        var features = map.queryRenderedFeatures(e.point, { layers: layerList });

        map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';

        if (!features.length) {
            popup.remove();
            return;
        }
        var feat = features[0];
        var coords = feat.geometry.coordinates.forEach()
        var ls = turf.lineString(coords);
        console.log(ls)
        var bbox = geojsonExt(ls);
        map.fitBounds(bbox);
    });

    geolocate.on('geolocate', function(e) {
        var user_point = [e.coords.longitude, e.coords.latitude]
        userLocation.features[0].geometry.coordinates = user_point;
        updateUserLocation(map, 'user-location', userLocation);
    });
});
