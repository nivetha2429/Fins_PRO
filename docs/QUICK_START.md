# 🚀 Quick Start Guide - EMI Pro v3.0.2

**Last Updated**: January 9, 2026

---

## 📋 Prerequisites

- Node.js 18+ installed
- MongoDB instance (local or cloud)
- Android device for testing (Android 10+)
- Fly.io account (for deployment)

---

## ⚡ Quick Setup (5 Minutes)

### 1. Clone and Install

```bash
git clone https://github.com/Panther4u/EMI-PRO-APP.git
cd EMI-PRO
npm install
cd backend && npm install && cd ..
```

### 2. Configure Environment

Create `.env` in root:
```env
VITE_API_URL=http://localhost:5000
```

Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/emi-pro
JWT_SECRET=your-secret-key-here
PROVISIONING_BASE_URL=http://localhost:5000
```

### 3. Start Development

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
npm run dev
```

Access dashboard at: `http://localhost:5173`

---

## 📱 Build Mobile APKs

### Admin APK (Device Owner)

```bash
cd mobile-app/android
./gradlew assembleAdminRelease
```

Output: `mobile-app/android/app/build/outputs/apk/admin/release/app-admin-release.apk`

### User APK (Lock Enforcer)

```bash
cd mobile-app/android
./gradlew assembleUserRelease
```

Output: `mobile-app/android/app/build/outputs/apk/user/release/app-user-release.apk`

### Super Admin APK (Web Dashboard)

```bash
npm run build
npx cap sync
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🔐 Device Provisioning (QR Code)

### 1. Factory Reset Device

```
Settings → General Management → Reset → Factory Data Reset
```

### 2. Trigger QR Scanner

During setup, at "Copy apps & data" screen:
- Tap screen **6 times quickly**
- QR scanner will appear

### 3. Generate QR Code

1. Open admin dashboard
2. Navigate to "Add Customer"
3. Fill in customer details
4. Click "Generate QR Code"
5. Scan with device

### 4. Complete Setup

- Device will show Wi-Fi setup screen
- Select Wi-Fi network
- Admin APK downloads automatically
- Device becomes managed

---

## 🚀 Production Deployment

### Deploy to Fly.io

```bash
# Login to Fly.io
fly auth login

# Deploy
fly deploy
```

Your app will be live at: `https://emi-pro-app.fly.dev`

---

## 🧪 Testing

### Test Lock/Unlock

1. Provision a device
2. From dashboard, click "Lock Device"
3. Device should lock within 5 seconds
4. Click "Unlock Device" to restore

### Test Auto-Update

1. Increment version in `mobile-app/android/app/build.gradle`
2. Build new APK
3. Update `backend/public/downloads/version.json`
4. Deploy to server
5. App will auto-update on next launch

---

## 📚 Next Steps

- Read [README_PRODUCTION.md](../README_PRODUCTION.md) for production setup
- Check [PROJECT_STATUS.md](../PROJECT_STATUS.md) for current state
- Review [Android 12-15 Audit](/.gemini/antigravity/brain/5541f110-6d9f-4100-9a6c-6ba1a063f0f5/android_12_15_audit.md)
- See [Samsung Provisioning Guide](/.gemini/antigravity/brain/5541f110-6d9f-4100-9a6c-6ba1a063f0f5/samsung_provisioning_test.md)

---

## 🆘 Common Issues

### QR Provisioning Fails

- Ensure device is factory reset
- Check Wi-Fi connectivity
- Verify APK checksum matches
- See [Provisioning Troubleshooting](./PROVISIONING_TROUBLESHOOTING.md)

### Device Won't Lock

- Verify device is provisioned
- Check FCM token registration
- Ensure backend is reachable
- See [Device Lock Troubleshooting](./DEVICE_LOCK_TROUBLESHOOTING.md)

---

**Need Help?** Check the `/docs` folder for detailed guides.
