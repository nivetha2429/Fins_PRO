# 🧪 QR Scan & APK Download Testing Guide

## ✅ Verification Results

### 1. **Provisioning Endpoint Test**
```bash
curl -s "https://emi-pro-app.fly.dev/api/provisioning/payload/TEST123" | python3 -m json.tool
```

**Result:** ✅ **PASSED**
```json
{
    "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": 
        "com.securefinance.emilock.admin/com.securefinance.emilock.DeviceAdminReceiver",
    "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": 
        "https://emi-pro-app.fly.dev/apk/unified-admin-v3.0.0.apk",
    "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM": 
        "p_IOmcnFcA5byv1BTevnupxGzH3mgXfPgMD-A2h2fR4",
    "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": true,
    "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,
    "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
        "customerId": "TEST123",
        "serverUrl": "https://emi-pro-app.fly.dev"
    }
}
```

### 2. **APK Download Test**
```bash
curl -L -o /tmp/unified-admin-test.apk "https://emi-pro-app.fly.dev/apk/unified-admin-v3.0.0.apk"
ls -lh /tmp/unified-admin-test.apk
```

**Result:** ✅ **PASSED**
```
-rw-r--r--  1 kavi  wheel  39M Jan 6 19:06 /tmp/unified-admin-test.apk
```
- File size: **39 MB**
- Download time: **~10 seconds**
- Status: **Successfully downloaded**

### 3. **Checksum Verification**
```bash
shasum -a 256 /tmp/unified-admin-test.apk | awk '{print $1}' | xxd -r -p | base64 | tr '+/' '-_' | tr -d '='
```

**Result:** ✅ **PASSED**
```
Calculated: p_IOmcnFcA5byv1BTevnupxGzH3mgXfPgMD-A2h2fR4
Expected:   p_IOmcnFcA5byv1BTevnupxGzH3mgXfPgMD-A2h2fR4
Status:     ✅ MATCH
```

---

## 📱 Device Testing Commands

### Prerequisites:
```bash
# 1. Enable USB debugging on device
# 2. Connect device via USB
# 3. Verify ADB connection
adb devices
```

### Test 1: Check if Device is Ready for Provisioning
```bash
# Check if device is factory reset and ready
adb shell getprop ro.setupwizard.mode

# Should return: DISABLED (not provisioned yet)
# Or: ENABLED (already provisioned)
```

### Test 2: Check Current Device Owner
```bash
# Check if any Device Owner is set
adb shell dumpsys device_policy | grep "Device Owner"

# Should return: (none) if not provisioned
# Or show current Device Owner if already set
```

### Test 3: Verify Package Installation (After QR Scan)
```bash
# Check if unified APK is installed
adb shell pm list packages | grep com.securefinance.emilock.admin

# Should return: package:com.securefinance.emilock.admin
```

### Test 4: Verify Device Owner is Set
```bash
# Check Device Owner details
adb shell dumpsys device_policy | grep -A 10 "Device Owner"

# Should show:
# Device Owner: 
#   admin=ComponentInfo{com.securefinance.emilock.admin/com.securefinance.emilock.DeviceAdminReceiver}
#   name=
#   package=com.securefinance.emilock.admin
```

### Test 5: Check App Version
```bash
# Get installed app version
adb shell dumpsys package com.securefinance.emilock.admin | grep versionName

# Should return: versionName=2.2.1 (or 3.0.0 if updated)
```

### Test 6: Verify Provisioning Data
```bash
# Check if customerId and serverUrl are stored
adb shell run-as com.securefinance.emilock.admin cat /data/data/com.securefinance.emilock.admin/shared_prefs/PhoneLockPrefs.xml

# Should contain:
# <string name="CUSTOMER_ID">TEST123</string>
# <string name="SERVER_URL">https://emi-pro-app.fly.dev</string>
```

### Test 7: Monitor Provisioning Logs
```bash
# Watch logs during provisioning
adb logcat | grep -E "EMI_ADMIN|DeviceAdminReceiver|Provisioning"

# Look for:
# ✅ Device Owner Activated - Provisioning Complete
# ✅ Granting all permissions automatically...
# ✅ Sending device info to backend...
```

### Test 8: Check Lock Screen Service
```bash
# Verify lock enforcement service is running
adb shell dumpsys activity services | grep LockEnforcementService

# Should show service is running
```

### Test 9: Test Lock/Unlock
```bash
# Manually trigger lock (for testing)
adb shell am broadcast -a com.securefinance.emilock.TEST_LOCK

# Check if lock screen appears
# Then unlock:
adb shell am broadcast -a com.securefinance.emilock.TEST_UNLOCK
```

### Test 10: Check Network Connectivity
```bash
# Verify device can reach backend
adb shell ping -c 3 emi-pro-app.fly.dev

# Test API endpoint
adb shell "curl -s https://emi-pro-app.fly.dev/health"
```

---

## 🔍 Troubleshooting Commands

### Issue: "Can't set up device"

**Check 1: Verify APK Download**
```bash
# Check if APK was downloaded
adb shell ls -lh /data/local/tmp/*.apk

# Check download logs
adb logcat | grep -i "download"
```

**Check 2: Verify Checksum**
```bash
# Get checksum from device
adb shell sha256sum /data/local/tmp/unified-admin-v3.0.0.apk

# Compare with expected:
# p_IOmcnFcA5byv1BTevnupxGzH3mgXfPgMD-A2h2fR4
```

