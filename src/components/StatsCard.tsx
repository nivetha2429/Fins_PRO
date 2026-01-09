import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'warning';
}

const variantStyles = {
  default: {
    icon: 'bg-secondary text-muted-foreground',
    glow: '',
  },
  primary: {
    icon: 'bg-primary/20 text-primary',
    glow: 'glow-primary',
  },
  success: {
    icon: 'bg-success/20 text-success',
    glow: 'glow-success',
  },
  danger: {
    icon: 'bg-destructive/20 text-destructive',
    glow: 'glow-danger',
  },
  warning: {
    icon: 'bg-warning/20 text-warning',
    glow: '',
  },
};

export const StatsCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default'
}: StatsCardProps) => {
  const styles = variantStyles[variant];

  return (
    <div className={cn(
      "glass-card p-3 sm:p-5 hover:border-border transition-all duration-300 group",
      styles.glow && `hover:${styles.glow}`
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-[10px] sm:text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110",
          styles.icon
        )}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
    </div>
  );
};
