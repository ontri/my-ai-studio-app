import { FeePayment } from '../types';
import { getPaymentsFromStorage, savePaymentsToStorage } from './storage';
import { getMembers, updateMember } from './memberService';

export interface PaymentFilters {
  searchQuery?: string;
  memberId?: string;
  paymentMethod?: string;
  purpose?: string;
  startDate?: string;
  endDate?: string;
  dateRange?: 'Today' | 'This Week' | 'This Month' | 'All' | 'Custom';
}

/**
 * Get fee payments with optional filters
 */
export function getPayments(filters?: PaymentFilters): FeePayment[] {
  let payments = getPaymentsFromStorage();

  if (!filters) return payments;

  const { searchQuery, memberId, paymentMethod, purpose, startDate, endDate, dateRange } = filters;
  const todayStr = new Date().toISOString().split('T')[0];

  return payments.filter((p) => {
    if (memberId && p.memberId !== memberId) {
      return false;
    }
    if (paymentMethod && paymentMethod !== 'All' && p.paymentMethod !== paymentMethod) {
      return false;
    }
    if (purpose && purpose !== 'All' && p.purpose !== purpose) {
      return false;
    }

    // Date range filters
    if (dateRange === 'Today' && p.paymentDate !== todayStr) {
      return false;
    }
    if (dateRange === 'This Month' && !p.paymentDate.startsWith(todayStr.substring(0, 7))) {
      return false;
    }
    if (dateRange === 'This Week') {
      const pDate = new Date(p.paymentDate).getTime();
      const now = new Date(todayStr).getTime();
      const diffDays = (now - pDate) / (1000 * 3600 * 24);
      if (diffDays < 0 || diffDays > 7) return false;
    }

    if (startDate && p.paymentDate < startDate) {
      return false;
    }
    if (endDate && p.paymentDate > endDate) {
      return false;
    }

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchesReceipt = p.receiptNo.toLowerCase().includes(q);
      const matchesMember = p.memberName.toLowerCase().includes(q);
      const matchesId = p.memberId.toLowerCase().includes(q);
      if (!matchesReceipt && !matchesMember && !matchesId) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Get all payments for a specific member
 */
export function getMemberPayments(memberId: string): FeePayment[] {
  return getPayments({ memberId });
}

/**
 * Generates a unique sequential receipt number e.g. GYM-2026-0001
 */
export function generateUniqueReceiptNo(): string {
  const payments = getPaymentsFromStorage();
  const currentYear = new Date().getFullYear();

  // Find all existing numbers to guarantee uniqueness
  const existingNumbers: number[] = [];

  payments.forEach((p) => {
    const parts = p.receiptNo.split('-');
    if (parts.length >= 3) {
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num)) existingNumbers.push(num);
    }
  });

  const nextNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  const paddedNum = String(nextNum).padStart(4, '0');
  const candidate = `GYM-${currentYear}-${paddedNum}`;

  const isDuplicate = payments.some((p) => p.receiptNo === candidate);
  if (isDuplicate) {
    return `GYM-${currentYear}-${String(nextNum + 10).padStart(4, '0')}`;
  }

  return candidate;
}

/**
 * Creates and records a new payment.
 * Automatically generates a unique receipt number and updates member payment status.
 */
export function createPayment(
  paymentData: Omit<FeePayment, 'id' | 'receiptNo' | 'paymentStatus'> & { paymentStatus?: 'Paid' | 'Pending' }
): FeePayment {
  const payments = getPaymentsFromStorage();
  const receiptNo = generateUniqueReceiptNo();

  const newPayment: FeePayment = {
    ...paymentData,
    id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    receiptNo,
    paymentStatus: paymentData.paymentStatus || 'Paid',
    purpose: paymentData.purpose || 'Fee Payment',
  };

  const updatedPayments = [newPayment, ...payments];
  savePaymentsToStorage(updatedPayments);

  // Recalculate member payment status and save member
  const members = getMembers();
  const member = members.find((m) => m.id === paymentData.memberId);
  if (member) {
    updateMember(member);
  }

  return newPayment;
}

/**
 * Updates an existing payment record.
 * Receipt number is preserved and cannot be changed.
 * Recalculates member balance and updates member state.
 */
export function updatePayment(
  id: string,
  updatedData: Partial<Omit<FeePayment, 'id' | 'receiptNo'>>
): FeePayment | null {
  const payments = getPaymentsFromStorage();
  const index = payments.findIndex((p) => p.id === id);

  if (index === -1) return null;

  const existing = payments[index];
  const updatedPayment: FeePayment = {
    ...existing,
    ...updatedData,
    id: existing.id,
    receiptNo: existing.receiptNo, // Preserve receipt number
  };

  payments[index] = updatedPayment;
  savePaymentsToStorage(payments);

  // Recalculate member payment status and save member
  const members = getMembers();
  const member = members.find((m) => m.id === updatedPayment.memberId);
  if (member) {
    updateMember(member);
  }

  return updatedPayment;
}

/**
 * Deletes a payment record by ID.
 * Recalculates member balance and updates member state.
 */
export function deletePayment(id: string): boolean {
  const payments = getPaymentsFromStorage();
  const paymentToDelete = payments.find((p) => p.id === id);

  if (!paymentToDelete) return false;

  const filtered = payments.filter((p) => p.id !== id);
  savePaymentsToStorage(filtered);

  // Recalculate member payment status
  const members = getMembers();
  const member = members.find((m) => m.id === paymentToDelete.memberId);
  if (member) {
    updateMember(member);
  }

  return true;
}
