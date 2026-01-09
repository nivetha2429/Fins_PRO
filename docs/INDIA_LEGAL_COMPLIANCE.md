# ⚖️ INDIA LEGAL COMPLIANCE - RBI & CONSUMER PROTECTION

## 🇮🇳 REGULATORY FRAMEWORK

### Applicable Laws:
1. **RBI Guidelines on Digital Lending** (2022)
2. **Consumer Protection Act, 2019**
3. **IT Act, 2000**
4. **Personal Data Protection Bill**
5. **Fair Practices Code for NBFCs**

---

## 🔴 CRITICAL LEGAL REQUIREMENTS

### 1️⃣ MANDATORY DISCLOSURES ON LOCK SCREEN

**What MUST be displayed:**

```xml
<!-- activity_lock.xml -->
<LinearLayout>
    <!-- Legal Header -->
    <TextView
        android:text="EMI Payment Overdue Notice"
        android:textSize="18sp"
        android:textColor="#FFFFFF"
        android:textStyle="bold"/>
    
    <!-- Amount Due -->
    <TextView
        android:id="@+id/emiAmount"
        android:text="Amount Due: ₹2,450"
        android:textSize="20sp"/>
    
    <!-- Due Date -->
    <TextView
        android:id="@+id/dueDate"
        android:text="Payment Due: 05 Jan 2026"
        android:textSize="16sp"/>
    
    <!-- Grace Period (MANDATORY) -->
    <TextView
        android:id="@+id/gracePeriod"
        android:text="Grace Period: 3 days remaining"
        android:textSize="14sp"
        android:textColor="#FFA500"/>
    
    <!-- Customer Support (MANDATORY) -->
    <TextView
        android:id="@+id/support"
        android:text="Customer Support: +91 98765 43210"
        android:textSize="16sp"
        android:textColor="#4DA3FF"
        android:textStyle="bold"/>
    
    <!-- Grievance Officer (MANDATORY for NBFCs) -->
    <TextView
        android:id="@+id/grievance"
        android:text="Grievance Officer: grievance@company.com"
        android:textSize="12sp"
        android:textColor="#AAAAAA"/>
    
    <!-- Legal Notice -->
    <TextView
        android:text="This device is subject to a financing agreement. Unlock will be restored upon payment clearance."
        android:textSize="11sp"
        android:textColor="#CCCCCC"
        android:gravity="center"
        android:layout_marginTop="16dp"/>
    
    <!-- RBI Complaint Portal (MANDATORY) -->
    <TextView
        android:text="To file complaint: cms.rbi.org.in"
        android:textSize="10sp"
        android:textColor="#888888"
        android:layout_marginTop="8dp"/>
</LinearLayout>
```

---

## ⚠️ PROHIBITED PRACTICES (NEVER DO THIS)

### ❌ ILLEGAL:
- Locking device **without prior notice** (minimum 3 days)
- Locking for **non-payment of charges not disclosed**
- **Harassing messages** on lock screen
- **Blocking emergency calls** (Police, Ambulance)
- **Accessing personal data** without consent
- **Sharing customer data** with third parties
- Locking device **before grace period expires**

### ✅ LEGAL:
- Locking after **written notice + grace period**
- Displaying **exact amount due**
- Providing **customer support contact**
- Allowing **emergency calls** (112, 100, 108)
- **Unlocking immediately** upon payment
- Maintaining **audit trail** of all actions

---

## 📋 LEGAL LOCK SCREEN TEMPLATE

**File**: `LegalLockScreen.java`

