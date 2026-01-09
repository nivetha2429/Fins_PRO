# 🔒 HIDE ADMIN APK LAUNCHER (PRODUCTION SECURITY)

## ⚠️ WHY HIDE ADMIN APK?

### Problem:
If Admin APK has a visible launcher icon, user can:
- Open admin controls
- See sensitive information
- Attempt to disable features
- Cause confusion

### Solution:
**Hide Admin APK launcher completely**

---

## ✅ METHOD 1: Remove Launcher from Admin APK (RECOMMENDED)

### Admin APK Manifest

**File**: `mobile-app/android/app/src/admin/AndroidManifest.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <application>
        <!-- 
            ADMIN FLAVOR: NO LAUNCHER ICON
            Admin controls accessed ONLY via web dashboard
            Device-side app runs in background only
        -->
        
        <!-- Remove launcher from MainActivity -->
        <activity
            android:name=".MainActivity"
            tools:node="remove" />
            
        <!-- Keep ONLY background services -->
        <service
            android:name=".AdminProvisioningService"
            android:foregroundServiceType="dataSync"
            android:exported="false" />
            
        <receiver
            android:name=".DeviceAdminReceiver"
            android:exported="true"
            android:permission="android.permission.BIND_DEVICE_ADMIN">
            <meta-data
                android:name="android.app.device_admin"
                android:resource="@xml/device_admin" />
            <intent-filter>
                <action android:name="android.app.action.DEVICE_ADMIN_ENABLED" />
                <action android:name="android.app.action.PROFILE_PROVISIONING_COMPLETE" />
            </intent-filter>
        </receiver>
    </application>

</manifest>
```

**Result:**
- ✅ Admin APK has NO launcher icon
- ✅ Cannot be opened by user
- ✅ All controls via web dashboard
- ✅ Cleaner, more professional

---

## ✅ METHOD 2: Hidden Launcher with PIN Protection (ALTERNATIVE)

If you need device-side admin access for troubleshooting:

### Step 1: Create Hidden Launcher Activity

**File**: `HiddenAdminActivity.java`

```java
package com.securefinance.emilock;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;

public class HiddenAdminActivity extends Activity {
    
    private static final String ADMIN_PIN = "9876"; // Change this
    private int tapCount = 0;
    private long lastTapTime = 0;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Secret knock: 5 taps within 2 seconds
        long currentTime = System.currentTimeMillis();
        if (currentTime - lastTapTime < 2000) {
            tapCount++;
        } else {
            tapCount = 1;
        }
        lastTapTime = currentTime;
        
        if (tapCount >= 5) {
            showPinDialog();
        } else {
            finish();
        }
    }
    
    private void showPinDialog() {
        // Show PIN input dialog
        // If correct → launch MainActivity
        // If wrong → finish()
    }
}
```

### Step 2: Manifest

```xml
<activity
    android:name=".HiddenAdminActivity"
    android:excludeFromRecents="true"
    android:noHistory="true"
    android:theme="@android:style/Theme.Translucent.NoTitleBar">
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
</activity>

<activity
    android:name=".MainActivity"
    android:exported="false" />
```

**Result:**
- ✅ Launcher icon exists but opens hidden activity
- ✅ Requires secret knock + PIN
- ✅ Normal users cannot access
- ✅ Admins can troubleshoot on device

---

## ✅ METHOD 3: Disable Launcher Programmatically

**File**: `DeviceAdminReceiver.java`

```java
@Override
public void onProfileProvisioningComplete(Context context, Intent intent) {
    super.onProfileProvisioningComplete(context, intent);
    
    // Hide launcher icon after provisioning
    PackageManager pm = context.getPackageManager();
    ComponentName componentName = new ComponentName(
        context,
        MainActivity.class
    );
    
    pm.setComponentEnabledSetting(
        componentName,
        PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
        PackageManager.DONT_KILL_APP
    );
    
    Log.i(TAG, "✅ Admin launcher hidden");
}
```

**Result:**
- ✅ Icon visible during setup
- ✅ Automatically hidden after provisioning
- ✅ Can be re-enabled via ADB if needed

---

## 🎯 RECOMMENDED APPROACH FOR PRODUCTION

### For EMI Lock System:

**Use METHOD 1 (No Launcher)**

**Why?**
- Admin controls should be web-based
- Device-side app is just a controller
- Cleaner user experience
- No confusion
- More professional

### Architecture:

```
Admin Dashboard (Web)
    ↓
Backend API
    ↓
FCM Push
    ↓
Admin APK (Device - Background Only)
    ↓
User APK (Device - Background + Lock Screen)
```

**Both APKs invisible to user**
**All controls via web dashboard**

---

## 🔐 SECURITY BENEFITS

### No Launcher = Better Security

1. **User cannot tamper**
   - Cannot access admin settings
   - Cannot see device info
   - Cannot attempt to disable

2. **Professional appearance**
   - No confusing icons
   - Clean device
   - Looks like normal phone

3. **Centralized control**
   - All admin actions via web
   - Audit trail
   - Better compliance

---

## 🧪 TESTING

### Verify Admin APK is hidden:

```bash
# Check installed apps
adb shell pm list packages | grep securefinance

# Expected:
package:com.securefinance.emilock.admin
package:com.securefinance.emilock.user

# Check launcher activities
adb shell pm dump com.securefinance.emilock.admin | grep "MAIN/LAUNCHER"

# Expected: (empty - no launcher)
```

### Verify functionality still works:

- [ ] Device Owner status maintained
- [ ] FCM commands received
- [ ] User APK installs silently
- [ ] Lock/unlock works
- [ ] Backend communication works

---

## 📊 COMPARISON

| Method | Visibility | Security | Troubleshooting |
|--------|-----------|----------|-----------------|
| No Launcher | ❌ Hidden | ✅ Best | ADB only |
| Hidden + PIN | ⚠️ Visible | ✅ Good | Secret access |
| Programmatic | ⚠️ Initially visible | ✅ Good | Can re-enable |

**Recommendation: No Launcher (METHOD 1)**

---

## 🚀 IMPLEMENTATION

Update Admin flavor manifest:

```bash
# File: mobile-app/android/app/src/admin/AndroidManifest.xml
# Remove MainActivity launcher intent-filter
# Keep only DeviceAdminReceiver and services
```

Rebuild:

```bash
cd mobile-app/android
./gradlew assembleAdminRelease
```

Result:
- ✅ Admin APK has no launcher icon
- ✅ User APK has no launcher icon
- ✅ Both APKs completely invisible
- ✅ All controls via web dashboard

---

**Production EMI systems should have ZERO visible apps on user device.**
