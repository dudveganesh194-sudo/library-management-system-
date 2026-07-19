/**
 * LogsPage — audit trail for all super admin actions.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollText } from 'lucide-react';
import { getLogs } from '../api/super-admin.api';
import { DataTable, type Column } from '../components/DataTable';
import { formatDateTime } from '../../../lib/utils';
import type { AuditLog } from '../../../types';

export function LogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['super-admin', 'logs', page, search],
    queryFn: () => getLogs({ page, limit: 15, search: search || undefined }),
  });

  const columns: Column<AuditLog>[] = [
    {
      key: 'action',
      label: 'Action',
      render: (log) => (
        <span className="font-mono text-xs font-semibold px-2 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          {log.action}
        </span>
      ),
    },
    {
      key: 'details',
      label: 'Details',
      render: (log) => <p className="text-sm font-medium text-foreground">{log.details}</p>,
    },
    {
      key: 'performedBy',
      label: 'Admin',
      render: (log) => {
        const admin = typeof log.performedBy === 'object' ? log.performedBy : null;
        return (
          <span className="text-xs text-muted-foreground">
            {admin ? `${admin.name} (${admin.email})` : 'System'}
          </span>
        );
      },
    },
    {
      key: 'ipAddress',
      label: 'IP Address',
      render: (log) => <span className="font-mono text-xs text-muted-foreground">{log.ipAddress || 'N/A'}</span>,
    },
    {
      key: 'createdAt',
      label: 'Timestamp',
      render: (log) => <span className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <ScrollText className="w-6 h-6 text-amber-500" />
          Audit Logs
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Immutable history of all administrative actions performed on the platform.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data?.logs || []}
        loading={isLoading}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search action or details..."
        page={page}
        totalPages={data?.meta.totalPages || 1}
        total={data?.meta.total || 0}
        onPageChange={setPage}
        emptyMessage="No audit logs found"
      />
    </div>
  );
}
