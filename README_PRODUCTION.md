# 🎉 EMI LOCK SYSTEM - PRODUCTION DEPLOYMENT GUIDE

## 📋 SYSTEM OVERVIEW

**EMI Pro** is a device lock enforcement system designed for EMI/financing businesses in India. It utilizes the Android Enterprise (Device Owner) framework to secure devices.

### Key Features:
- ✅ **QR-based Provisioning**: Rapid device setup using Android Enterprise.
- ✅ **Remote Lock/Unlock**: Real-time enforcement via admin dashboard.
- ✅ **Silent Operation**: User Lock APK installs silently and runs without UI (until locked).
- ✅ **OEM Compatibility**: Tested on major Indian OEMs (Xiaomi, Vivo, Oppo, Samsung, Realme).
- ✅ **Compliance-Ready**: Designed with RBI/Consumer Protection guidelines in mind.
- ✅ **High Availability Design**: Architecture supports high uptime (dependent on infrastructure).

---

## 🚨 CRITICAL PRODUCTION REQUIREMENTS (MUST READ)

Before deploying to improved scale (1,000+ devices), you **MUST** address the following critical items. Failure to do so will result in lost control of devices or legal liability.

### 1️⃣ APK SIGNING & KEYSTORE MANAGEMENT (Non-Negotiable)
**Risk**: If you lose your signing key, you **cannot update** the Admin or User APKs. You will lose control of all deployed devices permanently.

*   **Requirement**: You must use a secure, persistent Keystore for Release builds.
*   **Policy**:
    *   **Same Key**: Sign BOTH Admin and User APKs with the *same* release key to ensure `signature` permission trust.
    *   **Backup**: Store the Keystore and Key Password in an air-gapped, offline backup.
    *   **No Debug Keys**: NEVER deploy proper production devices with a debug key.

```gradle
// android/app/build.gradle
signingConfigs {
    release {
        storeFile file("emi-pro-release.keystore")
        storePassword "YOUR_STRONG_PASSWORD"
        keyAlias "emi_admin"
        keyPassword "YOUR_KEY_PASSWORD"
    }
}
```

### 2️⃣ SAMSUNG KNOX & MASS DEPLOYMENT
**Risk**: Samsung devices aggressively flag non-Knox admins as "corrupted" or "malware" during bulk automated setups.

*   **Requirement**: For mass rollout (>50 devices/day) on Samsung, you **MUST** use **Knox Mobile Enrollment (KME)**.
*   **Why**: KME allowlists your APK hash at the hardware firmware level, bypassing the "Preflight" checks that often fail with generic QR codes.
*   **Provisioning**:
    *   **Small Scale**: The current QR code with *Fully Qualified Component Name* works.
    *   **Large Scale**: Register with Samsung Knox Portal and upload your CSV of IMEIs.

### 3️⃣ SILENT INSTALL MECHANISM
**Clarification**: The silent install capability of the User App relies strictly on the **Device Owner** privileges of the Admin App.
*   **Android 14+**: The Admin App *must* be the installer of record. The User App cannot update itself silently; the Admin App must request the update or the `PackageInstaller` session must be owned by the Device Owner.

### 4️⃣ LEGAL & COMPLIANCE (India Specific)
**Risk**: Blocking devices without proper disclosures is illegal under Consumer Protection laws.

*   **Lock Screen UI**: Your lock screen **MUST** visibly display:
    *   Lender Name ("Financed by...")
    *   Customer Care Number (Click-to-Call)
    *   Specific Reason for Lock ("Payment Overdue")
    *   Unlock Conditions ("Pay ₹X,XXX to restore")
*   **Factory Reset Protection (FRP)**:
    *   **Active Loan**: FRP is allowed to prevent theft/resale.
    *   **Loan Closure**: You **MUST** automatically remove the Admin account and disable FRP when the loan is fully paid. Leaving a device permanently locked to an admin account after payment is illegal.

---

## 🏗️ ARCHITECTURE

### Two-APK Model:

```
┌─────────────────────────────────────────────────────┐
│                 ADMIN DASHBOARD (Web)                │
│              https://emi-pro-app.fly.dev             │
└────────────────────┬────────────────────────────────┘
                     │
                     ↓ REST APIs
┌─────────────────────────────────────────────────────┐
│                  BACKEND SERVER                      │
│              Express.js + MongoDB                    │
│         /api/customers, /api/devices, etc.          │
└──────────┬──────────────────────────┬────────────────┘
           │                          │
           ↓ FCM Push                 ↓ QR Provisioning
┌──────────────────────┐    ┌──────────────────────────┐
│   ADMIN APK          │    │   USER APK               │
│   (Device Owner)     │───→│   (Lock Enforcer)        │
│                      │    │                          │
│ • Provisioning       │    │ • Lock Screen            │
│ • User APK Install   │    │ • Silent Background      │
│ • Device Management  │    │ • Kiosk Mode (Allowlist) │
└──────────────────────┘    └──────────────────────────┘
```

---

## 🔐 SECURITY & COMPLIANCE FEATURES

### Device Protection:
- ✅ **Device Owner Enforcement**: Prevents uninstall/disable by user.
- ✅ **Factory Reset Protection**: Prevents unauthorized reuse during active loan.
- ✅ **Safe Mode & ADB Blocking**: Prevents technical bypass.

### Compliance-Ready Logic:
- ✅ **Grace Period**: System logic supports non-blocking notifications before hard lock (RBI requirement).
- ✅ **Emergency Access**: 112/100/108 calls allowed from Lock Screen.
- ✅ **Audit Trail**: All lock/unlock actions are logged in the backend.

---

## 📝 PRODUCTION READINESS CHECKLIST

### Phase 1: Infrastructure & Security
- [x] Backend deployed (Fly.io/Render) with HTTPS.
- [x] Database secured (MongoDB Atlas).
- [ ] **Critical**: Release Keystore generated & backed up.
- [ ] **Critical**: Admin & User APKs signed with Release Key.
- [ ] **Critical**: SHA-256 Checksum of *Signed* APK updated in Backend.

### Phase 2: App Validation
- [x] Admin App: Device Owner setup works.
- [x] User App: Silent install works.
- [x] Lock Screen: Emergency Dialer functions.
- [ ] **Critical**: Samsung KME Strategy defined (if target >50 devices).
- [ ] **Critical**: Lock Screen Legal Text verified (Lender Name/Phone).

### Phase 3: Pilot Rollout
- [ ] Flash 5-10 devices (Mixed OEMs).
- [ ] Perform full lifecycle test: Provision -> Lock -> Pay -> Unlock -> Un-enroll.
- [ ] Verify "Loan Closure" flow properly removes Device Owner.

---

## 📞 SUPPORT & RESOURCES

### API Endpoints:
- Provisioning: `/api/provisioning/payload/:id`
- Lock/Unlock: `/api/customers/:id/lock`

### APK Downloads:
- Admin: `/apk/admin/admin-v3.0.2.apk`
- User: `/apk/user/user-v3.0.2.apk`

---

## 🏆 FINAL STATUS

**Current State**: ✅ **Technically Functional / Pilot Ready**
**Production Grade**: ⚠️ **Requires Signing & Legal Review**

**Completion**:
- Codebase: 100% ✅
- Architecture: 100% ✅
- Signing/Security: 50% ⚠️ (Needs Release Keystore)
- Legal Review: 0% ⚠️ (Needs Internal Review)

**Recommendation**: Proceed to Pilot (10-20 devices) only after signing APKs with a permanent key. Do NOT launch mass market without Samsung KME.

