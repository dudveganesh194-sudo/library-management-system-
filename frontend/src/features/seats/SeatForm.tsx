import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

const seatSchema = z.object({
  seatNumber: z.string().min(1, 'Seat number required').toUpperCase(),
  floor: z.coerce.number().int().min(0, 'Floor must be 0 or greater'),
  section: z.string().min(1, 'Section required').toUpperCase(),
  type: z.enum(['standard', 'premium']),
  price: z.coerce.number().min(0, 'Price must be positive'),
});

type SeatFormData = z.infer<typeof seatSchema>;

interface SeatFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function SeatForm({ onSuccess, onCancel }: SeatFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<any>({
    resolver: zodResolver(seatSchema),
    defaultValues: { type: 'standard', floor: 1, section: 'A', price: 500 },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/seats', data),
    onSuccess: () => { toast.success('Seat created!'); onSuccess(); },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create seat';
      toast.error(msg);
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Seat Number" required placeholder="A1-01" error={errors.seatNumber?.message as any} {...register('seatNumber')} />
        <Input label="Floor" required type="number" min={0} error={errors.floor?.message as any} {...register('floor')} />
        <Input label="Section" required placeholder="A" error={errors.section?.message as any} {...register('section')} />
        <Select label="Type" required options={[{ label: 'Standard', value: 'standard' }, { label: 'Premium', value: 'premium' }]} error={errors.type?.message as any} {...register('type')} />
        <Input label="Monthly Price (₹)" required type="number" min={0} error={errors.price?.message as any} {...register('price')} />
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-border">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>Create Seat</Button>
      </div>
    </form>
  );
}
