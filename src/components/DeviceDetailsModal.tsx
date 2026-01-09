import React, { useState, useEffect } from 'react';
import { X, Smartphone, Lock, Unlock, Trash2, MapPin, Battery, Wifi, Signal, Clock, User, Cpu, HardDrive, Phone, Hash, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL } from '@/config/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface DeviceDetailsProps {
    deviceId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onRefresh?: () => void;
}

interface DeviceData {
    _id: string;
    deviceId: string;
    platform: string;
    state: string;
    brand: string;
    model: string;
    osVersion: string;
    sdkLevel: string;
    serialNumber: string;
    imei1: string;
    imei2: string;
    androidId: string;
    sim1?: { operator: string; iccid: string; phoneNumber: string; isActive: boolean };
    sim2?: { operator: string; iccid: string; phoneNumber: string; isActive: boolean };
    isDualSim: boolean;
    simOperator: string;
    simIccid: string;
    networkType: string;
    networkOperator: string;
    isConnected: boolean;
    batteryLevel: number;
    isCharging: boolean;
    totalStorage: string;
    availableStorage: string;
    lastSeenAt: string;
    lastLocation?: { lat: number; lng: number; accuracy: number; timestamp: string };
    assignedCustomerId: string;
    enrollmentType: string;
    createdAt: string;
    customer?: {
        name: string;
        phoneNo: string;
        photoUrl: string;
        isLocked: boolean;
    };
}

const InfoItem = ({ icon: Icon, label, value, className }: {
    icon?: any;
    label: string;
    value: string | number | undefined | null;
    className?: string;
}) => (
    <div className={cn("flex items-start gap-3 p-3 bg-secondary/30 rounded-lg", className)}>
        {Icon && <Icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />}
        <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-medium text-foreground truncate">{value || '-'}</p>
        </div>
    </div>
);

const stateConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    ACTIVE: { label: 'Active', color: 'text-green-500', bgColor: 'bg-green-500' },
    LOCKED: { label: 'Locked', color: 'text-red-500', bgColor: 'bg-red-500' },
    REMOVED: { label: 'Removed', color: 'text-gray-500', bgColor: 'bg-gray-500' },
    PENDING: { label: 'Pending', color: 'text-yellow-500', bgColor: 'bg-yellow-500' },
    UNASSIGNED: { label: 'Unassigned', color: 'text-blue-500', bgColor: 'bg-blue-500' }
};

