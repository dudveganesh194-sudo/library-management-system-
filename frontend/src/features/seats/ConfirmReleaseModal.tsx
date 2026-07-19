import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Seat } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';

interface ConfirmReleaseModalProps {
  seat: Seat;
  onClose: () => void;
  onSuccess: () => void;
}

export function ConfirmReleaseModal({ seat, onClose, onSuccess }: ConfirmReleaseModalProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => api.patch(`/seats/${seat._id}/release`),
    onSuccess: () => {
      toast.success(`Seat ${seat.seatNumber} has been released`);
      // Invalidate queries to refresh UI immediately
      queryClient.invalidateQueries({ queryKey: ['seats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      onSuccess();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to release seat';
      toast.error(msg);
    },
  });

  return (
    <Modal open={true} onClose={onClose} title="Confirm Seat Release" size="sm">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>Warning: This action will release the seat immediately.</span>
        </div>

        <p className="text-sm text-foreground">
          Are you sure you want to release **Seat {seat.seatNumber}**?
        </p>
        <p className="text-xs text-muted-foreground">
          The assigned student will be unlinked from this seat. Their enrollment profile and billing records will not be deleted.
        </p>

        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Release Seat
          </Button>
        </div>
      </div>
    </Modal>
  );
}
