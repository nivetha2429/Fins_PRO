# 🎯 Quick Reference: Admin vs User APK

## At a Glance

| Feature | Admin APK | User APK |
|---------|-----------|----------|
| **Install On** | 👔 Staff phones | 📱 Customer EMI devices |
| **Installation** | Normal (like any app) | QR Code / Device Owner |
| **Package ID** | `com.securefinance.emilock.admin` | `com.securefinance.emilock.user` |
| **App Name** | "EMI Admin" | "EMI Lock" |
| **Requires** | Nothing special | Device Owner privileges |
| **Factory Reset** | Not needed | **REQUIRED** |
| **Can Uninstall** | ✅ Yes | ❌ No (factory reset needed) |
| **Purpose** | Remote control & monitoring | Lock/unlock enforcement |

---

## 📥 Installation Commands

### Admin APK (Staff Phone):
```bash
# Just install normally
adb install backend/public/downloads/securefinance-admin-v2.1.2.apk
```

### User APK (Customer Device):
```bash
# 1. Factory reset first!
# 2. Install APK
adb install app/build/outputs/apk/user/release/app-user-release.apk

# 3. Set as Device Owner
adb shell dpm set-device-owner com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver
```

---

## 🌐 Download URLs

- **Admin APK:** https://emi-pro-app.onrender.com/downloads/securefinance-admin-v2.1.2.apk
- **Backend:** https://emi-pro-app.onrender.com

---

## ✅ Checklist

### Installing Admin APK:
- [ ] Download APK to staff phone
- [ ] Allow "Install from unknown sources"
- [ ] Install and open
- [ ] Login with admin credentials
- [ ] Done! ✅

### Installing User APK:
- [ ] Factory reset customer device
- [ ] Do NOT add Google account
- [ ] Connect to WiFi
- [ ] Generate QR code from admin panel
- [ ] Tap 6 times on welcome screen
- [ ] Scan QR code
- [ ] Wait for automatic provisioning
- [ ] Verify device shows as ACTIVE
- [ ] Done! ✅

---

## 🚨 Common Mistakes

### ❌ DON'T:
- Install User APK on staff phone (won't work as Device Owner)
- Try to make Admin APK a Device Owner (not needed)
- Add Google account before provisioning User APK
- Skip factory reset for User APK installation

### ✅ DO:
- Install Admin APK on as many staff phones as needed
- Always factory reset before User APK provisioning
- Use QR code method for production deployments
- Test on real devices (emulators have limitations)

---

## 📞 Quick Troubleshooting

**Admin APK won't open:**
- Reinstall latest version
- Check internet connection
- Verify backend is running

**User APK Device Owner fails:**
- Factory reset again
- Don't add Google account
- Skip all setup steps
- Try immediately after reset

**Lock/Unlock not working:**
- Check device internet connection
- Verify backend is accessible
- Check admin panel for device status
- Review backend logs
