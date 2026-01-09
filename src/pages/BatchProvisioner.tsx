import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDevice } from '@/context/DeviceContext';
import {
    ArrowLeft,
    ScanLine,
    ShieldCheck,
    History,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    Volume2,
    Settings as SettingsIcon,
    Smartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getApiUrl } from '@/config/api';
import { QRCodeSVG } from 'qrcode.react';

export default function BatchProvisioner() {
    const navigate = useNavigate();
    const { addCustomer } = useDevice();
    const [imei, setImei] = useState('');
    const [loading, setLoading] = useState(false);
    const [batchHistory, setBatchHistory] = useState<any[]>([]);
    const [showQR, setShowQR] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Default Batch Settings
    const [batchSettings, setBatchSettings] = useState({
        brand: 'Samsung',
        emiAmount: '1000',
        emiTenure: '12',
        downPayment: '5000',
        totalAmount: '17000'
    });

    const [showSettings, setShowSettings] = useState(false);

    // Keep focus on input for scanner
    useEffect(() => {
        if (!showQR && !showSettings) {
            inputRef.current?.focus();
        }
    }, [showQR, showSettings]);

    const playSuccess = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => { });
    };

    const playError = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        audio.play().catch(() => { });
    };

    const handleProvision = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (loading) return;
        if (imei.length < 14) {
            toast.error('Invalid IMEI Length');
            return;
        }

        setLoading(true);
        try {
            const adminUserStr = localStorage.getItem('adminUser');
            const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null;

            const customerId = `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

            const payload = {
                id: customerId,
                name: `Batch Device ${imei.slice(-4)}`,
                phoneNo: '0000000000', // Placeholder for batch
                imei1: imei,
                brand: batchSettings.brand,
                modelName: 'Batch Unit',
                totalAmount: Number(batchSettings.totalAmount),
                downPayment: Number(batchSettings.downPayment),
                emiAmount: Number(batchSettings.emiAmount),
                totalEmis: Number(batchSettings.emiTenure),
                emiDate: 1,
                dealerId: adminUser?._id,
                deviceStatus: { status: 'pending' }
            };

            await addCustomer(payload);

            // Get QR Data
            const qrResponse = await fetch(getApiUrl(`/api/provisioning/payload/${customerId}`));
            const qrData = await qrResponse.json();

            playSuccess();
            setBatchHistory([{ imei, status: 'success', time: new Date() }, ...batchHistory]);
            setShowQR(JSON.stringify(qrData));
            toast.success(`Success: ${imei}`);
            setImei('');
        } catch (err: any) {
            playError();
            setBatchHistory([{ imei, status: 'error', error: err.message, time: new Date() }, ...batchHistory]);
            toast.error(err.message || 'Provisioning Failed');
            setImei('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50/50 text-slate-900 overflow-hidden">
            {/* Premium Mobile Header - Compact */}
            <header className="px-6 pt-10 pb-4 bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center active:scale-95 transition-all text-slate-600">
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                            <p className="text-[9px] uppercase font-black tracking-widest text-slate-400 leading-none mb-1">Warehouse</p>
                            <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">Batch Mode</h1>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showSettings ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                        <SettingsIcon className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar pb-[100px]">

                {/* Scanner Section */}
                <div className="p-6 flex flex-col items-center space-y-6 bg-white/60 backdrop-blur-sm border-b border-slate-100">

                    {!showSettings ? (
                        <>
                            <div className="relative mt-2">
                                <div className="w-20 h-20 rounded-[28px] bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-indigo-600">
                                    <ScanLine className="w-8 h-8 animate-pulse" />
                                </div>
                                <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
                                    <div className="w-1 h-1 bg-white rounded-full animate-ping" />
                                </div>
                            </div>

                            <div className="w-full text-center space-y-1">
                                <h2 className="text-xl font-black text-slate-900">Scan IMEI</h2>
                                <p className="text-slate-500 text-[11px] font-bold px-4 leading-normal opacity-70">
                                    Barcode detection is automated. Target the IMEI sticker to begin.
                                </p>

                                <form onSubmit={handleProvision} className="relative group mt-6">
                                    <Input
                                        ref={inputRef}
                                        value={imei}
                                        onChange={(e) => setImei(e.target.value)}
                                        placeholder="00000000000000"
                                        className="h-16 bg-white border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-[24px] text-center text-2xl font-mono font-black tracking-[0.2em] transition-all placeholder:text-slate-200 shadow-xl shadow-indigo-100/10"
                                        autoFocus
                                        onBlur={() => !showQR && !showSettings && inputRef.current?.focus()}
                                    />
                                    {loading && (
                                        <div className="absolute inset-0 bg-white/80 rounded-[24px] flex items-center justify-center backdrop-blur-sm">
                                            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                                        </div>
                                    )}
                                </form>
                            </div>

                            {/* Active Config - Tiny Chips */}
                            <div className="flex gap-2 overflow-x-auto no-scrollbar w-full justify-center">
                                {[
                                    { label: 'Br', value: batchSettings.brand },
                                    { label: '₹', value: batchSettings.emiAmount },
                                    { label: 'Dur', value: `${batchSettings.emiTenure}M` }
                                ].map((item, i) => (
                                    <div key={i} className="px-3 py-2 bg-white rounded-xl border border-slate-100 flex items-center gap-2 shadow-sm whitespace-nowrap">
                                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter">{item.label}</span>
                                        <span className="text-[10px] font-black text-slate-700">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        /* Settings Section - Mobile Optimized */
                        <div className="w-full space-y-6 animate-in slide-in-from-top-4 duration-300 py-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                    <SettingsIcon className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-900 leading-none">Settings</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Default Terms</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Device Brand</label>
                                    <Input
                                        value={batchSettings.brand}
                                        onChange={(e) => setBatchSettings({ ...batchSettings, brand: e.target.value })}
                                        className="bg-white border-slate-100 h-12 rounded-xl text-slate-900 font-bold px-4 transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">EMI Amount</label>
                                    <Input
                                        type="number"
                                        value={batchSettings.emiAmount}
                                        onChange={(e) => setBatchSettings({ ...batchSettings, emiAmount: e.target.value })}
                                        className="bg-white border-slate-100 h-12 rounded-xl text-slate-900 font-bold px-4 transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Tenure (M)</label>
                                    <Input
                                        type="number"
                                        value={batchSettings.emiTenure}
                                        onChange={(e) => setBatchSettings({ ...batchSettings, emiTenure: e.target.value })}
                                        className="bg-white border-slate-100 h-12 rounded-xl text-slate-900 font-bold px-4 transition-all"
                                    />
                                </div>
                            </div>
                            <Button
                                onClick={() => setShowSettings(false)}
                                className="w-full h-14 bg-slate-900 text-white font-black rounded-xl text-sm tracking-widest uppercase active:scale-95 transition-all shadow-lg"
                            >
                                Apply Changes
                            </Button>
                        </div>
                    )}
                </div>

                {/* Scan Activity - List */}
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recent Activity</h3>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[9px] font-black text-slate-500">
                            V3.0.1
                        </span>
                    </div>

                    <div className="space-y-2">
                        {batchHistory.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-center opacity-20">
                                <History className="w-10 h-10 mb-2 text-slate-400" />
                                <p className="text-[9px] font-black uppercase tracking-[0.2em]">Scanner Idle</p>
                            </div>
                        ) : (
                            batchHistory.map((item, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "p-3 rounded-2xl border flex items-center justify-between transition-all animate-in slide-in-from-bottom-2",
                                        item.status === 'success'
                                            ? 'bg-white border-slate-100 shadow-sm'
                                            : 'bg-red-50 border-red-100'
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-9 h-9 rounded-xl flex items-center justify-center",
                                            item.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-100 text-red-600'
                                        )}>
                                            {item.status === 'success' ? (
                                                <CheckCircle2 className="w-4 h-4" />
                                            ) : (
                                                <AlertTriangle className="w-4 h-4" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-800 tracking-tight font-mono">{item.imei.slice(-8)}</p>
                                            <p className="text-[8px] text-slate-400 font-bold uppercase">
                                                {item.status === 'success' ? 'Provisioned' : 'Failed'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-[8px] font-black text-slate-300 mr-1">
                                        {item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Premium QR Popup - High Focus */}
            {showQR && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] p-8 w-full max-w-[340px] shadow-2xl flex flex-col items-center text-slate-900 animate-in zoom-in-95 duration-300">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                            <Smartphone className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-black tracking-tight mb-1 font-sans">Enroll Now</h2>
                        <p className="text-[11px] font-bold text-slate-400 mb-6 uppercase tracking-wider">Point Device Camera Here</p>

                        <div className="p-4 bg-white rounded-[32px] shadow-xl border border-slate-50 mb-8 ratio-square">
                            <QRCodeSVG value={showQR} size={200} level="M" />
                        </div>

                        <Button
                            onClick={() => setShowQR(null)}
                            className="w-full h-14 bg-indigo-600 text-white font-black rounded-2xl text-sm tracking-widest uppercase active:scale-95 transition-all shadow-xl shadow-indigo-100"
                        >
                            Next Scan
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
