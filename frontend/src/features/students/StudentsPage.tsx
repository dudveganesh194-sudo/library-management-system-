import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, Pencil, Trash2, UserCheck, Clock, AlertTriangle, Filter, PhoneCall, MessageCircle, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/axios';
import { Student } from '../../types';
import { formatDate, daysRemaining, cn, formatStudentId, getWhatsAppLink, getCallLink } from '../../lib/utils';
import { SearchInput } from '../../components/ui/SearchInput';
import { Button } from '../../components/ui/Button';
import { StudentStatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { StudentForm } from './StudentForm';
import { PaymentForm } from '../payments/PaymentForm';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/auth.context';

const PLAN_LABELS: Record<string, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  'half-yearly': 'Half-Yearly',
  yearly: 'Yearly',
  custom: 'Custom',
};

export function StudentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterExpiry, setFilterExpiry] = useState<'all' | '7days' | 'expired'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [paymentStudent, setPaymentStudent] = useState<Student | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['students', user?.libraryId || user?._id, search, page],
    queryFn: async () => {
      const { data } = await api.get('/students', { params: { search, page, limit: 20 } });
      return data;
    },
  });

  const { data: expiringList = [] } = useQuery<any[]>({
    queryKey: ['expiring-plans-students-page', user?.libraryId || user?._id],
    queryFn: async () => {
      const { data } = await api.get('/reports/expiring?days=14');
      return data.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/students/${id}`),
    onSuccess: () => {
      toast.success('Student deleted');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete student'),
  });

  const canDelete = user?.role === 'owner' || user?.role === 'manager';
  const rawStudents: Student[] = data?.data || [];
  const meta = data?.meta;

  const expiring7List = expiringList.filter((item: any) => {
    const days = daysRemaining(item.endDate);
    return days >= 0 && days <= 7;
  });

  const expiredList = expiringList.filter((item: any) => {
    const days = daysRemaining(item.endDate);
    return days < 0;
  });

  const expiring7Count = expiring7List.length;
  const expiredCount = expiredList.length;

  const expiringStudentMap = new Map<string, { days: number; endDate: string }>();
  expiringList.forEach((item: any) => {
    const sId = typeof item.student === 'object' ? item.student?._id : item.student;
    if (sId) {
      expiringStudentMap.set(sId.toString(), {
        days: daysRemaining(item.endDate),
        endDate: item.endDate,
      });
    }
  });

  const students = rawStudents.filter((student) => {
    if (filterExpiry === '7days') {
      const info = expiringStudentMap.get(student._id);
      return info && info.days >= 0 && info.days <= 7;
    }
    if (filterExpiry === 'expired') {
      const info = expiringStudentMap.get(student._id);
      return (info && info.days < 0) || student.status === 'inactive';
    }
    return true;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Students</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {meta?.total || 0} total registered students
          </p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setEditStudent(null); setModalOpen(true); }}>
          Add Student
        </Button>
      </div>

      {/* Plan Expiry Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => { setFilterExpiry(filterExpiry === '7days' ? 'all' : '7days'); setPage(1); }}
          className={cn(
            'card p-4 flex items-center justify-between cursor-pointer transition-all border-l-4 border-l-amber-500 hover:shadow-md',
            filterExpiry === '7days' && 'ring-2 ring-amber-500 bg-amber-500/5'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xs font-bold text-muted-foreground uppercase tracking-wider">Plans Expiring in 7 Days</p>
              <p className="text-2xl font-bold text-amber-500 mt-0.5 tabular-nums">{expiring7Count}</p>
            </div>
          </div>
          <span className={cn(
            'text-xs font-semibold px-2.5 py-1 rounded-full transition-colors',
            filterExpiry === '7days' ? 'bg-amber-500 text-white' : 'bg-amber-500/10 text-amber-500'
          )}>
            {filterExpiry === '7days' ? 'Filtering' : 'Show'}
          </span>
        </div>

        <div
          onClick={() => { setFilterExpiry(filterExpiry === 'expired' ? 'all' : 'expired'); setPage(1); }}
          className={cn(
            'card p-4 flex items-center justify-between cursor-pointer transition-all border-l-4 border-l-red-500 hover:shadow-md',
            filterExpiry === 'expired' && 'ring-2 ring-red-500 bg-red-500/5'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xs font-bold text-muted-foreground uppercase tracking-wider">Expired Plans</p>
              <p className="text-2xl font-bold text-red-500 mt-0.5 tabular-nums">{expiredCount}</p>
            </div>
          </div>
          <span className={cn(
            'text-xs font-semibold px-2.5 py-1 rounded-full transition-colors',
            filterExpiry === 'expired' ? 'bg-red-500 text-white' : 'bg-red-500/10 text-red-500'
          )}>
            {filterExpiry === 'expired' ? 'Filtering' : 'Show'}
          </span>
        </div>

        <div
          onClick={() => { setFilterExpiry('all'); setPage(1); }}
          className={cn(
            'card p-4 flex items-center justify-between cursor-pointer transition-all border-l-4 border-l-brand-500 hover:shadow-md',
            filterExpiry === 'all' && 'ring-2 ring-brand-500 bg-brand-500/5'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-500">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xs font-bold text-muted-foreground uppercase tracking-wider">All Students</p>
              <p className="text-2xl font-bold text-foreground mt-0.5 tabular-nums">{meta?.total || rawStudents.length}</p>
            </div>
          </div>
          <span className={cn(
            'text-xs font-semibold px-2.5 py-1 rounded-full transition-colors',
            filterExpiry === 'all' ? 'bg-brand-500 text-white' : 'bg-brand-500/10 text-brand-500'
          )}>
            {filterExpiry === 'all' ? 'Active' : 'All'}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <SearchInput placeholder="Search by name, phone, ID..." onSearch={(v) => { setSearch(v); setPage(1); }} className="max-w-sm" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            className="input py-1.5 text-sm w-auto"
            value={filterExpiry}
            onChange={(e) => { setFilterExpiry(e.target.value as any); setPage(1); }}
          >
            <option value="all">All Plans</option>
            <option value="7days">Expiring in 7 Days ({expiring7Count})</option>
            <option value="expired">Expired Plans ({expiredCount})</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>ID</th>
              <th>Phone</th>
              <th>Plan</th>
              <th>Shift & Hours</th>
              <th>Seat</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Added By</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 10 }).map((_, j) => (
                    <td key={j}><div className="skeleton h-4 w-24" /></td>
                  ))}
                </tr>
              ))
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-muted-foreground">
                  <UserCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No students found {filterExpiry !== 'all' ? 'matching the expiry filter' : ''}</p>
                  {search && <p className="text-xs mt-1">Try a different search term</p>}
                </td>
              </tr>
            ) : (
              students.map((student) => {
                const expiringInfo = expiringStudentMap.get(student._id);
                return (
                  <tr key={student._id}>
                    <td>
                      <Link to={`/students/${student._id}`} className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-xs font-bold text-white shrink-0 group-hover:scale-105 transition-transform">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground group-hover:text-brand-500 transition-colors">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.email || '—'}</p>
                        </div>
                      </Link>
                    </td>
                    <td>
                      <Link
                        to={`/students/${student._id}`}
                        className="font-mono text-xs font-bold text-brand-600 dark:text-brand-300 hover:underline hover:text-brand-500 transition-colors"
                      >
                        {formatStudentId(student.studentId)}
                      </Link>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-foreground">{student.phone}</span>
                        <div className="flex items-center gap-1">
                          <a
                            href={getCallLink(student.phone)}
                            className="p-1 rounded-md bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors"
                            title={`Call ${student.name}`}
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={getWhatsAppLink(student.phone, student.name, expiringInfo?.days)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-md bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors"
                            title={`WhatsApp message ${student.name}`}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col items-start gap-1">
                        <span className="badge-purple badge">{PLAN_LABELS[student.plan] || student.plan}</span>
                        {expiringInfo && (
                          <span className={cn(
                            'text-2xs font-semibold px-1.5 py-0.5 rounded flex items-center gap-1',
                            expiringInfo.days <= 3 ? 'bg-red-500/15 text-red-500 dark:text-red-400' : 'bg-amber-500/15 text-amber-500 dark:text-amber-400'
                          )}>
                            <Clock className="w-3 h-3" />
                            {expiringInfo.days <= 0 ? 'Expires Today' : `Expires in ${expiringInfo.days}d`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-xs">
                      {student.timeSlot ? (
                        <span className="font-semibold text-foreground bg-surface-3 px-2 py-1 rounded-md border border-border inline-block">
                          {student.timeSlot}
                        </span>
                      ) : student.shiftHours ? (
                        <span className="badge badge-blue">{student.shiftHours} Hours</span>
                      ) : (
                        <span className="text-muted-foreground">Full Day (24 hrs)</span>
                      )}
                    </td>
                    <td>
                      {typeof student.seatId === 'object' && student.seatId
                        ? <span className="font-mono text-xs text-info">{student.seatId.seatNumber}</span>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td><StudentStatusBadge status={student.status} /></td>
                    <td>{formatDate(student.joinDate)}</td>
                    <td className="text-muted-foreground text-xs">
                      {typeof student.createdBy === 'object' && student.createdBy ? (
                        <span className="flex items-center gap-1">
                          <span>{student.createdBy.name}</span>
                          {(student.createdBy as any).role && (
                            <span className="text-2xs px-1.5 py-0.5 rounded bg-surface-3 text-muted-foreground font-medium capitalize">
                              {(student.createdBy as any).role}
                            </span>
                          )}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/students/${student._id}`}>
                          <button className="btn-ghost btn btn-sm p-2"><Eye className="w-3.5 h-3.5" /></button>
                        </Link>
                        <button
                          className="btn-ghost btn btn-sm p-2 text-brand-600 dark:text-brand-300 hover:bg-brand-500/10"
                          title="Record Fee Payment"
                          onClick={() => setPaymentStudent(student)}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="btn-ghost btn btn-sm p-2"
                          onClick={() => { setEditStudent(student); setModalOpen(true); }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {canDelete && (
                          <button
                            className="btn-ghost btn btn-sm p-2 text-danger hover:text-danger"
                            onClick={() => setDeleteId(student._id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
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

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editStudent ? 'Edit Student' : 'Add Student'} size="lg">
        <StudentForm
          student={editStudent || undefined}
          onSuccess={() => {
            setModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['students'] });
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
          }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      {/* Record Payment Modal */}
      {paymentStudent && (
        <Modal open onClose={() => setPaymentStudent(null)} title={`Record Payment — ${paymentStudent.name}`} size="lg">
          <PaymentForm
            studentId={paymentStudent._id}
            onSuccess={() => {
              setPaymentStudent(null);
              queryClient.invalidateQueries({ queryKey: ['students'] });
              queryClient.invalidateQueries({ queryKey: ['payments'] });
              queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
              queryClient.invalidateQueries({ queryKey: ['revenue-trend'] });
            }}
            onCancel={() => setPaymentStudent(null)}
          />
        </Modal>
      )}

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirm Permanent Deletion" size="md">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-red-500">CAUTION: Permanent Action</h4>
              <p className="text-xs text-red-400/90 leading-relaxed">
                You are about to permanently delete this student profile.
                This action will erase student registration details, delete payment history, and unassign any allocated seat.
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Please confirm if you want to proceed. This operation <strong>CANNOT BE UNDONE</strong>.
          </p>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              variant="danger"
              leftIcon={<Trash2 className="w-4 h-4" />}
              loading={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Yes, Delete Student
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
