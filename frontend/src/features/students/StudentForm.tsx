import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
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

  const [shiftType, setShiftType] = useState<string>(student?.shiftType || 'full_day');
  const [customHours, setCustomHours] = useState<number>(student?.shiftHours || 6);

  const {
    register,
    handleSubmit,
    watch,
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
      notes: student?.notes || '',
    },
  });

  const startTimeVal = watch('startTime');
  const endTimeVal = watch('endTime');

  const mutation = useMutation({
    mutationFn: async (formData: StudentFormData) => {
      let finalHours = 24;
      let slotText = '24 Hours (Full Day)';

      if (shiftType === '12_hours') {
        finalHours = 12;
      } else if (shiftType === '6_hours') {
        finalHours = 6;
      } else if (shiftType === 'custom') {
        finalHours = customHours || 6;
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
      toast.success(isEdit ? 'Student updated!' : 'Student added!');
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
            { label: 'Monthly', value: 'monthly' },
            { label: 'Quarterly', value: 'quarterly' },
            { label: 'Half-Yearly', value: 'half-yearly' },
            { label: 'Yearly', value: 'yearly' },
            { label: 'Custom', value: 'custom' },
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
            onChange={(e) => setCustomHours(parseInt(e.target.value, 10) || 6)}
            placeholder="e.g. 8"
          />
        )}

        {shiftType !== 'full_day' && (
          <>
            <Input label="Shift Start Time" type="time" error={errors.startTime?.message} {...register('startTime')} />
            <Input label="Shift End Time" type="time" error={errors.endTime?.message} {...register('endTime')} />
          </>
        )}

        <Input label="Address" placeholder="City, State" error={errors.address?.message} {...register('address')} />
      </div>

      {/* Preview Time Slot */}
      {shiftType !== 'full_day' && startTimeVal && endTimeVal && (
        <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Assigned Time Slot Preview:</span>
          <span className="font-bold text-brand-500">
            {formatTime12h(startTimeVal)} → {formatTime12h(endTimeVal)} ({shiftType === 'custom' ? customHours : shiftType === '12_hours' ? 12 : 6} Hours)
          </span>
        </div>
      )}

      <Textarea label="Notes" placeholder="Any additional information..." {...register('notes')} />

      <div className="flex justify-end gap-3 pt-2 border-t border-border">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>
          {isEdit ? 'Update Student' : 'Add Student'}
        </Button>
      </div>
    </form>
  );
}
