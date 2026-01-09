# Migration from Render to Fly.io - Complete

## ✅ What Was Changed (v2.1.1)

### 1. **All API URLs Updated**
Replaced all instances of:
- `https://emi-pro-app.onrender.com` → `https://emi-pro-app.fly.dev`

### 2. **Files Updated** (14 files)
- `mobile-app/src/screens/AdminScreen.tsx`
- `mobile-app/src/screens/SetupScreen.tsx`
- `mobile-app/src/components/AutoUpdate.tsx`
- `mobile-app/App.tsx`
- `mobile-app/android/app/src/main/java/com/securefinance/emilock/*.java` (8 files)
- `mobile-app/android/admin-dpc/src/main/java/com/securefinance/emilock/admin/DeviceInfoCollector.java`
- `backend/public/downloads/version.json`
- `mobile-app/android/app/build.gradle`

### 3. **Version Bumped**
- From: v2.1.0 (versionCode 30)
- To: v2.1.1 (versionCode 31)

---

## 🚀 Deployment Status

### Fly.io Configuration
- **App Name**: `emi-pro-app`
- **URL**: `https://emi-pro-app.fly.dev`
- **Region**: Singapore (sin)
- **Port**: 5000
- **Memory**: 1024MB

### Required Secrets (Set in Fly.io Dashboard)
Go to: https://fly.io/apps/emi-pro-app/secrets

Add these secrets from your `.env` file:
1. `MONGODB_URI` - Your MongoDB connection string
2. `JWT_SECRET` - Your JWT secret key

---

## 📱 Mobile App Changes

All mobile apps now connect to:
- **Backend API**: `https://emi-pro-app.fly.dev`
- **APK Downloads**: `https://emi-pro-app.fly.dev/downloads/`
- **Version Check**: `https://emi-pro-app.fly.dev/downloads/version.json`

---

## ✅ Next Steps

1. **Set Secrets in Fly.io** (REQUIRED)
   - Go to https://fly.io/apps/emi-pro-app/secrets
   - Add `MONGODB_URI` and `JWT_SECRET`

2. **Wait for Deployment**
   - Fly.io will auto-deploy after secrets are set
   - Monitor at: https://fly.io/apps/emi-pro-app/monitoring

3. **Test the Deployment**
   - Visit: https://emi-pro-app.fly.dev
   - Check health: https://emi-pro-app.fly.dev/health

4. **Build New APKs** (Optional)
   ```bash
   cd mobile-app/android
   ./gradlew assembleUserRelease
   ./gradlew assembleAdminRelease
   ```

5. **Deploy APKs to Fly.io**
   - Upload to `backend/public/downloads/`
   - Commit and push to trigger Fly.io deployment

---

## 🔄 Rollback (If Needed)

If you need to go back to Render:
```bash
git revert HEAD
git push origin main
```

Then run the same find/replace in reverse:
```bash
find mobile-app -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.java" \) -exec sed -i '' 's/emi-pro-app\.fly\.dev/emi-pro-app.onrender.com/g' {} \;
```

---

## 📊 Migration Complete!

All code changes have been committed and pushed to GitHub.
Fly.io will automatically deploy once you set the required secrets.

**Status**: ✅ Code Ready | ⏳ Waiting for Secrets
