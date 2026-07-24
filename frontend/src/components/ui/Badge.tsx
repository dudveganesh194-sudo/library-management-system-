import { cn } from '../../lib/utils';

type BadgeVariant = 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'default';

const variantMap: Record<BadgeVariant, string> = {
  green: 'badge-green',
  yellow: 'badge-yellow',
  red: 'badge-red',
  blue: 'badge-blue',
  purple: 'badge-purple',
  default: 'badge bg-surface-4 text-muted-foreground',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return <span className={cn(variantMap[variant], className)}>{children}</span>;
}

// Helpers for common status mappings
export function StudentStatusBadge({ status }: { status: string }) {
  const labelMap: Record<string, string> = {
    active: 'Active',
    inactive: 'Inactive',
    suspended: 'Suspended',
    left: 'Left Library',
    on_leave: 'On Leave',
  };
  const variantMap: Record<string, BadgeVariant> = {
    active: 'green',
    inactive: 'yellow',
    suspended: 'red',
    left: 'default',
    on_leave: 'purple',
  };
  return <Badge variant={variantMap[status] || 'default'}>{labelMap[status] || status}</Badge>;
}

export function SeatStatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, BadgeVariant> = {
    available: 'green',
    occupied: 'blue',
    reserved: 'yellow',
    maintenance: 'red',
  };
  return <Badge variant={variantMap[status] || 'default'}>{status}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, BadgeVariant> = {
    paid: 'green',
    pending: 'yellow',
    overdue: 'red',
  };
  return <Badge variant={variantMap[status] || 'default'}>{status}</Badge>;
}
