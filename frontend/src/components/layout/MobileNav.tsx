import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Grid3X3,
  CreditCard,
  Menu,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface MobileNavItem {
  label: string;
  icon: React.ElementType;
  to?: string;
  onClick?: () => void;
  isMenu?: boolean;
}

interface MobileNavProps {
  onOpenMenu: () => void;
  isSuperAdmin?: boolean;
}

export function MobileNav({ onOpenMenu, isSuperAdmin = false }: MobileNavProps) {
  const items: MobileNavItem[] = isSuperAdmin
    ? [
        { label: 'Overview', icon: LayoutDashboard, to: '/super-admin/dashboard' },
        { label: 'Libraries', icon: Building2, to: '/super-admin/libraries' },
        { label: 'Plans', icon: CreditCard, to: '/super-admin/subscriptions' },
        { label: 'Revenue', icon: TrendingUp, to: '/super-admin/revenue' },
        { label: 'Menu', icon: Menu, isMenu: true, onClick: onOpenMenu },
      ]
    : [
        { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
        { label: 'Students', icon: Users, to: '/students' },
        { label: 'Seats', icon: Grid3X3, to: '/seats' },
        { label: 'Payments', icon: CreditCard, to: '/payments' },
        { label: 'Menu', icon: Menu, isMenu: true, onClick: onOpenMenu },
      ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border px-2 py-1.5 shadow-lg pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-colors duration-200">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map((item, idx) => {
          const Icon = item.icon;

          if (item.isMenu) {
            return (
              <button
                key={idx}
                onClick={item.onClick}
                className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-muted-foreground hover:text-foreground active:scale-95 transition-all touch-manipulation min-w-[54px]"
                aria-label="Open navigation menu"
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-[11px] font-medium mt-0.5">{item.label}</span>
              </button>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to!}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all touch-manipulation active:scale-95 min-w-[54px]',
                  isActive
                    ? 'text-brand-600 dark:text-brand-400 font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('w-5 h-5 shrink-0 transition-transform', isActive && 'scale-110')} />
                  <span className="text-[11px] mt-0.5 truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
