'use strict'
var mapboxgl = require('mapbox-gl')

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
                "circle-color": 'black',
                "circle-radius": 10
            }
        })
    } else {
        map.getSource(sourceName).setData(userLocation)
    }
}

map.on('load', function() {
    //var directions = require('./directions.js');

    var popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
    });
    var geolocate = new mapboxgl.GeolocateControl({
        watchPosition: true
    });

    map.addControl(geolocate, 'top-right')

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
            .setHTML(feature.properties.name)
            .addTo(map);
    });

    geolocate.on('geolocate', function(e) {
        var user_point = [e.coords.longitude, e.coords.latitude]
        console.log(user_point);
        userLocation.features[0].geometry.coordinates = user_point;
        console.log(userLocation);
        updateUserLocation(map, 'user-location', userLocation);
    });
});
