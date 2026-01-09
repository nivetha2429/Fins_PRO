import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer } from '../types/customer';
import { toast } from 'sonner';
import { getApiUrl, apiFetch } from '../config/api';

interface DeviceContextType {
    customers: Customer[];
    setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
    isAppLocked: boolean;
    setIsAppLocked: (locked: boolean) => void;
    refreshCustomers: () => Promise<void>;
    updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
    addCustomer: (customer: any) => Promise<void>;
    toggleLock: (id: string, status: boolean, reason?: string) => Promise<void>;
    deleteCustomer: (id: string) => Promise<void>;
    unclaimedDevices: any[];
    refreshUnclaimed: () => Promise<void>;
    claimDevice: (deviceId: string, customerId: string) => Promise<void>;
    sendRemoteCommand: (id: string, command: string, params?: any) => Promise<void>;
    collectEmi: (id: string, amount: number) => Promise<void>;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Start with empty customers - will be loaded from backend
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [unclaimedDevices, setUnclaimedDevices] = useState<any[]>([]);
    const [isAppLocked, setIsAppLocked] = useState(false);

    // Helper function to get auth headers
    const getAuthHeaders = () => {
        const token = localStorage.getItem('adminToken');
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    };

    // Save customers to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('customers', JSON.stringify(customers));
    }, [customers]);

    const refreshCustomers = async () => {
        try {
            // Add timestamp to prevent caching
            const response = await apiFetch(getApiUrl(`/api/customers?_t=${Date.now()}`), {
                headers: getAuthHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch customers');
            const data = await response.json();
            setCustomers(data);
        } catch (error) {
            // If 401, apiFetch already handled logout
            console.error('Failed to fetch customers:', error);
        }
    };

    const refreshUnclaimed = async () => {
        try {
            // Use existing devices endpoint with UNASSIGNED filter
            const response = await apiFetch(getApiUrl('/api/devices?state=UNASSIGNED'), {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setUnclaimedDevices(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            // Silently fail - unclaimed devices are optional
            setUnclaimedDevices([]);
        }
    };

    const claimDevice = async (deviceId: string, customerId: string) => {
        try {
            const response = await apiFetch(getApiUrl('/api/devices/claim'), {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ deviceId, customerId }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Claim failed");
            }

            toast.success("Device successfully claimed!");
            await refreshCustomers();
            await refreshUnclaimed();

        } catch (error) {
            console.error("Claim error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to claim device");
            throw error;
        }
    };

    const updateCustomer = async (id: string, updates: Partial<Customer>) => {
        // Optimistic Update (Immediate UI reflection)
        setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

        try {
            const response = await apiFetch(getApiUrl(`/api/customers/${id}`), {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify(updates),
            });
            if (!response.ok) throw new Error('Failed to update customer');
        } catch (error) {
            console.error('API update failed:', error);
        }
    };

    const addCustomer = async (customerData: Omit<Customer, 'createdAt' | 'lockHistory'>) => {
        const newCustomer: Customer = {
            ...customerData,
            id: customerData.id || `CUS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
            createdAt: new Date().toISOString(),
            lockHistory: [],
            isLocked: false,
            location: {
                lat: 0,
                lng: 0,
                lastUpdated: new Date().toISOString()
            }
        };

        // Optimistic Update
        setCustomers(prev => [newCustomer, ...prev]);

        try {
            const response = await apiFetch(getApiUrl('/api/customers'), {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(newCustomer),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                const message = errorData.message || errorData.error || `Failed to add customer: ${response.status}`;
                throw new Error(message);
            }
        } catch (error) {
            // Rollback optimistic update
            setCustomers(prev => prev.filter(c => c.id !== newCustomer.id));
            console.error('Failed to add customer:', error);
            throw error; // Re-throw so QRCodeGenerator knows it failed
        }
    };

    const sendRemoteCommand = async (id: string, command: string, params: any = {}) => {
        try {
            const response = await apiFetch(getApiUrl(`/api/customers/${id}/command`), {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ command, params }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to send command');
            }

            const data = await response.json();

            // Show success message
            toast.success(`Command '${command}' sent to device queue`);

            // Show warning if device is offline
            if (data.warning) {
                toast.warning(data.warning, {
                    duration: 6000,
                    icon: '⚠️'
                });
            }

            // Show additional info about device status
            if (data.deviceStatus && !data.deviceStatus.isOnline) {
                const lastSeen = data.deviceStatus.lastSeen
                    ? new Date(data.deviceStatus.lastSeen).toLocaleString()
                    : 'Never';
                toast.info(`Device last seen: ${lastSeen}`, {
                    duration: 5000
                });
            }

            await refreshCustomers();
        } catch (error) {
            console.error('Remote command failed:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to send command');
        }
    };

    const collectEmi = async (id: string, amount: number) => {
        try {
            const response = await apiFetch(getApiUrl('/api/payments/pay-emi'), {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ customerId: id, amount }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to process payment');
            }

            const data = await response.json();
            toast.success(data.message || 'Payment recorded successfully');

            // If the backend says it's unlocked, let's notify the user specifically
            if (data.isLocked === false) {
                toast.success("Device Auto-Unlocked due to payment!");
            }

            await refreshCustomers();
        } catch (error) {
            console.error('Payment failed:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to record payment');
        }
    };

    const toggleLock = async (id: string, status: boolean, reason: string = 'Manual override') => {
        // 1. Optimistic UI update
        setCustomers(prev => prev.map(c => c.id === id ? { ...c, isLocked: status } : c));

        // 2. Call the new command API instead of just patching DB
        await sendRemoteCommand(id, status ? 'lock' : 'unlock');
    };

    const deleteCustomer = async (id: string) => {
        // Store original state for rollback
        const originalCustomers = customers;

        // Optimistic Update
        setCustomers(prev => prev.filter(c => c.id !== id));

        try {
            const response = await apiFetch(getApiUrl(`/api/customers/${id}`), {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to delete customer' }));
                throw new Error(errorData.message || 'Failed to delete customer');
            }

            toast.success('Customer deleted successfully');
        } catch (error) {
            // Rollback on error
            setCustomers(originalCustomers);
            console.error('Delete failed:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to delete customer. Please try again.');
        }
    };

    useEffect(() => {
        // Only fetch data if user is authenticated
        const token = localStorage.getItem('adminToken');
        if (!token) {
            return; // Don't make API calls on login page
        }

        // Initial load
        refreshCustomers();

        // Poll every 10 seconds for real-time updates (reduced from 3s to reduce server load)
        const interval = setInterval(async () => {
            // Check if still authenticated before each poll
            const currentToken = localStorage.getItem('adminToken');
            if (!currentToken) {
                clearInterval(interval); // Stop polling if logged out
                return;
            }

            try {
                await refreshCustomers();
                await refreshUnclaimed();
            } catch (error) {
                // If authentication fails, stop polling
                if (error instanceof Error && error.message.includes('Authentication')) {
                    clearInterval(interval);
                }
            }
        }, 10000); // Changed from 3000ms to 10000ms (10 seconds)

        return () => clearInterval(interval);
    }, []);

    return (
        <DeviceContext.Provider value={{
            customers,
            setCustomers,
            isAppLocked,
            setIsAppLocked,
            refreshCustomers,
            updateCustomer,
            addCustomer,
            toggleLock,

            deleteCustomer,
            unclaimedDevices,
            refreshUnclaimed,
            claimDevice,
            sendRemoteCommand,
            collectEmi
        }}>
            {children}
        </DeviceContext.Provider>
    );
};

export const useDevice = () => {
    const context = useContext(DeviceContext);
    if (context === undefined) {
        throw new Error('useDevice must be used within a DeviceProvider');
    }
    return context;
};
