import { Member, AttendanceRecord, FeePayment, GymSettings } from '../types';
import {
  getMembersFromStorage,
  saveMembersToStorage,
  getAttendanceFromStorage,
  saveAttendanceToStorage,
  getPaymentsFromStorage,
  savePaymentsToStorage,
  getGymSettingsFromStorage,
  saveGymSettingsToStorage,
} from '../utils/storage';

export interface BackupPayload {
  version: string;
  exportDate: string;
  app: string;
  data: {
    members: Member[];
    attendance: AttendanceRecord[];
    payments: FeePayment[];
    settings: GymSettings;
  };
}

/**
 * Creates a JSON backup object of current gym application data
 */
export function generateBackupData(): BackupPayload {
  const rawMembers = getMembersFromStorage();
  const rawAttendance = getAttendanceFromStorage();
  const rawPayments = getPaymentsFromStorage();
  const rawSettings = getGymSettingsFromStorage();

  // Strip any accidental sensitive password or token fields if present
  const sanitizedMembers = rawMembers.map((m) => {
    const copy: any = { ...m };
    delete copy.password;
    delete copy.token;
    delete copy.secret;
    return copy as Member;
  });

  const sanitizedSettings: any = { ...rawSettings };
  delete sanitizedSettings.password;
  delete sanitizedSettings.adminPassword;
  delete sanitizedSettings.secretKey;

  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    app: 'GymManagementApp',
    data: {
      members: sanitizedMembers,
      attendance: rawAttendance,
      payments: rawPayments,
      settings: sanitizedSettings as GymSettings,
    },
  };
}

/**
 * Triggers a file download of the JSON backup
 */
export function downloadBackupFile(): void {
  const backup = generateBackupData();
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split('T')[0];
  const gymSlug = (backup.data.settings.gymName || 'Gym')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
  const filename = `${gymSlug}_backup_${dateStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validates a backup JSON structure
 */
export function validateBackup(payload: any): { isValid: boolean; error?: string } {
  if (!payload || typeof payload !== 'object') {
    return { isValid: false, error: 'Invalid backup file.' };
  }

  // Support both wrapped payload structure ({ data: { members, attendance, payments, settings } })
  // and flat object ({ members, attendance, payments, settings })
  const data = payload.data && typeof payload.data === 'object' ? payload.data : payload;

  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Invalid backup file.' };
  }

  const { members, attendance, payments, settings } = data;

  if (!Array.isArray(members)) {
    return { isValid: false, error: 'Invalid backup file.' };
  }

  if (!Array.isArray(attendance)) {
    return { isValid: false, error: 'Invalid backup file.' };
  }

  if (!Array.isArray(payments)) {
    return { isValid: false, error: 'Invalid backup file.' };
  }

  if (!settings || typeof settings !== 'object') {
    return { isValid: false, error: 'Invalid backup file.' };
  }

  if (!Array.isArray(settings.plans)) {
    return { isValid: false, error: 'Invalid backup file.' };
  }

  // Validate item structures safely
  const isMemberValid = members.every(
    (m: any) =>
      m &&
      typeof m === 'object' &&
      typeof m.id === 'string' &&
      typeof m.fullName === 'string'
  );
  if (members.length > 0 && !isMemberValid) {
    return { isValid: false, error: 'Invalid backup file.' };
  }

  const isAttendanceValid = attendance.every(
    (a: any) =>
      a &&
      typeof a === 'object' &&
      typeof a.id === 'string' &&
      typeof a.memberId === 'string'
  );
  if (attendance.length > 0 && !isAttendanceValid) {
    return { isValid: false, error: 'Invalid backup file.' };
  }

  const isPaymentValid = payments.every(
    (p: any) =>
      p &&
      typeof p === 'object' &&
      typeof p.id === 'string' &&
      typeof p.amount === 'number'
  );
  if (payments.length > 0 && !isPaymentValid) {
    return { isValid: false, error: 'Invalid backup file.' };
  }

  return { isValid: true };
}

/**
 * Restores backup payload into storage after validation
 */
export function restoreBackup(jsonString: string): { success: boolean; message: string } {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    return { success: false, message: 'Invalid backup file.' };
  }

  const validation = validateBackup(parsed);
  if (!validation.isValid) {
    return { success: false, message: validation.error || 'Invalid backup file.' };
  }

  const data = parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;

  // Sanitize data before storing
  const cleanMembers = data.members.map((m: any) => {
    const copy = { ...m };
    delete copy.password;
    delete copy.secret;
    delete copy.token;
    return copy;
  });

  const cleanSettings = { ...data.settings };
  delete cleanSettings.password;
  delete cleanSettings.secret;

  saveMembersToStorage(cleanMembers);
  saveAttendanceToStorage(data.attendance);
  savePaymentsToStorage(data.payments);
  saveGymSettingsToStorage(cleanSettings);

  return { success: true, message: 'Backup restored successfully.' };
}
