# ✅ PRE-DEPLOYMENT CHECKLIST - PRODUCTION READINESS

## 🎯 BEFORE SHIPPING TO REAL DEVICES

### 📱 USER APK (Lock Enforcer) - CRITICAL CHECKS

- [ ] **NO LAUNCHER intent-filter**
  ```bash
  # Verify:
  grep -r "LAUNCHER" mobile-app/android/app/src/user/AndroidManifest.xml
  # Expected: No results or tools:node="remove"
  ```

- [ ] **NO exported activities**
  ```bash
  # Verify LockActivity is NOT exported:
  grep "LockActivity" mobile-app/android/app/src/main/AndroidManifest.xml
  # Expected: android:exported="false"
  ```

- [ ] **LockActivity launches ONLY when DEVICE_LOCKED=true**
  ```java
  // In LockActivity.onCreate():
  if (!prefs.getBoolean("DEVICE_LOCKED", false)) {
      finish();
      return;
  }
  ```

- [ ] **Blocks Home / Back / Recents**
  ```java
  // Verify in LockActivity:
  @Override
  public boolean onKeyDown(int keyCode, KeyEvent event) {
      return true; // Blocks ALL keys
  }
  
  @Override
  public void onBackPressed() {
      // Empty - blocks back button
  }
  ```

- [ ] **NO React Native UI when unlocked**
  ```bash
  # User APK should have NO React Native dependencies
  # All UI is native Android (LockActivity only)
  ```

- [ ] **Runs ONLY background services when unlocked**
  ```bash
  # Verify no activities start on boot except LockActivity when locked
  # Check BootReceiver only starts LockEnforcementService
  ```

---

### 🛡️ ADMIN APK (Device Owner) - CRITICAL CHECKS

- [ ] **Installed ONLY via QR provisioning**
  ```bash
  # Never install via ADB in production
  # Always use factory reset + QR scan
  ```

- [ ] **Confirms Device Owner status on boot**
  ```java
  // In DeviceAdminReceiver or BootReceiver:
  DevicePolicyManager dpm = ...;
  if (!dpm.isDeviceOwnerApp(getPackageName())) {
      Log.e(TAG, "NOT DEVICE OWNER - CRITICAL ERROR");
      // Report to backend
  }
  ```

- [ ] **Silently installs User APK**
  ```java
  // In onProfileProvisioningComplete:
  UserAppInstaller.installUserApp(context, serverUrl);
  // Verify URL: serverUrl + "/apk/user/user-v3.0.1.apk"
  ```

- [ ] **Can hide its own launcher**
  ```xml
  <!-- Option 1: Remove from manifest -->
  <activity android:name=".MainActivity" tools:node="remove" />
  
  <!-- Option 2: Disable programmatically -->
  pm.setComponentEnabledSetting(componentName, DISABLED, DONT_KILL_APP);
  ```

- [ ] **All actions driven by backend (not UI)**
  ```bash
  # Admin APK should NOT have user-facing controls
  # All lock/unlock via FCM from backend
  ```

---

### 🌐 BACKEND - CRITICAL CHECKS

- [ ] **Lock/unlock commands are idempotent**
  ```javascript
  // Multiple LOCK commands = same result
  // Multiple UNLOCK commands = same result
  // No race conditions
  ```

- [ ] **Device ID bound to customer**
  ```javascript
  // Each device has unique customerId
  // Cannot be reassigned without admin approval
  ```

- [ ] **Commands signed / authenticated**
  ```javascript
  // FCM tokens validated
  // API endpoints require authentication
  // No anonymous lock/unlock
  ```

- [ ] **Tamper events stored & visible in dashboard**
  ```javascript
  // POST /api/security/tamper
  // Events logged in database
  // Visible in admin dashboard
  ```

---

## 🧪 TESTING CHECKLIST

### Test on Real Device (Factory Reset Required)

#### Phase 1: Provisioning
- [ ] Factory reset device
- [ ] Scan QR code
- [ ] Admin APK installs (verify in Settings → Apps)
- [ ] User APK installs silently (verify via ADB)
- [ ] Device appears in admin dashboard
- [ ] Device status shows "connected"

