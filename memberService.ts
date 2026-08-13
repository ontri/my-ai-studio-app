import {
  Member,
  MembershipHistoryItem,
  PaymentMethod,
  PaymentStatus,
  FeePayment,
} from './types';

import {
  getMembersFromStorage,
  saveMembersToStorage,
  getPaymentsFromStorage,
} from './storage';

import {
  calculateMemberStatus,
  getTodayDateString,
} from './formatters';

import { createPayment } from './paymentService';

/**
 * Calculates dynamic payment status and pending amount
 * based on actual payments recorded.
 */
export function calculateMemberPaymentStatus(
  memberId: string,
  membershipAmount: number
): {
  paymentStatus: PaymentStatus;
  pendingAmount: number;
  totalPaid: number;
} {
  const payments = getPaymentsFromStorage();

  const memberPayments = payments.filter(
    (p) => p.memberId === memberId
  );

  const totalPaid = memberPayments.reduce(
    (sum, p) => sum + p.amount,
    0
  );

  const pendingAmount = Math.max(
    0,
    membershipAmount - totalPaid
  );

  let paymentStatus: PaymentStatus = 'Pending';

  if (totalPaid >= membershipAmount && membershipAmount > 0) {
    paymentStatus = 'Paid';
  } else if (totalPaid > 0) {
    paymentStatus = 'Partial';
  } else {
    paymentStatus = 'Pending';
  }

  return {
    paymentStatus,
    pendingAmount,
    totalPaid,
  };
}

/**
 * Retrieves all members with auto-calculated status
 * and payment information.
 */
