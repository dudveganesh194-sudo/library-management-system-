import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';
import { Menu, BookOpen } from 'lucide-react';

/**
 * Main app layout — sidebar + top navigation bar + content area.
 */
export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface-1 text-slate-900 dark:text-slate-100 transition-colors duration-200">
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
              className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shrink-0">
              <BookOpen className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="lg:hidden text-sm font-bold text-foreground leading-none">StudyLib</span>
          </div>

          {/* Theme switcher toggle */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>

        {/* Content Outlet scroll area */}
        <main className="flex-1 overflow-x-hidden">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
