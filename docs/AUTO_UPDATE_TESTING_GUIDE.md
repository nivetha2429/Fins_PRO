# 🔄 AUTO-UPDATE TESTING GUIDE

## 📊 CURRENT STATUS

### Installed Versions (On Device)
- **User APK:** v2.0.4 (versionCode 24)
- **Admin APK:** v2.0.4 (versionCode 24)

### Server Versions (Local)
- **User APK:** v2.0.5 (versionCode 25) ✅ **UPDATE AVAILABLE**
- **Admin APK:** v2.0.4 (versionCode 24)

### Auto-Update Status
- ✅ **LockScreenService:** Running
- ✅ **Auto-Update:** Enabled (checks every 1 hour)
- ⚠️ **Provisioning:** User APK is NOT provisioned (no SERVER_URL)

---

## ⚠️ CRITICAL ISSUE

**The User APK auto-update will NOT work because:**
1. User APK is **not provisioned** (no SERVER_URL/CUSTOMER_ID)
2. AutoUpdateManager requires SERVER_URL to check for updates
3. LockScreenService is running but has no config

**Solution:** Provision the User APK via QR code or manually

---

## 🧪 HOW TO TEST AUTO-UPDATE

### Method 1: Provision Device First (REQUIRED)

**Step 1: Provision User APK**
```bash
# Option A: QR Provisioning (Recommended)
# 1. Factory reset device
# 2. Scan QR from admin dashboard
# 3. Device auto-provisions

# Option B: Manual Provisioning (For testing)
# Remove accounts from device, then:
adb shell dpm set-device-owner com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver
```

**Step 2: Verify Provisioning**
```bash
# Check Device Owner
adb shell dpm list-owners
# Expected: com.securefinance.emilock.user/.DeviceAdminReceiver

# Check if service has config
adb logcat | grep "LockScreenService"
# Should show: SERVER_URL and CUSTOMER_ID loaded
```

**Step 3: Wait for Auto-Update (or Trigger Manually)**
```bash
# Option A: Wait (1 hour)
# AutoUpdateManager checks every 1 hour

# Option B: Trigger manually
# Open User APK on device
# Tap "Apply Security Update" button

# Option C: Watch logs
adb logcat | grep "AutoUpdateManager"
```

---

### Method 2: Manual Update (Without Provisioning)

If you just want to update the APK without testing auto-update:

```bash
# Install new version manually
adb install -r backend/public/downloads/securefinance-user.apk

# Verify new version
adb shell dumpsys package com.securefinance.emilock.user | grep versionCode
# Should show: versionCode=25
```

---

## 📋 AUTO-UPDATE FLOW (How It Works)

### 1. LockScreenService Starts
```java
// On app launch or boot
startForegroundService(new Intent(this, LockScreenService.class));
```

### 2. Service Loads Config
```java
SharedPreferences prefs = getSharedPreferences("PhoneLockPrefs", MODE_PRIVATE);
String serverUrl = prefs.getString("SERVER_URL", null);
String customerId = prefs.getString("CUSTOMER_ID", null);
```

### 3. Service Checks for Updates (Every 1 Hour)
```java
if (currentTime - lastUpdateCheck > UPDATE_CHECK_INTERVAL) {
    if (updateManager == null && serverUrl != null) {
        updateManager = new AutoUpdateManager(this, serverUrl);
    }
    if (updateManager != null) {
        updateManager.checkForUpdates();
        lastUpdateCheck = currentTime;
    }
}
```

### 4. AutoUpdateManager Checks Server
```java
// GET {serverUrl}/version
// Compare versionCode with installed version
if (remoteVersionCode > currentVersionCode) {
    downloadAndInstall(apkUrl);
}
```

### 5. Silent Installation (Requires Device Owner)
```java
PackageInstaller packageInstaller = context.getPackageManager().getPackageInstaller();
// ... install APK silently
```

---

## 🔍 VERIFICATION COMMANDS

### Check if Auto-Update is Working

```bash
# 1. Check if service is running
adb shell dumpsys activity services | grep LockScreenService

# 2. Check if service has config
adb logcat -d | grep "SERVER_URL\|CUSTOMER_ID"

# 3. Watch for update checks
adb logcat -c && adb logcat | grep "AutoUpdateManager"

# 4. Check installed version
adb shell dumpsys package com.securefinance.emilock.user | grep versionCode

# 5. Check server version
curl https://emi-pro-app.onrender.com/version | jq
```

---

## 🚨 TROUBLESHOOTING

### Auto-Update Not Working

**Symptom:** No update detected after 1 hour

