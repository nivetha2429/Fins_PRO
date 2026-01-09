const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const Customer = require('../models/Customer');
const crypto = require('crypto');

/**
 * Device Management Routes
 * Handles device lifecycle: create, assign, remove, track
 */

// Get all devices with optional filters
router.get('/', async (req, res) => {
    try {
        const { state, platform, customerId } = req.query;
        const filter = {};

        if (state) filter.state = state;
        if (platform) filter.platform = platform;
        if (customerId) filter.assignedCustomerId = customerId;

        const devices = await Device.find(filter)
            .sort({ updatedAt: -1 })
            .lean();

        // Enrich with customer info
        const enrichedDevices = await Promise.all(devices.map(async (device) => {
            if (device.assignedCustomerId) {
                const customer = await Customer.findOne({ id: device.assignedCustomerId })
                    .select('name phoneNo photoUrl isLocked')
                    .lean();
                return { ...device, customer };
            }
            return device;
        }));

        // Filter out orphans (devices with assigned ID but no customer found)
        const validDevices = enrichedDevices.filter(device => {
            if (device.assignedCustomerId && !device.customer) return false;
            return true;
        });

        res.json(validDevices);
    } catch (err) {
        console.error('Error fetching devices:', err);
        res.status(500).json({ message: err.message });
    }
});

