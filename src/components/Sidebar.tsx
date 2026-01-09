import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Settings,
  Shield,
  X,
  LogOut,
  UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Customers', path: '/customers' },
  { icon: UserPlus, label: 'Add Customer', path: '/add-customer' },
  { icon: Shield, label: 'Batch Provision', path: '/batch-provision' },
  { icon: Settings, label: 'Settings', path: '/settings' },
  { icon: Shield, label: 'Admins', path: '/admins' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, currentAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose();
  };

  const handleLinkClick = () => {
    onClose();
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar Drawer */}
      <aside className={cn(
        "absolute inset-y-0 left-0 w-[240px] bg-card border-r border-border/50 flex flex-col h-full flex-shrink-0 z-50 transition-transform duration-300 ease-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo Section */}
        <div className="h-14 flex items-center px-4 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Shield className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <div className="leading-tight">
                <h1 className="font-bold text-foreground text-[13px] tracking-tight">Fins Pro</h1>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold opacity-60">Admin</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-secondary rounded-full"
              onClick={onClose}
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground active:bg-secondary/80"
                )}
              >
                <item.icon className={cn(
                  "w-4 h-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
                  isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                )} />
                <span className="font-bold text-[13px] tracking-tight">{item.label}</span>
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20 rounded-r-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Module */}
        <div className="p-3 mt-auto border-t border-border/50 bg-secondary/5">
          <div className="bg-secondary/20 rounded-xl p-3 border border-border/50 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <span className="text-[11px] font-black text-primary">
                  {currentAdmin ? currentAdmin.username.substring(0, 2).toUpperCase() : 'SU'}
                </span>
              </div>
              <div className="overflow-hidden leading-tight">
                <p className="text-[12px] font-black text-foreground truncate uppercase">
                  {currentAdmin ? currentAdmin.username : 'Admin'}
                </p>
                <p className="text-[9px] text-muted-foreground truncate font-mono tracking-tighter opacity-70">
                  ROOT ACCESS
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full justify-start gap-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg h-10 px-3 transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            <span className="font-bold text-[13px] tracking-tight">Logout</span>
          </Button>
        </div>
      </aside>
    </>
  );
};
