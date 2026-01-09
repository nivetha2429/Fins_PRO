const mongoose = require('mongoose');

/**
 * Device Model - Tracks device lifecycle separate from customer
 * 
 * States:
 * - PENDING: QR generated, waiting for enrollment
 * - ACTIVE: Device enrolled and working
 * - LOCKED: EMI overdue, device locked
 * - REMOVED: Device removed from customer, cannot be reused without new QR
 * - UNASSIGNED: Fresh device, no customer assigned yet
 */
const DeviceSchema = new mongoose.Schema({
    deviceId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // Multi-tenant support
    dealerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser',
        required: true,
        index: true
    },

    // Platform
    platform: {
        type: String,
        enum: ['android', 'ios'],
        default: 'android'
    },

    // Lifecycle State
    state: {
        type: String,
        enum: ['PENDING', 'ACTIVE', 'LOCKED', 'REMOVED', 'UNASSIGNED'],
        default: 'PENDING'
    },

    // Customer Assignment
    assignedCustomerId: {
        type: String,
        default: null,
        index: true
    },

    // Device Info
    brand: { type: String },
    model: { type: String },
    deviceName: { type: String },
    osVersion: { type: String },
    sdkLevel: { type: String },
    serialNumber: { type: String },
    totalMemory: { type: String },

    // IMEI
    imei1: { type: String },
    imei2: { type: String },
    androidId: { type: String },

    // SIM Info
    sim1: {
        operator: { type: String },
        iccid: { type: String },
        phoneNumber: { type: String },
        isActive: { type: Boolean, default: false }
    },
    sim2: {
        operator: { type: String },
        iccid: { type: String },
        phoneNumber: { type: String },
        isActive: { type: Boolean, default: false }
    },
    isDualSim: { type: Boolean, default: false },

    // Legacy SIM fields (for backward compatibility)
    simOperator: { type: String },
    simIccid: { type: String },

    // Network Info
    networkType: { type: String },      // WiFi, 4G, 5G, etc.
    networkOperator: { type: String },
    isConnected: { type: Boolean, default: false },

    // Battery Info
    batteryLevel: { type: Number },
    isCharging: { type: Boolean, default: false },

    // Storage Info
    totalStorage: { type: String },
    availableStorage: { type: String },

    // Tracking
    lastSeenAt: { type: Date },
    lastLocation: {
        lat: { type: Number },
        lng: { type: Number },
        accuracy: { type: Number },
        timestamp: { type: Date }
    },

    // QR Type used for enrollment
    enrollmentType: {
        type: String,
        enum: ['ANDROID_NEW', 'ANDROID_EXISTING', 'IOS'],
        default: 'ANDROID_NEW'
    },

    // Enrollment Token (for QR validation)
    enrollmentToken: { type: String },
    enrollmentTokenExpiresAt: { type: Date },

    // History
    stateHistory: [{
        state: { type: String },
        changedAt: { type: Date, default: Date.now },
        reason: { type: String },
        changedBy: { type: String }
    }],

    // Removal Info
    removedAt: { type: Date },
    removalReason: { type: String }

}, { timestamps: true });

// Index for faster queries
DeviceSchema.index({ state: 1 });
DeviceSchema.index({ platform: 1 });
DeviceSchema.index({ imei1: 1 });
DeviceSchema.index({ androidId: 1 });

module.exports = mongoose.model('Device', DeviceSchema);
