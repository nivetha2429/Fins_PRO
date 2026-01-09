require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const fs = require('fs');

const output = [];
const log = (msg) => {
    console.log(msg);
    output.push(msg);
};

log('\n🔍 MongoDB Connection Diagnostics\n');
log('='.repeat(60));

// Check if MONGODB_URI exists
if (!process.env.MONGODB_URI) {
    log('❌ ERROR: MONGODB_URI not found in .env file!');
    process.exit(1);
}

// Parse and display connection details (hide password)
const uri = process.env.MONGODB_URI;
const hiddenUri = uri.replace(/:[^:@]+@/, ':****@');
log('📍 Connection String: ' + hiddenUri);

// Extract database name from URI
const dbMatch = uri.match(/\.net\/([^?]+)/);
const dbName = dbMatch ? dbMatch[1] : '';
log('📊 Database Name in URI: ' + (dbName || 'NOT SPECIFIED'));

if (!dbName || dbName === '') {
    log('\n⚠️  WARNING: Database name is MISSING from connection string!');
    log('   Current: mongodb+srv://user:pass@cluster.mongodb.net/?options');
    log('   Should be: mongodb+srv://user:pass@cluster.mongodb.net/fins_pro?options');
    log('   \n   👉 Add "/fins_pro" before the "?" in your MONGODB_URI\n');
}

log('='.repeat(60));
log('\n🔌 Attempting connection...\n');

mongoose.connect(uri)
    .then(() => {
        log('✅ MongoDB Connected Successfully!\n');
        log('Connection Details:');
        log('  - Database: ' + mongoose.connection.db.databaseName);
        log('  - Host: ' + mongoose.connection.host);
        log('  - Ready State: ' + mongoose.connection.readyState + ' (1 = connected)');

        log('\n📁 Checking collections...');
        return mongoose.connection.db.listCollections().toArray();
    })
    .then(collections => {
        if (collections.length === 0) {
            log('  ℹ️  No collections yet (database is empty)');
            log('  ℹ️  Collections will be created when you add your first customer\n');
        } else {
            log('  Collections found: ' + collections.map(c => c.name).join(', '));
        }

        log('='.repeat(60));
        log('✅ Diagnostic Complete!\n');

        // Write to file
        fs.writeFileSync(__dirname + '/mongodb-diagnostic-report.txt', output.join('\n'));
        log('📄 Full report saved to: backend/mongodb-diagnostic-report.txt\n');

        process.exit(0);
    })
    .catch(err => {
        log('\n❌ MongoDB Connection Failed!\n');
        log('Error Type: ' + err.name);
        log('Error Message: ' + err.message);

        if (err.message.includes('authentication')) {
            log('\n💡 Tip: Check your username and password');
        } else if (err.message.includes('network')) {
            log('\n💡 Tip: Check internet connection and IP whitelist');
        }

        log('\n' + '='.repeat(60) + '\n');
        fs.writeFileSync(__dirname + '/mongodb-diagnostic-report.txt', output.join('\n'));
        process.exit(1);
    });
