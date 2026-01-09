import { API_BASE_URL } from '@/config/api';

// CRITICAL: The provisioning flow downloads the APK from a URL. 
// This URL MUST be accessible from the public internet (or the device's network).
// Localhost will NOT work for a factory reset device.
const PROVISIONING_BASE_URL = 'https://fins-pro.onrender.com';

/**
 * Generate Android Device Owner Provisioning QR Code
 * This is used during factory reset setup (tap 6 times on welcome screen)
 * 
 * CRITICAL: This MUST follow Android's official provisioning format
 * Reference: https://developers.google.com/android/work/play/emm-api/prov-devices#create_a_qr_code
 */
export const getDeviceOwnerProvisioningQR = async (
    customer: {
        id: string;
        name?: string;
        phoneNo?: string;
        mobileModel?: string;
        imei1?: string;
        imei2?: string;
        financeName?: string;
        totalAmount?: number | string;
        emiAmount?: number | string;
        totalEmis?: number | string;
        createdAt?: string;
        [key: string]: any;
    },
    // We ignore the passed serverUrl for the critical download/checksum parts 
    // to ensure we always use the public production assets which match the checksum.
    serverUrl: string = API_BASE_URL,
    wifiConfig?: {
        ssid: string;
        password: string;
        securityType?: 'WPA' | 'WEP' | 'NONE';
    }
): Promise<string> => {
    // CRITICAL: Fetch the provisioning payload from the backend
    // This ensures the checksum is always calculated from the actual APK file on the server
    try {
        const response = await fetch(`${API_BASE_URL}/api/provisioning/payload/${customer.id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch provisioning payload');
        }
        const payload = await response.json();

        // MERGE Wi-Fi Config if provided
        if (wifiConfig && wifiConfig.ssid) {
            Object.assign(payload, {
                "android.app.extra.PROVISIONING_WIFI_SSID": wifiConfig.ssid,
                "android.app.extra.PROVISIONING_WIFI_PASSWORD": wifiConfig.password,
                "android.app.extra.PROVISIONING_WIFI_SECURITY_TYPE": wifiConfig.securityType || 'WPA'
            });
        }

        return JSON.stringify(payload);
    } catch (error) {
        console.error('Error fetching provisioning payload:', error);
        throw error;
    }
};


/**
 * Generate App Linking QR Code
 * This is used INSIDE the app to link a device to a customer
 * (Step 2 of Two-Step Flow - scanned by the EMI Pro app's internal scanner)
 */
export const getAppLinkingQR = (
    customer: {
        id: string;
        [key: string]: any;
    },
    serverUrl: string = API_BASE_URL
): string => {
    const linkingData = {
        customerId: customer.id,
        serverUrl: serverUrl
    };

    return JSON.stringify(linkingData);
};

/**
 * Legacy function for backward compatibility
 * Defaults to App Linking QR
 */
export const getProvisioningQRData = getDeviceOwnerProvisioningQR;
