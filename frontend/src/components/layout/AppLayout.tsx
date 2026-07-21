import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';
import { Menu, BookOpen, Download, Sparkles } from 'lucide-react';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useAuth } from '../../store/auth.context';
import { api } from '../../lib/axios';
import { daysRemaining, formatDate } from '../../lib/utils';
import type { Library } from '../../types';

/**
 * Main app layout — sidebar + top navigation bar + content area.
 * Supports swipe-right gesture to open sidebar on mobile.
 */
export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { installApp, isInstallable } = usePWAInstall();
  const { user } = useAuth();

  // Query fresh user profile to get populated library trial details
  const { data: currentUser } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data.data;
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const activeUser = currentUser || user;
  const library = typeof activeUser?.libraryId === 'object' ? (activeUser.libraryId as Library) : null;

  const isTrial = library?.isTrial || library?.paymentStatus === 'trial';
  const endDate = library?.trialEndDate || library?.subscriptionEndDate;
  const trialDaysLeft = endDate ? daysRemaining(endDate) : 0;

  const swipeHandlers = useSwipeGesture({
    onSwipeRight: () => setMobileOpen(true),
    onSwipeLeft: () => setMobileOpen(false),
  });

  return (
    <div
      {...swipeHandlers}
      className="flex min-h-screen bg-surface-1 text-slate-900 dark:text-slate-100 transition-colors duration-200"
    >
      {/* Sidebar Layout */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-border bg-card px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 transition-colors duration-200 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger menu */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 touch-manipulation"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="lg:hidden w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0 shadow-glow-sm">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="lg:hidden text-base font-bold text-foreground leading-none">LibraryInfos</span>
          </div>

          {/* Action buttons: Free Trial Badge + PWA Install + Theme switcher */}
          <div className="flex items-center gap-2.5">
            {/* Free Trial Badge near Theme Toggle */}
            {isTrial && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold text-xs sm:text-sm transition-all shadow-sm ${
                  trialDaysLeft < 0
                    ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                    : trialDaysLeft <= 3
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 animate-pulse'
                    : 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/25'
                }`}
                title={`Free Trial active until ${endDate ? formatDate(endDate) : 'N/A'}`}
              >
                <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400 shrink-0" />
                <span className="whitespace-nowrap">
                  {trialDaysLeft < 0 ? (
                    'Trial Expired'
                  ) : trialDaysLeft === 0 ? (
                    'Free Trial: Last Day!'
                  ) : (
                    <>
                      <span className="hidden xs:inline">Free Trial: </span>
                      <span>{trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} left</span>
                    </>
                  )}
                </span>
              </div>
            )}

            {isInstallable && (
              <button
                onClick={installApp}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-medium text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all duration-200"
                title="Install LibraryInfos App"
              >
                <Download className="w-4 h-4 animate-bounce" />
                <span>Install App</span>
              </button>
            )}
            <ThemeToggle />
          </div>
        </header>

        {/* Content Outlet scroll area */}
        <main className="flex-1 overflow-x-hidden">
          <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

