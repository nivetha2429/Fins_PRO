# 🧪 Complete Provisioning & Lock/Unlock Testing Guide

## 📋 Prerequisites

Before starting, ensure:
- ✅ Render deployment complete (wait 2-3 minutes after push)
- ✅ Backend running locally OR on Render
- ✅ Admin panel accessible (web or SecurePro app)
- ✅ Test device factory reset and ready

---

## 🎯 STEP 1: Generate QR Code from Admin Panel

### Via Web Admin Panel:

1. **Login to Admin Panel**
   - URL: `http://localhost:5173` (local) or your deployed URL
   - Use your admin credentials

2. **Navigate to "Add Customer"**
   - Click "Add Customer" or "Provision Device" button

3. **Fill in Customer Details:**
   ```
   Name: Test Customer
   Phone: 1234567890
   IMEI: (leave blank - will auto-fetch)
   Address: Test Address, City
   Aadhar: 123456789012
   EMI Amount: 5000
   ```

4. **CRITICAL - Fill WiFi Configuration:**
   ```
   WiFi SSID: Your_Network_Name
   WiFi Password: Your_Network_Password
   ```
   ⚠️ **Important:** Use the EXACT WiFi name and password. Case-sensitive!

5. **Click "Generate QR Code"**
   - QR code will appear in a modal
   - It includes:
     - ✅ WiFi credentials
     - ✅ Server URL
     - ✅ Customer ID
     - ✅ APK download link
     - ✅ Checksum

6. **Keep this QR code ready** - You'll scan it in Step 2

---

## 📱 STEP 2: Provision Customer Device

### Factory Reset Procedure:

1. **Full Factory Reset:**
   ```
   Settings → System → Reset options → Erase all data (factory reset)
   ```

2. **Wait for device to restart**
   - Device will show welcome screen
   - Language selection screen

3. **CRITICAL - Do NOT proceed with setup:**
   - ❌ Do NOT tap "Start" or "Next"
   - ❌ Do NOT add Google account
   - ❌ Do NOT connect to WiFi manually
   - ❌ Do NOT skip any steps
   - ✅ Stay on the welcome/language screen

### Provisioning Steps:

1. **Trigger QR Scanner:**
   - On the welcome screen, **tap 6 times** anywhere on the screen
   - Device will prompt: "Scan QR code to set up device"

2. **Scan the QR Code:**
   - Point camera at the QR code from Step 1
   - Device will automatically scan it

3. **Watch the Provisioning Process:**
   ```
   Step 1: "Getting ready for work" - Connecting to WiFi
   Step 2: "Downloading..." - Downloading USER APK
   Step 3: "Installing..." - Installing APK as Device Owner
   Step 4: "Setting up..." - Running DeviceAdminReceiver
   Step 5: "Your IT admin can see data" - Device Owner activated
   Step 6: App launches automatically
   ```

4. **Expected Result:**
   - ✅ Device shows "EMI Lock" app
   - ✅ App is running
   - ✅ No error screens
   - ✅ Device is provisioned

### If Provisioning Fails:

**Error: "Can't set up device"**
- Check WiFi credentials in QR code
- Ensure device has internet
- Verify APK is accessible on Render
- Check device logs: `adb logcat | grep -i "provision\|error"`

**Error: "Download failed"**
- WiFi credentials incorrect
- No internet connection
- APK not on server (check Render deployment)

**Error: "Checksum mismatch"**
- Old QR code - generate new one
- APK changed - regenerate QR with updated checksum

---

## ✅ STEP 3: Verify Device in Admin Panel

### Check Dashboard:

1. **Open Admin Panel**
   - Go to Dashboard or Customers page

2. **Find the newly provisioned device:**
   - Should appear in the list
   - Status: **"ACTIVE"** or **"CONNECTED"**

3. **Verify Device Information:**
   ```
   ✅ Customer Name: Test Customer
   ✅ Phone: 1234567890
   ✅ Brand: (auto-fetched from device)
   ✅ Model: (auto-fetched from device)
   ✅ IMEI: (auto-fetched from device)
   ✅ Last Seen: Just now
   ✅ Status: ACTIVE
   ```

4. **Click on the device** to view details:
   - Device technical info populated
   - Location (if permissions granted)
   - Battery level
   - Network type

---

## 🔒 STEP 4: Test Lock/Unlock from Frontend

### Test Lock Command:

1. **In Admin Panel, find the device**

2. **Click "Lock Device" button**
   - Or use the lock icon/toggle

3. **Confirm the action**

4. **Watch the device:**
   ```
   Expected Behavior:
   - Device receives lock command via heartbeat
   - Lock screen appears immediately
   - User cannot exit the app
   - Home button disabled
   - Recent apps disabled
   - Only payment screen visible
   ```

5. **Verify in Admin Panel:**
   - Device status shows: **"LOCKED"** or **"isLocked: true"**
   - Lock history updated with timestamp

### Test Unlock Command:

1. **In Admin Panel, click "Unlock Device"**

2. **Confirm the action**

3. **Watch the device:**
   ```
   Expected Behavior:
   - Device receives unlock command
   - Lock screen disappears
   - User can use device normally
   - Home button works
   - Can switch apps
   ```

4. **Verify in Admin Panel:**
   - Device status shows: **"UNLOCKED"** or **"isLocked: false"**
   - Lock history updated

---

## 🔧 STEP 5: Test Lock/Unlock from Backend (API)

### Using cURL or Postman:

#### Lock Device:

