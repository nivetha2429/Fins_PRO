const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const Device = require('../models/Device');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const logger = require('../config/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

/**
 * @route   POST /api/admin/login
 * @desc    Admin login with 4-digit passcode
 * @access  Public
 */
router.post('/login', async (req, res) => {
    try {
        const { email, passcode } = req.body;

        if (!email || !passcode) {
            return res.status(400).json({
                success: false,
                message: 'Email and passcode are required'
            });
        }

        if (!/^\d{4,6}$/.test(passcode)) {
            return res.status(400).json({
                success: false,
                message: 'Passcode must be between 4 and 6 digits'
            });
        }

        const user = await AdminUser.findOne({ email: email.toLowerCase() });

        if (!user) {
            logger.logSecurityEvent('LOGIN_FAILED', { email, reason: 'User not found' });
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        if (!user.isActive) {
            logger.logSecurityEvent('LOGIN_FAILED', { email, reason: 'Account deactivated' });
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        const isMatch = await user.comparePasscode(passcode);

        if (!isMatch) {
            logger.logSecurityEvent('LOGIN_FAILED', { email, reason: 'Invalid passcode' });
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign(
            { userId: user._id },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Get device usage stats for ADMIN users
        let deviceStats = null;
        if (user.role === 'ADMIN') {
            const deviceCount = await Device.countDocuments({ dealerId: user._id });
            deviceStats = {
                current: deviceCount,
                limit: user.deviceLimit,
                remaining: user.deviceLimit - deviceCount
            };
        }

        logger.logSystemEvent('USER_LOGIN', {
            userId: user._id,
            email: user.email,
            role: user.role
        });

        res.json({
            success: true,
            token,
            user: {
                ...user.toSafeObject(),
                deviceStats
            }
        });

    } catch (error) {
        logger.error('Login error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

/**
 * @route   POST /api/admin/users
 * @desc    Create new admin (SUPER_ADMIN only)
 * @access  Super Admin
 */
router.post('/users', auth, checkRole('SUPER_ADMIN'), async (req, res) => {
    try {
        const { name, email, phone, passcode, deviceLimit, profilePhoto } = req.body;

        if (!name || !email || !passcode) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and passcode are required'
            });
        }

        if (!/^\d{4,6}$/.test(passcode)) {
            return res.status(400).json({
                success: false,
                message: 'Passcode must be between 4 and 6 digits'
            });
        }

        const existing = await AdminUser.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        const newUser = new AdminUser({
            name,
            email: email.toLowerCase(),
            phone,
            passcode,
            role: 'ADMIN',
            deviceLimit: deviceLimit || 0,
            profilePhoto,
            createdBy: req.user._id
        });

        await newUser.save();

        logger.logSystemEvent('ADMIN_CREATED', {
            createdBy: req.user._id,
            newAdminId: newUser._id,
            newAdminEmail: newUser.email,
            deviceLimit: newUser.deviceLimit
        });

        // Audit log
        const { logAdminCreation } = require('../middleware/auditLog');
        await logAdminCreation(req, newUser);

        res.status(201).json({
            success: true,
            user: newUser.toSafeObject()
        });

    } catch (error) {
        logger.error('Admin creation error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to create admin'
        });
    }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get all admins with device usage stats (SUPER_ADMIN only)
 * @access  Super Admin
 */
router.get('/users', auth, checkRole('SUPER_ADMIN'), async (req, res) => {
    try {
        const admins = await AdminUser.find({ role: 'ADMIN' })
            .select('-passcode')
            .sort({ createdAt: -1 });

        // Get device counts for each admin
        const adminsWithStats = await Promise.all(
            admins.map(async (admin) => {
                const deviceCount = await Device.countDocuments({ dealerId: admin._id });
                const customerCount = await Customer.countDocuments({ dealerId: admin._id });

                return {
                    ...admin.toObject(),
                    deviceUsage: {
                        current: deviceCount,
                        limit: admin.deviceLimit,
                        remaining: admin.deviceLimit - deviceCount,
                        percentage: admin.deviceLimit > 0 ? (deviceCount / admin.deviceLimit * 100).toFixed(1) : 0
                    },
                    customerCount
                };
            })
        );

        res.json({
            success: true,
            admins: adminsWithStats
        });

    } catch (error) {
        logger.error('Get admins error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch admins'
        });
    }
});

/**
 * @route   PUT /api/admin/users/:id/limit
 * @desc    Update admin device limit (SUPER_ADMIN only)
 * @access  Super Admin
 */
router.put('/users/:id/limit', auth, checkRole('SUPER_ADMIN'), async (req, res) => {
    try {
        const { deviceLimit } = req.body;

        if (typeof deviceLimit !== 'number' || deviceLimit < 0) {
            return res.status(400).json({
                success: false,
                message: 'Device limit must be a positive number'
            });
        }

        const admin = await AdminUser.findById(req.params.id);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        if (admin.role !== 'ADMIN') {
            return res.status(400).json({
                success: false,
                message: 'Can only set limits for ADMIN users'
            });
        }

        const oldLimit = admin.deviceLimit;
        admin.deviceLimit = deviceLimit;
        await admin.save();

        logger.logSystemEvent('DEVICE_LIMIT_UPDATED', {
            updatedBy: req.user._id,
            adminId: admin._id,
            newLimit: deviceLimit
        });

        // Audit log
        const { logAdminLimitUpdate } = require('../middleware/auditLog');
        await logAdminLimitUpdate(req, admin, oldLimit, deviceLimit);

        res.json({
            success: true,
            user: admin.toSafeObject()
        });

    } catch (error) {
        logger.error('Update device limit error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to update device limit'
        });
    }
});

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update admin (SUPER_ADMIN only)
 * @access  Super Admin
 */
router.put('/users/:id', auth, checkRole('SUPER_ADMIN'), async (req, res) => {
    try {
        const admin = await AdminUser.findById(req.params.id);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        const { name, phone, isActive, profilePhoto } = req.body;

        if (name) admin.name = name;
        if (phone) admin.phone = phone;
        if (typeof isActive === 'boolean') admin.isActive = isActive;
        if (profilePhoto) admin.profilePhoto = profilePhoto;

        await admin.save();

        logger.logSystemEvent('ADMIN_UPDATED', {
            updatedBy: req.user._id,
            adminId: admin._id
        });

        res.json({
            success: true,
            user: admin.toSafeObject()
        });

    } catch (error) {
        logger.error('Update admin error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to update admin'
        });
    }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Deactivate admin (SUPER_ADMIN only)
 * @access  Super Admin
 */
router.delete('/users/:id', auth, checkRole('SUPER_ADMIN'), async (req, res) => {
    try {
        const admin = await AdminUser.findById(req.params.id);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        admin.isActive = false;
        await admin.save();

        logger.logSystemEvent('ADMIN_DEACTIVATED', {
            deactivatedBy: req.user._id,
            adminId: admin._id
        });

        res.json({
            success: true,
            message: 'Admin deactivated successfully'
        });

    } catch (error) {
        logger.error('Deactivate admin error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to deactivate admin'
        });
    }
});

/**
 * @route   GET /api/admin/stats
 * @desc    Get admin dashboard stats
 * @access  Private
 */
router.get('/stats', auth, async (req, res) => {
    try {
        const filter = req.user.role === 'SUPER_ADMIN'
            ? {}
            : { dealerId: req.user._id };

        const totalDevices = await Device.countDocuments(filter);
        const activeDevices = await Device.countDocuments({ ...filter, state: 'ACTIVE' });
        const lockedDevices = await Device.countDocuments({ ...filter, state: 'LOCKED' });
        const totalCustomers = await Customer.countDocuments(filter);

        const stats = {
            totalDevices,
            activeDevices,
            lockedDevices,
            totalCustomers
        };

        // Add device limit info for ADMIN users
        if (req.user.role === 'ADMIN') {
            stats.deviceLimit = req.user.deviceLimit || 0;
            stats.remainingSlots = (req.user.deviceLimit || 0) - totalDevices;
            stats.usagePercentage = req.user.deviceLimit > 0
                ? (totalDevices / req.user.deviceLimit * 100).toFixed(1)
                : 0;
        }

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        logger.error('Get stats error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stats'
        });
    }
});

/**
 * @route   GET /api/admin/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', auth, async (req, res) => {
    try {
        const user = await AdminUser.findById(req.user._id).select('-passcode');

        res.json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile'
        });
    }
});

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get audit logs (SUPER_ADMIN only)
 * @access  Private (SUPER_ADMIN)
 */
router.get('/audit-logs', auth, checkRole('SUPER_ADMIN'), async (req, res) => {
    try {
        const AuditLog = require('../models/AuditLog');

        const {
            limit = 50,
            skip = 0,
            action,
            actorId,
            startDate,
            endDate
        } = req.query;

        // Build query
        const query = {};

        if (action) {
            query.action = action;
        }

        if (actorId) {
            query.actorId = actorId;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        }

        // Fetch logs
        const logs = await AuditLog.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await AuditLog.countDocuments(query);

        res.json({
            success: true,
            logs: logs.map(log => log.toDisplay()),
            pagination: {
                total,
                limit: parseInt(limit),
                skip: parseInt(skip),
                hasMore: total > (parseInt(skip) + parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Audit logs fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit logs'
        });
    }
});

/**
 * @route   GET /api/admin/users/:adminId/devices
 * @desc    Get all devices for a specific admin (SUPER_ADMIN only)
 * @access  Private (SUPER_ADMIN)
 */
router.get('/users/:adminId/devices', auth, checkRole('SUPER_ADMIN'), async (req, res) => {
    try {
        const { adminId } = req.params;

        // Verify admin exists
        const admin = await AdminUser.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        // Get all customers for this admin
        const customers = await Customer.find({ dealerId: adminId })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                deviceLimit: admin.deviceLimit
            },
            devices: customers,
            count: customers.length
        });
    } catch (error) {
        console.error('Admin devices fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch admin devices'
        });
    }
});

/**
 * @route   POST /api/admin/devices/:customerId/lock
 * @desc    Force lock any device (SUPER_ADMIN only)
 * @access  Private (SUPER_ADMIN)
 */
router.post('/devices/:customerId/lock', auth, checkRole('SUPER_ADMIN'), async (req, res) => {
    try {
        const { customerId } = req.params;
        const { reason } = req.body;

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Device not found'
            });
        }

        customer.isLocked = true;
        customer.lockReason = reason || 'Locked by Super Admin';
        customer.lockedAt = new Date();
        customer.lockedBy = req.user._id;
        await customer.save();

        // Log the action
        const { logDeviceLock } = require('../middleware/auditLog');
        await logDeviceLock(req, customer, true);

        res.json({
            success: true,
            message: 'Device locked successfully',
            customer
        });
    } catch (error) {
        console.error('Device lock error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to lock device'
        });
    }
});

