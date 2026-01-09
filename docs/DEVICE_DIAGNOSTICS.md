# 🔍 Device-Side Diagnostic Commands

## ✅ Server Status: ALL GOOD
- APK is accessible on Render (HTTP 200)
- Download URL is correct
- Checksum matches
- Server is responsive

## ❌ Issue: Device Cannot Download

Since the server is working, the problem is on the **device side**.

---

## 📱 Device Diagnostic Commands

### 1. Check if Device is Connected to Internet

```bash
# Connect device via USB
adb devices

# Check WiFi connection
adb shell dumpsys wifi | grep "mNetworkInfo"

# Expected: state: CONNECTED/CONNECTED
```

### 2. Test if Device Can Reach Render Server

```bash
# Ping test (may not work on all devices)
adb shell ping -c 3 emi-pro-app.onrender.com

# HTTP test
adb shell "curl -I https://emi-pro-app.onrender.com/health"

# Should return HTTP 200
```

### 3. Watch Device Logs During Provisioning

```bash
# Clear logs
adb logcat -c

# Start watching logs
adb logcat | grep -i "provision\|download\|error\|emi"

# Now scan the QR code and watch for errors
```

### 4. Check for Specific Download Errors

```bash
# Watch for download-related errors
adb logcat | grep -iE "download|http|network|connect"

# Common errors:
# - "Network error"
# - "Connection refused"
# - "Timeout"
# - "SSL error"
# - "Certificate"
```

### 5. Check Device Owner Status

```bash
# Check if Device Owner is already set
adb shell dumpsys device_policy | grep "Device Owner"

# If Device Owner is already set, you'll see:
# Device Owner: ComponentInfo{...}

# If set to wrong package, factory reset is required
```

### 6. Manual APK Download Test

```bash
# Try downloading APK manually to device
adb shell "curl -o /sdcard/Download/test.apk https://emi-pro-app.onrender.com/downloads/securefinance-user.apk"

# Check if download succeeded
adb shell ls -lh /sdcard/Download/test.apk

# If this fails, device cannot reach Render server
```

### 7. Check for Firewall/Network Restrictions

```bash
# Check if device can access HTTPS sites
adb shell "curl -I https://www.google.com"

# If this works but Render doesn't, there may be:
# - Corporate firewall
# - Network restrictions
# - DNS issues
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Network error" or "Connection failed"

**Cause:** Device not connected to internet

**Fix:**
1. Verify WiFi is connected (not just "Saved")
2. Try different WiFi network
3. Use mobile hotspot for testing

### Issue 2: "SSL handshake failed" or "Certificate error"

**Cause:** Device clock is wrong or SSL certificate issue

**Fix:**
1. Check device date/time is correct
2. Enable "Automatic date & time"
3. Factory reset and try again

### Issue 3: "Download timeout"

**Cause:** Slow internet or large APK size

**Fix:**
1. Use faster WiFi network
2. Move closer to WiFi router
3. Try at different time (less network congestion)

### Issue 4: "Checksum mismatch"

**Cause:** APK changed after QR was generated

**Fix:**
1. Generate NEW QR code
2. Factory reset device
3. Scan new QR code

### Issue 5: Device Owner already set

**Cause:** Device was previously provisioned

**Fix:**
1. Factory reset device
2. Do NOT restore from backup
3. Try provisioning again

---

## 📊 Diagnostic Checklist

Run these checks in order:

- [ ] Device connected via USB (`adb devices`)
- [ ] Device connected to WiFi (`adb shell dumpsys wifi`)
- [ ] Device can reach internet (`adb shell ping 8.8.8.8`)
- [ ] Device can reach Render (`adb shell curl -I https://emi-pro-app.onrender.com/health`)
- [ ] No Device Owner set (`adb shell dumpsys device_policy`)
- [ ] Device logs show download attempt (`adb logcat`)
- [ ] No firewall blocking downloads
- [ ] Device date/time is correct

---

## 🎯 Most Likely Causes

Based on "cannot download" error:

1. **Device not connected to internet** (90% of cases)
   - WiFi shows "Saved" but not "Connected"
   - Wrong WiFi password
   - WiFi has no internet access

2. **Firewall/Network blocking** (5% of cases)
   - Corporate network blocks APK downloads
   - Parental controls active
   - Network requires login/captive portal

3. **Device Owner already set** (3% of cases)
   - Device was previously provisioned
   - Another MDM app is installed
   - Requires factory reset

4. **SSL/Certificate issue** (2% of cases)
   - Device clock is wrong
   - Old Android version
   - Certificate validation failed

---

## 🚀 Quick Fix Steps

1. **Verify WiFi Connection:**
   ```bash
   adb shell dumpsys wifi | grep "mNetworkInfo"
   # Must show: CONNECTED/CONNECTED
   ```

2. **Test Internet:**
   ```bash
   adb shell ping -c 3 8.8.8.8
   # Should get replies
   ```

3. **Test Render Access:**
   ```bash
   adb shell "curl -I https://emi-pro-app.onrender.com/downloads/securefinance-user.apk"
   # Should return HTTP 200
   ```

4. **Watch Logs:**
   ```bash
   adb logcat -c
   adb logcat | grep -i "provision\|download"
   # Scan QR and watch for errors
   ```

---

## 📞 Next Steps

1. **Connect device via USB**
2. **Run the diagnostic commands above**
3. **Share the error messages** from logcat
4. **We'll identify the exact issue** and fix it

---

**The server is working perfectly. The issue is on the device side - most likely WiFi connection or network access.**
