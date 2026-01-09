const Customer = require('../models/Customer');
const Device = require('../models/Device');

/**
 * EMI Scheduler Service
 * Checks continuously for overdue payments and auto-locks devices.
 */
class EmiScheduler {
    constructor() {
        // Run check every 1 hour
        this.CHECK_INTERVAL = 60 * 60 * 1000;
    }

    start() {
        console.log('⏰ EMI Scheduler started (Interval: 1 hour)');
        this.checkOverdueEMIs(); // Run immediately on startup

        setInterval(() => {
            this.checkOverdueEMIs();
        }, this.CHECK_INTERVAL);
    }

    async checkOverdueEMIs() {
        try {
            console.log('🔍 Checking for overdue EMIs...');

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Find customers with nextPaymentDate in the past AND not already locked
            const overdueCustomers = await Customer.find({
                nextPaymentDate: { $lt: today },
                isLocked: { $ne: true }
            });

            if (overdueCustomers.length === 0) {
                console.log('✅ No new overdue EMIs found.');
                return;
            }

            console.log(`⚠️ Found ${overdueCustomers.length} overdue customers. Locking devices...`);

            for (const customer of overdueCustomers) {
                await this.lockCustomerDevice(customer);
            }

        } catch (err) {
            console.error('❌ EMI Scheduler Error:', err);
        }
    }

    async lockCustomerDevice(customer) {
        try {
            console.log(`🔒 Auto-locking device for ${customer.name} (Overdue since ${customer.nextPaymentDate})`);

            // 1. Update Customer Lock State
            customer.isLocked = true;
            customer.lockMessage = "EMI Payment Overdue. Please pay immediately to unlock.";
            customer.deviceStatus.status = 'locked';
            customer.deviceStatus.errorMessage = "EMI Overdue - Auto Locked";

            customer.lockHistory.push({
                id: Date.now().toString(),
                action: 'locked',
                reason: 'EMI Auto-Lock (Payment Overdue)',
                timestamp: new Date().toISOString()
            });

            await customer.save();

            // 2. Sync to Device Model
            await Device.updateMany(
                { assignedCustomerId: customer.id },
                {
                    $set: {
                        state: 'LOCKED',
                        lockReason: 'EMI Overdue'
                    },
                    $push: {
                        lockHistory: {
                            action: 'LOCKED',
                            reason: 'EMI Auto-Lock',
                            timestamp: new Date()
                        }
                    }
                }
            );

        } catch (err) {
            console.error(`❌ Failed to lock customer ${customer.id}:`, err);
        }
    }
}

module.exports = new EmiScheduler();
