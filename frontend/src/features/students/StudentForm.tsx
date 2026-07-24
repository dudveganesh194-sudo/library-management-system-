import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Receipt, Sparkles } from 'lucide-react';
import { api } from '../../lib/axios';
import { Student } from '../../types';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

function formatTime12h(time24: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${mStr || '00'} ${ampm}`;
}

function calculateEndTime(startTime: string, durationHours: number): string {
  if (!startTime) return '';
  const [hStr, mStr] = startTime.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return '';

  const totalMinutes = Math.round(h * 60 + m + durationHours * 60);
  const positiveMinutes = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const endH = Math.floor(positiveMinutes / 60);
  const endM = positiveMinutes % 60;

  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

const PLAN_DEFAULT_PRICES: Record<string, number> = {
  monthly: 500,
  quarterly: 1400,
  'half-yearly': 2700,
  yearly: 5000,
  custom: 500,
};

const studentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  address: z.string().optional().or(z.literal('')),
  joinDate: z.string(),
  plan: z.enum(['monthly', 'quarterly', 'half-yearly', 'yearly', 'custom']),
  shiftType: z.string().optional(),
  shiftHours: z.coerce.number().min(1).max(24).optional(),
  startTime: z.string().optional().or(z.literal('')),
  endTime: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'suspended', 'left', 'on_leave']).optional(),
  notes: z.string().optional().or(z.literal('')),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface StudentFormProps {
  student?: Student;
  onSuccess: () => void;
  onCancel: () => void;
}

export function StudentForm({ student, onSuccess, onCancel }: StudentFormProps) {
  const isEdit = !!student;
  const queryClient = useQueryClient();

  const [shiftType, setShiftType] = useState<string>(student?.shiftType || 'full_day');
  const [customHours, setCustomHours] = useState<string>(student?.shiftHours ? String(student.shiftHours) : '6');

  // Payment section state for student entry
  const [recordPayment, setRecordPayment] = useState<boolean>(!isEdit);
  const [paymentAmount, setPaymentAmount] = useState<string>('500');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  const [paymentStartDate, setPaymentStartDate] = useState<string>(
    student?.joinDate ? student.joinDate.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [paymentNotes, setPaymentNotes] = useState<string>(
    isEdit ? 'Fee payment / renewal' : 'Initial registration & membership fee'
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema) as any,
    defaultValues: {
      name: student?.name || '',
      email: student?.email || '',
      phone: student?.phone || '',
      address: student?.address || '',
      joinDate: student?.joinDate ? student.joinDate.split('T')[0] : new Date().toISOString().split('T')[0],
      plan: (student?.plan as any) || 'monthly',
      shiftType: student?.shiftType || 'full_day',
      shiftHours: student?.shiftHours || 24,
      startTime: student?.startTime || '07:00',
      endTime: student?.endTime || '13:00',
      status: student?.status || 'active',
      notes: student?.notes || '',
    },
  });

  const startTimeVal = watch('startTime') || '07:00';
  const endTimeVal = watch('endTime') || '13:00';
  const selectedPlan = watch('plan');
  const joinDateVal = watch('joinDate');

  // Auto-sync default payment amount when plan changes
  useEffect(() => {
    if (!isEdit && selectedPlan && PLAN_DEFAULT_PRICES[selectedPlan]) {
      setPaymentAmount(String(PLAN_DEFAULT_PRICES[selectedPlan]));
    }
  }, [selectedPlan, isEdit]);

  // Auto-sync payment start date when joinDate changes
  useEffect(() => {
    if (joinDateVal) {
      setPaymentStartDate(joinDateVal);
    }
  }, [joinDateVal]);

  // Automatically calculate end time when startTime, shiftType, or customHours change
  useEffect(() => {
    if (shiftType === 'full_day') return;
    let hours = 6;
    if (shiftType === '12_hours') {
      hours = 12;
    } else if (shiftType === '6_hours') {
      hours = 6;
    } else if (shiftType === 'custom') {
      hours = parseFloat(customHours) || 8;
    }

    if (startTimeVal) {
      const calculatedEnd = calculateEndTime(startTimeVal, hours);
      if (calculatedEnd) {
        setValue('endTime', calculatedEnd, { shouldValidate: true, shouldDirty: true });
      }
    }
  }, [startTimeVal, shiftType, customHours, setValue]);

  const mutation = useMutation({
    mutationFn: async (formData: StudentFormData) => {
      let finalHours = 24;
      let slotText = '24 Hours (Full Day)';

      if (shiftType === '12_hours') {
        finalHours = 12;
      } else if (shiftType === '6_hours') {
        finalHours = 6;
      } else if (shiftType === 'custom') {
        finalHours = parseInt(customHours, 10) || 6;
      }

      if (shiftType !== 'full_day' && formData.startTime && formData.endTime) {
        slotText = `${formatTime12h(formData.startTime)} - ${formatTime12h(formData.endTime)} (${finalHours} hrs)`;
      } else if (shiftType !== 'full_day') {
        slotText = `${finalHours} Hours Shift`;
      }

      const payload = {
        ...formData,
        shiftType,
        shiftHours: finalHours,
        timeSlot: slotText,
        recordInitialPayment: recordPayment,
        paymentAmount: recordPayment ? Number(paymentAmount || 0) : undefined,
        paymentMethod: recordPayment ? paymentMethod : undefined,
        paymentStartDate: recordPayment ? paymentStartDate || formData.joinDate : undefined,
        paymentNotes: recordPayment ? paymentNotes : undefined,
      };

      if (isEdit) {
        const { data } = await api.put(`/students/${student!._id}`, payload);
        return data;
      } else {
        const { data } = await api.post('/students', payload);
        return data;
      }
    },
    onSuccess: () => {
      if (isEdit) {
        toast.success('Student updated!');
      } else if (recordPayment) {
        toast.success('Student registered & fee payment updated!');
      } else {
        toast.success('Student added successfully!');
      }
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['revenue-trend'] });
      queryClient.invalidateQueries({ queryKey: ['expiring-plans-students-page'] });
      onSuccess();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Something went wrong';
      toast.error(msg);
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data) as any)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Full Name" required placeholder="John Doe" error={errors.name?.message} {...register('name')} />
        <Input label="Phone Number" required placeholder="9876543210" error={errors.phone?.message} {...register('phone')} />
        <Input label="Email Address" type="email" placeholder="john@example.com" error={errors.email?.message} {...register('email')} />
        <Input label="Join Date" type="date" required error={errors.joinDate?.message} {...register('joinDate')} />
        
        <Select
          label="Membership Plan"
          required
          error={errors.plan?.message}
          options={[
            { label: 'Monthly (₹500)', value: 'monthly' },
            { label: 'Quarterly (₹1,400)', value: 'quarterly' },
            { label: 'Half-Yearly (₹2,700)', value: 'half-yearly' },
            { label: 'Yearly (₹5,000)', value: 'yearly' },
            { label: 'Custom Plan', value: 'custom' },
          ]}
          {...register('plan')}
        />

        {/* Shift / Allocated Hours Selection */}
        <Select
          label="Assigned Shift / Hours"
          value={shiftType}
          onChange={(e) => setShiftType(e.target.value)}
          options={[
            { label: 'Full Time (24 Hours - Full Day)', value: 'full_day' },
            { label: '12 Hours Shift (Half Day)', value: '12_hours' },
            { label: '6 Hours Shift', value: '6_hours' },
            { label: 'Custom Hours', value: 'custom' },
          ]}
        />

        {shiftType === 'custom' && (
          <Input
            label="Total Shift Hours"
            type="number"
            min={1}
            max={24}
            value={customHours}
            onChange={(e) => setCustomHours(e.target.value)}
            placeholder="e.g. 8"
          />
        )}

        {shiftType !== 'full_day' && (
          <>
            <Input
              label="Shift Start Time"
              type="time"
              value={startTimeVal}
              error={errors.startTime?.message}
              onChange={(e) => setValue('startTime', e.target.value, { shouldValidate: true, shouldDirty: true })}
            />
            <Input
              label="Shift End Time"
              type="time"
              value={endTimeVal}
              error={errors.endTime?.message}
              onChange={(e) => setValue('endTime', e.target.value, { shouldValidate: true, shouldDirty: true })}
            />
          </>
        )}

        <Input label="Address" placeholder="City, State" error={errors.address?.message} {...register('address')} />

        {isEdit && (
          <Select
            label="Student Status"
            error={errors.status?.message}
            options={[
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
              { label: 'Left Library', value: 'left' },
              { label: 'Suspended', value: 'suspended' },
              { label: 'On Leave', value: 'on_leave' },
            ]}
            {...register('status')}
          />
        )}
      </div>

      {/* Preview Time Slot */}
      {shiftType !== 'full_day' && startTimeVal && endTimeVal && (
        <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Assigned Time Slot Preview:</span>
          <span className="font-bold text-brand-500">
            {formatTime12h(startTimeVal)} → {formatTime12h(endTimeVal)} ({shiftType === 'custom' ? (customHours || '0') : shiftType === '12_hours' ? 12 : 6} Hours)
          </span>
        </div>
      )}

      {/* Fee Payment Receipt Section */}
      <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brand-500" />
            <h3 className="text-sm font-bold text-foreground">
              {isEdit ? 'Record Payment for Student' : 'Record Initial Fee Payment'}
            </h3>
            <span className="text-2xs bg-brand-500/20 text-brand-600 dark:text-brand-300 font-bold px-2 py-0.5 rounded-full">
              Auto-Updates Payments Page
            </span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-brand-600 dark:text-brand-300">
            <input
              type="checkbox"
              checked={recordPayment}
              onChange={(e) => setRecordPayment(e.target.checked)}
              className="rounded border-border text-brand-500 focus:ring-brand-500 w-4 h-4"
            />
            {isEdit ? 'Record Fee Receipt' : 'Generate Fee Receipt Now'}
          </label>
        </div>

        {recordPayment && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Input
              label="Amount Paid (₹)"
              type="number"
              min={0}
              required
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="500"
              hint="Auto-suggested based on plan selected"
            />

            <Select
              label="Payment Method"
              required
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              options={[
                { label: 'Cash', value: 'cash' },
                { label: 'UPI / QR', value: 'upi' },
                { label: 'Card / NetBanking', value: 'card' },
              ]}
            />

            <Input
              label="Payment Start Date"
              type="date"
              required
              value={paymentStartDate}
              onChange={(e) => setPaymentStartDate(e.target.value)}
            />

            <Input
              label="Payment Notes / Remarks"
              placeholder="e.g. Fee payment / renewal"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
            />
          </div>
        )}
      </div>

      <Textarea label="Notes" placeholder="Any additional information..." {...register('notes')} />

      <div className="flex justify-end gap-3 pt-2 border-t border-border">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>
          {isEdit ? 'Update Student' : 'Add Student & Record Payment'}
        </Button>
      </div>
    </form>
  );
}
