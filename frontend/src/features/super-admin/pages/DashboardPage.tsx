/**
 * Super Admin Dashboard Page
 */

import { useQuery } from '@tanstack/react-query';
import {
  Library,
  CreditCard,
  Users,
  GraduationCap,
  TrendingUp,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../api/super-admin.api';
import { formatCurrency, formatDate, daysRemaining } from '../../../lib/utils';
import { StatCard } from '../../../components/ui/StatCard';
import { TableSkeleton } from '../components/TableSkeleton';

export function DashboardPage() {
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['super-admin', 'dashboard'],
    queryFn: getDashboard,
    refetchInterval: 30000,
  });

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 dark:bg-surface-4 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
        <TableSkeleton columns={4} rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Quick Trial Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
            Super Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Platform-wide overview across all libraries, onboarding status, and subscription billing.
          </p>
        </div>

        <button
          onClick={() => navigate('/super-admin/libraries')}
          className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/25 transition-all text-left group"
        >
          <div className="p-2 rounded-lg bg-purple-500 text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-purple-600 dark:text-purple-400 group-hover:underline">
              Free Trial Libraries ({stats.libraries.trial || 0})
            </p>
            <p className="text-2xs text-muted-foreground">Click to manage & grant trials</p>
          </div>
        </button>
      </div>

      {/* Row 1: Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Onboarded Libraries"
          value={stats.libraries.total}
          icon={Library}
          iconColor="text-amber-500"
          subtitle={`${stats.libraries.active} Active · ${stats.libraries.trial || 0} Free Trial`}
        />
        <StatCard
          title="Subscription Payment"
          value={`${stats.libraries.paid} Paid`}
          icon={CheckCircle2}
          iconColor="text-emerald-500"
          subtitle={`${stats.libraries.trial || 0} Free Trial · ${stats.libraries.unpaid} Unpaid`}
        />
        <StatCard
          title="Expiring / Expired"
          value={`${stats.libraries.expiringSoon} Expiring`}
          icon={Clock}
          iconColor="text-amber-500"
          subtitle={`${stats.libraries.expired} Already Expired`}
        />
        <StatCard
          title="Total Revenue (All Time)"
          value={formatCurrency(stats.revenue.totalAllTime)}
          icon={TrendingUp}
          iconColor="text-emerald-500"
          subtitle={`This Month: ${formatCurrency(stats.revenue.thisMonth)} (${stats.revenue.growthPercentage >= 0 ? '+' : ''}${stats.revenue.growthPercentage}%)`}
        />
      </div>

      {/* Row 2: Secondary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase">Active Students</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.students.activeTotal}</p>
            <p className="text-xs text-muted-foreground">Out of {stats.students.total} total members</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase">Library Owners</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.users.totalOwners}</p>
            <p className="text-xs text-muted-foreground">{stats.users.totalStaff} staff accounts</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase">Active Tiers</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.subscriptions.active}</p>
            <p className="text-xs text-muted-foreground">Out of {stats.subscriptions.total} plans available</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid Section: Attention Needed Libraries + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Libraries Needing Attention */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
              Libraries Needing Attention (Unpaid / Expiring)
            </h2>
            <button
              onClick={() => navigate('/super-admin/libraries')}
              className="text-xs font-semibold text-amber-500 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {stats.attentionLibraries?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center bg-surface-1 dark:bg-surface-3 rounded-xl">
                All onboarded libraries are paid and up to date! 🎉
              </p>
            ) : (
              stats.attentionLibraries?.map((lib) => {
                const days = lib.subscriptionEndDate ? daysRemaining(lib.subscriptionEndDate) : null;
                return (
                  <div
                    key={lib._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-surface-1 dark:bg-surface-3 border border-border/60 hover:border-amber-500/30 transition-all gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{lib.name}</span>
                        <span className="text-xs text-muted-foreground">({lib.email})</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Plan: <strong className="text-foreground">{lib.subscriptionName}</strong> · Phone: {lib.phone}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Payment Badge */}
                      {lib.paymentStatus === 'unpaid' || lib.paymentStatus === 'pending' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-red-500/10 text-red-500 border border-red-500/20">
                          <XCircle className="w-3.5 h-3.5" /> Unpaid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                        </span>
                      )}

                      {/* Expiry Badge */}
                      {days !== null && (
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md border ${
                            days < 0
                              ? 'bg-red-500/10 text-red-500 border-red-500/20'
                              : days <= 7
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          {days < 0 ? `Expired ${Math.abs(days)}d ago` : `${days}d left`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Audit Activity */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-500" />
              Recent Admin Activity
            </h2>
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {stats.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No recent admin activity</p>
              ) : (
                stats.recentActivity.map((activity) => (
                  <div
                    key={activity._id}
                    className="p-3 rounded-xl bg-surface-1 dark:bg-surface-3 border border-border/60 hover:border-amber-500/30 transition-all text-xs space-y-1"
                  >
                    <p className="font-medium text-foreground">{activity.details}</p>
                    <div className="flex items-center justify-between text-2xs text-muted-foreground">
                      <span>{activity.performedBy?.name || 'System'}</span>
                      <span>{formatDate(activity.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
