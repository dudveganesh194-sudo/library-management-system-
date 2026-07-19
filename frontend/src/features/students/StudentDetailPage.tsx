import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Plus, Pencil, PhoneCall, MessageCircle, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/axios';
import { Student, Payment } from '../../types';
import { formatDate, formatCurrency, formatStudentId, getWhatsAppLink, getCallLink } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { StudentStatusBadge, PaymentStatusBadge } from '../../components/ui/Badge';
import { StudentForm } from './StudentForm';
import { PaymentForm } from '../payments/PaymentForm';
import { useAuth } from '../../store/auth.context';

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isReceptionist = user?.role === 'receptionist';
  const canDelete = user?.role === 'owner' || user?.role === 'manager' || user?.role === 'super_admin';

  const [editOpen, setEditOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/students/${id}`),
    onSuccess: () => {
      toast.success('Student profile deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['seats'] });
      navigate('/students');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to delete student profile';
      toast.error(msg);
    },
  });

  const { data: student, isLoading: studentLoading } = useQuery<Student>({
    queryKey: ['student', id],
    queryFn: async () => {
      const { data } = await api.get(`/students/${id}`);
      return data.data;
    },
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['student-payments', id],
    queryFn: async () => {
      const { data } = await api.get(`/students/${id}/payments`);
      return data.data;
    },
    enabled: !!id,
  });

  const payments: Payment[] = paymentsData || [];

  if (studentLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-32" />
        <div className="card p-6 space-y-4">
          <div className="skeleton h-12 w-48" />
          <div className="skeleton h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Student not found</p>
        <Link to="/students" className="btn btn-secondary mt-4">Back to Students</Link>
      </div>
    );
  }

  const seatNumber = typeof student.seatId === 'object' && student.seatId ? student.seatId.seatNumber : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <div>
        <Link to="/students" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Students
        </Link>
      </div>

      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center text-xl font-bold text-white shadow-glow-sm">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">{student.name}</h1>
                <StudentStatusBadge status={student.status} />
              </div>
              <p className="text-xs font-mono text-brand-500 font-semibold mt-0.5">{formatStudentId(student.studentId)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canDelete && (
              <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setDeleteConfirmOpen(true)}>
                Delete Profile
              </Button>
            )}
            <Button variant="secondary" leftIcon={<Pencil className="w-4 h-4" />} onClick={() => setEditOpen(true)}>
              Edit Profile
            </Button>
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setPaymentOpen(true)}>
              Record Payment
            </Button>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact info */}
        <div className="card p-5 space-y-4">
          <h2 className="section-title">Personal Info</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 shrink-0 text-brand-500" />
                <span className="text-foreground font-mono">{student.phone}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href={getCallLink(student.phone)}
                  className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors text-xs font-semibold flex items-center gap-1"
                  title={`Call ${student.name}`}
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Call
                </a>
                <a
                  href={getWhatsAppLink(student.phone, student.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors text-xs font-semibold flex items-center gap-1"
                  title={`WhatsApp ${student.name}`}
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </a>
              </div>
            </div>
            {student.email && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Mail className="w-4 h-4 shrink-0 text-brand-500" />
                <span className="text-foreground">{student.email}</span>
              </div>
            )}
            {student.address && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0 text-brand-500" />
                <span className="text-foreground">{student.address}</span>
              </div>
            )}
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Calendar className="w-4 h-4 shrink-0 text-brand-500" />
              <span>Joined {formatDate(student.joinDate)}</span>
            </div>
          </div>

          <hr className="border-border" />

          <div>
            <p className="text-2xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Plan</p>
            <p className="text-sm font-semibold capitalize text-foreground">{student.plan}</p>
          </div>

          <div>
            <p className="text-2xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Shift / Time Slot</p>
            <p className="text-sm font-semibold text-foreground">
              {student.timeSlot || (student.shiftHours ? `${student.shiftHours} Hours Shift` : 'Full Day (24 Hours)')}
            </p>
          </div>

          <div>
            <p className="text-2xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Assigned Seat</p>
            {seatNumber ? (
              <span className="badge badge-blue font-mono font-bold text-xs">{seatNumber}</span>
            ) : (
              <span className="text-xs text-muted-foreground">No seat assigned</span>
            )}
          </div>
        </div>

        {/* Payment History */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Payment History</h2>
              <Button size="sm" variant="ghost" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setPaymentOpen(true)}>
                Add Payment
              </Button>
            </div>

            {payments.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">No payments recorded</p>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Receipt</th>
                      {!isReceptionist && <th>Amount</th>}
                      <th>Plan</th>
                      <th>Method</th>
                      <th>Period</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p._id}>
                        <td><span className="font-mono text-xs text-brand-600 dark:text-brand-300">{p.receiptNumber}</span></td>
                        {!isReceptionist && (
                          <td className="font-semibold text-success">{formatCurrency(p.amount)}</td>
                        )}
                        <td className="capitalize">{p.plan}</td>
                        <td className="capitalize">{p.method}</td>
                        <td className="text-xs text-muted-foreground">{formatDate(p.startDate)} → {formatDate(p.endDate)}</td>
                        <td><PaymentStatusBadge status={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Student" size="lg">
        <StudentForm
          student={student}
          onSuccess={() => { setEditOpen(false); queryClient.invalidateQueries({ queryKey: ['student', id] }); }}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      <Modal open={paymentOpen} onClose={() => setPaymentOpen(false)} title="Record Payment" size="lg">
        <PaymentForm
          studentId={student._id}
          onSuccess={() => { setPaymentOpen(false); queryClient.invalidateQueries({ queryKey: ['student-payments', id] }); }}
          onCancel={() => setPaymentOpen(false)}
        />
      </Modal>

      <Modal open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Confirm Permanent Deletion" size="md">
        <div className="space-y-4">
          {/* Caution Alert Banner */}
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-red-500">CAUTION: Permanent Action</h4>
              <p className="text-xs text-red-400/90 leading-relaxed">
                You are about to permanently delete <strong className="text-foreground">{student.name}</strong> ({formatStudentId(student.studentId)}).
                This action will erase student registration details, delete payment history, and unassign seat {seatNumber ? <span className="font-bold text-brand-500 font-mono">"{seatNumber}"</span> : 'allocation'}.
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Please confirm if you want to proceed. This operation <strong>CANNOT BE UNDONE</strong>.
          </p>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setDeleteConfirmOpen(false)}>
              Keep Student Profile
            </Button>
            <Button
              type="button"
              variant="danger"
              leftIcon={<Trash2 className="w-4 h-4" />}
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              Yes, Delete Student Profile
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
