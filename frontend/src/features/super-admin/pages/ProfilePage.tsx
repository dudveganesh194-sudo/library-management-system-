/**
 * ProfilePage — super admin profile and password update.
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserCircle, KeyRound, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import { getProfile, updateProfile, changeAdminPassword } from '../api/super-admin.api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z
    .string()
    .min(8, 'Min 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain uppercase, lowercase, and number'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export function ProfilePage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['super-admin', 'profile'],
    queryFn: getProfile,
  });

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
    }
  }, [profile]);

  const profileMut = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'profile'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const passwordMut = useMutation({
    mutationFn: changeAdminPassword,
    onSuccess: () => {
      toast.success('Password changed successfully!');
      reset();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Password change failed'),
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Name and Email are required');
      return;
    }
    profileMut.mutate({ name: name.trim(), email: email.trim() });
  };

  const handlePasswordSubmit = (data: PasswordFormData) => {
    passwordMut.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <UserCircle className="w-6 h-6 text-amber-500" />
          Super Admin Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your administrator account details and security settings.
        </p>
      </div>

      {/* Account Info Form */}
      <form onSubmit={handleProfileSubmit} className="card p-6 space-y-4">
        <h2 className="text-base font-semibold text-foreground">Account Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex justify-end pt-2">
          <Button type="submit" loading={profileMut.isPending} leftIcon={<Save className="w-4 h-4" />}>
            Update Profile
          </Button>
        </div>
      </form>

      {/* Password Form */}
      <form onSubmit={handleSubmit(handlePasswordSubmit)} className="card p-6 space-y-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-amber-500" />
          Change Password
        </h2>
        <Input
          label="Current Password"
          type="password"
          {...register('currentPassword')}
          error={errors.currentPassword?.message}
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="New Password"
            type="password"
            {...register('newPassword')}
            error={errors.newPassword?.message}
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
            required
          />
        </div>
        <div className="flex justify-end pt-2">
          <Button type="submit" loading={passwordMut.isPending}>
            Change Password
          </Button>
        </div>
      </form>
    </div>
  );
}
