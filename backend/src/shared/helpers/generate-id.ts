/**
 * ID generation utilities.
 */

import { customAlphabet } from 'nanoid';

// Generates a short, readable student ID like STU-01
let counter = 0;

export function generateStudentId(prefix = 'STU'): string {
  counter += 1;
  return `${prefix}-${String(counter).padStart(2, '0')}`;
}

// Receipt number: REC-YYYYMMDD-XXXX
export function generateReceiptNumber(): string {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 4);
  return `REC-${dateStr}-${nanoid()}`;
}