// Get device stats
router.get('/stats', async (req, res) => {
    try {
        const stats = await Device.aggregate([
            {
                $group: {
                    _id: '$state',
                    count: { $sum: 1 }
                }
            }
        ]);

        const result = {
            total: 0,
            PENDING: 0,
            ACTIVE: 0,
            LOCKED: 0,
            REMOVED: 0,
            UNASSIGNED: 0
        };

        stats.forEach(s => {
            result[s._id] = s.count;
            result.total += s.count;
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Maintenance: Cleanup orphans and removed devices
router.delete('/maintenance/orphans', async (req, res) => {
    try {
        // 1. Delete devices marked as REMOVED
        const removed = await Device.deleteMany({ state: 'REMOVED' });

        // 2. Delete orphans (devices pointing to non-existent customers)
        const assignedDevices = await Device.find({ assignedCustomerId: { $exists: true, $ne: null } });
        let orphansDeleted = 0;

        for (const device of assignedDevices) {
            const customer = await Customer.findOne({ id: device.assignedCustomerId });
            if (!customer) {
                await Device.deleteOne({ _id: device._id });
                orphansDeleted++;
            }
        }

        console.log(`🧹 Cleanup: ${removed.deletedCount} removed, ${orphansDeleted} orphans deleted`);

        res.json({
            success: true,
            message: 'Cleanup complete',
            removedDeleted: removed.deletedCount,
            orphansDeleted
        });
    } catch (err) {
        console.error('Cleanup error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Get single device
router.get('/:id', async (req, res) => {
    try {
        const device = await Device.findOne({ deviceId: req.params.id }).lean();
        if (!device) {
            return res.status(404).json({ message: 'Device not found' });
        }

        // Get customer if assigned
        if (device.assignedCustomerId) {
            device.customer = await Customer.findOne({ id: device.assignedCustomerId }).lean();
        }

        res.json(device);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Hard Delete Device
router.delete('/:id', async (req, res) => {
    try {
        const device = await Device.findOne({ deviceId: req.params.id });
        if (!device) return res.status(404).json({ message: 'Device not found' });

        // Update customer if assigned
        if (device.assignedCustomerId) {
            await Customer.findOneAndUpdate({ id: device.assignedCustomerId }, {
                $set: {
                    'deviceStatus.status': 'removed',
                    'deviceStatus.errorMessage': 'Device deleted by admin'
                }
            });
        }

        await Device.deleteOne({ deviceId: req.params.id });
        res.json({ success: true, message: 'Device permanently deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Register/Update device (called by mobile app)
router.post('/register', async (req, res) => {
    try {
        const {
            deviceId, platform, brand, model, osVersion, sdkLevel, serialNumber,
            imei1, imei2, androidId,
            sim1, sim2, isDualSim, simOperator, simIccid,
            networkType, networkOperator, isConnected,
            batteryLevel, isCharging,
            totalStorage, availableStorage,
            location,
            enrollmentToken, customerId
        } = req.body;

        if (!deviceId) {
            return res.status(400).json({ message: 'deviceId is required' });
        }

        // Find existing or create new
        let device = await Device.findOne({ deviceId });

        if (device) {
            // Update existing device with all new data
            device.brand = brand || device.brand;
            device.model = model || device.model;
            device.osVersion = osVersion || device.osVersion;
            device.sdkLevel = sdkLevel || device.sdkLevel;
            device.serialNumber = serialNumber || device.serialNumber;
            device.imei1 = imei1 || device.imei1;
            device.imei2 = imei2 || device.imei2;
            device.androidId = androidId || device.androidId;

            // SIM info
            if (sim1) device.sim1 = sim1;
            if (sim2) device.sim2 = sim2;
            device.isDualSim = isDualSim ?? device.isDualSim;
            device.simOperator = simOperator || device.simOperator;
            device.simIccid = simIccid || device.simIccid;

            // Network
            device.networkType = networkType || device.networkType;
            device.networkOperator = networkOperator || device.networkOperator;
            device.isConnected = isConnected ?? true;

            // Battery
            if (batteryLevel !== undefined) device.batteryLevel = batteryLevel;
            if (isCharging !== undefined) device.isCharging = isCharging;

            // Storage
            device.totalStorage = totalStorage || device.totalStorage;
            device.availableStorage = availableStorage || device.availableStorage;

            // Location
            if (location) {
                device.lastLocation = {
                    lat: location.lat,
                    lng: location.lng,
                    accuracy: location.accuracy,
                    timestamp: new Date()
                };
            }

            device.lastSeenAt = new Date();

            // If device was PENDING and now reporting, mark as ACTIVE
            if (device.state === 'PENDING') {
                device.state = 'ACTIVE';
                device.stateHistory.push({
                    state: 'ACTIVE',
                    reason: 'Device enrolled successfully',
                    changedAt: new Date()
                });
            }

            await device.save();
            console.log(`📱 Device updated: ${deviceId}`);
        } else {
            // Create new device with all data
            device = new Device({
                deviceId,
                platform: platform || 'android',
                brand,
                model,
                osVersion,
                sdkLevel,
                serialNumber,
                imei1,
                imei2,
                androidId,
                sim1,
                sim2,
                isDualSim,
                simOperator,
                simIccid,
                networkType,
                networkOperator,
                isConnected: isConnected ?? true,
                batteryLevel,
                isCharging,
                totalStorage,
                availableStorage,
                lastLocation: location ? {
                    lat: location.lat,
                    lng: location.lng,
                    accuracy: location.accuracy,
                    timestamp: new Date()
                } : undefined,
                state: customerId ? 'ACTIVE' : 'UNASSIGNED',
                assignedCustomerId: customerId || null,
                lastSeenAt: new Date(),
                stateHistory: [{
                    state: customerId ? 'ACTIVE' : 'UNASSIGNED',
                    reason: 'Device registered',
                    changedAt: new Date()
                }]
            });

            await device.save();
            console.log(`📱 New device registered: ${deviceId}`);
        }

        // Also update customer if provided
        if (customerId) {
            await Customer.findOneAndUpdate(
                { id: customerId },
                {
                    $set: {
                        'deviceStatus.status': 'connected',
                        'deviceStatus.lastSeen': new Date(),
                        'deviceStatus.technical.brand': brand,
                        'deviceStatus.technical.model': model,
                        'deviceStatus.technical.osVersion': osVersion,
                        'deviceStatus.technical.androidId': androidId,
                        'deviceStatus.technical.imei1': imei1,
                        'deviceStatus.technical.imei2': imei2,
                        'deviceStatus.technical.batteryLevel': batteryLevel,
                        'deviceStatus.technical.networkType': networkType
                    }
                }
            );
        }

        res.json({ success: true, device });
    } catch (err) {
        console.error('Device registration error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Assign device to customer
router.post('/:id/assign', async (req, res) => {
    try {
        const { customerId } = req.body;

        if (!customerId) {
            return res.status(400).json({ message: 'customerId is required' });
        }

        const device = await Device.findOne({ deviceId: req.params.id });
        if (!device) {
            return res.status(404).json({ message: 'Device not found' });
        }

        // Check if device can be assigned
        if (device.state === 'REMOVED') {
            return res.status(400).json({
                message: 'Cannot assign removed device. Generate new QR.'
            });
        }

        // Update device
        device.assignedCustomerId = customerId;
        device.state = 'ACTIVE';
        device.stateHistory.push({
            state: 'ACTIVE',
            reason: `Assigned to customer ${customerId}`,
            changedAt: new Date()
        });

        await device.save();

        console.log(`📱 Device ${req.params.id} assigned to customer ${customerId}`);

        res.json({ success: true, device });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Remove device from customer (soft delete - keeps customer data)
router.post('/:id/remove', async (req, res) => {
    try {
        const { reason, adminId } = req.body;

        const device = await Device.findOne({ deviceId: req.params.id });
        if (!device) {
            return res.status(404).json({ message: 'Device not found' });
        }

        const oldCustomerId = device.assignedCustomerId;

        // Update device state - KEEP assignedCustomerId for audit trail
        device.state = 'REMOVED';
        // device.assignedCustomerId = null; // REMOVED: Keep for history
        device.removedAt = new Date();
        device.removalReason = reason || 'Removed by admin';
        device.stateHistory.push({
            state: 'REMOVED',
            reason: reason || 'Removed by admin',
            changedBy: adminId,
            changedAt: new Date(),
            previousCustomerId: oldCustomerId // Store for reference
        });

        await device.save();

        // Update customer status but DO NOT DELETE customer
        if (oldCustomerId) {
            await Customer.findOneAndUpdate(
                { id: oldCustomerId },
                {
                    $set: {
                        'deviceStatus.status': 'removed',
                        'deviceStatus.errorMessage': 'Device removed from this customer'
                    },
                    $push: {
                        lockHistory: {
                            id: Date.now().toString(),
                            action: 'device_removed',
                            reason: reason || 'Removed by admin',
                            timestamp: new Date().toISOString()
                        }
                    }
                }
            );
        }

        console.log(`📱 Device ${req.params.id} removed (customer ${oldCustomerId} data preserved)`);

        res.json({
            success: true,
            message: 'Device removed successfully. Customer data preserved.',
            device
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Lock device
router.post('/:id/lock', async (req, res) => {
    try {
        const { reason, adminId } = req.body;

        const device = await Device.findOne({ deviceId: req.params.id });
        if (!device) {
            return res.status(404).json({ message: 'Device not found' });
        }

        device.state = 'LOCKED';
        device.stateHistory.push({
            state: 'LOCKED',
            reason: reason || 'EMI overdue',
            changedBy: adminId,
            changedAt: new Date()
        });

        await device.save();

        // Also update customer
        if (device.assignedCustomerId) {
            await Customer.findOneAndUpdate(
                { id: device.assignedCustomerId },
                {
                    $set: { isLocked: true },
                    $push: {
                        lockHistory: {
                            id: Date.now().toString(),
                            action: 'locked',
                            reason: reason || 'EMI overdue',
                            timestamp: new Date().toISOString()
                        }
                    }
                }
            );
        }

        res.json({ success: true, device });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Unlock device
router.post('/:id/unlock', async (req, res) => {
    try {
        const { reason, adminId } = req.body;

        const device = await Device.findOne({ deviceId: req.params.id });
        if (!device) {
            return res.status(404).json({ message: 'Device not found' });
        }

        device.state = 'ACTIVE';
        device.stateHistory.push({
            state: 'ACTIVE',
            reason: reason || 'Unlocked by admin',
            changedBy: adminId,
            changedAt: new Date()
        });

        await device.save();

        // Also update customer
        if (device.assignedCustomerId) {
            await Customer.findOneAndUpdate(
                { id: device.assignedCustomerId },
                {
                    $set: { isLocked: false },
                    $push: {
                        lockHistory: {
                            id: Date.now().toString(),
                            action: 'unlocked',
                            reason: reason || 'Unlocked by admin',
                            timestamp: new Date().toISOString()
                        }
                    }
                }
            );
        }

        res.json({ success: true, device });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Generate enrollment QR
router.post('/generate-qr', async (req, res) => {
    try {
        const { customerId, enrollmentType, platform } = req.body;

        // Validate enrollment type
        const validTypes = ['ANDROID_NEW', 'ANDROID_EXISTING', 'IOS'];
        if (!validTypes.includes(enrollmentType)) {
            return res.status(400).json({
                message: 'Invalid enrollmentType. Must be ANDROID_NEW, ANDROID_EXISTING, or IOS'
            });
        }

        // Generate unique token
        const enrollmentToken = crypto.randomBytes(16).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create pending device entry
        const tempDeviceId = `PENDING_${enrollmentToken.substring(0, 8)}`;

        const device = new Device({
            deviceId: tempDeviceId,
            platform: platform || (enrollmentType === 'IOS' ? 'ios' : 'android'),
            state: 'PENDING',
            assignedCustomerId: customerId || null,
            enrollmentType,
            enrollmentToken,
            enrollmentTokenExpiresAt: expiresAt,
            stateHistory: [{
                state: 'PENDING',
                reason: 'QR generated for enrollment',
                changedAt: new Date()
            }]
        });

        await device.save();

        // Build QR payload based on type
        const serverUrl = process.env.SERVER_URL || 'https://emi-pro-app.fly.dev';
        let qrPayload = {};

        switch (enrollmentType) {
            case 'ANDROID_NEW':
                // Full Device Owner provisioning QR
                qrPayload = {
                    "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME":
                        "com.securefinance.emilock/.DeviceAdminReceiver",
                    "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION":
                        `${serverUrl}/downloads/securefinance-admin.apk`,
                    "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
                        "customerId": customerId || "",
                        "serverUrl": serverUrl,
                        "enrollmentToken": enrollmentToken
                    }
                };
                break;

            case 'ANDROID_EXISTING':
                // Simple enrollment QR (app already installed or manual install)
                qrPayload = {
                    "type": "ANDROID_EXISTING",
                    "customerId": customerId || "",
                    "serverUrl": serverUrl,
                    "enrollmentToken": enrollmentToken,
                    "apkUrl": `${serverUrl}/downloads/securefinance-admin.apk`
                };
                break;

            case 'IOS':
                // iOS enrollment QR
                qrPayload = {
                    "type": "IOS",
                    "customerId": customerId || "",
                    "serverUrl": serverUrl,
                    "enrollmentToken": enrollmentToken,
                    "appStoreUrl": "https://apps.apple.com/app/your-app-id" // Placeholder
                };
                break;
        }

        console.log(`📱 QR generated for ${enrollmentType}: ${tempDeviceId}`);

        res.json({
            success: true,
            deviceId: tempDeviceId,
            enrollmentToken,
            enrollmentType,
            expiresAt,
            qrPayload,
            qrString: JSON.stringify(qrPayload)
        });

    } catch (err) {
        console.error('QR generation error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Validate enrollment token (called by mobile app)
router.post('/validate-token', async (req, res) => {
    try {
        const { enrollmentToken, actualDeviceId } = req.body;

        const device = await Device.findOne({
            enrollmentToken,
            state: 'PENDING'
        });

        if (!device) {
            return res.status(404).json({
                valid: false,
                message: 'Invalid or expired enrollment token'
            });
        }

        if (device.enrollmentTokenExpiresAt < new Date()) {
            return res.status(400).json({
                valid: false,
                message: 'Enrollment token expired'
            });
        }

        // Update device with actual device ID
        if (actualDeviceId && device.deviceId.startsWith('PENDING_')) {
            device.deviceId = actualDeviceId;
        }

        device.state = 'ACTIVE';
        device.enrollmentToken = null; // Clear token after use
        device.stateHistory.push({
            state: 'ACTIVE',
            reason: 'Token validated and device enrolled',
            changedAt: new Date()
        });

        await device.save();

        res.json({
            valid: true,
            customerId: device.assignedCustomerId,
            device
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
