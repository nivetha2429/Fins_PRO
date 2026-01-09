const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },

    // Multi-tenant support
    dealerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser',
        required: true,
        index: true
    },

    name: { type: String, required: true },
    phoneNo: { type: String, required: true },
    aadharNo: { type: String },
    address: { type: String },
    imei1: { type: String, required: true, unique: true }, // The ACTUAL IMEI from device
    expectedIMEI: { type: String }, // The IMEI admin expects (for verification)
    imei2: { type: String },
    brand: { type: String },
    modelName: { type: String },
    mobileModel: { type: String }, // Keep for compatibility with older parts

    // SIM Tracking
    simDetails: {
        operator: { type: String },
        serialNumber: { type: String }, // ICCID
        phoneNumber: { type: String },
        imsi: { type: String },
        isAuthorized: { type: Boolean, default: true },
        lastUpdated: { type: Date }
    },
    simChangeHistory: [{
        serialNumber: { type: String },
        operator: { type: String },
        detectedAt: { type: Date },
        ipAddress: { type: String }
    }],

    // Offline Lock Tokens
    offlineLockToken: { type: String }, // 6-digit PIN for locking via SMS
    offlineUnlockToken: { type: String }, // Token to unlock via SMS

    // Device Binding (QR)
    deviceBindToken: { type: String },
    bindTokenExpiresAt: { type: Date },

    deviceName: { type: String },
    financeName: { type: String },
    totalAmount: { type: Number },
    emiAmount: { type: Number },
    emiDate: { type: Number },
    totalEmis: { type: Number },
    paidEmis: { type: Number },
    isLocked: { type: Boolean, default: false },
    location: {
        lat: { type: Number },
        lng: { type: Number },
        lastUpdated: { type: Date },
        address: { type: String }
    },
    emiSchedule: [{
        dueDate: { type: Date },
        amount: { type: Number },
        status: { type: String, enum: ['PENDING', 'PAID', 'OVERDUE'], default: 'PENDING' },
        paidAt: { type: Date }
    }],
    createdAt: { type: String },
    lockHistory: [{
        id: { type: String },
        action: { type: String, enum: ['locked', 'unlocked'] },
        timestamp: { type: String },
        reason: { type: String }
    }],
    photoUrl: { type: String },
    documents: [String],
    isEnrolled: { type: Boolean, default: false },
    enrollmentToken: { type: String },
    deviceStatus: {
        status: {
            type: String,
            enum: ['pending', 'installing', 'connected', 'online', 'offline', 'error', 'warning', 'ADMIN_INSTALLED'],
            default: 'pending'
        },
        lastSeen: { type: Date },
        lastStatusUpdate: { type: Date },
        installProgress: { type: Number, default: 0 }, // 0-100
        errorMessage: { type: String },
        // Technical Details from Admin DPC
        technical: {
            brand: { type: String },
            model: { type: String },
            osVersion: { type: String },
            androidId: { type: String },
            serial: { type: String },
            sdkLevel: { type: Number },
            totalStorage: { type: String },
            availableStorage: { type: String },
            totalMemory: { type: String }, // Switched to String for "6.00 GB" format
            deviceName: { type: String },
            freeMemory: { type: Number }
        },
        // FCM Push Notification Token
        fcmToken: { type: String, default: null },
        fcmTokenUpdatedAt: { type: Date },
        // Detailed Onboarding Steps
        steps: {
            qrScanned: { type: Boolean, default: false }, // Inferred or Manual
            appInstalled: { type: Boolean, default: false },
            appLaunched: { type: Boolean, default: false },
            permissionsGranted: { type: Boolean, default: false },
            detailsFetched: { type: Boolean, default: false },
            imeiVerified: { type: Boolean, default: false },
            deviceBound: { type: Boolean, default: false }
        }
    },
    remoteCommand: {
        command: { type: String }, // e.g. "lock", "unlock", "wipe", "setWallpaper", "setPin"
        params: { type: mongoose.Schema.Types.Mixed }, // Parameters like { wallpaperUrl, pin, message, phone }
        timestamp: { type: Date }
    },
    // Lock screen customization
    lockMessage: { type: String, default: "This device has been locked due to payment overdue." },
    supportPhone: { type: String, default: "8876655444" },
    wallpaperUrl: { type: String }, // Custom wallpaper URL

    // Security Events tracking
    securityEvents: [{
        event: { type: String }, // e.g. "SAFE_MODE_ATTEMPT", "SIM_CHANGE", "ROOT_DETECTED", "TAMPERING"
        timestamp: { type: Date },
        action: { type: String }, // Action taken (e.g. "LOCKED", "ALARMED")
        details: { type: mongoose.Schema.Types.Mixed },
        ipAddress: { type: String }
    }],

    // Device Features Status (from DeviceLockModule.getDeviceFeatureStatus())
    deviceFeatures: {
        isDeviceOwner: { type: Boolean, default: false },
        screenLocked: { type: Boolean, default: false },
        kioskModeActive: { type: Boolean, default: false },
        cameraDisabled: { type: Boolean, default: false },
        screenCaptureDisabled: { type: Boolean, default: false },
        factoryResetBlocked: { type: Boolean, default: false },
        safeModeBlocked: { type: Boolean, default: false },
        usbFileTransferBlocked: { type: Boolean, default: false },
        statusBarDisabled: { type: Boolean, default: false },
        locationEnabled: { type: Boolean, default: false },
        batteryLevel: { type: Number, default: -1 },
        isCharging: { type: Boolean, default: false },
        networkConnected: { type: Boolean, default: false },
        networkType: { type: String, default: 'Unknown' },
        usbDebuggingEnabled: { type: Boolean, default: false },
        lastUpdated: { type: Date }
    },

    // SIM Status (from DeviceLockModule.getSimStatus())
    simStatus: {
        simState: { type: String, default: 'UNKNOWN' }, // READY, ABSENT, LOCKED, UNKNOWN
        simReady: { type: Boolean, default: false },
        operator: { type: String },
        iccid: { type: String }, // SIM Serial Number
        phoneNumber: { type: String },
        isDualSim: { type: Boolean, default: false },
        simCount: { type: Number, default: 0 },
        lastUpdated: { type: Date },
        // SIM Change Detection
        originalIccid: { type: String }, // Store original ICCID for change detection
        simChanged: { type: Boolean, default: false }
    },
    
    // Real-time Provisioning Progress Tracking
    provisioningStages: [{
        stage: {
            type: String,
            enum: [
                "QR_SCANNED",
                "DPC_DOWNLOADING",
                "DPC_INSTALLED",
                "DEVICE_OWNER_SET",
                "USER_APP_DOWNLOADING",
                "USER_APP_INSTALLED",
                "PERMISSIONS_GRANTED",
                "CONFIG_APPLIED",
                "PROVISIONING_COMPLETE"
            ]
        },
        status: {
            type: String,
            enum: ["pending", "in_progress", "success", "failed"],
            default: "pending"
        },
        message: { type: String },
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Customer', CustomerSchema);
