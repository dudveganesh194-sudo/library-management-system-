/**
 * EditLibraryModal — form for editing an existing library.
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { Modal } from '../../../components/ui/Modal';
import { Input, Select } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { updateLibrary, getSubscriptions } from '../api/super-admin.api';
import type { Library } from '../../../types';

const formSchema = z.object({
  libraryName: z.string().min(2).max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Valid phone number required').optional(),
  address: z.string().min(5).optional(),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  pinCode: z.string().regex(/^\d{6}$/, 'Pin code must be 6 digits').optional(),
  subscriptionId: z.string().optional(),
  paymentStatus: z.enum(['paid', 'unpaid', 'pending']).optional(),
  subscriptionEndDate: z.string().optional(),
  seatsLimit: z.number().int().min(1).max(10000).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditLibraryModalProps {
  open: boolean;
  onClose: () => void;
  library: Library | null;
}

export function EditLibraryModal({ open, onClose, library }: EditLibraryModalProps) {
  const queryClient = useQueryClient();

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['super-admin', 'subscriptions'],
    queryFn: getSubscriptions,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
  });

  useEffect(() => {
    if (library) {
      reset({
        libraryName: library.name,
        email: library.email,
        phone: library.phone,
        address: library.address,
        city: library.city,
        state: library.state,
        pinCode: library.pinCode,
        subscriptionId: typeof library.subscription === 'object' && library.subscription ? library.subscription._id : '',
        paymentStatus: library.paymentStatus || 'paid',
        subscriptionEndDate: library.subscriptionEndDate ? library.subscriptionEndDate.split('T')[0] : '',
        seatsLimit: library.seatsLimit,
      });
    }
  }, [library, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => updateLibrary(library!._id, data),
    onSuccess: () => {
      toast.success('Library updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['super-admin'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update library');
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  if (!library) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Edit: ${library.name}`} size="xl">
      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
        {/* Row 1: Library Name + Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Library Name"
            {...register('libraryName')}
            error={errors.libraryName?.message}
          />
          <Input
            label="Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
          />
        </div>

        {/* Row 2: Phone + Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Phone"
            {...register('phone')}
            error={errors.phone?.message}
          />
          <Input
            label="Address"
            {...register('address')}
            error={errors.address?.message}
          />
        </div>

        {/* Row 3: City + State + Pin */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="City" {...register('city')} error={errors.city?.message} />
          <Input label="State" {...register('state')} error={errors.state?.message} />
          <Input label="Pin Code" {...register('pinCode')} error={errors.pinCode?.message} />
        </div>

        {/* Row 4: Subscription + Payment Status + Expiry Date + Seats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Select
            label="Subscription"
            {...register('subscriptionId')}
            options={subscriptions
              .filter((s) => s.isActive)
              .map((s) => ({ label: `${s.name} — ₹${s.price}/mo`, value: s._id }))}
          />
          <Select
            label="Payment Status"
            {...register('paymentStatus')}
            options={[
              { label: 'Paid', value: 'paid' },
              { label: 'Unpaid', value: 'unpaid' },
              { label: 'Pending', value: 'pending' },
            ]}
          />
          <Input
            label="Expiry Date"
            type="date"
            {...register('subscriptionEndDate')}
            error={errors.subscriptionEndDate?.message}
          />
          <Input
            label="Seats Limit"
            type="number"
            {...register('seatsLimit', { valueAsNumber: true })}
            error={errors.seatsLimit?.message}
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
