import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/axios';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

interface FloorItem {
  _id: string;
  floorNumber: number;
  name: string;
  stats?: {
    total: number;
    occupied: number;
    available: number;
  };
}

interface ConfirmDeleteFloorModalProps {
  floor: FloorItem;
  onClose: () => void;
  onSuccess: () => void;
}

export function ConfirmDeleteFloorModal({ floor, onClose, onSuccess }: ConfirmDeleteFloorModalProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.delete(`/floors/${floor._id}`);
      return data;
    },
    onSuccess: () => {
      toast.success(`Floor ${floor.floorNumber} (${floor.name}) deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ['floors'] });
      queryClient.invalidateQueries({ queryKey: ['seats'] });
      onSuccess();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to delete floor';
      toast.error(msg);
    },
  });

  const occupiedCount = floor.stats?.occupied || 0;
  const totalSeats = floor.stats?.total || 0;

  return (
    <Modal open onClose={onClose} title={`Delete Floor ${floor.floorNumber}`} size="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 rounded-xl border border-danger/30 bg-danger-muted text-danger">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-semibold">Warning: This action will permanently remove Floor {floor.floorNumber} ({floor.name}).</p>
            <p className="text-xs opacity-90">
              Unassigned and empty seats on this floor will also be deleted.
            </p>
          </div>
        </div>

        {occupiedCount > 0 ? (
          <div className="p-3.5 rounded-xl border border-warning/30 bg-warning-muted text-warning text-xs space-y-1">
            <p className="font-bold text-sm">Cannot Delete Floor</p>
            <p>
              Floor {floor.floorNumber} currently has <span className="font-bold">{occupiedCount} occupied seat(s)</span>. You must release or reassign all occupied seats before deleting this floor.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border p-3.5 space-y-2 text-sm bg-card">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Floor Label:</span>
              <span className="font-semibold text-foreground">{floor.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Seats to remove:</span>
              <span className="font-semibold text-foreground">{totalSeats} seat(s)</span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={occupiedCount > 0}
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Delete Floor
          </Button>
        </div>
      </div>
    </Modal>
  );
}
