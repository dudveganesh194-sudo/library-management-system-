/**
 * StatusBadge — displays library status with color-coded badges.
 */

import { cn } from '../../../lib/utils';
import type { LibraryStatus } from '../../../types';

const statusConfig: Record<LibraryStatus, { label: string; className: string }> = {
  active: {
    label: 'Active',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  suspended: {
    label: 'Suspended',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  deleted: {
    label: 'Deleted',
    className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  },
};

interface StatusBadgeProps {
  status: LibraryStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.active;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border',
        config.className,
        className
      )}
    >
      <span className={cn(
        'w-1.5 h-1.5 rounded-full',
        status === 'active' && 'bg-emerald-500',
        status === 'suspended' && 'bg-amber-500',
        status === 'deleted' && 'bg-red-500'
      )} />
      {config.label}
    </span>
  );
}
