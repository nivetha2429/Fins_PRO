package com.securefinance.emilock.admin;

import android.app.Activity;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.os.UserManager;
import android.util.Log;
import android.widget.Toast;

/**
 * ProvisioningActivity - OEM-Grade Setup
 * 
 * Responsibilities:
 * - Verify Device Owner status
 * - Apply security restrictions
 * - Configure lock enforcement
 * - Start monitoring service
 * - Hide self
 */
public class ProvisioningActivity extends Activity {
    private static final String TAG = "ProvisioningActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        DevicePolicyManager dpm = (DevicePolicyManager) getSystemService(Context.DEVICE_POLICY_SERVICE);
        ComponentName adminComp = new ComponentName(this, AdminReceiver.class);

        if (!dpm.isDeviceOwnerApp(getPackageName())) {
            Log.e(TAG, "Not Device Owner - cannot provision");
            Toast.makeText(this, "Setup failed: Not Device Owner", Toast.LENGTH_LONG).show();
            finish();
            return;
        }

        Toast.makeText(this, "Setting up device security...", Toast.LENGTH_LONG).show();

        try {
            // 1. Extract provisioning data from intent
            Bundle extras = getIntent().getBundleExtra(DevicePolicyManager.EXTRA_PROVISIONING_ADMIN_EXTRAS_BUNDLE);
            String customerId = null;
            String serverUrl = "https://emi-pro-app.fly.dev";

            if (extras != null) {
                customerId = extras.getString("customerId");
                String providedUrl = extras.getString("serverUrl");
                if (providedUrl != null) {
                    serverUrl = providedUrl;
                }
            }

            // 2. Save configuration
            SharedPreferences prefs = getSharedPreferences("LockPrefs", Context.MODE_PRIVATE);
            prefs.edit()
                    .putString("customerId", customerId)
                    .putString("serverUrl", serverUrl)
                    .putBoolean("DEVICE_LOCKED", false) // Start unlocked
                    .apply();

            Log.i(TAG, "Configuration saved: customerId=" + customerId);

            // 3. Apply base security restrictions
            applySecurityRestrictions(dpm, adminComp);

            // 4. Configure kiosk mode allowlist
            dpm.setLockTaskPackages(adminComp, new String[] { getPackageName() });
            Log.i(TAG, "Kiosk mode configured");

            // 5. Start lock enforcement service
            Intent serviceIntent = new Intent(this, LockEnforcementService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }
            Log.i(TAG, "Lock enforcement service started");

            // 6. Hide this activity
            getPackageManager().setComponentEnabledSetting(
                    new ComponentName(this, ProvisioningActivity.class),
                    android.content.pm.PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                    android.content.pm.PackageManager.DONT_KILL_APP);
            Log.i(TAG, "Provisioning activity hidden");

            Toast.makeText(this, "Setup complete!", Toast.LENGTH_SHORT).show();
            finish();

        } catch (Exception e) {
            Log.e(TAG, "Provisioning failed", e);
            Toast.makeText(this, "Setup error: " + e.getMessage(), Toast.LENGTH_LONG).show();
            finish();
        }
    }

    private void applySecurityRestrictions(DevicePolicyManager dpm, ComponentName adminComp) {
        try {
            // Prevent factory reset
            dpm.addUserRestriction(adminComp, UserManager.DISALLOW_FACTORY_RESET);

            // Prevent safe mode
            dpm.addUserRestriction(adminComp, UserManager.DISALLOW_SAFE_BOOT);

            // Prevent app uninstall
            dpm.addUserRestriction(adminComp, UserManager.DISALLOW_UNINSTALL_APPS);

            // Prevent adding users
            dpm.addUserRestriction(adminComp, UserManager.DISALLOW_ADD_USER);

            // Block this app from being uninstalled
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                dpm.setUninstallBlocked(adminComp, getPackageName(), true);
            }

            Log.i(TAG, "Security restrictions applied");

        } catch (Exception e) {
            Log.e(TAG, "Failed to apply restrictions", e);
        }
    }
}
