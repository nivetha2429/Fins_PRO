const logger = require('../config/logger');

/**
 * Permission Check Middleware
 * Verifies user has specific permission for an action
 */
const checkPermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Super Admin bypasses all permission checks
        if (req.user.role === 'SUPER_ADMIN') {
            return next();
        }

        // Check if user has the required permission
        if (!req.user.permissions || !req.user.permissions[permission]) {
            logger.logSecurityEvent('PERMISSION_DENIED', {
                userId: req.user._id,
                userRole: req.user.role,
                requiredPermission: permission,
                endpoint: req.originalUrl
            });

            return res.status(403).json({
                success: false,
                message: `Permission denied. '${permission}' permission required.`
            });
        }

        next();
    };
};

module.exports = checkPermission;
