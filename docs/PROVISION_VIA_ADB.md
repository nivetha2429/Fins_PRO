# 🛠️ How to Provision Device Owner via ADB
This guide explains how to set your `com.securefinance.emilock.user` app as the **Device Owner** (DPC) using ADB. This is required for Kiosk Mode, Anti-Uninstall, and Instant Locking to work correctly.

## ⚠️ Prerequisites
1. **Fresh Device or No Accounts**: The device must NOT have any Google Accounts or other accounts added.
   - Go to **Settings > Accounts** and remove ALL accounts.
   - If this fails, you MUST **Factory Reset** the device.
2. **USB Debugging**: Enabled.

---

## 🚀 Step 1: Install the App
Install the User APK if not already installed.
```bash
adb install -r android/app/build/outputs/apk/user/release/app-user-release.apk
```

## 🚀 Step 2: Set Device Owner
Run the following command exactly:
```bash
adb shell dpm set-device-owner com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver
```

### ✅ Expected Output:
```
Success: Device owner set to package ComponentInfo{com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver}
Active Admin: ComponentInfo{com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver}
```

### ❌ Common Errors:
- **"Not allowed to set the device owner because there are already some accounts on the device"**
  - **Fix:** Remove ALL accounts from Settings, or run `adb shell pm list users` and remove guest users. If failing, Factory Reset.
- **"Package not found"**
  - **Fix:** Ensure the app is installed (`com.securefinance.emilock.user`).

---

## 🚀 Step 3: Verify & Configure (Important!)

Once Device Owner is set, you must configure the app with a Customer ID (since you skipped the QR code flow).

1. **Inject Configuration** (Replace `YOUR_CUSTOMER_ID` with a valid ID from your Admin Dashboard):
```bash
adb shell am broadcast -a com.securefinance.emilock.SET_TEST_CONFIG \
  --es config '{"customerId":"YOUR_CUSTOMER_ID","serverUrl":"https://emi-pro-app.fly.dev"}' \
  -n com.securefinance.emilock.user/com.securefinance.emilock.TestingReceiver
```

2. **Reboot**:
```bash
adb reboot
```

## 🎯 Final Test
1. Go to Admin Dashboard.
2. Click **LOCK**.
3. The device should **IMMEDIATELY** lock (screen goes black/overlay appears, Home button blocked).
