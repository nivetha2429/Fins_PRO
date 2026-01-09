import React from 'react';
import { getProvisioningQRData } from '@/utils/provisioning';
import { Link } from 'react-router-dom';
import { Customer } from '@/types/customer';
import { useDevice } from '@/context/DeviceContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Lock,
  Unlock,
  MapPin,
  Phone,
  CreditCard,
  Smartphone,
  User,
  Calendar,
  Hash,
  Building,
  History,
  QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface CustomerDetailsModalProps {
  customer: Customer | null;
  open: boolean;
  onClose: () => void;
  onLockToggle: (id: string) => void;
  onCollectEmi: (id: string) => void;
}

export const CustomerDetailsModal = ({
  customer,
  open,
  onClose,
  onLockToggle,
  onCollectEmi
}: CustomerDetailsModalProps) => {
  const { sendRemoteCommand } = useDevice();
  const [qrData, setQrData] = React.useState<string>('');
  const [qrLoading, setQrLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchQR = async () => {
      if (customer && open) {
        setQrLoading(true);
        try {
          const data = await getProvisioningQRData(customer);
          setQrData(data);
        } catch (error) {
          console.error("Failed to generate QR", error);
        } finally {
          setQrLoading(false);
        }
      }
    };
    fetchQR();
  }, [customer, open]);

  if (!customer) return null;

  const remainingEmis = (customer.totalEmis || 0) - (customer.paidEmis || 0);
  const progress = customer.totalEmis ? ((customer.paidEmis || 0) / customer.totalEmis) * 100 : 0;

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="font-medium text-foreground">{value || '-'}</p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95%] max-w-[400px] bg-card border-border max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl",
                customer.isLocked
                  ? "bg-destructive/20 text-destructive"
                  : "bg-primary/20 text-primary"
              )}>
                {customer.name?.charAt(0) || '?'}
              </div>
              <div>
                <DialogTitle className="text-xl mb-1">{customer.name || 'Unknown'}</DialogTitle>
                <Badge
                  className={cn(
                    "px-3 py-1",
                    customer.isLocked ? "status-locked" : "status-unlocked"
                  )}
                >
                  {customer.isLocked ? 'Device Locked' : 'Device Active'}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 mt-6">
          {/* Personal Info */}
          <div className="glass-card p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Personal Information
            </h3>

            <div className="flex gap-4 mb-4">
              {customer.photoUrl ? (
                <div className="w-24 h-24 rounded-lg overflow-hidden border border-border flex-shrink-0">
                  <img src={customer.photoUrl} alt={customer.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <InfoRow icon={Phone} label="Phone Number" value={customer.phoneNo} />
                <InfoRow icon={Hash} label="Aadhar" value={customer.aadharNo} />
              </div>
            </div>
            <InfoRow icon={MapPin} label="Address" value={customer.address} />

            {/* Documents */}
            {customer.documents && customer.documents.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-2">Documents</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {customer.documents.map((doc, i) => (
                    <div key={i} className="w-20 h-14 rounded bg-black/5 flex-shrink-0 overflow-hidden border border-border">
                      <img src={doc} alt={`Doc ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Device Info (Manual) */}
          <div className="glass-card p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-primary" />
              Initial Registration Info
            </h3>
            <InfoRow icon={Smartphone} label="Device Name" value={customer.mobileModel} />
            <InfoRow icon={Hash} label="IMEI 1" value={customer.imei1} />
            <InfoRow icon={Hash} label="IMEI 2" value={customer.imei2 || 'Not Provided'} />
          </div>

          {/* SIM Details */}
          {customer.simDetails && (
            <div className="glass-card p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary" />
                SIM Card Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow icon={Building} label="Operator" value={customer.simDetails.operator || '-'} />
                <InfoRow icon={Phone} label="Phone" value={customer.simDetails.phoneNumber || '-'} />
                <InfoRow icon={Hash} label="Serial (ICCID)" value={customer.simDetails.serialNumber || '-'} />
                <InfoRow icon={Hash} label="IMSI" value={customer.simDetails.imsi || '-'} />
              </div>
              {!customer.simDetails.isAuthorized && (
                <div className="mt-3 bg-destructive/10 border border-destructive/20 rounded p-2 text-xs text-destructive font-bold text-center">
                  ⚠️ UNAUTHORIZED SIM DETECTED
                </div>
              )}
            </div>
          )}

          {/* SIM Change History */}
          {customer.simChangeHistory && customer.simChangeHistory.length > 0 && (
            <div className="glass-card p-4 border-orange-500/20 bg-orange-500/5">
              <h3 className="font-semibold text-orange-600 mb-3 flex items-center gap-2">
                <History className="w-4 h-4" />
                SIM Change History
              </h3>
              <div className="space-y-2">
                {customer.simChangeHistory.map((change: any, i: number) => (
                  <div key={i} className="flex flex-col gap-1 bg-white/50 rounded-lg p-2 text-xs border border-orange-200">
                    <div className="flex justify-between font-medium">
                      <span>{change.operator || 'Unknown Network'}</span>
                      <span>{change.detectedAt ? new Date(change.detectedAt).toLocaleDateString() : '-'}</span>
                    </div>
                    <div className="text-muted-foreground">Serial: {change.serialNumber || 'N/A'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Device Info (Live Verified) */}
          {customer.deviceStatus?.technical && (
            <div className="glass-card p-4 border-primary/20 bg-primary/5">
              <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Verified Live Device Info
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow icon={Building} label="Brand" value={customer.deviceStatus.technical.brand || '-'} />
                <InfoRow icon={Smartphone} label="Verified Model" value={customer.deviceStatus.technical.model || '-'} />
                <InfoRow icon={Smartphone} label="Android Version" value={customer.deviceStatus.technical.osVersion || '-'} />
                <InfoRow icon={Hash} label="Android ID" value={customer.deviceStatus.technical.androidId || '-'} />
              </div>
              <div className="mt-4 pt-3 border-t border-primary/10">
                <p className="text-[10px] text-primary/70 uppercase tracking-widest font-bold">Confirmed by SecureFinance Admin</p>
              </div>
            </div>
          )}

          <div className="mt-2 pt-1">
            <Link to={`/mobile/${customer.imei1}`} target="_blank" className="w-full block">
              <Button variant="outline" size="sm" className="w-full text-blue-400 hover:text-blue-300 hover:bg-blue-950/30 border-blue-500/30">
                <Smartphone className="w-4 h-4 mr-2" />
                Open Device Simulator
              </Button>
            </Link>
          </div>
        </div>

        {/* EMI Details */}
        <div className="glass-card p-4 mt-4">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            EMI Details
          </h3>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Payment Progress</span>
              <span className="text-sm font-medium text-foreground">
                {customer.paidEmis || 0} of {customer.totalEmis || 0} EMIs paid
              </span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  customer.isLocked ? "bg-destructive" : "bg-primary"
                )}
                style={{ width: `${Math.min(100, Math.max(0, ((customer.paidEmis || 0) / (customer.totalEmis || 1)) * 100))}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Loan</p>
              <p className="text-sm font-bold text-foreground">₹{(customer.totalAmount || 0).toLocaleString()}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">EMI</p>
              <p className="text-sm font-bold text-foreground">₹{(customer.emiAmount || 0).toLocaleString()}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Date</p>
              <p className="text-sm font-bold text-foreground">{customer.emiDate || '-'}{Number(customer.emiDate) ? 'th' : ''}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Pending</p>
              <p className="text-sm font-bold text-destructive">
                ₹{((remainingEmis || 0) * (customer.emiAmount || 0)).toLocaleString()}
              </p>
            </div>
          </div>

          <Button
            className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => onCollectEmi(customer.id)}
            disabled={remainingEmis <= 0}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Collect Payment
          </Button>

          <div className="mt-3">
            <InfoRow
              icon={Building}
              label="Finance Provider"
              value={customer.financeName}
            />
          </div>
        </div>

        {/* Location */}
        <div className="glass-card p-4 mt-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Last Known Location
          </h3>
          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm text-foreground">
                    Lat: {(customer.location?.lat || 0).toFixed(4)}, Lng: {(customer.location?.lng || 0).toFixed(4)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Updated: {customer.location?.lastUpdated ? (() => {
                      try { return format(new Date(customer.location.lastUpdated), 'PPpp'); } catch (e) { return 'Invalid Date'; }
                    })() : 'Never'}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-8"
                onClick={() => window.open(`https://www.google.com/maps?q=${customer.location?.lat || 0},${customer.location?.lng || 0}`, '_blank')}
                disabled={!customer.location?.lat && !customer.location?.lng}
              >
                <MapPin className="w-3 h-3 mr-2" />
                View on Google Maps
              </Button>
            </div>
          </div>
        </div>


        {/* QR Code Section */}
        <div className="glass-card p-4 mt-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-primary" />
            Device Configuration QR
          </h3>
          <div className="flex flex-col items-center bg-white rounded-xl p-4 border border-border transition-all hover:shadow-md">
            {qrLoading || !qrData ? (
              <div className="w-[180px] h-[180px] flex items-center justify-center bg-gray-100 rounded-lg">
                <span className="text-xs text-gray-500 animate-pulse">Generating QR...</span>
              </div>
            ) : (
              <QRCodeSVG
                value={qrData}
                size={180}
                level="H"
                includeMargin={true}
              />
            )}
            <div className="mt-3 text-center">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Scan to Onboard Device</p>
              <p className="text-[9px] text-gray-400 mt-0.5 font-mono">{customer.imei1}</p>
            </div>
          </div>
        </div>

        {/* Lock History */}
        {
          customer.lockHistory && customer.lockHistory.length > 0 && (
            <div className="glass-card p-4 mt-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                Lock History
              </h3>
              <div className="space-y-2">
                {customer.lockHistory.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 bg-secondary/50 rounded-lg p-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      event.action === 'locked' ? "bg-destructive/20" : "bg-success/20"
                    )}>
                      {event.action === 'locked' ? (
                        <Lock className="w-4 h-4 text-destructive" />
                      ) : (
                        <Unlock className="w-4 h-4 text-success" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground capitalize">{event.action}</p>
                      <p className="text-xs text-muted-foreground">{event.reason}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {event.timestamp ? (() => {
                        try { return format(new Date(event.timestamp), 'PPp'); } catch (e) { return '-'; }
                      })() : '-'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        }

        {/* Security Events */}
        {customer.securityEvents && customer.securityEvents.length > 0 && (
          <div className="glass-card p-4 mt-4 border-red-500/20 bg-red-500/5">
            <h3 className="font-semibold text-red-500 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Security Events
            </h3>
            <div className="space-y-2">
              {customer.securityEvents.map((event: any, i: number) => (
                <div key={i} className="flex items-center gap-3 bg-red-100/50 rounded-lg p-3 border border-red-200">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-200">
                    <Lock className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-700">{event.event}</p>
                    <p className="text-xs text-red-500">Action: {event.action || 'LOGGED'}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {event.timestamp ? (() => {
                      try { return format(new Date(event.timestamp), 'PPp'); } catch (e) { return '-'; }
                    })() : '-'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Offline Lock Tokens */}
        <div className="glass-card p-4 mt-4 border-blue-500/20 bg-blue-500/5">
          <h3 className="font-semibold text-blue-600 mb-3 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            SMS Lock Commands (Offline)
          </h3>
          <div className="space-y-3">
            <div className="bg-blue-100/50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-blue-700 mb-1 font-semibold">To Lock via SMS:</p>
              <code className="text-sm font-mono bg-white px-2 py-1 rounded border block text-center">
                LOCK:{customer.offlineLockToken || '------'}
              </code>
            </div>
            <div className="bg-green-100/50 rounded-lg p-3 border border-green-200">
              <p className="text-xs text-green-700 mb-1 font-semibold">To Unlock via SMS:</p>
              <code className="text-sm font-mono bg-white px-2 py-1 rounded border block text-center">
                UNLOCK:{customer.offlineUnlockToken || '------'}
              </code>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Send SMS to device phone number when offline
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button
            variant={customer.isLocked ? "success" : "destructive"}
            className="flex-1"
            onClick={() => {
              onLockToggle(customer.id);
              onClose();
            }}
          >
            {customer.isLocked ? (
              <>
                <Unlock className="w-4 h-4 mr-2" />
                Unlock Device
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Lock Device
              </>
            )}
          </Button>

          <Button
            variant="destructive"
            className="flex-1 bg-red-900/80 hover:bg-red-900 border-red-800"
            onClick={() => {
              if (window.confirm("CRITICAL WARNING: This will FACTORY RESET the device and delete all data. This action cannot be undone. Are you sure?")) {
                sendRemoteCommand(customer.id, 'wipe');
                onClose();
              }
            }}
          >
            Wipe Data
          </Button>
        </div>
      </DialogContent >
    </Dialog >
  );
};
