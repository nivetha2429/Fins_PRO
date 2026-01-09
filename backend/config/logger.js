const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
require('fs').mkdirSync(logsDir, { recursive: true });

// Configure transports
const transports = [
    // Console output
    new winston.transports.Console({
        format: consoleFormat,
        level: process.env.LOG_LEVEL || 'info'
    }),

    // Error logs (separate file)
    new DailyRotateFile({
        filename: path.join(logsDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '30d',
        format: logFormat
    }),

    // Combined logs (all levels)
    new DailyRotateFile({
        filename: path.join(logsDir, 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        format: logFormat
    }),

    // Critical events (lock/unlock, device removal, updates)
    new DailyRotateFile({
        filename: path.join(logsDir, 'critical-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'warn',
        maxSize: '20m',
        maxFiles: '90d', // Keep critical logs longer
        format: logFormat
    })
];

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports,
    exitOnError: false
});

// Helper methods for structured logging
logger.logRequest = (req, statusCode, duration) => {
    logger.info('HTTP Request', {
        method: req.method,
        url: req.originalUrl,
        statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
};

logger.logDeviceEvent = (event, deviceId, customerId, details = {}) => {
    logger.warn('Device Event', {
        event,
        deviceId,
        customerId,
        ...details
    });
};

logger.logSecurityEvent = (event, details = {}) => {
    logger.error('Security Event', {
        event,
        timestamp: new Date().toISOString(),
        ...details
    });
};

logger.logSystemEvent = (event, details = {}) => {
    logger.info('System Event', {
        event,
        ...details
    });
};

module.exports = logger;
