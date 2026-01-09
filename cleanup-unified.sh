#!/bin/bash

# Cleanup Script for Unified APK Migration
# Removes obsolete files after merging Admin DPC and User APK

echo "🧹 Starting cleanup of obsolete files..."

# 1. Remove old APKs (keep only unified-admin-v3.0.0.apk)
echo ""
echo "📦 Removing old APK files..."

# Old admin DPC APK
if [ -f "backend/public/apk/admin-dpc-v2.2.1.apk" ]; then
    rm -f "backend/public/apk/admin-dpc-v2.2.1.apk"
    echo "  ✅ Removed: admin-dpc-v2.2.1.apk (1.5MB)"
fi

# Old user APK
if [ -f "backend/public/apk/user-app-v2.2.1.apk" ]; then
    rm -f "backend/public/apk/user-app-v2.2.1.apk"
    echo "  ✅ Removed: user-app-v2.2.1.apk (79MB)"
fi

# Old downloads folder APK
if [ -f "backend/public/downloads/securefinance-user.apk" ]; then
    rm -f "backend/public/downloads/securefinance-user.apk"
    echo "  ✅ Removed: downloads/securefinance-user.apk"
fi

# Root level test APK
if [ -f "admin-test-live.apk" ]; then
    rm -f "admin-test-live.apk"
    echo "  ✅ Removed: admin-test-live.apk"
fi

# Old staff APK
if [ -f "backend/public/staff/SecurePro/securepro-admin.apk" ]; then
    rm -f "backend/public/staff/SecurePro/securepro-admin.apk"
    echo "  ✅ Removed: staff/SecurePro/securepro-admin.apk"
fi

# 2. Remove admin-dpc module (no longer needed)
echo ""
echo "📁 Removing obsolete admin-dpc module..."
if [ -d "mobile-app/android/admin-dpc" ]; then
    rm -rf "mobile-app/android/admin-dpc"
    echo "  ✅ Removed: mobile-app/android/admin-dpc/"
fi

# 3. Remove old build outputs (optional - uncomment if you want to clean these)
echo ""
echo "🏗️  Cleaning old build outputs..."

# Capacitor Android build (old admin dashboard APK)
if [ -f "android/app/build/outputs/apk/debug/app-debug.apk" ]; then
    rm -f "android/app/build/outputs/apk/debug/app-debug.apk"
    echo "  ✅ Removed: android/app/build/outputs/apk/debug/app-debug.apk"
fi

if [ -f "android/app/build/outputs/apk/release/app-release-unsigned.apk" ]; then
    rm -f "android/app/build/outputs/apk/release/app-release-unsigned.apk"
    echo "  ✅ Removed: android/app/build/outputs/apk/release/app-release-unsigned.apk"
fi

# Keep the source APK but can be removed if needed
# if [ -f "mobile-app/android/app/build/outputs/apk/admin/release/app-admin-release.apk" ]; then
#     rm -f "mobile-app/android/app/build/outputs/apk/admin/release/app-admin-release.apk"
#     echo "  ✅ Removed: mobile-app/android/app/build/outputs/apk/admin/release/app-admin-release.apk"
# fi

# 4. Remove empty directories
echo ""
echo "📂 Cleaning empty directories..."

if [ -d "backend/public/downloads" ] && [ -z "$(ls -A backend/public/downloads)" ]; then
    rmdir "backend/public/downloads"
    echo "  ✅ Removed: backend/public/downloads/ (empty)"
fi

if [ -d "backend/public/staff/SecurePro" ] && [ -z "$(ls -A backend/public/staff/SecurePro)" ]; then
    rmdir "backend/public/staff/SecurePro"
    echo "  ✅ Removed: backend/public/staff/SecurePro/ (empty)"
fi

# 5. Summary
echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📊 Remaining APK files:"
ls -lh backend/public/apk/ 2>/dev/null || echo "  No APK directory found"

echo ""
echo "💾 Disk space saved: ~80MB"
echo ""
echo "🎯 Active APK: unified-admin-v3.0.0.apk (39MB)"
echo "   Location: backend/public/apk/unified-admin-v3.0.0.apk"
echo "   Package: com.securefinance.emilock.admin"
echo "   Version: 3.0.0"
