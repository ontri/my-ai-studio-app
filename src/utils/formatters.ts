import { MemberStatus } from '../types';

/**
 * Format currency with symbol (default $)
 */
export function formatCurrency(amount: number, symbol = '$'): string {
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Calculate member status dynamically based on expiry date vs current date
 */
export function calculateMemberStatus(expiryDateStr: string): MemberStatus {
  if (!expiryDateStr) return 'Expired';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);
  
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'Expired';
  } else if (diffDays <= 7) {
    return 'Expiring Soon';
  } else {
    return 'Active';
  }
}

/**
 * Get color classes for member status badge
 */
export function getStatusBadgeClass(status: MemberStatus): string {
  switch (status) {
    case 'Active':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60';
    case 'Expiring Soon':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60';
    case 'Expired':
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60';
  }
}

/**
 * Get current date string YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add days to date string (YYYY-MM-DD)
 */
export function addDaysToDate(dateStr: string, days: number): string {
  if (!dateStr) return getTodayDateString();
  const parts = dateStr.split('-');
  if (parts.length !== 3) return getTodayDateString();
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);

  const date = new Date(y, m, d);
  date.setDate(date.getDate() + days);

  const resYear = date.getFullYear();
  const resMonth = String(date.getMonth() + 1).padStart(2, '0');
  const resDay = String(date.getDate()).padStart(2, '0');
  return `${resYear}-${resMonth}-${resDay}`;
}

/**
 * Add duration to date string with unit handling and month-end safety
 */
export function addDurationToDate(
  startDateStr: string,
  duration: number,
  unit: 'Months' | 'Days' | 'Years' = 'Months'
): string {
  if (!startDateStr) return getTodayDateString();
  const parts = startDateStr.split('-');
  if (parts.length !== 3) return getTodayDateString();
  
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);

  const date = new Date(y, m, d);

  if (unit === 'Days') {
    date.setDate(date.getDate() + duration);
  } else if (unit === 'Years') {
    date.setFullYear(date.getFullYear() + duration);
  } else {
    // Months - handle month-end bounds safely (e.g., Jan 31 + 1m -> Feb 28/29)
    const targetMonth = date.getMonth() + duration;
    date.setMonth(targetMonth);
    // If the day shifted because target month has fewer days
    if (date.getDate() !== d && d > 28) {
      date.setDate(0); // clamp to last day of intended month
    }
  }

  const resYear = date.getFullYear();
  const resMonth = String(date.getMonth() + 1).padStart(2, '0');
  const resDay = String(date.getDate()).padStart(2, '0');
  return `${resYear}-${resMonth}-${resDay}`;
}

/**
 * Add months to date string (YYYY-MM-DD) - alias to addDurationToDate
 */
export function addMonthsToDate(dateStr: string, months: number): string {
  return addDurationToDate(dateStr, months, 'Months');
}

/**
 * Calculate days remaining or days expired for a given expiry date
 */
export function calculateDaysRemaining(expiryDateStr: string): {
  days: number;
  isExpired: boolean;
  label: string;
} {
  if (!expiryDateStr) {
    return { days: 0, isExpired: true, label: 'Expired' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiryParts = expiryDateStr.split('-');
  if (expiryParts.length !== 3) {
    return { days: 0, isExpired: true, label: 'Expired' };
  }

  const expiry = new Date(
    parseInt(expiryParts[0], 10),
    parseInt(expiryParts[1], 10) - 1,
    parseInt(expiryParts[2], 10)
  );
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    return {
      days: diffDays,
      isExpired: true,
      label: `Expired ${absDays} day${absDays === 1 ? '' : 's'} ago`,
    };
  } else if (diffDays === 0) {
    return {
      days: 0,
      isExpired: false,
      label: 'Expires today',
    };
  } else {
    return {
      days: diffDays,
      isExpired: false,
      label: `${diffDays} day${diffDays === 1 ? '' : 's'} remaining`,
    };
  }
}

/**
 * Calculate renewal start date based on current status and expiry date
 */
export function calculateRenewalStartDate(expiryDateStr: string, currentStatus: MemberStatus): string {
  if (currentStatus === 'Active' || currentStatus === 'Expiring Soon') {
    return addDaysToDate(expiryDateStr, 1);
  }
  return getTodayDateString();
}

/**
 * Formats a date string (YYYY-MM-DD) into a human readable form (e.g. "Aug 15, 2026")
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(year, month, day);
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Export data array to CSV file download
 */
export function exportToCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map((row) => {
        return keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? '' : String(row[k]);
            cell = cell.replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
