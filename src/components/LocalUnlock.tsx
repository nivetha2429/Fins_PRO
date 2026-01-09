import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Shield, Fingerprint, LogOut, Loader2, Delete } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

export default function LocalUnlock() {
    const { currentAdmin, unlockApp, logout } = useAuth();
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [shake, setShake] = useState(false);

    const expectedLength = currentAdmin?.pin?.length || 6;

    const handleNumberClick = (num: string) => {
        if (pin.length < expectedLength) {
            setPin(prev => prev + num);
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
    };

    useEffect(() => {
        if (pin.length === expectedLength) {
            handleUnlock();
        }
    }, [pin, expectedLength]);

    const handleUnlock = async () => {
        setLoading(true);
        // Simulate a tiny delay for that premium "thinking" feel
        await new Promise(resolve => setTimeout(resolve, 300));

        const success = unlockApp(pin);
        if (success) {
            toast.success(`Welcome back, ${currentAdmin?.username}`);
        } else {
            setShake(true);
            setPin('');
            toast.error('Invalid Passcode');
            setTimeout(() => setShake(false), 500);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-between p-8 pt-24 pb-12 animate-in fade-in zoom-in duration-500">
            {/* Header */}
            <div className={`flex flex-col items-center space-y-4 w-full ${shake ? 'animate-shake' : ''}`}>
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary shadow-xl shadow-primary/5">
                    <Shield size={40} className="stroke-[1.5px]" />
                </div>
                <div className="text-center">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Unlock SecurePro</h1>
                    <p className="text-sm font-semibold text-slate-400 mt-1 uppercase tracking-widest flex items-center justify-center gap-2">
                        ID: {currentAdmin?.username}
                    </p>
                </div>

                {/* PIN Indicator Slots */}
                <div className="flex gap-4 pt-4">
                    {[...Array(expectedLength)].map((_, i) => (
                        <div
                            key={i}
                            className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${i < pin.length
                                ? 'bg-primary border-primary scale-110'
                                : 'border-slate-200'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Keypad */}
            <div className="w-full max-w-[280px] grid grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button
                        key={num}
                        onClick={() => handleNumberClick(num.toString())}
                        className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-xl font-bold text-slate-700 active:bg-primary active:text-white active:scale-95 transition-all duration-150"
                    >
                        {num}
                    </button>
                ))}
                <button
                    onClick={() => toast.info('Biometric unlock initialized')}
                    className="w-16 h-16 rounded-full flex items-center justify-center text-primary active:scale-90 transition-transform"
                >
                    <Fingerprint size={32} />
                </button>
                <button
                    onClick={() => handleNumberClick('0')}
                    className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-xl font-bold text-slate-700 active:bg-primary active:text-white active:scale-95 transition-all duration-150"
                >
                    0
                </button>
                <button
                    onClick={handleDelete}
                    className="w-16 h-16 rounded-full flex items-center justify-center text-slate-400 active:scale-90 transition-transform"
                >
                    <Delete size={28} />
                </button>
            </div>

            {/* Footer */}
            <button
                onClick={logout}
                className="flex items-center gap-2 text-slate-400 font-bold text-sm tracking-wide uppercase hover:text-red-500 transition-colors"
            >
                <LogOut size={16} />
                Sign Out / Exit
            </button>

            {/* Custom Shake Animation */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-8px); }
                    75% { transform: translateX(8px); }
                }
                .animate-shake {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
            `}} />
        </div>
    );
}
