const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Device = require('../models/Device');
const logger = require('../config/logger');
const auth = require('../middleware/auth');
const checkDeviceLimit = require('../middleware/checkDeviceLimit');

// Get all customers (filtered by dealer)
router.get('/', auth, async (req, res) => {
    try {
        // Build filter based on role
        const filter = req.user.role === 'SUPER_ADMIN'
            ? {}
            : { dealerId: req.user._id };

        // Return newest customers first
        const customers = await Customer.find(filter)
            .populate('dealerId', 'name email')
            .sort({ createdAt: -1 })
            .lean();
        res.json(customers);
    } catch (err) {
        logger.error('Error fetching customers', { error: err.message });
        res.status(500).json({ message: err.message });
    }
});

// Delete all customers (Reset Data)
router.delete('/danger/delete-all', async (req, res) => {
    try {
        await Customer.deleteMany({});
        res.json({ message: 'All customer data cleared successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single customer status (Public for Device Heartbeat)
router.get('/:id', async (req, res) => {
    try {
        const customer = await Customer.findOne({ id: req.params.id });
        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        res.json({
            id: customer.id,
            isLocked: customer.isLocked,
            lockMessage: customer.lockMessage,
            supportPhone: customer.supportPhone,
            deviceStatus: customer.deviceStatus
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new customer with duplicate check
router.post('/', auth, checkDeviceLimit, async (req, res) => {
    try {
        const customerData = req.body;

        // Auto-assign dealerId from authenticated user
        customerData.dealerId = req.user._id;

        // Check if IMEI already exists - UPDATE instead of rejecting
        const existing = await Customer.findOne({ imei1: customerData.imei1 });
        if (existing) {
            // Update existing customer
            const updatedCustomer = await Customer.findOneAndUpdate(
                { imei1: customerData.imei1 },
                { $set: customerData },
                { new: true }
            );
            logger.info('Customer updated', { customerId: updatedCustomer.id, name: updatedCustomer.name });
            return res.status(200).json(updatedCustomer);
        }

        const customer = new Customer(customerData);
        const newCustomer = await customer.save();

        logger.logSystemEvent('CUSTOMER_CREATED', {
            customerId: newCustomer.id,
            dealerId: req.user._id,
            createdBy: req.user._id,
            deviceStats: req.deviceStats
        });

        res.status(201).json(newCustomer);
    } catch (err) {
        if (err.code === 11000) {
            res.status(409).json({ message: 'Duplicate data: a device with this IMEI or ID already exists.' });
        } else {
            res.status(400).json({ message: err.message });
        }
    }
});

// Update a customer
router.patch('/:id', auth, async (req, res) => {
    try {
        // Build filter with ownership check
        const filter = { id: req.params.id };
        if (req.user.role !== 'SUPER_ADMIN') {
            filter.dealerId = req.user._id;
        }

        const customer = await Customer.findOneAndUpdate(filter, req.body, { new: true });
        if (!customer) return res.status(404).json({ message: 'Customer not found or access denied' });

        logger.info('Customer updated', { customerId: customer.id, updatedBy: req.user._id });
        res.json(customer);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a customer
router.delete('/:id', auth, async (req, res) => {
    try {
        // Build filter with ownership check
        const filter = { id: req.params.id };
        if (req.user.role !== 'SUPER_ADMIN') {
            filter.dealerId = req.user._id;
        }

        const customer = await Customer.findOneAndDelete(filter);
        if (!customer) return res.status(404).json({ message: 'Customer not found or access denied' });

        // Cascade delete associated devices to prevent orphans
        await Device.deleteMany({ assignedCustomerId: req.params.id });

        logger.logSystemEvent('CUSTOMER_DELETED', {
            customerId: req.params.id,
            deletedBy: req.user._id
        });

        res.json({ message: 'Customer and associated devices deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Bulk update customers (optional, useful for resetting mock data to DB)
router.post('/bulk', async (req, res) => {
    try {
        await Customer.deleteMany({});
        const customers = await Customer.insertMany(req.body);
        res.status(201).json(customers);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update device status (called by mobile device during provisioning)
// Update device status (called by mobile device during provisioning)
router.post('/:id/status', async (req, res) => {
    try {
        const { status, installProgress, errorMessage, step, actualBrand, model, androidVersion, androidId } = req.body;

        const updateData = {
            'deviceStatus.status': status || 'installing',
            'deviceStatus.lastStatusUpdate': new Date(),
            'deviceStatus.lastSeen': new Date()
        };

        if (actualBrand) {
            updateData['deviceStatus.technical.brand'] = actualBrand;
            updateData.brand = actualBrand;
        }
        if (model) {
            updateData['deviceStatus.technical.model'] = model;
            updateData.modelName = model;
        }
        if (androidVersion) updateData['deviceStatus.technical.osVersion'] = androidVersion;
        if (androidId) updateData['deviceStatus.technical.androidId'] = androidId;

        if (installProgress !== undefined) {
            updateData['deviceStatus.installProgress'] = installProgress;
        }

        if (errorMessage) {
            updateData['deviceStatus.errorMessage'] = errorMessage;
        }

        // Handle specific onboarding step updates
        if (step || status === 'ADMIN_INSTALLED') {
            const steps = updateData['deviceStatus.steps'] || {};

            if (step === 'qr_scanned' || status === 'ADMIN_INSTALLED') updateData['deviceStatus.steps.qrScanned'] = true;
            if (step === 'installed' || status === 'ADMIN_INSTALLED') updateData['deviceStatus.steps.appInstalled'] = true;
            if (step === 'launched' || status === 'ADMIN_INSTALLED') updateData['deviceStatus.steps.appLaunched'] = true;
            if (step === 'permissions' || status === 'ADMIN_INSTALLED') updateData['deviceStatus.steps.permissionsGranted'] = true;
            if (step === 'details' || status === 'ADMIN_INSTALLED') updateData['deviceStatus.steps.detailsFetched'] = true;
            if (step === 'deviceBound' || status === 'ADMIN_INSTALLED') {
                updateData['deviceStatus.steps.qrScanned'] = true;
                updateData['deviceStatus.steps.appInstalled'] = true;
                updateData['deviceStatus.steps.appLaunched'] = true;
                updateData['deviceStatus.steps.permissionsGranted'] = true;
                updateData['deviceStatus.steps.detailsFetched'] = true;
                updateData['deviceStatus.steps.imeiVerified'] = true;
                updateData['deviceStatus.steps.deviceBound'] = true;
            }
        }

        const customer = await Customer.findOneAndUpdate(
            { id: req.params.id },
            updateData,
            { new: true }
        );

        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        res.json(customer);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Verify device details (IMEI, SIM) and sync offline tokens
router.post('/:id/verify', async (req, res) => {
    try {
        const { actualIMEI, simDetails, modelDetails } = req.body;
        const customer = await Customer.findOne({ id: req.params.id });

        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        // Update technical details
        if (modelDetails) customer.mobileModel = modelDetails;
        if (simDetails) {
            // SIM Change Detection Logic
            if (customer.simDetails && customer.simDetails.serialNumber) {
                // Check if SIM changed (compare ICCID/Serial)
                if (simDetails.serialNumber && simDetails.serialNumber !== customer.simDetails.serialNumber) {
                    console.warn(`SIM Change Detected for ${customer.name}: ${customer.simDetails.serialNumber} -> ${simDetails.serialNumber}`);

                    // Log to History
                    customer.simChangeHistory.push({
                        serialNumber: simDetails.serialNumber,
                        operator: simDetails.operator,
                        detectedAt: new Date(),
                        ipAddress: req.ip
                    });

                    // Flag Status
                    status = 'SIM_MISMATCH';
                    message = 'Unauthorized SIM Card Detected';
                    customer.deviceStatus.errorMessage = message;
                    customer.deviceStatus.status = 'error';

                    // OPTIONAL: Auto-Lock on SIM Change
                    // customer.isLocked = true; 
                    // customer.lockHistory.push({
                    //    id: Date.now().toString(),
                    //    action: 'locked',
                    //    reason: 'SIM Change Detected',
                    //    timestamp: new Date().toISOString()
                    // });
                }
            }
            customer.simDetails = simDetails; // Update to latest
        }

        // Generate Token if missing (for Offline Lock)
        if (!customer.offlineLockToken) {
            customer.offlineLockToken = Math.floor(100000 + Math.random() * 900000).toString();
        }

        // 🎯 IMEI/ANDROID ID VERIFICATION LOGIC (Android 10+ Compatible)
        let status = 'VERIFIED';
        let message = 'Device Verified';

        // Mark details step as done
        customer.deviceStatus.steps.detailsFetched = true;

        if (actualIMEI) {
            // Store the reported device ID (could be IMEI or Android ID)
            customer.deviceStatus.technical.androidId = actualIMEI;

            // 🔍 FLEXIBLE MATCHING: Accept EITHER real IMEI OR Android ID
            const expectedIMEI1 = customer.imei1?.trim();
            const expectedIMEI2 = customer.imei2?.trim();
            const reportedID = actualIMEI.trim();

            // Check if reported ID matches ANY of: imei1, imei2, or previously stored androidId
            const isMatch =
                reportedID === expectedIMEI1 ||
                reportedID === expectedIMEI2 ||
                (customer.deviceStatus.technical.androidId && reportedID === customer.deviceStatus.technical.androidId);

            if (!isMatch && expectedIMEI1) {
                // Only flag mismatch if we have an expected IMEI AND it doesn't match
                status = 'MISMATCH';
                message = `Device ID Mismatch! Expected IMEI: ${expectedIMEI1}, Device Reports: ${reportedID}`;

                console.warn(`⚠️ Device ID mismatch for ${customer.name}:`);
                console.warn(`   Expected IMEI: ${expectedIMEI1}`);
                console.warn(`   Reported ID: ${reportedID}`);
                console.warn(`   Note: Android 10+ devices report Android ID instead of IMEI`);

                customer.deviceStatus.errorMessage = message;
                customer.deviceStatus.status = 'warning'; // Changed from 'error' to 'warning'
                customer.deviceStatus.steps.imeiVerified = false;
            } else {
                // ✅ MATCH FOUND or no expected IMEI (auto-accept)
                customer.deviceStatus.status = 'connected';
                customer.deviceStatus.errorMessage = null;
                customer.deviceStatus.steps.imeiVerified = true;
                customer.deviceStatus.steps.deviceBound = true;

                console.log(`✅ Device verified for ${customer.name}:`);
                console.log(`   Reported ID: ${reportedID}`);
                if (reportedID === expectedIMEI1) {
                    console.log(`   Matched: Real IMEI (imei1)`);
                } else if (reportedID === expectedIMEI2) {
                    console.log(`   Matched: Real IMEI (imei2)`);
                } else {
                    console.log(`   Matched: Android ID (stored from previous verification)`);
                }
            }
        } else {
            // No device ID provided - accept anyway
            customer.deviceStatus.status = 'connected';
            customer.deviceStatus.steps.imeiVerified = true;
            customer.deviceStatus.steps.deviceBound = true;
        }

        customer.deviceStatus.lastSeen = new Date();
        customer.markModified('deviceStatus.steps');
        customer.markModified('deviceStatus.technical');

        await customer.save();

        res.json({
            status,
            message,
            offlineLockToken: customer.offlineLockToken
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Heartbeat endpoint - User App sends status every few seconds
router.post('/heartbeat', async (req, res) => {
    try {
        const { deviceId, customerId, status, appInstalled, lastSeen, location, version, technical, battery, batteryLevel, sim } = req.body;
        const currentBattery = battery ?? batteryLevel;

        const updateData = {
            'deviceStatus.status': status || 'active',
            'deviceStatus.lastSeen': new Date(lastSeen || Date.now()),
            isEnrolled: appInstalled !== false
        };

        if (location) {
            updateData['deviceStatus.lastLocation'] = {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                timestamp: location.timestamp || new Date()
            };
            updateData['location.lat'] = location.latitude || location.lat;
            updateData['location.lng'] = location.longitude || location.lng;
            updateData['location.lastUpdated'] = new Date();
        }

        if (currentBattery !== undefined && currentBattery !== null) {
            updateData['deviceStatus.batteryLevel'] = currentBattery;
            updateData['deviceFeatures.batteryLevel'] = currentBattery;
            updateData['deviceFeatures.lastUpdated'] = new Date();
        }
        if (version) updateData['deviceStatus.appVersion'] = version;

        // Save Technical Details
        if (technical) {
            if (technical.brand) {
                updateData['deviceStatus.technical.brand'] = technical.brand;
                updateData.brand = technical.brand;
            }
            if (technical.model) {
                updateData['deviceStatus.technical.model'] = technical.model;
                updateData.modelName = technical.model;
                updateData.mobileModel = technical.model;
            }
            if (technical.deviceName) {
                updateData['deviceStatus.technical.deviceName'] = technical.deviceName;
                updateData.deviceName = technical.deviceName;
            }
            if (technical.totalMemory) updateData['deviceStatus.technical.totalMemory'] = technical.totalMemory;
            if (technical.totalStorage) updateData['deviceStatus.technical.totalStorage'] = technical.totalStorage;
            if (technical.availableStorage) updateData['deviceStatus.technical.availableStorage'] = technical.availableStorage;
            if (technical.osVersion) updateData['deviceStatus.technical.osVersion'] = technical.osVersion;
            if (technical.sdkLevel) updateData['deviceStatus.technical.sdkLevel'] = technical.sdkLevel;
            if (technical.androidId) updateData['deviceStatus.technical.androidId'] = technical.androidId;
            if (technical.serial) updateData['deviceStatus.technical.serial'] = technical.serial;
        }

        // Save SIM Details
        if (sim) {
            if (sim.operator) updateData['simDetails.operator'] = sim.operator;
            if (sim.phoneNumber) updateData['simDetails.phoneNumber'] = sim.phoneNumber;
            if (sim.iccid) updateData['simDetails.serialNumber'] = sim.iccid;
        }

        // Mark all steps as complete if app is installed and running
        if (appInstalled) {
            updateData['deviceStatus.steps.appInstalled'] = true;
            updateData['deviceStatus.steps.appLaunched'] = true;
            updateData['deviceStatus.steps.permissionsGranted'] = true;
            updateData['deviceStatus.steps.detailsFetched'] = true;
            updateData['deviceStatus.steps.imeiVerified'] = true;
            updateData['deviceStatus.steps.deviceBound'] = true;
        }

        // 🎯 FLEXIBLE MATCHING: Find customer by customerId, IMEI, or Android ID
        const updateOps = { $set: updateData };
        if (location) {
            updateOps.$push = {
                'deviceStatus.locationHistory': {
                    $each: [{
                        latitude: location.latitude || location.lat,
                        longitude: location.longitude || location.lng,
                        timestamp: location.timestamp || new Date()
                    }],
                    $slice: -50
                }
            };
        }

        const customer = await Customer.findOneAndUpdate(
            {
                $or: [
                    { id: customerId },
                    { imei1: deviceId },
                    { imei2: deviceId },
                    { 'deviceStatus.technical.androidId': deviceId }
                ]
            },
            updateOps,
            { new: true }
        );

        if (!customer) {
            console.warn(`⚠️ Heartbeat: Device not found - customerId: ${customerId}, deviceId: ${deviceId}`);
            return res.status(404).json({ message: 'Device not found' });
        }

        // CHECK IF DEVICE IS REMOVED (Admin Unenrollment)
        if (customer.deviceStatus.status === 'removed' || customer.deviceStatus.status === 'REMOVED') {
            return res.json({
                ok: true,
                status: 'REMOVE',
                isLocked: false,
                command: 'remove'
            });
        }

        // CHECK FOR UPDATES (Auto-Update Logic)
        let updateStatus = customer.deviceStatus.status;
        let apkUrl = null;

        try {
            const path = require('path');
            const fs = require('fs');
            // Check Server Version vs Device Version
            const versionPath = path.join(__dirname, '../../backend/public/downloads/version.json');
            if (fs.existsSync(versionPath)) {
                const serverVersionData = require(versionPath);
                // Simple string comparison for now. Ideally use semantic versioning.
                // If device version is lower than server version, trigger update.
                if (version && serverVersionData.version && serverVersionData.version > version) {
                    logger.logDeviceEvent('UPDATE_AVAILABLE', customer.id, customer.id, {
                        customerName: customer.name,
                        currentVersion: version,
                        newVersion: serverVersionData.version
                    });
                    updateStatus = 'UPDATE';
                    apkUrl = `https://emi-pro-app.fly.dev/downloads/${serverVersionData.apk}`;
                }
            }
        } catch (vErr) {
            logger.error('Version check failed', { error: vErr.message });
        }

        // Check for pending commands
        let pendingCommand = null;
        let commandParams = null;

        if (customer.remoteCommand && customer.remoteCommand.command) {
            pendingCommand = customer.remoteCommand.command;
            commandParams = customer.remoteCommand.params || {};
            console.log(`📤 Sending command to device: ${pendingCommand}`, commandParams);
            // Clear once sent to device
            await Customer.updateOne({ _id: customer._id }, { $unset: { remoteCommand: "" } });
        }

        res.json({
            ok: true,
            status: updateStatus,
            apkUrl: apkUrl, // Send URL if update needed
            isLocked: customer.isLocked, // ✅ Return lock status
            command: pendingCommand,
            // Command parameters for actions like setWallpaper, setPin
            wallpaperUrl: commandParams?.wallpaperUrl || null,
            pin: commandParams?.pin || null,
            lockMessage: commandParams?.message || customer.lockMessage || null,
            supportPhone: commandParams?.phone || customer.supportPhone || null,
            // Additional device control data
            lockInfo: {
                message: customer.lockMessage || "This device has been locked due to payment overdue.",
                phone: customer.supportPhone || "8876655444"
            }
        });
    } catch (err) {
        console.error('Heartbeat error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Set remote command for a device
// Supported commands: lock, unlock, wipe, reset, setWallpaper, setPin, alarm, stopAlarm, setLockInfo
router.post('/:id/command', async (req, res) => {
    try {
        const { command, params } = req.body;

        // Build filter with ownership check
        const filter = { id: req.params.id };
        if (req.user && req.user.role !== 'SUPER_ADMIN') {
            filter.dealerId = req.user._id;
        }

        const customer = await Customer.findOne(filter);
        if (!customer) return res.status(404).json({ message: 'Customer not found or access denied' });

        // Valid commands list - 'remove' marks device as removed but KEEPS customer data
        const validCommands = [
            'lock', 'unlock', 'wipe', 'reset',
            'setWallpaper', 'setPin', 'alarm', 'stopAlarm',
            'setLockInfo', 'grantPermissions', 'applyRestrictions',
            'remove' // Marks device as removed, preserves customer data
        ];

        if (!validCommands.includes(command)) {
            return res.status(400).json({
                message: 'Invalid command',
                validCommands
            });
        }

        const updateData = {
            remoteCommand: {
                command,
                params: params || {},
                timestamp: new Date()
            }
        };

        // Update high-level state based on command
        if (command === 'lock') {
            updateData.isLocked = true;

            // Add lock history entry
            updateData.lockHistoryEntry = {
                id: Date.now().toString(),
                action: 'locked',
                reason: params?.reason || 'Remote lock by admin',
                timestamp: new Date().toISOString()
            };

            // Log critical event
            logger.logDeviceEvent('DEVICE_LOCKED', customer.id, customer.id, {
                customerName: customer.name,
                reason: params?.reason || 'Remote lock by admin'
            });

            // 🔥 CRITICAL: Send FCM push to instantly lock device (bypasses ColorOS throttling)
            if (customer.deviceStatus?.fcmToken) {
                const fcmService = require('../services/fcmService');
                fcmService.sendLockCommand(customer.deviceStatus.fcmToken, customer.id)
                    .catch(err => logger.error('FCM lock command failed', { customerId: customer.id, error: err.message }));
            }
        }

        if (command === 'unlock') {
            updateData.isLocked = false;

            // Add unlock history entry
            updateData.lockHistoryEntry = {
                id: Date.now().toString(),
                action: 'unlocked',
                reason: params?.reason || 'Remote unlock by admin',
                timestamp: new Date().toISOString()
            };

            // Log critical event
            logger.logDeviceEvent('DEVICE_UNLOCKED', customer.id, customer.id, {
                customerName: customer.name,
                reason: params?.reason || 'Remote unlock by admin'
            });

            // 🔥 Send FCM push to instantly unlock device
            if (customer.deviceStatus?.fcmToken) {
                const fcmService = require('../services/fcmService');
                fcmService.sendUnlockCommand(customer.deviceStatus.fcmToken, customer.id)
                    .catch(err => logger.error('FCM unlock command failed', { customerId: customer.id, error: err.message }));
            }
        }

        // Handle 'remove' command - marks device as removed but KEEPS customer data
        if (command === 'remove') {
            updateData['deviceStatus.status'] = 'removed';
            updateData['deviceStatus.errorMessage'] = 'Device removed by admin';

            // Add to lock history
            updateData.lockHistoryEntry = {
                id: Date.now().toString(),
                action: 'device_removed',
                reason: params?.reason || 'Removed by admin',
                timestamp: new Date().toISOString()
            };

            // ALSO UPDATE DEVICE MODEL
            // Find any device assigned to this customer and mark as REMOVED
            const device = await Device.findOne({ assignedCustomerId: req.params.id, state: { $ne: 'REMOVED' } });
            if (device) {
                device.state = 'REMOVED';
                device.removedAt = new Date();
                device.removalReason = params?.reason || 'Removed via Dashboard';
                device.stateHistory.push({
                    state: 'REMOVED',
                    reason: 'Removed via Dashboard (Customer Action)',
                    changedAt: new Date()
                });
                await device.save();

                // Log critical event
                logger.logDeviceEvent('DEVICE_REMOVED', device.deviceId, req.params.id, {
                    customerName: customer.name,
                    reason: params?.reason || 'Removed via Dashboard'
                });
            }

            console.log(`🗑️ Device ${req.params.id} marked as REMOVED (customer data preserved)`);
        }

        // Handle setLockInfo - update the lock message and support phone
        if (command === 'setLockInfo' && params) {
            if (params.message) updateData.lockMessage = params.message;
            if (params.phone) updateData.supportPhone = params.phone;
        }

        // Build update operations
        const updateOps = { $set: updateData };

        // Add lock history entry if it exists
        if (updateData.lockHistoryEntry) {
            updateOps.$push = { lockHistory: updateData.lockHistoryEntry };
            delete updateData.lockHistoryEntry; // Remove from $set to avoid duplication
        }

        // Update customer with new command
        const updatedCustomer = await Customer.findOneAndUpdate(
            filter,
            updateOps,
            { new: true }
        );

        if (!updatedCustomer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Check if device is offline (hasn't been seen in >5 minutes)
        const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000;
        const lastSeen = updatedCustomer.deviceStatus?.lastSeen;
        const isOffline = !lastSeen || (new Date() - new Date(lastSeen)) > OFFLINE_THRESHOLD_MS;

        logger.info('Remote command queued', {
            customerId: updatedCustomer.id,
            command,
            isOffline,
            lastSeen: lastSeen ? new Date(lastSeen).toISOString() : 'never'
        });

        res.json({
            success: true,
            message: `Command '${command}' queued successfully`,
            customer: updatedCustomer,
            deviceStatus: {
                isOnline: !isOffline,
                lastSeen: lastSeen ? new Date(lastSeen).toISOString() : null,
                hasFcmToken: !!updatedCustomer.deviceStatus?.fcmToken
            },
            warning: isOffline
                ? 'Device is currently offline. Command will be delivered when device comes online.'
                : null
        });
    } catch (err) {
        console.error('Command error:', err);
        res.status(500).json({ message: err.message });
    }
});

// SIM Change Report - Device reports SIM card change
router.post('/:id/sim-change', async (req, res) => {
    try {
        const { originalIccid, newIccid, newOperator, timestamp } = req.body;

        console.log(`🚨 SIM CHANGE REPORTED for ${req.params.id}`);
        console.log(`   Original ICCID: ${originalIccid}`);
        console.log(`   New ICCID: ${newIccid}`);
        console.log(`   New Operator: ${newOperator}`);

        const updateData = {
            $push: {
                simChangeHistory: {
                    serialNumber: newIccid,
                    operator: newOperator,
                    detectedAt: new Date(timestamp || Date.now()),
                    ipAddress: req.ip
                },
                lockHistory: {
                    id: Date.now().toString(),
                    action: 'locked',
                    reason: `SIM change detected: ${newOperator || 'Unknown'}`,
                    timestamp: new Date().toISOString()
                }
            },
            $set: {
                isLocked: true, // Auto-lock on SIM change
                'deviceStatus.status': 'warning',
                'deviceStatus.errorMessage': `Unauthorized SIM change detected at ${new Date().toISOString()}`,
                'simDetails.serialNumber': newIccid,
                'simDetails.operator': newOperator,
                'simDetails.isAuthorized': false,
                'simDetails.lastUpdated': new Date()
            }
        };

        const customer = await Customer.findOneAndUpdate(
            { id: req.params.id },
            updateData,
            { new: true }
        );

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        console.log(`🔒 Device auto-locked due to SIM change`);

        res.json({
            success: true,
            message: 'SIM change recorded and device locked',
            isLocked: true
        });

    } catch (err) {
        console.error('SIM change error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Security Event Report - Device reports security events
router.post('/:id/security-event', async (req, res) => {
    try {
        const { event, timestamp, action, details } = req.body;

        console.log(`🚨 SECURITY EVENT for ${req.params.id}: ${event}`);

        const eventData = {
            event,
            timestamp: new Date(timestamp || Date.now()),
            action,
            details,
            ipAddress: req.ip
        };

        const updateData = {
            $push: {
                securityEvents: eventData
            }
        };

        // Auto-lock for certain events
        if (['SAFE_MODE_ATTEMPT', 'ROOT_DETECTED', 'TAMPERING'].includes(event)) {
            updateData.$set = {
                isLocked: true,
                'deviceStatus.status': 'warning',
                'deviceStatus.errorMessage': `Security event: ${event}`
            };
            updateData.$push.lockHistory = {
                id: Date.now().toString(),
                action: 'locked',
                reason: `Security event: ${event}`,
                timestamp: new Date().toISOString()
            };
            console.log(`🔒 Device auto-locked due to security event`);
        }

        const customer = await Customer.findOneAndUpdate(
            { id: req.params.id },
            updateData,
            { new: true }
        );

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json({
            success: true,
            message: 'Security event recorded',
            event
        });

    } catch (err) {
        console.error('Security event error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Get offline tokens for a device
router.get('/:id/tokens', async (req, res) => {
    try {
        const customer = await Customer.findOne({ id: req.params.id }).select('offlineLockToken offlineUnlockToken');

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json({
            lockToken: customer.offlineLockToken,
            unlockToken: customer.offlineUnlockToken
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Set offline tokens for a device
router.post('/:id/tokens', async (req, res) => {
    try {
        const { lockToken, unlockToken } = req.body;

        const customer = await Customer.findOneAndUpdate(
            { id: req.params.id },
            {
                $set: {
                    offlineLockToken: lockToken,
                    offlineUnlockToken: unlockToken
                }
            },
            { new: true }
        );

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        console.log(`🔐 Tokens updated for ${req.params.id}`);

        res.json({
            success: true,
            message: 'Tokens updated'
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Fix for User APK v2.0 heartbeat path and status flow
router.post('/:id/heartbeat', async (req, res) => {
    try {
        const customerId = req.params.id;
        const { status, battery, batteryLevel, version, technical, sim, location, security } = req.body;
        const currentBattery = battery ?? batteryLevel;

        console.log(`💓 v2 Heartbeat received for ${customerId}`);

        const updateData = {
            'deviceStatus.status': status || 'active',
            'deviceStatus.lastSeen': new Date(),
            // Force completion of all setup steps since app is online
            'deviceStatus.steps.qrScanned': true,
            'deviceStatus.steps.appInstalled': true,
            'deviceStatus.steps.appLaunched': true,
            'deviceStatus.steps.permissionsGranted': true,
            'deviceStatus.steps.detailsFetched': true,
            'deviceStatus.steps.imeiVerified': true,
            'deviceStatus.steps.deviceBound': true,
            isEnrolled: true
        };

        if (currentBattery !== undefined && currentBattery !== null) {
            updateData['deviceStatus.batteryLevel'] = currentBattery;
            updateData['deviceFeatures.batteryLevel'] = currentBattery;
            updateData['deviceFeatures.lastUpdated'] = new Date();
        }
        if (version) updateData['deviceStatus.appVersion'] = version;

        // Save Technical Details
        if (technical) {
            if (technical.brand) {
                updateData['deviceStatus.technical.brand'] = technical.brand;
                updateData.brand = technical.brand;
            }
            if (technical.model) {
                updateData['deviceStatus.technical.model'] = technical.model;
                updateData.modelName = technical.model;
                updateData.mobileModel = technical.model;
            }
            if (technical.deviceName) {
                updateData['deviceStatus.technical.deviceName'] = technical.deviceName;
                updateData.deviceName = technical.deviceName;
            }
            if (technical.totalMemory) updateData['deviceStatus.technical.totalMemory'] = technical.totalMemory;
            if (technical.totalStorage) updateData['deviceStatus.technical.totalStorage'] = technical.totalStorage;
            if (technical.availableStorage) updateData['deviceStatus.technical.availableStorage'] = technical.availableStorage;
            if (technical.osVersion) updateData['deviceStatus.technical.osVersion'] = technical.osVersion;
            if (technical.sdkLevel) updateData['deviceStatus.technical.sdkLevel'] = technical.sdkLevel;
            if (technical.androidId) updateData['deviceStatus.technical.androidId'] = technical.androidId;
            if (technical.serial) updateData['deviceStatus.technical.serial'] = technical.serial;
        }

        // Save SIM Details
        if (sim) {
            if (sim.operator) updateData['simDetails.operator'] = sim.operator;
            if (sim.phoneNumber) updateData['simDetails.phoneNumber'] = sim.phoneNumber;
            if (sim.iccid) updateData['simDetails.serialNumber'] = sim.iccid;
        }

        // Save Security Status
        if (security) {
            updateData['deviceFeatures.factoryResetBlocked'] = security.factoryResetBlocked;
            updateData['deviceFeatures.usbDebuggingEnabled'] = !security.adbBlocked; // Invert back for schema consistency
            // We can also flag "isSecured" if the schema supports it, or just rely on the above.
        }

        // Save Location
        if (location) {
            updateData['deviceStatus.lastLocation'] = {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                timestamp: location.timestamp || new Date()
            };
            // Push to history (max 50)
            // Note: $push is handled separately in findOneAndUpdate usually or we can use $push operator if we change the query structure.
            // But since I'm using $set for updateData, I need a separate operation or careful construction.
            // Simpler: Just save lastLocation for now, history requires schema change to be safe.
            // Let's rely on lastLocation first, and maybe add history if schema supports it.
            // Assuming schema is loose or I can use $push.
        }

        const updateOps = { $set: updateData };
        if (location) {
            updateOps.$push = {
                'deviceStatus.locationHistory': {
                    $each: [{
                        latitude: location.latitude,
                        longitude: location.longitude,
                        timestamp: location.timestamp || new Date()
                    }],
                    $slice: -50 // Keep last 50
                }
            };
        }

        const customer = await Customer.findOneAndUpdate(
            { id: customerId },
            updateOps,
            { new: true }
        );

        // Sync to Device Collection (for Frontend Consistency)
        try {
            const deviceUpdate = {};
            if (currentBattery !== undefined && currentBattery !== null) deviceUpdate.batteryLevel = currentBattery;
            if (technical) {
                if (technical.brand) deviceUpdate.brand = technical.brand;
                if (technical.model) deviceUpdate.model = technical.model;
                if (technical.deviceName) deviceUpdate.deviceName = technical.deviceName;
                if (technical.totalMemory) deviceUpdate.totalMemory = technical.totalMemory;
                if (technical.osVersion) deviceUpdate.osVersion = technical.osVersion;
                if (technical.sdkLevel) deviceUpdate.sdkLevel = technical.sdkLevel;
                if (technical.androidId) deviceUpdate.androidId = technical.androidId;
                if (technical.serial) deviceUpdate.serialNumber = technical.serial;
                if (technical.totalStorage) deviceUpdate.totalStorage = technical.totalStorage;
                if (technical.availableStorage) deviceUpdate.availableStorage = technical.availableStorage;
                if (technical.networkType) deviceUpdate.networkType = technical.networkType;
            }
            if (sim) {
                if (sim.operator) deviceUpdate.simOperator = sim.operator;
                if (sim.iccid) deviceUpdate.simIccid = sim.iccid;
            }
            if (location) {
                deviceUpdate.location = {
                    latitude: location.latitude,
                    longitude: location.longitude
                };
            }
            deviceUpdate.lastSeenAt = new Date();
            deviceUpdate.isConnected = true;

            await Device.updateOne(
                { assignedCustomerId: customerId },
                { $set: deviceUpdate },
                { upsert: true }
            );
        } catch (devErr) {
            console.error('Error syncing to Device collection:', devErr);
        }

        if (!customer) return res.status(404).json({ message: 'Device not found' });

        // Check for pending commands
        let pendingCommand = null;
        let commandParams = null; // Add params support

        if (customer.remoteCommand && customer.remoteCommand.command) {
            pendingCommand = customer.remoteCommand.command;
            commandParams = customer.remoteCommand.params || {};
            console.log(`📤 Sending command to device: ${pendingCommand}`);
            await Customer.updateOne({ _id: customer._id }, { $unset: { remoteCommand: "" } });
        }

        res.json({
            ok: true,
            status: customer.deviceStatus.status,
            isLocked: customer.isLocked,
            command: pendingCommand || null, // Explicit null if undefined
            // Command parameters for actions like setWallpaper, setPin
            wallpaperUrl: commandParams?.wallpaperUrl || null,
            pin: commandParams?.pin || null,
            lockMessage: commandParams?.message || customer.lockMessage || null,
            supportPhone: commandParams?.phone || customer.supportPhone || null,
            // Additional device control data
            lockInfo: {
                message: customer.lockMessage || "This device has been locked due to payment overdue.",
                phone: customer.supportPhone || "8876655444"
            }
        });

    } catch (err) {
        console.error('v2 Heartbeat error:', err);
        res.status(500).json({ message: err.message });
    }
});

// FCM Token Registration
// POST /api/customers/:id/fcm-token
router.post('/:id/fcm-token', async (req, res) => {
    try {
        const { id } = req.params;
        const { fcmToken } = req.body;

        if (!fcmToken) {
            return res.status(400).json({ message: 'FCM token is required' });
        }

        const customer = await Customer.findOne({ id });
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Update FCM token
        customer.deviceStatus.fcmToken = fcmToken;
        customer.deviceStatus.fcmTokenUpdatedAt = new Date();
        await customer.save();

        logger.info(`FCM token registered for customer ${id}`);
        res.json({ message: 'FCM token registered successfully' });

    } catch (err) {
        logger.error('FCM token registration error:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

