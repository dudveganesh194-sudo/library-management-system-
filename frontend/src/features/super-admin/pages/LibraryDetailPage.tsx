/**
 * LibraryDetailPage — comprehensive profile view for a specific library (Super Admin panel).
 *
 * Displays executive stats, library metadata, owner contact details,
 * subscription details, enrolled students, and payment transaction history.
 */

import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Library as LibraryIcon,
  User,
  Phone,
  MapPin,
  CreditCard,
  Users,
  Armchair,
  Clock,
  Sparkles,
  Edit2,
  PauseCircle,
  PlayCircle,
  Trash2,
  KeyRound,
  LogOut,
  MessageSquare,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  getLibraryById,
  suspendLibrary,
  activateLibrary,
  deleteLibrary,
} from '../api/super-admin.api';
import { api } from '../../../lib/axios';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../components/StatusBadge';
import { EditLibraryModal } from '../components/EditLibraryModal';
import { GrantTrialModal } from '../components/GrantTrialModal';
import { ResetOwnerPasswordModal } from '../components/ResetOwnerPasswordModal';
import { MarkLibraryLeftModal } from '../components/MarkLibraryLeftModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { formatDate, daysRemaining, formatCurrency, formatStudentId } from '../../../lib/utils';
import type { Library, Student, Payment } from '../../../types';

