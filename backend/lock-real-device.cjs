const mongoose = require('mongoose');
const Customer = require('./models/Customer');
require('dotenv').config({ path: './.env' });

const TARGET_IMEI = '860387043400076';
const DEALER_ID = '6958321160a9de327d61273d'; // Super Admin ID

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log(`🔍 Searching for device with IMEI: ${TARGET_IMEI}`);
        let customer = await Customer.findOne({
            $or: [
                { imei1: TARGET_IMEI },
                { imei2: TARGET_IMEI }
            ]
        });

        if (!customer) {
            console.log('⚠️  Customer not found. Creating new record for this IMEI...');
            customer = new Customer({
                id: 'IMEI_' + TARGET_IMEI,
                name: 'Real Device (Manual Lock)',
                phoneNo: '0000000000',
                imei1: TARGET_IMEI,
                dealerId: DEALER_ID,
                isLocked: false,
                deviceStatus: {
                    status: 'connected',
                    technical: {
                        model: 'Unknown Real Device'
                    }
                }
            });
        } else {
            console.log(`✅ Found existing customer: ${customer.name} (${customer.id})`);
        }

        // Force Lock
        customer.isLocked = true;
        customer.lockMessage = "DEVICE LOCKED BY ADMIN - CALL SUPPORT";
        customer.lockReason = "Manual Force Lock via Script";

        await customer.save();

        console.log('-------------------------------------------');
        console.log(`🔒 LOCK APPLIED FOR IMEI: ${TARGET_IMEI}`);
        console.log(`🔹 Database ID: ${customer.id}`);
        console.log(`🔹 Lock Status: TRUE`);
        console.log(`🔹 Message: ${customer.lockMessage}`);
        console.log('-------------------------------------------');
        console.log('Make sure the device is sending Heartbeats to the server.');

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
