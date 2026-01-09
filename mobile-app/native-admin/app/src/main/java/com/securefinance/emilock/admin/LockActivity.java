package com.securefinance.emilock.admin;

import android.app.Activity;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

/**
 * LockActivity - OEM-Grade Lock Screen
 * 
 * Legal Compliance:
 * - Displays lender name
 * - Shows customer care number (click-to-call)
 * - Explains lock reason
 * - Shows unlock conditions
 * - Allows emergency calls (112/100/108)
 */
public class LockActivity extends Activity {
    private static final String TAG = "LockActivity";
    private DevicePolicyManager dpm;
    private ComponentName adminComponent;
    private SharedPreferences prefs;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        dpm = (DevicePolicyManager) getSystemService(Context.DEVICE_POLICY_SERVICE);
        adminComponent = new ComponentName(this, AdminReceiver.class);
        prefs = getSharedPreferences("LockPrefs", Context.MODE_PRIVATE);

        // Setup full-screen lock UI
        setupLockScreen();

        // HARDENING: Detect Safe Mode
        if (getPackageManager().isSafeMode()) {
            Log.e(TAG, "⚠️ SAFE MODE DETECTED - Enforcing hard lock");
            forceHardLock();
        }

        // Create UI
        createLockUI();
    }

    private void setupLockScreen() {
        // Show on lock screen
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD);
        }

        // Keep screen on
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Full screen
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
    }

    private void createLockUI() {
        // Create layout programmatically (no XML needed for simplicity)
        android.widget.LinearLayout root = new android.widget.LinearLayout(this);
        root.setOrientation(android.widget.LinearLayout.VERTICAL);
        root.setGravity(android.view.Gravity.CENTER);
        root.setBackgroundColor(android.graphics.Color.parseColor("#1a1a1a"));
        root.setPadding(60, 60, 60, 60);

        // Lock icon
        android.widget.ImageView icon = new android.widget.ImageView(this);
        icon.setImageResource(android.R.drawable.ic_lock_lock);
        icon.setColorFilter(android.graphics.Color.parseColor("#EF4444"));
        android.widget.LinearLayout.LayoutParams iconParams = new android.widget.LinearLayout.LayoutParams(200, 200);
        iconParams.bottomMargin = 40;
        root.addView(icon, iconParams);

        // Title
        TextView title = new TextView(this);
        title.setText("🔒 DEVICE LOCKED");
        title.setTextColor(android.graphics.Color.WHITE);
        title.setTextSize(28);
        title.setTypeface(null, android.graphics.Typeface.BOLD);
        title.setGravity(android.view.Gravity.CENTER);
        android.widget.LinearLayout.LayoutParams titleParams = new android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT);
        titleParams.bottomMargin = 20;
        root.addView(title, titleParams);

        // Lender name (LEGAL REQUIREMENT)
        TextView lender = new TextView(this);
        lender.setText("Financed by: XYZ Finance Pvt Ltd");
        lender.setTextColor(android.graphics.Color.parseColor("#9CA3AF"));
        lender.setTextSize(14);
        lender.setGravity(android.view.Gravity.CENTER);
        android.widget.LinearLayout.LayoutParams lenderParams = new android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT);
        lenderParams.bottomMargin = 30;
        root.addView(lender, lenderParams);

        // Lock reason (LEGAL REQUIREMENT)
        TextView reason = new TextView(this);
        reason.setText("Reason: Payment overdue by 7 days");
        reason.setTextColor(android.graphics.Color.parseColor("#FBBF24"));
        reason.setTextSize(16);
        reason.setGravity(android.view.Gravity.CENTER);
        android.widget.LinearLayout.LayoutParams reasonParams = new android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT);
        reasonParams.bottomMargin = 20;
        root.addView(reason, reasonParams);

        // Unlock condition (LEGAL REQUIREMENT)
        TextView unlock = new TextView(this);
        unlock.setText("To unlock: Pay ₹2,350 or contact support");
        unlock.setTextColor(android.graphics.Color.parseColor("#D1D5DB"));
        unlock.setTextSize(14);
        unlock.setGravity(android.view.Gravity.CENTER);
        android.widget.LinearLayout.LayoutParams unlockParams = new android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT);
        unlockParams.bottomMargin = 40;
        root.addView(unlock, unlockParams);

        // Support call button (LEGAL REQUIREMENT)
        Button supportBtn = new Button(this);
        supportBtn.setText("📞 CALL SUPPORT");
        supportBtn.setTextColor(android.graphics.Color.WHITE);
        supportBtn.setBackgroundColor(android.graphics.Color.parseColor("#2563EB"));
        supportBtn.setPadding(60, 30, 60, 30);
        supportBtn.setOnClickListener(v -> {
            Intent intent = new Intent(Intent.ACTION_DIAL);
            intent.setData(Uri.parse("tel:+918876655444"));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
        });
        android.widget.LinearLayout.LayoutParams btnParams = new android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT);
        btnParams.bottomMargin = 20;
        root.addView(supportBtn, btnParams);

        // Emergency call button
        Button emergencyBtn = new Button(this);
        emergencyBtn.setText("🚨 EMERGENCY (112)");
        emergencyBtn.setTextColor(android.graphics.Color.parseColor("#EF4444"));
        emergencyBtn.setBackgroundColor(android.graphics.Color.parseColor("#2a2a2a"));
        emergencyBtn.setPadding(60, 30, 60, 30);
        emergencyBtn.setOnClickListener(v -> {
            Intent intent = new Intent(Intent.ACTION_DIAL);
            intent.setData(Uri.parse("tel:112"));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
        });
        root.addView(emergencyBtn, btnParams);

        setContentView(root);
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        // Block all keys except volume
        int keyCode = event.getKeyCode();

        if (keyCode == KeyEvent.KEYCODE_VOLUME_DOWN ||
                keyCode == KeyEvent.KEYCODE_VOLUME_UP) {
            return super.dispatchKeyEvent(event);
        }

        // Block everything else
        return true;
    }

    @Override
    public void onBackPressed() {
        // Block back button
        Log.w(TAG, "Back button blocked");
    }

    @Override
    protected void onResume() {
        super.onResume();

        // HARDENING LAYER 1: Bulletproof LockTask enforcement
        if (dpm.isDeviceOwnerApp(getPackageName())) {
            if (!isInLockTask()) {
                Log.i(TAG, "Not in LockTask - entering now");
                try {
                    startLockTask();
                } catch (Exception e) {
                    Log.e(TAG, "Failed to start lock task", e);
                }
            }
        }

        // Re-check lock status
        boolean isLocked = prefs.getBoolean("DEVICE_LOCKED", false);

        if (!isLocked) {
            // Device unlocked - exit lock screen
            Log.i(TAG, "Device unlocked - closing lock screen");
            if (isInLockTask()) {
                try {
                    stopLockTask();
                } catch (Exception e) {
                    Log.e(TAG, "Failed to stop lock task", e);
                }
            }
            finish();
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);

        // HARDENING LAYER 2: Prevent escape via window focus loss
        if (!hasFocus && dpm.isDeviceOwnerApp(getPackageName())) {
            Log.w(TAG, "Window focus lost - re-enforcing lock");
            if (!isInLockTask()) {
                try {
                    startLockTask();
                } catch (Exception e) {
                    Log.e(TAG, "Failed to re-enter lock task", e);
                }
            }
        }
    }

    private boolean isInLockTask() {
        android.app.ActivityManager am = (android.app.ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
        if (am != null) {
            int lockTaskMode = am.getLockTaskModeState();
            return lockTaskMode != android.app.ActivityManager.LOCK_TASK_MODE_NONE;
        }
        return false;
    }

    private void forceHardLock() {
        // Force re-launch this activity to ensure lock
        Intent intent = new Intent(this, LockActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK |
                Intent.FLAG_ACTIVITY_CLEAR_TASK |
                Intent.FLAG_ACTIVITY_NO_ANIMATION);
        startActivity(intent);
    }
}