export function getMembers(filters?: {
  searchQuery?: string;
  planFilter?: string;
  statusFilter?: string;
}): Member[] {
  let members = getMembersFromStorage();

  // Recalculate status and paymentStatus dynamically
  members = members.map((m) => {
    const status = calculateMemberStatus(m.expiryDate);

    const {
      paymentStatus,
      pendingAmount,
    } = calculateMemberPaymentStatus(
      m.id,
      m.amount
    );

    return {
      ...m,
      status,
      paymentStatus,
      pendingAmount,
    };
  });

  if (!filters) {
    return members;
  }

  const {
    searchQuery,
    planFilter,
    statusFilter,
  } = filters;

  return members.filter((m) => {
    // Search filter
    if (
      searchQuery &&
      searchQuery.trim() !== ''
    ) {
      const query = searchQuery
        .toLowerCase()
        .trim();

      const matchesName = m.fullName
        .toLowerCase()
        .includes(query);

      const matchesPhone = m.phone
        .toLowerCase()
        .includes(query);

      const matchesId = m.id
        .toLowerCase()
        .includes(query);

      const matchesEmail = m.email
        .toLowerCase()
        .includes(query);

      if (
        !matchesName &&
        !matchesPhone &&
        !matchesId &&
        !matchesEmail
      ) {
        return false;
      }
    }

    // Plan filter
    if (
      planFilter &&
      planFilter !== 'All'
    ) {
      if (
        m.planId !== planFilter &&
        m.planName !== planFilter
      ) {
        return false;
      }
    }

    // Status filter
    if (
      statusFilter &&
      statusFilter !== 'All'
    ) {
      if (m.status !== statusFilter) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Find member by ID.
 */
export function getMemberById(
  id: string
): Member | undefined {
  const members = getMembers();

  return members.find(
    (m) => m.id === id
  );
}

/**
 * Creates a new member record with auto-generated ID
 * and auto-calculated status.
 */
export function createMember(
  memberData: Omit<
    Member,
    'id' |
    'status' |
    'paymentStatus' |
    'pendingAmount'
  >
): Member {
  const members =
    getMembersFromStorage();

  // Generate unique sequential member ID
  // Example: GYM-1009
  const existingNumbers = members
    .map((m) =>
      parseInt(
        m.id.replace('GYM-', ''),
        10
      )
    )
    .filter(
      (n) => !isNaN(n)
    );

  const maxNum =
    existingNumbers.length > 0
      ? Math.max(...existingNumbers)
      : 1000;

  const newId =
    `GYM-${maxNum + 1}`;

  const status =
    calculateMemberStatus(
      memberData.expiryDate
    );

  const {
    paymentStatus,
    pendingAmount,
  } =
    calculateMemberPaymentStatus(
      newId,
      memberData.amount
    );

  const initialHistory: MembershipHistoryItem[] =
    [
      {
        id: `mhist-${Date.now()}`,
        memberId: newId,
        planId: memberData.planId,
        planName: memberData.planName,
        startDate: memberData.startDate,
        expiryDate: memberData.expiryDate,
        amount: memberData.amount,
        status,
        createdDate:
          memberData.joiningDate ||
          getTodayDateString(),
        type: 'New Membership',
      },
    ];

  const newMember: Member = {
    ...memberData,

    id: newId,

    status,

    paymentStatus,

    pendingAmount,

    membershipHistory:
      initialHistory,

    photoUrl:
      memberData.photoUrl ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
  };

  const updatedMembers = [
    newMember,
    ...members,
  ];

  saveMembersToStorage(
    updatedMembers
  );

  return newMember;
}

/**
 * Updates an existing member record.
 */
export function updateMember(
  updatedMember: Member
): Member {
  const members =
    getMembersFromStorage();

  const status =
    calculateMemberStatus(
      updatedMember.expiryDate
    );

  const {
    paymentStatus,
    pendingAmount,
  } =
    calculateMemberPaymentStatus(
      updatedMember.id,
      updatedMember.amount
    );

  const fullUpdated: Member = {
    ...updatedMember,
    status,
    paymentStatus,
    pendingAmount,
  };

  const updatedList =
    members.map((m) =>
      m.id === fullUpdated.id
        ? fullUpdated
        : m
    );

  saveMembersToStorage(
    updatedList
  );

  return fullUpdated;
}

export interface RenewalParams {
  memberId: string;
  planId: string;
  planName: string;
  startDate: string;
  expiryDate: string;
  amount: number;
  recordPayment?: boolean;
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  notes?: string;
}

/**
 * Renews a member's membership,
 * appends to history,
 * and optionally records payment.
 */
export function renewMembership(
  params: RenewalParams
): {
  updatedMember: Member;
  payment?: FeePayment;
} {
  const members =
    getMembersFromStorage();

  const member = members.find(
    (m) =>
      m.id === params.memberId
  );

  if (!member) {
    throw new Error(
      'Member not found'
    );
  }

  const newStatus =
    calculateMemberStatus(
      params.expiryDate
    );

  // Optional payment creation
  let newPayment:
    | FeePayment
    | undefined;

  if (
    params.recordPayment &&
    params.amount > 0
  ) {
    newPayment =
      createPayment({
        memberId: member.id,
        memberName: member.fullName,
        planName: params.planName,
        amount: params.amount,
        paymentDate:
          params.paymentDate ||
          getTodayDateString(),
        paymentMethod:
          params.paymentMethod ||
          'UPI',
        notes:
          params.notes ||
          `Renewal payment for ${params.planName}`,
        purpose: 'Renewal',
      });
  }

  // Create history item
  const historyItem:
    MembershipHistoryItem = {
      id: `mhist-${Date.now()}`,
      memberId: member.id,
      planId: params.planId,
      planName: params.planName,
      startDate: params.startDate,
      expiryDate: params.expiryDate,
      amount: params.amount,
      status: newStatus,
      createdDate:
        getTodayDateString(),
      type: 'Renewal',
      receiptNo:
        newPayment?.receiptNo,
    };

  const existingHistory =
    member.membershipHistory
      ? [...member.membershipHistory]
      : [];

  if (
    existingHistory.length === 0
  ) {
    existingHistory.push({
      id: `mhist-init-${member.id}`,
      memberId: member.id,
      planId: member.planId,
      planName: member.planName,
      startDate: member.startDate,
      expiryDate: member.expiryDate,
      amount: member.amount,
      status: member.status,
      createdDate:
        member.joiningDate,
      type: 'New Membership',
    });
  }

  const updatedHistory = [
    historyItem,
    ...existingHistory,
  ];

  const memberToUpdate: Member = {
    ...member,
    planId: params.planId,
    planName: params.planName,
    startDate: params.startDate,
    expiryDate: params.expiryDate,
    amount: params.amount,
    status: newStatus,
    membershipHistory:
      updatedHistory,
  };

  const finalMember =
    updateMember(
      memberToUpdate
    );

  return {
    updatedMember: finalMember,
    payment: newPayment,
  };
}

/**
 * Deletes a member record by ID.
 */
export function deleteMember(
  id: string
): boolean {
  const members =
    getMembersFromStorage();

  const filtered =
    members.filter(
      (m) => m.id !== id
    );

  if (
    filtered.length ===
    members.length
  ) {
    return false;
  }

  saveMembersToStorage(
    filtered
  );

  return true;
}
