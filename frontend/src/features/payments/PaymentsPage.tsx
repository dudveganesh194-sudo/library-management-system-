import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Receipt, FileText } from 'lucide-react';
import { api } from '../../lib/axios';
import { Payment } from '../../types';
import { formatDate, formatCurrency, formatStudentId } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { PaymentStatusBadge } from '../../components/ui/Badge';
import { PaymentForm } from './PaymentForm';
import { useAuth } from '../../store/auth.context';
import toast from 'react-hot-toast';

export function PaymentsPage() {
  const { user } = useAuth();
  const isReceptionist = user?.role === 'receptionist';
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMethod, setFilterMethod] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['payments', user?.libraryId || user?._id, page, filterStatus, filterMethod],
    queryFn: async () => {
      const { data } = await api.get('/payments', {
        params: { page, limit: 20, status: filterStatus || undefined, method: filterMethod || undefined },
      });
      return data;
    },
  });

  const payments: Payment[] = data?.data || [];
  const meta = data?.meta;

  const colCount = isReceptionist ? 8 : 9;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payments</h1>
          <p className="text-slate-500 text-sm mt-0.5">{meta?.total || 0} total records</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setAddOpen(true)}>
          Record Payment
        </Button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <select className="input py-1.5 text-sm w-auto" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
        <select className="input py-1.5 text-sm w-auto" value={filterMethod} onChange={(e) => { setFilterMethod(e.target.value); setPage(1); }}>
          <option value="">All Methods</option>
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="card">Card</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Receipt #</th>
              <th>Student</th>
              {!isReceptionist && <th>Amount</th>}
              <th>Plan</th>
              <th>Method</th>
              <th>Period</th>
              <th>Status</th>
              <th>Collected By</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: colCount }).map((_, j) => <td key={j}><div className="skeleton h-4 w-20" /></td>)}</tr>
              ))
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="text-center py-12 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No payment records found</p>
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p._id}>
                  <td><span className="font-mono text-xs text-brand-600 dark:text-brand-300">{p.receiptNumber}</span></td>
                  <td>
                    {typeof p.student === 'object' && p.student ? (
                      <Link to={`/students/${p.student._id}`} className="group hover:underline">
                        <p className="font-medium text-foreground group-hover:text-brand-500 transition-colors">{p.student.name}</p>
                        <p className="text-xs font-mono text-brand-600 dark:text-brand-300 font-semibold">{formatStudentId(p.student.studentId)}</p>
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  {!isReceptionist && (
                    <td><span className="font-semibold text-success">{formatCurrency(p.amount)}</span></td>
                  )}
                  <td className="capitalize">{p.plan}</td>
                  <td>
                    <span className={`badge ${p.method === 'cash' ? 'badge-green' : p.method === 'upi' ? 'badge-blue' : 'badge-purple'}`}>
                      {p.method.toUpperCase()}
                    </span>
                  </td>
                  <td className="text-xs text-muted-foreground">{formatDate(p.startDate)} → {formatDate(p.endDate)}</td>
                  <td><PaymentStatusBadge status={p.status} /></td>
                  <td className="text-muted-foreground text-xs">
                    {typeof p.collectedBy === 'object' && p.collectedBy ? (
                      <span className="flex items-center gap-1">
                        <span>{p.collectedBy.name}</span>
                        {p.collectedBy.role && (
                          <span className="text-2xs px-1.5 py-0.5 rounded bg-surface-3 text-muted-foreground font-medium capitalize">
                            {p.collectedBy.role}
                          </span>
                        )}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {meta.page} of {meta.totalPages}</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="secondary" size="sm" disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Record Payment" size="lg">
        <PaymentForm
          onSuccess={() => { setAddOpen(false); queryClient.invalidateQueries({ queryKey: ['payments'] }); }}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>
    </div>
  );
}
