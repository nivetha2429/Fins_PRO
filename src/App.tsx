import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import {
    LayoutGrid,
    Users,
    PlusCircle,
    Settings as SettingsIcon,
    LogOut,
    ChevronLeft
} from 'lucide-react';

// Pages
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import AddCustomer from './pages/AddCustomer';
import CustomerDetails from './pages/CustomerDetails';
import Settings from './pages/Settings';
import Admins from './pages/Admins';
import BatchProvisioner from './pages/BatchProvisioner';
import LocalUnlock from './components/LocalUnlock';

// Contexts
import { AuthProvider, useAuth } from './context/AuthContext';
import { DeviceProvider } from './context/DeviceContext';
import { TooltipProvider } from './components/ui/tooltip';

const queryClient = new QueryClient();

// Add ScrollToTop component
const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
        const scrollableDiv = document.getElementById('scrollableDiv');
        if (scrollableDiv) {
            scrollableDiv.scrollTo(0, 0);
        }
    }, [pathname]);

    return null;
};

// --- Components for Layout ---

const BottomNav = () => {
    const location = useLocation();
    const navigate = useNavigate();

    if (location.pathname === '/login' || location.pathname === '/admin/login') return null;

    const tabs = [
        { path: '/', icon: LayoutGrid, label: 'Home' },
        { path: '/customers', icon: Users, label: 'Fleet' },
        { path: '/add-customer', icon: PlusCircle, label: 'Add' },
        { path: '/settings', icon: SettingsIcon, label: 'Settings' },
    ];

    return (
        <div className="fixed bottom-0 w-full max-w-md left-1/2 -translate-x-1/2 h-[80px] bg-white/90 backdrop-blur-xl border-t border-slate-200 pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center h-full px-2 pb-2">
                {tabs.map((tab) => {
                    const isActive = location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path));
                    return (
                        <button
                            key={tab.path}
                            onClick={() => navigate(tab.path)}
                            className={`flex flex-col items-center justify-center w-full h-full gap-1.5 transition-all duration-300 ${isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <div className={`p-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-primary/10 translate-y-[-4px]' : ''}`}>
                                <tab.icon size={22} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
                            </div>
                            <span className={`text-[10px] font-bold tracking-wide uppercase ${isActive ? 'opacity-100' : 'opacity-60'}`}>{tab.label}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-[90px] animate-in fade-in duration-500">
            <div className="flex-1 w-full max-w-md mx-auto bg-white min-h-screen shadow-2xl overflow-hidden relative">
                {children}
                <BottomNav />
            </div>
        </div>
    );
};

const AuthWrapper = () => {
    const { isAuthenticated, isAppLocked } = useAuth();

    if (isAuthenticated && isAppLocked) {
        return <LocalUnlock />;
    }

    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollToTop />
            <AppLayout>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/admin/login" element={<AdminLogin />} />

                    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
                    <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetails /></ProtectedRoute>} />
                    <Route path="/add-customer" element={<ProtectedRoute><AddCustomer /></ProtectedRoute>} />
                    <Route path="/batch-provision" element={<ProtectedRoute><BatchProvisioner /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                    <Route path="/admins" element={<ProtectedRoute><Admins /></ProtectedRoute>} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AppLayout>
            <Toaster position="top-center" />
        </BrowserRouter>
    );
};

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <DeviceProvider>
                    <TooltipProvider>
                        <AuthWrapper />
                    </TooltipProvider>
                </DeviceProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}
