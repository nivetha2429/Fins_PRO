const AuditLog = require('../models/AuditLog');

/**
 * Middleware to create audit log entries
 * Usage: Add after successful operations
 */

/**
 * Helper function to create audit log
 * @param {Object} req - Express request object
 * @param {String} action - Action type (e.g., 'CREATE_ADMIN')
 * @param {String} targetType - Target type ('ADMIN', 'DEVICE', 'CUSTOMER', 'SYSTEM')
 * @param {String} targetId - ID of the affected resource
 * @param {String} targetName - Name of the affected resource
 * @param {Object} details - Additional context
 * @param {String} status - 'SUCCESS' or 'FAILED'
 * @param {String} errorMessage - Error message if failed
 */
const createAuditLog = async (req, action, targetType, targetId, targetName, details = {}, status = 'SUCCESS', errorMessage = null) => {
    try {
        // Get actor info from request
        const actor = req.user || req.admin;

        if (!actor) {
            console.warn('Audit log: No actor found in request');
            return null;
        }

        // Get IP address
        const ipAddress = req.ip ||
            req.headers['x-forwarded-for']?.split(',')[0] ||
            req.connection.remoteAddress ||
            'unknown';

        // Get user agent
        const userAgent = req.headers['user-agent'] || 'unknown';

        // Create audit log
        const auditLog = await AuditLog.log({
            actorId: actor._id,
            actorRole: actor.role,
            actorName: actor.name,
            actorEmail: actor.email,
            action,
            targetType,
            targetId,
            targetName,
            details,
            ipAddress,
            userAgent,
            status,
            errorMessage
        });

        return auditLog;
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw - audit logging should not break the main flow
        return null;
    }
};

/**
 * Express middleware to automatically log requests
 * Usage: app.use(auditMiddleware)
 */
const auditMiddleware = (action, targetType) => {
    return async (req, res, next) => {
        // Store original res.json
        const originalJson = res.json.bind(res);

        // Override res.json to capture response
        res.json = function (data) {
            // Only log if successful
            if (data.success) {
                const targetId = data.id || data._id || req.params.id || 'unknown';
                const targetName = data.name || data.email || data.customerName || 'unknown';

                createAuditLog(
                    req,
                    action,
                    targetType,
                    targetId,
                    targetName,
                    { requestBody: req.body },
                    'SUCCESS'
                ).catch(err => console.error('Audit log error:', err));
            }

            // Call original json method
            return originalJson(data);
        };

        next();
    };
};

/**
 * Log admin creation
 */
const logAdminCreation = async (req, admin) => {
    return createAuditLog(
        req,
        'CREATE_ADMIN',
        'ADMIN',
        admin._id.toString(),
        admin.name,
        {
            email: admin.email,
            deviceLimit: admin.deviceLimit,
            role: admin.role
        }
    );
};

/**
 * Log admin limit update
 */
const logAdminLimitUpdate = async (req, admin, oldLimit, newLimit) => {
    return createAuditLog(
        req,
        'UPDATE_ADMIN_LIMIT',
        'ADMIN',
        admin._id.toString(),
        admin.name,
        {
            email: admin.email,
            oldLimit,
            newLimit,
            change: newLimit - oldLimit
        }
    );
};

/**
 * Log admin status change
 */
const logAdminStatusChange = async (req, admin, oldStatus, newStatus) => {
    const action = newStatus ? 'ENABLE_ADMIN' : 'DISABLE_ADMIN';
    return createAuditLog(
        req,
        action,
        'ADMIN',
        admin._id.toString(),
        admin.name,
        {
            email: admin.email,
            oldStatus,
            newStatus
        }
    );
};

/**
 * Log device lock/unlock
 */
const logDeviceLock = async (req, customer, isLocked) => {
    const action = isLocked ? 'LOCK_DEVICE' : 'UNLOCK_DEVICE';
    return createAuditLog(
        req,
        action,
        'DEVICE',
        customer._id.toString(),
        customer.customerName,
        {
            imei: customer.imei1,
            phoneNumber: customer.phoneNumber,
            reason: req.body.reason || 'Manual action'
        }
    );
};

/**
 * Log customer creation
 */
const logCustomerCreation = async (req, customer) => {
    return createAuditLog(
        req,
        'CREATE_CUSTOMER',
        'CUSTOMER',
        customer._id.toString(),
        customer.customerName,
        {
            imei: customer.imei1,
            phoneNumber: customer.phoneNumber,
            deviceModel: customer.deviceModel
        }
    );
};

/**
 * Log customer removal
 */
const logCustomerRemoval = async (req, customer) => {
    return createAuditLog(
        req,
        'DELETE_CUSTOMER',
        'CUSTOMER',
        customer._id.toString(),
        customer.customerName,
        {
            imei: customer.imei1,
            phoneNumber: customer.phoneNumber,
            reason: req.body.reason || 'Manual removal'
        }
    );
};

/**
 * Log SIM change detection
 */
const logSimChange = async (customerId, customerName, oldSim, newSim) => {
    // Create a fake request object for system events
    const systemReq = {
        user: {
            _id: 'SYSTEM',
            role: 'SYSTEM',
            name: 'System',
            email: 'system@emilock.com'
        },
        ip: 'system',
        headers: { 'user-agent': 'system' }
    };

    return createAuditLog(
        systemReq,
        'SIM_CHANGE_DETECTED',
        'DEVICE',
        customerId,
        customerName,
        {
            oldSim,
            newSim,
            autoAction: 'Device locked automatically'
        }
    );
};

/**
 * Log EMI auto-lock
 */
const logEmiAutoLock = async (customerId, customerName, missedPayments) => {
    const systemReq = {
        user: {
            _id: 'SYSTEM',
            role: 'SYSTEM',
            name: 'System',
            email: 'system@emilock.com'
        },
        ip: 'system',
        headers: { 'user-agent': 'system' }
    };

    return createAuditLog(
        systemReq,
        'EMI_AUTO_LOCK',
        'DEVICE',
        customerId,
        customerName,
        {
            missedPayments,
            autoAction: 'Device locked due to missed EMI payments'
        }
    );
};

module.exports = {
    createAuditLog,
    auditMiddleware,
    logAdminCreation,
    logAdminLimitUpdate,
    logAdminStatusChange,
    logDeviceLock,
    logCustomerCreation,
    logCustomerRemoval,
    logSimChange,
    logEmiAutoLock
};
