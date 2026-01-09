# 🔒 Device Lock Troubleshooting Guide

## Problem: Admin Locked Device But User Can Still Access

### Root Cause
The **User APK** is not properly provisioned or configured, so it cannot:
1. Receive lock commands from the backend
2. Enforce device locks
3. Run the background LockScreenService

---

## ✅ Quick Diagnosis Checklist

Run these commands to diagnose the issue:

```bash
# 1. Check if User APK is installed
adb shell pm list packages | grep securefinance
# Expected: com.securefinance.emilock.user

# 2. Check if app is Device Owner
adb shell dpm list-owners
# Expected: Device owner: ComponentInfo{com.securefinance.emilock.user/...}

# 3. Check if LockScreenService is running
adb shell dumpsys activity services | grep LockScreenService
# Expected: ServiceRecord for LockScreenService

# 4. Check app version
adb shell dumpsys package com.securefinance.emilock.user | grep versionCode
# Expected: versionCode=24 (or higher)

# 5. Check logs for errors
adb logcat -d | grep -E "LockScreenService|DeviceLockModule" | tail -20
```

---

## 🔧 Solutions

### Solution 1: Proper QR Code Provisioning (RECOMMENDED)

This is the **production method** and ensures everything works correctly:

**Steps:**
1. **Factory Reset the Device**
   - Settings → System → Reset → Factory data reset
   - ⚠️ This will erase all data!

2. **Stop at Welcome Screen**
   - Do NOT add any Google accounts
   - Do NOT finish setup
   - Stay on the "Welcome" or "Let's get started" screen

3. **Trigger QR Scanner**
   - Tap **6 times** anywhere on the white space
   - A QR code scanner will appear

4. **Generate QR Code**
   - Login to Admin Dashboard (web or app)
   - Go to "Provision Device" or "Add Customer"
   - Fill in customer details
   - Click "Generate QR Code"

5. **Scan QR Code**
   - Scan the QR code with the device
   - Device will automatically:
     - Download User APK
     - Install as Device Owner
     - Configure SERVER_URL and CUSTOMER_ID
     - Start LockScreenService
     - Lock the device if admin has set isLocked=true

---

### Solution 2: Manual ADB Installation (TESTING ONLY)

⚠️ **Limitations:**
- Cannot set Device Owner if accounts exist
- Requires manual configuration
- Not suitable for production

**Steps:**

1. **Remove All Accounts** (if possible)
```bash
# Check existing accounts
adb shell dumpsys account

# Then manually remove accounts from:
# Settings → Accounts → Remove all accounts
```

2. **Install User APK**
```bash
adb install -r backend/public/downloads/securefinance-user.apk
```

3. **Set as Device Owner**
```bash
adb shell dpm set-device-owner com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver
```

4. **Open the App and Configure**
   - The app should show a setup screen
   - You'll need to scan a QR code or manually enter:
     - Customer ID (from your database)
     - Server URL (https://emi-pro-app.onrender.com)

---

### Solution 3: Build Debug APK for Testing

If you need to test without Device Owner privileges:

```bash
cd mobile-app/android
./gradlew assembleUserDebug
adb install -r app/build/outputs/apk/user/debug/app-user-debug.apk
```

Then you can use `adb shell run-as` to manually set AsyncStorage data.

---

## 🔍 Understanding the Lock Flow

### How Device Locking Works:

1. **Admin Dashboard** → Sets `isLocked: true` in database
2. **User APK LockScreenService** → Polls backend every 3 seconds
3. **Backend API** → Returns `{ isLocked: true }`
4. **FullDeviceLockManager** → Enforces hard kiosk lock
5. **Device** → Completely locked, only emergency calls allowed

### Requirements for Locking:

| Requirement | Why It's Needed |
|-------------|-----------------|
| **User APK Installed** | Enforces the lock |
| **Device Owner** | Grants system-level lock permissions |
| **Provisioned** | Knows which backend to poll |
| **LockScreenService Running** | Monitors lock status |
| **Internet Connection** | Receives lock commands |

---

## 📱 Current Device Status

Based on your device (Samsung SM-M315F):

```
✅ User APK: Installed (v2.0.4)
❌ Device Owner: Not set (has existing accounts)
❌ Provisioned: No (missing enrollment_data)
❌ LockScreenService: Not running
```

**Recommendation:** Factory reset and use QR code provisioning.

---

## 🚀 Quick Test (Without Factory Reset)

If you want to test the lock functionality without Device Owner:

1. **Open the User APK** on the device
2. **Check if it shows a setup screen**
3. **If yes:** Scan QR code from admin dashboard
4. **If no:** The app may already be in "waiting" mode

**Note:** Without Device Owner, the lock will be:
- ✅ Visual lock screen overlay
- ❌ NOT a hard system lock
- ❌ Can be bypassed by power button/home button

---

## 📞 Need Help?

If the device still doesn't lock after provisioning:

1. Check backend logs for the customer's lock status
2. Check device logs: `adb logcat -s LockScreenService:*`
3. Verify the customer ID matches between admin dashboard and device
4. Ensure the device has internet connectivity
5. Check if the backend URL is reachable from the device

