const mongoose = require('mongoose');
const Customer = require('./models/Customer');
require('dotenv').config();

async function checkStatus() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const customers = await Customer.find({}).select('id name isLocked deviceStatus');

        console.log('📊 CUSTOMER STATUS REPORT');
        console.log('========================\n');

        customers.forEach(c => {
            console.log(`ID: ${c.id}`);
            console.log(`Name: ${c.name}`);
            console.log(`Lock Status: ${c.isLocked ? '🔒 LOCKED' : '🔓 UNLOCKED'}`);
            console.log(`Device Status: ${c.deviceStatus?.status || 'N/A'}`);
            console.log(`Last Seen: ${c.deviceStatus?.lastSeen || 'Never'}`);
            console.log('---');
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkStatus();
