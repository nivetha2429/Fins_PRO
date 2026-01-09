export type DeviceStatus = 'LOCKED' | 'UNLOCKED';

export interface Location {
    lat: number;
    lng: number;
    lastUpdated: string;
    address?: string;
}

export interface FeatureLocks {
    camera: boolean; // Disable camera app
    network: boolean; // Simulate signal loss
    wifi: boolean; // Disable WiFi
    power: boolean; // Prevent power off (simulated)
    reset: boolean; // Prevent factory reset
    usb: boolean; // Prevent USB Debugging/Data transfer
    gps: boolean; // Force GPS Only
}

export interface Device {
    id: string;
    imei: string;
    imei2: string; // Dual SIM support
    name: string;
    model: string;

    // Customer Details
    customerName: string;
    phoneNumber: string;
    aadharNumber: string; // Indian Identity Number
    address: string;

    // Finance Details
    financeName: string; // e.g., "Bajaj Finserv", "Samsung Finance+"
    status: DeviceStatus;
    mobilePrice: number;
    loanAmount: number;
    emiAmount: number;
    amountDue: number; // Keep for backward compatibility or calculated
    nextEmiDate: string;
    totalTenure: number;
    emisPaid: number;

    // Tracking & Control
    location: Location;
    featureLocks: FeatureLocks;
    photoUrl?: string; // Base64 string
    documents?: string[]; // Array of Base64 strings

    installationDate: string;
    isEnrolled?: boolean;
    enrollmentToken?: string;
}

export interface DeviceContextType {
    devices: Device[];
    loading: boolean;
    addDevice: (device: Omit<Device, 'id' | 'status' | 'installationDate' | 'location' | 'featureLocks'>) => Device;
    updateDevice: (id: string, updates: Partial<Device>) => void;
    collectEmi: (id: string) => void;
    toggleLock: (id: string) => void;
    toggleFeatureLock: (id: string, feature: keyof FeatureLocks) => void;
    updateLocation: (id: string, location: Location) => void;
    getDeviceByImei: (imei: string) => Device | undefined;
    deleteDevice: (id: string) => void;
    enrollDevice: (token: string) => boolean;
    lockAllDevices: () => void;
    updateGlobalFeatureLocks: (locks: Partial<FeatureLocks>) => void;
}