```bash
# Get auth token first
TOKEN="your_admin_token"

# Send lock command
curl -X POST "http://localhost:5000/api/customers/CUSTOMER_ID/command" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "command": "lock",
    "params": {
      "reason": "Payment overdue"
    }
  }'

# Expected Response:
{
  "success": true,
  "message": "Command lock queued for device",
  "command": "lock",
  "customer": { ... }
}
```

#### Unlock Device:

```bash
curl -X POST "http://localhost:5000/api/customers/CUSTOMER_ID/command" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "command": "unlock",
    "params": {
      "reason": "Payment received"
    }
  }'
```

#### Verify Lock Status:

```bash
# Check heartbeat response
curl -X POST "http://localhost:5000/api/customers/heartbeat" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUSTOMER_ID",
    "status": "active"
  }'

# Response should include:
{
  "ok": true,
  "isLocked": true,  // or false
  "command": "lock", // or "unlock"
  ...
}
```

---

## 📊 Expected Results Summary

### After Successful Provisioning:

| Component | Expected State |
|-----------|---------------|
| Device App | "EMI Lock" running |
| Admin Panel | Device shows as "ACTIVE" |
| Device Info | Brand, Model, IMEI populated |
| Lock Status | Initially UNLOCKED |
| Heartbeat | Running every 5-10 seconds |

### After Lock Command:

| Component | Expected State |
|-----------|---------------|
| Device Screen | Lock screen visible |
| Home Button | Disabled |
| Recent Apps | Disabled |
| Admin Panel | isLocked: true |
| Lock History | New entry added |

### After Unlock Command:

| Component | Expected State |
|-----------|---------------|
| Device Screen | Normal home screen |
| Home Button | Enabled |
| Recent Apps | Enabled |
| Admin Panel | isLocked: false |
| Lock History | Unlock entry added |

---

## 🐛 Troubleshooting

### Device Not Appearing in Dashboard:

**Possible Causes:**
1. Device not sending heartbeat
2. Backend not receiving data
3. Network issue

**Solutions:**
```bash
# Check device logs
adb logcat | grep -i "heartbeat\|emi_admin"

# Check backend logs
# Look for heartbeat requests in terminal

# Verify network connectivity
# Ensure device can reach backend URL
```

### Lock Command Not Working:

**Possible Causes:**
1. Heartbeat not running
2. Device not checking for commands
3. DeviceAdminReceiver not active

**Solutions:**
```bash
# Check if Device Owner is active
adb shell dumpsys device_policy | grep "Device Owner"

# Check app logs
adb logcat | grep -i "lock\|command"

# Verify heartbeat is running
# Should see heartbeat requests every 5-10 seconds
```

### Unlock Command Not Working:

**Possible Causes:**
1. Lock screen service stuck
2. Command not received
3. Permissions issue

**Solutions:**
```bash
# Force stop and restart app
adb shell am force-stop com.securefinance.emilock.user
adb shell am start -n com.securefinance.emilock.user/.MainActivity

# Check logs for errors
adb logcat | grep -i "unlock\|error"
```

---

## 📝 Testing Checklist

Use this checklist to verify everything works:

### Provisioning:
- [ ] QR code generated with WiFi credentials
- [ ] Device factory reset properly
- [ ] QR scan successful
- [ ] APK downloaded and installed
- [ ] Device Owner activated
- [ ] App launched automatically
- [ ] Device appears in admin panel
- [ ] Device info populated (Brand, Model, IMEI)

### Lock/Unlock (Frontend):
- [ ] Lock button works in admin panel
- [ ] Device locks immediately
- [ ] Lock screen appears
- [ ] Home button disabled
- [ ] Admin panel shows isLocked: true
- [ ] Unlock button works
- [ ] Device unlocks immediately
- [ ] Normal functionality restored
- [ ] Admin panel shows isLocked: false

### Lock/Unlock (Backend API):
- [ ] POST /api/customers/:id/command works
- [ ] Lock command queued successfully
- [ ] Device receives command via heartbeat
- [ ] Unlock command works
- [ ] Lock history updated correctly

### Additional Features:
- [ ] Heartbeat running continuously
- [ ] Location tracking works
- [ ] Battery level reported
- [ ] SIM change detection works
- [ ] Factory reset blocked
- [ ] Safe mode blocked
- [ ] USB debugging disabled

---

## 🎉 Success Criteria

Your system is working correctly if:

1. ✅ **Provisioning completes without errors**
2. ✅ **Device appears in admin panel with correct info**
3. ✅ **Lock command locks the device immediately**
4. ✅ **Unlock command unlocks the device immediately**
5. ✅ **Heartbeat runs continuously**
6. ✅ **All device info is populated**
7. ✅ **Lock history is tracked**

---

## 📞 Quick Commands Reference

```bash
# Check if Render deployed
curl -I "https://emi-pro-app.onrender.com/downloads/securefinance-user.apk"

# Test provisioning payload
curl "http://localhost:5000/api/provisioning/payload/TEST?wifiSsid=MyWiFi&wifiPassword=MyPass"

# Check device logs
adb logcat | grep -i "emi_admin\|provision\|lock"

# Verify Device Owner
adb shell dumpsys device_policy | grep "Device Owner"

# Check heartbeat
# Watch backend terminal for heartbeat requests

# Test lock command
curl -X POST "http://localhost:5000/api/customers/CUSTOMER_ID/command" \
  -H "Content-Type: application/json" \
  -d '{"command": "lock"}'
```

---

**You're now ready to test the complete provisioning and lock/unlock flow!** Follow the steps above and verify each component works as expected. 🚀
