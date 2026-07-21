import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { MobileNav } from '../../../components/layout/MobileNav';
import { Menu, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '../../../components/layout/ThemeToggle';
import { useSwipeGesture } from '../../../hooks/useSwipeGesture';

export function SuperAdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const swipeHandlers = useSwipeGesture({
    onSwipeRight: () => setMobileOpen(true),
    onSwipeLeft: () => setMobileOpen(false),
  });

  return (
    <div
      {...swipeHandlers}
      className="flex min-h-screen bg-surface-1 text-slate-900 dark:text-slate-100 transition-colors duration-200"
    >
      {/* Sidebar */}
      <SuperAdminSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-border bg-card px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 transition-colors duration-200 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 touch-manipulation"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="lg:hidden w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-glow-sm">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="lg:hidden text-base font-bold text-foreground leading-none">StudyLib</span>
          </div>

          {/* Theme toggle */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Admin Panel</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-x-hidden pb-20 lg:pb-0">
          <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Dock Navigation */}
      <MobileNav onOpenMenu={() => setMobileOpen(true)} isSuperAdmin={true} />
    </div>
  );
}

