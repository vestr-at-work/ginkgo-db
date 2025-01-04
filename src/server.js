import 'fake-indexeddb/auto';
import LightningFS from '@isomorphic-git/lightning-fs';
import * as git from 'isomorphic-git';
import * as http from 'isomorphic-git/http/node/index.js';

import express from 'express';
import path from 'path';

const app = express();
const PORT = 3000;
const ADDRESS = '192.168.0.105';

const fs = new LightningFS('fs');
const pfs = fs.promises;
const dir = '/repo';

await pfs.mkdir(dir);

await git.clone({
    fs,
    http,
    dir,
    url: 'https://github.com/vestr-at-work/ginkgo-db.git',
    ref: 'main',
    singleBranch: true,
    depth: 1,
});

let out = await pfs.readdir(dir);
console.log(out);

app.use(express.urlencoded({ extended: true }));

// Serve static files (e.g., index.html)
app.use(express.static('public'));

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
    const filePath = path.join(dir, fileName);

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
