# 🛡️ DEALER MISUSE PREVENTION - FRAUD PROTECTION

## 🎯 THREAT MODEL

### Common Dealer Frauds:
1. **Ghost Customers** - Fake registrations for commission
2. **Device Reselling** - Selling locked devices on black market
3. **Credential Sharing** - Multiple dealers using same account
4. **Duplicate QR Scans** - One QR used for multiple devices
5. **Bypass Attempts** - Dealers helping customers bypass locks
6. **Data Theft** - Stealing customer information
7. **Commission Fraud** - Inflating sales numbers

---

## 🔒 PREVENTION MECHANISMS

### 1️⃣ QR CODE SECURITY

**Single-Use QR Codes (MANDATORY)**

**File**: `QrSecurityManager.java`

```java
package com.securefinance.emilock.security;

import java.security.SecureRandom;
import java.util.Base64;

public class QrSecurityManager {
    
    public static String generateSecureQr(String customerId) {
        // Generate one-time token
        String token = generateToken();
        
        // Store in database with expiry
        storeQrToken(customerId, token, 24); // 24 hour expiry
        
        return token;
    }
    
    private static String generateToken() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
    
    private static void storeQrToken(String customerId, String token, int hoursValid) {
        // Store in database
        // {
        //   customerId: "CUS-xxx",
        //   token: "abc123...",
        //   used: false,
        //   expiresAt: Date,
        //   createdBy: "dealer@example.com"
        // }
    }
}
```

**Backend Validation**:

```javascript
// backend/routes/provisioningRoutes.js
router.get('/payload/:customerId', async (req, res) => {
    const { customerId } = req.params;
    const { token } = req.query;
    
    // Verify token
    const qrToken = await QrToken.findOne({ customerId, token });
    
    if (!qrToken) {
        return res.status(404).json({ error: 'Invalid QR code' });
    }
    
    if (qrToken.used) {
        // FRAUD ALERT: QR already used
        await FraudAlert.create({
            type: 'DUPLICATE_QR_SCAN',
            customerId,
            dealerId: qrToken.createdBy,
            severity: 'HIGH'
        });
        
        return res.status(403).json({ error: 'QR code already used' });
    }
    
    if (new Date() > qrToken.expiresAt) {
        return res.status(410).json({ error: 'QR code expired' });
    }
    
    // Mark as used
    qrToken.used = true;
    qrToken.usedAt = new Date();
    await qrToken.save();
    
    // Generate provisioning payload
    // ...
});
```

---

### 2️⃣ DEALER AUTHENTICATION & TRACKING

**Multi-Factor Authentication**

```javascript
// backend/routes/dealerRoutes.js
router.post('/login', async (req, res) => {
    const { email, password, otp } = req.body;
    
    // 1. Verify password
    const dealer = await Dealer.findOne({ email });
    if (!dealer || !await bcrypt.compare(password, dealer.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // 2. Verify OTP (sent to registered mobile)
    const validOtp = await OtpService.verify(dealer.phone, otp);
    if (!validOtp) {
        return res.status(401).json({ error: 'Invalid OTP' });
    }
    
    // 3. Check device fingerprint
    const deviceId = req.headers['x-device-id'];
    if (!dealer.authorizedDevices.includes(deviceId)) {
        // FRAUD ALERT: Login from unknown device
        await FraudAlert.create({
            type: 'UNKNOWN_DEVICE_LOGIN',
            dealerId: dealer._id,
            deviceId,
            severity: 'MEDIUM'
        });
        
        // Require admin approval
        return res.status(403).json({ 
            error: 'Device not authorized',
            requiresApproval: true
        });
    }
    
    // 4. Generate session token
    const token = jwt.sign({ dealerId: dealer._id }, process.env.JWT_SECRET);
    
    // 5. Log login
    await AuditLog.create({
        dealerId: dealer._id,
        action: 'LOGIN',
        ipAddress: req.ip,
        deviceId
    });
    
    res.json({ token });
});
```

---

### 3️⃣ GHOST CUSTOMER DETECTION

**Behavioral Analysis**

