# Admin Dashboard APK Details (Updated)

We have switched to a **Native Web App** architecture for the Admin Dashboard.

## 📱 Admin APK (Capacitor / Web)

| Feature | 🛡️ Admin APK (New) | 🔒 User APK (Original) |
| :--- | :--- | :--- |
| **Technology** | **Capacitor + Vite/React** (Web Frontend) | **React Native** (Native Modules) |
| **App Name** | `SecurePRO Admin` | `EMI Lock` |
| **Package Name** | `com.securefinance.admin` | `com.securefinance.emilock.user` |
| **Content** | **Full Web Dashboard** (Local Build) | Lock Screen & Device Control |
| **Install Method** | Manual APK Install | QR Provisioning |

## 🛠️ Architecture Change

Instead of sharing the React Native codebase and trying to toggle "Admin Mode", we now:
1.  **Build the Web Frontend** (`npm run build`).
2.  **Wrap it in Capacitor** (`npx cap sync`).
3.  **Build a Dedicated APK** (`android/`).

This ensures the Admin App is **identical** to the Web Dashboard, because it IS the Web Dashboard running in a native container.

## 🚀 Current Status

- **Build**: `v1.0.0` (Web Version)
- **Installed**: Yes, on device (`com.securefinance.admin`)
- **Location**: `backend/public/staff/EMI-Admin-Web-Dashboard.apk`

## 🔄 Updates

To update this app:
1. `npm run build` (in root)
2. `npx cap sync android`
3. `./gradlew assembleDebug` (in `android/`)
4. Deploy APK.
