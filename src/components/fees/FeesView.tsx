import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  PlusCircle,
  Search,
  Filter,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Calendar,
  X,
  FileText,
  Pencil,
  Trash2,
  UserCheck,
  Tag,
} from 'lucide-react';
import { Member, FeePayment, PaymentMethod, GymSettings } from '../../types';
import { formatCurrency, formatDate, getTodayDateString } from '../../utils/formatters';

interface FeesViewProps {
  members: Member[];
  payments: FeePayment[];
  settings: GymSettings;
  onRecordPayment: (paymentData: Omit<FeePayment, 'id' | 'receiptNo'>) => void;
  onUpdatePayment?: (id: string, paymentData: Partial<FeePayment>) => void;
  onDeletePayment?: (id: string) => void;
  selectedMemberForPayment?: Member | null;
  clearSelectedMember?: () => void;
}

export const FeesView: React.FC<FeesViewProps> = ({
  members,
  payments,
  settings,
  onRecordPayment,
  onUpdatePayment,
  onDeletePayment,
  selectedMemberForPayment,
  clearSelectedMember,
}) => {
  const today = getTodayDateString();

  const [activeTab, setActiveTab] = useState<'All' | 'Pending'>('All');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('All');
  const [purposeFilter, setPurposeFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<'All' | 'Today' | 'This Week' | 'This Month'>('All');

  // Modal states
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(
    Boolean(selectedMemberForPayment)
  );
  const [editingPayment, setEditingPayment] = useState<FeePayment | null>(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    selectedMemberForPayment?.id || (members[0]?.id || '')
  );
  const [planName, setPlanName] = useState<string>(
    selectedMemberForPayment?.planName || 'Monthly Plan'
  );
  const [amount, setAmount] = useState<number>(
    selectedMemberForPayment
      ? (selectedMemberForPayment.pendingAmount && selectedMemberForPayment.pendingAmount > 0
          ? selectedMemberForPayment.pendingAmount
          : selectedMemberForPayment.amount)
      : (members[0]?.pendingAmount && members[0]?.pendingAmount > 0 ? members[0]?.pendingAmount : (members[0]?.amount || 50))
  );
  const [paymentDate, setPaymentDate] = useState<string>(today);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [purpose, setPurpose] = useState<string>('New Membership');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Open modal when selectedMemberForPayment changes
  useEffect(() => {
    if (selectedMemberForPayment) {
      setSelectedMemberId(selectedMemberForPayment.id);
      setPlanName(selectedMemberForPayment.planName);
      setAmount(
        selectedMemberForPayment.pendingAmount && selectedMemberForPayment.pendingAmount > 0
          ? selectedMemberForPayment.pendingAmount
          : selectedMemberForPayment.amount
      );
      setPurpose('New Membership');
      setIsRecordModalOpen(true);
    }
  }, [selectedMemberForPayment]);

  // Selected Member Details calculation
  const currentSelectedMember = members.find((m) => m.id === selectedMemberId);
  const memberPayments = currentSelectedMember
    ? payments.filter((p) => p.memberId === currentSelectedMember.id)
    : [];
  const memberTotalPaid = memberPayments.reduce((sum, p) => sum + p.amount, 0);
  const memberTotalAmount = currentSelectedMember ? currentSelectedMember.amount : 0;
  const memberPendingAmount = currentSelectedMember
    ? Math.max(0, memberTotalAmount - memberTotalPaid)
    : 0;

  // Handle member dropdown change in form
  const handleMemberChange = (id: string) => {
    setSelectedMemberId(id);
    setPaymentError(null);
    const found = members.find((m) => m.id === id);
    if (found) {
      setPlanName(found.planName);
      const foundPaid = payments.filter((p) => p.memberId === found.id).reduce((s, p) => s + p.amount, 0);
      const pending = Math.max(0, found.amount - foundPaid);
      setAmount(pending > 0 ? pending : found.amount);
    }
  };

  // Open form in edit mode
  const handleOpenEditModal = (p: FeePayment) => {
    setEditingPayment(p);
    setSelectedMemberId(p.memberId);
    setPlanName(p.planName);
    setAmount(p.amount);
    setPaymentDate(p.paymentDate);
    setPaymentMethod(p.paymentMethod);
    setPurpose(p.purpose || 'Fee Payment');
    setPaymentNotes(p.notes || '');
    setPaymentError(null);
    setIsRecordModalOpen(true);
  };

  // Open form in create mode
  const handleOpenCreateModal = (m?: Member) => {
    setEditingPayment(null);
    if (m) {
      setSelectedMemberId(m.id);
      setPlanName(m.planName);
      const mPaid = payments.filter((p) => p.memberId === m.id).reduce((s, p) => s + p.amount, 0);
      const pending = Math.max(0, m.amount - mPaid);
      setAmount(pending > 0 ? pending : m.amount);
    } else if (members.length > 0) {
      const first = members[0];
      setSelectedMemberId(first.id);
      setPlanName(first.planName);
      const fPaid = payments.filter((p) => p.memberId === first.id).reduce((s, p) => s + p.amount, 0);
      const pending = Math.max(0, first.amount - fPaid);
      setAmount(pending > 0 ? pending : first.amount);
    }
    setPaymentDate(today);
    setPaymentMethod('UPI');
    setPurpose('New Membership');
    setPaymentNotes('');
    setPaymentError(null);
    setIsRecordModalOpen(true);
  };

  const closeModal = () => {
    setIsRecordModalOpen(false);
    setEditingPayment(null);
    setPaymentError(null);
    if (clearSelectedMember) clearSelectedMember();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    const found = members.find((m) => m.id === selectedMemberId);
    if (!found) {
      setPaymentError('Please select a valid member.');
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      setPaymentError('Payment amount must be greater than 0.');
      return;
    }

    if (!paymentDate) {
      setPaymentError('Payment date is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingPayment) {
        // Edit payment
        if (onUpdatePayment) {
          onUpdatePayment(editingPayment.id, {
            memberId: found.id,
            memberName: found.fullName,
            planName,
            amount: Number(amount),
            paymentDate,
            paymentMethod,
            purpose,
            notes: paymentNotes,
          });
        }
      } else {
        // Record new payment
        onRecordPayment({
          memberId: found.id,
          memberName: found.fullName,
          planName,
          amount: Number(amount),
          paymentDate,
          paymentMethod,
          paymentStatus: 'Paid',
          purpose,
          notes: paymentNotes,
        });
      }

      closeModal();
    } catch (err) {
      setPaymentError('Failed to save payment record. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm delete payment
  const handleConfirmDelete = () => {
    if (deletingPaymentId && onDeletePayment) {
      onDeletePayment(deletingPaymentId);
      setDeletingPaymentId(null);
    }
  };

  // METRICS CALCULATIONS
  const todayCollection = payments
    .filter((p) => p.paymentDate === today)
    .reduce((sum, p) => sum + p.amount, 0);

  const currentMonthStr = today.substring(0, 7);
  const thisMonthCollection = payments
    .filter((p) => p.paymentDate.startsWith(currentMonthStr))
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPendingFeesSum = members.reduce((sum, m) => {
    const mPaid = payments.filter((p) => p.memberId === m.id).reduce((s, p) => s + p.amount, 0);
    return sum + Math.max(0, m.amount - mPaid);
  }, 0);

  const pendingMembersList = members
    .map((m) => {
      const paid = payments.filter((p) => p.memberId === m.id).reduce((s, p) => s + p.amount, 0);
      const pending = Math.max(0, m.amount - paid);
      return {
        member: m,
        totalAmount: m.amount,
        paidAmount: paid,
        pendingAmount: pending,
        status: pending === 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Pending',
      };
    })
    .filter((item) => item.pendingAmount > 0);

  // FILTER PAYMENTS TABLE
  const filteredPayments = payments.filter((p) => {
    // Search query (Member Name, Member ID, Receipt Number)
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      p.memberName.toLowerCase().includes(q) ||
      p.memberId.toLowerCase().includes(q) ||
      p.receiptNo.toLowerCase().includes(q);

    // Method filter
    const matchesMethod = methodFilter === 'All' || p.paymentMethod === methodFilter;

    // Purpose filter
    const matchesPurpose = purposeFilter === 'All' || p.purpose === purposeFilter;

    // Date filter
    let matchesDate = true;
    if (dateFilter === 'Today') {
      matchesDate = p.paymentDate === today;
    } else if (dateFilter === 'This Month') {
      matchesDate = p.paymentDate.startsWith(currentMonthStr);
    } else if (dateFilter === 'This Week') {
      const pDate = new Date(p.paymentDate).getTime();
      const now = new Date(today).getTime();
      const diffDays = (now - pDate) / (1000 * 3600 * 24);
      matchesDate = diffDays >= 0 && diffDays <= 7;
    }

    return matchesSearch && matchesMethod && matchesPurpose && matchesDate;
  });

  return (
    <div className="space-y-6">
      {/* 1. SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Collection */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Today's Collection
            </span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {formatCurrency(todayCollection, settings.currencySymbol)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Recorded today ({formatDate(today)})</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: This Month's Collection */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              This Month's Collection
            </span>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {formatCurrency(thisMonthCollection, settings.currencySymbol)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Total for {currentMonthStr}</p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Total Pending */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Pending Dues
            </span>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {formatCurrency(totalPendingFeesSum, settings.currencySymbol)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{pendingMembersList.length} members with dues</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Total Payments */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Payments
            </span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{payments.length}</p>
            <p className="text-xs text-slate-400 mt-0.5">Recorded fee transactions</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. CONTROLS BAR (Tabs, Search, Filters & Record Button) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('All')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'All'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Payments ({payments.length})
            </button>
            <button
              onClick={() => setActiveTab('Pending')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'Pending'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span>Pending Fees ({pendingMembersList.length})</span>
            </button>
          </div>

          <button
            onClick={() => handleOpenCreateModal()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-md shadow-rose-600/20 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>

        {/* Search & Filters Row */}
        {activeTab === 'All' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative lg:col-span-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search Name, ID, Receipt #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Date Range Filter */}
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500 bg-white"
              >
                <option value="All">All Dates</option>
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
              </select>
            </div>

            {/* Payment Method Filter */}
            <div className="relative">
              <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500 bg-white"
              >
                <option value="All">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            {/* Purpose Filter */}
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <select
                value={purposeFilter}
                onChange={(e) => setPurposeFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500 bg-white"
              >
                <option value="All">All Purposes</option>
                <option value="New Membership">New Membership</option>
                <option value="Membership Renewal">Membership Renewal</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 3. TABLES CONTENT */}
      {activeTab === 'Pending' ? (
        /* PENDING FEES VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-amber-500/10 border-b border-amber-200/60 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Pending Fees Report</span>
            </h3>
            <span className="text-xs font-bold text-amber-800">
              {pendingMembersList.length} Outstanding Members
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Member</th>
                  <th className="py-3.5 px-4">Plan</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Paid</th>
                  <th className="py-3.5 px-4">Pending</th>
                  <th className="py-3.5 px-4">Expiry Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {pendingMembersList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                      All clear! No members have pending fees.
                    </td>
                  </tr>
                ) : (
                  pendingMembersList.map(({ member, totalAmount, paidAmount, pendingAmount, status }) => (
                    <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-semibold text-slate-900">{member.fullName}</p>
                          <p className="text-[10px] font-mono text-slate-400">{member.id}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">{member.planName}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 text-xs">
                        {formatCurrency(totalAmount, settings.currencySymbol)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-600 text-xs">
                        {formatCurrency(paidAmount, settings.currencySymbol)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-amber-600 text-xs">
                        {formatCurrency(pendingAmount, settings.currencySymbol)}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                        {formatDate(member.expiryDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenCreateModal(member)}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-xs"
                        >
                          Record Payment
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ALL PAYMENT RECEIPTS TABLE */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Receipt Number</th>
                  <th className="py-3.5 px-4">Member</th>
                  <th className="py-3.5 px-4">Plan</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Payment Date</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4">Purpose</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 text-sm">
                      No payment receipts found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Receipt Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-800">
                        {p.receiptNo}
                      </td>

                      {/* Member */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-semibold text-slate-900">{p.memberName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {p.memberId}</p>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-4 text-xs text-slate-600">{p.planName}</td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatCurrency(p.amount, settings.currencySymbol)}
                      </td>

                      {/* Payment Date */}
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                        {formatDate(p.paymentDate)}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                          {p.paymentMethod}
                        </span>
                      </td>

                      {/* Purpose */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-100">
                          {p.purpose || 'Fee Payment'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Paid</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                            title="Edit Payment"
                          >
                            <Pencil className="w-4 h-4 text-slate-600" />
                          </button>

                          <button
                            onClick={() => setDeletingPaymentId(p.id)}
                            className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors"
                            title="Delete Payment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. RECORD / EDIT PAYMENT FORM MODAL */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 relative animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingPayment ? 'Edit Payment Record' : 'Record Fee Payment'}
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4 text-xs">
              {paymentError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Select Member */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Select Member (Name or Member ID) *
                </label>
                <select
                  disabled={Boolean(editingPayment)}
                  value={selectedMemberId}
                  onChange={(e) => handleMemberChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500 bg-white disabled:bg-slate-100 font-semibold"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Display Member Dynamic Financial Summary Card */}
              {currentSelectedMember && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-slate-900">
                    <span className="font-bold text-sm">{currentSelectedMember.fullName}</span>
                    <span className="font-mono text-xs font-semibold text-slate-500">
                      {currentSelectedMember.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-slate-400 block">Plan:</span>
                      <strong className="text-slate-800">{currentSelectedMember.planName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Plan Price:</span>
                      <strong className="text-slate-800">
                        {formatCurrency(memberTotalAmount, settings.currencySymbol)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Already Paid:</span>
                      <strong className="text-emerald-600">
                        {formatCurrency(memberTotalPaid, settings.currencySymbol)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Pending Amount:</span>
                      <strong className="text-amber-600">
                        {formatCurrency(memberPendingAmount, settings.currencySymbol)}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Purpose */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Purpose *</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-rose-500 bg-white"
                >
                  <option value="New Membership">New Membership</option>
                  <option value="Membership Renewal">Membership Renewal</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Plan Name */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Plan / Item Name *</label>
                <input
                  type="text"
                  required
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Amount ({settings.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-rose-500 bg-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Transaction ID, UTR, Cash handed..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold shadow-md shadow-rose-600/20 transition-all"
                >
                  {isSubmitting ? 'Saving...' : editingPayment ? 'Update Payment' : 'Record & Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DELETE PAYMENT CONFIRMATION MODAL */}
      {deletingPaymentId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Delete Payment</h4>
                <p className="text-xs text-rose-700 font-medium">Irreversible Action</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete this payment?
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingPaymentId(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
