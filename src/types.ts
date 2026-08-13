export type MemberStatus = 'Active' | 'Expiring Soon' | 'Expired';

export type PaymentStatus = 'Paid' | 'Pending' | 'Partial';

export type Gender = 'Male' | 'Female' | 'Other';

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Other';

export interface MembershipPlan {
  id: string;
  name: string;
  durationMonths: number; // retained for backward compatibility
  duration?: number;
  durationUnit?: 'Months' | 'Days' | 'Years';
  price: number;
  description?: string;
  isActive?: boolean;
}

export interface MembershipHistoryItem {
  id: string;
  memberId: string;
  planId: string;
  planName: string;
  startDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  amount: number;
  status: MemberStatus;
  createdDate: string;
  receiptNo?: string;
  type?: 'New Membership' | 'Renewal';
}

export interface Member {
  id: string; // e.g., 'GYM-1001'
  fullName: string;
  phone: string;
  email: string;
  dob: string; // YYYY-MM-DD
  gender: Gender;
  address: string;
  joiningDate: string; // YYYY-MM-DD
  planId: string;
  planName: string;
  startDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  amount: number;
  paymentStatus: PaymentStatus;
  photoUrl: string;
  status: MemberStatus;
  emergencyContact?: string;
  notes?: string;
  pendingAmount?: number;
  membershipHistory?: MembershipHistoryItem[];
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // e.g. "07:30 AM"
  status: 'Present' | 'Absent';
}

export interface FeePayment {
  id: string;
  receiptNo: string;
  memberId: string;
  memberName: string;
  planName: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  paymentStatus: 'Paid' | 'Pending';
  notes?: string;
  purpose?: 'New Membership' | 'Renewal' | 'Fee Payment' | string;
}

export interface GymSettings {
  gymName: string;
  gymLogo: string;
  address: string;
  phone: string;
  email: string;
  adminName: string;
  adminEmail: string;
  plans: MembershipPlan[];
  currencySymbol: string;
}

export type TabType = 'dashboard' | 'members' | 'attendance' | 'fees' | 'reports' | 'settings';
