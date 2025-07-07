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

function getTreePopupAdd(lat, lng) {
    return `<h3>Want to add new Ginkgo?</h3>
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
    let popupContent = getTreePopupAdd(e.latlng.lat, e.latlng.lng);
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

// Show dialog on /?success
checkAndShowRequestSuccessDialog();
