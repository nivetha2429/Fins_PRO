const mongoose = require('mongoose');
const Customer = require('./models/Customer');
require('dotenv').config();

async function lockCustomer() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const customerId = 'CUS-1767604426064-IODFP';

        await Customer.findOneAndUpdate(
            { id: customerId },
            { isLocked: true }
        );

        console.log(`🔒 LOCKED Customer: ${customerId}`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

lockCustomer();
