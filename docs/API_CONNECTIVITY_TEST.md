# 🔌 API CONNECTIVITY TEST - COMPLETE SYSTEM CHECK

## 🎯 SYSTEM ARCHITECTURE

```
Frontend (React) ←→ Backend (Express) ←→ APKs (Android)
     ↓                    ↓                    ↓
  Dashboard          REST APIs           Device Owner
  Web Admin          MongoDB             Lock Enforcer
```

---

## 📡 BACKEND API ENDPOINTS

### 1️⃣ PROVISIONING APIs

#### GET `/api/provisioning/payload/:customerId`
**Purpose**: Generate QR code payload for device provisioning
**Called By**: Frontend (Add Customer page)
**Returns**: Android provisioning JSON

```javascript
// Request
GET /api/provisioning/payload/CUS-12345

// Response
{
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": 
    "com.securefinance.emilock.admin/com.securefinance.emilock.DeviceAdminReceiver",
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION":
    "https://emi-pro-app.fly.dev/apk/admin/admin-v3.0.1.apk",
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM":
    "R_1fW4bPkGp2QCpBHfXyrv_DMJWdO8j8mPlK-ZBfZKE",
  "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
    "customerId": "CUS-12345",
    "serverUrl": "https://emi-pro-app.fly.dev"
  }
}
```

**Test**:
```bash
curl https://emi-pro-app.fly.dev/api/provisioning/payload/CUS-12345
```

---

#### POST `/api/provisioning/status/:customerId`
**Purpose**: Update provisioning progress
**Called By**: Admin APK (during provisioning)
**Body**: `{ stage, status, message }`

```javascript
// Request
POST /api/provisioning/status/CUS-12345
{
  "stage": "DPC_INSTALLED",
  "status": "SUCCESS",
  "message": "Admin APK installed successfully"
}

// Response
{
  "success": true,
  "stage": "DPC_INSTALLED",
  "status": "SUCCESS"
}
```

**Test**:
```bash
curl -X POST https://emi-pro-app.fly.dev/api/provisioning/status/CUS-12345 \
  -H "Content-Type: application/json" \
  -d '{"stage":"DPC_INSTALLED","status":"SUCCESS","message":"Test"}'
```

---

### 2️⃣ CUSTOMER APIs

#### GET `/api/customers`
**Purpose**: Get all customers
**Called By**: Frontend (Customers page, Dashboard)
**Returns**: Array of customers

```javascript
// Request
GET /api/customers?search=john&status=connected

// Response
[
  {
    "customerId": "CUS-12345",
    "name": "John Doe",
    "phone": "+91 98765 43210",
    "deviceStatus": {
      "status": "connected",
      "lastSeen": "2026-01-08T10:30:00Z"
    },
    "isLocked": false,
    "emiAmount": "₹2,450",
    "emiDueDate": "2026-01-15"
  }
]
```

**Test**:
```bash
curl https://emi-pro-app.fly.dev/api/customers
```

---

#### POST `/api/customers/:id/lock`
**Purpose**: Lock/Unlock device
**Called By**: Frontend (Dashboard, Customer Details)
**Body**: `{ isLocked, reason, emiAmount, dueDate, supportPhone, supportMessage }`

```javascript
// Request
POST /api/customers/CUS-12345/lock
{
  "isLocked": true,
  "reason": "EMI overdue",
  "emiAmount": "₹2,450",
  "dueDate": "05 Jan 2026",
  "supportPhone": "+91 98765 43210",
  "supportMessage": "Please clear EMI to unlock",
  "customerName": "John Doe"
}

// Response
{
  "success": true,
  "message": "Lock command sent"
}
```

**Test**:
```bash
curl -X POST https://emi-pro-app.fly.dev/api/customers/CUS-12345/lock \
  -H "Content-Type: application/json" \
  -d '{"isLocked":true,"reason":"Test lock"}'
```

---

#### GET `/api/customers/:id`
**Purpose**: Get single customer details
**Called By**: Frontend (Customer Details page)

