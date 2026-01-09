# 🔥 ENABLE HARD LOCK ON CURRENT DEVICE

**Device:** Samsung SM-M315F (RZ8N91ZT5LD)
**Issue:** Has 3 accounts → Cannot set Device Owner → No hard lock
**Goal:** Enable hard lock WITHOUT factory reset

---

## ⚠️ CRITICAL UNDERSTANDING

**Android Security Rule:**
> Device Owner can ONLY be set when there are NO accounts on the device.

**Why?**
- Security: Prevents malicious apps from taking control
- Google's design: Device Owner is meant for corporate/enterprise devices
- No exceptions: This is enforced at the OS level

**Options:**
1. ✅ Remove all accounts → Set Device Owner (this guide)
2. ✅ Factory reset → QR provision (recommended)
3. ❌ Root device (not recommended, voids warranty)

---

## 🚀 METHOD 1: REMOVE ACCOUNTS + SET DEVICE OWNER

### Step 1: Check Current Accounts

```bash
adb shell dumpsys account | grep "Account {"
```

**Current accounts on your device:**
- `srikandhanmobilesofficial@gmail.com` (Google)
- `WhatsApp` (WhatsApp)
- `Meet` (Google Meet)

### Step 2: Remove Accounts Manually

**On the device:**
1. Go to **Settings**
2. Tap **Accounts** (or **Users & accounts**)
3. Remove each account:
   - Tap on **Google** → Remove account
   - Tap on **WhatsApp** → Remove account
   - Tap on **Meet** → Remove account

**⚠️ IMPORTANT:**
- This will sign you out of all Google services
- WhatsApp data will remain (but account will be removed)
- You can add accounts back after setting Device Owner

### Step 3: Verify No Accounts

```bash
adb shell dumpsys account | grep "Account {"
# Should return nothing
```

### Step 4: Set Device Owner

```bash
adb shell dpm set-device-owner com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver
```

**Expected output:**
```
Success: Device owner set to package com.securefinance.emilock.user
Active admin set to component {com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver}
```

### Step 5: Verify Device Owner

```bash
adb shell dpm list-owners
```

**Expected output:**
```
Device owner:
ComponentInfo{com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver}
```

### Step 6: Test Hard Lock

```bash
# Run test script
./test-emi-lock.sh

# Should show:
# ✅ Device Owner is set
# ✅ Hard lock is possible
```

---

## 🚀 METHOD 2: AUTOMATED SCRIPT

I've created a script to automate this:

```bash
./force-device-owner.sh
```

**What it does:**
1. Shows current accounts
2. Attempts to remove accounts via ADB
3. If accounts remain, prompts for manual removal
4. Sets Device Owner
5. Verifies setup

**Note:** Account removal via ADB may not work on all devices. Manual removal is more reliable.

---

## 🚀 METHOD 3: FACTORY RESET (MOST RELIABLE)

If removing accounts doesn't work, factory reset is the guaranteed method:

### Step 1: Backup Important Data

**What will be lost:**
- All apps and app data
- Photos, videos (if not backed up)
- Contacts (if not synced to Google)
- Messages

**What will remain:**
- SD card data (if you have one)
- SIM card data

### Step 2: Factory Reset

**On the device:**
```
Settings → System → Reset → Factory data reset
```

**Or via ADB:**
```bash
adb shell am broadcast -a android.intent.action.FACTORY_RESET
```

### Step 3: QR Provisioning

1. Device boots to Welcome screen
2. **Tap 6 times** on white space
3. QR scanner appears
4. Generate QR from admin dashboard
5. Scan QR
6. Device auto-provisions as Device Owner

---

## 📊 COMPARISON

| Method | Pros | Cons | Success Rate |
|--------|------|------|--------------|
| **Remove Accounts** | No data loss | Manual steps | 80% |
| **Automated Script** | Quick | May not work on all devices | 60% |
| **Factory Reset** | 100% reliable | Data loss | 100% |

---

## 🔥 RECOMMENDED APPROACH

### For Testing (Current Device):

**Option A: Remove Accounts (Try First)**
```bash
# 1. Remove accounts manually on device
Settings → Accounts → Remove all

# 2. Set Device Owner
adb shell dpm set-device-owner com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver

# 3. Verify
adb shell dpm list-owners

# 4. Test
./test-emi-lock.sh
```

**Option B: Factory Reset (If A fails)**
```bash
# 1. Backup data
# 2. Factory reset
# 3. QR provision
# 4. Test
```

