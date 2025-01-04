import 'fake-indexeddb/auto';
import LightningFS from '@isomorphic-git/lightning-fs';
import * as git from 'isomorphic-git';
import * as http from 'isomorphic-git/http/node/index.js';

import express from 'express';
import path from 'path';
import asyncHandler from 'express-async-handler';

const app = express();
const PORT = 3000;
// const ADDRESS = '192.168.0.105';
const ADDRESS = '10.128.5.151';

const fs = new LightningFS('fs');
const pfs = fs.promises;
const dir = '/repo';
const DATA_DIR = `${dir}/src/data`;

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

await pfs.readdir(dir);

app.use(express.urlencoded({ extended: true }));
// Serve static files (e.g., index.html)
app.use(express.static('public'));
app.use(express.json());

let treeGeoData = await collectGeoData();

async function collectGeoData() {
    try {
        const files = await pfs.readdir(DATA_DIR);
        const features = [];

        for (const file of files) {
            const filePath = path.join(DATA_DIR, file);
            try {
                const fileContent = await pfs.readFile(filePath, 'utf8');
                const geoJson = JSON.parse(fileContent);

                // Check if the file contains a valid GeoJSON Point feature
                if (
                    geoJson.type === 'Feature' &&
                    geoJson.geometry?.type === 'Point' &&
                    Array.isArray(geoJson.geometry.coordinates)
                ) {
                    features.push(geoJson);
                }
            } catch (err) {
                console.error(`Error reading or parsing file ${file}:`, err);
            }
        }
        
        const featureCollection = {
            type: 'FeatureCollection',
            features,
        };

        return featureCollection;

    } catch (err) {
        console.error('Error retrieving data:', err);
    }
}

// Handle POST request to /request-new
app.post('/request-new', asyncHandler(async (req, res) => {
    // Extract and sanitize data
    const lat = parseFloat(req.body.lat);
    const lng = parseFloat(req.body.lng);
    const nick = req.body.nick ? req.body.nick.trim() : 'Anonymous';
    const comment = req.body.comment ? req.body.comment.trim() : 'No comment provided';

    if (nick.length > 30 && comment.length > 161) {
        return res.status(400).send('Nick or Comment too long');
    }

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
    const filePath = path.join(`src/requested-data/`, fileName);

    // Save the GeoJSON feature to the file in repo
    await pfs.writeFile(`${dir}/${filePath}`, JSON.stringify(geoJsonFeature, null, 2));
    // Add and commit the change
    await git.add({fs, dir, filepath: filePath});
    await git.commit({
        fs,
        dir,
        message: `Add new Ginko with stamp ${timestamp}`,
        author: {
          name: 'ginkgo-adder',
          email: 'ginkgo-adder@example.org'
        }
    });

    let pushResult = await git.push({
        fs,
        http,
        dir,
        remote: 'origin',
        ref: 'main',
        onAuth: () => ({
            username: process.env.AUTH_ID,
            password: process.env.AUTH_TOKEN, 
        }),
    });

    console.log(pushResult);

    // Redirect to the main site after success
    res.redirect('/');
}));

app.get('/data', (req, res) => {
    res.json(treeGeoData);
});

app.listen(PORT, ADDRESS, () => {
    console.log(`Server running at http://${ADDRESS}:${PORT}/`);
});
