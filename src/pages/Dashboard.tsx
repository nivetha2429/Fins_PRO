import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield,
    Smartphone,
    Lock,
    AlertTriangle,
    Plus,
    CheckCircle2,
    Search,
    Bell,
    TrendingUp,
    Users,
    Menu,
    ArrowLeft,
    Map as MapIcon
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { useDevice } from '@/context/DeviceContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getApiUrl } from '@/config/api';
import PullToRefresh from 'react-simple-pull-to-refresh';
import DeviceMap from '@/components/DeviceMap';

export default function Dashboard() {
    const navigate = useNavigate();
    const { customers } = useDevice();

    // Get admin info
    const adminUserStr = localStorage.getItem('adminUser');
    const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null;
    const isSuperAdmin = adminUser?.role === 'SUPER_ADMIN';
    const deviceLimit = adminUser?.deviceLimit || 0;
    const currentDeviceCount = customers?.length || 0;
    const remainingSlots = deviceLimit - currentDeviceCount;
    const usagePercentage = deviceLimit > 0 ? (currentDeviceCount / deviceLimit * 100) : 0;

    const [totalAdmins, setTotalAdmins] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMapFullScreen, setIsMapFullScreen] = useState(false);
    const adminToken = localStorage.getItem('adminToken');

    const refreshData = async () => {
        if (!adminToken) return;

        try {
            const meRes = await fetch(getApiUrl('/api/admin/me'), {
                headers: { 'Authorization': `Bearer ${adminToken}` },
            });
            const meData = await meRes.json();
            if (meData.success) {
                localStorage.setItem('adminUser', JSON.stringify(meData.user));
            }
        } catch (err) {
            console.error('Profile refresh failed:', err);
        }

        if (isSuperAdmin) {
            try {
                const usersRes = await fetch(getApiUrl('/api/admin/users'), {
                    headers: { 'Authorization': `Bearer ${adminToken}` },
                });
                const usersData = await usersRes.json();
                if (usersData.success) {
                    setTotalAdmins(usersData.admins.length);
                }
            } catch (err) {
                console.error('Error fetching admins:', err);
            }
        }
    };

    useEffect(() => {
        refreshData();
    }, [isSuperAdmin, adminToken]);

    const activeCount = customers?.filter(c => !c.isLocked && c.deviceStatus?.status !== 'removed').length || 0;
    const lockedCount = customers?.filter(c => c.isLocked).length || 0;
    const totalCount = customers?.length || 0;

    const getUsageColor = () => {
        if (usagePercentage >= 90) return 'text-red-600 bg-red-50';
        if (usagePercentage >= 70) return 'text-orange-600 bg-orange-50';
        if (usagePercentage >= 50) return 'text-yellow-600 bg-yellow-50';
        return 'text-green-600 bg-green-50';
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <header className="px-6 pt-12 pb-4 bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-40 space-y-5">
                <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center active:scale-95 transition-all text-slate-500"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="flex flex-col">
                            <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-slate-400 mb-0.5">Welcome Back</p>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                                {isSuperAdmin ? 'Super Admin' : adminUser?.name || 'Admin'}
                            </h1>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black text-emerald-600 bg-emerald-500/10 border border-emerald-500/10 uppercase tracking-wider">
                                    {isSuperAdmin ? `${currentDeviceCount} / Unlimited devices` : `${currentDeviceCount} / ${deviceLimit} devices`}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center relative active:scale-95 transition-all group">
                        <Bell className="w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    </button>
                </div>

                {isSuperAdmin && (
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder=" Search Admin, IMEI, Customer..."
                            className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-100 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && searchQuery.trim()) {
                                    navigate(`/customers?search=${encodeURIComponent(searchQuery.trim())}`);
                                } else if (e.key === 'Enter') {
                                    navigate('/customers');
                                }
                            }}
                        />
                    </div>
                )}
            </header>

            <div className="flex-1 overflow-y-auto px-6 space-y-4 pt-6 pb-24 no-scrollbar" id="scrollableDiv">
                <PullToRefresh onRefresh={async () => refreshData()}>
                    <div className="space-y-6">
                        {isSuperAdmin && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">System Health</p>
                                    <div className="px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600">Live Pulse</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 text-center h-32 w-full">
                                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <Smartphone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-slate-900 leading-none">{totalCount}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total Fleet</p>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 text-center h-32 w-full">
                                        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-slate-900 leading-none">{totalAdmins}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Active Dealers</p>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 text-center h-32 w-full">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-slate-900 leading-none">{activeCount}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Active Units</p>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 text-center h-32 w-full">
                                        <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-slate-900 leading-none">{lockedCount}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Locked Cases</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isSuperAdmin && (
                            <div className="space-y-4">
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Quick Access</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => navigate('/admins')} className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3 active:scale-95 transition-all text-center h-32 w-full group">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <Users className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700">Dealers</span>
                                    </button>
                                    <button onClick={() => navigate('/customers')} className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3 active:scale-95 transition-all text-center h-32 w-full group">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                            <Smartphone className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700">Devices</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {!isSuperAdmin && deviceLimit > 0 && (
                            <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-4">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Device Capacity</p>
                                        <p className="text-xl font-black text-slate-900 leading-none">{currentDeviceCount} / {deviceLimit}</p>
                                    </div>
                                    <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getUsageColor()}`}>
                                        {usagePercentage.toFixed(0)}% Used
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${usagePercentage >= 90 ? 'bg-red-500' : usagePercentage >= 70 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-4">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Recent Activity</h3>
                            <div className="space-y-4">
                                {[1, 2].map((_, i) => (
                                    <div key={i} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent">
                                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", i === 0 ? "bg-blue-50 text-blue-500" : "bg-emerald-50 text-emerald-500")}>
                                            {i === 0 ? <TrendingUp className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <p className="text-xs font-black text-slate-900">{i === 0 ? 'Fleet Sync Active' : 'Security Audit Passed'}</p>
                                                <span className="text-[9px] font-bold text-slate-400">2M AGO</span>
                                            </div>
                                            <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                                                {i === 0 ? 'Synchronizing global dealer network status...' : 'All systems reporting healthy.'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Device Map Section - Backside Layout */}
                        <section className="space-y-4 -mx-6 pt-4 pb-28">
                            <div className="flex items-center justify-between px-7">
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Live Fleet View</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                        <span className="text-[9px] font-black uppercase tracking-wider text-primary/60">Radar Mode Active</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsMapFullScreen(true)}
                                    className="px-4 py-2 bg-white border border-slate-100 rounded-2xl shadow-sm active:scale-95 transition-all text-indigo-600 font-bold flex items-center gap-2"
                                >
                                    <MapIcon className="w-3.5 h-3.5" />
                                    <span className="text-[10px] uppercase tracking-wider">Expand</span>
                                </button>
                            </div>
                            <div className="h-[400px] w-full relative bg-slate-100 border-y border-slate-100 mt-2">
                                <DeviceMap customers={customers || []} />
                                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none z-10" />
                            </div>
                        </section>

                        <div className="text-center pt-2 opacity-50">
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
                                SecurePro v3.0.1
                            </p>
                        </div>
                    </div>
                </PullToRefresh>
            </div>

            {/* Map Full Screen Overlay - Covering everything */}
            {isMapFullScreen && (
                <div className="fixed inset-0 z-[1000] bg-white animate-in slide-in-from-bottom duration-500 flex flex-col">
                    <div className="absolute top-12 left-6 right-6 z-[1001] flex items-center justify-between pointer-events-none">
                        <button
                            onClick={() => setIsMapFullScreen(false)}
                            className="w-12 h-12 rounded-2xl bg-white shadow-xl border border-slate-100 flex items-center justify-center text-slate-900 active:scale-90 transition-all pointer-events-auto"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div className="px-5 py-2.5 bg-slate-900/95 backdrop-blur-xl rounded-2xl text-white shadow-xl flex items-center gap-3 pointer-events-auto">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[11px] font-black tracking-[0.2em] uppercase">Fleet Radar</span>
                        </div>
                    </div>
                    <div className="flex-1 h-full w-full">
                        <DeviceMap customers={customers || []} />
                    </div>
                    <div className="absolute bottom-[100px] left-6 right-6 z-[1001] pointer-events-none">
                        <div className="bg-white/95 backdrop-blur-xl p-4 rounded-3xl border border-slate-100 shadow-2xl flex items-center justify-between px-6">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest leading-none">{activeCount} Active</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white shadow-sm" />
                                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest leading-none">{lockedCount} Locked</span>
                                </div>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-50">v3.0.1</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
