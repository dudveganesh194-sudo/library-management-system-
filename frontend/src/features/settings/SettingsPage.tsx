import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from 'next-themes';
import { api } from '../../lib/axios';
import { Settings } from '../../types';
import { Input, Textarea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { Building2, Clock, Tag, Sun, Moon, Laptop, Eye } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

const settingsSchema = z.object({
  'library.name': z.string().min(1, 'Library name is required'),
  'library.address': z.string().optional().or(z.literal('')),
  'library.phone': z.string().optional().or(z.literal('')),
  'library.email': z.string().email('Invalid email').optional().or(z.literal('')),
  'library.website': z.string().optional().or(z.literal('')),
  'library.gstNumber': z.string().optional().or(z.literal('')),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => { const { data } = await api.get('/settings'); return data.data; },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    values: {
      'library.name': settings?.library.name || '',
      'library.address': settings?.library.address || '',
      'library.phone': settings?.library.phone || '',
      'library.email': settings?.library.email || '',
      'library.website': settings?.library.website || '',
      'library.gstNumber': settings?.library.gstNumber || '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: SettingsForm) => {
      const payload = {
        library: {
          name: data['library.name'],
          address: data['library.address'],
          phone: data['library.phone'],
          email: data['library.email'],
          website: data['library.website'],
          gstNumber: data['library.gstNumber'],
        },
      };
      return api.put('/settings', payload);
    },
    onSuccess: () => {
      toast.success('Settings updated!');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: () => toast.error('Failed to update settings'),
  });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="skeleton h-8 w-40" />
        <div className="card p-6 space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-10 w-full" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
          <p className="text-slate-500 text-sm mt-0.5">Configure your library profile and interface theme</p>
        </div>
      </div>

      {/* Library Info */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Building2 className="w-4 h-4 text-brand-500" />
          <h2 className="section-title">Library Profile</h2>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Library Name" required placeholder="My Study Library" error={errors['library.name']?.message} {...register('library.name')} />
            <Input label="Phone" placeholder="+91 98765 43210" error={errors['library.phone']?.message} {...register('library.phone')} />
            <Input label="Email" type="email" placeholder="library@example.com" error={errors['library.email']?.message} {...register('library.email')} />
            <Input label="Website" placeholder="https://library.com" error={errors['library.website']?.message} {...register('library.website')} />
            <Input label="GST Number" placeholder="22AAAAA0000A1Z5" error={errors['library.gstNumber']?.message} {...register('library.gstNumber')} />
            <Textarea label="Address" placeholder="Library address..." error={errors['library.address']?.message} {...register('library.address')} />
          </div>
          <div className="flex justify-end pt-2 border-t border-border">
            <Button type="submit" loading={mutation.isPending}>Save Changes</Button>
          </div>
        </form>
      </div>

      {/* Theme Settings (Appearance) */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-4 h-4 text-brand-500" />
          <h2 className="section-title">Appearance</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5">Select how LibraryInfos looks on your screen.</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'light', label: 'Light Mode', icon: Sun, color: 'text-amber-500', desc: 'Sleek light workspace' },
            { id: 'dark', label: 'Dark Mode', icon: Moon, color: 'text-indigo-400', desc: 'Premium dark SaaS theme' },
            { id: 'system', label: 'System Pref', icon: Laptop, color: 'text-slate-500', desc: 'Matches system preferences' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTheme(item.id)}
              className={`p-4 border rounded-xl flex flex-col items-center text-center transition-all ${
                theme === item.id
                  ? 'border-brand-500 bg-brand-500/5 ring-1 ring-brand-500/30'
                  : 'border-border bg-card hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              <item.icon className={`w-6 h-6 mb-3 ${item.color}`} />
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="text-2xs text-muted-foreground mt-1 hidden sm:block">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Plans (read-only display) */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Tag className="w-4 h-4 text-brand-500" />
          <h2 className="section-title">Membership Plans</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {settings?.plans.map((plan) => (
            <div key={plan.type} className={`rounded-xl border p-4 text-center ${plan.isActive ? 'border-brand-500/30 bg-brand-500/5' : 'border-border opacity-50'}`}>
              <p className="text-sm font-semibold text-foreground">{plan.name}</p>
              <p className="text-xl font-bold text-brand-500 mt-1">{formatCurrency(plan.price)}</p>
              <p className="text-xs text-muted-foreground mt-1">{plan.durationDays} days</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">Plan prices can be customized via the API or by editing the database.</p>
      </div>

      {/* Working Hours */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-brand-500" />
          <h2 className="section-title">Working Hours</h2>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Opening Time</p>
            <p className="font-semibold text-foreground">{settings?.workingHours.open}</p>
          </div>
          <span className="text-slate-400">—</span>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Closing Time</p>
            <p className="font-semibold text-foreground">{settings?.workingHours.close}</p>
          </div>
          <div className="ml-4">
            <p className="text-xs text-muted-foreground mb-1">Days Open</p>
            <p className="font-semibold text-foreground">{settings?.workingHours.daysOpen.join(', ')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
