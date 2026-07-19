/**
 * RevenuePage — platform revenue analytics for Super Admin (ERP Subscription Charges).
 */

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, DollarSign, Calendar, Building2, CheckCircle2, XCircle } from 'lucide-react';
import { getRevenue } from '../api/super-admin.api';
import { formatCurrency } from '../../../lib/utils';
import { StatCard } from '../../../components/ui/StatCard';
import { TableSkeleton } from '../components/TableSkeleton';

export function RevenuePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['super-admin', 'revenue'],
    queryFn: getRevenue,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 dark:bg-surface-4 rounded animate-pulse" />
        <TableSkeleton columns={3} rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-emerald-500" />
          ERP Subscription Revenue
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Revenue collected strictly from libraries for using the LibraryInfos platform (excluding student payments).
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Total ERP Revenue (All Time)"
          value={formatCurrency(data.totalRevenue)}
          icon={DollarSign}
          iconColor="text-emerald-500"
          subtitle="Cumulative platform subscription fees"
        />
        <StatCard
          title="Monthly ERP Revenue Average"
          value={formatCurrency(
            data.monthlyRevenue.length > 0
              ? Math.round(data.totalRevenue / Math.max(data.monthlyRevenue.length, 1))
              : 0
          )}
          icon={Calendar}
          iconColor="text-blue-500"
          subtitle={`Across ${data.monthlyRevenue.length} recorded month(s)`}
        />
      </div>

      {/* Per Library ERP Revenue Table */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <Building2 className="w-4.5 h-4.5 text-amber-500" />
          ERP Subscription Revenue by Onboarded Library
        </h2>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Library Name</th>
                <th>Plan Tier</th>
                <th>Payment Status</th>
                <th className="text-right">This Month Revenue</th>
                <th className="text-right">Total ERP Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.revenueByLibrary?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                    No onboarded libraries yet
                  </td>
                </tr>
              ) : (
                data.revenueByLibrary?.map((item) => (
                  <tr key={item.libraryId}>
                    <td className="font-semibold text-foreground">{item.libraryName}</td>
                    <td>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface-2 border border-border">
                        {item.planName}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 rounded-full border ${
                          item.paymentStatus === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}
                      >
                        {item.paymentStatus === 'paid' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {item.paymentStatus?.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-right font-mono text-foreground">
                      {formatCurrency(item.thisMonthRevenue)}
                    </td>
                    <td className="text-right font-mono font-bold text-emerald-500">
                      {formatCurrency(item.totalRevenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Monthly ERP Billing Breakdown</h2>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th className="text-right">Collected Subscription Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.monthlyRevenue.length === 0 ? (
                <tr>
                  <td colSpan={2} className="text-center py-8 text-muted-foreground text-sm">
                    No subscription payments recorded yet
                  </td>
                </tr>
              ) : (
                data.monthlyRevenue.map((item, idx) => (
                  <tr key={idx}>
                    <td className="font-medium text-foreground">{item.month}</td>
                    <td className="text-right font-mono font-bold text-emerald-500">
                      {formatCurrency(item.revenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
