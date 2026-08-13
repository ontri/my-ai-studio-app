import { Member, AttendanceRecord, FeePayment, GymSettings } from '../types';
import { initialMembers, initialAttendance, initialPayments, initialSettings } from './initialData';

const STORAGE_KEYS = {
  MEMBERS: 'gym_app_members',
  ATTENDANCE: 'gym_app_attendance',
  PAYMENTS: 'gym_app_payments',
  SETTINGS: 'gym_app_settings',
};

// Event name for reactive state updates across UI components
export const GYM_DATA_UPDATED_EVENT = 'gym_data_updated';

export function notifyChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(GYM_DATA_UPDATED_EVENT));
  }
}

// Low-Level Persistence: MEMBERS
export function getMembersFromStorage(): Member[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (!raw) {
      saveMembersToStorage(initialMembers);
      return initialMembers;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading members from localStorage', e);
    return initialMembers;
  }
}

export function saveMembersToStorage(members: Member[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    notifyChange();
  } catch (e) {
    console.error('Error saving members', e);
  }
}

// Low-Level Persistence: ATTENDANCE
export function getAttendanceFromStorage(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (!raw) {
      saveAttendanceToStorage(initialAttendance);
      return initialAttendance;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading attendance', e);
    return initialAttendance;
  }
}

export function saveAttendanceToStorage(records: AttendanceRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
    notifyChange();
  } catch (e) {
    console.error('Error saving attendance', e);
  }
}

// Low-Level Persistence: PAYMENTS
export function getPaymentsFromStorage(): FeePayment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    if (!raw) {
      savePaymentsToStorage(initialPayments);
      return initialPayments;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading payments', e);
    return initialPayments;
  }
}

export function savePaymentsToStorage(payments: FeePayment[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    notifyChange();
  } catch (e) {
    console.error('Error saving payments', e);
  }
}

// Low-Level Persistence: SETTINGS
export function getGymSettingsFromStorage(): GymSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      saveGymSettingsToStorage(initialSettings);
      return initialSettings;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading settings', e);
    return initialSettings;
  }
}

export function saveGymSettingsToStorage(settings: GymSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    notifyChange();
  } catch (e) {
    console.error('Error saving settings', e);
  }
}

// RESET ALL DATA TO INITIAL DEMO DATA
export function resetDataToDefaults(): void {
  localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(initialMembers));
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(initialAttendance));
  localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(initialPayments));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initialSettings));
  notifyChange();
}
