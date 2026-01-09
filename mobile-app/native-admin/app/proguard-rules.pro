# Keep Device Admin Receiver
-keep class com.securefinance.emilock.admin.AdminReceiver {
    <init>(...);
}

# Keep DeviceAdminReceiver base
-keep class * extends android.app.admin.DeviceAdminReceiver

# Keep device admin XML
-keepclassmembers class ** {
    @android.app.admin.DeviceAdminReceiver <fields>;
}

# Keep Provisioning Activity
-keep class com.securefinance.emilock.admin.ProvisioningActivity { *; }

# Do NOT optimize admin package
-dontoptimize
