const logger = require('../config/logger');
const Customer = require('../models/Customer');

/**
 * Device Limit Enforcement Middleware
 * Checks if admin has reached their device limit
 * 
 * NOTE: We count Customer records, not Device records, because
 * customer creation only creates Customer records. Device records
 * are created separately during provisioning.
 */
const checkDeviceLimit = async (req, res, next) => {
    try {
        console.log(`[DEBUG] Checking device limit for user: ${req.user.email} (Role: ${req.user.role})`);

        // Super Admin bypasses limit check
        if (req.user.role === 'SUPER_ADMIN') {
            console.log(`[DEBUG] Super Admin detected. Bypassing limit.`);
            return next();
        }

        // Get admin's device limit
        const deviceLimit = req.user.deviceLimit || 0;
        console.log(`[DEBUG] User limit: ${deviceLimit}`);

        // Count current customers (not devices)
        const currentDeviceCount = await Customer.countDocuments({
            dealerId: req.user._id
        });
        console.log(`[DEBUG] Current device count: ${currentDeviceCount}`);

        // Check if limit reached
        if (currentDeviceCount >= deviceLimit) {
            console.log(`[DEBUG] Limit REACHED: ${currentDeviceCount} >= ${deviceLimit}`);
            logger.logSecurityEvent('DEVICE_LIMIT_REACHED', {
                adminId: req.user._id,
                adminEmail: req.user.email,
                currentCount: currentDeviceCount,
                limit: deviceLimit
            });

            return res.status(403).json({
                success: false,
                error: 'Device limit reached',
                message: `You have reached your device limit of ${deviceLimit}. Contact support to increase your limit. (Logged in as: ${req.user.email}, Role: ${req.user.role})`,
                currentCount: currentDeviceCount,
                limit: deviceLimit,
                debug_user: req.user.email,
                debug_role: req.user.role
            });
        }

        // Attach device stats to request for logging
        req.deviceStats = {
            current: currentDeviceCount,
            limit: deviceLimit,
            remaining: deviceLimit - currentDeviceCount
        };

        next();
    } catch (error) {
        console.error('[DEBUG] Limit check FAILED:', error);
        logger.error('Device limit check error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to check device limit'
        });
    }
};

module.exports = checkDeviceLimit;
