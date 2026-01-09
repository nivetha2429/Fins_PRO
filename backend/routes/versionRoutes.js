const express = require('express');
const router = express.Router();

// Admin APK version endpoint
router.get('/admin-version', (req, res) => {
    res.json({
        version: '1.0.0', // Update this when you release a new APK
        downloadUrl: 'https://emi-pro-app.fly.dev/staff/EMI-Admin-Dashboard-v2.1.2.apk',
        releaseNotes: 'Initial release with full web dashboard',
        minSupportedVersion: '1.0.0',
        forceUpdate: false
    });
});

// version.json endpoint (matches /api/version)
router.get('/version', (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        // Navigate up from routes/ -> backend/ -> public/downloads
        const versionPath = path.join(__dirname, '../public/downloads/version.json');

        if (fs.existsSync(versionPath)) {
            const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
            res.json(versionData);
        } else {
            res.json({
                apk: 'securefinance-admin-v2.0.5.apk',
                type: 'admin',
                version: '2.0.5'
            });
        }
    } catch (e) {
        console.error('Failed to read version info', e);
        res.status(500).json({ error: 'Failed to read version info' });
    }
});

module.exports = router;
