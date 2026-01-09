# APK Downloads Folder

This folder contains the APK files for the EMI Pro system.

## 🔐 EMI Lock System Architecture

This is a **true enterprise EMI lock system**, not a normal app. The system consists of two APKs:

### 1. **Admin APK** (Device Owner / DPC)
- **File**: `unified-admin-v3.0.1.apk`
- **Package**: `com.securefinance.emilock.admin`
- **Purpose**: Device Policy Controller (DPC)
- **Installation**: Via QR code during factory reset provisioning
- **Visibility**: Has launcher icon, can be opened by admin
- **Capabilities**:
  - Device Owner privileges
  - Can lock/unlock device
  - Can install User APK silently
  - Cannot be uninstalled

### 2. **User APK** (Silent Background Agent)
- **File**: `emi-lock-user-v3.0.1.apk`
- **Package**: `com.securefinance.emilock.user`
- **Purpose**: Background monitoring and lock enforcement
- **Installation**: Silently by Admin APK or manually
- **Visibility**: ❌ **NO LAUNCHER ICON** - completely invisible
- **Behavior**:
  - ✅ Runs silently in background
  - ✅ Connects to backend automatically
  - ✅ Monitors device state (SIM, network, etc.)
  - ✅ Shows UI **ONLY when device is locked**
  - ✅ Auto-closes if user tries to open it (when unlocked)

## 📋 Current Versions

- **Admin APK**: v3.0.1 (versionCode: 35)
- **User APK**: v3.0.1 (versionCode: 35)
- **Checksum (Admin)**: `jfi60nPPaQBgYnbx_sciL9xaJtggHCfo5p8Gs-lq3ms`
- **Checksum (User)**: `gsUicujNgTnWHQ6K_j1Z1jNs9UQFIgGEHKq9lsegu4Q`

## 🔄 Complete Device Flow

### Phase 1: Provisioning (Factory Reset)
1. Device factory reset
2. QR code scanned during setup
3. Admin APK installed as Device Owner
4. Device provisioned silently
5. ❌ No UI visible to user

### Phase 2: Normal Usage (Unlocked)
1. User uses phone normally
2. User APK runs in background (invisible)
3. Heartbeat syncs with backend
4. Monitors SIM changes, network, etc.
5. ❌ No app icon visible
6. ❌ Cannot be opened manually

### Phase 3: Lock Command
1. Admin sends LOCK from dashboard
2. FCM push received (or synced on next connection)
3. 🔒 **Lock screen appears FULL SCREEN**
4. Home/Back/Recent buttons disabled
5. Cannot access other apps
6. Cannot power off normally

### Phase 4: Unlock Command
1. Admin sends UNLOCK from dashboard
2. Lock screen dismissed
3. Phone returns to normal
4. User APK returns to background (invisible)

## 🌐 Download URLs

When deployed to Fly.io:
- **Admin APK (for provisioning)**: `https://emi-pro-app.fly.dev/apk/admin/admin-v3.0.1.apk`
- **User APK (for manual install)**: `https://emi-pro-app.fly.dev/apk/user/user-v3.0.1.apk`

## 🔧 How to Update APKs

### Build Both APKs:
```bash
cd mobile-app/android

# Build Admin APK (for provisioning)
./gradlew assembleAdminRelease

# Build User APK (silent background agent)
./gradlew assembleUserRelease
```

### Copy to Backend:
```bash
# Admin APK
cp mobile-app/android/app/build/outputs/apk/admin/release/app-admin-release.apk \
   backend/public/apk/admin/admin-v3.0.1.apk

# User APK
cp mobile-app/android/app/build/outputs/apk/user/release/app-user-release.apk \
   backend/public/apk/user/user-v3.0.1.apk
```

### Calculate Checksums:
```bash
cd backend
node -e "const { getApkChecksum } = require('./utils/checksum'); const path = require('path'); console.log('Admin:', getApkChecksum(path.join(__dirname, 'public/apk/admin/admin-v3.0.1.apk'))); console.log('User:', getApkChecksum(path.join(__dirname, 'public/apk/user/user-v3.0.1.apk')));"
```

### Update Checksum in Code:
Update the fallback checksum in `backend/routes/provisioningRoutes.js`

### Deploy:
```bash
git add backend/public/
git commit -m "Update APK files"
git push origin main
```

## ⚠️ Critical Rules

### ❌ NEVER:
- Show UI when device is unlocked (User APK)
- Allow User APK to have launcher icon
- Rely on React Native for lock state
- Allow User APK to be opened manually

### ✅ ALWAYS:
- Control UI from Android native layer
- Use SharedPreferences for lock state
- Treat React Native as UI renderer only
- Ensure background services run independently

## 🧪 Testing Checklist

After deploying new APKs:

| Test | Expected Result |
|------|----------------|
| Factory reset + provision | ✅ Admin APK installs, no UI visible |
| Reboot device | ✅ No User APK UI appears |
| Press Home/Menu | ✅ User APK doesn't open |
| Turn on Wi-Fi | ✅ Silent background sync, no UI |
| Send LOCK command | ✅ Lock screen appears full screen |
| Reboot while locked | ✅ Lock screen reappears |
| Send UNLOCK command | ✅ Lock screen disappears, back to normal |
| Try to open User APK | ✅ App closes immediately (when unlocked) |

## 📝 Notes

- APK files are large (30-40 MB each) and are committed to git
- Alternative: Upload to cloud storage (S3, Google Cloud Storage)
- Alternative: Build as part of CI/CD pipeline
- For now, committed to repository for simplicity

---

**This is a SYSTEM CONTROLLER, not an app.**
