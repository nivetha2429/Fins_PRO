# 🔐 EMI LOCK SYSTEM - PRODUCTION IMPLEMENTATION

## ✅ CORRECT BEHAVIOR (NON-NEGOTIABLE)

### When Device is UNLOCKED:
- ❌ NO app icon visible in launcher
- ❌ NO UI opens on Home key press
- ❌ NO app appears in Recents
- ❌ NO visible activity whatsoever
- ✅ Background service runs silently
- ✅ Connects to backend for commands
- ✅ Completely invisible to user

### When Device is LOCKED:
- ✅ Full-screen lock UI appears
- ✅ Shows EMI amount, due date, support contact
- ✅ Home/Back/Recents buttons disabled
- ✅ Cannot escape lock screen
- ✅ Persists across reboots
- ✅ Cannot be bypassed

---

## 🧱 ARCHITECTURE

### Admin APK (Device Owner)
- **Package**: `com.securefinance.emilock.admin`
- **Role**: Controller
- **Installed**: Via QR code provisioning
- **Capabilities**:
  - Device Owner privileges
  - Silent install User APK
  - Apply security policies
  - Cannot be uninstalled

### User APK (Silent Agent)
- **Package**: `com.securefinance.emilock.user`
- **Role**: Worker/Enforcer
- **Installed**: Silently by Admin APK
- **Behavior**:
  - NO launcher icon
  - NO visible UI when unlocked
  - Background service always running
  - Shows lock screen ONLY when locked

---

## 📦 DATA FLOW

### 1. Lock Command Received

```json
{
  "command": "LOCK",
  "emiAmount": "₹2,450",
  "dueDate": "05 Jan 2026",
  "supportPhone": "+91 98765 43210",
  "supportMessage": "Please clear EMI to unlock device",
  "customerName": "John Doe"
}
```

### 2. Stored in SharedPreferences (Native)

```java
SharedPreferences prefs = getSharedPreferences("PhoneLockPrefs", MODE_PRIVATE);
prefs.edit()
  .putBoolean("DEVICE_LOCKED", true)
  .putString("EMI_AMOUNT", "₹2,450")
  .putString("DUE_DATE", "05 Jan 2026")
  .putString("SUPPORT_PHONE", "+91 98765 43210")
  .putString("SUPPORT_MSG", "Please clear EMI to unlock device")
  .putString("CUSTOMER_NAME", "John Doe")
  .apply();
```

### 3. LockActivity Launched (ONLY HERE)

```java
Intent i = new Intent(context, LockActivity.class);
i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | FLAG_ACTIVITY_CLEAR_TASK);
startActivity(i);
```

### 4. Lock Screen Displays Data

- Reads from SharedPreferences
- Populates TextViews
- Blocks all escape routes
- Stays visible until unlocked

---

## 🔓 UNLOCK FLOW

### 1. Admin sends UNLOCK command

```json
{
  "command": "UNLOCK"
}
```

### 2. Native code processes

```java
prefs.edit().putBoolean("DEVICE_LOCKED", false).apply();
stopLockTask();
finishAffinity(); // Lock screen disappears
```

### 3. Result
- Lock screen instantly gone
- Phone returns to normal
- User APK returns to background (invisible)

---

## 🚫 WHAT USER CANNOT DO

| Action | Result |
|--------|--------|
| Press Home | ❌ Nothing happens |
| Press Back | ❌ Blocked |
| Open Recents | ❌ Blocked |
| Power off | 🔒 Lock persists after reboot |
| Factory reset | ❌ Requires Device Owner removal |
| Uninstall | ❌ Impossible (Device Owner) |
| Force stop | ❌ Blocked by system |

---

## 🔧 KEY FILES

### User APK Manifest
```xml
<!-- NO LAUNCHER ACTIVITY -->
<activity
    android:name=".MainActivity"
    android:exported="true"
    android:excludeFromRecents="true"
    android:taskAffinity="">
    <!-- NO LAUNCHER INTENT-FILTER -->
</activity>

<!-- Lock Activity (NOT exported) -->
<activity
    android:name=".LockActivity"
    android:exported="false"
    android:excludeFromRecents="true"
    android:launchMode="singleTask"/>
```

### LockActivity.java
- Checks `DEVICE_LOCKED` flag
- If false, immediately finishes
- If true, shows full-screen UI
- Blocks all hardware keys
- Forces itself to front if paused

### BootReceiver.java
- Listens for `ACTION_BOOT_COMPLETED`
- Checks lock state
- Re-launches LockActivity if locked
- Ensures lock survives reboot

---

## ✅ PRODUCTION CHECKLIST

Before deployment, verify:

### Unlocked State
- [ ] No app icon in launcher
- [ ] Home key does nothing
- [ ] No app in Recents
- [ ] No UI visible
- [ ] Background service running

### Locked State
- [ ] Full-screen lock appears
- [ ] EMI data displays correctly
- [ ] Home/Back blocked
- [ ] Cannot escape
- [ ] Reboot → lock persists

### Security
- [ ] Cannot uninstall
- [ ] Cannot force stop
- [ ] Cannot bypass
- [ ] Root detection (optional)
- [ ] Anti-tampering (optional)

---

## 🎯 THIS MATCHES REAL EMI SYSTEMS

Behavior identical to:
- PayJoy
- MobiLender
- LockMe
- SunKing Finance
- Xiaomi Finance Lock

**Silent. Invisible. Unbreakable.**

---

## 📝 NEXT STEPS

1. **Build APKs**: `./gradlew assembleAdminRelease assembleUserRelease`
2. **Deploy to server**: Copy to `backend/public/apk/admin/` and `backend/public/apk/user/`
3. **Test provisioning**: Scan QR → Admin installs → User installs silently
4. **Test lock**: Send lock command → UI appears
5. **Test unlock**: Send unlock command → UI disappears
6. **Test reboot**: Reboot while locked → Lock persists

---

**This is a SYSTEM CONTROLLER, not an app.**
