'use strict'

var mapboxgl = require('mapbox-gl');
var $ = require('jQuery');
var path = require('path');
var style_file = path.join(__dirname, 'json/style.json');

// disable scroll if it's embedded in a blog post
if (window.location.search.indexOf('embed') !== -1) {
    map.scrollZoom.disable();
};

mapboxgl.accessToken = 'pk.eyJ1IjoicnNiYXVtYW5uIiwiYSI6IjdiOWEzZGIyMGNkOGY3NWQ4ZTBhN2Y5ZGU2Mzg2NDY2In0.jycgv7qwF8MMIWt4cT0RaQ';

var refo_nordic_layerList = ['refo-nordic-nightski', 'refo-nordic-maples', 'refo-nordic-oaks',
    'refo-nordic-birches', 'refo-nordic-labels', 'refo-features-label', 'refo-boundary-poly', 'refo-features-poly'
];

var refo_mtb_layerList = ['refo-mtb-greenloop', 'refo-mtb-labels', 'refo-features-label', 'refo-mtb-snowbike', 'refo-boundary-poly', 'refo-features-poly']

var barkhausen_nordic_layerList = ['bark-features-label', 'bark-nordic-labels', 'bark-nordic-shores',
    'bark-features-poly', 'bark-nordic-meadowridge', 'bark-nordic-mosquitocreek', 'bark-ponds-poly'
]

var style_layers = []; //list of layers in trail map to add to style

mapboxgl.util.getJSON('/json/layer_styles.json', function(err, resp) {

    if (err) throw err;

    var styles = resp.layers.forEach(function(layer) {
        style_layers.push(layer)
    });
    initMap();
});

var layerList = refo_nordic_layerList.concat(refo_mtb_layerList).concat(barkhausen_nordic_layerList);

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
    'Barkhausen': [-88.0345, 44.5985],
    'Reforestation Camp': [-88.0813, 44.6667]
}

var mapStyles = ['mapbox://styles/rsbaumann/cixalvwub00192qqoiskvmo2j?optimize=true',
    'mapbox://styles/mapbox/satellite-streets-v9?optimize=true'
]

var map = new mapboxgl.Map({
    container: 'map',
    style: mapStyles[0],
    center: centers["Reforestation Camp"],
    zoom: 13,
    hash: true
});

window.map = map;
window.loading = document.getElementById('loading');

// mobile menu toggle
$(".show-more").click(function() {
    $(".session").toggle();
    $("#title").show();
    $(".session.style").hide();

    // toggle show-less and show-more
    $(".mobile-btn").toggle();

    $("#sidebar").css('height', '50vh');
    $("#map").css('height', 'calc(100% - 50vh');
    $("#map").css('top', '50vh');
});
$(".show-less").click(function() {
    $(".session").toggle();
    $("#title").show();
    $(".session.style").hide();

    // toggle show-less and show-more
    $(".mobile-btn").toggle();
    $("#sidebar").css('height', '16vh');
    $("#map").css('height', 'calc(100% - 16vh');
    $("#map").css('top', '16vh');
});

var popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
});
var geolocate = new mapboxgl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    },
    watchPosition: true
});
var scale = new mapboxgl.ScaleControl({
    maxWidth: 150,
    unit: 'imperial'
})
var nav = new mapboxgl.NavigationControl();

map.addControl(scale, 'bottom-left');
map.addControl(nav, 'top-left');
map.addControl(geolocate, 'top-right');

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
                    stops: [
                        [8, 3],
                        [16, 10]
                    ]
                }
            }
        })
    } else {
        map.getSource(sourceName).setData(userLocation)
    }

    map.setZoom(13)

    // Annimate the icon to show user location is live
    var move_negative = true;

    var timer = window.setInterval(function() {
        // check the increment direction
        if (current <= 0.2 && move_negative) {
            move_negative = false;
        } else if (current >= 0.9 && !move_negative) {
            move_negative = true;
        }

        if (current > 0.2 && move_negative) {
            var newval = (current - 0.1)
        }

        if (current < 0.9 && !move_negative) {
            var newval = (current + 0.1)
        }
        current = newval
        map.setPaintProperty('user-location-point', 'circle-opacity', newval)
    }, 150)
}

function addToggleOne() {
    var trail = document.getElementById('trail');
    var satellite = document.getElementById('satellite');

    trail.addEventListener('click', function() {
        map.setStyle(mapStyles[0])
    });

    satellite.addEventListener('click', function() {
        map.setStyle(mapStyles[1])
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
    });
}

function addToggleThree() {

    var nordicButton = document.getElementById('nordic');
    var mtbButton = document.getElementById('mtb');

    function changeLayersVisiblity(layers, visibility) {
        for (var i = 0; i < layers.length; i++) {
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

function checkLoaded() {
    var timer = window.setInterval(function() {
        if (map.loaded) {
            loading.style.visibility = 'hidden';
            window.clearInterval(timer);
        }
    }, 200)
}

function initMap() {
    map.on('style.load', function() {
        checkLoaded();

        map.addSource('trails', {
            type: 'vector',
            url: 'mapbox://rsbaumann.ciwzjxgn901b22zprhs188fk5-4maem'
        });

        style_layers.forEach(function(layer) {
            map.addLayer(layer, 'waterway-label')
        });

        //Add togle event listeners
        addToggleOne();
        addToggleTwo();
        addToggleThree();

        //Add geolocate control

        map.on('mousemove', function(e) {
            var features = map.queryRenderedFeatures(e.point, { layers: layerList });

            map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';

            if (!features.length) {
                popup.remove();
                return;
            }

            var feature = features[0];
            var id = feature.properties.id

            popup.setLngLat(map.unproject(e.point))
                .setHTML('<li> Trail: ' + feature.properties.name + '</li>' +
                    '<li> Distance: ' + feature.properties.distance + '</li>')
                .addTo(map);

            map.on('click', function(e) {
                /*var getElev = require('./js/elevation-query');
                var features = map.queryRenderedFeatures(e.point, { layers: layerList });
                getElev(features[0])*/
                map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';

                if (!features.length) {
                    popup.remove();
                    return;
                }
            });

            geolocate.on('geolocate', function(e) {
                var user_point = [e.coords.longitude, e.coords.latitude]
                userLocation.features[0].geometry.coordinates = user_point;
                updateUserLocation(map, 'user-location', userLocation);
            });
        });
    });
}
