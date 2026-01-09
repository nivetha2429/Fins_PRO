import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Shield,
    Lock,
    Unlock,
    UserPlus,
    UserMinus,
    Edit,
    Trash2,
    AlertCircle,
    CheckCircle,
    Clock,
    ChevronLeft
} from 'lucide-react';

interface AuditLog {
    id: string;
    actor: {
        name: string;
        email: string;
        role: string;
    };
    action: string;
    target: {
        type: string;
        name: string;
    };
    details: any;
    timestamp: string;
    status: string;
}

interface AuditLogsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const AuditLogsDialog = ({ open, onOpenChange }: AuditLogsDialogProps) => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<string>('all');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const { toast } = useToast();

    const adminToken = localStorage.getItem('adminToken');
    const limit = 50;

    useEffect(() => {
        if (open) {
            fetchLogs();
        }
    }, [open, filter, page]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: limit.toString(),
                skip: (page * limit).toString(),
            });

            if (filter !== 'all') {
                params.append('action', filter);
            }

            const response = await fetch(`/api/admin/audit-logs?${params}`, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                },
            });

            const data = await response.json();

            if (data.success) {
                setLogs(data.logs);
                setHasMore(data.pagination.hasMore);
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to fetch audit logs',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch audit logs',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'CREATE_ADMIN':
                return <UserPlus className="h-4 w-4 text-blue-600" />;
            case 'UPDATE_ADMIN_LIMIT':
                return <Edit className="h-4 w-4 text-orange-600" />;
            case 'DISABLE_ADMIN':
            case 'DELETE_ADMIN':
                return <UserMinus className="h-4 w-4 text-red-600" />;
            case 'ENABLE_ADMIN':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'LOCK_DEVICE':
                return <Lock className="h-4 w-4 text-red-600" />;
            case 'UNLOCK_DEVICE':
                return <Unlock className="h-4 w-4 text-green-600" />;
            case 'DELETE_CUSTOMER':
                return <Trash2 className="h-4 w-4 text-red-600" />;
            default:
                return <AlertCircle className="h-4 w-4 text-slate-600" />;
        }
    };

    const formatAction = (action: string) => {
        return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95%] max-w-2xl p-0 overflow-hidden border-none rounded-[40px] shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-slate-900 px-6 pt-8 pb-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>

                    <div className="relative z-10 flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-indigo-400" />
                                <h2 className="text-xl font-black tracking-tight text-white">Security Registry</h2>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-80">Full audit trail & sync history</p>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => fetchLogs()}
                            disabled={loading}
                            className="bg-white/5 border-white/10 rounded-2xl hover:bg-white/10"
                        >
                            <Clock className="w-5 h-5 text-white" />
                        </Button>
                    </div>

                    {/* Quick Filter */}
                    <div className="mt-6 relative z-10">
                        <Select value={filter} onValueChange={(value) => { setFilter(value); setPage(0); }}>
                            <SelectTrigger className="h-12 bg-white/10 border-white/10 text-white rounded-2xl backdrop-blur-md focus:ring-indigo-500/20">
                                <SelectValue placeholder="All Activities" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                <SelectItem value="all">Total Activity</SelectItem>
                                <SelectItem value="CREATE_ADMIN">Enrollments</SelectItem>
                                <SelectItem value="UPDATE_ADMIN_LIMIT">License Edits</SelectItem>
                                <SelectItem value="LOCK_DEVICE">Security Locks</SelectItem>
                                <SelectItem value="UNLOCK_DEVICE">Restorations</SelectItem>
                                <SelectItem value="DELETE_CUSTOMER">Deletions</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 min-h-[400px] max-h-[60vh] overflow-y-auto no-scrollbar -mt-6 rounded-t-[40px] relative z-20">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Decrypting Logs...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center shadow-sm border border-slate-100">
                                <Shield className="w-10 h-10 text-slate-200" />
                            </div>
                            <div>
                                <p className="text-base font-black text-slate-900">End of records</p>
                                <p className="text-xs font-medium text-slate-400 mt-1">No activity found for this filter.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {logs.map((log) => (
                                <div key={log.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3 relative overflow-hidden hover:shadow-md transition-all active:scale-[0.99]">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 shadow-inner">
                                                {getActionIcon(log.action)}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">{formatAction(log.action)}</h4>
                                                <p className="text-[10px] font-bold text-slate-400">{formatTimestamp(log.timestamp)}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-black text-indigo-600">{log.actor.name}</span>
                                            <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{log.actor.role.replace('_', ' ')}</span>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50/50 p-3 rounded-2xl flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Target</span>
                                            <span className="text-[10px] font-extrabold text-slate-600">{log.target.name}</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100/50">
                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Analysis</span>
                                            <span className="text-[10px] font-bold text-slate-500 truncate max-w-[150px]">
                                                {log.details.oldValue !== undefined && log.details.newValue !== undefined
                                                    ? `${log.details.oldValue} → ${log.details.newValue}`
                                                    : log.details.reason || 'Routine sync completed'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Navigation */}
                <div className="bg-white px-6 py-5 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 w-10 p-0 rounded-xl hover:bg-slate-50"
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0 || loading}
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-400" />
                        </Button>
                        <span className="text-xs font-black text-slate-900">{page + 1}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 w-10 p-0 rounded-xl hover:bg-slate-50 rotate-180"
                            onClick={() => setPage(p => p + 1)}
                            disabled={!hasMore || loading}
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-400" />
                        </Button>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="h-11 px-6 rounded-xl text-slate-400 font-black text-xs uppercase tracking-widest"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AuditLogsDialog;