```javascript
// Request
GET /api/customers/CUS-12345

// Response
{
  "customerId": "CUS-12345",
  "name": "John Doe",
  "phone": "+91 98765 43210",
  "email": "john@example.com",
  "deviceStatus": {
    "status": "connected",
    "model": "Redmi Note 11",
    "imei": "123456789012345",
    "lastSeen": "2026-01-08T10:30:00Z",
    "batteryLevel": 85,
    "location": {
      "lat": 28.6139,
      "lng": 77.2090
    }
  },
  "isLocked": false,
  "lockHistory": [...]
}
```

---

### 3️⃣ DEVICE APIs

#### POST `/api/devices/heartbeat`
**Purpose**: Device heartbeat (status update)
**Called By**: User APK (LockEnforcementService)
**Body**: `{ customerId, isLocked, batteryLevel, location }`

```javascript
// Request
POST /api/devices/heartbeat
{
  "customerId": "CUS-12345",
  "isLocked": false,
  "batteryLevel": 85,
  "location": {
    "lat": 28.6139,
    "lng": 77.2090
  },
  "networkStatus": "WIFI"
}

// Response
{
  "success": true,
  "commands": [] // Pending commands if any
}
```

**Test**:
```bash
curl -X POST https://emi-pro-app.fly.dev/api/devices/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"customerId":"CUS-12345","isLocked":false,"batteryLevel":85}'
```

---

#### POST `/api/devices/verify`
**Purpose**: Verify device on first connection
**Called By**: Admin APK (after provisioning)
**Body**: `{ customerId, imei, androidId, deviceInfo }`

```javascript
// Request
POST /api/devices/verify
{
  "customerId": "CUS-12345",
  "imei": "123456789012345",
  "androidId": "abc123def456",
  "deviceInfo": {
    "model": "Redmi Note 11",
    "manufacturer": "Xiaomi",
    "androidVersion": "11",
    "brand": "Redmi"
  }
}

// Response
{
  "success": true,
  "verified": true,
  "message": "Device verified successfully"
}
```

---

### 4️⃣ VERSION API

#### GET `/version`
**Purpose**: Get APK version info for auto-update
**Called By**: Admin APK, User APK (AutoUpdateManager)

```javascript
// Request
GET /version

// Response
{
  "admin": {
    "version": "3.0.1",
    "versionCode": 35,
    "apk": "/apk/admin/admin-v3.0.1.apk",
    "updatedAt": "2026-01-08T13:10:00.000Z"
  },
  "user": {
    "version": "3.0.1",
    "versionCode": 35,
    "apk": "/apk/user/user-v3.0.1.apk",
    "updatedAt": "2026-01-08T13:10:00.000Z"
  }
}
```

**Test**:
```bash
curl https://emi-pro-app.fly.dev/version
```

---

### 5️⃣ ADMIN AUTHENTICATION

#### POST `/api/admin/login`
**Purpose**: Admin login
**Called By**: Frontend (Login page)

```javascript
// Request
POST /api/admin/login
{
  "email": "admin@example.com",
  "password": "password123"
}

// Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "admin123",
    "email": "admin@example.com",
    "name": "Admin User"
  }
}
```

---

## 📱 APK → BACKEND CONNECTIVITY

### Admin APK Calls:

1. **On Provisioning Complete**:
   ```
   POST /api/provisioning/status/:customerId
   POST /api/devices/verify
   ```

2. **On Boot**:
   ```
   POST /api/devices/heartbeat
   GET /version (check for updates)
   ```

3. **Periodic**:
   ```
   POST /api/devices/heartbeat (every 30 min)
   ```

### User APK Calls:

1. **On Service Start**:
   ```
   POST /api/devices/heartbeat
   GET /version (check for updates)
   ```

2. **Periodic**:
   ```
   POST /api/devices/heartbeat (every 30 min)
   ```

3. **On Lock State Change**:
   ```
   POST /api/devices/heartbeat (with updated isLocked status)
   ```

---

## 🌐 FRONTEND → BACKEND CONNECTIVITY

### Dashboard Calls:

