import { AttendanceRecord } from '../types';
import { getAttendanceFromStorage, saveAttendanceToStorage } from '../utils/storage';

/**
 * Get attendance records with optional filtering
 */
export function getAttendance(filters?: {
  date?: string;
  memberId?: string;
  searchQuery?: string;
  statusFilter?: string;
}): AttendanceRecord[] {
  let records = getAttendanceFromStorage();

  if (!filters) return records;

  const { date, memberId, searchQuery, statusFilter } = filters;

  return records.filter((r) => {
    if (date && r.date !== date) {
      return false;
    }
    if (memberId && r.memberId !== memberId) {
      return false;
    }
    if (statusFilter && statusFilter !== 'All' && r.status !== statusFilter) {
      return false;
    }
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchesName = r.memberName.toLowerCase().includes(q);
      const matchesId = r.memberId.toLowerCase().includes(q);
      if (!matchesName && !matchesId) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Get attendance for a specific member
 */
export function getMemberAttendance(memberId: string): AttendanceRecord[] {
  return getAttendance({ memberId });
}

export interface MarkAttendanceResult {
  record: AttendanceRecord;
  isDuplicate: boolean;
  isUpdated: boolean;
  isNew: boolean;
}

/**
 * Marks or updates attendance for a member on a given date.
 * Prevents duplicate records for the same member on the same date.
 */
export function markAttendance(
  memberId: string,
  memberName: string,
  date: string,
  status: 'Present' | 'Absent'
): MarkAttendanceResult {
  const attendance = getAttendanceFromStorage();

  const checkInTime =
    status === 'Present'
      ? new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      : '-';

  const existingIndex = attendance.findIndex(
    (a) => a.memberId === memberId && a.date === date
  );

  let updatedRecord: AttendanceRecord;
  let isDuplicate = false;
  let isUpdated = false;
  let isNew = false;

  if (existingIndex >= 0) {
    const existing = attendance[existingIndex];
    if (existing.status === status) {
      // Same status - duplicate attempt
      isDuplicate = true;
      updatedRecord = existing;
    } else {
      // Status changed Present <-> Absent - update record
      isUpdated = true;
      updatedRecord = {
        ...existing,
        memberName,
        status,
        checkInTime: status === 'Present' ? (existing.checkInTime !== '-' ? existing.checkInTime : checkInTime) : '-',
      };
      attendance[existingIndex] = updatedRecord;
      saveAttendanceToStorage(attendance);
    }
  } else {
    // Create new attendance record
    isNew = true;
    updatedRecord = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      memberId,
      memberName,
      date,
      checkInTime,
      status,
    };
    attendance.unshift(updatedRecord);
    saveAttendanceToStorage(attendance);
  }

  return {
    record: updatedRecord,
    isDuplicate,
    isUpdated,
    isNew,
  };
}

/**
 * Calculates member attendance summary metrics
 */
export function calculateMemberAttendanceSummary(
  memberId: string,
  attendanceRecords: AttendanceRecord[]
) {
  const memberRecords = attendanceRecords
    .filter((a) => a.memberId === memberId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const total = memberRecords.length;
  const present = memberRecords.filter((a) => a.status === 'Present').length;
  const absent = memberRecords.filter((a) => a.status === 'Absent').length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  const lastPresent = memberRecords.find((a) => a.status === 'Present');

  return {
    records: memberRecords,
    total,
    present,
    absent,
    percentage,
    lastCheckIn: lastPresent
      ? { date: lastPresent.date, time: lastPresent.checkInTime }
      : null,
  };
}

