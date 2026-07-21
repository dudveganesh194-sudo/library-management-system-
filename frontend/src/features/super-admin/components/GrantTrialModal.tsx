/**
 * GrantTrialModal — modal allowing Super Admin to grant or extend a free trial
 * for any library with presets (15 days, 30 days) or a custom duration in days.
 */

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Gift, Calendar, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { grantTrial } from '../api/super-admin.api';
import { formatDate } from '../../../lib/utils';
import type { Library } from '../../../types';

interface GrantTrialModalProps {
  open: boolean;
  onClose: () => void;
  library: Library | null;
}

export function GrantTrialModal({ open, onClose, library }: GrantTrialModalProps) {
  const queryClient = useQueryClient();

  const [preset, setPreset] = useState<'15' | '30' | 'custom'>('15');
  const [customDays, setCustomDays] = useState<number>(15);

  const effectiveDays = preset === 'custom' ? customDays : parseInt(preset, 10);

  useEffect(() => {
    if (preset === '15') setCustomDays(15);
    if (preset === '30') setCustomDays(30);
  }, [preset]);

  const mutation = useMutation({
    mutationFn: () => grantTrial(library!._id, effectiveDays),
    onSuccess: () => {
      toast.success(`Free trial of ${effectiveDays} days granted to "${library?.name}"!`);
      queryClient.invalidateQueries({ queryKey: ['super-admin'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to grant free trial');
    },
  });

  if (!library) return null;

  // Calculate new expiry date
  const now = new Date();
  const calculatedExpiry = new Date(now.getTime() + (effectiveDays || 0) * 24 * 60 * 60 * 1000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveDays || effectiveDays < 1) {
      toast.error('Please enter a valid number of days (at least 1 day)');
      return;
    }
    mutation.mutate();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Grant Free Trial — ${library.name}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Banner */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
          <Sparkles className="w-5 h-5 flex-shrink-0" />
          <p className="text-xs leading-relaxed">
            Grant full feature access under a Free Trial. Super Admin can extend or update trial periods at any time.
          </p>
        </div>

        {/* Preset Selectors */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Gift className="w-4 h-4 text-purple-500" />
            Select Free Trial Duration
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                setPreset('15');
                setCustomDays(15);
              }}
              className={`p-3 rounded-xl border text-sm font-semibold text-center transition-all ${
                preset === '15'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20 ring-2 ring-purple-600/30'
                  : 'bg-surface-2 text-foreground border-border hover:bg-surface-3'
              }`}
            >
              15 Days
              <span className="block text-2xs font-normal opacity-80 mt-0.5">Popular</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPreset('30');
                setCustomDays(30);
              }}
              className={`p-3 rounded-xl border text-sm font-semibold text-center transition-all ${
                preset === '30'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20 ring-2 ring-purple-600/30'
                  : 'bg-surface-2 text-foreground border-border hover:bg-surface-3'
              }`}
            >
              30 Days
              <span className="block text-2xs font-normal opacity-80 mt-0.5">Full Month</span>
            </button>

            <button
              type="button"
              onClick={() => setPreset('custom')}
              className={`p-3 rounded-xl border text-sm font-semibold text-center transition-all ${
                preset === 'custom'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20 ring-2 ring-purple-600/30'
                  : 'bg-surface-2 text-foreground border-border hover:bg-surface-3'
              }`}
            >
              Custom
              <span className="block text-2xs font-normal opacity-80 mt-0.5">Flexible</span>
            </button>
          </div>
        </div>

        {/* Custom Days Input */}
        {preset === 'custom' && (
          <div className="animate-fade-in">
            <Input
              label="Enter Custom Trial Days"
              type="number"
              min={1}
              max={365}
              value={customDays}
              onChange={(e) => setCustomDays(parseInt(e.target.value, 10) || 0)}
              placeholder="e.g. 7, 45, 60, 90"
              required
            />
          </div>
        )}

        {/* Dynamic Expiry Preview */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-surface-3 border border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">New Trial Expiry Date:</span>
          </div>
          <span className="text-xs font-bold text-foreground bg-surface-1 px-2.5 py-1 rounded-md border border-border">
            {formatDate(calculatedExpiry.toISOString())}
          </span>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending} className="bg-purple-600 hover:bg-purple-700 text-white">
            Grant {effectiveDays} Days Trial
          </Button>
        </div>
      </form>
    </Modal>
  );
}
