import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind class merging utility */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format currency in INR */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format a date as "15 Jul 2025" */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

/** Format a date-time */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/** Days remaining until a date (based on real-time calendar day difference) */
export function daysRemaining(date: string | Date): number {
  if (!date) return 0;
  const target = new Date(date);
  if (isNaN(target.getTime())) return 0;

  const today = new Date();
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  return Math.round((targetMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
}

/** Capitalize first letter */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Get initials from name */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Debounce function */
export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/** Format Student ID compactly as STU-01, STU-02 */
export function formatStudentId(id?: string): string {
  if (!id) return '—';
  if (id.startsWith('STU-')) {
    const rawNum = id.replace('STU-', '');
    const num = parseInt(rawNum, 10);
    if (!isNaN(num)) {
      return `STU-${String(num).padStart(2, '0')}`;
    }
  }
  return id;
}

/** Get WhatsApp chat URL with auto-filled message */
export function getWhatsAppLink(phone: string, name: string, days?: number): string {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  const expiryText = days !== undefined && days <= 0
    ? 'has EXPIRED'
    : days !== undefined
      ? `will expire in ${days} day(s)`
      : 'is expiring soon';
  const msg = `Hi ${name}, your library membership ${expiryText}. Please renew your plan to continue your seat reservation. Thank you!`;
  return `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`;
}

/** Get direct phone call tel: link */
export function getCallLink(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  return `tel:+91${cleanPhone}`;
}
