import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield } from 'lucide-react';
import { getApiUrl } from '@/config/api';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [passcode, setPasscode] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !passcode) {
            toast({
                title: 'Error',
                description: 'Please enter email and passcode',
                variant: 'destructive',
            });
            return;
        }

        if (!/^\d{4}$/.test(passcode)) {
            toast({
                title: 'Error',
                description: 'Passcode must be exactly 4 digits',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        try {
            // Use getApiUrl to work with Capacitor apps
            const response = await fetch(getApiUrl('/api/admin/login'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, passcode }),
            });

            const data = await response.json();

            if (data.success) {
                // Store token and user data
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

                toast({
                    title: 'Success',
                    description: `Welcome ${data.user.name}!`,
                });

                // Redirect based on role
                setTimeout(() => {
                    window.location.href = '/';
                }, 500);
            } else {
                toast({
                    title: 'Login Failed',
                    description: data.message || 'Invalid credentials',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Login error:', error);
            toast({
                title: 'Error',
                description: 'Failed to connect to server. Please check if backend is running.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <Shield className="h-12 w-12 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
                    <CardDescription>
                        Enter your credentials to access the admin dashboard
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@emilock.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="passcode">4-Digit Passcode</Label>
                            <Input
                                id="passcode"
                                type="password"
                                placeholder="••••"
                                maxLength={4}
                                value={passcode}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '');
                                    setPasscode(value);
                                }}
                                required
                                autoComplete="off"
                                className="text-center text-2xl tracking-widest"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminLogin;
