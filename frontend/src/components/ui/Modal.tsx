import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ open, onClose, title, children, className, size = 'md' }: ModalProps) {
  // Prevent background scrolling when modal is open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Dialog Window */}
      <div
        className={cn(
          'relative w-full max-h-[88dvh] sm:max-h-[90vh] flex flex-col bg-card border border-border rounded-2xl shadow-card animate-slide-up my-auto z-10',
          sizeMap[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="flex flex-col border-b border-border shrink-0 bg-card rounded-t-2xl">
          {/* Mobile Sheet Drag Indicator Bar */}
          <div className="sm:hidden w-12 h-1 bg-border rounded-full mx-auto mt-2.5 mb-1" />

          <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate pr-2">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-surface-4 transition-colors shrink-0 touch-manipulation"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 scrollable space-y-4">{children}</div>
      </div>
    </div>
  );
}