#### Phase 2: Lock Flow
- [ ] Send LOCK command from dashboard
- [ ] Lock screen appears within 2 seconds
- [ ] EMI amount displays correctly
- [ ] Due date displays correctly
- [ ] Support contact displays correctly
- [ ] Home button does nothing
- [ ] Back button does nothing
- [ ] Recents button does nothing
- [ ] Power button works (screen on/off only)

#### Phase 3: Unlock Flow
- [ ] Send UNLOCK command from dashboard
- [ ] Lock screen disappears within 2 seconds
- [ ] Phone returns to normal
- [ ] No visible apps in launcher
- [ ] Device fully functional

#### Phase 4: Reboot Test
- [ ] Lock device
- [ ] Reboot device
- [ ] Lock screen reappears immediately
- [ ] Unlock device
- [ ] Reboot device
- [ ] Device stays unlocked

#### Phase 5: Tamper Tests
- [ ] Try to boot into Safe Mode → Lock persists
- [ ] Try to enable ADB → Auto-disabled
- [ ] Try to uninstall User APK → Blocked
- [ ] Try to force stop service → Auto-restarts
- [ ] Factory reset → Device Owner survives

---

## 📦 APK BUILD CHECKLIST

### Before Building Release APKs

- [ ] Update version in `build.gradle`
  ```gradle
  versionCode 36
  versionName "3.0.2"
  ```

- [ ] Update `version.json`
  ```json
  {
    "admin": {
      "version": "3.0.2",
      "versionCode": 36,
      "apk": "/apk/admin/admin-v3.0.2.apk"
    },
    "user": {
      "version": "3.0.2",
      "versionCode": 36,
      "apk": "/apk/user/user-v3.0.2.apk"
    }
  }
  ```

- [ ] Build release APKs
  ```bash
  cd mobile-app/android
  ./gradlew assembleAdminRelease
  ./gradlew assembleUserRelease
  ```

- [ ] Copy to backend
  ```bash
  cp app/build/outputs/apk/admin/release/app-admin-release.apk \
     ../../backend/public/apk/admin/admin-v3.0.2.apk
  
  cp app/build/outputs/apk/user/release/app-user-release.apk \
     ../../backend/public/apk/user/user-v3.0.2.apk
  ```

- [ ] Calculate checksums
  ```bash
  cd backend
  node -e "const { getApkChecksum } = require('./utils/checksum'); \
    const path = require('path'); \
    console.log('Admin:', getApkChecksum(path.join(__dirname, 'public/apk/admin/admin-v3.0.2.apk'))); \
    console.log('User:', getApkChecksum(path.join(__dirname, 'public/apk/user/user-v3.0.2.apk')));"
  ```

- [ ] Update checksum in `provisioningRoutes.js`
  ```javascript
  checksum = 'NEW_CHECKSUM_HERE';
  ```

- [ ] Deploy to production server
  ```bash
  git add .
  git commit -m "Release v3.0.2 - Production ready"
  git push origin main
  ```

---

## 🚀 DEPLOYMENT CHECKLIST

### Production Server

- [ ] Backend deployed and running
- [ ] Database connected
- [ ] FCM configured
- [ ] APKs accessible at:
  - `https://your-domain.com/apk/admin/admin-v3.0.2.apk`
  - `https://your-domain.com/apk/user/user-v3.0.2.apk`

- [ ] QR generation working
- [ ] Admin dashboard accessible
- [ ] SSL certificate valid

---

## ⚠️ CRITICAL REMINDERS

### User APK is NOT an app
- It's a **background enforcement agent**
- Invisible to user
- UI only when locked
- Treated like firmware, not software

### Admin APK is NOT for end users
- Device Owner only
- Controls via backend
- Can be hidden after provisioning
- No user-facing features

### Both APKs are uninstallable
- Device Owner protection
- Survives factory reset
- Cannot be removed by user
- Only removable via Device Owner removal

---

## ✅ SIGN-OFF

Before deploying to production, confirm:

- [ ] All User APK checks passed
- [ ] All Admin APK checks passed
- [ ] All Backend checks passed
- [ ] All tests passed on real device
- [ ] APKs built and deployed
- [ ] Checksums updated
- [ ] Production server ready

**Signed by**: _______________
**Date**: _______________

---

## 📞 SUPPORT CONTACTS

**Technical Issues**: 
**Backend Issues**: 
**Device Issues**: 

---

**This system is production-ready for pilot deployment.**
**Start with 10-20 devices, monitor closely, then scale.**
