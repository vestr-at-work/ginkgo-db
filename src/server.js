const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ADDRESS = '192.168.0.105';

// Middleware to parse URL-encoded form data
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (e.g., index.html)
app.use(express.static('public'));

// Ensure the 'data' directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Handle POST request to /request-new
app.post('/request-new', (req, res) => {
    // Extract and sanitize data
    const lat = parseFloat(req.body.lat);
    const lng = parseFloat(req.body.lng);
    const nick = req.body.nick ? req.body.nick.trim() : 'Anonymous';
    const comment = req.body.comment ? req.body.comment.trim() : 'No comment provided';

    // Basic validation
    if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).send('Invalid latitude or longitude');
    }

    // Convert to GeoJSON Point Feature
    const geoJsonFeature = {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [lng, lat], // GeoJSON uses [longitude, latitude] format
        },
        properties: {
            nickname: nick,
            comment: comment,
        },
    };

    console.log('New GeoJSON Point Feature:', JSON.stringify(geoJsonFeature, null, 2));

    const timestamp = Date.now();
    const fileName = `${timestamp}.json`;
    const filePath = path.join(dataDir, fileName);

    // Save the GeoJSON feature to the file
    fs.writeFile(filePath, JSON.stringify(geoJsonFeature, null, 2), (err) => {
        if (err) {
            console.error('Error saving file:', err);
            return res.status(500).send('Error saving data');
        }

        console.log(`GeoJSON data saved to ${filePath}`);
        // Redirect to the main site after success
        res.redirect('/');
    });
});

app.listen(PORT, ADDRESS, () => {
    console.log(`Server running at http://${ADDRESS}:${PORT}/`);
});
