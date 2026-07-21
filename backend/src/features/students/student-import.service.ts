/**
 * Student bulk import service — parses Excel/CSV files and creates students in bulk.
 * Supports .xlsx, .xls, and .csv files.
 */

import * as XLSX from 'xlsx';
import { Student } from './student.model';
import { PLAN_TYPE, STUDENT_STATUS } from '../../shared/constants';

interface ImportedRow {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  plan?: string;
  joinDate?: string | number | Date;
  shiftType?: string;
  shiftHours?: number | string;
  startTime?: string;
  endTime?: string;
  notes?: string;
}

export interface ImportResult {
  totalRows: number;
  created: number;
  skipped: number;
  errors: { row: number; name?: string; reason: string }[];
}

const VALID_PLANS = new Set(Object.values(PLAN_TYPE));

function normalizePhone(raw: unknown): string {
  if (raw == null) return '';
  let phone = String(raw).trim().replace(/[\s\-().+]/g, '');
  // Strip country code prefix
  if (phone.startsWith('91') && phone.length === 12) phone = phone.slice(2);
  if (phone.startsWith('+91')) phone = phone.slice(3);
  return phone;
}

function normalizePlan(raw: unknown): string {
  if (!raw) return 'monthly';
  const plan = String(raw).trim().toLowerCase().replace(/[\s_]+/g, '-');
  if (VALID_PLANS.has(plan as any)) return plan;
  // Common aliases
  const aliases: Record<string, string> = {
    'month': 'monthly',
    'quarter': 'quarterly',
    'half-year': 'half-yearly',
    'halfyearly': 'half-yearly',
    'half yearly': 'half-yearly',
    'year': 'yearly',
    'annual': 'yearly',
  };
  return aliases[plan] || 'monthly';
}

function parseDate(raw: unknown): Date {
  if (!raw) return new Date();
  // Excel serial number
  if (typeof raw === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + raw * 86400000);
  }
  const d = new Date(String(raw));
  return isNaN(d.getTime()) ? new Date() : d;
}

async function getNextStudentId(libraryId?: string): Promise<number> {
  const filter = libraryId ? { libraryId } : {};
  const last = await Student.findOne(filter, { studentId: 1 }).sort({ createdAt: -1 }).lean();
  if (!last) return 1;
  const parts = last.studentId.split('-');
  return parts[1] ? parseInt(parts[1], 10) + 1 : 1;
}

/**
 * Parse an uploaded Excel/CSV buffer and bulk-create student records.
 */
