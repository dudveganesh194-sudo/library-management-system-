/**
 * ResetOwnerPasswordModal — allows Super Admin to reset a library owner's password.
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { KeyRound, Eye, EyeOff, X } from 'lucide-react';
import toast from 'react-hot-toast';

import { resetLibraryOwnerPassword } from '../api/super-admin.api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { Library } from '../../../types';

interface ResetOwnerPasswordModalProps {
  open: boolean;
  onClose: () => void;
  library: Library | null;
}

export function ResetOwnerPasswordModal({ open, onClose, library }: ResetOwnerPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useMutation({
    mutationFn: (pass: string) => {
      if (!library) throw new Error('No library selected');
      return resetLibraryOwnerPassword(library._id, pass);
    },
    onSuccess: () => {
      toast.success(`Owner password for "${library?.name}" reset successfully!`);
      setNewPassword('');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to reset owner password');
    },
  });

  if (!open || !library) return null;

  const owner = typeof library.owner === 'object' ? library.owner : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    mutation.mutate(newPassword);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-md p-6 space-y-4 shadow-xl border border-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 text-foreground">
            <KeyRound className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold">Reset Owner Password</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Box */}
        <div className="p-3 bg-surface-2 rounded-lg border border-border text-xs space-y-1">
          <p className="text-muted-foreground">
            Library: <span className="font-semibold text-foreground">{library.name}</span>
          </p>
          <p className="text-muted-foreground">
            Owner Email: <span className="font-semibold text-foreground">{owner?.email || library.email}</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              label="New Owner Password"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new strong password (min 8 chars)"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Reset Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
