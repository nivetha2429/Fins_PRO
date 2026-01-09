import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDevice } from '@/context/DeviceContext';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, User, Phone, Mail, MapPin, ScanLine, Wifi, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { QRCodeSVG } from 'qrcode.react';
import { getApiUrl } from '@/config/api';
import { Loader2, QrCode, Download, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function AddCustomer() {
    const navigate = useNavigate();
    const { addCustomer } = useDevice();
    const [loading, setLoading] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [newCustomerId, setNewCustomerId] = useState<string | null>(null);
    const [qrData, setQrData] = useState<string>('');
    const [apkName, setApkName] = useState<string>('securefinance-admin-v2.1.2.apk');
    const { customers } = useDevice();

    const adminUserStr = localStorage.getItem('adminUser');
    const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null;
    const isSuperAdmin = adminUser?.role === 'SUPER_ADMIN';
    const deviceLimit = adminUser?.deviceLimit || 0;
    const currentCount = customers?.length || 0;
    const isAtLimit = !isSuperAdmin && deviceLimit > 0 && currentCount >= deviceLimit;

    const [formData, setFormData] = useState({
        name: '',
        phoneNo: '',
        email: '',
        photoUrl: '',
        address: '',
        brand: '',
        modelName: '',
        imei1: '',
        totalAmount: '15000',
        downPayment: '5000',
        emiAmount: '1000',
        emiTenure: '10',
        wifiSsid: '',
        wifiPassword: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // ... validation ...
            if (!formData.name || !formData.phoneNo) {
                toast.error('Name and Phone are required');
                setLoading(false);
                return;
            }

            if (!formData.imei1) {
                toast.error('IMEI 1 is required for device verification');
                setLoading(false);
                return;
            }

            // Get current admin from localStorage
            const adminUserStr = localStorage.getItem('adminUser');
            const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null;
            const dealerId = adminUser?._id;

            const customerId = `CUS-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

            const payload = {
                id: customerId,
                name: formData.name,
                phoneNo: formData.phoneNo,
                email: formData.email,
                address: formData.address,
                imei1: formData.imei1,
                brand: formData.brand,
                modelName: formData.modelName,
                totalAmount: Number(formData.totalAmount),
                downPayment: Number(formData.downPayment),
                emiAmount: Number(formData.emiAmount),
                totalEmis: Number(formData.emiTenure), // Map emiTenure to totalEmis
                emiDate: new Date().getDate(),
                deviceStatus: { status: 'pending' },
                dealerId: dealerId,
                photoUrl: formData.photoUrl
            };

            await addCustomer(payload);
            setNewCustomerId(customerId);

            // Include Wi-Fi credentials for Samsung Knox compatibility
            const wifiParams = formData.wifiSsid
                ? `?wifiSsid=${encodeURIComponent(formData.wifiSsid)}&wifiPassword=${encodeURIComponent(formData.wifiPassword)}`
                : '';
            const qrResponse = await fetch(getApiUrl(`/api/provisioning/payload/${customerId}${wifiParams}`));
            if (qrResponse.ok) {
                const data = await qrResponse.json();
                setQrData(JSON.stringify(data));
                setShowQRModal(true);
                toast.success('🚀 Device Registered! QR Ready.');
            } else {
                toast.success('✅ Device Registered (QR failed, view in Details)');
                navigate('/customers');
            }
        } catch (err: any) {
            // ... catch block ...
            const errorMessage = err?.message || 'Failed to add customer';

            if (errorMessage.includes('limit reached')) {
                toast.error('🚨 Limit Reached: ' + errorMessage);
            } else if (errorMessage.includes('Duplicate')) {
                toast.error('⚠️ Device Already Registered');
            } else {
                toast.error(errorMessage);
            }
            console.error('Add customer error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            <div className="bg-white/80 backdrop-blur-xl sticky top-0 z-30 px-6 pt-12 pb-4 border-b border-slate-100 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="w-10 h-10 -ml-2 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors active:scale-95">
                    <ArrowLeft className="w-5 h-5 text-slate-700" />
                </button>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Provision Device</h1>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 pt-6 pb-24 space-y-6 no-scrollbar">
                {isAtLimit && (
                    <div className="bg-red-50 border border-red-100 rounded-[24px] p-5 flex items-start gap-3 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-red-900">Limit Reached</h3>
                            <p className="text-xs font-medium text-red-700 mt-0.5 leading-relaxed">
                                Used {currentCount}/{deviceLimit} slots. Contact support.
                            </p>
                        </div>
                    </div>
                )}

                {/* Customer Section */}
                <div className="space-y-3">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Customer Profile</p>
                    <div className="flex gap-4">
                        <div className="w-28 shrink-0 aspect-[3/4] bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group hover:border-blue-400 transition-colors">
                            {formData.photoUrl ? (
                                <img src={formData.photoUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                                        <Camera className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Add Photo</span>
                                </div>
                            )}
                            <input
                                name="photoUrl"
                                placeholder="Paste URL"
                                value={formData.photoUrl}
                                onChange={handleChange}
                                className="absolute inset-x-0 bottom-0 h-8 text-[9px] bg-white/90 backdrop-blur text-center border-t border-slate-100 focus:outline-none placeholder:text-slate-400"
                            />
                        </div>

                        <div className="flex-1 space-y-3">
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 group-focus-within:bg-indigo-500 group-focus-within:text-white transition-colors">
                                    <User className="w-4 h-4" />
                                </div>
                                <Input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} className="pl-14 h-14 bg-white border-slate-100 shadow-sm rounded-2xl font-bold text-slate-900 focus-visible:ring-indigo-500/20" />
                            </div>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 group-focus-within:bg-emerald-500 group-focus-within:text-white transition-colors">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <Input name="phoneNo" placeholder="Mobile Number" type="tel" value={formData.phoneNo} onChange={handleChange} className="pl-14 h-14 bg-white border-slate-100 shadow-sm rounded-2xl font-bold text-slate-900 focus-visible:ring-emerald-500/20" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-focus-within:bg-slate-800 group-focus-within:text-white transition-colors">
                                <Mail className="w-4 h-4" />
                            </div>
                            <Input name="email" placeholder="Email Address (Optional)" type="email" value={formData.email} onChange={handleChange} className="pl-14 h-12 bg-white border-slate-100 shadow-sm rounded-2xl font-medium" />
                        </div>
                        <div className="relative group">
                            <div className="absolute left-3 top-3 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-focus-within:bg-slate-800 group-focus-within:text-white transition-colors">
                                <MapPin className="w-4 h-4" />
                            </div>
                            <Textarea
                                name="address"
                                placeholder="Full Address / City"
                                value={formData.address}
                                onChange={handleChange}
                                className="pl-14 min-h-[80px] bg-white border-slate-100 shadow-sm rounded-2xl pt-4 resize-none font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* Device Section - Highlighted */}
                <div className="space-y-3">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Hardware Setup</p>
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[32px] p-1 shadow-lg shadow-indigo-200">
                        <div className="bg-white/95 backdrop-blur-xl rounded-[28px] p-5 space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1">Device Brand</label>
                                <Select onValueChange={(value) => setFormData({ ...formData, brand: value })}>
                                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-0 font-bold text-slate-700">
                                        <SelectValue placeholder="Select Manufacturer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['Samsung', 'Xiaomi', 'Vivo', 'Oppo', 'Realme', 'OnePlus', 'Motorola', 'Apple', 'Other'].map(brand => (
                                            <SelectItem key={brand} value={brand} className="font-medium">{brand}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1">Primary IMEI</label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-focus-within:bg-indigo-600 group-focus-within:text-white transition-colors">
                                        <ScanLine className="w-4 h-4" />
                                    </div>
                                    <Input
                                        name="imei1"
                                        placeholder="Enter 15-digit IMEI"
                                        maxLength={15}
                                        value={formData.imei1}
                                        onChange={handleChange}
                                        className="pl-14 h-12 bg-slate-50 border-0 rounded-xl font-mono font-bold text-slate-800 tracking-widest focus-visible:ring-indigo-500/20"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                    <Wifi className="w-4 h-4 text-blue-600 animate-pulse" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-blue-700">Auto-Detect Enabled</p>
                                    <p className="text-[10px] text-blue-600/80 font-medium leading-tight">Model & Serial will sync automatically upon connection.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Finance Terms */}
                <div className="space-y-3">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Finance Terms</p>
                    <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 pl-1">TOTAL LOAN</label>
                                <Input name="totalAmount" type="number" value={formData.totalAmount} onChange={handleChange} className="h-10 bg-slate-50 border-0 rounded-lg font-bold text-slate-700" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 pl-1">DOWN PAY</label>
                                <Input name="downPayment" type="number" value={formData.downPayment} onChange={handleChange} className="h-10 bg-slate-50 border-0 rounded-lg font-bold text-slate-700" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 pl-1">EMI AMOUNT</label>
                                <Input name="emiAmount" type="number" value={formData.emiAmount} onChange={handleChange} className="h-10 bg-slate-50 border-0 rounded-lg font-bold text-slate-700" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 pl-1">MONTHS</label>
                                <Input name="emiTenure" type="number" value={formData.emiTenure} onChange={handleChange} className="h-10 bg-slate-50 border-0 rounded-lg font-bold text-slate-700" />
                            </div>
                        </div>
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-16 rounded-[24px] text-lg font-black bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-0.5"
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Creating Profile...</span>
                        </div>
                    ) : (
                        <>
                            <span>GENERATE QR CODE</span>
                            <span className="text-[10px] font-normal opacity-60">Provisioning Ready v2.5</span>
                        </>
                    )}
                </Button>
            </form>

            {/* Success QR Modal - Kept consistent but cleaned up */}
            {showQRModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-6 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center animate-bounce">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Ready to Enroll</h2>
                                <p className="text-sm text-slate-500 font-medium">Scan this QR to provision device</p>
                            </div>

                            <div className="p-4 bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50">
                                {qrData ? (
                                    <QRCodeSVG
                                        value={qrData}
                                        size={240}
                                        level="M"
                                        includeMargin={true}
                                        className="rounded-xl"
                                    />
                                ) : (
                                    <div className="w-[180px] h-[180px] flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3 w-full">
                                <Button
                                    onClick={() => navigate('/customers')}
                                    className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200"
                                >
                                    Finish & View Fleet
                                </Button>

                                <Button
                                    variant="ghost"
                                    onClick={() => setShowQRModal(false)}
                                    className="w-full h-12 rounded-2xl text-slate-400 font-bold hover:bg-slate-50"
                                >
                                    Close Window
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
