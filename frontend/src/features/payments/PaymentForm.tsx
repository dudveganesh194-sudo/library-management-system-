import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Student } from '../../types';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import toast from 'react-hot-toast';

const PLAN_DAYS: Record<string, number> = {
  monthly: 30, quarterly: 90, 'half-yearly': 180, yearly: 365, custom: 30,
};

const paymentSchema = z.object({
  studentId: z.string().min(1, 'Please select a student'),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  method: z.enum(['cash', 'upi', 'card']),
  type: z.enum(['new', 'renewal', 'penalty']),
  plan: z.enum(['monthly', 'quarterly', 'half-yearly', 'yearly', 'custom']),
  startDate: z.string(),
  status: z.enum(['paid', 'pending', 'overdue']).default('paid'),
  notes: z.string().optional().or(z.literal('')),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentFormProps { studentId?: string; onSuccess: () => void; onCancel: () => void; }

export function PaymentForm({ studentId: initialStudentId, onSuccess, onCancel }: PaymentFormProps) {
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const { data: students } = useQuery<Student[]>({
    queryKey: ['students-search-pay', search],
    queryFn: async () => {
      const { data } = await api.get('/students', { params: { search, limit: 8 } });
      return data.data;
    },
    enabled: search.length > 0,
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<any>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      method: 'cash', type: 'new', plan: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      status: 'paid', studentId: initialStudentId || '',
    },
  });

  useEffect(() => {
    if (initialStudentId) setValue('studentId', initialStudentId);
  }, [initialStudentId, setValue]);

  useEffect(() => {
    if (selectedStudent) setValue('studentId', selectedStudent._id);
  }, [selectedStudent, setValue]);

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const { studentId, ...rest } = data;
      return api.post('/payments', { ...rest, student: studentId });
    },
    onSuccess: () => { toast.success('Payment recorded!'); onSuccess(); },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4" noValidate>
      {/* Student Search */}
      <div className="space-y-2">
        <label className="label">Select Student <span className="text-danger">*</span></label>
        {selectedStudent ? (
          <div className="flex items-center justify-between p-3 bg-brand-500/10 border border-brand-500/30 rounded-xl">
            <div>
              <p className="text-sm font-medium text-brand-700 dark:text-brand-300">{selectedStudent.name}</p>
              <p className="text-xs text-muted-foreground">{selectedStudent.studentId} · {selectedStudent.phone}</p>
            </div>
            <button type="button" className="text-xs text-muted-foreground hover:text-danger" onClick={() => { setSelectedStudent(null); setValue('studentId', ''); }}>
              Change
            </button>
          </div>
        ) : (
          <>
            <SearchInput placeholder="Search student..." onSearch={setSearch} />
            {search && students && (
              <div className="border border-border rounded-xl divide-y divide-border max-h-40 overflow-y-auto bg-card">
                {students.map((s) => (
                  <div key={s._id} className="p-2.5 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors" onClick={() => setSelectedStudent(s)}>
                    <p className="text-sm text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.studentId} · {s.phone}</p>
                  </div>
                ))}
                {students.length === 0 && <p className="p-3 text-center text-sm text-muted-foreground">No results</p>}
              </div>
            )}
          </>
        )}
        {errors.studentId && <p className="error-msg">{(errors.studentId.message as any)}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Amount (₹)" required type="number" min={1} error={errors.amount?.message as any} {...register('amount')} />
        <Select label="Payment Method" required options={[{label:'Cash',value:'cash'},{label:'UPI',value:'upi'},{label:'Card',value:'card'}]} error={errors.method?.message as any} {...register('method')} />
        <Select label="Plan" required options={[{label:'Monthly',value:'monthly'},{label:'Quarterly',value:'quarterly'},{label:'Half-Yearly',value:'half-yearly'},{label:'Yearly',value:'yearly'},{label:'Custom',value:'custom'}]} error={errors.plan?.message as any} {...register('plan')} />
        <Select label="Payment Type" required options={[{label:'New',value:'new'},{label:'Renewal',value:'renewal'},{label:'Penalty',value:'penalty'}]} error={errors.type?.message as any} {...register('type')} />
        <Input label="Start Date" required type="date" error={errors.startDate?.message as any} {...register('startDate')} />
        <Select label="Status" required options={[{label:'Paid',value:'paid'},{label:'Pending',value:'pending'},{label:'Overdue',value:'overdue'}]} error={errors.status?.message as any} {...register('status')} />
      </div>
      <Textarea label="Notes" placeholder="Any additional notes..." {...register('notes')} />

      <div className="flex justify-end gap-3 pt-2 border-t border-border">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>Record Payment</Button>
      </div>
    </form>
  );
}
