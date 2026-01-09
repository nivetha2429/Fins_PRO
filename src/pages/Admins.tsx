import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
    Users,
    UserPlus,
    Edit,
    XCircle,
    CheckCircle,
    Eye,
    Shield,
    Power,
    ChevronLeft,
    Search,
    Camera,
    Trash2,
    Plus,
    Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import AdminDevicesDialog from '@/components/AdminDevicesDialog';
import AuditLogsDialog from '@/components/AuditLogsDialog';
import { getApiUrl } from '@/config/api';
import PullToRefresh from 'react-simple-pull-to-refresh';

interface Admin {
    _id: string;
    name: string;
    email: string;
    role: string;
    deviceLimit: number;
    isActive: boolean;
    deviceUsage?: {
        current: number;
        limit: number;
        remaining: number;
        percentage: string;
    };
    customerCount?: number;
    profilePhoto?: string;
}

export default function Admins() {
    const { currentAdmin: user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    // Check if current user is Super Admin
    const adminUserStr = localStorage.getItem('adminUser');
    const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null;
    const isSuperAdmin = adminUser?.role === 'SUPER_ADMIN';
    const adminToken = localStorage.getItem('adminToken');

    // Super Admin State
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // New dialog states
    const [devicesDialogOpen, setDevicesDialogOpen] = useState(false);
    const [auditLogsDialogOpen, setAuditLogsDialogOpen] = useState(false);

    // Create Admin Form
    const [newAdminName, setNewAdminName] = useState('');
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminPhone, setNewAdminPhone] = useState('');
    const [newAdminPasscode, setNewAdminPasscode] = useState('');
    const [newAdminDeviceLimit, setNewAdminDeviceLimit] = useState('100');
    const [newAdminPhoto, setNewAdminPhoto] = useState<string | null>(null);

    // Photo Helper
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewAdminPhoto(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Edit Device Limit
    const [editDeviceLimit, setEditDeviceLimit] = useState('');

    useEffect(() => {
        if (isSuperAdmin) {
            fetchAdmins();
        } else {
            navigate('/');
        }
    }, [isSuperAdmin]);

    const fetchAdmins = async () => {
        try {
            const response = await fetch(getApiUrl('/api/admin/users'), {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                },
            });

            const data = await response.json();

            if (data.success) {
                setAdmins(data.admins);
            }
        } catch (error) {
            console.error('Error fetching admins:', error);
        }
    };

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newAdminName || !newAdminEmail || !newAdminPasscode) {
            toast({
                title: 'Error',
                description: 'Please fill in all required fields',
                variant: 'destructive',
            });
            return;
        }

        if (!/^\d{4}$/.test(newAdminPasscode)) {
            toast({
                title: 'Error',
                description: 'Passcode must be exactly 4 digits',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(getApiUrl('/api/admin/users'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`,
                },
                body: JSON.stringify({
                    name: newAdminName,
                    email: newAdminEmail,
                    phone: newAdminPhone,
                    passcode: newAdminPasscode,
                    deviceLimit: parseInt(newAdminDeviceLimit),
                    profilePhoto: newAdminPhoto
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: 'Success',
                    description: `Admin ${newAdminName} created successfully!`,
                });

                // Reset form
                setNewAdminName('');
                setNewAdminEmail('');
                setNewAdminPhone('');
                setNewAdminPasscode('');
                setNewAdminDeviceLimit('100');
                setNewAdminPhoto(null);
                setCreateDialogOpen(false);

                // Refresh admins list
                fetchAdmins();
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to create admin',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error creating admin:', error);
            toast({
                title: 'Error',
                description: 'Failed to create admin',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateDeviceLimit = async () => {
        if (!selectedAdmin) return;

        const newLimit = parseInt(editDeviceLimit);
        if (isNaN(newLimit) || newLimit < 0) {
            toast({
                title: 'Error',
                description: 'Please enter a valid device limit',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(getApiUrl(`/api/admin/users/${selectedAdmin._id}/limit`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`,
                },
                body: JSON.stringify({ deviceLimit: newLimit }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: 'Success',
                    description: `Device limit updated to ${newLimit}`,
                });

                setEditDialogOpen(false);
                setSelectedAdmin(null);
                fetchAdmins();
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to update device limit',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error updating device limit:', error);
            toast({
                title: 'Error',
                description: 'Failed to update device limit',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (admin: Admin) => {
        setLoading(true);

        try {
            const response = await fetch(getApiUrl(`/api/admin/users/${admin._id}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`,
                },
                body: JSON.stringify({ isActive: !admin.isActive }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: 'Success',
                    description: `Admin ${admin.isActive ? 'deactivated' : 'activated'} successfully`,
                });

                fetchAdmins();
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to update admin status',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error toggling admin status:', error);
            toast({
                title: 'Error',
                description: 'Failed to update admin status',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredAdmins = admins.filter(admin =>
        admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="px-6 pt-12 pb-6 border-b border-slate-100 bg-white sticky top-0 z-30 space-y-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 active:scale-95 transition-all border border-slate-100"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 leading-tight">Admin Management</h1>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-wider uppercase">Monitor and control your dealer network</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search dealers..."
                            className="w-full h-10 pl-10 pr-4 bg-slate-50 rounded-xl text-xs font-bold border border-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-10 px-4 text-xs font-bold gap-2 border-slate-200 hover:bg-white hover:border-slate-300 rounded-xl shadow-sm transition-all active:scale-95 bg-white"
                        onClick={() => setAuditLogsDialogOpen(true)}
                    >
                        <Shield className="w-3.5 h-3.5" />
                        Logs
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-24 no-scrollbar" id="scrollableDiv">
                <PullToRefresh onRefresh={async () => fetchAdmins()}>
                    <div className="space-y-6">
                        {/* Stats Summary Units - Uniform Squares */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center h-40 w-full">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{admins.length}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Total Dealers</p>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center h-40 w-full">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{admins.filter(a => a.isActive).length}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Active Now</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-2 pt-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">All Registered Admins</p>
                            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="h-9 px-4 text-[10px] font-black uppercase tracking-wider gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md transition-all active:scale-95">
                                        <UserPlus className="w-3.5 h-3.5" />
                                        Add Dealer
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Create New Admin</DialogTitle>
                                        <DialogDescription>
                                            Add a new admin account with custom device limit
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleCreateAdmin} className="space-y-6">
                                        {/* Photo Upload Section */}
                                        <div className="flex flex-col items-center gap-4 py-2">
                                            <div className="relative group">
                                                <div className="w-24 h-24 rounded-[32px] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50">
                                                    {newAdminPhoto ? (
                                                        <img src={newAdminPhoto} alt="Preview" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Camera className="w-8 h-8 text-slate-300" />
                                                    )}
                                                </div>
                                                <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center cursor-pointer shadow-lg hover:bg-slate-800 transition-all active:scale-90">
                                                    <Plus className="w-4 h-4" />
                                                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                                                </label>
                                                {newAdminPhoto && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewAdminPhoto(null)}
                                                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-all"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dealer Profile Photo</p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Name *</Label>
                                                <Input
                                                    id="name"
                                                    placeholder="John Doe"
                                                    value={newAdminName}
                                                    onChange={(e) => setNewAdminName(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email *</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="admin@example.com"
                                                    value={newAdminEmail}
                                                    onChange={(e) => setNewAdminEmail(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Phone</Label>
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    placeholder="+91 98765 43210"
                                                    value={newAdminPhone}
                                                    onChange={(e) => setNewAdminPhone(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="passcode">4-Digit Passcode *</Label>
                                                <Input
                                                    id="passcode"
                                                    type="password"
                                                    placeholder="••••"
                                                    maxLength={4}
                                                    value={newAdminPasscode}
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/\D/g, '');
                                                        setNewAdminPasscode(value);
                                                    }}
                                                    required
                                                    className="text-center text-xl font-black tracking-[0.5em]"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="deviceLimit">Device Limit *</Label>
                                                <Input
                                                    id="deviceLimit"
                                                    type="number"
                                                    min="0"
                                                    placeholder="100"
                                                    value={newAdminDeviceLimit}
                                                    onChange={(e) => setNewAdminDeviceLimit(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <Button type="submit" className="w-full h-12 rounded-xl font-black uppercase tracking-wider shadow-lg bg-slate-900 border-none" disabled={loading}>
                                            {loading ? 'Processing...' : 'Register Dealer'}
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Admins Card Grid - Single Column Compact Layout */}
                        <div className="grid grid-cols-1 gap-4">
                            {filteredAdmins.map((admin) => (
                                <div key={admin._id} className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden active:scale-[0.99] flex flex-col h-[250px]">
                                    {/* Status Glow Indicator */}
                                    <div className={cn(
                                        "absolute top-0 left-0 w-full h-1",
                                        admin.isActive ? "bg-emerald-500" : "bg-red-500"
                                    )} />

                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-100 rounded-[16px] flex items-center justify-center text-slate-900 font-black text-lg border border-slate-50 shadow-inner overflow-hidden">
                                                {admin.profilePhoto ? (
                                                    <img src={admin.profilePhoto} alt={admin.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    admin.name[0]
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <h4 className="font-extrabold text-slate-900 leading-tight text-base">{admin.name}</h4>
                                                <p className="text-[11px] font-bold text-slate-400 mt-0.5 tracking-tight uppercase">
                                                    {admin.role.replace('_', ' ')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm border",
                                            admin.isActive
                                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                : "bg-red-50 text-red-600 border-red-100"
                                        )}>
                                            {admin.isActive ? 'Active' : 'Inactive'}
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-4 pt-4 border-t border-slate-50 overflow-hidden">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Connect ID</p>
                                                <p className="text-xs font-extrabold text-slate-600 truncate">{admin.email}</p>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Max Units</p>
                                                <p className="text-sm font-black text-slate-900">
                                                    {admin.role === 'SUPER_ADMIN' ? 'Unlimited' : admin.deviceLimit}
                                                </p>
                                            </div>
                                        </div>

                                        {admin.deviceUsage && (
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between items-center text-[10px] font-black">
                                                    <span className="text-slate-400 uppercase tracking-widest">Enrollment Load</span>
                                                    <span className="text-slate-600">{admin.deviceUsage.percentage}%</span>
                                                </div>
                                                <div className="w-full bg-slate-50 h-1.5 rounded-full shadow-inner overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-700",
                                                            parseFloat(admin.deviceUsage.percentage) > 90 ? "bg-red-500" :
                                                                parseFloat(admin.deviceUsage.percentage) > 70 ? "bg-orange-500" :
                                                                    "bg-blue-600"
                                                        )}
                                                        style={{ width: `${admin.deviceUsage.percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-3 border-t border-slate-50 flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-[2] h-10 text-[11px] font-black uppercase tracking-wider gap-2 hover:bg-slate-50 border-slate-100 rounded-xl"
                                            onClick={() => {
                                                setSelectedAdmin(admin);
                                                setDevicesDialogOpen(true);
                                            }}
                                        >
                                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                                            Fleet Sync
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="h-10 w-10 p-0 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center shrink-0"
                                            onClick={() => {
                                                setSelectedAdmin(admin);
                                                setEditDeviceLimit(admin.deviceLimit.toString());
                                                setEditDialogOpen(true);
                                            }}
                                        >
                                            <Edit className="w-3.5 h-3.5 text-slate-500" />
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className={cn(
                                                "h-10 w-10 p-0 rounded-xl flex items-center justify-center shrink-0 transition-all",
                                                admin.isActive ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"
                                            )}
                                            onClick={() => handleToggleActive(admin)}
                                        >
                                            <Power className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </PullToRefresh>
            </div>

            {/* Edit Device Limit Dialog - Premium Redesign */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="w-[95%] max-w-sm rounded-[40px] p-8 border-none shadow-2xl animate-in zoom-in-95 duration-200">
                    <DialogHeader className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                            <Shield className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle className="text-xl font-black text-slate-900 leading-tight">License Control</DialogTitle>
                            <DialogDescription className="text-xs font-medium text-slate-400">
                                Adjust quota for <span className="text-indigo-600 font-bold">{selectedAdmin?.name}</span>
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <div className="space-y-6 mt-4">
                        <div className="space-y-3">
                            <Label htmlFor="editLimit" className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Device Limit Quota</Label>
                            <div className="relative">
                                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                <Input
                                    id="editLimit"
                                    type="number"
                                    min="0"
                                    value={editDeviceLimit}
                                    onChange={(e) => setEditDeviceLimit(e.target.value)}
                                    className="h-14 pl-12 bg-slate-50 border-0 rounded-2xl font-black text-lg focus-visible:ring-indigo-500/20 shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={handleUpdateDeviceLimit}
                                className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-slate-900 border-none shadow-lg shadow-slate-200 active:scale-95 transition-all"
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : 'Deploy Update'}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setEditDialogOpen(false)}
                                className="w-full h-12 rounded-xl text-slate-400 font-bold text-xs uppercase tracking-widest hover:bg-slate-50"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Admin Devices (Fleet Sync) Dialog */}
            <AdminDevicesDialog
                admin={selectedAdmin}
                open={devicesDialogOpen}
                onOpenChange={setDevicesDialogOpen}
            />

            {/* Audit Logs Dialog - The component itself should handle its UI, but we can pass styles if needed */}
            <AuditLogsDialog
                open={auditLogsDialogOpen}
                onOpenChange={setAuditLogsDialogOpen}
            />
        </div>
    );
}
