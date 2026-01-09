# 🔒 Enterprise Lock - Code Changes Required

## Files Created:
1. ✅ `KioskLauncher.java` - Replaces system launcher

## Files to Update:

### 1. AndroidManifest.xml

**Add after MainActivity declaration:**

```xml
<!-- ================= KIOSK LAUNCHER (REPLACES SYSTEM LAUNCHER) ================= -->
<activity
    android:name=".KioskLauncher"
    android:exported="true"
    android:launchMode="singleTask"
    android:excludeFromRecents="true"
    android:theme="@android:style/Theme.NoTitleBar.Fullscreen">
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.HOME" />
        <category android:name="android.intent.category.DEFAULT" />
    </intent-filter>
</activity>
```

---

### 2. DeviceAdminReceiver.java

**Add to `onProfileProvisioningComplete()` method (after line ~50):**

```java
// 🔒 ENTERPRISE LOCK SETUP
try {
    DevicePolicyManager dpm = (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);
    ComponentName adminComponent = new ComponentName(context, DeviceAdminReceiver.class);
    
    // 1. Enable Lock Task Mode for our package
    dpm.setLockTaskPackages(adminComponent, new String[]{
        context.getPackageName()
    });
    Log.i(TAG, "✅ Lock Task Mode enabled");
    
    // 2. Set KioskLauncher as default launcher
    IntentFilter filter = new IntentFilter(Intent.ACTION_MAIN);
    filter.addCategory(Intent.CATEGORY_HOME);
    filter.addCategory(Intent.CATEGORY_DEFAULT);
    
    ComponentName kioskLauncher = new ComponentName(
        context.getPackageName(),
        "com.securefinance.emilock.KioskLauncher"
    );
    
    dpm.addPersistentPreferredActivity(adminComponent, filter, kioskLauncher);
    Log.i(TAG, "✅ Kiosk Launcher set as default - Home button now controlled");
    
    // 3. Disable status bar (optional but recommended for full lock)
    try {
        dpm.setStatusBarDisabled(adminComponent, false); // Start with enabled
        Log.i(TAG, "✅ Status bar control enabled");
    } catch (Exception e) {
        Log.w(TAG, "Status bar control not available on this device");
    }
    
} catch (Exception e) {
    Log.e(TAG, "❌ Failed to setup enterprise lock", e);
}
```

---

### 3. LockActivity.java

**Add to `onCreate()` method (at the beginning, after setContentView):**

```java
// Start Lock Task Mode (Enterprise Kiosk)
try {
    startLockTask();
    Log.i(TAG, "✅ Lock Task Mode started - Device fully locked");
} catch (Exception e) {
    Log.e(TAG, "❌ Failed to start lock task mode", e);
}
```

**Add to `onDestroy()` method:**

```java
@Override
protected void onDestroy() {
    // Only stop lock task if device is unlocked
    SharedPreferences prefs = getSharedPreferences("PhoneLockPrefs", MODE_PRIVATE);
    boolean isLocked = prefs.getBoolean("DEVICE_LOCKED", false);
    
    if (!isLocked) {
        try {
            stopLockTask();
            Log.i(TAG, "✅ Lock Task Mode stopped - Device unlocked");
        } catch (Exception e) {
            Log.e(TAG, "Failed to stop lock task", e);
        }
    }
    
    super.onDestroy();
}
```

---

### 4. LockEnforcementService.java

**Update `lockDeviceImmediately()` method:**

```java
private void lockDeviceImmediately() {
    Log.i(TAG, "🔒 LOCKING DEVICE IMMEDIATELY (Enterprise Mode)");
    
    // 1. Set lock flag
    SharedPreferences prefs = getSharedPreferences("PhoneLockPrefs", MODE_PRIVATE);
    prefs.edit().putBoolean("DEVICE_LOCKED", true).apply();
    
    // 2. Launch lock screen with highest priority
    Intent lockIntent = new Intent(this, LockActivity.class);
    lockIntent.addFlags(
        Intent.FLAG_ACTIVITY_NEW_TASK |
        Intent.FLAG_ACTIVITY_CLEAR_TASK |
        Intent.FLAG_ACTIVITY_NO_HISTORY |
        Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS
    );
    
    try {
        startActivity(lockIntent);
        Log.i(TAG, "✅ Lock screen launched");
    } catch (Exception e) {
        Log.e(TAG, "❌ Failed to launch lock screen", e);
    }
}
```

