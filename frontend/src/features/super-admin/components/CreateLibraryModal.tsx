/**
 * CreateLibraryModal — form for creating a new library.
 *
 * Uses React Hook Form + Zod validation. On successful creation,
 * closes and shows the LibraryCredentialsDialog.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { Modal } from '../../../components/ui/Modal';
import { Input, Select } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { createLibrary, getSubscriptions } from '../api/super-admin.api';
import type { CreateLibraryCredentials } from '../../../types';

import { Gift, Sparkles } from 'lucide-react';

const formSchema = z.object({
  libraryName: z.string().min(2, 'Library name must be at least 2 characters').max(200),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters').max(100),
  email: z.string().email('Please provide a valid email'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit Indian phone number required'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pinCode: z.string().regex(/^\d{6}$/, 'Pin code must be 6 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain uppercase, lowercase, and number'),
  confirmPassword: z.string(),
  subscriptionId: z.string().optional(),
  paymentStatus: z.enum(['paid', 'unpaid', 'pending', 'trial']),
  trialDays: z.number().int().min(1, 'At least 1 day').max(365).optional(),
  seatsLimit: z.number().int().min(1, 'At least 1 seat').max(10000),
  status: z.enum(['active', 'suspended']),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof formSchema>;

interface CreateLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (credentials: CreateLibraryCredentials) => void;
}

export function CreateLibraryModal({ open, onClose, onSuccess }: CreateLibraryModalProps) {
  const queryClient = useQueryClient();

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['super-admin', 'subscriptions'],
    queryFn: getSubscriptions,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      seatsLimit: 50,
      paymentStatus: 'paid',
      trialDays: 15,
      status: 'active',
    },
  });

  const selectedPaymentStatus = watch('paymentStatus');

  const mutation = useMutation({
    mutationFn: createLibrary,
    onSuccess: (result) => {
      toast.success('Library created successfully!');
      queryClient.invalidateQueries({ queryKey: ['super-admin'] });
      reset();
      onClose();
      onSuccess(result.credentials);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create library');
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Create New Library" size="xl">
      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
        {/* Row 1: Library + Owner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Library Name"
            {...register('libraryName')}
            error={errors.libraryName?.message}
            placeholder="e.g., StudyZone Library"
            required
          />
          <Input
            label="Owner Name"
            {...register('ownerName')}
            error={errors.ownerName?.message}
            placeholder="e.g., Rajesh Kumar"
            required
          />
        </div>

        {/* Row 2: Email + Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="owner@library.com"
            required
          />
          <Input
            label="Phone"
            {...register('phone')}
            error={errors.phone?.message}
            placeholder="9876543210"
            required
          />
        </div>

        {/* Row 3: Address */}
        <Input
          label="Address"
          {...register('address')}
          error={errors.address?.message}
          placeholder="Full address"
          required
        />

        {/* Row 4: City + State + Pin */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="City"
            {...register('city')}
            error={errors.city?.message}
            placeholder="e.g., Jaipur"
            required
          />
          <Input
            label="State"
            {...register('state')}
            error={errors.state?.message}
            placeholder="e.g., Rajasthan"
            required
          />
          <Input
            label="Pin Code"
            {...register('pinCode')}
            error={errors.pinCode?.message}
            placeholder="302001"
            required
          />
        </div>

        {/* Row 5: Password + Confirm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Password"
            type="password"
            {...register('password')}
            error={errors.password?.message}
            placeholder="Min 8 characters"
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
            placeholder="Re-enter password"
            required
          />
        </div>

        {/* Row 6: Subscription + Payment Status + Seats + Status */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Select
            label="Subscription"
            {...register('subscriptionId')}
            error={errors.subscriptionId?.message}
            options={subscriptions
              .filter((s) => s.isActive)
              .map((s) => ({ label: `${s.name} — ₹${s.price}/mo`, value: s._id }))}
          />
          <Select
            label="Payment Status"
            {...register('paymentStatus')}
            error={errors.paymentStatus?.message}
            options={[
              { label: 'Paid Plan', value: 'paid' },
              { label: '🎁 Free Trial', value: 'trial' },
              { label: 'Unpaid', value: 'unpaid' },
              { label: 'Pending', value: 'pending' },
            ]}
          />
          <Input
            label="Seats Limit"
            type="number"
            {...register('seatsLimit', { valueAsNumber: true })}
            error={errors.seatsLimit?.message}
            placeholder="50"
            required
          />
          <Select
            label="Account Status"
            {...register('status')}
            error={errors.status?.message}
            options={[
              { label: 'Active', value: 'active' },
              { label: 'Suspended', value: 'suspended' },
            ]}
          />
        </div>

        {/* Free Trial Options Box */}
        {selectedPaymentStatus === 'trial' && (
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-3 animate-fade-in">
            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Free Trial Duration Setup
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <Input
                label="Trial Duration (in Days)"
                type="number"
                min={1}
                max={365}
                {...register('trialDays', { valueAsNumber: true })}
                error={errors.trialDays?.message}
                placeholder="15"
              />
              <div className="flex items-center gap-2 pb-0.5">
                <Button
                  type="button"
                  size="sm"
                  variant={watch('trialDays') === 15 ? 'primary' : 'secondary'}
                  onClick={() => setValue('trialDays', 15)}
                >
                  15 Days Preset
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={watch('trialDays') === 30 ? 'primary' : 'secondary'}
                  onClick={() => setValue('trialDays', 30)}
                >
                  30 Days Preset
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="secondary" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Create Library
          </Button>
        </div>
      </form>
    </Modal>
  );
}
