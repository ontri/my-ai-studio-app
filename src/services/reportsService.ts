import { Member, AttendanceRecord, FeePayment } from '../types';
import { getMembers } from './memberService';
import { getAttendance } from './attendanceService';
import { getPayments } from './paymentService';

export interface MembershipReportSummary {
  totalMembers: number;
  activeCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  members: Member[];
  planDistribution: { planName: string; count: number; percentage: number }[];
  genderDemographics: { male: number; female: number; other: number };
}

export interface AttendanceReportSummary {
  date: string;
  totalPresent: number;
  totalAbsent: number;
  records: AttendanceRecord[];
}

export interface FeesReportSummary {
  totalAmountCollected: number;
  totalTransactionsCount: number;
  methodBreakdown: Record<string, number>;
  payments: FeePayment[];
}

/**
 * Generates Membership Report from persisted data
 */
export function getMembershipReport(filters?: {
  searchQuery?: string;
  planFilter?: string;
  statusFilter?: string;
}): MembershipReportSummary {
  const members = getMembers(filters);

  const totalMembers = members.length;
  const activeCount = members.filter((m) => m.status === 'Active').length;
  const expiringSoonCount = members.filter((m) => m.status === 'Expiring Soon').length;
  const expiredCount = members.filter((m) => m.status === 'Expired').length;

  // Plan distribution
  const planCounts: Record<string, number> = {};
  members.forEach((m) => {
    const planName = m.planName || 'Standard';
    planCounts[planName] = (planCounts[planName] || 0) + 1;
  });

  const planDistribution = Object.entries(planCounts).map(([planName, count]) => ({
    planName,
    count,
    percentage: totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0,
  }));

  // Gender demographics
  const genderDemographics = {
    male: members.filter((m) => m.gender === 'Male').length,
    female: members.filter((m) => m.gender === 'Female').length,
    other: members.filter((m) => m.gender === 'Other').length,
  };

  return {
    totalMembers,
    activeCount,
    expiringSoonCount,
    expiredCount,
    members,
    planDistribution,
    genderDemographics,
  };
}

/**
 * Generates Attendance Report from persisted data
 */
export function getAttendanceReport(filters?: {
  date?: string;
  memberId?: string;
  searchQuery?: string;
  statusFilter?: string;
}): AttendanceReportSummary {
  const records = getAttendance(filters);

  const totalPresent = records.filter((r) => r.status === 'Present').length;
  const totalAbsent = records.filter((r) => r.status === 'Absent').length;

  return {
    date: filters?.date || new Date().toISOString().split('T')[0],
    totalPresent,
    totalAbsent,
    records,
  };
}

/**
 * Generates Fees & Revenue Report from persisted data
 */
export function getFeesReport(filters?: {
  searchQuery?: string;
  memberId?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
}): FeesReportSummary {
  const payments = getPayments(filters);

  const totalAmountCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalTransactionsCount = payments.length;

  const methodBreakdown: Record<string, number> = {};
  payments.forEach((p) => {
    const method = p.paymentMethod || 'Other';
    methodBreakdown[method] = (methodBreakdown[method] || 0) + p.amount;
  });

  return {
    totalAmountCollected,
    totalTransactionsCount,
    methodBreakdown,
    payments,
  };
}
