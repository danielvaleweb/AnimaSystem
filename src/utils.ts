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

/**
 * Calculates the next renewal date for a client.
 * If client.nextRenewalDate is defined (YYYY-MM-DD), uses it.
 * Otherwise, computes based on client.dueDate and current month.
 */
export function getClientRenewalDate(client: { nextRenewalDate?: string; dueDate?: number; createdAt?: string }): Date {
  if (client.nextRenewalDate && /^\d{4}-\d{2}-\d{2}/.test(client.nextRenewalDate)) {
    const [y, m, d] = client.nextRenewalDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  const now = new Date();
  const dueDay = Number(client.dueDate) || 10;
  
  // If today's day of month is less than or equal to dueDay, it's this month
  const targetDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
  if (now.getDate() > dueDay) {
    targetDate.setMonth(targetDate.getMonth() + 1);
  }
  return targetDate;
}

/**
 * Formats renewal date to dd/mm/aaaa
 */
export function formatClientRenewalDate(client: { nextRenewalDate?: string; dueDate?: number; createdAt?: string }): string {
  const d = getClientRenewalDate(client);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Computes remaining days until next renewal.
 * Negative number means overdue.
 */
export function getClientDaysUntilRenewal(client: { nextRenewalDate?: string; dueDate?: number; createdAt?: string }): number {
  const renewalDate = getClientRenewalDate(client);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  renewalDate.setHours(0, 0, 0, 0);

  const diffMs = renewalDate.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Checks if renewal alert banner should be displayed (<= 7 days or overdue up to 7 days)
 */
export function isClientRenewalAlert(client: { nextRenewalDate?: string; dueDate?: number; createdAt?: string; status?: string }): boolean {
  if (client.status === 'suspended' || client.status === 'ended') return false;
  const days = getClientDaysUntilRenewal(client);
  // Alert if 7 days or fewer before due date, OR overdue up to 7 days (before auto suspension on 8th day)
  return days <= 7 && days >= -7;
}

/**
 * Checks if client is past tolerance limit (8 days or more overdue)
 */
export function isClientAutoSuspended(client: { nextRenewalDate?: string; dueDate?: number; createdAt?: string; status?: string }): boolean {
  if (client.status === 'suspended' || client.status === 'ended') return true;
  const days = getClientDaysUntilRenewal(client);
  return days <= -8;
}

/**
 * Returns comprehensive renewal status information for the client
 */
export function getClientRenewalInfo(client: { nextRenewalDate?: string; dueDate?: number; createdAt?: string; status?: string }) {
  const days = getClientDaysUntilRenewal(client);
  const isSuspendedManual = client.status === 'suspended' || client.status === 'ended';
  const isSuspendedAuto = days <= -8;
  const isSuspended = isSuspendedManual || isSuspendedAuto;

  const isOverdue = days < 0;
  const overdueDays = isOverdue ? Math.abs(days) : 0;
  const toleranceRemaining = Math.max(0, 8 - overdueDays);

  let statusText = 'Regular';
  let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';

  if (isSuspended) {
    statusText = isSuspendedAuto ? 'Suspenso (Inadimplente 8d+)' : 'Suspenso';
    badgeClass = 'bg-rose-100 text-rose-700 border-rose-300';
  } else if (isOverdue) {
    statusText = `Vencido há ${overdueDays}d (Tolerância: ${toleranceRemaining}d)`;
    badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (days <= 7) {
    statusText = days === 0 ? 'Vence hoje' : `${days}d para vencer`;
    badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
  }

  const isAutoSuspended = isSuspendedAuto;
  const showWarning = !isSuspended && (isOverdue || days <= 7);
  const daysUntilDue = days >= 0 ? days : 0;

  return {
    days,
    daysUntilDue,
    isSuspended,
    isSuspendedAuto,
    isAutoSuspended,
    isOverdue,
    overdueDays,
    toleranceRemaining,
    showWarning,
    statusText,
    badgeClass,
    formattedDate: formatClientRenewalDate(client)
  };
}

export const DOMAIN_YEAR_PRICES: Record<number, number> = {
  1: 40,
  2: 80,
  3: 120,
  5: 200,
};

export const DOMAIN_YEAR_OPTIONS = [
  { years: 1, price: 40, label: '1 Ano (R$ 40,00)' },
  { years: 2, price: 80, label: '2 Anos (R$ 80,00)' },
  { years: 3, price: 120, label: '3 Anos (R$ 120,00)' },
  { years: 5, price: 200, label: '5 Anos (R$ 200,00)' },
];

/**
 * Calculates domain expiration date from contract date and duration years.
 */
export function getClientDomainExpirationDate(client: {
  domainContractDate?: string;
  domainExpirationDate?: string;
  domainDurationYears?: number;
  hireDate?: string;
  createdAt?: string;
}): Date {
  if (client.domainExpirationDate && /^\d{4}-\d{2}-\d{2}/.test(client.domainExpirationDate)) {
    const [y, m, d] = client.domainExpirationDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  const baseDateStr = client.domainContractDate || client.hireDate || client.createdAt;
  let baseDate = new Date();
  if (baseDateStr && /^\d{4}-\d{2}-\d{2}/.test(baseDateStr)) {
    const [y, m, d] = baseDateStr.split('-').map(Number);
    baseDate = new Date(y, m - 1, d);
  }

  const years = Number(client.domainDurationYears) || 1;
  const expDate = new Date(baseDate);
  expDate.setFullYear(expDate.getFullYear() + years);
  return expDate;
}

/**
 * Formats domain expiration date to dd/mm/aaaa
 */
export function formatClientDomainExpirationDate(client: {
  domainContractDate?: string;
  domainExpirationDate?: string;
  domainDurationYears?: number;
  hireDate?: string;
  createdAt?: string;
}): string {
  const d = getClientDomainExpirationDate(client);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Returns comprehensive domain validity and pricing info for a client
 */
export function getClientDomainInfo(client: {
  domain?: string;
  domainContractDate?: string;
  domainExpirationDate?: string;
  domainDurationYears?: number;
  domainPrice?: number;
  hireDate?: string;
  createdAt?: string;
}) {
  const years = Number(client.domainDurationYears) || 1;
  const price = client.domainPrice !== undefined ? client.domainPrice : (DOMAIN_YEAR_PRICES[years] ?? 40);
  const expDate = getClientDomainExpirationDate(client);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(expDate);
  checkDate.setHours(0, 0, 0, 0);

  const diffMs = checkDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isExpired = daysRemaining < 0;
  const isExpiringSoon = daysRemaining <= 30 && daysRemaining >= 0;

  const day = String(expDate.getDate()).padStart(2, '0');
  const month = String(expDate.getMonth() + 1).padStart(2, '0');
  const year = expDate.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;

  let statusText = '';
  if (isExpired) {
    statusText = `Vencido há ${Math.abs(daysRemaining)}d`;
  } else if (daysRemaining === 0) {
    statusText = 'Vence hoje';
  } else if (daysRemaining === 1) {
    statusText = '1 dia restante';
  } else {
    statusText = `${daysRemaining} dias restantes`;
  }

  return {
    years,
    price,
    expirationDate: expDate,
    formattedDate,
    daysRemaining,
    isExpired,
    isExpiringSoon,
    statusText,
  };
}

