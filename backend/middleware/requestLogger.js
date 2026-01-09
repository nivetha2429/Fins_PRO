const logger = require('../config/logger');

/**
 * Request logging middleware
 * Logs all HTTP requests with method, URL, status code, and duration
 */
const requestLogger = (req, res, next) => {
    const startTime = Date.now();

    // Capture the original end function
    const originalEnd = res.end;

    // Override res.end to log after response is sent
    res.end = function (...args) {
        const duration = Date.now() - startTime;
        logger.logRequest(req, res.statusCode, duration);
        originalEnd.apply(res, args);
    };

    next();
};

module.exports = requestLogger;
