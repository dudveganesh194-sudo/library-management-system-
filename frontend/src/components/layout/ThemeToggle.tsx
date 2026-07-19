import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-4 h-4 text-amber-500" />;
      case 'dark':
        return <Moon className="w-4 h-4 text-indigo-400" />;
      default:
        return <Laptop className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="btn-ghost btn p-2 rounded-xl border border-border bg-card shadow-sm flex items-center justify-center"
        aria-label="Toggle theme"
      >
        {getIcon()}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-32 bg-card border border-border rounded-xl shadow-card p-1 z-50 animate-fade-in">
          {[
            { id: 'light', label: 'Light', icon: Sun, color: 'text-amber-500' },
            { id: 'dark', label: 'Dark', icon: Moon, color: 'text-indigo-400' },
            { id: 'system', label: 'System', icon: Laptop, color: 'text-slate-500' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setTheme(item.id);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors text-left ${
                theme === item.id
                  ? 'bg-brand-600/10 text-brand-500 dark:text-brand-300'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-surface-4'
              }`}
            >
              <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
