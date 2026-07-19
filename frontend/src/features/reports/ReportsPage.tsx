import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Clock, Grid3X3, QrCode, CreditCard, Banknote, Calendar, Layers, Users } from 'lucide-react';
import { api } from '../../lib/axios';
import { formatCurrency, formatDate, daysRemaining } from '../../lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year' | 'allTime'>('month');

  const { data: trend } = useQuery({
    queryKey: ['revenue-trend-6'],
    queryFn: async () => { const { data } = await api.get('/reports/revenue-trend?months=6'); return data.data; },
  });

  const { data: paymentStats } = useQuery({
    queryKey: ['payment-method-stats'],
    queryFn: async () => { const { data } = await api.get('/reports/payment-methods'); return data.data; },
  });

  const { data: expiring } = useQuery({
    queryKey: ['expiring-14'],
    queryFn: async () => { const { data } = await api.get('/reports/expiring?days=14'); return data.data; },
  });

  const { data: occupancy } = useQuery({
    queryKey: ['occupancy'],
    queryFn: async () => { const { data } = await api.get('/reports/occupancy'); return data.data; },
  });

  const totalRevenue = (trend || []).reduce((sum: number, t: { revenue: number }) => sum + t.revenue, 0);
  const occupied = (occupancy || []).filter((s: { status: string }) => s.status === 'occupied').length;

  const summary = paymentStats?.summary;
  const monthData = summary?.month || { name: 'July 2026', totalRevenue: 0, methods: { cash: { totalAmount: 0, count: 0 }, upi: { totalAmount: 0, count: 0 }, card: { totalAmount: 0, count: 0 } }, cashPercent: 0, upiPercent: 0, cardPercent: 0 };
  const yearData = summary?.year || { name: 'Overall 2026', totalRevenue: 0, methods: { cash: { totalAmount: 0, count: 0 }, upi: { totalAmount: 0, count: 0 }, card: { totalAmount: 0, count: 0 } }, cashPercent: 0, upiPercent: 0, cardPercent: 0 };
  const allTimeData = summary?.allTime || { name: 'All Time', totalRevenue: 0, methods: { cash: { totalAmount: 0, count: 0 }, upi: { totalAmount: 0, count: 0 }, card: { totalAmount: 0, count: 0 } }, cashPercent: 0, upiPercent: 0, cardPercent: 0 };

  const currentActivePeriod = selectedPeriod === 'month' ? monthData : selectedPeriod === 'year' ? yearData : allTimeData;

  const cashData = currentActivePeriod.methods?.cash || { totalAmount: 0, count: 0 };
  const upiData = currentActivePeriod.methods?.upi || { totalAmount: 0, count: 0 };
  const cardData = currentActivePeriod.methods?.card || { totalAmount: 0, count: 0 };

  const cashPercent = currentActivePeriod.cashPercent || 0;
  const upiPercent = currentActivePeriod.upiPercent || 0;
  const cardPercent = currentActivePeriod.cardPercent || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Financial Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Comprehensive cash vs UPI payments & revenue analysis</p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-surface-2 p-1 rounded-xl border border-border">
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedPeriod === 'month'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            July 2026 (This Month)
          </button>
          <button
            onClick={() => setSelectedPeriod('year')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedPeriod === 'year'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            2026 Overall
          </button>
          <button
            onClick={() => setSelectedPeriod('allTime')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedPeriod === 'allTime'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All-Time
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Selected Period Total Revenue */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-2xs font-bold text-muted-foreground uppercase tracking-wider">
              {currentActivePeriod.name} Revenue
            </p>
            <TrendingUp className="w-4 h-4 text-success" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-1.5 tabular-nums">
            {formatCurrency(currentActivePeriod.totalRevenue)}
          </p>
          <p className="text-2xs text-muted-foreground mt-1">
            {currentActivePeriod.totalTxns || 0} total payments
          </p>
        </div>

        {/* Cash Revenue */}
        <div className="stat-card border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <p className="text-2xs font-bold text-muted-foreground uppercase tracking-wider">Cash ({currentActivePeriod.name})</p>
            <Banknote className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-500 mt-1.5 tabular-nums">{formatCurrency(cashData.totalAmount)}</p>
          <p className="text-2xs text-muted-foreground mt-1">
            {cashData.count} txns · <span className="font-semibold text-emerald-500">{cashPercent}%</span> of revenue
          </p>
        </div>

        {/* UPI Revenue */}
        <div className="stat-card border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <p className="text-2xs font-bold text-muted-foreground uppercase tracking-wider">UPI ({currentActivePeriod.name})</p>
            <QrCode className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-indigo-500 mt-1.5 tabular-nums">{formatCurrency(upiData.totalAmount)}</p>
          <p className="text-2xs text-muted-foreground mt-1">
            {upiData.count} txns · <span className="font-semibold text-indigo-500">{upiPercent}%</span> of revenue
          </p>
        </div>

        {/* Seats Occupied */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-2xs font-bold text-muted-foreground uppercase tracking-wider">Seats Occupied</p>
            <Grid3X3 className="w-4 h-4 text-info" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-1.5 tabular-nums">{occupied} / {occupancy?.length || 0}</p>
          <p className="text-2xs text-muted-foreground mt-1">
            {occupancy?.length ? Math.round((occupied / occupancy.length) * 100) : 0}% occupancy rate
          </p>
        </div>

        {/* Expiring */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-2xs font-bold text-muted-foreground uppercase tracking-wider">Expiring (14d)</p>
            <Clock className="w-4 h-4 text-warning" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-1.5 tabular-nums">{expiring?.length || 0}</p>
          <p className="text-2xs text-muted-foreground mt-1">Need renewal follow-up</p>
        </div>
      </div>

      {/* Side-by-Side Monthly (July 2026) vs 2026 Overall Comparison Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* July 2026 Card */}
        <div className="card p-5 border-l-4 border-l-brand-500 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-500" />
              <div>
                <h3 className="font-bold text-foreground text-base">July 2026 Payment Report</h3>
                <p className="text-xs text-muted-foreground">Current Month Revenue & Modes</p>
              </div>
            </div>
            <span className="badge badge-blue">This Month</span>
          </div>

          <div className="grid grid-cols-3 gap-3 my-4">
            <div className="p-3 bg-surface-2 rounded-xl text-center border border-border">
              <p className="text-2xs text-muted-foreground font-medium">Total July</p>
              <p className="text-base font-bold text-foreground mt-0.5">{formatCurrency(monthData.totalRevenue)}</p>
              <p className="text-2xs text-muted-foreground">{monthData.totalTxns} txns</p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-center border border-emerald-500/20">
              <p className="text-2xs text-emerald-500 font-medium">July Cash</p>
              <p className="text-base font-bold text-emerald-500 mt-0.5">{formatCurrency(monthData.methods.cash.totalAmount)}</p>
              <p className="text-2xs text-emerald-500">{monthData.cashPercent}% share</p>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl text-center border border-indigo-500/20">
              <p className="text-2xs text-indigo-500 font-medium">July UPI</p>
              <p className="text-base font-bold text-indigo-500 mt-0.5">{formatCurrency(monthData.methods.upi.totalAmount)}</p>
              <p className="text-2xs text-indigo-500">{monthData.upiPercent}% share</p>
            </div>
          </div>
        </div>

        {/* 2026 Overall Card */}
        <div className="card p-5 border-l-4 border-l-purple-500 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-500" />
              <div>
                <h3 className="font-bold text-foreground text-base">2026 Overall Payment Report</h3>
                <p className="text-xs text-muted-foreground">Full Year 2026 Collections</p>
              </div>
            </div>
            <span className="badge badge-purple">Full Year 2026</span>
          </div>

          <div className="grid grid-cols-3 gap-3 my-4">
            <div className="p-3 bg-surface-2 rounded-xl text-center border border-border">
              <p className="text-2xs text-muted-foreground font-medium">2026 Overall</p>
              <p className="text-base font-bold text-foreground mt-0.5">{formatCurrency(yearData.totalRevenue)}</p>
              <p className="text-2xs text-muted-foreground">{yearData.totalTxns} txns</p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-center border border-emerald-500/20">
              <p className="text-2xs text-emerald-500 font-medium">2026 Cash</p>
              <p className="text-base font-bold text-emerald-500 mt-0.5">{formatCurrency(yearData.methods.cash.totalAmount)}</p>
              <p className="text-2xs text-emerald-500">{yearData.cashPercent}% share</p>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl text-center border border-indigo-500/20">
              <p className="text-2xs text-indigo-500 font-medium">2026 UPI</p>
              <p className="text-base font-bold text-indigo-500 mt-0.5">{formatCurrency(yearData.methods.upi.totalAmount)}</p>
              <p className="text-2xs text-indigo-500">{yearData.upiPercent}% share</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown Widget for Selected Period */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-title">Payment Method Breakdown — {currentActivePeriod.name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Ratio of Cash, UPI, and Card transactions for {currentActivePeriod.name}</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-foreground font-medium">Cash</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-indigo-500" />
              <span className="text-foreground font-medium">UPI</span>
            </div>
            {cardData.totalAmount > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-foreground font-medium">Card</span>
              </div>
            )}
          </div>
        </div>

        {/* Proportional Bar */}
        <div className="w-full bg-surface-2 rounded-full h-3.5 overflow-hidden flex">
          <div
            className="bg-emerald-500 transition-all duration-500 h-full"
            style={{ width: `${cashPercent}%` }}
            title={`Cash: ${formatCurrency(cashData.totalAmount)} (${cashPercent}%)`}
          />
          <div
            className="bg-indigo-500 transition-all duration-500 h-full"
            style={{ width: `${upiPercent}%` }}
            title={`UPI: ${formatCurrency(upiData.totalAmount)} (${upiPercent}%)`}
          />
          <div
            className="bg-amber-500 transition-all duration-500 h-full"
            style={{ width: `${cardPercent}%` }}
            title={`Card: ${formatCurrency(cardData.totalAmount)} (${cardPercent}%)`}
          />
        </div>

        {/* Payment Mode Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Cash */}
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Cash Collections</p>
                <p className="text-base font-bold text-foreground">{formatCurrency(cashData.totalAmount)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-emerald-500">{cashPercent}%</p>
              <p className="text-2xs text-muted-foreground">{cashData.count} txns</p>
            </div>
          </div>

          {/* UPI */}
          <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">UPI Collections</p>
                <p className="text-base font-bold text-foreground">{formatCurrency(upiData.totalAmount)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-indigo-500">{upiPercent}%</p>
              <p className="text-2xs text-muted-foreground">{upiData.count} txns</p>
            </div>
          </div>

          {/* Card */}
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Card Collections</p>
                <p className="text-base font-bold text-foreground">{formatCurrency(cardData.totalAmount)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-amber-500">{cardPercent}%</p>
              <p className="text-2xs text-muted-foreground">{cardData.count} txns</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart with Cash vs UPI Breakdown */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="section-title">Monthly Revenue Trend (Cash vs UPI)</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Stacked breakdown of monthly collections by payment method</p>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend || []} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-5)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--surface-3)', border: '1px solid var(--surface-5)', borderRadius: '12px', color: 'var(--foreground)', fontSize: '12px' }}
                formatter={(value: any, name: any) => [
                  formatCurrency(Number(value)),
                  name === 'cash' ? '💵 Cash' : name === 'upi' ? '📱 UPI' : name === 'card' ? '💳 Card' : name,
                ]}
              />
              <Legend
                verticalAlign="top"
                align="right"
                height={36}
                formatter={(value) => (
                  <span className="text-xs font-medium text-foreground capitalize">
                    {value === 'cash' ? 'Cash' : value === 'upi' ? 'UPI' : value === 'card' ? 'Card' : value}
                  </span>
                )}
              />
              <Bar dataKey="cash" name="cash" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} maxBarSize={50} />
              <Bar dataKey="upi" name="upi" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} maxBarSize={50} />
              <Bar dataKey="card" name="card" stackId="a" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Monthly Cash vs UPI Breakdown Table */}
      <div className="card p-5">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-500" />
          Monthly Collection Breakdown Table
        </h2>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Cash Collected</th>
                <th>UPI Collected</th>
                <th>Card Collected</th>
                <th>Total Revenue</th>
                <th>Transactions</th>
              </tr>
            </thead>
            <tbody>
              {(trend || []).map((row: any) => (
                <tr key={row.month}>
                  <td className="font-semibold text-foreground">{row.month}</td>
                  <td className="text-emerald-500 font-medium">{formatCurrency(row.cash || 0)}</td>
                  <td className="text-indigo-500 font-medium">{formatCurrency(row.upi || 0)}</td>
                  <td className="text-amber-500 font-medium">{formatCurrency(row.card || 0)}</td>
                  <td className="font-bold text-foreground">{formatCurrency(row.revenue || 0)}</td>
                  <td>{row.transactions || 0} txns</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Activity & Collection Breakdown Table */}
      {summary?.staffBreakdown && summary.staffBreakdown.length > 0 && (
        <div className="card p-5">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-500" />
            Staff Data & Collections Breakdown (Owner, Manager, Receptionist)
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Summary of students registered and fee payments collected by each staff user in the library.
          </p>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Staff User</th>
                  <th>Role</th>
                  <th>Students Registered</th>
                  <th>Total Fee Collected</th>
                  <th>Payments Processed</th>
                </tr>
              </thead>
              <tbody>
                {summary.staffBreakdown.map((staff: any) => (
                  <tr key={staff.userId || staff.userName}>
                    <td>
                      <p className="font-semibold text-foreground">{staff.userName}</p>
                      <p className="text-xs text-muted-foreground">{staff.email || '—'}</p>
                    </td>
                    <td>
                      <span className="badge badge-blue capitalize">{staff.role}</span>
                    </td>
                    <td className="font-bold text-foreground">{staff.studentsAdded} students</td>
                    <td className="font-bold text-success">{formatCurrency(staff.collectedAmount)}</td>
                    <td>{staff.paymentsCount} payments</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expiring Memberships */}
      <div className="card p-5">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-warning" />
          Expiring in 14 Days
        </h2>
        {!expiring || expiring.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">No memberships expiring in the next 14 days</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Plan</th>
                  <th>Expiry Date</th>
                  <th>Days Left</th>
                  <th>Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                {expiring.map((p: any) => {
                  const days = daysRemaining(p.endDate);
                  return (
                    <tr key={p._id}>
                      <td>
                        <p className="font-medium text-foreground">{typeof p.student === 'object' ? p.student.name : '—'}</p>
                        <p className="text-xs text-muted-foreground">{typeof p.student === 'object' ? p.student.phone : ''}</p>
                      </td>
                      <td className="capitalize">{p.plan}</td>
                      <td>{formatDate(p.endDate)}</td>
                      <td>
                        <span className={`badge ${days <= 3 ? 'badge-red' : 'badge-yellow'}`}>
                          {days <= 0 ? 'Expired' : `${days} days`}
                        </span>
                      </td>
                      <td className="text-success font-medium">{formatCurrency(p.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
