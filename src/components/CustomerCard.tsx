import { Customer } from '@/types/customer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, Unlock, MapPin, Phone, CreditCard, Smartphone, Pencil, Trash2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerCardProps {
  customer: Customer;
  onLockToggle: (id: string) => void;
  onViewDetails: (customer: Customer) => void;
  onEdit: (id: string) => void;
  onCollectEmi: (id: string) => void;
  onDelete: (id: string) => void;
}

export const CustomerCard = ({ customer, onLockToggle, onViewDetails, onEdit, onCollectEmi, onDelete }: CustomerCardProps) => {
  const remainingEmis = (customer.totalEmis || 0) - (customer.paidEmis || 0);
  const progress = customer.totalEmis ? ((customer.paidEmis || 0) / customer.totalEmis) * 100 : 0;

  return (
    <div
      className={cn(
        "glass-card p-4 transition-all duration-300 hover:border-border cursor-pointer",
        customer.isLocked && "border-destructive/30 bg-destructive/5"
      )}
      onClick={() => onViewDetails(customer)}
    >
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0",
              customer.isLocked
                ? "bg-destructive/20 text-destructive"
                : "bg-primary/20 text-primary"
            )}>
              {customer.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-foreground truncate">{customer.name}</h3>
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full flex-shrink-0",
                    customer.deviceStatus?.status === 'online' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-muted"
                  )}
                />
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Smartphone className="w-3 h-3" />
                {customer.mobileModel}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "whitespace-nowrap flex-shrink-0 text-[10px] px-1.5 h-5",
              customer.isLocked ? "status-locked" :
                (customer.deviceStatus?.status === 'ADMIN_INSTALLED' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "status-unlocked")
            )}
          >
            {customer.isLocked ? 'Locked' : (customer.deviceStatus?.status === 'ADMIN_INSTALLED' ? 'Enrolled' : 'Active')}
          </Badge>
        </div>
      </div>


      {/* EMI Progress */}
      <div className="mb-3 mt-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">EMI Progress</span>
          <span className="text-xs font-medium text-foreground">
            {customer.paidEmis || 0}/{customer.totalEmis || 0}
          </span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              customer.isLocked ? "bg-destructive" : "bg-primary"
            )}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>

      {/* EMI Details */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-secondary/50 rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
            <CreditCard className="w-3 h-3" />
            <span className="text-[10px]">Monthly EMI</span>
          </div>
          <p className="font-semibold text-sm text-foreground">₹{(customer.emiAmount || 0).toLocaleString()}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-2.5">
          <div className="text-[10px] text-muted-foreground mb-0.5">Pending</div>
          <p className="font-semibold text-sm text-foreground">
            ₹{((remainingEmis || 0) * (customer.emiAmount || 0)).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3 truncate">
        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate">{customer.address}</span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="glass"
            size="sm"
            className="w-full h-8 px-0"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(customer);
            }}
            title="View Details"
          >
            <div className="flex items-center justify-center w-full h-full"><Eye className="w-4 h-4" /></div>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 px-0"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(customer.id);
            }}
            title="Edit Customer"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 px-0 border-destructive/20 text-destructive hover:bg-destructive hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(customer.id);
            }}
            title="Delete Customer"
          >
            <div className="flex items-center justify-center w-full h-full"><Trash2 className="w-4 h-4" /></div>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={customer.isLocked ? "successOutline" : "danger"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onLockToggle(customer.id);
            }}
            className="gap-1.5 w-full h-9 text-xs"
          >
            {customer.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            {customer.isLocked ? 'Unlock' : 'Lock'}
          </Button>
          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white h-9 text-xs"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onCollectEmi(customer.id);
            }}
            disabled={remainingEmis <= 0}
          >
            <CreditCard className="w-3.5 h-3.5 mr-1.5" />
            Collect
          </Button>
        </div>
      </div>
    </div>
  );
};
