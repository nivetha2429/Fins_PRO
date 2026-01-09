export interface Customer {
  id: string;
  name: string;
  phoneNo: string;
  aadharNo: string;
  address: string;
  imei1: string;
  imei2: string;
  mobileModel: string;
  financeName: string;
  totalAmount: number;
  emiAmount: number;
  emiDate: number; // Day of month
  totalEmis: number;
  paidEmis: number;
  isLocked: boolean;
  location: {
    lat: number;
    lng: number;
    lastUpdated: string;
    address?: string;
  };
  createdAt: string;
  lockHistory: {
    id: string;
    action: 'locked' | 'unlocked';
    timestamp: string;
    reason: string;
  }[];
  photoUrl?: string;
  documents?: string[];
  isEnrolled?: boolean;
  enrollmentToken?: string;
  deviceStatus?: {
    status: 'pending' | 'installing' | 'connected' | 'online' | 'offline' | 'error' | 'warning' | 'ADMIN_INSTALLED' | 'removed';
    lastSeen?: Date;
    lastStatusUpdate?: Date;
    installProgress?: number; // 0-100
    errorMessage?: string;
    technical?: {
      brand?: string;
      model?: string;
      osVersion?: string;
      androidId?: string;
      serial?: string;
    };
    steps?: {
      qrScanned?: boolean;
      appInstalled?: boolean;
      appLaunched?: boolean;
      detailsFetched?: boolean;
      imeiVerified?: boolean;
      deviceBound?: boolean;
    };
  };
  simDetails?: {
    operator: string;
    serialNumber?: string;
    phoneNumber?: string;
    imsi?: string;
    isAuthorized?: boolean;
  };
  simChangeHistory?: {
  provisioningStages?: ProvisioningStage[];
    serialNumber?: string;
    operator?: string;
    detectedAt?: string;
    ipAddress?: string;
  }[];
  offlineLockToken?: string;
  offlineUnlockToken?: string;
  expectedIMEI?: string;
  // Lock Screen Customization
  lockMessage?: string;
  supportPhone?: string;
  wallpaperUrl?: string;
  // Security Events
  securityEvents?: {
    event: string;
    timestamp: string;
    action?: string;
    details?: any;
    ipAddress?: string;
  }[];
  // Advanced Controls
  networkRestricted?: boolean;
  wifiRestricted?: boolean;
  cameraRestricted?: boolean;
  callsRestricted?: boolean;
  notificationsRestricted?: boolean;
  powerOffRestricted?: boolean;
  resetRestricted?: boolean;
}

export interface LockEvent {
  id: string;
  action: 'locked' | 'unlocked';
  timestamp: string;
  reason: string;
}

export interface AdminStats {
  totalCustomers: number;
  lockedDevices: number;
  unlockedDevices: number;
  pendingEmis: number;
  totalEmiValue: number;
  collectedAmount: number;
}

export interface ProvisioningStage {
  stage: 'QR_SCANNED' | 'DPC_DOWNLOADING' | 'DPC_INSTALLED' | 'DEVICE_OWNER_SET' | 
         'USER_APP_DOWNLOADING' | 'USER_APP_INSTALLED' | 'PERMISSIONS_GRANTED' | 
         'CONFIG_APPLIED' | 'PROVISIONING_COMPLETE';
  status: 'pending' | 'in_progress' | 'success' | 'failed';
  message?: string;
  timestamp: string;
}
