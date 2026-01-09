#!/bin/bash

echo "🔍 EMI LOCK DIAGNOSTIC TOOL"
echo "==========================="
echo "Waiting for device logs..."
echo "Filter: EMI_LOCK, LockEnforcement, DeviceAdmin"
echo "---------------------------"

# Clear previous logs first
adb logcat -c

# Stream logs matching our tags
adb logcat -v color | grep -E "EMI_ADMIN|LockEnforcement|FullDeviceLock|DeviceAdmin|Keyguard"