export async function importStudentsFromFile(
  fileBuffer: Buffer,
  originalName: string,
  libraryId: string | undefined,
  createdBy: string
): Promise<ImportResult> {
  // Parse workbook
  const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { totalRows: 0, created: 0, skipped: 0, errors: [{ row: 0, reason: 'No sheets found in file' }] };
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (rawRows.length === 0) {
    return { totalRows: 0, created: 0, skipped: 0, errors: [{ row: 0, reason: 'File is empty or has no data rows' }] };
  }

  // Normalize column headers (case-insensitive, trim, lowercase)
  const rows: ImportedRow[] = rawRows.map((raw) => {
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(raw)) {
      const normalizedKey = key.trim().toLowerCase().replace(/[\s_]+/g, '');
      // Map common column name variations
      if (['name', 'studentname', 'fullname'].includes(normalizedKey)) normalized.name = value;
      else if (['email', 'emailaddress', 'emailid'].includes(normalizedKey)) normalized.email = value;
      else if (['phone', 'phonenumber', 'mobile', 'mobilenumber', 'contact', 'contactnumber'].includes(normalizedKey)) normalized.phone = value;
      else if (['address', 'fulladdress'].includes(normalizedKey)) normalized.address = value;
      else if (['plan', 'membership', 'membershipplan', 'plantype'].includes(normalizedKey)) normalized.plan = value;
      else if (['joindate', 'dateofjoining', 'joiningdate', 'startdate'].includes(normalizedKey)) normalized.joinDate = value;
      else if (['shifttype', 'shift'].includes(normalizedKey)) normalized.shiftType = value;
      else if (['shifthours', 'hours'].includes(normalizedKey)) normalized.shiftHours = value;
      else if (['starttime'].includes(normalizedKey)) normalized.startTime = value;
      else if (['endtime'].includes(normalizedKey)) normalized.endTime = value;
      else if (['notes', 'remarks', 'comment', 'comments'].includes(normalizedKey)) normalized.notes = value;
    }
    return normalized as ImportedRow;
  });

  const result: ImportResult = { totalRows: rows.length, created: 0, skipped: 0, errors: [] };
  let nextId = await getNextStudentId(libraryId);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 because row 1 is header, data starts at row 2

    try {
      // Validate required fields
      const name = row.name ? String(row.name).trim() : '';
      if (!name || name.length < 2) {
        result.errors.push({ row: rowNum, name, reason: 'Name is missing or too short (min 2 chars)' });
        result.skipped++;
        continue;
      }

      const phone = normalizePhone(row.phone);
      if (!/^[6-9]\d{9}$/.test(phone)) {
        result.errors.push({ row: rowNum, name, reason: `Invalid phone number: "${row.phone}" (must be 10-digit Indian number starting with 6-9)` });
        result.skipped++;
        continue;
      }

      // Check for duplicate phone in this library
      const existingFilter: Record<string, unknown> = { phone };
      if (libraryId) existingFilter.libraryId = libraryId;
      const existing = await Student.findOne(existingFilter, { _id: 1 }).lean();
      if (existing) {
        result.errors.push({ row: rowNum, name, reason: `Duplicate phone number "${phone}" — student already exists` });
        result.skipped++;
        continue;
      }

      const email = row.email ? String(row.email).trim().toLowerCase() : undefined;
      if (email && !/^\S+@\S+\.\S+$/.test(email)) {
        result.errors.push({ row: rowNum, name, reason: `Invalid email: "${email}"` });
        result.skipped++;
        continue;
      }

      const plan = normalizePlan(row.plan);
      const joinDate = parseDate(row.joinDate);
      const studentId = `STU-${String(nextId).padStart(2, '0')}`;
      nextId++;

      const studentData: Record<string, unknown> = {
        studentId,
        name,
        phone,
        plan,
        joinDate,
        status: STUDENT_STATUS.ACTIVE,
        createdBy,
        ...(email && { email }),
        ...(row.address && { address: String(row.address).trim() }),
        ...(row.shiftType && { shiftType: String(row.shiftType).trim() }),
        ...(row.shiftHours && { shiftHours: Number(row.shiftHours) || undefined }),
        ...(row.startTime && { startTime: String(row.startTime).trim() }),
        ...(row.endTime && { endTime: String(row.endTime).trim() }),
        ...(row.notes && { notes: String(row.notes).trim() }),
        ...(libraryId && { libraryId }),
      };

      const student = new Student(studentData);
      await student.save();
      result.created++;
    } catch (err: any) {
      const reason = err?.message || 'Unknown error';
      result.errors.push({ row: rowNum, name: row.name ? String(row.name) : undefined, reason });
      result.skipped++;
    }
  }

  return result;
}

/**
 * Generate a sample Excel template buffer for student import.
 */
export function generateStudentTemplate(): Buffer {
  const templateData = [
    {
      Name: 'John Doe',
      Email: 'john@example.com',
      Phone: '9876543210',
      Address: '123 Main Street',
      Plan: 'monthly',
      'Join Date': '2025-01-15',
      'Shift Type': 'full_day',
      'Shift Hours': 24,
      'Start Time': '06:00',
      'End Time': '22:00',
      Notes: 'Sample student',
    },
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(templateData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 20 }, // Name
    { wch: 25 }, // Email
    { wch: 15 }, // Phone
    { wch: 30 }, // Address
    { wch: 12 }, // Plan
    { wch: 15 }, // Join Date
    { wch: 12 }, // Shift Type
    { wch: 12 }, // Shift Hours
    { wch: 12 }, // Start Time
    { wch: 12 }, // End Time
    { wch: 25 }, // Notes
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}
