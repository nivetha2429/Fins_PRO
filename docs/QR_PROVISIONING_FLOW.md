# 📱 QR PROVISIONING FLOW - WHAT GETS INSTALLED

## 🔍 CURRENT CONFIGURATION

### QR Code Payload (from `/api/provisioning/payload/:customerId`)

```json
{
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": 
    "com.securefinance.emilock.admin/com.securefinance.emilock.DeviceAdminReceiver",
  
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION":
    "https://emi-pro-app.fly.dev/apk/admin/admin-v3.0.1.apk",
  
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM":
    "R_1fW4bPkGp2QCpBHfXyrv_DMJWdO8j8mPlK-ZBfZKE",
  
  "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
    "customerId": "CUS-xxx",
    "serverUrl": "https://emi-pro-app.fly.dev"
  }
}
```

---

## 📦 WHAT GETS INSTALLED ON USER DEVICE

### ✅ STEP 1: QR Scan (Factory Reset)
**User scans QR code during device setup**

### ✅ STEP 2: Admin APK Installed (Device Owner)
**APK**: `/apk/admin/admin-v3.0.1.apk`
**Package**: `com.securefinance.emilock.admin`
**Role**: Device Owner / DPC (Device Policy Controller)

**Capabilities:**
- Device Owner privileges
- Can install other apps silently
- Cannot be uninstalled
- Controls device policies

---

### ✅ STEP 3: Admin APK Auto-Installs User APK (Silent)

After Admin APK provisioning completes, it automatically downloads and installs:

**APK**: `/apk/user/user-v3.0.1.apk`
**Package**: `com.securefinance.emilock.user`
**Role**: Silent Background Agent / Lock Enforcer

**Installation Method:**
```java
// In DeviceAdminReceiver.java (Admin APK)
UserAppInstaller.installUserApp(context, serverUrl);

// Downloads from:
serverUrl + "/apk/user/user-v3.0.1.apk"
// Example: https://emi-pro-app.fly.dev/apk/user/user-v3.0.1.apk
```

**Installation Type:**
- Silent (no user interaction)
- Uses PackageInstaller API
- Requires Device Owner privilege
- No Play Store involved

---

## 🔄 COMPLETE FLOW DIAGRAM

```
1. User Factory Resets Device
   ↓
2. Scans QR Code
   ↓
3. Android Downloads Admin APK
   URL: /apk/admin/admin-v3.0.1.apk
   ↓
4. Admin APK Installed as Device Owner
   Package: com.securefinance.emilock.admin
   ↓
5. Admin APK Provisioning Complete
   ↓
6. Admin APK Downloads User APK (Silent)
   URL: /apk/user/user-v3.0.1.apk
   ↓
7. Admin APK Installs User APK (Silent)
   Package: com.securefinance.emilock.user
   ↓
8. BOTH APKs Now Installed
   - Admin APK: Visible, controls device
   - User APK: Invisible, enforces locks
```

---

## 📋 FINAL STATE ON USER DEVICE

### Installed Apps:
1. **Admin APK** (`com.securefinance.emilock.admin`)
   - ✅ Visible in app drawer
   - ✅ Has launcher icon
   - ✅ Device Owner
   - ✅ Can be opened by admin

2. **User APK** (`com.securefinance.emilock.user`)
   - ❌ NOT visible in app drawer
   - ❌ NO launcher icon
   - ❌ Cannot be opened manually
   - ✅ Runs silently in background
   - ✅ Shows lock screen ONLY when locked

---

## 🔐 SECURITY VERIFICATION

### To verify both APKs are installed:

```bash
# Via ADB
adb shell pm list packages | grep securefinance

# Expected output:
package:com.securefinance.emilock.admin
package:com.securefinance.emilock.user
```

### To verify Device Owner:

```bash
adb shell dumpsys device_policy | grep "Device Owner"

# Expected output:
Device Owner: com.securefinance.emilock.admin
```

---

## ⚠️ IMPORTANT NOTES

### User APK Installation is AUTOMATIC
- User does NOT scan a second QR code
- User does NOT manually install User APK
- User does NOT see User APK installation
- Happens completely silently in background

### Why Two APKs?

**Admin APK (Device Owner):**
- Needs to be Device Owner
- Installed via QR provisioning
- Has system-level privileges
- Manages device policies

**User APK (Lock Enforcer):**
- Does NOT need to be Device Owner
- Installed silently by Admin APK
- Enforces lock screen
- Completely invisible to user

---

## 🧪 TESTING CHECKLIST

After QR provisioning, verify:

- [ ] Admin APK installed (`com.securefinance.emilock.admin`)
- [ ] User APK installed (`com.securefinance.emilock.user`)
- [ ] Admin APK is Device Owner
- [ ] Admin APK has launcher icon (visible)
- [ ] User APK has NO launcher icon (invisible)
- [ ] User APK does NOT open on Home key
- [ ] Both APKs connected to backend
- [ ] Device appears in admin dashboard

---

## 📊 SUMMARY

| Question | Answer |
|----------|--------|
| What does QR install? | **Admin APK only** |
| What installs User APK? | **Admin APK (automatically)** |
| When is User APK installed? | **After Admin provisioning completes** |
| Is User APK visible? | **NO - completely invisible** |
| Can user open User APK? | **NO - no launcher icon** |
| Does user see installation? | **NO - silent background install** |

---

**The user device gets BOTH APKs, but only scans ONE QR code.**
**Admin APK is the controller, User APK is the worker.**
