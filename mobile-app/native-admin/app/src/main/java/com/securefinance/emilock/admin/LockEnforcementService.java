package com.securefinance.emilock.admin;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.json.JSONObject;
import java.io.IOException;

/**
 * LockEnforcementService - 24/7 Lock Monitoring & Enforcement
 * 
 * OEM-Grade Implementation:
 * - Runs as foreground service (survives OEM battery optimization)
 * - Polls backend for lock status
 * - Enforces kiosk mode when locked
 * - Handles FCM push for instant lock/unlock
 */
public class LockEnforcementService extends Service {
    private static final String TAG = "LockEnforcementService";
    private static final String CHANNEL_ID = "LockServiceChannel";
    private static final long POLL_INTERVAL = 5000; // 5 seconds

    private Handler handler;
    private Runnable lockLoop;
    private OkHttpClient client;
    private DevicePolicyManager dpm;
    private ComponentName adminComponent;
    private SharedPreferences prefs;

    @Override
    public void onCreate() {
        super.onCreate();

        client = new OkHttpClient();
        handler = new Handler(Looper.getMainLooper());
        dpm = (DevicePolicyManager) getSystemService(Context.DEVICE_POLICY_SERVICE);
        adminComponent = new ComponentName(this, AdminReceiver.class);
        prefs = getSharedPreferences("LockPrefs", Context.MODE_PRIVATE);

        createNotificationChannel();
        startForeground(1001, createNotification());

        Log.i(TAG, "Service created - starting lock enforcement");

        // Start monitoring loop
        lockLoop = new Runnable() {
            @Override
            public void run() {
                checkLockStatus();
                enforcePolicy();
                handler.postDelayed(this, POLL_INTERVAL);
            }
        };
        handler.post(lockLoop);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            // Handle FCM push commands
            if (intent.getBooleanExtra("forceLock", false)) {
                Log.i(TAG, "FCM FORCE LOCK received");
                prefs.edit().putBoolean("DEVICE_LOCKED", true).apply();
                enforcePolicy();
            }

            if (intent.getBooleanExtra("forceUnlock", false)) {
                Log.i(TAG, "FCM FORCE UNLOCK received");
                prefs.edit().putBoolean("DEVICE_LOCKED", false).apply();
                enforcePolicy();
            }
        }

        return START_STICKY;
    }

    private void checkLockStatus() {
        String customerId = prefs.getString("customerId", null);
        String serverUrl = prefs.getString("serverUrl", "https://emi-pro-app.fly.dev");

        if (customerId == null) {
            Log.w(TAG, "No customer ID configured");
            return;
        }

        String url = serverUrl + "/api/customers/" + customerId + "?t=" + System.currentTimeMillis();
        Request request = new Request.Builder()
                .url(url)
                .header("Cache-Control", "no-cache")
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e(TAG, "Backend check failed: " + e.getMessage());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    try {
                        String jsonData = response.body().string();
                        JSONObject json = new JSONObject(jsonData);
                        boolean isLocked = json.optBoolean("isLocked", false);

                        prefs.edit().putBoolean("DEVICE_LOCKED", isLocked).apply();
                        Log.d(TAG, "Lock status updated: " + isLocked);
                    } catch (Exception e) {
                        Log.e(TAG, "Parse error", e);
                    }
                }
                response.close();
            }
        });
    }

    private void enforcePolicy() {
        boolean isLocked = prefs.getBoolean("DEVICE_LOCKED", false);

        if (!dpm.isDeviceOwnerApp(getPackageName())) {
            Log.w(TAG, "Not Device Owner - cannot enforce");
            return;
        }

        if (isLocked) {
            Log.i(TAG, "Enforcing LOCK state");

            // Enable kiosk mode
            dpm.setLockTaskPackages(adminComponent, new String[] { getPackageName() });

            // Disable status bar
            dpm.setStatusBarDisabled(adminComponent, true);

            // Disable keyguard
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                dpm.setKeyguardDisabled(adminComponent, true);
            }

            // Launch lock screen
            Intent lockIntent = new Intent(this, LockActivity.class);
            lockIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK |
                    Intent.FLAG_ACTIVITY_CLEAR_TOP |
                    Intent.FLAG_ACTIVITY_SINGLE_TOP);
            startActivity(lockIntent);

        } else {
            Log.i(TAG, "Enforcing UNLOCK state");

            // Disable kiosk mode
            dpm.setLockTaskPackages(adminComponent, new String[] {});

            // Enable status bar
            dpm.setStatusBarDisabled(adminComponent, false);

            // Enable keyguard
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                dpm.setKeyguardDisabled(adminComponent, false);
            }
        }
    }

    private Notification createNotification() {
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Device Security Active")
                .setContentText("EMI Lock monitoring")
                .setSmallIcon(android.R.drawable.ic_lock_lock)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setOngoing(true);

        return builder.build();
    }

    private void createNotificationChannel() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "EMI Lock Service",
                    NotificationManager.IMPORTANCE_LOW);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (handler != null && lockLoop != null) {
            handler.removeCallbacks(lockLoop);
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
