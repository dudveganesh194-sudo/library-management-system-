import React, { useState } from 'react';
import { Building2, AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Library } from '../../../types';
import { markLibraryLeft } from '../api/super-admin.api';
import toast from 'react-hot-toast';

interface MarkLibraryLeftModalProps {
  library: Library;
  onSuccess: () => void;
  onCancel: () => void;
}

const PREDEFINED_LIBRARY_REASONS = [
  'Business Closed / Shut Down',
  'Switched to Alternative Software',
  'Pricing / Subscription Fee Issue',
  'Owner Request / Discontinued',
  'Non-Responsive / Inactive',
  'Other',
];

export function MarkLibraryLeftModal({ library, onSuccess, onCancel }: MarkLibraryLeftModalProps) {
  const [leaveDate, setLeaveDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedReason, setSelectedReason] = useState(PREDEFINED_LIBRARY_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const finalReason = selectedReason === 'Other' ? (customReason || 'Other') : selectedReason;

    try {
      await markLibraryLeft(library._id, {
        leaveDate,
        leaveReason: finalReason,
      });
      toast.success(`Library "${library.name}" marked as Left / Closed`);
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to mark library as left';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Warning Banner */}
      <div className="p-4 rounded-xl bg-slate-500/10 border border-slate-500/20 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-slate-500/20 text-slate-600 dark:text-slate-400 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="text-xs space-y-1">
          <h4 className="font-bold text-foreground">Mark Library as Left / Closed</h4>
          <p className="text-muted-foreground">
            Library <span className="font-semibold text-foreground">{library.name}</span> will be marked as <span className="font-semibold text-slate-600 dark:text-slate-400">Left / Closed</span>.
          </p>
          <p className="text-slate-600 dark:text-slate-400 font-semibold">
            🔒 All owner and staff user logins for this library will be deactivated automatically.
          </p>
        </div>
      </div>

      {/* Leave Date */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
          Discontinue / Exit Date <span className="text-red-500">*</span>
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
          {PREDEFINED_LIBRARY_REASONS.map((r) => (
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
            placeholder="e.g. License transferred to another branch"
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-3 border-t border-border">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          leftIcon={<Building2 className="w-4 h-4" />}
          loading={loading}
          disabled={loading}
          className="bg-slate-700 hover:bg-slate-800 text-white"
        >
          Mark Library Left / Closed
        </Button>
      </div>
    </form>
  );
}
