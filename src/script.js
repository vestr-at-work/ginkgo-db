var popup = L.popup();


function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(map);
}

var map = L.map('map').setView([50.079420697915396, 14.451504480493412], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var marker = L.marker([50.079420697915396, 14.451504480493412]).addTo(map);
marker.bindPopup("<b>UUUU!</b><br>Ginkgo here!.").openPopup();

map.on('click', onMapClick);
