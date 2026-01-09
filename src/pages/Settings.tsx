import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LogOut,
    User,
    Bell,
    ChevronRight,
    ShieldCheck,
    FileText,
    HelpCircle,
    Users
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl } from '@/config/api';
import PullToRefresh from 'react-simple-pull-to-refresh';

export default function Settings() {
    const { logout, currentAdmin: user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    // Check if current user is Super Admin
    const [adminUser, setAdminUser] = useState(() => {
        const adminUserStr = localStorage.getItem('adminUser');
        return adminUserStr ? JSON.parse(adminUserStr) : null;
    });
    const isSuperAdmin = adminUser?.role === 'SUPER_ADMIN';

    const refreshProfile = async () => {
        const token = localStorage.getItem('adminToken');
        if (!token) return;
        try {
            const res = await fetch(getApiUrl('/api/admin/me'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('adminUser', JSON.stringify(data.user));
                setAdminUser(data.user);
                toast({ description: "Profile updated successfully" });
            }
        } catch (e) {
            console.error(e);
            toast({ variant: "destructive", description: "Failed to refresh profile" });
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="px-6 pt-12 pb-6 border-b border-slate-100 bg-white sticky top-0 z-30">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-24 no-scrollbar" id="settings-scroll-container">
                <PullToRefresh onRefresh={refreshProfile}>
                    <div className="space-y-8 min-h-full">
                        {/* Profile Card */}
                        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
                            <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center text-white font-black text-lg">
                                {user?.username?.[0] || adminUser?.name?.[0] || 'A'}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-900 text-lg">{user?.username || adminUser?.name || 'Administrator'}</h3>
                                <p className="text-sm font-medium text-slate-400">
                                    {isSuperAdmin ? 'Super Admin Access' : 'Admin Access'}
                                </p>
                            </div>
                        </div>

                        {/* Settings Groups */}
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">General</p>
                                <div className="bg-white rounded-[24px] border border-slate-100 overflow-hidden shadow-sm">
                                    {[
                                        { icon: User, label: 'Profile Settings' },
                                        { icon: Bell, label: 'Notifications', badge: '2' },
                                        { icon: ShieldCheck, label: 'Security & Privacy' }
                                    ].map((item, i) => (
                                        <button key={i} className="w-full flex items-center p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-slate-50 last:border-0">
                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center mr-3">
                                                <item.icon className="w-4 h-4 text-slate-600" />
                                            </div>
                                            <span className="flex-1 text-left text-sm font-bold text-slate-700">{item.label}</span>
                                            {item.badge && (
                                                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold mr-2">{item.badge}</span>
                                            )}
                                            <ChevronRight className="w-4 h-4 text-slate-300" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Support</p>
                                <div className="bg-white rounded-[24px] border border-slate-100 overflow-hidden shadow-sm">
                                    {[
                                        { icon: FileText, label: 'Terms & Conditions' },
                                        { icon: HelpCircle, label: 'Help & Support' }
                                    ].map((item, i) => (
                                        <button key={i} className="w-full flex items-center p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-slate-50 last:border-0">
                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center mr-3">
                                                <item.icon className="w-4 h-4 text-slate-600" />
                                            </div>
                                            <span className="flex-1 text-left text-sm font-bold text-slate-700">{item.label}</span>
                                            <ChevronRight className="w-4 h-4 text-slate-300" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className="w-full h-14 rounded-2xl bg-red-50 text-red-600 font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors shadow-sm active:scale-95 transition-all"
                        >
                            <LogOut className="w-5 h-5" />
                            Log Out Account
                        </button>

                        <div className="text-center pt-4">
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                App Version 2.4.0 (Build 502)
                            </p>
                        </div>
                    </div>
                </PullToRefresh>
            </div>
        </div>
    );
}
