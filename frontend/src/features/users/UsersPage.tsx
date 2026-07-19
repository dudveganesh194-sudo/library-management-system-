import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Shield, UserCheck, UserX } from 'lucide-react';
import { api } from '../../lib/axios';
import { User } from '../../types';
import { formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/auth.context';

import { Navigate } from 'react-router-dom';

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).optional().or(z.literal('')),
  role: z.enum(['owner', 'manager', 'receptionist']),
  isActive: z.boolean().optional(),
});

type UserForm = z.infer<typeof userSchema>;

const ROLE_VARIANTS: Record<string, 'purple' | 'blue' | 'default'> = {
  owner: 'purple', manager: 'blue', receptionist: 'default',
};

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  if (currentUser?.role !== 'owner') {
    return <Navigate to="/dashboard" replace />;
  }

  const { data, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: async () => { const { data } = await api.get('/users', { params: { search } }); return data; },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: 'receptionist' },
  });

  const saveMutation = useMutation({
    mutationFn: (data: UserForm) => {
      if (editUser) {
        return api.put(`/users/${editUser._id}`, { name: data.name, role: data.role, isActive: data.isActive });
      }
      return api.post('/users', data);
    },
    onSuccess: () => {
      toast.success(editUser ? 'User updated!' : 'User created!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setModalOpen(false);
      reset();
    },
    onError: (err: unknown) => toast.error((err as any)?.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => { toast.success('User deleted'); queryClient.invalidateQueries({ queryKey: ['users'] }); setDeleteId(null); },
    onError: (err: unknown) => toast.error((err as any)?.response?.data?.message || 'Failed to delete'),
  });

  const rawUsers: User[] = data?.data || [];
  const users: User[] = rawUsers.filter(
    (u) => (u.role as string) !== 'super_admin' && (u.role as string) !== 'superadmin'
  );

  const openAdd = () => { setEditUser(null); reset({ role: 'receptionist', name: '', email: '', password: '' }); setModalOpen(true); };
  const openEdit = (u: User) => { setEditUser(u); reset({ name: u.name, email: u.email, role: u.role as 'owner' | 'manager' | 'receptionist', isActive: u.isActive }); setModalOpen(true); };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Staff Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage library staff accounts</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openAdd}>Add Staff</Button>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Joined</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j}><div className="skeleton h-4 w-24" /></td>)}</tr>
              ))
            ) : users.map((u) => (
              <tr key={u._id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-xs font-bold text-white">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{u.name}</p>
                      {u._id === currentUser?._id && <span className="text-2xs text-brand-500">You</span>}
                    </div>
                  </div>
                </td>
                <td className="text-muted-foreground">{u.email}</td>
                <td>
                  <Badge variant={ROLE_VARIANTS[u.role] || 'default'} className="capitalize">{u.role}</Badge>
                </td>
                <td>
                  {u.isActive
                    ? <span className="badge-green badge">Active</span>
                    : <span className="badge-red badge">Inactive</span>}
                </td>
                <td className="text-xs text-muted-foreground">{u.lastLogin ? formatDate(u.lastLogin) : 'Never'}</td>
                <td className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</td>
                <td>
                  <div className="flex justify-end gap-1">
                    <button className="btn-ghost btn btn-sm p-2" onClick={() => openEdit(u)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {u._id !== currentUser?._id && (
                      <button className="btn-ghost btn btn-sm p-2 text-danger hover:text-danger" onClick={() => setDeleteId(u._id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editUser ? 'Edit Staff Member' : 'Add Staff Member'}>
        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
          <Input label="Full Name" required placeholder="Jane Doe" error={errors.name?.message} {...register('name')} />
          <Input label="Email" required type="email" placeholder="jane@library.com" error={errors.email?.message} disabled={!!editUser} {...register('email')} />
          {!editUser && (
            <Input label="Password" required type="password" placeholder="Min. 8 characters" error={errors.password?.message} {...register('password')} />
          )}
          <Select
            label="Role"
            required
            options={[
              { label: 'Owner', value: 'owner' },
              { label: 'Manager', value: 'manager' },
              { label: 'Receptionist', value: 'receptionist' },
            ]}
            error={errors.role?.message}
            {...register('role')}
          />
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saveMutation.isPending}>{editUser ? 'Update' : 'Add Staff'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Staff Member" size="sm">
        <p className="text-muted-foreground mb-6">Are you sure you want to delete this staff member?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
