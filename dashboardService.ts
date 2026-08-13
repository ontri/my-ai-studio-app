import { getMembers } from './memberService';
import { getAttendance } from './attendanceService';
import { getPayments } from './paymentService';
import { getTodayDateString, calculateDaysRemaining } from '../utils/formatters';
import { Member } from '../types';

export interface DashboardStatistics {
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  expiringSoonMembers: number;
  todayAttendanceCount: number;
  todayCollection: number;
  thisMonthCollection: number;
  pendingFees: number;
  expiringSoonList: Array<Member & { daysRemainingLabel: string; daysCount: number }>;
}

/**
 * Calculates real-time dashboard statistics from persisted data.
 */
export function getDashboardStatistics(): DashboardStatistics {
  const members = getMembers();
  const todayStr = getTodayDateString();
  const currentMonthStr = todayStr.substring(0, 7); // e.g. "2026-08"

  const attendanceToday = getAttendance({ date: todayStr });
  const allPayments = getPayments();

  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.status === 'Active').length;
  const expiredMembers = members.filter((m) => m.status === 'Expired').length;
  const expiringSoonMembers = members.filter((m) => m.status === 'Expiring Soon').length;

  // Memberships expiring within 7 days sorted by nearest expiry first
  const expiringSoonList = members
    .filter((m) => m.status === 'Expiring Soon' || (calculateDaysRemaining(m.expiryDate).days >= 0 && calculateDaysRemaining(m.expiryDate).days <= 7))
    .map((m) => {
      const daysInfo = calculateDaysRemaining(m.expiryDate);
      return {
        ...m,
        daysRemainingLabel: daysInfo.label,
        daysCount: daysInfo.days,
      };
    })
    .sort((a, b) => a.daysCount - b.daysCount);

  const todayAttendanceCount = attendanceToday.filter((a) => a.status === 'Present').length;

  const todayCollection = allPayments
    .filter((p) => p.paymentDate === todayStr)
    .reduce((sum, p) => sum + p.amount, 0);

  const thisMonthCollection = allPayments
    .filter((p) => p.paymentDate.startsWith(currentMonthStr))
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingFees = members.reduce((sum, m) => sum + (m.pendingAmount || 0), 0);

  return {
    totalMembers,
    activeMembers,
    expiredMembers,
    expiringSoonMembers,
    todayAttendanceCount,
    todayCollection,
    thisMonthCollection,
    pendingFees,
    expiringSoonList,
  };
}
