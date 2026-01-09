const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(70));
console.log('CHECKING .env FILE FOR DATABASE NAME');
console.log('='.repeat(70) + '\n');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

console.log('📄 File: backend/.env\n');

lines.forEach((line, index) => {
    if (line.startsWith('MONGODB_URI')) {
        console.log(`Line ${index + 1}: ${line.substring(0, 50)}...`);
        console.log('');

        // Check for database name
        if (line.includes('.net/fins_pro?')) {
            console.log('✅ CORRECT: Database name "fins_pro" IS present');
            console.log('   Found: .net/fins_pro?');
        } else if (line.includes('.net/?')) {
            console.log('❌ WRONG: Database name is MISSING');
            console.log('   Found: .net/?');
            console.log('   Should be: .net/fins_pro?');
            console.log('');
            console.log('🔧 FIX NEEDED:');
            console.log('   1. In backend/.env file, find: .net/?');
            console.log('   2. Change to: .net/fins_pro?');
            console.log('   3. Save the file (Ctrl+S)');
        } else {
            console.log('⚠️  UNKNOWN FORMAT');
            console.log('   Please check the connection string format');
        }
    }
});

console.log('\n' + '='.repeat(70) + '\n');
