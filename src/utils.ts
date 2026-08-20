import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely parses currency/number inputs handling both PT-BR ("155,01", "1.550,01")
 * and standard JS/HTML number strings ("155.01").
 */
export function parseCurrencyInput(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  const str = value.toString().trim();
  if (!str) return 0;

  // If contains comma (PT-BR format, e.g. "155,01" or "1.550,01")
  if (str.includes(',')) {
    const normalized = str.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  }

  // If standard dot decimal (e.g. "155.01" from number inputs or direct floats)
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