```java
package com.securefinance.emilock.legal;

public class LegalLockScreen {
    
    public static LockScreenData createLegalLockScreen(
        String emiAmount,
        String dueDate,
        int graceDaysRemaining,
        String supportPhone,
        String grievanceEmail,
        String lenderName
    ) {
        
        LockScreenData data = new LockScreenData();
        
        // Title (Professional, not threatening)
        data.title = "Payment Reminder";
        
        // Amount
        data.amount = "Amount Due: " + emiAmount;
        
        // Due date
        data.dueDate = "Payment Due: " + dueDate;
        
        // Grace period (MANDATORY)
        if (graceDaysRemaining > 0) {
            data.gracePeriod = "Grace Period: " + graceDaysRemaining + " days remaining";
            data.gracePeriodColor = "#FFA500"; // Orange
        } else {
            data.gracePeriod = "Grace period expired";
            data.gracePeriodColor = "#FF0000"; // Red
        }
        
        // Support (MANDATORY)
        data.support = "Customer Support: " + supportPhone;
        data.supportSubtext = "Available 9 AM - 6 PM (Mon-Sat)";
        
        // Grievance (MANDATORY for NBFCs)
        data.grievance = "Grievance Officer: " + grievanceEmail;
        
        // Legal notice (Professional language)
        data.legalNotice = 
            "This device is financed by " + lenderName + ". " +
            "Access will be restored immediately upon payment clearance. " +
            "For assistance, please contact customer support.";
        
        // RBI complaint portal (MANDATORY)
        data.rbiPortal = "To file complaint: cms.rbi.org.in";
        
        // Emergency access (MANDATORY)
        data.emergencyNotice = "Emergency calls (112, 100, 108) are always available";
        
        return data;
    }
}
```

---

## 🚨 EMERGENCY CALL HANDLING (MANDATORY)

**File**: `EmergencyCallHandler.java`

```java
package com.securefinance.emilock.emergency;

import android.content.Intent;
import android.net.Uri;

public class EmergencyCallHandler {
    
    private static final String[] EMERGENCY_NUMBERS = {
        "112",  // Universal emergency
        "100",  // Police
        "101",  // Fire
        "102",  // Ambulance
        "108",  // Ambulance (alternate)
        "1091", // Women helpline
        "1098"  // Child helpline
    };
    
    public static boolean isEmergencyNumber(String number) {
        if (number == null) return false;
        
        String cleaned = number.replaceAll("[^0-9]", "");
        
        for (String emergency : EMERGENCY_NUMBERS) {
            if (cleaned.equals(emergency) || cleaned.endsWith(emergency)) {
                return true;
            }
        }
        return false;
    }
    
    public static void allowEmergencyCall(Context context, String number) {
        Intent intent = new Intent(Intent.ACTION_CALL);
        intent.setData(Uri.parse("tel:" + number));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
        
        Log.i("EmergencyCall", "✅ Emergency call allowed: " + number);
    }
}
```

**Integration in LockActivity**:

```java
@Override
public boolean onKeyDown(int keyCode, KeyEvent event) {
    // Allow emergency calls
    if (keyCode == KeyEvent.KEYCODE_CALL) {
        // Check if dialing emergency number
        // Allow if emergency, block otherwise
        return false; // Allow emergency
    }
    
    // Block all other keys
    return true;
}
```

---

## 📝 GRACE PERIOD IMPLEMENTATION

**File**: `GracePeriodManager.java`

```java
package com.securefinance.emilock.legal;

import java.util.Date;
import java.util.concurrent.TimeUnit;

public class GracePeriodManager {
    
    private static final int GRACE_PERIOD_DAYS = 3; // Minimum legal requirement
    
    public static boolean isGracePeriodActive(Date dueDate) {
        Date now = new Date();
        Date gracePeriodEnd = new Date(
            dueDate.getTime() + TimeUnit.DAYS.toMillis(GRACE_PERIOD_DAYS)
        );
        
        return now.before(gracePeriodEnd);
    }
    
    public static int getRemainingGraceDays(Date dueDate) {
        Date now = new Date();
        Date gracePeriodEnd = new Date(
            dueDate.getTime() + TimeUnit.DAYS.toMillis(GRACE_PERIOD_DAYS)
        );
        
        long diff = gracePeriodEnd.getTime() - now.getTime();
        return (int) TimeUnit.MILLISECONDS.toDays(diff);
    }
    
    public static boolean canLockDevice(Date dueDate) {
        // Can only lock AFTER grace period expires
        return !isGracePeriodActive(dueDate);
    }
}
```

**Backend Validation**:

```javascript
// backend/routes/customerRoutes.js
router.post('/:id/lock', async (req, res) => {
    const customer = await Customer.findOne({ customerId: req.params.id });
    
    // Check grace period
    const dueDate = new Date(customer.emiDueDate);
    const gracePeriodEnd = new Date(dueDate.getTime() + (3 * 24 * 60 * 60 * 1000));
    const now = new Date();
    
    if (now < gracePeriodEnd) {
        return res.status(400).json({
            error: 'Cannot lock device during grace period',
            gracePeriodEnds: gracePeriodEnd,
            daysRemaining: Math.ceil((gracePeriodEnd - now) / (24 * 60 * 60 * 1000))
        });
    }
    
    // Proceed with lock
    // ...
});
```

