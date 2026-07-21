import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Grid3X3,
  CreditCard,
  BarChart3,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  X,
  Download,
} from 'lucide-react';
import { useAuth } from '../../store/auth.context';
import { cn, getInitials } from '../../lib/utils';
import { Role } from '../../types';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import toast from 'react-hot-toast';

interface NavItem {
  label: string;
  icon: React.ElementType;
  to: string;
  allowedRoles?: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Students', icon: Users, to: '/students' },
  { label: 'Seats', icon: Grid3X3, to: '/seats' },
  { label: 'Payments', icon: CreditCard, to: '/payments' },
  { label: 'Reports', icon: BarChart3, to: '/reports', allowedRoles: ['owner', 'manager'] },
  { label: 'Staff Management', icon: Shield, to: '/users', allowedRoles: ['owner'] },
  { label: 'Settings', icon: Settings, to: '/settings', allowedRoles: ['owner'] },
];

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { installApp, isInstallable } = usePWAInstall();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.allowedRoles || (user && item.allowedRoles.includes(user.role))
  );

  const SidebarContent = ({ showClose = false }: { showClose?: boolean }) => (
    <div className="flex flex-col h-full bg-card">
      {/* Logo */}
      <div className={cn('flex items-center justify-between px-4 py-5 border-b border-border', collapsed && 'justify-center px-3')}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0 shadow-glow-sm">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-base font-bold text-foreground leading-tight">StudyLib</p>
              <p className="text-2xs text-muted-foreground uppercase tracking-widest">ERP</p>
            </div>
          )}
        </div>
        {showClose && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 scrollable">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn('nav-item', isActive && 'nav-item-active', collapsed && 'justify-center px-3')
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="text-sm">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + Collapse */}
      <div className="border-t border-border p-3 space-y-2">
        {/* User info */}
        <div className={cn('flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-default', collapsed && 'justify-center px-0')}>
          <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-sm font-bold text-white shrink-0">
            {user ? getInitials(user.name) : '?'}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          )}
        </div>

        {/* Install App (PWA) */}
        {isInstallable && (
          <button
            onClick={installApp}
            className={cn('nav-item w-full text-indigo-500 hover:text-indigo-600 hover:bg-indigo-500/10 font-medium', collapsed && 'justify-center px-3')}
            title={collapsed ? 'Install App' : undefined}
          >
            <Download className="w-5 h-5 shrink-0 animate-bounce" />
            {!collapsed && <span className="text-sm">Install App</span>}
          </button>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={cn('nav-item w-full text-red-500 hover:text-red-600 hover:bg-red-500/10', collapsed && 'justify-center px-3')}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="text-sm">Logout</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn('nav-item w-full hidden lg:flex', collapsed && 'justify-center px-3')}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <><ChevronLeft className="w-5 h-5" /><span className="text-sm">Collapse</span></>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar — slide from left */}
      <aside
        className={cn(
          'lg:hidden fixed top-0 left-0 h-full w-72 z-50 border-r border-border transform transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent showClose={true} />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col h-screen sticky top-0 border-r border-border transition-all duration-300 shrink-0',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