export function LibraryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Active tab state for lower section
  const [activeTab, setActiveTab] = useState<'students' | 'payments'>('students');

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [grantTrialOpen, setGrantTrialOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [markLeftOpen, setMarkLeftOpen] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'suspend' | 'activate' | 'delete';
  }>({ open: false, type: 'suspend' });

  // 1. Fetch Library Profile Details
  const { data: library, isLoading: libraryLoading, refetch: refetchLibrary } = useQuery<Library>({
    queryKey: ['super-admin', 'library', id],
    queryFn: () => getLibraryById(id!),
    enabled: !!id,
  });

  // 2. Fetch Students for this specific library
  const { data: studentsData, isLoading: studentsLoading } = useQuery<{ data: Student[] }>({
    queryKey: ['super-admin', 'library-students', id],
    queryFn: async () => {
      const { data } = await api.get('/students', { params: { libraryId: id, limit: 50 } });
      return data;
    },
    enabled: !!id,
  });

  // 3. Fetch Payments for this specific library
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery<{ data: Payment[] }>({
    queryKey: ['super-admin', 'library-payments', id],
    queryFn: async () => {
      const { data } = await api.get('/payments', { params: { libraryId: id, limit: 50 } });
      return data;
    },
    enabled: !!id,
  });

  // 4. Fetch Seats for occupancy calculation
  const { data: seatsData } = useQuery<{ data: any[] }>({
    queryKey: ['super-admin', 'library-seats', id],
    queryFn: async () => {
      const { data } = await api.get('/seats', { params: { libraryId: id, limit: 500 } });
      return data;
    },
    enabled: !!id,
  });

  // Mutations
  const suspendMutation = useMutation({
    mutationFn: () => suspendLibrary(id!),
    onSuccess: () => {
      toast.success(`Library suspended successfully`);
      queryClient.invalidateQueries({ queryKey: ['super-admin'] });
      setConfirmDialog({ open: false, type: 'suspend' });
      refetchLibrary();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to suspend library');
    },
  });

  const activateMutation = useMutation({
    mutationFn: () => activateLibrary(id!),
    onSuccess: () => {
      toast.success(`Library activated successfully`);
      queryClient.invalidateQueries({ queryKey: ['super-admin'] });
      setConfirmDialog({ open: false, type: 'activate' });
      refetchLibrary();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to activate library');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteLibrary(id!),
    onSuccess: () => {
      toast.success('Library deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['super-admin'] });
      navigate('/super-admin/libraries');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete library');
    },
  });

  const handleConfirmAction = () => {
    if (confirmDialog.type === 'suspend') suspendMutation.mutate();
    else if (confirmDialog.type === 'activate') activateMutation.mutate();
    else if (confirmDialog.type === 'delete') deleteMutation.mutate();
  };

  const getWhatsAppLink = (phoneStr: string, libraryName: string, ownerName: string) => {
    const clean = phoneStr.replace(/\D/g, '');
    const formattedPhone = clean.length === 10 ? `91${clean}` : clean;
    const msg = `Hello ${ownerName || 'Library Owner'}, regarding your library "${libraryName}" on our platform:`;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
  };

  if (libraryLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="skeleton h-6 w-40" />
        <div className="skeleton h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!library) {
    return (
      <div className="text-center py-16">
        <LibraryIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <h2 className="text-lg font-bold text-foreground">Library Not Found</h2>
        <p className="text-sm text-muted-foreground mt-1">The requested library profile does not exist.</p>
        <Link to="/super-admin/libraries" className="btn btn-secondary mt-4">
          Back to Libraries
        </Link>
      </div>
    );
  }

  const owner = typeof library.owner === 'object' ? library.owner : null;
  const ownerName = owner?.name || 'Owner';
  const phone = library.phone || (owner as any)?.phone || '';
  const subscription = typeof library.subscription === 'object' ? library.subscription : null;
  const isTrial = library.isTrial || library.paymentStatus === 'trial';
  const daysLeft = library.subscriptionEndDate ? daysRemaining(library.subscriptionEndDate) : null;

  const studentsList: Student[] = studentsData?.data || [];
  const paymentsList: Payment[] = paymentsData?.data || [];
  const seatsList: any[] = seatsData?.data || [];
  const occupiedSeatsCount = seatsList.filter((s) => s.status === 'occupied').length;
  const totalSeatsCount = seatsList.length || library.seatsLimit || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <div>
        <Link
          to="/super-admin/libraries"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Libraries Management
        </Link>
      </div>

      {/* Profile Header Banner */}
      <div className="p-6 bg-card rounded-2xl border border-border shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
              {library.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">{library.name}</h1>
                <StatusBadge status={library.status} />
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                    isTrial
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                      : library.paymentStatus === 'paid'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}
                >
                  {isTrial ? <Sparkles className="w-3 h-3 text-purple-500" /> : <CreditCard className="w-3 h-3" />}
                  {isTrial ? 'FREE TRIAL' : (library.paymentStatus || 'PAID').toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                {library.address ? `${library.address}, ` : ''}{library.city}, {library.state} {library.pinCode || ''}
              </p>
            </div>
          </div>

          {/* Super Admin Actions Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Grant / Extend Trial */}
            <Button
              variant="secondary"
              leftIcon={<Sparkles className="w-4 h-4 text-purple-500" />}
              onClick={() => setGrantTrialOpen(true)}
              className="border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
            >
              Grant Trial
            </Button>

            {/* Reset Password */}
            <Button
              variant="secondary"
              leftIcon={<KeyRound className="w-4 h-4 text-amber-500" />}
              onClick={() => setResetPasswordOpen(true)}
              className="border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
            >
              Reset Owner Password
            </Button>

            {/* Suspend / Activate */}
            {library.status === 'active' ? (
              <Button
                variant="secondary"
                leftIcon={<PauseCircle className="w-4 h-4 text-amber-500" />}
                onClick={() => setConfirmDialog({ open: true, type: 'suspend' })}
                className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
              >
                Suspend
              </Button>
            ) : library.status === 'suspended' ? (
              <Button
                variant="secondary"
                leftIcon={<PlayCircle className="w-4 h-4 text-emerald-500" />}
                onClick={() => setConfirmDialog({ open: true, type: 'activate' })}
                className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
              >
                Activate
              </Button>
            ) : null}

            {/* Mark as Left / Closed */}
            {library.status !== 'left' && library.status !== 'deleted' && (
              <Button
                variant="secondary"
                leftIcon={<LogOut className="w-4 h-4 text-slate-500" />}
                onClick={() => setMarkLeftOpen(true)}
              >
                Mark Closed
              </Button>
            )}

            {/* Edit Library */}
            <Button variant="secondary" leftIcon={<Edit2 className="w-4 h-4" />} onClick={() => setEditModalOpen(true)}>
              Edit Library
            </Button>

            {/* Delete Library */}
            {library.status !== 'deleted' && (
              <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setConfirmDialog({ open: true, type: 'delete' })}>
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Executive Key Metrics (4 Card Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registered Students */}
        <div className="p-4 bg-card rounded-2xl border border-border space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Enrolled Members</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{studentsList.length}</p>
          <p className="text-2xs text-muted-foreground">Active student profiles</p>
        </div>

        {/* Seat Capacity & Occupancy */}
        <div className="p-4 bg-card rounded-2xl border border-border space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Seat Capacity</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Armchair className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {occupiedSeatsCount} <span className="text-sm font-normal text-muted-foreground">/ {totalSeatsCount}</span>
          </p>
          <p className="text-2xs text-muted-foreground">
            {totalSeatsCount > 0 ? `${Math.round((occupiedSeatsCount / totalSeatsCount) * 100)}% occupied` : 'No seats configured'}
          </p>
        </div>

        {/* Subscription Expiry Tracker */}
        <div className="p-4 bg-card rounded-2xl border border-border space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subscription Expiry</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {daysLeft !== null ? (daysLeft < 0 ? 'Expired' : `${daysLeft} days`) : 'Unlimited'}
          </p>
          <p className="text-2xs text-muted-foreground">
            {library.subscriptionEndDate ? `Valid until ${formatDate(library.subscriptionEndDate)}` : 'No expiry set'}
          </p>
        </div>

        {/* Subscription Plan Value */}
        <div className="p-4 bg-card rounded-2xl border border-border space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan Charge</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {subscription?.price !== undefined ? formatCurrency(subscription.price) : 'Custom'}
          </p>
          <p className="text-2xs text-muted-foreground">{subscription?.name || 'Default ERP Plan'}</p>
        </div>
      </div>

      {/* 2-Column Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Owner & Contact Information */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-amber-500" />
              Owner & Contact Information
            </h3>
            {phone && (
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${phone}`}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-semibold hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Owner
                </a>
                <a
                  href={getWhatsAppLink(phone, library.name, ownerName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-green-500/10 text-green-500 text-xs font-semibold hover:bg-green-500/20 transition-colors flex items-center gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                </a>
              </div>
            )}
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Owner Name</span>
              <span className="font-semibold text-foreground">{ownerName}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Contact Phone</span>
              <span className="font-mono text-foreground">{phone || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Email Address</span>
              <span className="font-mono text-foreground">{library.email}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">City & State</span>
              <span className="text-foreground">{library.city}, {library.state}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">Full Address</span>
              <span className="text-foreground text-right max-w-[60%]">{library.address || '—'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Subscription & System Details */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-500" />
              Subscription & Account Scope
            </h3>
            <span className="text-xs font-mono text-muted-foreground">ID: {library._id}</span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Current Plan</span>
              <span className="font-semibold text-foreground">{isTrial ? 'Free Trial' : subscription?.name || 'Standard Plan'}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Seats Limit</span>
              <span className="font-bold text-foreground font-mono">{library.seatsLimit} Seats</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Subscription Start</span>
              <span className="text-foreground">{library.subscriptionStartDate ? formatDate(library.subscriptionStartDate) : '—'}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Subscription Expiry</span>
              <span className="text-foreground font-medium">{library.subscriptionEndDate ? formatDate(library.subscriptionEndDate) : '—'}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">Onboarded Date</span>
              <span className="text-foreground">{formatDate(library.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Sub-View (Students / Payments) */}
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'students'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-surface-4'
            }`}
          >
            <Users className="w-4 h-4" />
            Enrolled Students ({studentsList.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'payments'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-surface-4'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Library Transactions ({paymentsList.length})
          </button>
        </div>

        {/* Tab 1: Students Table */}
        {activeTab === 'students' && (
          <div className="card overflow-hidden">
            {studentsLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading student records...</div>
            ) : studentsList.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No students enrolled in this library yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-2 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                    <tr>
                      <th className="p-3.5">Student</th>
                      <th className="p-3.5">ID</th>
                      <th className="p-3.5">Phone</th>
                      <th className="p-3.5">Plan</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Joined</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {studentsList.map((s) => (
                      <tr key={s._id} className="hover:bg-slate-50 dark:hover:bg-surface-2 transition-colors">
                        <td className="p-3.5 font-medium text-foreground">{s.name}</td>
                        <td className="p-3.5 font-mono text-xs text-brand-500 font-semibold">{formatStudentId(s.studentId)}</td>
                        <td className="p-3.5 font-mono text-xs">{s.phone}</td>
                        <td className="p-3.5 capitalize">{s.plan}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-2xs font-bold uppercase ${
                              s.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-xs text-muted-foreground">{formatDate(s.joinDate)}</td>
                        <td className="p-3.5 text-right">
                          <Link
                            to={`/students/${s._id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-500 hover:underline"
                          >
                            View Profile <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Payments Table */}
        {activeTab === 'payments' && (
          <div className="card overflow-hidden">
            {paymentsLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading payment records...</div>
            ) : paymentsList.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No payment transactions recorded for this library yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-2 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                    <tr>
                      <th className="p-3.5">Receipt #</th>
                      <th className="p-3.5">Student</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Method</th>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paymentsList.map((p) => {
                      const studentObj = typeof p.student === 'object' ? p.student : null;
                      return (
                        <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-surface-2 transition-colors">
                          <td className="p-3.5 font-mono text-xs text-brand-500 font-semibold">{p.receiptNumber}</td>
                          <td className="p-3.5 font-medium text-foreground">{studentObj?.name || '—'}</td>
                          <td className="p-3.5 font-bold text-emerald-500">{formatCurrency(p.amount)}</td>
                          <td className="p-3.5 uppercase text-xs">{p.method}</td>
                          <td className="p-3.5 capitalize text-xs">{p.type}</td>
                          <td className="p-3.5 text-xs text-muted-foreground">{formatDate(p.createdAt)}</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full text-2xs font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Modals */}
      {editModalOpen && (
        <EditLibraryModal
          open={editModalOpen}
          library={library}
          onClose={() => {
            setEditModalOpen(false);
            refetchLibrary();
          }}
        />
      )}

      {grantTrialOpen && (
        <GrantTrialModal
          open={grantTrialOpen}
          library={library}
          onClose={() => {
            setGrantTrialOpen(false);
            refetchLibrary();
          }}
        />
      )}

      {resetPasswordOpen && (
        <ResetOwnerPasswordModal
          open={resetPasswordOpen}
          library={library}
          onClose={() => setResetPasswordOpen(false)}
        />
      )}

      {markLeftOpen && (
        <MarkLibraryLeftModal
          library={library}
          onCancel={() => setMarkLeftOpen(false)}
          onSuccess={() => {
            setMarkLeftOpen(false);
            refetchLibrary();
          }}
        />
      )}

      {confirmDialog.open && (
        <ConfirmDialog
          open={confirmDialog.open}
          onClose={() => setConfirmDialog({ open: false, type: 'suspend' })}
          title={
            confirmDialog.type === 'suspend'
              ? 'Suspend Library Account'
              : confirmDialog.type === 'activate'
              ? 'Activate Library Account'
              : 'Delete Library Permanently'
          }
          message={
            confirmDialog.type === 'suspend'
              ? `Are you sure you want to suspend "${library.name}"? Users from this library will not be able to log in.`
              : confirmDialog.type === 'activate'
              ? `Are you sure you want to activate "${library.name}"?`
              : `Are you sure you want to permanently delete "${library.name}"? This action cannot be undone.`
          }
          confirmLabel={
            confirmDialog.type === 'suspend'
              ? 'Suspend'
              : confirmDialog.type === 'activate'
              ? 'Activate'
              : 'Delete'
          }
          confirmVariant={confirmDialog.type === 'delete' ? 'danger' : 'primary'}
          onConfirm={handleConfirmAction}
        />
      )}
    </div>
  );
}
