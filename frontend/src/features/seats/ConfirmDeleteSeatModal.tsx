import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Seat } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { Trash2, AlertTriangle } from 'lucide-react';

interface ConfirmDeleteSeatModalProps {
  seat: Seat;
  onClose: () => void;
  onSuccess: () => void;
}

export function ConfirmDeleteSeatModal({ seat, onClose, onSuccess }: ConfirmDeleteSeatModalProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => api.delete(`/seats/${seat._id}`),
    onSuccess: () => {
      toast.success(`Seat ${seat.seatNumber} removed successfully`);
      queryClient.invalidateQueries({ queryKey: ['seats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      onSuccess();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to remove seat';
      toast.error(msg);
    },
  });

  return (
    <Modal open={true} onClose={onClose} title="Remove Seat" size="sm">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>Warning: This action will permanently remove this seat from the system.</span>
        </div>

        <p className="text-sm text-foreground">
          Are you sure you want to remove <strong className="font-mono">{seat.seatNumber}</strong> (Floor {seat.floor}, Section {seat.section})?
        </p>

        {seat.status === 'occupied' && (
          <p className="text-xs text-amber-500 font-medium">
            Note: This seat is currently occupied. You must release the seat before removing it.
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            leftIcon={<Trash2 className="w-4 h-4" />}
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Remove Seat
          </Button>
        </div>
      </div>
    </Modal>
  );
}
