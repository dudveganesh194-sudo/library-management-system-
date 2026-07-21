/**
 * Super Admin Sidebar — navigation for the Super Admin Panel.
 *
 * Separate branding and navigation from the library owner dashboard.
 * Uses the same collapsible pattern as the main sidebar.
 */

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Library,
  CreditCard,
  TrendingUp,
  Settings,
  ScrollText,
  UserCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../../../store/auth.context';
import { cn, getInitials } from '../../../lib/utils';
import toast from 'react-hot-toast';

interface NavItem {
  label: string;
  icon: React.ElementType;
  to: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/super-admin/dashboard' },
  { label: 'Libraries', icon: Library, to: '/super-admin/libraries' },
  { label: 'Subscriptions', icon: CreditCard, to: '/super-admin/subscriptions' },
  { label: 'Revenue', icon: TrendingUp, to: '/super-admin/revenue' },
  { label: 'Settings', icon: Settings, to: '/super-admin/settings' },
  { label: 'Logs', icon: ScrollText, to: '/super-admin/logs' },
  { label: 'Profile', icon: UserCircle, to: '/super-admin/profile' },
];

interface SuperAdminSidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function SuperAdminSidebar({ mobileOpen, setMobileOpen }: SuperAdminSidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const SidebarContent = ({ showClose = false }: { showClose?: boolean }) => (
    <div className="flex flex-col h-full bg-card">
      {/* Logo / Brand */}
      <div className={cn('flex items-center justify-between px-4 py-5 border-b border-border', collapsed && 'justify-center px-3')}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-base font-bold text-foreground leading-tight">StudyLib</p>
              <p className="text-2xs text-amber-500 uppercase tracking-widest font-semibold">Super Admin</p>
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
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition-all duration-200 cursor-pointer hover:bg-slate-100 dark:hover:bg-surface-4 hover:text-foreground min-h-[44px]',
                isActive && 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold',
                collapsed && 'justify-center px-3'
              )
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
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
            {user ? getInitials(user.name) : '?'}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-amber-500 font-semibold">Super Admin</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={cn('flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium w-full text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-all min-h-[44px]', collapsed && 'justify-center px-3')}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="text-sm">Logout</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium w-full text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-surface-4 transition-all hidden lg:flex', collapsed && 'justify-center px-3')}
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

      {/* Mobile Sidebar */}
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
