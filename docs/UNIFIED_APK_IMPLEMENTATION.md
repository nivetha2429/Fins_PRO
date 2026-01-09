# 🎯 Unified APK Implementation Plan

## Overview
Merge the Admin DPC and User APK into a single unified APK that handles both Device Owner provisioning and lock screen enforcement.

## Current Architecture (Before)
```
QR Scan → Admin DPC (Device Owner) → Downloads & Installs → User APK (Lock Screen)
          Package: .admin                                    Package: .user
```

## New Architecture (After)
```
QR Scan → Unified APK (Device Owner + Lock Screen)
          Package: com.securefinance.emilock.admin
```

## Implementation Steps

### 1. **Merge Lock Screen Code into Admin Flavor**
- Copy lock screen activities and services to admin flavor
- Include `LockActivity.java`, `LockEnforcementService.java`, `FullDeviceLockManager.java`
- Add all lock-related receivers (SimChangeReceiver, SmsLockReceiver, etc.)

### 2. **Update AdminReceiver**
- Remove UserAppInstaller logic (no longer needed)
- Add lock service initialization after provisioning
- Start LockEnforcementService immediately
- Configure device restrictions and permissions

### 3. **Update AndroidManifest (Admin Flavor)**
- Declare AdminReceiver as Device Owner
- Add all lock screen activities and services
- Include all necessary permissions
- Register all broadcast receivers

### 4. **Update Build Configuration**
- Ensure admin flavor includes all dependencies
- Update version to 3.0.0 (major change)
- Configure proper signing

### 5. **Update Backend Provisioning**
- Update QR payload to point to unified APK
- Update APK filename: `unified-dpc-v3.0.0.apk`
- Calculate new checksum
- Update provisioning routes

### 6. **Update React Native App Logic**
- Modify App.tsx to handle unified mode
- Remove user/admin mode switching
- Always show lock screen when isLocked=true
- Always report device info

## Key Changes

### Files to Modify:
1. `/mobile-app/android/app/src/admin/AndroidManifest.xml` - Add lock screen components
2. `/mobile-app/android/app/src/admin/java/.../AdminReceiver.java` - Remove installer, add lock init
3. `/mobile-app/App.tsx` - Unified mode logic
4. `/backend/routes/provisioningRoutes.js` - Update APK path and checksum
5. `/mobile-app/android/app/build.gradle` - Update version to 3.0.0

### Files to Create:
1. Admin flavor specific lock screen components (if needed)

### Files to Remove:
- `/mobile-app/android/admin-dpc/` - No longer needed (merged into main app)

## Benefits

✅ **Single APK** - Easier deployment and management
✅ **No silent installation** - Avoids OEM-specific issues
✅ **Immediate functionality** - Lock screen available right after QR scan
✅ **Simpler architecture** - One codebase, one package
✅ **Better reliability** - No dependency on second app installation

## Testing Plan

1. Build unified APK
2. Upload to server
3. Generate QR code
4. Factory reset test device
5. Scan QR code
6. Verify:
   - Device Owner set correctly
   - App appears on device
   - Lock/unlock works
   - Device info reported
   - All restrictions applied

## Rollback Plan

If issues occur:
- Revert to admin-dpc module
- Restore previous provisioning routes
- Use previous APK version

---

**Status:** Ready to implement
**Estimated Time:** 30-45 minutes
**Risk Level:** Medium (requires testing)
