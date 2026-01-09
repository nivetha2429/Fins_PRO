import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    Lock,
    Unlock,
    Trash2,
    Eye,
    Smartphone,
    AlertCircle
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Admin {
    _id: string;
    name: string;
    email: string;
    deviceLimit: number;
}

interface Device {
    _id: string;
    customerName: string;
    imei1: string;
    phoneNumber: string;
    deviceModel: string;
    isLocked: boolean;
    deviceStatus?: {
        status: string;
        lastSeen?: string;
    };
}

interface AdminDevicesDialogProps {
    admin: Admin | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const AdminDevicesDialog = ({ admin, open, onOpenChange }: AdminDevicesDialogProps) => {
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const { toast } = useToast();

    const adminToken = localStorage.getItem('adminToken');

    // Fetch devices when dialog opens
    useEffect(() => {
        if (open && admin) {
            fetchDevices();
        }
    }, [open, admin]);

    const fetchDevices = async () => {
        if (!admin) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/admin/users/${admin._id}/devices`, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                },
            });

            const data = await response.json();

            if (data.success) {
                setDevices(data.devices);
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to fetch devices',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error fetching devices:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch devices',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLockToggle = async (device: Device) => {
        setActionLoading(true);
        const action = device.isLocked ? 'unlock' : 'lock';

        try {
            const response = await fetch(`/api/admin/devices/${device._id}/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`,
                },
                body: JSON.stringify({
                    reason: `${action === 'lock' ? 'Locked' : 'Unlocked'} by Super Admin`
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: 'Success',
                    description: `Device ${action}ed successfully`,
                });

                // Refresh devices list
                fetchDevices();
            } else {
                toast({
                    title: 'Error',
                    description: data.message || `Failed to ${action} device`,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error(`Error ${action}ing device:`, error);
            toast({
                title: 'Error',
                description: `Failed to ${action} device`,
                variant: 'destructive',
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteDevice = async () => {
        if (!selectedDevice) return;

        setActionLoading(true);

        try {
            const response = await fetch(`/api/admin/devices/${selectedDevice._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                },
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: 'Success',
                    description: 'Device removed successfully',
                });

                setDeleteDialogOpen(false);
                setSelectedDevice(null);

                // Refresh devices list
                fetchDevices();
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to remove device',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error removing device:', error);
            toast({
                title: 'Error',
                description: 'Failed to remove device',
                variant: 'destructive',
            });
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'online':
                return 'text-green-600 bg-green-50';
            case 'offline':
                return 'text-slate-600 bg-slate-50';
            case 'error':
                return 'text-red-600 bg-red-50';
            default:
                return 'text-slate-600 bg-slate-50';
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="w-[95%] max-w-xl p-0 overflow-hidden border-none rounded-[40px] shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                    {/* Premium Header */}
                    <div className="bg-slate-900 px-6 pt-8 pb-10 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>

                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                                    <Smartphone className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-black tracking-tight">{admin?.name}'s Fleet</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-80">{admin?.email}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/5">
                                    <p className="text-[8px] font-black uppercase text-slate-400">Total</p>
                                    <p className="text-lg font-black">{devices.length}</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/5">
                                    <p className="text-[8px] font-black uppercase text-slate-400">Active</p>
                                    <p className="text-lg font-black text-emerald-400">{devices.filter(d => !d.isLocked).length}</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/5">
                                    <p className="text-[8px] font-black uppercase text-slate-400">Locked</p>
                                    <p className="text-lg font-black text-rose-400">{devices.filter(d => d.isLocked).length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 min-h-[400px] max-h-[60vh] overflow-y-auto no-scrollbar -mt-6 rounded-t-[40px] relative z-20">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Scanning Network...</p>
                            </div>
                        ) : devices.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center shadow-sm border border-slate-100">
                                    <AlertCircle className="w-10 h-10 text-slate-200" />
                                </div>
                                <div>
                                    <p className="text-base font-black text-slate-900">No active deployments</p>
                                    <p className="text-xs font-medium text-slate-400 mt-1 px-10">This dealer hasn't provisioned any hardware yet.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {devices.map((device) => (
                                    <div key={device._id} className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm space-y-4 relative overflow-hidden group active:scale-[0.98] transition-all">
                                        {/* Status Bar */}
                                        <div className={cn(
                                            "absolute top-0 left-0 w-full h-1",
                                            device.isLocked ? "bg-rose-500" : "bg-emerald-500"
                                        )} />

                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <h4 className="text-base font-black text-slate-900 tracking-tight">{device.customerName}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{device.deviceModel || 'Unidentified Model'}</p>
                                            </div>
                                            <div className={cn(
                                                "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm border",
                                                device.isLocked
                                                    ? "bg-rose-50 text-rose-600 border-rose-100"
                                                    : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                            )}>
                                                {device.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                                {device.isLocked ? 'Locked' : 'Active'}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pb-1">
                                            <div>
                                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">IMEI Signature</p>
                                                <p className="text-[11px] font-mono font-bold text-slate-600">{device.imei1}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Connectivity</p>
                                                <p className="text-[11px] font-bold text-slate-600 truncate">{device.phoneNumber || 'No SIM detected'}</p>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-50 flex items-center gap-2">
                                            <Button
                                                onClick={() => handleLockToggle(device)}
                                                disabled={actionLoading}
                                                className={cn(
                                                    "flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all",
                                                    device.isLocked
                                                        ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-50"
                                                        : "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-50"
                                                )}
                                            >
                                                {device.isLocked ? (
                                                    <><Unlock className="w-4 h-4 mr-2" /> Restore Access</>
                                                ) : (
                                                    <><Lock className="w-4 h-4 mr-2" /> Command Lock</>
                                                )}
                                            </Button>

                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="h-12 w-12 rounded-2xl bg-slate-100/50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                                onClick={() => {
                                                    setSelectedDevice(device);
                                                    setDeleteDialogOpen(true);
                                                }}
                                                disabled={actionLoading}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white px-6 py-5 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Fleet Usage</span>
                            <span className="text-xs font-bold text-slate-900">{devices.length} / {admin?.deviceLimit ?? '0'} Slots</span>
                        </div>
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="h-11 rounded-xl text-slate-400 font-black text-xs uppercase tracking-widest"
                        >
                            Finalize Sync
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            Remove Device?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove <strong>{selectedDevice?.customerName}</strong>'s device?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteDevice}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={actionLoading}
                        >
                            {actionLoading ? 'Removing...' : 'Remove Device'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default AdminDevicesDialog;
