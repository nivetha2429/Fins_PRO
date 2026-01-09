import React from 'react';
import { CheckCircle, Clock, XCircle, Loader } from 'lucide-react';

interface ProvisioningStage {
    stage: string;
    status: 'pending' | 'in_progress' | 'success' | 'failed';
    message?: string;
    timestamp: string;
}

interface ProvisioningProgressProps {
    stages: ProvisioningStage[];
}

const STAGE_LABELS: Record<string, string> = {
    QR_SCANNED: 'QR Code Scanned',
    DPC_DOWNLOADING: 'Downloading Admin App',
    DPC_INSTALLED: 'Admin App Installed',
    DEVICE_OWNER_SET: 'Device Owner Configured',
    USER_APP_DOWNLOADING: 'Downloading User App',
    USER_APP_INSTALLED: 'User App Installed',
    PERMISSIONS_GRANTED: 'Permissions Granted',
    CONFIG_APPLIED: 'Configuration Applied',
    PROVISIONING_COMPLETE: 'Provisioning Complete'
};

const ALL_STAGES = Object.keys(STAGE_LABELS);

export default function ProvisioningProgress({ stages }: ProvisioningProgressProps) {
    const getStageStatus = (stageName: string) => {
        const stage = stages.find(s => s.stage === stageName);
        return stage?.status || 'pending';
    };

    const getStageIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'in_progress':
                return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
            case 'failed':
                return <XCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Clock className="w-5 h-5 text-gray-400" />;
        }
    };

    const getStageColor = (status: string) => {
        switch (status) {
            case 'success':
                return 'bg-green-50 border-green-200';
            case 'in_progress':
                return 'bg-blue-50 border-blue-200';
            case 'failed':
                return 'bg-red-50 border-red-200';
            default:
                return 'bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Provisioning Progress</h3>
            <div className="space-y-2">
                {ALL_STAGES.map((stageName, index) => {
                    const status = getStageStatus(stageName);
                    const stage = stages.find(s => s.stage === stageName);
                    
                    return (
                        <div
                            key={stageName}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${getStageColor(status)} transition-all`}
                        >
                            <div className="flex-shrink-0">
                                {getStageIcon(status)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                    {STAGE_LABELS[stageName]}
                                </p>
                                {stage?.message && (
                                    <p className="text-xs text-gray-600 mt-1">{stage.message}</p>
                                )}
                                {stage?.timestamp && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        {new Date(stage.timestamp).toLocaleTimeString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
