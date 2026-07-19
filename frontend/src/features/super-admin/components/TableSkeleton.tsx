/**
 * TableSkeleton — loading placeholder for data tables.
 */

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
}

export function TableSkeleton({ columns = 6, rows = 8 }: TableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card animate-pulse">
      {/* Header */}
      <div className="border-b border-border bg-slate-50 dark:bg-zinc-900 px-4 py-3 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-3 bg-slate-200 dark:bg-surface-4 rounded flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="px-4 py-3.5 flex gap-4 border-b border-border/50 last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="h-3 bg-slate-200 dark:bg-surface-4 rounded flex-1"
              style={{ maxWidth: colIdx === 0 ? '40%' : '100%' }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
