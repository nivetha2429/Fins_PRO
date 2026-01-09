const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const logger = require('../config/logger');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const auth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token provided'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');

        // Find user
        const user = await AdminUser.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User account is deactivated'
            });
        }

        // Attach user to request
        req.user = {
            _id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            deviceLimit: user.deviceLimit || 0,
            dealerId: user.dealerId || user._id, // Use own ID if dealer, parent ID if sub-admin
            permissions: user.permissions
        };

        console.log(`[AUTH DEBUG] User authenticated: ${user.email}, Role: ${user.role}, Limit: ${user.deviceLimit}`);

        next();
    } catch (error) {
        logger.error('Authentication error', { error: error.message });

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

module.exports = auth;
