const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * AdminUser Model - Simplified 2-Tier System
 * 
 * Roles:
 * - SUPER_ADMIN: Full system access, manage admins, set device limits
 * - ADMIN: Manage own customers/devices (with device limit)
 */
const AdminUserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    phone: {
        type: String,
        trim: true
    },

    passcode: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^\d{4,6}$/.test(v) || v.length >= 60; // Allow hashed passcode or 4-6 digits
            },
            message: 'Passcode must be between 4 and 6 digits'
        }
    },

    role: {
        type: String,
        enum: ['SUPER_ADMIN', 'ADMIN'],
        required: true,
        default: 'ADMIN'
    },

    // Device limit for commercial licensing
    deviceLimit: {
        type: Number,
        default: 0,
        min: 0
    },

    isActive: {
        type: Boolean,
        default: true
    },

    profilePhoto: {
        type: String, // URL or Base64
    },

    // Metadata
    lastLogin: Date,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser'
    }

}, { timestamps: true });

// Hash passcode before saving
AdminUserSchema.pre('save', async function () {
    if (!this.isModified('passcode')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.passcode = await bcrypt.hash(this.passcode, salt);
});

// Method to compare passcode
AdminUserSchema.methods.comparePasscode = async function (candidatePasscode) {
    return await bcrypt.compare(candidatePasscode, this.passcode);
};

// Method to get safe user object (without passcode)
AdminUserSchema.methods.toSafeObject = function () {
    const obj = this.toObject();
    delete obj.passcode;
    return obj;
};

// Virtual for device usage
AdminUserSchema.virtual('deviceUsage', {
    ref: 'Device',
    localField: '_id',
    foreignField: 'dealerId',
    count: true
});

// Index for faster queries
AdminUserSchema.index({ email: 1 });
AdminUserSchema.index({ role: 1 });
AdminUserSchema.index({ isActive: 1 });

module.exports = mongoose.model('AdminUser', AdminUserSchema);