---

### 5. BootReceiver.java

**Update `onReceive()` method to ensure lock on boot:**

```java
@Override
public void onReceive(Context context, Intent intent) {
    if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
        Log.d(TAG, "📱 Boot completed - checking lock status");
        
        SharedPreferences prefs = context.getSharedPreferences("PhoneLockPrefs", Context.MODE_PRIVATE);
        boolean isLocked = prefs.getBoolean("DEVICE_LOCKED", false);
        
        if (isLocked) {
            Log.i(TAG, "🔒 Device is locked - launching lock screen immediately");
            
            // Launch lock screen
            Intent lockIntent = new Intent(context, LockActivity.class);
            lockIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                Intent.FLAG_ACTIVITY_CLEAR_TASK
            );
            
            try {
                context.startActivity(lockIntent);
                Log.i(TAG, "✅ Lock screen launched on boot");
            } catch (Exception e) {
                Log.e(TAG, "❌ Failed to launch lock screen on boot", e);
            }
        }
        
        // Start lock enforcement service
        Intent serviceIntent = new Intent(context, LockEnforcementService.class);
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
        
        Log.d(TAG, "✅ Lock enforcement service started");
    }
}
```

---

## 🧪 Testing After Implementation

### Test 1: Immediate Lock
```bash
# From admin dashboard, click "Lock"
# Device should lock within 1-2 seconds
# Monitor with:
adb logcat | grep -E "LOCKING DEVICE|Lock Task Mode"
```

### Test 2: Home Button
```bash
# While locked, press Home button
# Should NOT go to launcher
# Should stay on lock screen or return to it
adb logcat | grep KIOSK_LAUNCHER
```

### Test 3: Reboot Test
```bash
# While locked, reboot device
adb reboot

# After reboot, device should show lock screen immediately
adb logcat | grep "Boot completed"
```

### Test 4: Verify Kiosk Setup
```bash
# Check if kiosk launcher is set
adb shell dumpsys package | grep -A 10 "preferred activities"

# Check lock task packages
adb shell dumpsys device_policy | grep -A 5 "lock task"
```

---

## 📋 Implementation Checklist

- [ ] 1. Add `KioskLauncher.java` (✅ Already created)
- [ ] 2. Update `AndroidManifest.xml` - Add KioskLauncher activity
- [ ] 3. Update `DeviceAdminReceiver.java` - Add kiosk mode setup
- [ ] 4. Update `LockActivity.java` - Add lock task mode
- [ ] 5. Update `LockEnforcementService.java` - Update lock logic
- [ ] 6. Update `BootReceiver.java` - Ensure boot lock
- [ ] 7. Rebuild APK (admin flavor)
- [ ] 8. Test on device
- [ ] 9. Deploy to production

---

## 🚀 Build Commands

```bash
# Clean build
cd mobile-app/android
./gradlew clean

# Build admin release APK
./gradlew assembleAdminRelease

# Copy to backend
cp app/build/outputs/apk/admin/release/app-admin-release.apk \
   ../../backend/public/apk/unified-admin-v3.0.1.apk

# Calculate checksum
cd ../../backend
node -e "const {getApkChecksum} = require('./utils/checksum'); console.log(getApkChecksum('./public/apk/unified-admin-v3.0.1.apk'));"

# Update provisioning route with new checksum
# Update version to 3.0.1 in provisioningRoutes.js
```

---

## ⚠️ Important Notes

### Device Owner Requirements:
- These features ONLY work with Device Owner privileges
- Must be set during QR provisioning
- Cannot be added to already-provisioned devices

### Lock Task Mode:
- Requires `setLockTaskPackages()` to be called first
- Only works for packages in the whitelist
- Disables Back, Home, Recents buttons
- Blocks notification shade

### Kiosk Launcher:
- Becomes the default launcher
- Home button always goes to our app
- Persists across reboots
- Can only be removed by factory reset

---

**Priority:** 🔴 **CRITICAL**  
**Impact:** Transforms app from basic lock to enterprise-grade security  
**Next Step:** Apply these changes and rebuild APK
