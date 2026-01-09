# 🔒 ADMIN APK AUTO-HIDE - PRODUCTION SECURITY

## 🎯 OBJECTIVE

After provisioning completes, the Admin APK should:
1. ✅ Hide its own launcher icon
2. ✅ Become invisible to user
3. ✅ Remain accessible only via PIN/secret knock
4. ✅ Continue functioning as Device Owner

---

## 🔧 IMPLEMENTATION

### Method 1: Programmatic Hide (RECOMMENDED)

**File**: `DeviceAdminReceiver.java` (Admin APK)

```java
@Override
public void onProfileProvisioningComplete(Context context, Intent intent) {
    super.onProfileProvisioningComplete(context, intent);
    
    // ... existing provisioning code ...
    
    // Hide Admin APK launcher after provisioning
    hideAdminLauncher(context);
    
    Log.i(TAG, "✅ Admin APK hidden - accessible only via secret method");
}

private void hideAdminLauncher(Context context) {
    try {
        PackageManager pm = context.getPackageManager();
        
        // Get MainActivity component
        ComponentName componentName = new ComponentName(
            context,
            MainActivity.class
        );
        
        // Disable the launcher
        pm.setComponentEnabledSetting(
            componentName,
            PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
            PackageManager.DONT_KILL_APP
        );
        
        Log.i(TAG, "✅ Admin launcher hidden");
        
    } catch (Exception e) {
        Log.e(TAG, "Failed to hide admin launcher", e);
    }
}
```

---

### Method 2: Secret Knock Entry

**File**: `HiddenAdminActivity.java` (Admin APK)

```java
package com.securefinance.emilock;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.text.InputType;
import android.widget.EditText;
import android.widget.Toast;

/**
 * Hidden entry point for Admin APK
 * Requires secret knock (5 taps) + PIN
 * 
 * Created by: KaviNivi
 */
public class HiddenAdminActivity extends Activity {
    
    private static final String TAG = "HiddenAdminActivity";
    private static final String ADMIN_PIN = "9876"; // Change in production
    private static final int REQUIRED_TAPS = 5;
    private static final long TAP_WINDOW_MS = 2000;
    
    private static int tapCount = 0;
    private static long lastTapTime = 0;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Transparent theme - user sees nothing
        setTheme(android.R.style.Theme_Translucent_NoTitleBar);
        
        long currentTime = System.currentTimeMillis();
        
        // Check if within tap window
        if (currentTime - lastTapTime < TAP_WINDOW_MS) {
            tapCount++;
        } else {
            tapCount = 1;
        }
        
        lastTapTime = currentTime;
        
        // If secret knock detected
        if (tapCount >= REQUIRED_TAPS) {
            tapCount = 0;
            showPinDialog();
        } else {
            // Show hint on 3rd tap
            if (tapCount == 3) {
                Toast.makeText(this, "Keep tapping...", Toast.LENGTH_SHORT).show();
            }
            finish();
        }
    }
    
    private void showPinDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Admin Access");
        builder.setMessage("Enter PIN:");
        
        final EditText input = new EditText(this);
        input.setInputType(InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_VARIATION_PASSWORD);
        builder.setView(input);
        
        builder.setPositiveButton("OK", (dialog, which) -> {
            String enteredPin = input.getText().toString();
            
            if (ADMIN_PIN.equals(enteredPin)) {
                // Correct PIN - launch MainActivity
                Intent intent = new Intent(this, MainActivity.class);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
                finish();
            } else {
                Toast.makeText(this, "Incorrect PIN", Toast.LENGTH_SHORT).show();
                finish();
            }
        });
        
        builder.setNegativeButton("Cancel", (dialog, which) -> {
            dialog.cancel();
            finish();
        });
        
        builder.show();
    }
}
```

**AndroidManifest.xml** (Admin APK):

```xml
<!-- Hidden entry point -->
<activity
    android:name=".HiddenAdminActivity"
    android:excludeFromRecents="true"
    android:noHistory="true"
    android:theme="@android:style/Theme.Translucent.NoTitleBar"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
</activity>

<!-- Main activity (hidden) -->
<activity
    android:name=".MainActivity"
    android:exported="false"
    android:excludeFromRecents="true" />
```

---

### Method 3: ADB Re-enable (Emergency Access)

```bash
# If admin needs to access Admin APK
adb shell pm enable com.securefinance.emilock.admin/.MainActivity

# Launch
adb shell am start -n com.securefinance.emilock.admin/.MainActivity

# Hide again after use
adb shell pm disable com.securefinance.emilock.admin/.MainActivity
```

---

## 🔐 SECURITY BENEFITS

### With Hidden Admin APK:

✅ **User cannot:**
- See admin app in launcher
- Access admin controls
- View sensitive data
- Tamper with settings
- Discover device is managed

✅ **Admin can:**
- Access via secret knock + PIN
- Control all devices remotely
- Update settings via backend
- Re-enable via ADB if needed

---

## 🧪 TESTING

### After Provisioning:

```bash
# Check if Admin APK launcher is hidden
adb shell dumpsys package com.securefinance.emilock.admin | grep "MAIN/LAUNCHER"

# Should show HiddenAdminActivity, NOT MainActivity
```

### Test Secret Knock:

1. Tap Admin APK icon 5 times quickly (within 2 seconds)
2. PIN dialog should appear
3. Enter correct PIN (9876)
4. MainActivity should open

---

## 📊 FINAL STATE

```
User Device After Provisioning:

Admin APK
├── Launcher Icon: ✅ Visible (HiddenAdminActivity)
├── Tap 5 times → PIN dialog
├── Correct PIN → MainActivity opens
├── Wrong PIN → Nothing happens
└── Role: Device Owner (always active)

User APK
├── Launcher Icon: ❌ NONE
├── Completely invisible
└── Role: Lock Enforcer
```

---

## ⚙️ CONFIGURATION

### Change PIN:

```java
// In HiddenAdminActivity.java
private static final String ADMIN_PIN = "YOUR_SECURE_PIN";
```

### Change Tap Count:

```java
private static final int REQUIRED_TAPS = 7; // Increase for more security
```

### Change Tap Window:

```java
private static final long TAP_WINDOW_MS = 3000; // 3 seconds
```

---

## 🚀 DEPLOYMENT

### Build with Hidden Admin:

```bash
cd mobile-app/android
./gradlew assembleAdminRelease

# APK will have:
# - HiddenAdminActivity as launcher
# - MainActivity disabled by default
# - Secret knock + PIN required
```

---

## ✅ PRODUCTION CHECKLIST

- [ ] HiddenAdminActivity implemented
- [ ] Secret knock configured (5 taps)
- [ ] PIN set to secure value (NOT 9876)
- [ ] MainActivity hidden after provisioning
- [ ] Tested secret knock on real device
- [ ] ADB re-enable procedure documented
- [ ] Admin trained on secret access method

---

**Admin APK is now completely hidden from users, accessible only via secret method!**

**Created by: KaviNivi**
