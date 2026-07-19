import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronDown, FileSpreadsheet, Layers3, Plus, UserCheck, UserX, Wrench, Settings2, Trash2 } from 'lucide-react';
import { api } from '../../lib/axios';
import { Seat, Student } from '../../types';
import { formatCurrency, formatStudentId } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { SeatStatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { SeatForm } from './SeatForm';
import { AssignSeatModal } from './AssignSeatModal';
import { StudentDetailsModal } from './StudentDetailsModal';
import { ConfirmReleaseModal } from './ConfirmReleaseModal';
import { ConfirmDeleteSeatModal } from './ConfirmDeleteSeatModal';
import { BulkSeatGeneratorModal } from './BulkSeatGeneratorModal';
import { ChangeSeatStatusModal } from './ChangeSeatStatusModal';
import { useAuth } from '../../store/auth.context';
import { cn } from '../../lib/utils';

const STATUS_COLORS: Record<string, string> = {
  available: 'border-success/30 bg-success-muted animate-glow-pulse hover:border-success/80 hover:scale-105 transition-all duration-300',
  occupied: 'border-info/30 bg-info-muted hover:border-info/70 hover:scale-105 hover:shadow-glow transition-all duration-300',
  reserved: 'border-warning/30 bg-warning-muted hover:border-warning/60 hover:scale-105 transition-all duration-300',
  maintenance: 'border-danger/30 bg-danger-muted hover:border-danger/60 cursor-pointer hover:scale-105 transition-all duration-300',
};

export function SeatsPage() {
  const { user } = useAuth();
  const isReceptionist = user?.role === 'receptionist';
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [assignSeat, setAssignSeat] = useState<Seat | null>(null);
  const [detailSeat, setDetailSeat] = useState<Seat | null>(null);
  const [releaseSeat, setReleaseSeat] = useState<Seat | null>(null);
  const [statusSeat, setStatusSeat] = useState<Seat | null>(null);
  const [deleteSeat, setDeleteSeat] = useState<Seat | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFloor, setFilterFloor] = useState('');
  const addMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (!addMenuRef.current?.contains(event.target as Node)) setAddMenuOpen(false);
    };
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, []);

  const { data: seats, isLoading } = useQuery<Seat[]>({
    queryKey: ['seats', filterStatus, filterFloor],
    queryFn: async () => {
      const { data } = await api.get('/seats', {
        params: { status: filterStatus || undefined, floor: filterFloor || undefined },
      });
      return data.data;
    },
  });

  const canManage = user?.role === 'owner' || user?.role === 'manager';
  const floors = [...new Set(seats?.map((s) => s.floor) || [])].sort();
  const grouped = floors.reduce<Record<number, Seat[]>>((acc, floor) => {
    acc[floor] = seats?.filter((s) => s.floor === floor) || [];
    return acc;
  }, {});

  const stats = {
    total: seats?.length || 0,
    available: seats?.filter((s) => s.status === 'available').length || 0,
    occupied: seats?.filter((s) => s.status === 'occupied').length || 0,
  };

  const handleSeatClick = (seat: Seat) => {
    setStatusSeat(seat);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Seat Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {stats.occupied}/{stats.total} occupied · {stats.available} available
          </p>
        </div>
        {canManage && (
          <div className="relative" ref={addMenuRef}>
            <Button
              leftIcon={<Plus className="w-4 h-4" />}
              rightIcon={<ChevronDown className="w-4 h-4" />}
              onClick={() => setAddMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={addMenuOpen}
            >
              Add Seat
            </Button>
            {addMenuOpen && (
              <div role="menu" className="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-border bg-card p-1.5 shadow-card animate-fade-in">
                <button
                  role="menuitem"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-foreground hover:bg-surface-1"
                  onClick={() => { setAddOpen(true); setAddMenuOpen(false); }}
                >
                  <Plus className="w-4 h-4 text-brand-500" /> Add Single Seat
                </button>
                <button
                  role="menuitem"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-foreground hover:bg-surface-1"
                  onClick={() => { setBulkOpen(true); setAddMenuOpen(false); }}
                >
                  <Layers3 className="w-4 h-4 text-brand-500" /> Bulk Seat Generator
                </button>
                <button role="menuitem" disabled className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground opacity-60">
                  <FileSpreadsheet className="w-4 h-4" /> Import Excel <span className="ml-auto rounded-full bg-surface-4 px-2 py-0.5 text-2xs">Coming Soon</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend + Filters */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {['available', 'occupied', 'reserved', 'maintenance'].map((s) => (
            <div key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className={cn('w-3 h-3 rounded', {
                'bg-success': s === 'available',
                'bg-info': s === 'occupied',
                'bg-warning': s === 'reserved',
                'bg-danger': s === 'maintenance',
              })} />
              <span className="capitalize">{s}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <select
            className="input py-1.5 text-xs w-auto"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <select
            className="input py-1.5 text-xs w-auto"
            value={filterFloor}
            onChange={(e) => setFilterFloor(e.target.value)}
          >
            <option value="">All Floors</option>
            {floors.map((f) => <option key={f} value={f}>Floor {f}</option>)}
          </select>
        </div>
      </div>

      {/* Seat Grid by Floor */}
      {isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="skeleton aspect-square rounded-xl" />
          ))}
        </div>
      ) : (
        Object.entries(grouped).map(([floor, floorSeats]) => (
          <div key={floor} className="card p-3 sm:p-5">
            <h2 className="section-title mb-3 sm:mb-4">Floor {floor}</h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 sm:gap-3">
              {floorSeats.map((seat) => (
                <div
                  key={seat._id}
                  onClick={() => handleSeatClick(seat)}
                  className={cn(
                    'relative border rounded-xl p-2.5 sm:p-3 cursor-pointer transition-all duration-300 group min-h-[68px] sm:min-h-[74px] flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md',
                    STATUS_COLORS[seat.status] || 'border-surface-5'
                  )}
                  title={`${seat.seatNumber} — ${seat.status}${seat.currentStudent && typeof seat.currentStudent === 'object' ? ` (${seat.currentStudent.name})` : ''}`}
                >
                  <p className="text-sm font-extrabold text-center text-foreground font-mono leading-none">{seat.seatNumber}</p>
                  {seat.type === 'premium' && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-warning rounded-full shadow-sm" title="Premium" />
                  )}

                  {/* Student name or status */}
                  {seat.status === 'occupied' && seat.currentStudent && typeof seat.currentStudent === 'object' ? (
                    <p className="text-xs font-medium text-center text-slate-700 dark:text-slate-200 mt-1.5 truncate w-full" title={seat.currentStudent.name}>
                      {seat.currentStudent.name}
                    </p>
                  ) : seat.status === 'available' ? (
                    <p className="text-xs font-bold text-center text-emerald-600 dark:text-emerald-400 mt-1.5 truncate w-full tracking-wide">Available</p>
                  ) : seat.status === 'reserved' ? (
                    <p className="text-xs font-bold text-center text-amber-600 dark:text-amber-400 mt-1.5 truncate w-full tracking-wide">Reserved</p>
                  ) : (
                    <p className="text-xs font-bold text-center text-red-600 dark:text-red-400 mt-1.5 truncate w-full tracking-wide">Maint.</p>
                  )}

                  {/* Hover Actions */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-card/90 rounded-xl">
                    <span className="text-2xs text-brand-500 font-semibold flex items-center gap-1">
                      <Settings2 className="w-3 h-3" /> Manage
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Table View */}
      {seats && seats.length > 0 && (
        <div className="card p-5">
          <h2 className="section-title mb-4">Seat List</h2>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Seat No.</th>
                  <th>Floor</th>
                  <th>Section</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Current Student</th>
                  <th>Price / Paid</th>
                  {canManage && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {seats.map((seat) => (
                  <tr key={seat._id}>
                    <td><span className="font-mono font-bold text-brand-600 dark:text-brand-300">{seat.seatNumber}</span></td>
                    <td>Floor {seat.floor}</td>
                    <td>{seat.section}</td>
                    <td className="capitalize">{seat.type}</td>
                    <td><SeatStatusBadge status={seat.status} /></td>
                    <td>
                      {seat.currentStudent && typeof seat.currentStudent === 'object' ? (
                        <Link to={`/students/${seat.currentStudent._id}`} className="group hover:underline flex flex-col">
                          <span className="font-medium text-foreground group-hover:text-brand-500 transition-colors">{seat.currentStudent.name}</span>
                          <span className="font-mono text-2xs text-brand-600 dark:text-brand-300 font-semibold">{formatStudentId(seat.currentStudent.studentId)}</span>
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td>
                      {seat.status === 'occupied' && seat.paidAmount !== undefined && !isReceptionist ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-success">{formatCurrency(seat.paidAmount)}</span>
                          {seat.paidAmount !== seat.price && (
                            <span className="text-2xs text-muted-foreground line-through font-mono">Base: {formatCurrency(seat.price)}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-foreground">{formatCurrency(seat.price)}</span>
                      )}
                    </td>
                    {canManage && (
                      <td>
                        <div className="flex justify-end gap-1">
                          <button
                            className="btn-ghost btn btn-sm gap-1 text-muted-foreground hover:text-foreground"
                            onClick={() => setStatusSeat(seat)}
                            title="Change Situation / Status"
                          >
                            <Wrench className="w-3.5 h-3.5 text-amber-500" /> Situation
                          </button>

                          {seat.status === 'available' && (
                            <button className="btn-ghost btn btn-sm gap-1.5 text-success" onClick={() => setAssignSeat(seat)}>
                              <UserCheck className="w-3.5 h-3.5" /> Assign
                            </button>
                          )}
                          {seat.status === 'occupied' && (
                            <button
                              className="btn-ghost btn btn-sm gap-1.5 text-info"
                              onClick={() => setDetailSeat(seat)}
                            >
                              <UserX className="w-3.5 h-3.5" /> Details
                            </button>
                          )}
                          <button
                            className="btn-ghost btn btn-sm gap-1 text-danger hover:bg-danger/10 hover:text-danger"
                            onClick={() => setDeleteSeat(seat)}
                            title="Remove Seat"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Seat Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Seat">
        <SeatForm
          onSuccess={() => { setAddOpen(false); queryClient.invalidateQueries({ queryKey: ['seats'] }); }}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>

      {bulkOpen && (
        <BulkSeatGeneratorModal
          floors={floors}
          onClose={() => setBulkOpen(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['seats'] })}
        />
      )}

      {/* Change Seat Status Modal */}
      {statusSeat && (
        <ChangeSeatStatusModal
          seat={statusSeat}
          onClose={() => setStatusSeat(null)}
          onAssignClick={() => {
            setAssignSeat(statusSeat);
            setStatusSeat(null);
          }}
          onReleaseClick={() => {
            setReleaseSeat(statusSeat);
            setStatusSeat(null);
          }}
          onRemoveClick={() => {
            setDeleteSeat(statusSeat);
            setStatusSeat(null);
          }}
          onSuccess={() => setStatusSeat(null)}
        />
      )}

      {/* Assign Seat Modal */}
      {assignSeat && (
        <AssignSeatModal
          seat={assignSeat}
          onClose={() => setAssignSeat(null)}
          onSuccess={() => { setAssignSeat(null); queryClient.invalidateQueries({ queryKey: ['seats'] }); }}
        />
      )}

      {/* Student Details Modal */}
      {detailSeat && detailSeat.currentStudent && typeof detailSeat.currentStudent === 'object' && (
        <StudentDetailsModal
          seat={detailSeat}
          student={detailSeat.currentStudent as Student}
          onClose={() => setDetailSeat(null)}
          onReleaseSeat={() => {
            setReleaseSeat(detailSeat);
            setDetailSeat(null);
          }}
          onChangeSeat={() => {
            setAssignSeat(detailSeat);
            setDetailSeat(null);
          }}
        />
      )}

      {/* Confirm Release Modal */}
      {releaseSeat && (
        <ConfirmReleaseModal
          seat={releaseSeat}
          onClose={() => setReleaseSeat(null)}
          onSuccess={() => setReleaseSeat(null)}
        />
      )}

      {/* Confirm Delete Seat Modal */}
      {deleteSeat && (
        <ConfirmDeleteSeatModal
          seat={deleteSeat}
          onClose={() => setDeleteSeat(null)}
          onSuccess={() => setDeleteSeat(null)}
        />
      )}
    </div>
  );
}
