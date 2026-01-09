# 🔍 Device Provisioning Troubleshooting Guide

## ❌ Current Issue: "Can't Setup Device"

Based on the QR code screenshot, the issue is likely **NOT** the QR code density (though it is very dense). The real issues are usually:

### 🎯 Most Common Causes (In Order of Likelihood):

### 1. ⚠️ **APK Checksum Mismatch** (MOST LIKELY)
**Problem:** The APK on the server doesn't match the checksum in the QR code.

**Current Status:**
- Expected Checksum: `JfdtHWuytoe5zTSMmMBsJF2KptJBkEA1/kRcC+Vh02o=`
- Actual APK Checksum: `JfdtHWuytoe5zTSMmMBsJF2KptJBkEA1/kRcC+Vh02o=` ✅ **MATCHES**

**Action:** ✅ This is NOT the issue.

---

### 2. 📦 **Wrong APK Flavor** (VERY LIKELY)
**Problem:** The QR code points to `securefinance-user.apk` but you might have uploaded the **Admin APK** instead.

**Check:**
```bash
# Download the APK from server
curl -o /tmp/test.apk "https://emi-pro-app.onrender.com/downloads/securefinance-user.apk"

# Check package name
aapt dump badging /tmp/test.apk | grep package

# Expected output:
# package: name='com.securefinance.emilock.user' ...

# If you see 'com.securefinance.emilock.admin', that's the problem!
```

**Solution:**
```bash
# Build the correct USER APK
cd mobile-app/android
./gradlew assembleUserRelease

# Copy to backend
cp app/build/outputs/apk/user/release/app-user-release.apk \
   ../backend/public/downloads/securefinance-user.apk

# Verify checksum
shasum -a 256 ../backend/public/downloads/securefinance-user.apk | \
  awk '{print $1}' | xxd -r -p | base64

# Update provisioningRoutes.js with new checksum if different
```

---

### 3. 🔐 **DeviceAdminReceiver Not Found** (LIKELY)
**Problem:** The APK doesn't have the correct `DeviceAdminReceiver` class.

**Expected Component:**
```
com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver
```

**Check:**
```bash
# Decompile APK and check
unzip -l /tmp/test.apk | grep DeviceAdminReceiver

# Should show:
# com/securefinance/emilock/DeviceAdminReceiver.class
```

**Solution:**
- Ensure `mobile-app/android/app/src/main/java/com/securefinance/emilock/DeviceAdminReceiver.java` exists
- Rebuild USER APK
- Re-upload to server

---

### 4. 📱 **Device Not Properly Reset** (COMMON)
**Problem:** Device has Google account or other apps already installed.

**Requirements:**
- ✅ Factory reset completed
- ✅ NO Google account added
- ✅ NO other apps installed
- ✅ Device on welcome/setup screen
- ✅ WiFi connected (if using WiFi provisioning)

**Solution:**
1. Full factory reset
2. Do NOT add Google account
3. Skip ALL setup steps
4. Tap 6 times on welcome screen immediately
5. Scan QR code

---

### 5. 🌐 **Network Issues** (COMMON)
**Problem:** Device can't download APK from server.

**Check:**
- Server is accessible: https://emi-pro-app.onrender.com/health
- APK is downloadable: https://emi-pro-app.onrender.com/downloads/securefinance-user.apk
- Device has internet (WiFi or mobile data)

**Solution:**
- Ensure WiFi credentials in QR code are correct
- OR manually connect device to WiFi before scanning
- Test APK URL in browser to confirm it downloads

---

### 6. 📋 **AndroidManifest.xml Issues** (TECHNICAL)
**Problem:** Missing permissions or receiver declaration.

**Required in AndroidManifest.xml:**
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

<receiver
    android:name=".DeviceAdminReceiver"
    android:permission="android.permission.BIND_DEVICE_ADMIN"
    android:exported="true">
    <meta-data
        android:name="android.app.device_admin"
        android:resource="@xml/device_admin" />
    <intent-filter>
        <action android:name="android.app.action.DEVICE_ADMIN_ENABLED" />
        <action android:name="android.app.action.PROFILE_PROVISIONING_COMPLETE" />
    </intent-filter>
