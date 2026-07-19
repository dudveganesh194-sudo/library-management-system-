import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Seat, Student } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import toast from 'react-hot-toast';

interface AssignSeatModalProps {
  seat: Seat;
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignSeatModal({ seat, onClose, onSuccess }: AssignSeatModalProps) {
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const { data: students } = useQuery<Student[]>({
    queryKey: ['students-search', search],
    queryFn: async () => {
      const { data } = await api.get('/students', { params: { search, status: 'active', limit: 10 } });
      return data.data;
    },
  });

  const mutation = useMutation({
    mutationFn: () => api.put(`/seats/${seat._id}/assign`, { studentId: selectedStudent!._id }),
    onSuccess: () => { toast.success(`Seat ${seat.seatNumber} assigned to ${selectedStudent?.name}`); onSuccess(); },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Assignment failed';
      toast.error(msg);
    },
  });

  return (
    <Modal open={true} onClose={onClose} title={`Assign Seat ${seat.seatNumber}`}>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Search for an active student to assign to this seat.</p>
        <SearchInput placeholder="Search students..." onSearch={setSearch} />
        <div className="max-h-60 overflow-y-auto space-y-2">
          {students?.map((student) => (
            <div
              key={student._id}
              onClick={() => setSelectedStudent(student)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedStudent?._id === student._id
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-border hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              <p className="text-sm font-medium text-foreground">{student.name}</p>
              <p className="text-xs text-muted-foreground">{student.studentId} · {student.phone}</p>
            </div>
          ))}
          {students?.length === 0 && search && (
            <p className="text-center text-muted-foreground text-sm py-4">No students found</p>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button disabled={!selectedStudent} loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Assign Seat
          </Button>
        </div>
      </div>
    </Modal>
  );
}