---

## 📊 AUDIT TRAIL (MANDATORY)

**File**: `AuditLogger.java`

```java
package com.securefinance.emilock.audit;

public class AuditLogger {
    
    public static void logLockAction(
        String customerId,
        String action,
        String reason,
        String initiatedBy
    ) {
        AuditEntry entry = new AuditEntry();
        entry.customerId = customerId;
        entry.action = action; // "LOCK" or "UNLOCK"
        entry.reason = reason;
        entry.initiatedBy = initiatedBy;
        entry.timestamp = new Date();
        entry.deviceInfo = getDeviceInfo();
        
        // Send to backend
        sendToBackend("/api/audit/log", entry);
        
        // Also log locally (encrypted)
        saveLocalAudit(entry);
    }
    
    private static void sendToBackend(String endpoint, AuditEntry entry) {
        // POST to backend with audit data
        // Backend must store for minimum 3 years (legal requirement)
    }
}
```

**Backend Storage**:

```javascript
// backend/models/AuditLog.js
const auditLogSchema = new mongoose.Schema({
    customerId: { type: String, required: true, index: true },
    action: { type: String, required: true }, // LOCK, UNLOCK, NOTICE_SENT
    reason: { type: String, required: true },
    initiatedBy: { type: String, required: true }, // admin email
    timestamp: { type: Date, default: Date.now },
    deviceInfo: Object,
    ipAddress: String,
    gracePeriodStatus: String
}, {
    timestamps: true,
    // Retain for 3 years (legal requirement)
    expireAfterSeconds: 3 * 365 * 24 * 60 * 60
});
```

---

## 📧 PRE-LOCK NOTICE (MANDATORY)

**Must send before locking:**

```javascript
// backend/services/notificationService.js
async function sendPreLockNotice(customer) {
    const noticeData = {
        customerName: customer.name,
        emiAmount: customer.emiAmount,
        dueDate: customer.emiDueDate,
        gracePeriodDays: 3,
        lockDate: calculateLockDate(customer.emiDueDate),
        supportPhone: process.env.SUPPORT_PHONE,
        grievanceEmail: process.env.GRIEVANCE_EMAIL
    };
    
    // Send via SMS
    await smsService.send(customer.phone, 
        `Dear ${noticeData.customerName}, ` +
        `Your EMI payment of ${noticeData.emiAmount} is overdue. ` +
        `Please pay within ${noticeData.gracePeriodDays} days to avoid device lock. ` +
        `Support: ${noticeData.supportPhone}`
    );
    
    // Send via Email
    await emailService.send(customer.email, 'EMI Payment Reminder', noticeTemplate);
    
    // Log notice sent
    await AuditLog.create({
        customerId: customer.customerId,
        action: 'NOTICE_SENT',
        reason: 'EMI overdue',
        initiatedBy: 'SYSTEM'
    });
}
```

---

## ✅ LEGAL COMPLIANCE CHECKLIST

Before locking any device:

- [ ] EMI payment is overdue
- [ ] Grace period (minimum 3 days) has expired
- [ ] Pre-lock notice sent via SMS + Email
- [ ] Customer support contact displayed on lock screen
- [ ] Grievance officer contact displayed
- [ ] RBI complaint portal mentioned
- [ ] Emergency calls (112, 100, 108) allowed
- [ ] Exact amount due displayed
- [ ] Professional language (no threats/harassment)
- [ ] Audit log entry created
- [ ] Customer can contact support from lock screen

---

## 🚫 NEVER DO THIS (ILLEGAL)

- ❌ Lock without notice
- ❌ Lock during grace period
- ❌ Block emergency calls
- ❌ Use threatening language
- ❌ Access personal data
- ❌ Share customer info
- ❌ Charge undisclosed fees
- ❌ Lock for disputed amounts

---

## 📞 REQUIRED CONTACT INFORMATION

**Lock screen MUST display:**

1. **Customer Support**: Phone + Hours
2. **Grievance Officer**: Email + Name
3. **RBI Complaint Portal**: cms.rbi.org.in
4. **Company Name**: Full legal name
5. **NBFC License Number**: (if applicable)

---

**Legal compliance protects both lender and borrower.**
**Non-compliance can result in RBI penalties and license cancellation.**
