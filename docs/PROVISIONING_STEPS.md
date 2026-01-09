# 📱 Device Provisioning Guide - Updated

## ⚠️ IMPORTANT: WiFi Connection Required

**The device MUST be connected to WiFi BEFORE scanning the QR code.**

The QR code does NOT include WiFi credentials. You need to manually connect the device to WiFi during the factory reset setup.

---

## 🎯 Complete Provisioning Steps

### Step 1: Factory Reset Device

```
Settings → System → Reset options → Erase all data (factory reset)
```

Wait for device to restart and show the welcome screen.

---

### Step 2: Connect to WiFi (CRITICAL)

**On the welcome screen:**

1. Select your language
2. **Tap "Next"** to proceed
3. **Connect to WiFi:**
   - Select your WiFi network
   - Enter WiFi password
   - Wait for connection to establish
   - ✅ Verify "Connected" status

4. **STOP HERE** - Do NOT proceed further:
   - ❌ Do NOT add Google account
   - ❌ Do NOT complete setup
   - ❌ Do NOT skip any steps
   - ✅ Stay on the "Add Google account" screen

---

### Step 3: Trigger QR Scanner

**On the "Add Google account" screen:**

1. **Tap 6 times** anywhere on the screen
2. Device will prompt: **"Scan QR code to set up device"**
3. Camera will activate for QR scanning

---

### Step 4: Scan QR Code

1. **Point camera at QR code** from admin panel
2. Device will automatically scan it
3. **Watch the provisioning process:**

```
Step 1: "Getting ready for work"
Step 2: "Downloading..." - Downloading APK from server
Step 3: "Installing..." - Installing as Device Owner
Step 4: "Setting up..." - Running DeviceAdminReceiver
Step 5: "Your IT admin can see data" - Device Owner activated
Step 6: App launches automatically
```

---

### Step 5: Verify Provisioning

**On the device:**
- ✅ "EMI Lock" app is running
- ✅ No error screens
- ✅ Device is provisioned

**In admin panel:**
- ✅ Device appears in customer list
- ✅ Status: "ACTIVE"
- ✅ Device info populated (Brand, Model, IMEI)
- ✅ Last Seen: Just now

---

## 🐛 Troubleshooting

### "Can't download" or "Download failed"

**Cause:** Device not connected to internet

**Fix:**
1. Factory reset again
2. **Connect to WiFi properly** (verify "Connected" status)
3. Scan QR code again

---

### "Can't setup device"

**Possible Causes:**
1. Checksum mismatch
2. APK not accessible on server
3. Device Owner already set

**Fix:**
```bash
# Verify APK is accessible
curl -I "https://emi-pro-app.onrender.com/downloads/securefinance-user.apk"

# Should return HTTP 200

# If 404, wait for Render deployment (2-3 minutes)
```

---

### "Checksum mismatch"

**Cause:** Old QR code with outdated checksum

**Fix:**
1. Generate NEW QR code from admin panel
2. Factory reset device
3. Connect to WiFi
4. Scan new QR code

---

## ✅ Success Criteria

Provisioning is successful if:

- [ ] Device connected to WiFi before QR scan
- [ ] QR code scanned successfully
- [ ] APK downloaded from server
- [ ] Device Owner activated
- [ ] "EMI Lock" app running
- [ ] Device appears in admin panel
- [ ] Device info populated
- [ ] Status: ACTIVE

---

## 📝 Updated Workflow

```
1. Factory reset device
   ↓
2. Select language
   ↓
3. Connect to WiFi ← CRITICAL STEP
   ↓
4. Stop at "Add Google account" screen
   ↓
5. Tap 6 times to trigger QR scanner
   ↓
6. Scan QR code
   ↓
7. Device downloads APK (using WiFi)
   ↓
8. Device installs as Device Owner
   ↓
9. App launches
   ↓
10. Device reports to backend
   ↓
11. Admin panel shows device as ACTIVE
```

---

## 🎯 Key Points

1. **WiFi is REQUIRED** - Device must be connected before QR scan
2. **Do NOT add Google account** - Stop at that screen
3. **Tap 6 times** - This triggers the QR scanner
4. **Wait for download** - APK downloads from Render server
5. **Verify in admin panel** - Device should appear immediately

---

## 📞 Quick Commands

```bash
# Verify APK is accessible
curl -I "https://emi-pro-app.onrender.com/downloads/securefinance-user.apk"

# Check provisioning payload (no WiFi should be included)
curl -s "https://emi-pro-app.onrender.com/api/provisioning/payload/TEST" | python3 -m json.tool

# Check device logs during provisioning
adb logcat | grep -i "provision\|download\|emi_admin"
```

---

**Remember: Connect to WiFi FIRST, then scan QR code!** 📶
