import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuditLog {
    id: string;
    timestamp: string;
    action: string;
    role: 'admin' | 'super-admin' | 'guest';
    detail: string;
}

interface AdminAccount {
    id: string;
    username: string;
    pin: string;
    passkey: string | null; // One-time passkey for activation
    isActivated: boolean; // Whether admin has used passkey to set PIN
    isLocked: boolean;
    customerCount: number; // Track customers created by this admin
    createdAt: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    isAppLocked: boolean;
    currentAdmin: AdminAccount | null;
    admins: AdminAccount[];
    isAdminLocked: boolean; // Global lock still useful as a master switch
    logs: AuditLog[];
    login: (pin: string) => boolean;
    unlockApp: (pin: string) => boolean;
    loginWithPasskey: (passkey: string) => AdminAccount | null;
    activateAdmin: (passkey: string, newPin: string) => boolean;
    logout: () => void;
    addAdmin: (username: string) => string; // Returns passkey
    updateAdmin: (id: string, updates: Partial<AdminAccount>) => void;
    deleteAdmin: (id: string) => void;
    toggleAdminLock: (locked: boolean) => void;
    incrementCustomerCount: (adminId: string) => void;
    canCreateCustomer: (adminId: string) => boolean;
    addLog: (action: string, detail: string, specificRole?: 'admin' | 'super-admin' | 'guest') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const INITIAL_ADMIN: AdminAccount = {
    id: '1',
    username: 'Primary Admin',
    pin: '123456',
    passkey: null,
    isActivated: true,
    isLocked: false,
    customerCount: 0,
    createdAt: new Date().toISOString()
};

// Generate random 8-character passkey
const generatePasskey = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar chars
    let passkey = '';
    for (let i = 0; i < 8; i++) {
        passkey += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return passkey;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // 💾 Persist auth across app restarts (Essential for "Remember Admin ID")
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        return localStorage.getItem('isAdminAuthenticated') === 'true';
    });

    const [currentAdmin, setCurrentAdmin] = useState<AdminAccount | null>(() => {
        const saved = localStorage.getItem('currentAdmin');
        return saved ? JSON.parse(saved) : null;
    });

    // 🔐 App Lock State (For SecurePro native feel)
    const [isAppLocked, setIsAppLocked] = useState<boolean>(() => {
        // App is locked by default on boot ONLY if there's a valid authenticated session
        const isAuth = localStorage.getItem('isAdminAuthenticated') === 'true';
        const hasAdmin = localStorage.getItem('currentAdmin');
        return isAuth && hasAdmin !== null;
    });

    const [admins, setAdmins] = useState<AdminAccount[]>(() => {
        const saved = localStorage.getItem('adminAccounts');
        return saved ? JSON.parse(saved) : [INITIAL_ADMIN];
    });

    const [isAdminLocked, setIsAdminLocked] = useState<boolean>(() => {
        return localStorage.getItem('isAdminLocked') === 'true';
    });

    const [logs, setLogs] = useState<AuditLog[]>(() => {
        const saved = localStorage.getItem('adminAuditLogs');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('adminAccounts', JSON.stringify(admins));
    }, [admins]);

    const addLog = (action: string, detail: string, specificRole?: 'admin' | 'super-admin' | 'guest') => {
        const currentRole = specificRole || 'admin';
        const newLog: AuditLog = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            action,
            role: currentRole as any,
            detail
        };
        setLogs(prevLogs => {
            const updated = [newLog, ...prevLogs].slice(0, 50);
            localStorage.setItem('adminAuditLogs', JSON.stringify(updated));
            return updated;
        });
    };

    const login = (pin: string) => {
        const foundAdmin = admins.find(a => a.pin === pin);
        if (foundAdmin) {
            // Check global lock first, then individual lock
            if (isAdminLocked || foundAdmin.isLocked) {
                addLog('Login Attempt Failed', `Login blocked for ${foundAdmin.username}`, 'guest');
                return false;
            }
            setIsAuthenticated(true);
            setCurrentAdmin(foundAdmin);
            setIsAppLocked(false); // Unlock app immediately on first login
            localStorage.setItem('isAdminAuthenticated', 'true');
            localStorage.setItem('currentAdmin', JSON.stringify(foundAdmin));
            addLog('Login', `${foundAdmin.username} accessed terminal`, 'admin');
            return true;
        }

        addLog('Login Attempt Failed', 'Invalid PIN entered', 'guest');
        return false;
    };

    // 🔓 Function to unlock the app locally (Passcode/Biometrics)
    const unlockApp = (pin: string) => {
        if (currentAdmin && currentAdmin.pin === pin) {
            setIsAppLocked(false);
            addLog('App Unlocked', `Device unlocked by ${currentAdmin.username}`);
            return true;
        }
        return false;
    };

    const logout = () => {
        addLog('Logout', 'User logged out');
        setIsAuthenticated(false);
        setCurrentAdmin(null);
        setIsAppLocked(false);
        localStorage.removeItem('isAdminAuthenticated');
        localStorage.removeItem('currentAdmin');
    };

    const addAdmin = (username: string): string => {
        const passkey = generatePasskey();

        const newAdmin: AdminAccount = {
            id: Math.random().toString(36).substr(2, 9),
            username,
            pin: '', // Will be set during activation
            passkey,
            isActivated: false,
            isLocked: false,
            customerCount: 0,
            createdAt: new Date().toISOString()
        };
        setAdmins(prev => [...prev, newAdmin]);
        addLog('Account Created', `New Admin: ${username} (Passkey: ${passkey})`, 'super-admin');
        return passkey;
    };

    const loginWithPasskey = (passkey: string): AdminAccount | null => {
        const foundAdmin = admins.find(a => a.passkey === passkey && !a.isActivated);
        return foundAdmin || null;
    };

    const activateAdmin = (passkey: string, newPin: string): boolean => {
        if (newPin.length !== 6 || !/^\d+$/.test(newPin)) return false;
        if (admins.some(a => a.pin === newPin && a.isActivated)) return false; // PIN already in use

        const admin = admins.find(a => a.passkey === passkey && !a.isActivated);
        if (!admin) return false;

        setAdmins(prev => prev.map(a =>
            a.id === admin.id
                ? { ...a, pin: newPin, passkey: null, isActivated: true }
                : a
        ));
        addLog('Account Activated', `Admin activated: ${admin.username}`, 'admin');
        return true;
    };

    const incrementCustomerCount = (adminId: string) => {
        setAdmins(prev => prev.map(a =>
            a.id === adminId
                ? { ...a, customerCount: a.customerCount + 1 }
                : a
        ));
    };

    const canCreateCustomer = (adminId: string): boolean => {
        const admin = admins.find(a => a.id === adminId);
        return admin ? admin.customerCount < 2 : false;
    };

    const updateAdmin = (id: string, updates: Partial<AdminAccount>) => {
        setAdmins(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
        const admin = admins.find(a => a.id === id);
        if (updates.pin) addLog('Credential Update', `PIN changed for ${admin?.username}`, 'super-admin');
        if (updates.isLocked !== undefined) addLog(updates.isLocked ? 'Access Revoked' : 'Access Restored', `Status changed for ${admin?.username}`, 'super-admin');
    };

    const deleteAdmin = (id: string) => {
        const admin = admins.find(a => a.id === id);
        setAdmins(prev => prev.filter(a => a.id !== id));
        addLog('Account Deleted', `Admin removed: ${admin?.username}`, 'super-admin');
    };

    const toggleAdminLock = (locked: boolean) => {
        setIsAdminLocked(locked);
        localStorage.setItem('isAdminLocked', String(locked));
        addLog(locked ? 'Panel Suspended' : 'Panel Activated', `GLOBAL Admin access ${locked ? 'blocked' : 'restored'}`);
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            isAppLocked,
            currentAdmin,
            admins,
            login,
            unlockApp,
            loginWithPasskey,
            activateAdmin,
            logout,
            addAdmin,
            updateAdmin,
            deleteAdmin,
            isAdminLocked,
            logs,
            toggleAdminLock,
            incrementCustomerCount,
            canCreateCustomer,
            addLog
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

