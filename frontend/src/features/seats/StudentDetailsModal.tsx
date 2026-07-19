import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Calendar, CreditCard, Loader2, Clock, PhoneCall, MessageCircle } from 'lucide-react';
import { api } from '../../lib/axios';
import { Seat, Student, Payment } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { formatDate, formatStudentId, getWhatsAppLink, getCallLink } from '../../lib/utils';

interface StudentDetailsModalProps {
  seat: Seat;
  student: Student;
  onClose: () => void;
  onReleaseSeat: () => void;
  onChangeSeat: () => void;
}

const PLAN_LABELS: Record<string, string> = {
  monthly: 'Monthly Plan',
  quarterly: 'Quarterly Plan',
  'half-yearly': 'Half-Yearly Plan',
  yearly: 'Yearly Plan',
  custom: 'Custom Plan',
};

export function StudentDetailsModal({
  seat,
  student,
  onClose,
  onReleaseSeat,
  onChangeSeat,
}: StudentDetailsModalProps) {
  const navigate = useNavigate();

  // Fetch payments for this student to get the latest expiry date
  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ['student-payments-modal', student._id],
    queryFn: async () => {
      const { data } = await api.get(`/students/${student._id}/payments`);
      return data.data;
    },
  });

  const latestPayment = payments?.[0]; // Payments are sorted by createdAt: -1 in the service
  const expiryDate = latestPayment ? latestPayment.endDate : null;

  return (
    <Modal open={true} onClose={onClose} title={`Seat ${seat.seatNumber} — Student Details`} size="md">
      <div className="space-y-6">
        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => { onClose(); navigate(`/students/${student._id}`); }}
            className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl cursor-pointer hover:border-brand-500/50 hover:bg-brand-500/5 transition-all group"
          >
            <User className="w-5 h-5 text-brand-500 shrink-0 group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-2xs text-muted-foreground uppercase tracking-wider">Student Name & ID</p>
              <p className="text-sm font-semibold text-foreground group-hover:text-brand-500 transition-colors">
                {student.name} <span className="text-xs font-mono font-normal text-muted-foreground">({formatStudentId(student.studentId)})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-brand-500 shrink-0" />
              <div>
                <p className="text-2xs text-muted-foreground uppercase tracking-wider">Phone</p>
                <p className="text-sm font-semibold text-foreground font-mono">{student.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <a
                href={getCallLink(student.phone)}
                className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors"
                title={`Call ${student.name}`}
              >
                <PhoneCall className="w-4 h-4" />
              </a>
              <a
                href={getWhatsAppLink(student.phone, student.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors"
                title={`WhatsApp message ${student.name}`}
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
            <CreditCard className="w-5 h-5 text-brand-500 shrink-0" />
            <div>
              <p className="text-2xs text-muted-foreground uppercase tracking-wider">Membership Plan</p>
              <p className="text-sm font-semibold text-foreground capitalize">
                {PLAN_LABELS[student.plan] || student.plan}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
            <Clock className="w-5 h-5 text-brand-500 shrink-0" />
            <div>
              <p className="text-2xs text-muted-foreground uppercase tracking-wider">Assigned Shift / Slot</p>
              <p className="text-sm font-semibold text-foreground">
                {student.timeSlot || (student.shiftHours ? `${student.shiftHours} Hours` : 'Full Day (24 hrs)')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
            <Calendar className="w-5 h-5 text-brand-500 shrink-0" />
            <div className="flex-1">
              <p className="text-2xs text-muted-foreground uppercase tracking-wider">Plan Expiration</p>
              {isLoading ? (
                <Loader2 className="w-4 h-4 text-slate-500 animate-spin mt-1" />
              ) : expiryDate ? (
                <p className="text-sm font-semibold text-foreground">{formatDate(expiryDate)}</p>
              ) : (
                <p className="text-sm font-semibold text-muted-foreground">No payment active</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-border">
          <Button
            variant="secondary"
            className="w-full text-xs font-semibold py-2"
            onClick={() => navigate(`/students/${student._id}`)}
          >
            View Profile
          </Button>
          <Button
            variant="secondary"
            className="w-full text-xs font-semibold py-2"
            onClick={onChangeSeat}
          >
            Change Seat
          </Button>
          <Button
            variant="secondary"
            className="w-full text-xs font-semibold py-2"
            onClick={() => navigate('/payments')}
          >
            Renew
          </Button>
          <Button
            variant="danger"
            className="w-full text-xs font-semibold py-2"
            onClick={onReleaseSeat}
          >
            Release Seat
          </Button>
        </div>
      </div>
    </Modal>
  );
}
