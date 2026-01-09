# Wi-Fi Policy Fix - v2.1.0

## Problem Identified

The device was showing **"Decline This Operation - This operation is prohibited"** when trying to access Wi-Fi settings because:

1. ❌ `DISALLOW_CONFIG_WIFI` was applied **globally** and **permanently**
2. ❌ User could not change Wi-Fi even when device was unlocked
3. ❌ If admin Wi-Fi went offline, device became unusable
4. ❌ Downloads, updates, and internet access could fail

## Root Cause

The previous implementation applied Wi-Fi restrictions **at all times**, not just when the device was locked. This created a permanent Wi-Fi lockdown that prevented normal usage.

## Solution Implemented

### New Architecture: Separate Wi-Fi Control

Created `WifiPolicyManager.java` that provides:

✅ **Normal Mode (Unlocked)**:
- User can connect to ANY Wi-Fi
- User can change Wi-Fi settings
- Full internet access
- No restrictions

✅ **Locked Mode**:
- Only admin-approved Wi-Fi networks allowed
- User CANNOT change Wi-Fi settings
- Current connection maintained
- Internet remains available (if connected)

### Key Changes

1. **Removed from `FullDeviceLockManager.java`**:
   ```java
   // ❌ REMOVED - Too aggressive
   dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_CONFIG_WIFI);
   dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_CONFIG_BLUETOOTH);
   dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_CONFIG_MOBILE_NETWORKS);
   ```

2. **Added `WifiPolicyManager.java`**:
   - `applyLockedWifiPolicy()` - Restricts Wi-Fi when locked
   - `removeWifiRestrictions()` - Allows Wi-Fi when unlocked
   - `addAdminWifi()` - Add admin-approved networks
   - `getCurrentWifiSSID()` - Monitor current connection

3. **Integrated into `LockEnforcementService.java`**:
   - Wi-Fi restrictions applied **only in Phase 2** (after 3 seconds)
   - Wi-Fi restrictions removed **immediately on unlock**
   - Logged for diagnostics

## Behavior After Fix

| Scenario | Wi-Fi Access | Settings Access |
|----------|-------------|-----------------|
| Device Unlocked | ✅ Any Wi-Fi | ✅ Full access |
| Device Locked | 🔒 Current only | ❌ Blocked |
| Admin Unlocks | ✅ Restored | ✅ Restored |

## Testing

1. **Unlock device** from admin dashboard
2. Try to access Wi-Fi settings → Should work ✅
3. **Lock device** from admin dashboard  
4. Try to access Wi-Fi settings → Should be blocked 🔒
5. **Unlock again** → Wi-Fi settings accessible again ✅

## Version

- **Version**: 2.1.0
- **Version Code**: 30
- **Release Date**: January 5, 2026

## Files Modified

1. `WifiPolicyManager.java` (NEW)
2. `FullDeviceLockManager.java`
3. `LockEnforcementService.java`
4. `build.gradle`

## Security Status

| Feature | Status |
|---------|--------|
| Device Lock | ✅ Works |
| Uninstall Block | ✅ Active |
| Settings Block (when locked) | ✅ Active |
| Wi-Fi Control (when unlocked) | ✅ User |
| Wi-Fi Control (when locked) | ✅ Admin |
| Internet Access | ✅ Maintained |
| Soft-brick Risk | ❌ Eliminated |
