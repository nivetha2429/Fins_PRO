# 📱 SecurePro & EMI Lock - APK Installation Guide

## 🎯 Quick Answer

| APK Type | Install Where | Installation Method | Purpose |
|----------|---------------|---------------------|---------|
| **SecurePro (Admin)** | Staff/Admin phones | Normal install (APK) | Remote control & monitoring |
| **User APK (EMI Lock)** | Customer devices | QR Code (Device Owner) | Lock/unlock enforcement |

---

## 📦 Current APK Locations (v2.0.4)

### 🛡️ Admin APK (SecurePro)
```
backend/public/staff/SecurePro/securepro-admin.apk
```
- **Version:** 2.0.4
- **Features**: Persistent Login, 6-Digit PIN, Remote Commands.
- **Download URL**: `https://emi-pro-app.onrender.com/staff/SecurePro/securepro-admin.apk`

### 👤 User APK (EMI Lock)
```
backend/public/downloads/securefinance-user.apk
```
- **Version:** 2.0.4
- **Features**: Kiosk Lock, SIM Protection, Safe Mode Hardening.
- **Download URL**: `https://emi-pro-app.onrender.com/downloads/securefinance-user.apk`

---

## 1️⃣ Admin APK Installation (Staff Phones)

### 🎯 **Who Uses This:**
- Shop owners and Managers who need to monitor/control devices on the go.

### ✅ **Installation Steps:**
1. Open browser on staff phone.
2. Go to: `https://emi-pro-app.onrender.com/staff/SecurePro/securepro-admin.apk`
3. Install the APK (Allow unknown sources if prompted).
4. **Login**: Use your Admin Email & the new **6-Digit PIN** (Default: `123456`).
5. **Persistent Secure Login**: After logging in once, you only need your 6-digit PIN to open the app.

---

## 2️⃣ User APK Installation (Customer Devices)

### ⚠️ **CRITICAL Requirements:**
1. ✅ Device must be **FACTORY RESET**.
2. ✅ Stop at the **Welcome Screen**.
3. ✅ Do NOT add any accounts or finish setup.

### ✅ **QR Code Provisioning (Recommended)**

**Step 1: Generate QR Code**
1. Login to Admin Panel (Web or Admin APK).
2. Go to **"Provision Device"**.
3. Fill in customer details and click **"Generate QR"**.

**Step 2: Provision Device**
1. On the customer device welcome screen, **tap 6 times** anywhere in the white space.
2. A QR scanner will appear. Scan the QR code from the Admin panel.
3. The device will automatically download the **User APK**, install as **Device Owner**, and lock the phone.

---

## 🛠️ Troubleshooting "Can't Set Up Device"

If you see "Can't set up device" after scanning:
1. **WiFi**: Ensure the device is connected to the internet *before* scanning (if prompted) or that the server is reachable.
2. **Checksum**: Ensure you have **restarted the server** after the latest updates. The QR payload MUST use a **URL-Safe Base64** checksum.
3. **Google Account**: Ensure the phone was fresh from factory reset with NO Google account logged in.

---

## 📊 Package Identification
- **Admin App**: `com.securefinance.emilock.admin` (Name: SecurePro)
- **User App**: `com.securefinance.emilock.user` (Name: EMI Lock)

---

## � Deployment Command
If you update the code, run this to deploy:
```bash
# Push to production
git add .
git commit -m "Update APK and configuration"
git push origin main
```
