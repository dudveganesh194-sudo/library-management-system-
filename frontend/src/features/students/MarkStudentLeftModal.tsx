import React, { useState } from 'react';
import { UserMinus, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Student } from '../../types';
import { formatStudentId } from '../../lib/utils';
import { api } from '../../lib/axios';
import toast from 'react-hot-toast';

interface MarkStudentLeftModalProps {
  student: Student;
  onSuccess: () => void;
  onCancel: () => void;
}

const PREDEFINED_REASONS = [
  'Completed Exam Preparation',
  'Relocated / Moved to Another City',
  'Joined Another Library',
  'Fee / Financial Reason',
  'Personal / Medical Reason',
  'Other',
];

export function MarkStudentLeftModal({ student, onSuccess, onCancel }: MarkStudentLeftModalProps) {
  const [leaveDate, setLeaveDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedReason, setSelectedReason] = useState(PREDEFINED_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const finalReason = selectedReason === 'Other' ? (customReason || 'Other') : selectedReason;

    try {
      await api.post(`/students/${student._id}/leave`, {
        leaveDate,
        leaveReason: finalReason,
        notes: notes.trim() || undefined,
      });
      toast.success(`${student.name} marked as Left Library`);
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to mark student as left';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Warning & Seat Release Banner */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="text-xs space-y-1">
          <h4 className="font-bold text-foreground">Mark Student as Left Library</h4>
          <p className="text-muted-foreground">
            Student <span className="font-semibold text-foreground">{student.name}</span> ({formatStudentId(student.studentId)}) will be marked as <span className="font-semibold text-amber-600 dark:text-amber-400">Left Library</span>.
          </p>
          {student.seatId && (
            <p className="text-amber-600 dark:text-amber-400 font-semibold">
              ⚡ Assigned seat will automatically be released and set to Available.
            </p>
          )}
        </div>
      </div>

      {/* Leave Date */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
          Exit / Leave Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          required
          value={leaveDate}
          onChange={(e) => setLeaveDate(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Leave Reason Select */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
          Reason for Leaving <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedReason}
          onChange={(e) => setSelectedReason(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {PREDEFINED_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Custom Reason Input (if Other) */}
      {selectedReason === 'Other' && (
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Specify Custom Reason <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Cleared State PSC Exam"
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      )}

      {/* Additional Exit Notes */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
          Exit Notes / Remarks (Optional)
        </label>
        <textarea
          rows={3}
          placeholder="e.g. Deposit refunded, books returned, feedback..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-3 border-t border-border">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          leftIcon={<UserMinus className="w-4 h-4" />}
          loading={loading}
          disabled={loading}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          Mark as Left Library
        </Button>
      </div>
    </form>
  );
}
