# 🔐 ADMIN → USER UNLOCK COMMAND FLOW

## 📡 COMPLETE UNLOCK FLOW (END-TO-END)

### 🎯 STEP 1: Admin Dashboard Sends UNLOCK Command

**Location**: Admin Dashboard (Web)
**Action**: Admin clicks "UNLOCK" button

```javascript
// src/context/DeviceContext.tsx
const toggleLock = async (customerId, newState, reason) => {
  const response = await fetch(`/api/customers/${customerId}/lock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      isLocked: newState,
      reason: reason,
      emiAmount: "₹2,450",
      dueDate: "05 Jan 2026",
      supportPhone: "+91 98765 43210",
      supportMessage: "Please clear EMI to unlock",
      customerName: "John Doe"
    })
  });
};
```

---

### 🎯 STEP 2: Backend Processes Command

**Location**: Backend Server
**File**: `backend/routes/customerRoutes.js`

```javascript
router.post('/:id/lock', async (req, res) => {
  const { id } = req.params;
  const { isLocked, reason, emiAmount, dueDate, supportPhone, supportMessage, customerName } = req.body;

  // 1. Update database
  const customer = await Customer.findOne({ customerId: id });
  customer.isLocked = isLocked;
  customer.lockReason = reason;
  await customer.save();

  // 2. Send FCM push notification
  if (customer.fcmToken) {
    await fcmService.sendLockCommand(customer.fcmToken, {
      command: isLocked ? 'LOCK' : 'UNLOCK',
      emiAmount,
      dueDate,
      supportPhone,
      supportMessage,
      customerName
    });
  }

  res.json({ success: true });
});
```

---

### 🎯 STEP 3: FCM Push Received on Device

**Location**: User APK (Device)
**File**: `LockEnforcementService.java`

```java
// FCM message received
@Override
public void onMessageReceived(RemoteMessage message) {
    String command = message.getData().get("command");
    
    if ("UNLOCK".equals(command)) {
        handleUnlockCommand();
    } else if ("LOCK".equals(command)) {
        handleLockCommand(message.getData());
    }
}

private void handleUnlockCommand() {
    SharedPreferences prefs = getSharedPreferences("PhoneLockPrefs", MODE_PRIVATE);
    
    // 1. Update lock state
    prefs.edit()
        .putBoolean("DEVICE_LOCKED", false)
        .apply();
    
    // 2. Stop kiosk mode
    stopLockTask();
    
    // 3. Close lock screen
    Intent intent = new Intent(this, LockActivity.class);
    intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
    intent.putExtra("FINISH", true);
    startActivity(intent);
    
    // 4. Log event
    Log.i(TAG, "✅ Device UNLOCKED - returning to normal operation");
}
```

---

### 🎯 STEP 4: LockActivity Closes Itself

**Location**: User APK
**File**: `LockActivity.java`

```java
@Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    
    SharedPreferences prefs = getSharedPreferences("PhoneLockPrefs", MODE_PRIVATE);
    boolean isLocked = prefs.getBoolean("DEVICE_LOCKED", false);
    
    // If FINISH intent or not locked, close immediately
    if (getIntent().getBooleanExtra("FINISH", false) || !isLocked) {
        finish();
        return;
    }
    
    // Otherwise show lock screen
    setContentView(R.layout.activity_lock);
    populateEmiData(prefs);
}
```

---

### 🎯 STEP 5: Device Returns to Normal

**Result:**
- ✅ Lock screen disappears
- ✅ User can use phone normally
- ✅ User APK returns to silent background
- ✅ No visible presence

---

## 🔒 LOCK COMMAND FLOW (OPPOSITE)

### Admin sends LOCK → Device locks

```java
private void handleLockCommand(Map<String, String> data) {
    SharedPreferences prefs = getSharedPreferences("PhoneLockPrefs", MODE_PRIVATE);
    
    // 1. Store lock data
    prefs.edit()
        .putBoolean("DEVICE_LOCKED", true)
        .putString("EMI_AMOUNT", data.get("emiAmount"))
        .putString("DUE_DATE", data.get("dueDate"))
        .putString("SUPPORT_PHONE", data.get("supportPhone"))
        .putString("SUPPORT_MSG", data.get("supportMessage"))
        .putString("CUSTOMER_NAME", data.get("customerName"))
        .apply();
    
    // 2. Start kiosk mode
    startLockTask();
    
    // 3. Launch lock screen
    Intent intent = new Intent(this, LockActivity.class);
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
    startActivity(intent);
    
    Log.i(TAG, "🔒 Device LOCKED - EMI enforcement active");
}
```

---

## 📊 COMPLETE FLOW DIAGRAM

```
UNLOCK FLOW:
Admin Dashboard → Backend API → Database Update → FCM Push
    ↓
User Device Receives FCM
    ↓
LockEnforcementService.handleUnlockCommand()
    ↓
Set DEVICE_LOCKED = false
    ↓
Stop kiosk mode
    ↓
Close LockActivity
    ↓
Phone returns to normal
    ↓
User APK silent in background

LOCK FLOW:
Admin Dashboard → Backend API → Database Update → FCM Push
    ↓
User Device Receives FCM
    ↓
LockEnforcementService.handleLockCommand()
    ↓
Set DEVICE_LOCKED = true + EMI data
    ↓
Start kiosk mode
    ↓
Launch LockActivity
    ↓
Full-screen lock appears
    ↓
User cannot escape
```

---

## ⚡ INSTANT UNLOCK (NO DELAY)

### Critical optimizations:

1. **FCM High Priority**
```javascript
// backend/services/fcmService.js
await admin.messaging().send({
  token: fcmToken,
  data: { command: 'UNLOCK' },
  android: {
    priority: 'high',
    ttl: 0 // Immediate delivery
  }
});
```

2. **Service Always Running**
```java
// LockEnforcementService runs 24/7
// Receives FCM instantly
// No delay in processing
```

3. **No Animation Delays**
```java
intent.addFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION);
finish(); // Instant close
```

---

## 🧪 TESTING UNLOCK FLOW

1. Lock device from dashboard
2. Verify lock screen appears
3. Click UNLOCK from dashboard
4. Verify:
   - [ ] Lock screen disappears within 1-2 seconds
   - [ ] Phone returns to normal
   - [ ] No app visible
   - [ ] User can use phone freely

---

**Unlock is instant, silent, and seamless.**
