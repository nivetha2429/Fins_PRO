import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getApiUrl } from '@/config/api';

export default function Login() {
    const [email, setEmail] = useState('');
    const [passcode, setPasscode] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !passcode) {
            toast.error('Please enter email and passcode');
            return;
        }

        if (!/^\d{4,6}$/.test(passcode)) {
            toast.error('Passcode must be between 4 and 6 digits');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(getApiUrl('/api/admin/login'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, passcode }),
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminUser', JSON.stringify(data.user));

                // Set persistent auth for AuthContext
                localStorage.setItem('isAdminAuthenticated', 'true');
                localStorage.setItem('currentAdmin', JSON.stringify({
                    id: data.user._id,
                    username: data.user.name,
                    pin: passcode,
                    isActivated: true,
                    isLocked: false,
                    customerCount: 0,
                    createdAt: data.user.createdAt || new Date().toISOString()
                }));

                toast.success(`Welcome ${data.user.name}!`);

                // Force a clean reload to ensure Context reads the new localStorage
                setTimeout(() => {
                    window.location.href = '/';
                }, 500);
            } else {
                toast.error(data.message || 'Invalid credentials');
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-[300px] bg-primary/5 rounded-b-[40%] blur-3xl -z-10"></div>

            <div className="w-full max-w-sm space-y-8 animate-in slide-in-from-bottom-5 duration-700">

                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-white rounded-[24px] shadow-2xl shadow-primary/20 mx-auto flex items-center justify-center border border-white/50">
                        <Shield className="w-10 h-10 text-primary fill-primary/20" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">SecurePRO Cloud</h1>
                        <p className="text-sm font-medium text-slate-400">Enterprise Device Management</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 bg-white/60 backdrop-blur-md p-8 rounded-[32px] border border-white/60 shadow-xl shadow-slate-200/50">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-3">Email</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-11 h-12 bg-white border-slate-200 rounded-2xl focus:ring-primary/20 transition-all font-semibold"
                                    placeholder="admin@emilock.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-3">Passcode</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    type="password"
                                    value={passcode}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        setPasscode(value);
                                    }}
                                    maxLength={6}
                                    className="pl-11 h-12 bg-white border-slate-200 rounded-2xl focus:ring-primary/20 transition-all font-semibold text-center text-2xl tracking-widest"
                                    placeholder="••••"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        disabled={loading}
                        type="submit"
                        className="w-full h-12 rounded-2xl text-md font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 mt-6 group"
                    >
                        {loading ? 'Authenticating...' : (
                            <span className="flex items-center gap-2">
                                Secure Login <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                        )}
                    </Button>
                </form>

                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-60">
                    Version 2.0 • Build 2402
                </p>
            </div>
        </div>
    );
}
