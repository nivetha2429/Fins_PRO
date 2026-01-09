const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// POST /api/payments/pay-emi
router.post('/pay-emi', async (req, res) => {
    try {
        const { customerId, amount, notes } = req.body;

        if (!customerId || !amount) {
            return res.status(400).json({ error: 'Customer ID and Amount are required' });
        }

        const customer = await Customer.findOne({ id: customerId });
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // 1. Record Payment in EMI Schedule
        // Logic: Find the first PENDING emi and mark it PAID
        let emiUpdated = false;
        if (customer.emiSchedule && customer.emiSchedule.length > 0) {
            for (let emi of customer.emiSchedule) {
                if (emi.status === 'PENDING' || emi.status === 'OVERDUE') {
                    emi.status = 'PAID';
                    emi.paidAt = new Date();
                    // Optional: Check if amount matches? For now, assume full payment of installment
                    emiUpdated = true;
                    break; // Pay one installment at a time
                }
            }
        } else {
            // Fallback if no schedule exists but payment is made
            // Could add to a separate transaction log, but for EMI lock logic, we focus on unlocking
        }

        // 2. Auto-Unlock Logic
        // If payment is made, we assume the user is now in good standing (at least temporarily)
        // Unlock the device
        customer.isLocked = false;

        // Clear any pending LOCK command, push UNLOCK command to ensure immediate effect
        customer.remoteCommand = {
            command: 'unlock',
            timestamp: new Date()
        };

        // Update paid totals
        customer.paidEmis = (customer.paidEmis || 0) + 1;

        await customer.save();

        res.json({
            success: true,
            message: 'Payment recorded and device unlocked',
            isLocked: false,
            customer: {
                id: customer.id,
                paidEmis: customer.paidEmis,
                isLocked: customer.isLocked
            }
        });

    } catch (err) {
        console.error('Payment Error:', err);
        res.status(500).json({ error: 'Failed to record payment' });
    }
});

module.exports = router;