```javascript
// backend/services/fraudDetection.js
class FraudDetectionService {
    
    async detectGhostCustomers(dealerId) {
        const customers = await Customer.find({ createdBy: dealerId });
        
        const suspiciousPatterns = [];
        
        // Pattern 1: Too many registrations in short time
        const recentRegistrations = customers.filter(c => 
            c.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
        );
        
        if (recentRegistrations.length > 10) {
            suspiciousPatterns.push({
                type: 'BULK_REGISTRATION',
                count: recentRegistrations.length,
                severity: 'HIGH'
            });
        }
        
        // Pattern 2: Sequential IMEI numbers (fake devices)
        const imeis = customers.map(c => c.imei1).sort();
        let sequential = 0;
        for (let i = 1; i < imeis.length; i++) {
            if (parseInt(imeis[i]) === parseInt(imeis[i-1]) + 1) {
                sequential++;
            }
        }
        
        if (sequential > 3) {
            suspiciousPatterns.push({
                type: 'SEQUENTIAL_IMEI',
                count: sequential,
                severity: 'CRITICAL'
            });
        }
        
        // Pattern 3: Same phone number for multiple customers
        const phoneNumbers = customers.map(c => c.phone);
        const duplicatePhones = phoneNumbers.filter((phone, index) => 
            phoneNumbers.indexOf(phone) !== index
        );
        
        if (duplicatePhones.length > 0) {
            suspiciousPatterns.push({
                type: 'DUPLICATE_PHONE',
                count: duplicatePhones.length,
                severity: 'HIGH'
            });
        }
        
        // Pattern 4: Devices never connected
        const neverConnected = customers.filter(c => 
            !c.lastHeartbeat && 
            c.createdAt < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );
        
        if (neverConnected.length > 5) {
            suspiciousPatterns.push({
                type: 'DEVICES_NEVER_CONNECTED',
                count: neverConnected.length,
                severity: 'HIGH'
            });
        }
        
        return suspiciousPatterns;
    }
    
    async flagSuspiciousDealer(dealerId, patterns) {
        await FraudAlert.create({
            dealerId,
            patterns,
            status: 'PENDING_REVIEW',
            createdAt: new Date()
        });
        
        // Notify admin
        await notifyAdmin({
            subject: 'Suspicious Dealer Activity Detected',
            dealerId,
            patterns
        });
        
        // Temporarily suspend dealer
        await Dealer.updateOne(
            { _id: dealerId },
            { status: 'SUSPENDED', suspensionReason: 'Fraud investigation' }
        });
    }
}
```

---

### 4️⃣ DEVICE RESELLING DETECTION

**Track Device Lifecycle**

```javascript
// backend/models/DeviceHistory.js
const deviceHistorySchema = new mongoose.Schema({
    imei: { type: String, required: true, index: true },
    events: [{
        type: String, // PROVISIONED, LOCKED, UNLOCKED, FACTORY_RESET
        timestamp: Date,
        customerId: String,
        dealerId: String,
        location: Object
    }]
});

// Detect reselling
async function detectReselling(imei) {
    const history = await DeviceHistory.findOne({ imei });
    
    if (!history) return false;
    
    // Check for multiple provisioning attempts
    const provisionEvents = history.events.filter(e => e.type === 'PROVISIONED');
    
    if (provisionEvents.length > 1) {
        // FRAUD ALERT: Device provisioned multiple times
        const dealers = [...new Set(provisionEvents.map(e => e.dealerId))];
        
        if (dealers.length > 1) {
            // Different dealers = reselling
            await FraudAlert.create({
                type: 'DEVICE_RESELLING',
                imei,
                dealers,
                severity: 'CRITICAL'
            });
            
            return true;
        }
    }
    
    return false;
}
```

---

### 5️⃣ COMMISSION FRAUD PREVENTION

**Verify Device Activation**

```javascript
// backend/services/commissionService.js
class CommissionService {
    
    async calculateCommission(dealerId, month) {
        const customers = await Customer.find({
            createdBy: dealerId,
            createdAt: {
                $gte: new Date(month + '-01'),
                $lt: new Date(month + '-31')
            }
        });
        
        let validCustomers = 0;
        
        for (const customer of customers) {
            // Verify device is actually active
            const isActive = await this.verifyDeviceActive(customer);
            
            if (isActive) {
                validCustomers++;
            } else {
                // Mark as fraudulent
                await FraudAlert.create({
                    type: 'INACTIVE_DEVICE_COMMISSION',
                    customerId: customer.customerId,
                    dealerId,
                    severity: 'MEDIUM'
                });
            }
        }
        
        // Commission only for verified active devices
        const commissionRate = 500; // ₹500 per device
        const totalCommission = validCustomers * commissionRate;
        
        return {
            totalDevices: customers.length,
            validDevices: validCustomers,
            fraudulentDevices: customers.length - validCustomers,
            commission: totalCommission
        };
    }
    
    async verifyDeviceActive(customer) {
        // Device must have:
        // 1. Connected at least once
        if (!customer.lastHeartbeat) return false;
        
        // 2. Heartbeat within last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (customer.lastHeartbeat < sevenDaysAgo) return false;
        
        // 3. Valid IMEI (not sequential/fake)
        if (await this.isFakeImei(customer.imei1)) return false;
        
        return true;
    }
}
```

