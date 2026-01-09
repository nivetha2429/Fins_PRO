const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { getApkChecksum } = require('../utils/checksum');

// GET /api/provisioning/payload/:customerId
router.get('/payload/:customerId', (req, res) => {
    try {
        const { customerId } = req.params;
        const { wifiSsid, wifiPassword } = req.query; // Accept Wi-Fi credentials for Samsung Knox

        // 🎯 DYNAMIC: Use current host to support both Local and Production testing
        const protocol = req.protocol;
        const host = req.get('host');
        const isNetworkIp = host.startsWith('192.168.') || host.startsWith('10.');

        // If running on localhost, use local IP. Otherwise prefer Env var or default to Render
        const baseUrl = isNetworkIp ? `${protocol}://${host}` : (process.env.PROVISIONING_BASE_URL || 'https://fins-pro.onrender.com');

        // 🎯 ADMIN APK - OEM-Grade Device Owner (Pure Java)
        const apkVersion = '3.1.0';
        const apkFileName = `admin-v${apkVersion}.apk`;
        const downloadUrl = `${baseUrl}/apk/admin/${apkFileName}`;

        const apkPath = path.join(__dirname, '../public/apk/admin', apkFileName);
        let checksum = '';

        try {
            if (fs.existsSync(apkPath)) {
                // Fallback: Certificate SHA-256 in URL-Safe Base64 with Padding
                // Replacing '+' with '-' to avoid QR code encoding issues
                checksum = 'e9ygQ56DS5kfesc05x2VUg6JifBkE9w8-5PBqrBnEm4=';
                console.log(`✅ Using certificate checksum: ${checksum}`);
            } else {
                // Fallback: Certificate SHA-256 in HEX (Samsung Knox requirement)
                // This is the signing certificate fingerprint, NOT the APK file checksum
                // Format: UPPERCASE HEX, no colons
                checksum = '7BDCA0439E834B991F7AC734E71D95520E8989F06413DC3CFB93C1AAB067126E';
                console.warn(`⚠️ APK missing on disk, using fallback checksum: ${checksum}`);
            }
        } catch (e) {
            console.error("Checksum calc failed", e);
            checksum = 'e9ygQ56DS5kfesc05x2VUg6JifBkE9w8-5PBqrBnEm4=';
        }

        console.log(`📦 APK Download URL: ${downloadUrl}`);

        // Construct Android Enterprise Provisioning Payload (SAMSUNG-SAFE)
        const payload = {
            "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME":
                "com.securefinance.emilock.admin/com.securefinance.emilock.admin.AdminReceiver",

            "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_NAME":
                "com.securefinance.emilock.admin",

            "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION":
                downloadUrl,

            "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM":
                checksum,

            "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": true,

            // Wi-Fi credentials (Samsung SetupWizard requirement)
            ...(wifiSsid && {
                "android.app.extra.PROVISIONING_WIFI_SSID": wifiSsid,
                "android.app.extra.PROVISIONING_WIFI_PASSWORD": wifiPassword || "",
                "android.app.extra.PROVISIONING_WIFI_SECURITY_TYPE": "WPA"
            }),

            // Admin extras bundle
            "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
                "customerId": customerId,
                "serverUrl": baseUrl
            }
        };

        res.json(payload);

    } catch (err) {
        console.error("❌ Provisioning Error:", err);

        res.status(500).json({
            error: "Failed to generate provisioning payload",
            details: err.message,
            hint: "Checksum calculation failed."
        });
    }
});

module.exports = router;

// POST /api/provisioning/status/:customerId - Update provisioning progress
router.post('/status/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;
        const { stage, status, message } = req.body;

        const Customer = require('../models/Customer');
        const customer = await Customer.findOne({ customerId });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Add new provisioning stage
        customer.provisioningStages = customer.provisioningStages || [];
        customer.provisioningStages.push({
            stage,
            status,
            message: message || '',
            timestamp: new Date()
        });

        // Update device status based on stage
        if (stage === 'DPC_INSTALLED') {
            customer.deviceStatus.status = 'ADMIN_INSTALLED';
        } else if (stage === 'PROVISIONING_COMPLETE') {
            customer.deviceStatus.status = 'connected';
        }

        await customer.save();

        console.log(`✅ Provisioning status updated: ${customerId} - ${stage} (${status})`);
        res.json({ success: true, stage, status });

    } catch (err) {
        console.error('❌ Provisioning status update error:', err);
        res.status(500).json({ error: 'Failed to update provisioning status' });
    }
});
