# 🔧 FIX: USER APK OPENING/CLOSING ISSUE

## ❌ PROBLEM

After User APK installation:
- App opens automatically when Home key is pressed
- App opens and closes repeatedly
- App is visible in Recents
- NOT completely hidden and silent

## ✅ ROOT CAUSE

The main `AndroidManifest.xml` still has MainActivity with LAUNCHER intent-filter, and the User flavor manifest's `tools:node="remove"` is not properly removing it during build.

---

## 🔧 SOLUTION

### Method 1: Update Main AndroidManifest (RECOMMENDED)

**File**: `mobile-app/android/app/src/main/AndroidManifest.xml`

Remove the LAUNCHER intent-filter from MainActivity completely:

```xml
<!-- BEFORE (WRONG) -->
<activity
    android:name=".MainActivity"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
</activity>

<!-- AFTER (CORRECT) -->
<activity
    android:name=".MainActivity"
    android:exported="false"
    android:excludeFromRecents="true"
    android:noHistory="true">
    <!-- NO INTENT-FILTER AT ALL -->
</activity>
```

### Method 2: Use Product Flavors Correctly

Update `build.gradle` to ensure User flavor completely excludes MainActivity:

```gradle
android {
    ...
    productFlavors {
        user {
            applicationId "com.securefinance.emilock.user"
            manifestPlaceholders = [
                appName: "EMI Lock Service",
                hasLauncher: "false"
            ]
        }
        admin {
            applicationId "com.securefinance.emilock.admin"
            manifestPlaceholders = [
                appName: "EMI Admin",
                hasLauncher: "true"
            ]
        }
    }
}
```

Then in AndroidManifest:

```xml
<activity
    android:name=".MainActivity"
    android:exported="${hasLauncher}">
    
    <!-- Only include launcher for admin -->
    <intent-filter tools:node="removeAll">
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
</activity>
```

---

## 🎯 CORRECT USER APK BEHAVIOR

### When Unlocked:
- ❌ NO app icon in launcher
- ❌ NO app in Recents
- ❌ Home key does NOTHING (no app opens)
- ❌ NO visible UI
- ✅ Service runs silently in background
- ✅ Phone behaves 100% normally

### When Locked:
- ✅ LockActivity appears (full-screen)
- ✅ Shows EMI details
- ✅ Blocks Home/Back/Recents
- ✅ Cannot escape

---

## 📝 STEP-BY-STEP FIX

### Step 1: Update Main AndroidManifest

```bash
# Edit file
nano mobile-app/android/app/src/main/AndroidManifest.xml
```

Find MainActivity and **REMOVE** the entire intent-filter block:

```xml
<activity
    android:name=".MainActivity"
    android:exported="false"
    android:excludeFromRecents="true"
    android:noHistory="true"
    android:theme="@style/AppTheme">
    <!-- NO INTENT-FILTER -->
</activity>
```

### Step 2: Ensure User Manifest is Correct

```bash
# Verify
cat mobile-app/android/app/src/user/AndroidManifest.xml
```

Should contain:

```xml
<activity
    android:name=".MainActivity"
    tools:node="remove" />
```

### Step 3: Clean and Rebuild

```bash
cd mobile-app/android
./gradlew clean
./gradlew assembleUserRelease
```

### Step 4: Verify APK

```bash
# Extract and check manifest
unzip -p app/build/outputs/apk/user/release/app-user-release.apk AndroidManifest.xml | xmllint --format -

# Should NOT contain any LAUNCHER intent-filter
```

---

## 🧪 TESTING

### After Installing User APK:

1. **Check Launcher**:
   ```bash
   adb shell pm list packages | grep emilock
   # Should show: com.securefinance.emilock.user
   
   adb shell dumpsys package com.securefinance.emilock.user | grep "MAIN/LAUNCHER"
   # Should return NOTHING
   ```

2. **Press Home Key**:
   - Phone should go to normal launcher
   - NO app should open
   - NO flash/popup

3. **Check Recents**:
   - Open Recents menu
   - User APK should NOT appear

4. **Check Running Services**:
   ```bash
   adb shell dumpsys activity services | grep LockEnforcement
   # Should show service running
   ```

---

## 🔍 DEBUGGING

### If App Still Opens:

1. **Check Merged Manifest**:
   ```bash
   cat mobile-app/android/app/build/intermediates/merged_manifests/userRelease/AndroidManifest.xml
   ```
   
   Look for MainActivity - should have NO intent-filter

2. **Check Installed App**:
   ```bash
   adb shell dumpsys package com.securefinance.emilock.user
   ```
   
   Look for "android.intent.action.MAIN" - should NOT exist

3. **Force Remove from Launcher**:
   ```java
   // In BootReceiver or Service
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
   ```

---

## ✅ FINAL VERIFICATION

After fix, User APK should:

- [ ] Have NO launcher icon
- [ ] NOT open when Home key pressed
- [ ] NOT appear in Recents
- [ ] Service running in background
- [ ] LockActivity ONLY appears when DEVICE_LOCKED=true
- [ ] Phone behaves normally when unlocked

---

## 🚀 ADMIN-SIDE CHECK

Admin can verify User APK installation:

```javascript
// Backend endpoint
GET /api/devices/verify/:customerId

// Response should include:
{
  "userAppInstalled": true,
  "userAppVersion": "3.0.1",
  "userAppHidden": true,  // No launcher
  "serviceRunning": true
}
```

---

## 📊 CORRECT ARCHITECTURE

```
User Device After Provisioning:
├── Admin APK (com.securefinance.emilock.admin)
│   ├── Launcher Icon: ✅ Visible (can be hidden)
│   └── Role: Device Owner
│
└── User APK (com.securefinance.emilock.user)
    ├── Launcher Icon: ❌ NONE
    ├── MainActivity: ❌ DISABLED
    ├── LockActivity: ✅ Only when locked
    └── LockEnforcementService: ✅ Always running
```

---

**The User APK must be COMPLETELY INVISIBLE when unlocked!**
