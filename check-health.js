import https from 'https';

const BASE_URL = 'https://emi-pro-app.fly.dev';

// Helper for requests
const request = (path, method = 'GET', body = null, headers = {}) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'emi-pro-app.fly.dev',
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
};

async function checkSystem() {
    console.log('\n🔍 EMI-PRO SYSTEM HEALTH CHECK');
    console.log('=============================\n');

    // 1. Check Backend Connectivity
    process.stdout.write('1. Connecting to Backend... ');
    try {
        const health = await request('/healthz');
        if (health.status === 200) {
            console.log('✅ ONLINE');
        } else {
            console.log('❌ FAILED (Status: ' + health.status + ')');
        }
    } catch (e) {
        console.log('❌ FAILED (' + e.message + ')');
    }

    // 2. Check Database (via Login)
    process.stdout.write('2. Checking Database (Login)... ');
    let token = null;
    try {
        const login = await request('/api/admin/login', 'POST', {
            email: 'admin@lock.com',
            passcode: '1234'
        });

        if (login.status === 200) {
            console.log('✅ CONNECTED');
            const data = JSON.parse(login.body);
            token = data.token;
        } else {
            console.log('❌ FAILED (Login Invalid)');
            console.log('   Note: Ensure admin@lock.com / 1234 are correct credentials.');
            return; // Cannot proceed without token
        }
    } catch (e) {
        console.log('❌ ERROR (' + e.message + ')');
        return;
    }

    // 3. Check Mobile Connectivity (Active Devices)
    process.stdout.write('3. Checking Mobile Devices... ');
    try {
        const customersRes = await request('/api/customers', 'GET', null, {
            'Authorization': `Bearer ${token}`
        });

        if (customersRes.status === 200) {
            const customers = JSON.parse(customersRes.body);
            const total = customers.length;

            // Allow 15 minute window for "Online"
            const ONLINE_THRESHOLD = 15 * 60 * 1000;
            const now = new Date();

            const activeDevices = customers.filter(c => {
                if (!c.deviceStatus?.lastSeen) return false;
                const lastSeen = new Date(c.deviceStatus.lastSeen);
                return (now - lastSeen) < ONLINE_THRESHOLD;
            });

            console.log('✅ READ SUCCESS');
            console.log(`   - Total Devices in DB: ${total}`);
            console.log(`   - Currently Online:    ${activeDevices.length}`);

            if (activeDevices.length > 0) {
                console.log(`   - Last Active: ${activeDevices[0].name} (${new Date(activeDevices[0].deviceStatus.lastSeen).toLocaleTimeString()})`);
            } else if (total > 0) {
                console.log('   ⚠️  No devices active in last 15 mins.');
            }

        } else {
            console.log('❌ FAILED (Status: ' + customersRes.status + ')');
        }
    } catch (e) {
        console.log('❌ ERROR (' + e.message + ')');
    }
    console.log('\n=============================');
}

checkSystem();
