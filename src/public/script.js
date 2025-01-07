let popup = L.popup();
let geoJsonData = {};
let map = L.map('map').setView([50.079420697915396, 14.451504480493412], 13);
let dialog = document.getElementById("addGinkgoDialog");
let inputLat = document.getElementById("inputLat");
let inputLng = document.getElementById("inputLng");

let leafIcon = L.icon({
    iconUrl: 'icons/ginkgo-orange.svg',
    shadowUrl: 'icons/ginkgo-shadow.png',

    iconSize:     [30, 30], // size of the icon
    shadowSize:   [30, 30], // size of the shadow
    iconAnchor:   [15, 30], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 30],  // the same for the shadow
    popupAnchor:  [0, -20] // point from which the popup should open relative to the iconAnchor
});

function addNewGinkgo(lat, lng) {
    dialog.style.display = "block";
    inputLat.value = lat.toString();
    inputLng.value = lng.toString();
}

window.onclick = function(event) {
    if (event.target == dialog) {
        dialog.style.display = "none";
    }
} 

function onMapClick(e) {
    let popupContent = `<h3>Do you want to add new Ginkgo?</h3>
                        <input type="button" class="add-button center" role="button" onclick="addNewGinkgo(${e.latlng.lat}, ${e.latlng.lng})" value="Yes"/>`;
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
            let popupContent = `<h3>Ginkgo tree</h3>
                                <p>Found by ${feature.properties.nickname}</p> 
                                <p>${feature.properties.comment}</p>`;
            if (feature.properties.image) {
                popupContent += `<img src="${feature.properties.image}" alt="${feature.properties.title}" style="width:100px;">`;
            }
            layer.bindPopup(popupContent);
        }
    }).addTo(map);
}

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Fetch GeoJSON data from the file
fetch('/api/data')
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