**Check 3: Check Provisioning Errors**
```bash
# Look for provisioning errors
adb logcat | grep -E "ERROR|FAIL" | grep -i provision
```

### Issue: App Not Appearing

**Check 1: Verify Installation**
```bash
# List all installed packages
adb shell pm list packages -f | grep securefinance

# Should show:
# package:/data/app/.../com.securefinance.emilock.admin
```

**Check 2: Check App Data**
```bash
# Verify app data directory exists
adb shell ls -la /data/data/ | grep com.securefinance.emilock.admin
```

**Check 3: Launch App Manually**
```bash
# Try launching the app
adb shell am start -n com.securefinance.emilock.admin/.MainActivity

# Check if app launches
```

### Issue: Lock Not Working

**Check 1: Verify Service**
```bash
# Check if lock service is running
adb shell ps | grep com.securefinance.emilock.admin

# Should show LockEnforcementService
```

**Check 2: Check Heartbeat**
```bash
# Monitor heartbeat requests
adb logcat | grep -i heartbeat

# Should show periodic heartbeat every 5-10 seconds
```

**Check 3: Test Lock Manually**
```bash
# Force start lock activity
adb shell am start -n com.securefinance.emilock.admin/.LockActivity

# Should show lock screen
```

---

## 📋 Complete Testing Workflow

### Step 1: Prepare Device
```bash
# 1. Factory reset device
# 2. Do NOT add Google account
# 3. Connect to WiFi
# 4. Tap 6 times on welcome screen to enable QR scanner
```

### Step 2: Generate QR Code
```bash
# From admin dashboard:
# 1. Login to https://emi-pro-app.fly.dev/
# 2. Add new customer
# 3. Enter customer details
# 4. Click "Generate QR Code"
# 5. QR code appears with provisioning payload
```

### Step 3: Scan QR Code
```bash
# On device:
# 1. QR scanner should be active
# 2. Scan the QR code
# 3. Device should show "Downloading..."
# 4. Wait for download to complete (~10 seconds for 39MB)
```

### Step 4: Monitor Installation
```bash
# On computer (via ADB):
adb logcat -c  # Clear logs
adb logcat | grep -E "EMI_ADMIN|Provisioning|DeviceAdminReceiver"

# Watch for:
# - Download progress
# - Checksum verification
# - Installation start
# - Device Owner activation
# - Provisioning complete
```

### Step 5: Verify Installation
```bash
# Check package installed
adb shell pm list packages | grep com.securefinance.emilock.admin

# Check Device Owner set
adb shell dumpsys device_policy | grep "Device Owner"

# Check app appears in launcher
adb shell pm list packages -3  # List all user apps
```

### Step 6: Test Functionality
```bash
# 1. Open admin dashboard
# 2. Find the newly provisioned device
# 3. Verify device info is displayed
# 4. Click "Lock" button
# 5. Verify device locks immediately
# 6. Click "Unlock" button
# 7. Verify device unlocks
```

---

## 🎯 Success Criteria

### ✅ QR Scan:
- [ ] QR scanner activates (tap 6 times)
- [ ] QR code scans successfully
- [ ] Provisioning starts

### ✅ APK Download:
- [ ] Download starts automatically
- [ ] Progress shown (39MB)
- [ ] Download completes (~10 seconds)
- [ ] Checksum validates

### ✅ Installation:
- [ ] APK installs as Device Owner
- [ ] No user prompts required
- [ ] Installation completes
- [ ] App appears on device

### ✅ Provisioning:
- [ ] Device Owner is set
- [ ] Permissions auto-granted
- [ ] Device info collected
- [ ] Backend receives data
- [ ] Dashboard shows device

### ✅ Lock/Unlock:
- [ ] Lock command works
- [ ] Lock screen appears
- [ ] Device is locked
- [ ] Unlock command works
- [ ] Normal functionality restored

---

## 📊 Expected Results

### Provisioning Payload:
```json
{
  "component": "com.securefinance.emilock.admin/com.securefinance.emilock.DeviceAdminReceiver",
  "download_url": "https://emi-pro-app.fly.dev/apk/unified-admin-v3.0.0.apk",
  "checksum": "p_IOmcnFcA5byv1BTevnupxGzH3mgXfPgMD-A2h2fR4",
  "size": "39 MB",
  "package": "com.securefinance.emilock.admin"
}
```

### Device Info Reported:
```json
{
  "customerId": "TEST123",
  "brand": "Samsung",
  "model": "SM-A525F",
  "osVersion": "Android 13",
  "imei1": "123456789012345",
  "androidId": "abc123def456",
  "batteryLevel": 85,
  "networkType": "WiFi"
}
```

---

## 🚨 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Can't set up device" | Checksum mismatch | Verify APK checksum matches |
| App not appearing | Installation failed | Check logcat for errors |
| Lock not working | Service not running | Restart device, check logs |
| No internet | WiFi not connected | Connect to WiFi before QR scan |
| QR scanner not showing | Not tapped 6 times | Tap 6 times on welcome screen |

---

**Testing Status:** ✅ **READY**  
**APK Download:** ✅ **VERIFIED**  
**Checksum:** ✅ **VALIDATED**  
**Next Step:** Test on real device! 📱