export default function DeviceDetailsModal({ deviceId, isOpen, onClose, onRefresh }: DeviceDetailsProps) {
    const [device, setDevice] = useState<DeviceData | null>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (deviceId && isOpen) {
            fetchDevice();
        }
    }, [deviceId, isOpen]);

    const fetchDevice = async () => {
        if (!deviceId) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/devices/${deviceId}`);
            if (res.ok) {
                const data = await res.json();
                setDevice(data);
            } else {
                toast.error('Device not found');
                onClose();
            }
        } catch (err) {
            console.error('Failed to fetch device:', err);
            toast.error('Failed to load device details');
        } finally {
            setLoading(false);
        }
    };

    const handleLock = async () => {
        if (!device) return;
        setActionLoading(true);
        try {
            await fetch(`${API_BASE_URL}/api/devices/${device.deviceId}/lock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Locked by admin' })
            });
            toast.success('Device locked');
            fetchDevice();
            onRefresh?.();
        } catch (err) {
            toast.error('Failed to lock device');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnlock = async () => {
        if (!device) return;
        setActionLoading(true);
        try {
            await fetch(`${API_BASE_URL}/api/devices/${device.deviceId}/unlock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Unlocked by admin' })
            });
            toast.success('Device unlocked');
            fetchDevice();
            onRefresh?.();
        } catch (err) {
            toast.error('Failed to unlock device');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemove = async () => {
        if (!device) return;
        if (!confirm('Remove this device? It will need a new QR to be used again.')) return;

        setActionLoading(true);
        try {
            await fetch(`${API_BASE_URL}/api/devices/${device.deviceId}/remove`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Removed by admin' })
            });
            toast.success('Device removed');
            onClose();
            onRefresh?.();
        } catch (err) {
            toast.error('Failed to remove device');
        } finally {
            setActionLoading(false);
        }
    };

    if (!isOpen) return null;

    const config = device ? (stateConfig[device.state] || stateConfig.PENDING) : stateConfig.PENDING;

    return (
        <>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="absolute inset-x-4 top-[5%] bottom-[5%] md:inset-x-4 md:top-[10%] md:bottom-[10%] bg-card border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in zoom-in-95">
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            config.bgColor + '/20'
                        )}>
                            <Smartphone className={cn("w-5 h-5", config.color)} />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-foreground">Device Details</h2>
                            {device && (
                                <Badge className={cn("text-xs", config.bgColor)}>{config.label}</Badge>
                            )}
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-16 bg-secondary/50 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : device ? (
                        <>
                            {/* Customer Info */}
                            {device.customer && (
                                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center overflow-hidden">
                                            {device.customer.photoUrl ? (
                                                <img src={device.customer.photoUrl} alt={device.customer.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-6 h-6 text-primary" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground">{device.customer.name}</p>
                                            <p className="text-sm text-muted-foreground">{device.customer.phoneNo}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Device Info */}
                            <div>
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Device</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <InfoItem icon={Smartphone} label="Brand" value={device.brand} />
                                    <InfoItem icon={Smartphone} label="Model" value={device.model} />
                                    <InfoItem icon={Cpu} label="Android Version" value={device.osVersion} />
                                    <InfoItem icon={Cpu} label="SDK Level" value={device.sdkLevel} />
                                </div>
                            </div>

                            {/* Identifiers */}
                            <div>
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Identifiers</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    <InfoItem icon={Hash} label="IMEI 1" value={device.imei1} />
                                    <InfoItem icon={Hash} label="IMEI 2" value={device.imei2} />
                                    <InfoItem icon={Hash} label="Android ID" value={device.androidId} />
                                    {device.serialNumber && (
                                        <InfoItem icon={Hash} label="Serial Number" value={device.serialNumber} />
                                    )}
                                </div>
                            </div>

                            {/* SIM Info */}
                            <div>
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                    SIM {device.isDualSim && '(Dual SIM)'}
                                </h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {device.sim1?.operator ? (
                                        <>
                                            <InfoItem icon={Phone} label="SIM 1 Operator" value={device.sim1.operator} />
                                            {device.sim1.phoneNumber && (
                                                <InfoItem icon={Phone} label="SIM 1 Number" value={device.sim1.phoneNumber} />
                                            )}
                                        </>
                                    ) : device.simOperator ? (
                                        <InfoItem icon={Phone} label="Operator" value={device.simOperator} />
                                    ) : (
                                        <InfoItem icon={Phone} label="SIM" value="Not detected" />
                                    )}
                                    {device.sim2?.operator && (
                                        <>
                                            <InfoItem icon={Phone} label="SIM 2 Operator" value={device.sim2.operator} />
                                            {device.sim2.phoneNumber && (
                                                <InfoItem icon={Phone} label="SIM 2 Number" value={device.sim2.phoneNumber} />
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Network & Battery */}
                            <div>
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Status</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <InfoItem
                                        icon={Wifi}
                                        label="Network"
                                        value={device.networkType || (device.isConnected ? 'Connected' : 'Offline')}
                                    />
                                    <InfoItem icon={Signal} label="Operator" value={device.networkOperator} />
                                    <InfoItem
                                        icon={Battery}
                                        label="Battery"
                                        value={device.batteryLevel !== undefined ? `${device.batteryLevel}%${device.isCharging ? ' ⚡' : ''}` : undefined}
                                    />
                                    <InfoItem
                                        icon={Clock}
                                        label="Last Seen"
                                        value={device.lastSeenAt ? format(new Date(device.lastSeenAt), 'MMM d, HH:mm') : undefined}
                                    />
                                </div>
                            </div>

                            {/* Storage */}
                            {(device.totalStorage || device.availableStorage) && (
                                <div>
                                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Storage</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        <InfoItem icon={HardDrive} label="Total" value={device.totalStorage} />
                                        <InfoItem icon={HardDrive} label="Available" value={device.availableStorage} />
                                    </div>
                                </div>
                            )}

                            {/* Location */}
                            {device.lastLocation?.lat && (
                                <div>
                                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Location</h3>
                                    <InfoItem
                                        icon={MapPin}
                                        label="Last Known"
                                        value={`${device.lastLocation.lat.toFixed(6)}, ${device.lastLocation.lng.toFixed(6)}`}
                                    />
                                </div>
                            )}

                            {/* Enrollment Info */}
                            <div>
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Enrollment</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <InfoItem
                                        icon={Calendar}
                                        label="Type"
                                        value={device.enrollmentType?.replace('_', ' ')}
                                    />
                                    <InfoItem
                                        icon={Calendar}
                                        label="Enrolled"
                                        value={device.createdAt ? format(new Date(device.createdAt), 'MMM d, yyyy') : undefined}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <Smartphone className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <p className="text-sm text-muted-foreground">Device not found</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                {device && device.state !== 'REMOVED' && (
                    <div className="p-4 border-t border-border flex gap-2 flex-shrink-0">
                        {device.state === 'LOCKED' ? (
                            <Button
                                className="flex-1 bg-green-500 hover:bg-green-600"
                                onClick={handleUnlock}
                                disabled={actionLoading}
                            >
                                <Unlock className="w-4 h-4 mr-2" />
                                Unlock Device
                            </Button>
                        ) : device.state === 'ACTIVE' && (
                            <Button
                                className="flex-1 bg-red-500 hover:bg-red-600"
                                onClick={handleLock}
                                disabled={actionLoading}
                            >
                                <Lock className="w-4 h-4 mr-2" />
                                Lock Device
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={handleRemove}
                            disabled={actionLoading}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {device.assignedCustomerId || device.customer ? 'Remove' : 'Delete'}
                        </Button>
                    </div>
                )}

                {/* Removed state notice */}
                {device?.state === 'REMOVED' && (
                    <div className="p-4 border-t border-border bg-gray-500/10">
                        <p className="text-sm text-center text-muted-foreground">
                            This device has been removed. Generate a new QR to reuse.
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
