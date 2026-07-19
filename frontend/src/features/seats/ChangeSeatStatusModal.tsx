import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Wrench, CheckCircle2, Bookmark, UserCheck, UserX, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/axios';
import { Seat } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { SeatStatusBadge } from '../../components/ui/Badge';

interface ChangeSeatStatusModalProps {
  seat: Seat;
  onClose: () => void;
  onAssignClick?: () => void;
  onReleaseClick?: () => void;
  onRemoveClick?: () => void;
  onSuccess: () => void;
}

export function ChangeSeatStatusModal({
  seat,
  onClose,
  onAssignClick,
  onReleaseClick,
  onRemoveClick,
  onSuccess,
}: ChangeSeatStatusModalProps) {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>(seat.status);

  const mutation = useMutation({
    mutationFn: async (status: string) => {
      const { data } = await api.put(`/seats/${seat._id}`, { status });
      return data.data;
    },
    onSuccess: (updatedSeat) => {
      toast.success(`Seat ${seat.seatNumber} status updated to ${updatedSeat.status.toUpperCase()}`);
      queryClient.invalidateQueries({ queryKey: ['seats'] });
      onSuccess();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update seat status';
      toast.error(msg);
    },
  });

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === seat.status) return;
    mutation.mutate(newStatus);
  };

  return (
    <Modal open={true} onClose={onClose} title={`Seat Situation — ${seat.seatNumber}`}>
      <div className="space-y-5">
        {/* Seat Summary Box */}
        <div className="p-4 bg-surface-2 rounded-xl border border-border flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Seat Number</p>
            <p className="text-lg font-bold text-foreground font-mono">{seat.seatNumber}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Floor {seat.floor} · Section {seat.section} · {seat.type}</p>
          </div>
          <div>
            <SeatStatusBadge status={seat.status} />
          </div>
        </div>

        {/* Status Actions Options */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Change Seat Situation
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Mark Available */}
            <button
              type="button"
              disabled={seat.status === 'available' || mutation.isPending}
              onClick={() => handleStatusChange('available')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                seat.status === 'available'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 cursor-default font-semibold'
                  : 'border-border hover:border-emerald-500/50 hover:bg-emerald-500/5 text-foreground'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-medium">Available</span>
            </button>

            {/* Mark Maintenance */}
            <button
              type="button"
              disabled={seat.status === 'maintenance' || mutation.isPending}
              onClick={() => handleStatusChange('maintenance')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                seat.status === 'maintenance'
                  ? 'border-red-500 bg-red-500/10 text-red-500 cursor-default font-semibold'
                  : 'border-border hover:border-red-500/50 hover:bg-red-500/5 text-foreground'
              }`}
            >
              <Wrench className="w-5 h-5 text-red-500" />
              <span className="text-xs font-medium">Maintenance</span>
            </button>

            {/* Mark Reserved */}
            <button
              type="button"
              disabled={seat.status === 'reserved' || mutation.isPending}
              onClick={() => handleStatusChange('reserved')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                seat.status === 'reserved'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-500 cursor-default font-semibold'
                  : 'border-border hover:border-amber-500/50 hover:bg-amber-500/5 text-foreground'
              }`}
            >
              <Bookmark className="w-5 h-5 text-amber-500" />
              <span className="text-xs font-medium">Reserved</span>
            </button>
          </div>
        </div>

        {/* Student Assignment Actions */}
        <div className="pt-3 border-t border-border space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Student Assignment
          </p>
          <div className="flex gap-2">
            {seat.status === 'occupied' && onReleaseClick && (
              <Button
                variant="danger"
                className="w-full"
                leftIcon={<UserX className="w-4 h-4" />}
                onClick={onReleaseClick}
              >
                Release Student
              </Button>
            )}

            {onAssignClick && (
              <Button
                variant="primary"
                className="w-full"
                leftIcon={<UserCheck className="w-4 h-4" />}
                onClick={onAssignClick}
              >
                {seat.status === 'occupied' ? 'Reassign Student' : 'Assign Student'}
              </Button>
            )}
          </div>
        </div>

        {/* Footer with Remove Seat Option */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          {onRemoveClick ? (
            <Button
              variant="ghost"
              className="text-danger hover:bg-danger/10 hover:text-danger gap-1.5"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={onRemoveClick}
            >
              Remove Seat
            </Button>
          ) : <div />}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