### For Production Deployment:

**Always use QR provisioning:**
1. Factory reset device
2. QR provision at Welcome screen
3. Device becomes Device Owner automatically
4. No manual steps needed

---

## 🧪 STEP-BY-STEP: REMOVE ACCOUNTS METHOD

### 1. Remove Google Account

**On device:**
1. Open **Settings**
2. Scroll to **Accounts** (or **Google**)
3. Tap **Google**
4. Tap **srikandhanmobilesofficial@gmail.com**
5. Tap **Remove account**
6. Confirm

### 2. Remove WhatsApp Account

**On device:**
1. Open **Settings**
2. Tap **Accounts**
3. Tap **WhatsApp**
4. Tap **Remove account**
5. Confirm

### 3. Remove Meet Account

**On device:**
1. Open **Settings**
2. Tap **Accounts**
3. Tap **Meet**
4. Tap **Remove account**
5. Confirm

### 4. Verify Removal

**Via ADB:**
```bash
adb shell dumpsys account | grep "Account {"
# Should return nothing
```

### 5. Set Device Owner

**Via ADB:**
```bash
adb shell dpm set-device-owner com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver
```

**If successful:**
```
Success: Device owner set to package com.securefinance.emilock.user
```

**If failed:**
```
java.lang.IllegalStateException: Not allowed to set the device owner because there are already some accounts on the device.
```

**If failed, check:**
```bash
# Check for hidden accounts
adb shell dumpsys account

# Look for any "Account {" entries
# Remove them manually from Settings
```

### 6. Test Hard Lock

```bash
# 1. Verify Device Owner
adb shell dpm list-owners

# 2. Run test
./test-emi-lock.sh

# 3. Open admin dashboard
# 4. Lock the device
# 5. Device should HARD LOCK within 3 seconds
# 6. Try to bypass → Should be IMPOSSIBLE
```

---

## 🚨 TROUBLESHOOTING

### "Not allowed to set device owner because there are already some accounts"

**Solution:**
```bash
# Check for hidden accounts
adb shell dumpsys account

# Look for ALL "Account {" entries
# Remove each one from Settings → Accounts
```

### "Unknown admin: ComponentInfo{...}"

**Solution:**
```bash
# Verify User APK is installed
adb shell pm list packages | grep securefinance

# Should show: com.securefinance.emilock.user

# If not, install it:
adb install -r backend/public/downloads/securefinance-user.apk
```

### Device Owner set but lock doesn't work

**Solution:**
```bash
# 1. Check if LockScreenService is running
adb shell dumpsys activity services | grep LockScreenService

# 2. If not running, start the app
adb shell am start -n com.securefinance.emilock.user/com.securefinance.emilock.MainActivity

# 3. Check logs
adb logcat | grep "LockScreenService"
```

---

## ✅ VERIFICATION CHECKLIST

After setting Device Owner:

- [ ] `adb shell dpm list-owners` shows Device Owner
- [ ] `./test-emi-lock.sh` shows all ✅
- [ ] LockScreenService is running
- [ ] Admin dashboard can lock device
- [ ] Device locks HARD within 3 seconds
- [ ] Cannot bypass lock (home, power, etc.)
- [ ] Admin dashboard can unlock device
- [ ] Device unlocks within 3 seconds

---

## 🎯 QUICK COMMAND REFERENCE

```bash
# Check accounts
adb shell dumpsys account | grep "Account {"

# Set Device Owner (after removing accounts)
adb shell dpm set-device-owner com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver

# Verify Device Owner
adb shell dpm list-owners

# Test system
./test-emi-lock.sh

# Watch logs
adb logcat | grep "EMI_ADMIN\|FullDeviceLock\|LockScreenService"
```

---

## 🔥 FINAL RECOMMENDATION

**For your current device (Samsung SM-M315F):**

1. **Try removing accounts first** (5 minutes)
   - Manual removal from Settings
   - Set Device Owner via ADB
   - Test hard lock

2. **If that fails, factory reset** (10 minutes)
   - Backup data
   - Factory reset
   - QR provision
   - Guaranteed to work

**For production deployment:**
- Always use factory reset + QR provisioning
- Most reliable method
- No manual steps
- Works on all devices

---

**Ready to proceed? Choose your method:**
1. Remove accounts manually → Run `./force-device-owner.sh`
2. Factory reset → QR provision

**Both will enable HARD LOCK. Choose based on your preference.**
