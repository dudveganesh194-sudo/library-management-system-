import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';
import { Menu, BookOpen, Download } from 'lucide-react';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { usePWAInstall } from '../../hooks/usePWAInstall';

/**
 * Main app layout — sidebar + top navigation bar + content area.
 * Supports swipe-right gesture to open sidebar on mobile.
 */
export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { installApp, isInstallable } = usePWAInstall();

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

          {/* Action buttons: PWA Install + Theme switcher */}
          <div className="flex items-center gap-3">
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

