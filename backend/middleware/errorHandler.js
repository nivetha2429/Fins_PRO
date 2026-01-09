const logger = require('../config/logger');

/**
 * Global error handling middleware
 * Catches all unhandled errors and logs them properly
 */
const errorHandler = (err, req, res, next) => {
    // Log the error
    logger.error('Unhandled Error', {
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        body: req.body
    });

    // Determine status code
    const statusCode = err.statusCode || err.status || 500;

    // Send error response
    res.status(statusCode).json({
        success: false,
        error: {
            message: process.env.NODE_ENV === 'production'
                ? 'Internal server error'
                : err.message,
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
        }
    });
};

module.exports = errorHandler;
