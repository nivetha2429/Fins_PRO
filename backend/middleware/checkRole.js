const logger = require('../config/logger');

/**
 * Role-Based Access Control Middleware
 * Checks if user has required role(s)
 */
const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            logger.logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
                userId: req.user._id,
                userRole: req.user.role,
                requiredRoles: allowedRoles,
                endpoint: req.originalUrl
            });

            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
        }

        next();
    };
};

module.exports = checkRole;
