import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/axios';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';

interface AddFloorModalProps {
  existingFloorNumbers: number[];
  onClose: () => void;
  onSuccess: () => void;
}

export function AddFloorModal({ existingFloorNumbers, onClose, onSuccess }: AddFloorModalProps) {
  const queryClient = useQueryClient();

  // Find next available floor number
  const defaultNext = existingFloorNumbers.length > 0
    ? Math.max(...existingFloorNumbers) + 1
    : 1;

  const [floorNumber, setFloorNumber] = useState(String(defaultNext));
  const [name, setName] = useState(`Floor ${defaultNext}`);
  const [description, setDescription] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const num = Number(floorNumber);
      if (isNaN(num) || num < 0) {
        throw new Error('Please enter a valid floor number (0 or higher)');
      }
      if (!name.trim()) {
        throw new Error('Floor name is required');
      }

      const { data } = await api.post('/floors', {
        floorNumber: num,
        name: name.trim(),
        description: description.trim() || undefined,
      });
      return data.data;
    },
    onSuccess: (data) => {
      toast.success(`Floor ${data.floorNumber} (${data.name}) created!`);
      queryClient.invalidateQueries({ queryKey: ['floors'] });
      queryClient.invalidateQueries({ queryKey: ['seats'] });
      onSuccess();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to create floor';
      toast.error(msg);
    },
  });

  const handleFloorNumberChange = (val: string) => {
    setFloorNumber(val);
    const num = Number(val);
    if (!isNaN(num) && name.startsWith('Floor ')) {
      setName(`Floor ${num}`);
    }
  };

  return (
    <Modal open onClose={onClose} title="Add New Floor" size="md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <p className="text-sm text-muted-foreground">
          Add a new floor level to your library. You can generate or assign seats to this floor once created.
        </p>

        <div className="space-y-3">
          <Input
            label="Floor Number"
            type="number"
            min={0}
            required
            value={floorNumber}
            onChange={(e) => handleFloorNumberChange(e.target.value)}
            hint="e.g. 0 for Ground Floor, 1 for 1st Floor, 2 for 2nd Floor"
          />

          <Input
            label="Floor Name / Label"
            required
            placeholder="e.g. Ground Floor, 1st Floor, Silent Zone"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Textarea
            label="Description (Optional)"
            placeholder="e.g. Main reading hall & computer section..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending} leftIcon={<Layers className="w-4 h-4" />}>
            Create Floor
          </Button>
        </div>
      </form>
    </Modal>
  );
}
