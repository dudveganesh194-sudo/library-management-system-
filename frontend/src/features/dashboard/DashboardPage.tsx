import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../lib/axios';
import { DashboardStats, Payment } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { PaymentStatusBadge } from '../../components/ui/Badge';
import { useAuth } from '../../store/auth.context';
import {
  Users,
  Grid3X3,
  CreditCard,
  UserPlus,
  TrendingUp,
  Clock,
  UserCheck,
  PhoneCall,
  MessageCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatDate, daysRemaining, formatStudentId, getWhatsAppLink, getCallLink } from '../../lib/utils';

async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get('/reports/dashboard');
  return data.data;
}

async function fetchRevenueTrend(): Promise<{ month: string; revenue: number }[]> {
  const { data } = await api.get('/reports/revenue-trend?months=6');
  return data.data;
}

export function DashboardPage() {
  const { user } = useAuth();
  const isReceptionist = user?.role === 'receptionist';

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 30000,
  });

  const { data: revenueTrend, isLoading: trendLoading } = useQuery({
    queryKey: ['revenue-trend'],
    queryFn: fetchRevenueTrend,
    enabled: !isReceptionist,
  });

  const isLoading = statsLoading || (!isReceptionist && trendLoading);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-8 w-16" />
              <div className="skeleton h-3 w-32" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="card p-5 xl:col-span-2 space-y-4">
            <div className="skeleton h-6 w-32" />
            <div className="skeleton h-52 w-full" />
          </div>
          <div className="card p-5 space-y-4">
            <div className="skeleton h-6 w-32" />
            <div className="skeleton h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats?.students.total || 0}
          subtitle={`${stats?.students.active || 0} active`}
          icon={Users}
          iconColor="text-brand-500"
        />
        <StatCard
          title="Seats Occupied"
          value={`${stats?.seats.occupancyRate || 0}%`}
          subtitle={`${stats?.seats.occupied || 0} / ${stats?.seats.total || 0} seats`}
          icon={Grid3X3}
          iconColor="text-info"
        />
        {!isReceptionist ? (
          <StatCard
            title="Revenue (This Month)"
            value={formatCurrency(stats?.revenue.thisMonth || 0)}
            icon={CreditCard}
            iconColor="text-success"
          />
        ) : (
          <StatCard
            title="Today's Admissions"
            value={stats?.students.todaysAdmissions || 0}
            subtitle="new entries today"
            icon={UserCheck}
            iconColor="text-success"
          />
        )}
        <StatCard
          title="New Students"
          value={stats?.students.newThisMonth || 0}
          subtitle="this month"
          icon={UserPlus}
          iconColor="text-warning"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue Chart (Hidden for Receptionist) */}
        {!isReceptionist ? (
          <div className="card p-5 xl:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="section-title">Revenue Trend</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Last 6 months</p>
              </div>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend || []} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)', fontSize: '12px' }}
                    formatter={(v: any) => [formatCurrency(Number(v)), 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="var(--brand-500)" strokeWidth={2} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}

        {/* Seat Occupancy (Full width if receptionist) */}
        <div className={`card p-5 ${isReceptionist ? 'xl:col-span-3' : ''}`}>
          <h2 className="section-title mb-4">Seat Overview</h2>
          <div className="space-y-3">
            {[
              { label: 'Available', value: stats?.seats.available || 0, color: 'bg-success', pct: stats?.seats.total ? Math.round(((stats.seats.available || 0) / stats.seats.total) * 100) : 0 },
              { label: 'Occupied', value: stats?.seats.occupied || 0, color: 'bg-info', pct: stats?.seats.occupancyRate || 0 },
              { label: 'Maintenance', value: stats?.seats.maintenance || 0, color: 'bg-warning', pct: stats?.seats.total ? Math.round(((stats.seats.maintenance || 0) / stats.seats.total) * 100) : 0 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>{item.label}</span>
                  <span className="font-medium text-foreground">{item.value}</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-700`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Recent Payments */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Recent Payments</h2>
          <div className="space-y-3">
            {(stats?.recentPayments || []).length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">No payments yet</p>
            ) : (
              (stats?.recentPayments || []).map((payment: Payment) => (
                <div key={payment._id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    {typeof payment.student === 'object' && payment.student ? (
                      <Link to={`/students/${payment.student._id}`} className="hover:underline group">
                        <p className="text-sm font-medium text-foreground group-hover:text-brand-500 transition-colors">
                          {payment.student.name} <span className="font-mono text-2xs text-brand-600 dark:text-brand-300">({formatStudentId(payment.student.studentId)})</span>
                        </p>
                      </Link>
                    ) : (
                      <p className="text-sm font-medium text-foreground">—</p>
                    )}
                    <p className="text-xs text-muted-foreground">{formatDate(payment.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    {!isReceptionist && (
                      <p className="text-sm font-semibold text-success">{formatCurrency(payment.amount)}</p>
                    )}
                    <PaymentStatusBadge status={payment.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="section-title">Expiring Soon</h2>
            <Clock className="w-4 h-4 text-warning" />
          </div>
          <div className="space-y-3">
            {(stats?.expiringSoon || []).length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">No memberships expiring in 7 days</p>
            ) : (
              (stats?.expiringSoon || []).map((payment: Payment) => {
                const days = daysRemaining(payment.endDate);
                return (
                  <div key={payment._id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      {typeof payment.student === 'object' && payment.student ? (
                        <Link to={`/students/${payment.student._id}`} className="hover:underline group">
                          <p className="text-sm font-medium text-foreground group-hover:text-brand-500 transition-colors">
                            {payment.student.name} <span className="font-mono text-2xs text-brand-600 dark:text-brand-300">({formatStudentId(payment.student.studentId)})</span>
                          </p>
                        </Link>
                      ) : (
                        <p className="text-sm font-medium text-foreground">—</p>
                      )}
                      <p className="text-xs text-muted-foreground">Expires {formatDate(payment.endDate)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${days <= 2 ? 'badge-red' : 'badge-yellow'}`}>
                        {days <= 0 ? 'Today' : `${days}d`}
                      </span>
                      {typeof payment.student === 'object' && payment.student?.phone && (
                        <div className="flex items-center gap-1">
                          <a
                            href={getCallLink(payment.student.phone)}
                            className="p-1 rounded-md bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors"
                            title={`Call ${payment.student.name}`}
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={getWhatsAppLink(payment.student.phone, payment.student.name, days)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-md bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors"
                            title={`WhatsApp message ${payment.student.name}`}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
