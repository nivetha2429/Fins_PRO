require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');

console.log('🔍 Testing MongoDB Connection...');
console.log('📍 Connection String:', process.env.MONGODB_URI?.replace(/:[^:@]+@/, ':****@')); // Hide password

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB Connected Successfully!');
        console.log('📊 Database Name:', mongoose.connection.db.databaseName);
        console.log('🌐 Host:', mongoose.connection.host);

        // List collections
        mongoose.connection.db.listCollections().toArray()
            .then(collections => {
                console.log('📁 Collections:', collections.map(c => c.name).join(', ') || 'None (database is empty)');
                process.exit(0);
            });
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Failed!');
        console.error('Error:', err.message);
        process.exit(1);
    });