/**
 * @route   POST /api/admin/devices/:customerId/unlock
 * @desc    Force unlock any device (SUPER_ADMIN only)
 * @access  Private (SUPER_ADMIN)
 */
router.post('/devices/:customerId/unlock', auth, checkRole('SUPER_ADMIN'), async (req, res) => {
    try {
        const { customerId } = req.params;

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Device not found'
            });
        }

        customer.isLocked = false;
        customer.lockReason = null;
        customer.unlockedAt = new Date();
        customer.unlockedBy = req.user._id;
        await customer.save();

        // Log the action
        const { logDeviceLock } = require('../middleware/auditLog');
        await logDeviceLock(req, customer, false);

        res.json({
            success: true,
            message: 'Device unlocked successfully',
            customer
        });
    } catch (error) {
        console.error('Device unlock error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unlock device'
        });
    }
});

/**
 * @route   DELETE /api/admin/devices/:customerId
 * @desc    Force remove any device (SUPER_ADMIN only)
 * @access  Private (SUPER_ADMIN)
 */
router.delete('/devices/:customerId', auth, checkRole('SUPER_ADMIN'), async (req, res) => {
    try {
        const { customerId } = req.params;

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Device not found'
            });
        }

        // Log before deletion
        const { logCustomerRemoval } = require('../middleware/auditLog');
        await logCustomerRemoval(req, customer);

        // Delete the customer
        await Customer.findByIdAndDelete(customerId);

        res.json({
            success: true,
            message: 'Device removed successfully'
        });
    } catch (error) {
        console.error('Device removal error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove device'
        });
    }
});

module.exports = router;
