const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    // Actor (who performed the action)
    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser',
        required: true,
        index: true
    },
    actorRole: {
        type: String,
        enum: ['SUPER_ADMIN', 'ADMIN'],
        required: true
    },
    actorName: {
        type: String,
        required: true
    },
    actorEmail: {
        type: String,
        required: true
    },

    // Action details
    action: {
        type: String,
        required: true,
        index: true,
        enum: [
            // Admin management
            'CREATE_ADMIN',
            'UPDATE_ADMIN_LIMIT',
            'DISABLE_ADMIN',
            'ENABLE_ADMIN',
            'DELETE_ADMIN',

            // Device management
            'LOCK_DEVICE',
            'UNLOCK_DEVICE',
            'REMOVE_DEVICE',

            // Customer management
            'CREATE_CUSTOMER',
            'UPDATE_CUSTOMER',
            'DELETE_CUSTOMER',

            // System events
            'SIM_CHANGE_DETECTED',
            'EMI_AUTO_LOCK',
            'PAYMENT_RECEIVED',
            'PAYMENT_MISSED',

            // Authentication
            'LOGIN_SUCCESS',
            'LOGIN_FAILED',
            'LOGOUT'
        ]
    },

    // Target (what was affected)
    targetType: {
        type: String,
        required: true,
        enum: ['ADMIN', 'DEVICE', 'CUSTOMER', 'SYSTEM']
    },
    targetId: {
        type: String,
        required: true,
        index: true
    },
    targetName: {
        type: String,
        required: true
    },

    // Additional context
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    // Request metadata
    ipAddress: {
        type: String,
        default: null
    },
    userAgent: {
        type: String,
        default: null
    },

    // Status
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILED'],
        default: 'SUCCESS'
    },
    errorMessage: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
AuditLogSchema.index({ createdAt: -1 }); // For date range queries
AuditLogSchema.index({ action: 1, createdAt: -1 }); // For filtering by action
AuditLogSchema.index({ actorId: 1, createdAt: -1 }); // For filtering by actor

// Static method to create audit log
AuditLogSchema.statics.log = async function (data) {
    try {
        const log = new this(data);
        await log.save();
        return log;
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw - audit logging should not break the main flow
        return null;
    }
};

// Instance method to format for display
AuditLogSchema.methods.toDisplay = function () {
    return {
        id: this._id,
        actor: {
            id: this.actorId,
            role: this.actorRole,
            name: this.actorName,
            email: this.actorEmail
        },
        action: this.action,
        target: {
            type: this.targetType,
            id: this.targetId,
            name: this.targetName
        },
        details: this.details,
        metadata: {
            ipAddress: this.ipAddress,
            userAgent: this.userAgent
        },
        status: this.status,
        errorMessage: this.errorMessage,
        timestamp: this.createdAt
    };
};

module.exports = mongoose.model('AuditLog', AuditLogSchema);
