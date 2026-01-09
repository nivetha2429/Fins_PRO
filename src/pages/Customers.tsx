import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDevice } from '@/context/DeviceContext';
import { ArrowLeft, Search, Filter, MoreHorizontal, Smartphone, Lock, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import PullToRefresh from 'react-simple-pull-to-refresh';

export default function Customers() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { customers, refreshCustomers } = useDevice();
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [filter, setFilter] = useState<'all' | 'active' | 'locked'>((searchParams.get('filter') as any) || 'all');

    const adminUserStr = localStorage.getItem('adminUser');
    const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null;
    const isSuperAdmin = adminUser?.role === 'SUPER_ADMIN';

    useEffect(() => {
        refreshCustomers?.();
        // If we have a filter or search in URL, ensure we update local state if they change
        const urlSearch = searchParams.get('search');
        if (urlSearch && urlSearch !== search) {
            setSearch(urlSearch);
        }
    }, [searchParams]);

    const filtered = (customers || []).filter(c => {
        const matchesSearch = c.name?.toLowerCase().includes(search.toLowerCase()) ||
            c.phoneNo?.includes(search) ||
            c.imei1?.includes(search);
        if (filter === 'all') return matchesSearch;
        if (filter === 'active') return matchesSearch && !c.isLocked;
        if (filter === 'locked') return matchesSearch && c.isLocked;
        return matchesSearch;
    });

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md sticky top-0 z-30 px-6 pt-12 pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 -ml-2 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-700" />
                    </button>
                    <h1 className="text-lg font-bold text-slate-900">Device Fleet</h1>
                    <div className="w-10 h-10"></div> {/* Spacer */}
                </div>

                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search fleet..."
                            className="pl-10 h-[42px] bg-slate-100/50 border-transparent focus:bg-white focus:border-primary/20 rounded-xl text-sm font-medium"
                        />
                    </div>
                    <button className="w-[42px] h-[42px] bg-slate-100/50 rounded-xl flex items-center justify-center text-slate-500 hover:text-primary transition-colors">
                        <Filter className="w-4 h-4" />
                    </button>
                </div>

                {/* Quick Filters */}
                <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-1">
                    {[
                        { id: 'all', label: 'All Units' },
                        { id: 'active', label: 'Active' },
                        { id: 'locked', label: 'Locked' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id as any)}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border",
                                filter === f.id
                                    ? "bg-slate-900 text-white border-slate-900"
                                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 pt-4 space-y-3 pb-24 no-scrollbar" id="scrollableDiv">
                <PullToRefresh onRefresh={async () => refreshCustomers?.()}>
                    <>
                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <Search className="w-6 h-6 text-slate-300" />
                                </div>
                                <p className="text-sm font-bold text-slate-400">No devices found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-24">
                                {filtered.map((c: any) => (
                                    <div
                                        key={c.id}
                                        onClick={() => navigate(`/customers/${c.id}`)}
                                        className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 active:scale-[0.99] transition-all hover:shadow-md cursor-pointer group"
                                    >
                                        {/* Header: Name + Badge */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black uppercase transition-colors",
                                                    c.isLocked ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                                                )}>
                                                    {c.name?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-slate-900 leading-tight">{c.name}</h3>
                                                    <p className="text-xs font-medium text-slate-400 mt-0.5">{c.phoneNo}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        refreshCustomers?.();
                                                        toast.success('Refreshing device status...');
                                                    }}
                                                    className="p-1.5 rounded-full bg-slate-50 text-slate-400 hover:bg-white hover:text-primary hover:shadow-sm border border-transparent hover:border-slate-100 transition-all"
                                                    title="Refresh Device Data"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                </button>
                                                <div className={cn(
                                                    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                                                    c.isLocked
                                                        ? "bg-red-50 text-red-600 border-red-100"
                                                        : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                )}>
                                                    {c.isLocked ? 'Locked' : 'Active'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Admin Badge for Super Admin */}
                                        {isSuperAdmin && c.dealerId && (
                                            <div className="mb-3 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Admin:</span>
                                                <span className="text-xs font-bold text-slate-700">{c.dealerId.name}</span>
                                            </div>
                                        )}

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Device</p>
                                                <p className="text-xs font-bold text-slate-700 truncate">
                                                    {c.deviceName || (c.brand && c.modelName ? `${c.brand} ${c.modelName}` : c.brand || c.modelName || 'Unknown')}
                                                </p>
                                                <p className="text-[10px] text-slate-400 truncate">
                                                    Android {c.deviceStatus?.technical?.osVersion || 'N/A'} • {c.deviceStatus?.technical?.totalMemory || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">IMEI</p>
                                                <p className="text-xs font-mono font-bold text-slate-600 truncate">
                                                    {c.imei1 || c.deviceStatus?.technical?.imei1 || 'N/A'}
                                                </p>
                                                <p className="text-[10px] text-slate-400 truncate">
                                                    {c.simDetails?.operator || c.simStatus?.operator || 'No SIM'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Footer: Location & Time */}
                                        <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 overflow-hidden">
                                                {c.deviceStatus?.lastLocation ? (
                                                    <>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                                        <span className="text-[10px] font-bold text-slate-500 truncate">
                                                            {c.deviceStatus.lastLocation.latitude?.toFixed(4)}, {c.deviceStatus.lastLocation.longitude?.toFixed(4)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 italic">No GPS</span>
                                                )}
                                            </div>
                                            <div className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                                                {c.deviceStatus?.lastSeen ? new Date(c.deviceStatus.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                </PullToRefresh>
            </div>
        </div>
    );
}
