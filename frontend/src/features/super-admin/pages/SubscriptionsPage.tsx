/**
 * SubscriptionsPage — CRUD for platform subscription tiers.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Plus, Check, Trash2, Edit2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
} from '../api/super-admin.api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { formatCurrency } from '../../../lib/utils';
import type { Subscription } from '../../../types';

const planSchema = z.object({
  name: z.string().min(2, 'Name required'),
  price: z.number().min(0, 'Price must be >= 0'),
  duration: z.number().min(1, 'Duration must be >= 1 day'),
  maxSeats: z.number().min(1, 'Max seats must be >= 1'),
  maxStaff: z.number().min(1, 'Max staff must be >= 1'),
  featuresStr: z.string(),
});

type PlanFormData = z.infer<typeof planSchema>;

export function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Subscription | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['super-admin', 'subscriptions'],
    queryFn: getSubscriptions,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema) as any,
    defaultValues: {
      price: 999,
      duration: 30,
      maxSeats: 100,
      maxStaff: 5,
      featuresStr: 'Seats Management, Student Records, Payment Tracking',
    },
  });

  const createMut = useMutation({
    mutationFn: createSubscription,
    onSuccess: () => {
      toast.success('Subscription plan created!');
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'subscriptions'] });
      handleCloseModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error creating plan'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateSubscription(id, data),
    onSuccess: () => {
      toast.success('Subscription plan updated!');
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'subscriptions'] });
      handleCloseModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error updating plan'),
  });

  const deleteMut = useMutation({
    mutationFn: deleteSubscription,
    onSuccess: () => {
      toast.success('Subscription plan deleted!');
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'subscriptions'] });
      setDeleteTarget(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error deleting plan'),
  });

  const handleOpenCreate = () => {
    setEditingPlan(null);
    reset({
      name: '',
      price: 999,
      duration: 30,
      maxSeats: 100,
      maxStaff: 5,
      featuresStr: 'Seats Management, Student Records, Payment Tracking',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (plan: Subscription) => {
    setEditingPlan(plan);
    setValue('name', plan.name);
    setValue('price', plan.price);
    setValue('duration', plan.duration);
    setValue('maxSeats', plan.maxSeats);
    setValue('maxStaff', plan.maxStaff);
    setValue('featuresStr', plan.features.join(', '));
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    reset();
    setEditingPlan(null);
    setModalOpen(false);
  };

  const onSubmit = (data: PlanFormData) => {
    const payload = {
      name: data.name,
      price: Number(data.price),
      duration: Number(data.duration),
      maxSeats: Number(data.maxSeats),
      maxStaff: Number(data.maxStaff),
      features: data.featuresStr.split(',').map((f) => f.trim()).filter(Boolean),
    };

    if (editingPlan) {
      updateMut.mutate({ id: editingPlan._id, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-amber-500" />
            Subscription Tiers
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage pricing plans, seat limits, and features offered to libraries.
          </p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={handleOpenCreate}>
          Create Plan
        </Button>
      </div>

      {/* Plans Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className="card p-6 flex flex-col justify-between hover:border-amber-500/40 transition-all relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-foreground">{plan.name}</h2>
                  <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    {plan.duration} Days
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-extrabold text-foreground">
                    {formatCurrency(plan.price)}
                  </span>
                  <span className="text-xs text-muted-foreground">/ plan</span>
                </div>
                <div className="space-y-2 mb-6">
                  <p className="text-xs text-muted-foreground">
                    Max Seats: <strong className="text-foreground">{plan.maxSeats}</strong> · Max Staff:{' '}
                    <strong className="text-foreground">{plan.maxStaff}</strong>
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(plan)}>
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setDeleteTarget(plan)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Plan Form Modal */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title={editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Create Subscription Plan'}
      >
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
          <Input label="Plan Name" {...register('name')} error={errors.name?.message} placeholder="e.g. Pro" required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price (₹)" type="number" {...register('price', { valueAsNumber: true })} error={errors.price?.message} required />
            <Input label="Duration (Days)" type="number" {...register('duration', { valueAsNumber: true })} error={errors.duration?.message} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Max Seats" type="number" {...register('maxSeats', { valueAsNumber: true })} error={errors.maxSeats?.message} required />
            <Input label="Max Staff" type="number" {...register('maxStaff', { valueAsNumber: true })} error={errors.maxStaff?.message} required />
          </div>
          <Input
            label="Features (comma-separated)"
            {...register('featuresStr')}
            error={errors.featuresStr?.message}
            placeholder="Seats, Students, Reports"
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" type="button" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" loading={createMut.isPending || updateMut.isPending}>
              {editingPlan ? 'Save Changes' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget._id)}
        title="Delete Subscription Plan"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        loading={deleteMut.isPending}
      />
    </div>
  );
}
