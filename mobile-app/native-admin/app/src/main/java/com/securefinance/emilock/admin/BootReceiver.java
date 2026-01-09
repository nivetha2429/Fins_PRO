package com.securefinance.emilock.admin;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

/**
 * BootReceiver - OEM-Grade Boot Persistence
 * 
 * HARDENING LAYER 4: Reboot Persistence
 * - Survives power off/on
 * - Auto-launches lock screen if device is locked
 * - Identical to Samsung Finance Lock behavior
 */
public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            Log.i(TAG, "Boot completed - checking lock status");

            SharedPreferences prefs = context.getSharedPreferences("LockPrefs", Context.MODE_PRIVATE);
            boolean isLocked = prefs.getBoolean("DEVICE_LOCKED", false);

            if (isLocked) {
                Log.i(TAG, "Device is locked - launching lock screen");

                // Launch lock screen
                Intent lockIntent = new Intent(context, LockActivity.class);
                lockIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK |
                        Intent.FLAG_ACTIVITY_CLEAR_TASK);
                context.startActivity(lockIntent);
            }

            // Always start the lock enforcement service
            Intent serviceIntent = new Intent(context, LockEnforcementService.class);
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }

            Log.i(TAG, "Boot persistence complete");
        }
    }
}
