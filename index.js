'use strict'
var mapboxgl = require('mapbox-gl')
var turf = require('@turf/turf')
var geojsonExt = require('geojson-extent')


mapboxgl.accessToken = 'pk.eyJ1IjoicnNiYXVtYW5uIiwiYSI6IjdiOWEzZGIyMGNkOGY3NWQ4ZTBhN2Y5ZGU2Mzg2NDY2In0.jycgv7qwF8MMIWt4cT0RaQ';

var layerList = ['nordic-nightski', 'nordic-maples', 'nordic-oaks',
    'nordic-birches'
];

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

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/rsbaumann/ciwyfl6jk001j2qsdtfxkr1ny',
    center: [-88.078, 44.667],
    zoom: 11.15,
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
                "circle-stroke-width" : 2,
                "circle-stroke-color" : 'black',
                "circle-radius": 10
            }
        })
    } else {
        map.getSource(sourceName).setData(userLocation)
    }
}

function addToggle() {
        // Toggle UI 1
    var toggleContainer = document.createElement('div');
    toggleContainer.classList = 'pin-topright pad1';

    var toggle = document.createElement('div');
    toggle.classList = 'rounded-toggle dark inline';

    [{
        label: 'Trail',
        id: 'mapbox://styles/rsbaumann/ciwyfl6jk001j2qsdtfxkr1ny'
    }, {
        label: 'Satellite',
        id: 'mapbox://styles/mapbox/satellite-streets-v9'
    }].forEach(function(style, i) {
        var input = document.createElement('input');
        input.id = i;
        input.type = 'radio';
        input.name = 'toggle';
        input.value = style.id;
        if (i === 0) input.checked = true;
        var label = document.createElement('label');
        label.htmlFor = i;
        label.textContent = style.label;
        toggle.appendChild(input);
        toggle.appendChild(label);
    });

    toggle.addEventListener('change', function(e) {
        if (map.getLayoutProperty('mapbox-mapbox-satellite', 'visibility') === 'visible') {
            map.setLayoutProperty('mapbox-mapbox-satellite', 'visibility', 'none')
        } else {
            map.setLayoutProperty('mapbox-mapbox-satellite', 'visibility', 'visible')
        }
    });

    toggleContainer.appendChild(toggle);
map.getContainer().appendChild(toggleContainer);
}

map.on('load', function() {
    addToggle()

    //var directions = require('./directions.js');

    var popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
    });
    var geolocate = new mapboxgl.GeolocateControl({
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
