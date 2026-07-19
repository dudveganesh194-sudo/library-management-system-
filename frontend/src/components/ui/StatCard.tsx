import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-brand-400',
  trend,
  className,
}: StatCardProps) {
  const trendPositive = trend && trend.value >= 0;

  return (
    <div className={cn('stat-card group', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-1.5 tabular-nums">{value}</p>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-zinc-800 group-hover:scale-110 transition-transform')}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
      </div>

      {trend && (
        <div className={cn('flex items-center gap-1 text-xs font-medium', trendPositive ? 'text-success' : 'text-danger')}>
          <span>{trendPositive ? '▲' : '▼'}</span>
          <span>{Math.abs(trend.value)}%</span>
          <span className="text-muted-foreground font-normal">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
