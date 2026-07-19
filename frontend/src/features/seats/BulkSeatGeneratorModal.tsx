import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Layers3, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/axios';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';

type SeatType = 'standard' | 'premium';

interface BulkSeatResult {
  created: number;
  skipped: number;
  duplicates: string[];
}

interface BulkSeatGeneratorModalProps {
  floors: number[];
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_BATCH_SIZE = 500;

function makeSeatNumber(prefix: string, section: string, number: number, padding: number) {
  return `${(prefix || section).trim().toUpperCase()}${String(number).padStart(padding, '0')}`;
}

export function BulkSeatGeneratorModal({ floors, onClose, onSuccess }: BulkSeatGeneratorModalProps) {
  const [floor, setFloor] = useState(String(floors[0] ?? 1));
  const [section, setSection] = useState('A');
  const [prefix, setPrefix] = useState('');
  const [startNumber, setStartNumber] = useState('1');
  const [endNumber, setEndNumber] = useState('10');
  const [padding, setPadding] = useState('2');
  const [type, setType] = useState<SeatType>('standard');
  const [price, setPrice] = useState('500');
  const [reservedSeatCharge, setReservedSeatCharge] = useState('');
  const [result, setResult] = useState<BulkSeatResult | null>(null);

  const parsedStart = Number(startNumber);
  const parsedEnd = Number(endNumber);
  const rangeSize = parsedEnd - parsedStart + 1;
  const rangeIsValid = Number.isInteger(parsedStart)
    && Number.isInteger(parsedEnd)
    && parsedStart >= 0
    && parsedEnd >= parsedStart
    && rangeSize <= MAX_BATCH_SIZE;

  const preview = useMemo(() => {
    if (!rangeIsValid || !section.trim()) return [];
    return Array.from({ length: Math.min(rangeSize, 18) }, (_, index) =>
      makeSeatNumber(prefix, section, parsedStart + index, Number(padding))
    );
  }, [padding, parsedStart, prefix, rangeIsValid, rangeSize, section]);

  const inputError = !section.trim()
    ? 'Section is required'
    : !rangeIsValid
      ? `Enter a valid range of up to ${MAX_BATCH_SIZE} seats`
      : Number(price) < 0 || !price
        ? 'Monthly price must be zero or greater'
        : null;

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/seats/bulk-create', {
        floor: Number(floor),
        section: section.trim(),
        prefix: prefix.trim(),
        startNumber: parsedStart,
        endNumber: parsedEnd,
        padding: Number(padding),
        type,
        price: Number(price),
        reservedSeatCharge: reservedSeatCharge === '' ? null : Number(reservedSeatCharge),
      });
      return data.data as BulkSeatResult;
    },
    onSuccess: (data) => {
      setResult(data);
      onSuccess();
      toast.success(`${data.created} ${data.created === 1 ? 'seat' : 'seats'} created`);
      if (data.skipped) toast(`${data.skipped} duplicate ${data.skipped === 1 ? 'seat was' : 'seats were'} skipped`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Could not create seats');
    },
  });

  return (
    <Modal open onClose={onClose} title="Bulk Seat Generator" size="xl" className="max-h-[90vh] overflow-y-auto">
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Create a numbered seat range in one step. Existing seat numbers are skipped safely.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Floor"
            required
            value={floor}
            onChange={(event) => setFloor(event.target.value)}
            options={Array.from(new Set([...floors, 0, 1, 2, 3, 4, 5])).sort((a, b) => a - b).map((value) => ({ label: `Floor ${value}`, value: String(value) }))}
          />
          <Input label="Section" required value={section} onChange={(event) => setSection(event.target.value.toUpperCase())} placeholder="A" maxLength={20} />
          <Input label="Seat Prefix" value={prefix} onChange={(event) => setPrefix(event.target.value.toUpperCase())} placeholder="Defaults to section" maxLength={20} hint="Use this when the seat label should differ from the section." />
          <Select
            label="Number Padding"
            value={padding}
            onChange={(event) => setPadding(event.target.value)}
            options={[{ label: 'None (A1)', value: '0' }, { label: '2 digits (A01)', value: '2' }, { label: '3 digits (A001)', value: '3' }]}
          />
          <Input label="Start Number" required type="number" min={0} step={1} value={startNumber} onChange={(event) => setStartNumber(event.target.value)} />
          <Input label="End Number" required type="number" min={0} step={1} value={endNumber} onChange={(event) => setEndNumber(event.target.value)} />
          <Select
            label="Seat Type"
            value={type}
            onChange={(event) => setType(event.target.value as SeatType)}
            options={[{ label: 'Standard', value: 'standard' }, { label: 'Premium', value: 'premium' }]}
          />
          <Input label="Monthly Price (₹)" required type="number" min={0} step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} />
          <Input label="Reserved Seat Charge (₹)" type="number" min={0} step="0.01" value={reservedSeatCharge} onChange={(event) => setReservedSeatCharge(event.target.value)} hint="Optional one-time charge for reserving this seat." />
        </div>

        <section className="rounded-xl border border-border bg-surface-1/60 p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-500" />
              <h3 className="font-semibold text-foreground">Live Preview</h3>
            </div>
            <span className="text-xs text-muted-foreground">
              {rangeIsValid ? `${rangeSize} seat${rangeSize === 1 ? '' : 's'} will be checked` : 'Waiting for a valid range'}
            </span>
          </div>
          {preview.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {preview.map((seatNumber) => <span key={seatNumber} className="font-mono text-xs rounded-lg border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-brand-600 dark:text-brand-300">{seatNumber}</span>)}
              {rangeSize > preview.length && <span className="text-xs text-muted-foreground self-center">+ {rangeSize - preview.length} more</span>}
            </div>
          ) : <p className="text-sm text-muted-foreground">Enter a valid section and number range to preview seat labels.</p>}
          {inputError && <p className="error-msg mt-3">{inputError}</p>}
        </section>

        {result && (
          <section className="rounded-xl border border-success/30 bg-success-muted p-4">
            <div className="flex items-center gap-2 text-success font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Creation summary
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-muted-foreground">Created seats</p><p className="text-xl font-bold text-foreground">{result.created}</p></div>
              <div><p className="text-muted-foreground">Skipped duplicates</p><p className="text-xl font-bold text-foreground">{result.skipped}</p></div>
            </div>
            {result.duplicates.length > 0 && (
              <p className="mt-3 text-xs text-muted-foreground break-words">Duplicates: {result.duplicates.join(', ')}</p>
            )}
          </section>
        )}

        <div className="flex justify-between gap-3 pt-2 border-t border-border">
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground"><Layers3 className="w-4 h-4" /> Maximum {MAX_BATCH_SIZE} seats per batch</div>
          <div className="flex gap-3 ml-auto">
            <Button type="button" variant="secondary" onClick={onClose}>{result ? 'Done' : 'Cancel'}</Button>
            {!result && <Button type="button" disabled={Boolean(inputError)} loading={mutation.isPending} onClick={() => mutation.mutate()}>Create Seats</Button>}
          </div>
        </div>
      </div>
    </Modal>
  );
}
