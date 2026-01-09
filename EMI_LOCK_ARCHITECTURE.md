# 🔐 EMI LOCK - PRODUCTION ARCHITECTURE

**This is a SYSTEM CONTROLLER, not an app.**

---

## 📱 USER DEVICE BEHAVIOR (Customer Phone)

### Phase 1: First Time Setup (Factory Reset)
```
1. Device factory reset
2. QR code scanned during setup
3. User APK installed as Device Owner
4. ❌ NO UI visible
5. ❌ NO launcher icon
6. ✅ Silent background service starts
```

### Phase 2: Normal Usage (Unlocked)
```
✅ User can:
   - Use WhatsApp, YouTube, Chrome
   - Install apps
   - Change settings
   - Restart phone

❌ User CANNOT see:
   - EMI Lock app
   - Any notification
   - Any icon
   - Any background message

📌 From user POV: "This is a normal phone"
```

### Phase 3: EMI Payment Missed → Lock
```
🔴 Screen goes black
🔴 EMI Lock screen appears
🔴 Touch outside blocked

Lock screen shows:
   - EMI Due Amount
   - Payment message
   - Contact number

User CANNOT:
   ❌ Open any app
   ❌ Go home
   ❌ Open settings
   ❌ Factory reset
   ❌ Install another app
```

### Phase 4: User Tries to Bypass
```
| User Action    | Result                 |
|----------------|------------------------|
| Power off      | 🔒 Locked after reboot |
| Remove SIM     | 🔒 Locked              |
| Insert new SIM | 🔒 Locked              |
| Use Wi-Fi      | 🔒 Locked              |
| Safe mode      | ❌ Blocked             |
| Recovery reset | ❌ Blocked             |
```

### Phase 5: Phone Reboot
```
1. Android boots
2. Before launcher loads:
3. EMI Lock auto-starts
4. Lock screen appears again

📌 Lock survives reboot ALWAYS
```

### Phase 6: EMI Paid → Unlock
```
✅ Lock screen disappears
✅ Home screen returns
✅ Phone works normally

❌ Still NO EMI app visible
❌ Still NO icon
❌ Still NO background UI
```

---

## 🔧 TECHNICAL IMPLEMENTATION

### 1. Boot Flow
```
Device Boots
    ↓
BOOT_COMPLETED / LOCKED_BOOT_COMPLETED
    ↓
BootReceiver.onReceive()
    ↓
Start LockEnforcementService (foreground)
    ↓
Check DEVICE_LOCKED flag
    ↓
If LOCKED → Launch MainActivity with FORCE_LOCK
If UNLOCKED → Run silently in background
```

### 2. Background Service (Silent Monitoring)
```
LockEnforcementService:
   - Runs as foreground service (invisible notification)
   - Monitors FCM messages
   - Syncs with backend every X minutes
   - Checks lock state
   - Launches lock screen when needed
   - NEVER shows UI when unlocked
```

### 3. Lock Screen Launch
```
MainActivity.onCreate():
   if (isUserApp && !isLocked) {
       // Close immediately
       registerFCMToken();
       finish();
       return;
   }
   
   if (isLocked) {
       setupLockScreen();
       startKioskMode();
   }
```

### 4. Window Flags (Lock Screen)
```java
getWindow().addFlags(
    FLAG_SHOW_WHEN_LOCKED |
    FLAG_DISMISS_KEYGUARD |
    FLAG_TURN_SCREEN_ON |
    FLAG_KEEP_SCREEN_ON |
    FLAG_FULLSCREEN
);
```

---

## 📦 APK ARCHITECTURE

### Admin APK (Device Owner / DPC)
```
Package: com.securefinance.emilock.admin
Purpose: Device Policy Controller
Installation: QR code during factory reset
Visibility: Has launcher icon (for admin use)
Capabilities:
   ✅ Device Owner privileges
   ✅ Can lock/unlock device
   ✅ Can install User APK silently
   ✅ Cannot be uninstalled
```

### User APK (Silent Background Agent)
```
Package: com.securefinance.emilock.user
Purpose: Background monitoring and lock enforcement
Installation: Silently by Admin APK or manually
Visibility: ❌ NO LAUNCHER ICON
Behavior:
   ✅ Runs silently in background
   ✅ Connects to backend automatically
   ✅ Monitors device state
   ✅ Shows UI ONLY when locked
   ✅ Auto-closes if user tries to open it
```

---

## 🚫 WHAT USER CAN NEVER DO

```
🚫 Open EMI app manually
🚫 Force stop it
🚫 Uninstall it
🚫 Clear its data

Even from:
   - Settings → Apps
   - Safe Mode
   - Recovery
```

---

## ✅ PRODUCTION CHECKLIST

### Before Field Deployment:

- [ ] User APK has NO launcher icon
- [ ] MainActivity auto-closes when unlocked
- [ ] BootReceiver starts service on boot
- [ ] Lock screen appears on FORCE_LOCK intent
- [ ] Lock survives reboot
- [ ] Lock survives SIM change
- [ ] Lock survives network change
- [ ] Background service runs continuously
- [ ] FCM token registered correctly
- [ ] Heartbeat syncs with backend
- [ ] Device Owner privileges verified
- [ ] Kiosk mode works correctly
- [ ] Power button blocked when locked
- [ ] Home/Back/Recent blocked when locked
- [ ] Factory reset blocked
- [ ] Safe mode blocked

---

## 🔑 KEY PRINCIPLES

1. **EMI Lock APK = Invisible System Guard**
   - Sleeps when EMI is OK
   - Wakes up only to lock phone
   - Disappears again after unlock

2. **NOT an app, it's firmware-like**
   - No UI when unlocked
   - No launcher icon
   - No user interaction

3. **Device Owner is mandatory**
   - Only way to survive reboots
   - Only way to block factory reset
   - Only way to enforce kiosk mode

4. **React Native is ONLY for lock screen UI**
   - All control logic in native Android
   - SharedPreferences for state
   - Services for background work

---

## 🧪 TESTING (NO ADB NEEDED)

### On User Device:

```
✅ Settings → Apps → EMI app not visible
✅ Play Store → Cannot find it
✅ Home screen → No icon
✅ Reboot → No UI appears
✅ Press Home/Menu → Nothing opens
✅ Turn on Wi-Fi → Silent sync, no UI
```

### During Lock:

```
✅ Screen cannot be exited
✅ Back / Home do nothing
✅ Power button blocked
✅ Cannot access settings
✅ Cannot factory reset
```

---

## 📚 REFERENCES

- Android Device Owner: https://developer.android.com/work/dpc/dedicated-devices/lock-task-mode
- Lock Task Mode: https://developer.android.com/reference/android/app/admin/DevicePolicyManager#setLockTaskPackages
- Boot Receivers: https://developer.android.com/guide/components/broadcasts#system-broadcasts
- Foreground Services: https://developer.android.com/guide/components/foreground-services

---

**Built with enterprise-grade security. This is how real EMI lock companies operate.**