</receiver>
```

**Check:**
```bash
# Extract AndroidManifest.xml from APK
aapt dump xmltree /tmp/test.apk AndroidManifest.xml | grep -A 10 DeviceAdminReceiver
```

---

### 7. 🔧 **ADB Debugging Enabled** (RARE)
**Problem:** Some devices reject Device Owner if ADB is enabled.

**Solution:**
- Ensure "Developer Options" are disabled
- Factory reset will clear this

---

## 🧪 Testing Procedure

### Step 1: Verify APK Package Name
```bash
curl -o /tmp/test.apk "https://emi-pro-app.onrender.com/downloads/securefinance-user.apk"
aapt dump badging /tmp/test.apk | grep "package: name"
```

**Expected:** `package: name='com.securefinance.emilock.user'`

**If you see `.admin`:** You uploaded the wrong APK! Build and upload the USER APK.

---

### Step 2: Verify DeviceAdminReceiver
```bash
unzip -l /tmp/test.apk | grep DeviceAdminReceiver
```

**Expected:** Should show `DeviceAdminReceiver.class` file

**If missing:** Rebuild APK with correct source code.

---

### Step 3: Test Manual Provisioning (Without QR)
```bash
# Factory reset device
adb shell am broadcast -a android.intent.action.FACTORY_RESET

# Wait for welcome screen

# Install APK
adb install /tmp/test.apk

# Set as Device Owner
adb shell dpm set-device-owner com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver

# Expected output:
# Success: Device owner set to package com.securefinance.emilock.user

# If this works, QR provisioning should also work
```

---

### Step 4: Check Device Logs During QR Scan
```bash
# Start logging before scanning QR
adb logcat -c  # Clear logs
adb logcat | grep -i "provision\|device.owner\|emilock"

# Scan QR code on device
# Watch logs for errors
```

**Common Errors:**
- `"Package not found"` → Wrong package name in QR
- `"Checksum mismatch"` → APK changed after QR generation
- `"Download failed"` → Network issue or APK not accessible
- `"Not allowed to set device owner"` → Device not properly reset

---

## 🎯 Quick Fix Checklist

1. ✅ **Verify APK is USER flavor** (not Admin)
   ```bash
   aapt dump badging backend/public/downloads/securefinance-user.apk | grep package
   ```

2. ✅ **Verify APK has DeviceAdminReceiver**
   ```bash
   unzip -l backend/public/downloads/securefinance-user.apk | grep DeviceAdminReceiver
   ```

3. ✅ **Verify checksum matches**
   ```bash
   shasum -a 256 backend/public/downloads/securefinance-user.apk | awk '{print $1}' | xxd -r -p | base64
   # Should output: JfdtHWuytoe5zTSMmMBsJF2KptJBkEA1/kRcC+Vh02o=
   ```

4. ✅ **Test APK download**
   ```bash
   curl -I "https://emi-pro-app.onrender.com/downloads/securefinance-user.apk"
   # Should return 200 OK
   ```

5. ✅ **Factory reset device completely**
   - No Google account
   - No other apps
   - Fresh welcome screen

6. ✅ **Scan QR immediately after reset**
   - Tap 6 times on welcome screen
   - Scan QR code
   - Watch for errors

---

## 🔍 Most Likely Root Cause

Based on experience, the **#1 issue** is usually:

### **Wrong APK Uploaded to Server**

You probably uploaded the **Admin APK** (`app-admin-release.apk`) instead of the **User APK** (`app-user-release.apk`).

**Fix:**
```bash
cd mobile-app/android

# Build USER APK (not Admin!)
./gradlew assembleUserRelease

# Verify it's the USER flavor
aapt dump badging app/build/outputs/apk/user/release/app-user-release.apk | grep package
# Should show: com.securefinance.emilock.user

# Copy to backend
cp app/build/outputs/apk/user/release/app-user-release.apk \
   ../backend/public/downloads/securefinance-user.apk

# Calculate new checksum
shasum -a 256 ../backend/public/downloads/securefinance-user.apk | \
  awk '{print $1}' | xxd -r -p | base64

# Update backend/routes/provisioningRoutes.js with new checksum
# Then push to Render
```

---

## 📞 Next Steps

1. **First:** Verify the APK package name on the server
2. **Second:** If wrong, rebuild and upload correct USER APK
3. **Third:** Test manual ADB provisioning to isolate QR vs APK issues
4. **Fourth:** Check device logs during QR scan for specific errors

Let me know what you find!
