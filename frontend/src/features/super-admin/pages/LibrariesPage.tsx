/**
 * LibrariesPage — management interface for all libraries on the platform.
 *
 * Supports search, filtering by status/payment/expiry, pagination, and action buttons for
 * editing, suspending, activating, deleting libraries, and creating new ones.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, PauseCircle, PlayCircle, Trash2, Library as LibraryIcon, CheckCircle2, XCircle, Clock, KeyRound, Sparkles, Phone, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

import {
  getLibraries,
  suspendLibrary,
  activateLibrary,
  deleteLibrary,
} from '../api/super-admin.api';
import { DataTable, type Column } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { CreateLibraryModal } from '../components/CreateLibraryModal';
import { EditLibraryModal } from '../components/EditLibraryModal';
import { GrantTrialModal } from '../components/GrantTrialModal';
import { ResetOwnerPasswordModal } from '../components/ResetOwnerPasswordModal';
import { LibraryCredentialsDialog } from '../components/LibraryCredentialsDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Button } from '../../../components/ui/Button';
import { formatDate, daysRemaining } from '../../../lib/utils';
import type { Library, CreateLibraryCredentials } from '../../../types';

type FilterTab = 'all' | 'active' | 'trial' | 'paid' | 'unpaid' | 'expiring_soon' | 'expired' | 'suspended';

export function LibrariesPage() {
  const queryClient = useQueryClient();

  // Filters & Pagination state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterTab>('all');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editLibrary, setEditLibrary] = useState<Library | null>(null);
  const [grantTrialLibrary, setGrantTrialLibrary] = useState<Library | null>(null);
  const [resetPasswordLibrary, setResetPasswordLibrary] = useState<Library | null>(null);
  const [credentials, setCredentials] = useState<CreateLibraryCredentials | null>(null);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'suspend' | 'activate' | 'delete';
    library: Library | null;
  }>({ open: false, type: 'suspend', library: null });

  // Fetch libraries
  const { data, isLoading } = useQuery({
    queryKey: ['super-admin', 'libraries', page, search, statusFilter],
    queryFn: () =>
      getLibraries({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter,
      }),
  });

  // Action mutations
  const suspendMutation = useMutation({
    mutationFn: suspendLibrary,
    onSuccess: (updated) => {
      toast.success(`Library "${updated.name}" suspended`);
      queryClient.invalidateQueries({ queryKey: ['super-admin'] });
      setConfirmDialog({ open: false, type: 'suspend', library: null });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to suspend library');
    },
  });

  const activateMutation = useMutation({
    mutationFn: activateLibrary,
    onSuccess: (updated) => {
      toast.success(`Library "${updated.name}" activated`);
      queryClient.invalidateQueries({ queryKey: ['super-admin'] });
      setConfirmDialog({ open: false, type: 'activate', library: null });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to activate library');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLibrary,
    onSuccess: () => {
      toast.success('Library deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['super-admin'] });
      setConfirmDialog({ open: false, type: 'delete', library: null });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete library');
    },
  });

  const handleConfirmAction = () => {
    if (!confirmDialog.library) return;
    const id = confirmDialog.library._id;

    if (confirmDialog.type === 'suspend') {
      suspendMutation.mutate(id);
    } else if (confirmDialog.type === 'activate') {
      activateMutation.mutate(id);
    } else if (confirmDialog.type === 'delete') {
      deleteMutation.mutate(id);
    }
  };

  // Helper for WhatsApp link formatting
  const getWhatsAppLink = (phoneStr: string, libraryName: string, ownerName: string) => {
    const clean = phoneStr.replace(/\D/g, '');
    const formattedPhone = clean.length === 10 ? `91${clean}` : clean;
    const msg = `Hello ${ownerName || 'Library Owner'}, regarding your library "${libraryName}" on our platform:`;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
  };

  // Table Columns
  const columns: Column<Library>[] = [
    {
      key: 'name',
      label: 'Library Name',
      render: (lib) => (
        <div>
          <p className="font-semibold text-foreground">{lib.name}</p>
          <p className="text-xs text-muted-foreground">{lib.city}, {lib.state}</p>
        </div>
      ),
    },
    {
      key: 'owner',
      label: 'Owner & Contact',
      render: (lib) => {
        const owner = typeof lib.owner === 'object' ? lib.owner : null;
        const ownerName = owner?.name || 'Owner';
        const phone = lib.phone || (owner as any)?.phone || '';

        return (
          <div>
            <p className="font-medium text-foreground">{ownerName}</p>
            <p className="text-xs text-muted-foreground">{lib.email}</p>
            {phone && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs font-mono text-muted-foreground">{phone}</span>
                <a
                  href={`tel:${phone}`}
                  className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  title={`Call ${ownerName} (${phone})`}
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
                <a
                  href={getWhatsAppLink(phone, lib.name, ownerName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 transition-colors"
                  title={`Send WhatsApp message to ${ownerName}`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'subscription',
      label: 'Plan',
      render: (lib) => {
        const sub = typeof lib.subscription === 'object' ? lib.subscription : null;
        return (
          <span className="text-xs font-semibold px-2 py-1 rounded-md bg-surface-2 border border-border">
            {lib.isTrial || lib.paymentStatus === 'trial' ? 'Free Trial' : sub ? sub.name : 'None'}
          </span>
        );
      },
    },
    {
      key: 'paymentStatus',
      label: 'Payment Status',
      render: (lib) => {
        const isTrial = lib.paymentStatus === 'trial' || lib.isTrial;
        return (
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
              isTrial
                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                : lib.paymentStatus === 'paid'
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                : lib.paymentStatus === 'pending'
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                : 'bg-red-500/10 text-red-500 border-red-500/20'
            }`}
          >
            {isTrial ? (
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            ) : lib.paymentStatus === 'paid' ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <XCircle className="w-3.5 h-3.5" />
            )}
            {isTrial ? 'FREE TRIAL' : lib.paymentStatus ? lib.paymentStatus.toUpperCase() : 'PAID'}
          </span>
        );
      },
    },
    {
      key: 'subscriptionEndDate',
      label: 'Subscription Expiry',
      render: (lib) => {
        if (!lib.subscriptionEndDate) return <span className="text-xs text-muted-foreground">N/A</span>;
        const days = daysRemaining(lib.subscriptionEndDate);
        return (
          <div>
            <p className="text-xs font-medium text-foreground">{formatDate(lib.subscriptionEndDate)}</p>
            <span
              className={`inline-flex items-center gap-1 text-2xs font-semibold mt-0.5 px-1.5 py-0.5 rounded border ${
                days < 0
                  ? 'bg-red-500/10 text-red-500 border-red-500/20'
                  : days <= 7
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  : lib.isTrial || lib.paymentStatus === 'trial'
                  ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                  : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
              }`}
            >
              <Clock className="w-3 h-3" />
              {days < 0 ? `Expired ${Math.abs(days)}d ago` : `${days} days left`}
            </span>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Account Status',
      render: (lib) => <StatusBadge status={lib.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (lib) => {
        const owner = typeof lib.owner === 'object' ? lib.owner : null;
        const ownerName = owner?.name || 'Owner';
        const phone = lib.phone || (owner as any)?.phone || '';

        return (
          <div className="flex items-center gap-1">
            {/* Quick Call */}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                title={`Call Owner (${phone})`}
              >
                <Phone className="w-4 h-4" />
              </a>
            )}

            {/* Quick WhatsApp Message */}
            {phone && (
              <a
                href={getWhatsAppLink(phone, lib.name, ownerName)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-green-500 hover:bg-green-500/10 transition-colors"
                title={`WhatsApp Message Owner (${phone})`}
              >
                <MessageSquare className="w-4 h-4" />
              </a>
            )}

            {/* Grant / Extend Free Trial */}
            <button
              onClick={() => setGrantTrialLibrary(lib)}
              className="p-1.5 rounded-lg text-purple-500 hover:bg-purple-500/10 transition-colors"
              title="Grant / Extend Free Trial"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Edit */}
            <button
              onClick={() => setEditLibrary(lib)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-surface-4 transition-colors"
              title="Edit Library / Renewal"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            {/* Reset Owner Password */}
            <button
              onClick={() => setResetPasswordLibrary(lib)}
              className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors"
              title="Reset Owner Password"
            >
              <KeyRound className="w-4 h-4" />
            </button>

            {/* Suspend / Activate */}
            {lib.status === 'active' ? (
              <button
                onClick={() => setConfirmDialog({ open: true, type: 'suspend', library: lib })}
                className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors"
                title="Suspend Library"
              >
                <PauseCircle className="w-4 h-4" />
              </button>
            ) : lib.status === 'suspended' ? (
              <button
                onClick={() => setConfirmDialog({ open: true, type: 'activate', library: lib })}
                className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                title="Activate Library"
              >
                <PlayCircle className="w-4 h-4" />
              </button>
            ) : null}

            {/* Delete */}
            {lib.status !== 'deleted' && (
              <button
                onClick={() => setConfirmDialog({ open: true, type: 'delete', library: lib })}
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                title="Delete Library"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <LibraryIcon className="w-6 h-6 text-amber-500" />
            Libraries Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track onboarded libraries, free trial periods, paid/unpaid subscription statuses, and upcoming plan expiries.
          </p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setCreateModalOpen(true)}>
          Create Library
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto scrollable">
        {[
          { id: 'all', label: 'All Onboarded' },
          { id: 'active', label: 'Active' },
          { id: 'trial', label: '🎁 Free Trial' },
          { id: 'paid', label: 'Paid' },
          { id: 'unpaid', label: 'Unpaid / Pending' },
          { id: 'expiring_soon', label: 'Expiring Soon (<= 7d)' },
          { id: 'expired', label: 'Expired' },
          { id: 'suspended', label: 'Suspended' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setStatusFilter(tab.id as FilterTab);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === tab.id
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-surface-4'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data?.libraries || []}
        loading={isLoading}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search library name, email, city..."
        page={page}
        totalPages={data?.meta.totalPages || 1}
        total={data?.meta.total || 0}
        onPageChange={setPage}
        emptyMessage="No libraries match your filter"
      />

      {/* Modals & Dialogs */}
      <CreateLibraryModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={(creds) => setCredentials(creds)}
      />

      <EditLibraryModal
        open={!!editLibrary}
        onClose={() => setEditLibrary(null)}
        library={editLibrary}
      />

      <GrantTrialModal
        open={!!grantTrialLibrary}
        onClose={() => setGrantTrialLibrary(null)}
        library={grantTrialLibrary}
      />

      <ResetOwnerPasswordModal
        open={!!resetPasswordLibrary}
        onClose={() => setResetPasswordLibrary(null)}
        library={resetPasswordLibrary}
      />

      <LibraryCredentialsDialog
        open={!!credentials}
        onClose={() => setCredentials(null)}
        credentials={credentials}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, type: 'suspend', library: null })}
        onConfirm={handleConfirmAction}
        title={
          confirmDialog.type === 'suspend'
            ? 'Suspend Library'
            : confirmDialog.type === 'activate'
            ? 'Activate Library'
            : 'Delete Library'
        }
        message={
          confirmDialog.type === 'suspend'
            ? `Are you sure you want to suspend "${confirmDialog.library?.name}"? The owner and staff will not be able to log in.`
            : confirmDialog.type === 'activate'
            ? `Are you sure you want to activate "${confirmDialog.library?.name}"? Access will be restored.`
            : `Are you sure you want to delete "${confirmDialog.library?.name}"? This performs a soft delete.`
        }
        confirmLabel={
          confirmDialog.type === 'suspend'
            ? 'Suspend'
            : confirmDialog.type === 'activate'
            ? 'Activate'
            : 'Delete'
        }
        confirmVariant={confirmDialog.type === 'activate' ? 'primary' : 'danger'}
        loading={
          suspendMutation.isPending || activateMutation.isPending || deleteMutation.isPending
        }
      />
    </div>
  );
}