**Possible Causes:**
1. ❌ User APK not provisioned (no SERVER_URL)
2. ❌ LockScreenService not running
3. ❌ Device not Device Owner (cannot silent install)
4. ❌ Server version.json not deployed

**Solutions:**

**1. Check Provisioning**
```bash
adb logcat -d | grep "Missing config"
# If shows "Missing config (URL/ID)" → Not provisioned
```

**2. Check Service**
```bash
adb shell dumpsys activity services | grep LockScreenService
# If empty → Service not running
# Solution: Open User APK on device
```

**3. Check Device Owner**
```bash
adb shell dpm list-owners
# If empty → Not Device Owner
# Solution: Set Device Owner or provision via QR
```

**4. Check Server Version**
```bash
curl https://emi-pro-app.onrender.com/version
# Should return: {"admin": {...}, "user": {...}}
# If old format → Server not deployed
```

---

## 🔥 QUICK TEST PROCEDURE

### Test Auto-Update (Full Flow)

**Step 1: Prepare**
```bash
# 1. Ensure User APK is provisioned
adb shell dpm list-owners
# Should show Device Owner

# 2. Check current version
adb shell dumpsys package com.securefinance.emilock.user | grep versionCode
# Note the version
```

**Step 2: Increment Server Version**
```bash
# Edit backend/public/downloads/version.json
# Change user.versionCode from 25 to 26
# Change user.version from "2.0.5" to "2.0.6"

# Deploy to server
git add backend/public/downloads/version.json
git commit -m "Increment version for testing"
git push origin main
```

**Step 3: Wait or Trigger**
```bash
# Option A: Wait 1 hour for automatic check

# Option B: Trigger manually
# Open User APK on device
# Tap "Apply Security Update"

# Option C: Watch logs
adb logcat | grep "AutoUpdateManager"
```

**Step 4: Verify Update**
```bash
# Check if version changed
adb shell dumpsys package com.securefinance.emilock.user | grep versionCode
# Should show new version

# Check logs
adb logcat -d | grep "AutoUpdateManager"
# Should show: "New version found", "Download complete", "Installation session committed"
```

---

## 📊 TEST RESULTS TEMPLATE

```
Test Date: _______________
Device: _______________

Pre-Test:
[ ] User APK installed: v_____ (code: _____)
[ ] Device Owner: Yes / No
[ ] LockScreenService: Running / Not Running
[ ] Provisioned: Yes / No

Test:
[ ] Server version incremented to: v_____ (code: _____)
[ ] Update check triggered: Auto / Manual
[ ] Update detected: Yes / No
[ ] Download started: Yes / No
[ ] Installation completed: Yes / No

Post-Test:
[ ] New version installed: v_____ (code: _____)
[ ] App still works: Yes / No
[ ] Lock functionality: Working / Not Working

Logs:
_______________________________________
_______________________________________
_______________________________________

Result: PASS / FAIL
Notes:
_______________________________________
_______________________________________
```

---

## ✅ EXPECTED BEHAVIOR

### When Update is Available

**Logs you should see:**
```
AutoUpdateManager: Checking for updates...
AutoUpdateManager: New version found: 26 (Current: 25)
AutoUpdateManager: Downloading update from: https://emi-pro-app.onrender.com/downloads/securefinance-user.apk
AutoUpdateManager: Download complete, starting silent installation...
AutoUpdateManager: Installation session committed
```

**Device behavior:**
1. No user notification (silent update)
2. App continues running
3. Update installs in background
4. After install, new version is active
5. No restart required (unless app is killed)

---

## 🎯 CURRENT SITUATION

**Your Device:**
- ✅ User APK installed (v2.0.4)
- ✅ LockScreenService running
- ❌ **NOT provisioned** (no SERVER_URL)
- ❌ **NOT Device Owner**

**Server:**
- ✅ Update available (v2.0.5)
- ⚠️ May not be deployed to production yet

**Auto-Update Status:**
- ❌ **Will NOT work** until provisioned

**Next Steps:**
1. Provision device via QR (or set Device Owner)
2. Verify SERVER_URL is set
3. Wait 1 hour or trigger manually
4. Check logs for update activity

---

## 🔥 QUICK COMMANDS

```bash
# Test auto-update system
./test-auto-update.sh

# Check if provisioned
adb logcat -d | grep "SERVER_URL\|CUSTOMER_ID"

# Watch for updates
adb logcat | grep "AutoUpdateManager"

# Manual install (bypass auto-update)
adb install -r backend/public/downloads/securefinance-user.apk

# Check version
adb shell dumpsys package com.securefinance.emilock.user | grep versionCode
```

---

**🔥 AUTO-UPDATE WILL WORK AFTER PROVISIONING. PROVISION VIA QR FOR FULL FUNCTIONALITY. 🔥**