---

### 6️⃣ CREDENTIAL SHARING DETECTION

**Session Monitoring**

```javascript
// backend/middleware/sessionMonitor.js
async function detectCredentialSharing(req, res, next) {
    const dealerId = req.user.dealerId;
    const currentIp = req.ip;
    const currentDeviceId = req.headers['x-device-id'];
    
    // Get active sessions
    const activeSessions = await Session.find({
        dealerId,
        expiresAt: { $gt: new Date() }
    });
    
    // Check for concurrent sessions from different locations
    const uniqueIps = [...new Set(activeSessions.map(s => s.ipAddress))];
    const uniqueDevices = [...new Set(activeSessions.map(s => s.deviceId))];
    
    if (uniqueIps.length > 2 || uniqueDevices.length > 2) {
        // FRAUD ALERT: Credential sharing
        await FraudAlert.create({
            type: 'CREDENTIAL_SHARING',
            dealerId,
            sessions: activeSessions.length,
            uniqueIps: uniqueIps.length,
            severity: 'HIGH'
        });
        
        // Terminate all sessions
        await Session.deleteMany({ dealerId });
        
        return res.status(403).json({
            error: 'Multiple concurrent sessions detected',
            message: 'Please login again'
        });
    }
    
    next();
}
```

---

### 7️⃣ REAL-TIME FRAUD DASHBOARD

**Admin Monitoring**

```javascript
// backend/routes/fraudMonitoring.js
router.get('/dashboard', adminAuth, async (req, res) => {
    const alerts = await FraudAlert.find({ status: 'PENDING_REVIEW' })
        .populate('dealerId')
        .sort({ createdAt: -1 });
    
    const stats = {
        totalAlerts: alerts.length,
        byType: {},
        bySeverity: {
            CRITICAL: 0,
            HIGH: 0,
            MEDIUM: 0,
            LOW: 0
        },
        suspendedDealers: await Dealer.countDocuments({ status: 'SUSPENDED' })
    };
    
    alerts.forEach(alert => {
        stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
        stats.bySeverity[alert.severity]++;
    });
    
    res.json({ alerts, stats });
});
```

---

## 🚨 AUTOMATED ACTIONS

### Severity-Based Response

```javascript
async function handleFraudAlert(alert) {
    switch (alert.severity) {
        case 'CRITICAL':
            // Immediate suspension
            await Dealer.updateOne(
                { _id: alert.dealerId },
                { status: 'SUSPENDED' }
            );
            
            // Notify admin immediately
            await sendUrgentNotification(alert);
            break;
            
        case 'HIGH':
            // Flag for review
            await Dealer.updateOne(
                { _id: alert.dealerId },
                { flagged: true }
            );
            
            // Notify admin
            await sendNotification(alert);
            break;
            
        case 'MEDIUM':
            // Log and monitor
            await logForMonitoring(alert);
            break;
    }
}
```

---

## ✅ DEALER COMPLIANCE CHECKLIST

Before approving dealer:

- [ ] KYC documents verified
- [ ] Business license validated
- [ ] Bank account verified
- [ ] Physical address confirmed
- [ ] References checked
- [ ] Training completed
- [ ] Agreement signed
- [ ] Device fingerprint registered
- [ ] MFA enabled

---

## 📊 FRAUD METRICS TO TRACK

| Metric | Threshold | Action |
|--------|-----------|--------|
| Registrations per day | > 10 | Flag for review |
| Sequential IMEIs | > 3 | Suspend dealer |
| Duplicate phones | > 2 | Investigate |
| Devices never connected | > 30% | Suspend commission |
| Concurrent sessions | > 2 | Force logout |
| Failed login attempts | > 5 | Lock account |

---

**Dealer fraud prevention protects business revenue and customer trust.**
