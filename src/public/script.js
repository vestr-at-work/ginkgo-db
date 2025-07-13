let popup = L.popup();
let geoJsonData = {};
let map = L.map('map').setView([50.079420697915396, 14.451504480493412], 13);
let addGinkgoDialog = document.getElementById("addGinkgoDialog");
let ginkgoSuccesfullyAddedDialog = document.getElementById("ginkgoSuccesfullyAddedDialog");
let ginkgoSuccesfullyAddedDialogButton = document.getElementById("ginkgoSuccesfullyAddedDialogButton");
let inputLat = document.getElementById("inputLat");
let inputLng = document.getElementById("inputLng");

let leafIcon = L.icon({
    iconUrl: 'icons/ginkgo-orange.svg',
    //shadowUrl: 'icons/ginkgo-shadow.png',

    iconSize:     [30, 30], // size of the icon
    shadowSize:   [30, 30], // size of the shadow
    iconAnchor:   [15, 30], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 30],  // the same for the shadow
    popupAnchor:  [0, -20] // point from which the popup should open relative to the iconAnchor
});

const userIcon = L.divIcon({
    className: 'user-location-icon',
    html: '<div class="gps-dot"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

function addNewGinkgo(lat, lng) {
    addGinkgoDialog.style.display = "block";
    inputLat.value = lat.toString();
    inputLng.value = lng.toString();
}

window.onclick = function(event) {
    if (event.target == addGinkgoDialog || event.target == ginkgoSuccesfullyAddedDialog) {
        addGinkgoDialog.style.display = "none";
        ginkgoSuccesfullyAddedDialog.style.display = "none";
    }
}

function checkAndShowRequestSuccessDialog() {
    if (new URL(window.location).searchParams.has('success')) {
        ginkgoSuccesfullyAddedDialog.style.display = "block";
    }
    else {
        ginkgoSuccesfullyAddedDialog.style.display = "none";
    }
}

ginkgoSuccesfullyAddedDialogButton.onclick = function() {
    ginkgoSuccesfullyAddedDialog.style.display = "none";
}

function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

function getTreePopupAdd(lat, lng, onUserPos) {
    let title = "";
    if (onUserPos) {
        title = "Add new Ginkgo on your position?"
    } else {
        title = "Add new Ginkgo?"
    }

    return `<h3>${title}</h3>
            <input type="button" id="buttonAddTree" class="dialog-button center" role="button" onclick="addNewGinkgo(${lat}, ${lng})" value="Yes"/>`
}

function getTreePopup(properties) {
    let result = `<h3 class="no-top-margin">${capitalizeFirstLetter(properties.size)} Ginkgo Tree</h3>
                <div id="tree-pupup-content-container">`;

    if (properties.comment !== "") {
       result += `<div>${properties.comment}</div>`;
    }

    result += `<div>Found by <bold>${properties.nickname}</bold> on ${properties.timestamp}</div>`;

    result += "</div>";
    return result;
}

function onMapClick(e) {
    let popupContent = getTreePopupAdd(e.latlng.lat, e.latlng.lng, false);
    popup
        .setLatLng(e.latlng)
        .setContent(popupContent)
        .openOn(map);
}

function addDataToMap(data, map) {
    L.geoJSON(data, {
        pointToLayer: (feature, latlng) => {
            // Use custom icon for each point
            return L.marker(latlng, { icon: leafIcon });
        },
        onEachFeature: (feature, layer) => {
            let popupContent = getTreePopup(feature.properties);
            layer.bindPopup(popupContent);
        }
    }).addTo(map);
}

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 22,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Fetch GeoJSON data from the file
fetch('api/data')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        geoJsonData = data;
        addDataToMap(geoJsonData, map);
    })
    .catch(error => {
        console.error('Error loading GeoJSON:', error);
    });

map.on('click', onMapClick);

let watchId = null;
let userMarker = null;
let isTracking = false;
let hasAutoCenteredOnce = false;

// Start watching user's location
function startTracking() {
    if (isTracking) return;

    watchId = navigator.geolocation.watchPosition(
        function (e) {
            const latlng = [e.coords.latitude, e.coords.longitude];

            // Add or update marker
            if (!userMarker) {
                let popupContent = getTreePopupAdd(latlng[0], latlng[1], true);
                userMarker = L.marker(latlng, { icon: userIcon }).addTo(map)
                    .bindPopup(popupContent);
            } else {
                userMarker.setLatLng(latlng);
            }

            // Center only once
            if (!hasAutoCenteredOnce) {
                map.setView(latlng);
                hasAutoCenteredOnce = true;
            }
        },
        function (err) {
            alert("Error getting location: " + err.message);
        },
        {
            enableHighAccuracy: true
        }
    );

    isTracking = true;
    updateGpsButtonState(true);
}

// Stop watching user's location
function stopTracking() {
    if (!isTracking) return;

    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }

    isTracking = false;
    hasAutoCenteredOnce = false;
    updateGpsButtonState(false);
}

// Toggle tracking
function toggleTracking() {
    if (isTracking) {
        stopTracking();
    } else {
        startTracking();
    }
}

// Add Leaflet GPS toggle button
const GpsToggleControl = L.Control.extend({
    options: {
        position: 'topright'
    },

    onAdd: function (map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom map-button active');
        container.id = 'gpsToggleButton';
        container.innerHTML = '📡';
        container.title = 'Toggle GPS Tracking';

        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        container.onclick = function () {
            toggleTracking();
        };

        return container;
    }
});

// Update button appearance
function updateGpsButtonState(active) {
    const button = document.getElementById('gpsToggleButton');
    if (!button) return;

    if (active) {
        button.classList.add('active');
        button.innerHTML = '📡'; // active icon
    } else {
        button.classList.remove('active');
        button.innerHTML = '📍'; // inactive icon
    }
}

// Add the toggle control to map
map.addControl(new GpsToggleControl());
startTracking();

// Show dialog on /?success
checkAndShowRequestSuccessDialog();