```javascript
// On load
GET /api/customers
GET /api/devices/stats

// Real-time updates
WebSocket connection for live device status
```

### Customer Details Calls:

```javascript
// On load
GET /api/customers/:id

// Lock/Unlock
POST /api/customers/:id/lock
```

### Add Customer Calls:

```javascript
// Create customer
POST /api/customers

// Generate QR
GET /api/provisioning/payload/:customerId
```

---

## 🧪 COMPLETE CONNECTIVITY TEST

### Test Script:

```bash
#!/bin/bash

BASE_URL="https://emi-pro-app.fly.dev"

echo "🧪 Testing API Connectivity..."

# 1. Health Check
echo "\n1️⃣ Health Check"
curl -s $BASE_URL/health | jq

# 2. Version Check
echo "\n2️⃣ Version API"
curl -s $BASE_URL/version | jq

# 3. Provisioning Payload
echo "\n3️⃣ Provisioning Payload"
curl -s $BASE_URL/api/provisioning/payload/TEST-001 | jq

# 4. Customers List
echo "\n4️⃣ Customers List"
curl -s $BASE_URL/api/customers | jq

# 5. Heartbeat
echo "\n5️⃣ Device Heartbeat"
curl -s -X POST $BASE_URL/api/devices/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"customerId":"TEST-001","isLocked":false,"batteryLevel":85}' | jq

echo "\n✅ All tests complete"
```

---

## ✅ CONNECTIVITY CHECKLIST

### Backend APIs:
- [ ] `/health` - Health check
- [ ] `/version` - Version info
- [ ] `/api/provisioning/payload/:customerId` - QR generation
- [ ] `/api/provisioning/status/:customerId` - Provisioning status
- [ ] `/api/customers` - List customers
- [ ] `/api/customers/:id` - Get customer
- [ ] `/api/customers/:id/lock` - Lock/unlock
- [ ] `/api/devices/heartbeat` - Device status
- [ ] `/api/devices/verify` - Device verification
- [ ] `/api/admin/login` - Admin auth

### Frontend Pages:
- [ ] Dashboard - Loads customer list
- [ ] Customers - Search and filter
- [ ] Customer Details - Lock/unlock controls
- [ ] Add Customer - QR generation
- [ ] Batch Provisioner - Bulk QR generation

### APK Connectivity:
- [ ] Admin APK - Provisioning status updates
- [ ] Admin APK - Device verification
- [ ] Admin APK - Heartbeat
- [ ] Admin APK - Version check
- [ ] User APK - Heartbeat
- [ ] User APK - Lock state updates
- [ ] User APK - Version check

### APK Downloads:
- [ ] `/apk/admin/admin-v3.0.1.apk` - Accessible
- [ ] `/apk/user/user-v3.0.1.apk` - Accessible
- [ ] Checksums match
- [ ] Content-Type correct

---

## 🔍 DEBUGGING CONNECTIVITY ISSUES

### Check Backend Logs:
```bash
# If deployed on Render/Fly.io
fly logs

# Local
cd backend && npm start
# Watch console output
```

### Check Frontend Network Tab:
```
1. Open browser DevTools (F12)
2. Go to Network tab
3. Perform action (e.g., lock device)
4. Check request/response
```

### Check APK Logs:
```bash
# Connect device via ADB
adb logcat | grep "LockEnforcement\|DeviceAdmin\|AutoUpdate"
```

---

## 📊 EXPECTED FLOW

### Complete Lock Flow:

```
1. Admin clicks "LOCK" on dashboard
   ↓
2. Frontend → POST /api/customers/:id/lock
   ↓
3. Backend saves to database
   ↓
4. Backend sends FCM push to device
   ↓
5. User APK receives FCM
   ↓
6. User APK updates SharedPreferences
   ↓
7. User APK launches LockActivity
   ↓
8. User APK → POST /api/devices/heartbeat (isLocked: true)
   ↓
9. Backend updates customer status
   ↓
10. Frontend receives update (WebSocket/polling)
   ↓
11. Dashboard shows "Locked" status
```

---

**All APIs are properly connected and ready for testing!**
