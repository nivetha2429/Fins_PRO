require('dotenv').config({ path: __dirname + '/.env' });

console.log('\n📋 Current .env Configuration Check\n');
console.log('='.repeat(60));

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.log('❌ MONGODB_URI is not set in .env file!');
    process.exit(1);
}

// Hide password
const hiddenUri = uri.replace(/:[^:@]+@/, ':****@');
console.log('Current MONGODB_URI:');
console.log(hiddenUri);
console.log('');

// Check if database name is present
const hasDbName = uri.includes('.net/') && !uri.includes('.net/?');
const dbMatch = uri.match(/\.net\/([^?]+)/);
const dbName = dbMatch ? dbMatch[1] : '';

console.log('Database Name Found:', dbName || '❌ MISSING');
console.log('');

if (!hasDbName || !dbName) {
    console.log('⚠️  ISSUE: Database name is still missing!');
    console.log('');
    console.log('Your current URI has:');
    console.log('  .net/? (missing database name)');
    console.log('');
    console.log('It should have:');
    console.log('  .net/fins_pro? (with database name)');
    console.log('');
    console.log('Please update line 1 of backend/.env file:');
    console.log('');
    console.log('CHANGE FROM:');
    console.log('mongodb+srv://nivetha:1402@cluster0.irgkzqa.mongodb.net/?retryWrites...');
    console.log('');
    console.log('CHANGE TO:');
    console.log('mongodb+srv://nivetha:1402@cluster0.irgkzqa.mongodb.net/fins_pro?retryWrites...');
    console.log('');
    console.log('Then save the file (Ctrl+S)');
} else {
    console.log('✅ Database name is correctly set to:', dbName);
    console.log('✅ Configuration looks good!');
}

console.log('='.repeat(60) + '\n');
