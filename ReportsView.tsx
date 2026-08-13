import React, { useState, useMemo } from 'react';
import {
  Users,
  CalendarCheck,
  CreditCard,
  Download,
  Printer,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Calendar,
  DollarSign,
  TrendingUp,
  Tag,
  ArrowUpDown,
  FileText,
  Clock,
  ChevronRight,
  BarChart3,
  Layers,
} from 'lucide-react';
import { Member, AttendanceRecord, FeePayment, GymSettings, MemberStatus, PaymentMethod } from '../../types';
import {
  formatCurrency,
  formatDate,
  calculateDaysRemaining,
  getTodayDateString,
  exportToCSV,
} from '../../utils/formatters';

interface ReportsViewProps {
  members: Member[];
  attendance: AttendanceRecord[];
  payments: FeePayment[];
  settings: GymSettings;
}

type ReportType = 'membership' | 'attendance' | 'fees';
type DateRangeType = 'today' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'custom' | 'all';

export const ReportsView: React.FC<ReportsViewProps> = ({
  members,
  attendance,
  payments,
  settings,
}) => {
  const today = getTodayDateString();

  // Active Report Tab
  const [reportType, setReportType] = useState<ReportType>('membership');

  // Shared Date Range state
  const [dateRange, setDateRange] = useState<DateRangeType>('thisMonth');
  const [customStartDate, setCustomStartDate] = useState<string>(
    `${today.substring(0, 7)}-01`
  );
  const [customEndDate, setCustomEndDate] = useState<string>(today);

  // MEMBERSHIP REPORT FILTERS
  const [memberStatusFilter, setMemberStatusFilter] = useState<string>('All');
  const [memberSearch, setMemberSearch] = useState<string>('');

  // ATTENDANCE REPORT FILTERS
  const [attendanceSubTab, setAttendanceSubTab] = useState<'log' | 'summary'>('log');
  const [attendanceMemberFilter, setAttendanceMemberFilter] = useState<string>('All');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState<string>('All');
  const [attendanceSearch, setAttendanceSearch] = useState<string>('');
  const [summarySortBy, setSummarySortBy] = useState<'name' | 'present' | 'percentage'>('name');
  const [summarySortDir, setSummarySortDir] = useState<'asc' | 'desc'>('asc');

  // FEES REPORT FILTERS
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('All');
  const [purposeFilter, setPurposeFilter] = useState<string>('All');
  const [feeSearch, setFeeSearch] = useState<string>('');

  // Date Range Bounds calculation
  const dateBounds = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const format = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    if (dateRange === 'today') {
      return { startDate: today, endDate: today, label: formatDate(today) };
    }

    if (dateRange === 'thisWeek') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 6);
      const s = format(startOfWeek);
      return {
        startDate: s,
        endDate: today,
        label: `${formatDate(s)} – ${formatDate(today)}`,
      };
    }

    if (dateRange === 'thisMonth') {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const s = format(firstDay);
      const e = format(lastDay);
      return {
        startDate: s,
        endDate: e,
        label: `${formatDate(s)} – ${formatDate(e)}`,
      };
    }

    if (dateRange === 'lastMonth') {
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      const s = format(firstDay);
      const e = format(lastDay);
      return {
        startDate: s,
        endDate: e,
        label: `${formatDate(s)} – ${formatDate(e)}`,
      };
    }

    if (dateRange === 'custom') {
      return {
        startDate: customStartDate,
        endDate: customEndDate,
        label: `${formatDate(customStartDate)} – ${formatDate(customEndDate)}`,
      };
    }

    return { startDate: '', endDate: '', label: 'All Time Records' };
  }, [dateRange, customStartDate, customEndDate, today]);

  // Date Validation Error
  const isCustomDateError =
    dateRange === 'custom' &&
    Boolean(customStartDate) &&
    Boolean(customEndDate) &&
    customStartDate > customEndDate;

  // ==========================================
  // 1. MEMBERSHIP REPORT DATA
  // ==========================================
  const filteredMembers = useMemo(() => {
    if (isCustomDateError) return [];

    return members.filter((m) => {
      // Date filter
      if (dateBounds.startDate && dateBounds.endDate) {
        if (m.startDate > dateBounds.endDate || m.expiryDate < dateBounds.startDate) {
          return false;
        }
      }

      // Status filter
      if (memberStatusFilter !== 'All' && m.status !== memberStatusFilter) {
        return false;
      }

      // Search filter
      if (memberSearch.trim() !== '') {
        const q = memberSearch.toLowerCase().trim();
        const matchesName = m.fullName.toLowerCase().includes(q);
        const matchesId = m.id.toLowerCase().includes(q);
        if (!matchesName && !matchesId) return false;
      }

      return true;
    });
  }, [members, dateBounds, memberStatusFilter, memberSearch, isCustomDateError]);

  const totalMembersCount = members.length;
  const activeMembersCount = members.filter((m) => m.status === 'Active').length;
  const expiringSoonCount = members.filter((m) => m.status === 'Expiring Soon').length;
  const expiredMembersCount = members.filter((m) => m.status === 'Expired').length;

  // ==========================================
  // 2. ATTENDANCE REPORT DATA
  // ==========================================
  const filteredAttendance = useMemo(() => {
    if (isCustomDateError) return [];

    return attendance.filter((a) => {
      // Date filter
      if (dateBounds.startDate && dateBounds.endDate) {
        if (a.date < dateBounds.startDate || a.date > dateBounds.endDate) {
          return false;
        }
      }

      // Member filter
      if (attendanceMemberFilter !== 'All' && a.memberId !== attendanceMemberFilter) {
        return false;
      }

      // Status filter
      if (attendanceStatusFilter !== 'All' && a.status !== attendanceStatusFilter) {
        return false;
      }

      // Search filter
      if (attendanceSearch.trim() !== '') {
        const q = attendanceSearch.toLowerCase().trim();
        const matchesName = a.memberName.toLowerCase().includes(q);
        const matchesId = a.memberId.toLowerCase().includes(q);
        if (!matchesName && !matchesId) return false;
      }

      return true;
    });
  }, [
    attendance,
    dateBounds,
    attendanceMemberFilter,
    attendanceStatusFilter,
    attendanceSearch,
    isCustomDateError,
  ]);

  const totalAttendanceRecords = filteredAttendance.length;
  const presentAttendanceCount = filteredAttendance.filter((a) => a.status === 'Present').length;
  const absentAttendanceCount = filteredAttendance.filter((a) => a.status === 'Absent').length;
  const attendanceRate =
    totalAttendanceRecords > 0
      ? ((presentAttendanceCount / totalAttendanceRecords) * 100).toFixed(1)
      : '0.0';

  // Monthly Attendance Summary Aggregation
  const monthlySummaryList = useMemo(() => {
    if (isCustomDateError) return [];

    // Filter attendance by date range first
    const recordsInRange = attendance.filter((a) => {
      if (dateBounds.startDate && dateBounds.endDate) {
        return a.date >= dateBounds.startDate && a.date <= dateBounds.endDate;
      }
      return true;
    });

    const relevantMembers =
      attendanceMemberFilter !== 'All'
        ? members.filter((m) => m.id === attendanceMemberFilter)
        : members;

    const list = relevantMembers.map((m) => {
      const mRecs = recordsInRange.filter((a) => a.memberId === m.id);
      const present = mRecs.filter((a) => a.status === 'Present').length;
      const absent = mRecs.filter((a) => a.status === 'Absent').length;
      const total = present + absent;
      const pct = total > 0 ? (present / total) * 100 : 0;

      return {
        memberId: m.id,
        memberName: m.fullName,
        presentDays: present,
        absentDays: absent,
        totalDays: total,
        percentage: Number(pct.toFixed(1)),
      };
    });

    // Apply search filter
    const searchFiltered = list.filter((item) => {
      if (attendanceSearch.trim() === '') return true;
      const q = attendanceSearch.toLowerCase().trim();
      return (
        item.memberName.toLowerCase().includes(q) || item.memberId.toLowerCase().includes(q)
      );
    });

    // Apply sort
    return searchFiltered.sort((a, b) => {
      let comparison = 0;
      if (summarySortBy === 'name') {
        comparison = a.memberName.localeCompare(b.memberName);
      } else if (summarySortBy === 'present') {
        comparison = a.presentDays - b.presentDays;
      } else if (summarySortBy === 'percentage') {
        comparison = a.percentage - b.percentage;
      }
      return summarySortDir === 'asc' ? comparison : -comparison;
    });
  }, [
    members,
    attendance,
    dateBounds,
    attendanceMemberFilter,
    attendanceSearch,
    summarySortBy,
    summarySortDir,
    isCustomDateError,
  ]);

  // ==========================================
  // 3. FEES REPORT DATA
  // ==========================================
  const filteredPayments = useMemo(() => {
    if (isCustomDateError) return [];

    return payments.filter((p) => {
      // Date filter
      if (dateBounds.startDate && dateBounds.endDate) {
        if (p.paymentDate < dateBounds.startDate || p.paymentDate > dateBounds.endDate) {
          return false;
        }
      }

      // Method filter
      if (paymentMethodFilter !== 'All' && p.paymentMethod !== paymentMethodFilter) {
        return false;
      }

      // Purpose filter
      if (purposeFilter !== 'All' && (p.purpose || 'New Membership') !== purposeFilter) {
        return false;
      }

      // Search filter
      if (feeSearch.trim() !== '') {
        const q = feeSearch.toLowerCase().trim();
        const matchesName = p.memberName.toLowerCase().includes(q);
        const matchesId = p.memberId.toLowerCase().includes(q);
        const matchesReceipt = p.receiptNo.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesReceipt) return false;
      }

      return true;
    });
  }, [payments, dateBounds, paymentMethodFilter, purposeFilter, feeSearch, isCustomDateError]);

  const totalCollectionSum = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  const totalPendingDuesSum = members.reduce((sum, m) => {
    const paid = payments.filter((p) => p.memberId === m.id).reduce((s, p) => s + p.amount, 0);
    return sum + Math.max(0, m.amount - paid);
  }, 0);

  const paymentCount = filteredPayments.length;
  const averagePayment =
    paymentCount > 0 ? Math.round(totalCollectionSum / paymentCount) : 0;

  // ==========================================
  // EXPORT CSV HANDLER
  // ==========================================
  const handleExportCSV = () => {
    if (isCustomDateError) return;

    if (reportType === 'membership') {
      const data = filteredMembers.map((m) => {
        const daysRem = calculateDaysRemaining(m.expiryDate);
        return {
          'Member ID': m.id,
          'Member Name': m.fullName,
          'Membership Plan': m.planName,
          'Start Date': m.startDate,
          'Expiry Date': m.expiryDate,
          Status: m.status,
          'Days Remaining': daysRem.label,
          'Membership Amount': m.amount,
          'Payment Status': m.paymentStatus,
        };
      });
      exportToCSV('gym-members-report', data);
    } else if (reportType === 'attendance') {
      if (attendanceSubTab === 'log') {
        const data = filteredAttendance.map((a) => ({
          Date: a.date,
          'Member ID': a.memberId,
          'Member Name': a.memberName,
          Status: a.status,
          'Check-in Time': a.checkInTime || 'N/A',
        }));
        exportToCSV('gym-attendance-report', data);
      } else {
        const data = monthlySummaryList.map((s) => ({
          'Member Name': s.memberName,
          'Member ID': s.memberId,
          'Present Days': s.presentDays,
          'Absent Days': s.absentDays,
          'Total Days': s.totalDays,
          'Attendance Percentage': `${s.percentage}%`,
        }));
        exportToCSV('gym-attendance-monthly-summary', data);
      }
    } else if (reportType === 'fees') {
      const data = filteredPayments.map((p) => ({
        'Receipt Number': p.receiptNo,
        Member: p.memberName,
        'Member ID': p.memberId,
        Amount: p.amount,
        'Payment Date': p.paymentDate,
        'Payment Method': p.paymentMethod,
        Purpose: p.purpose || 'Fee Payment',
      }));
      exportToCSV('gym-fees-report', data);
    }
  };

  const currentGeneratedDateStr = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-6">
      {/* GLOBAL PRINT STYLES */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .print\\:hidden, header, sidebar, button, select, input, .no-print {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print-header {
            display: block !important;
            margin-bottom: 24px;
            padding-bottom: 12px;
            border-bottom: 2px solid #0f172a;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            padding: 8px 12px !important;
            text-align: left !important;
            color: #0f172a !important;
          }
          th {
            background-color: #f1f5f9 !important;
            font-weight: bold !important;
          }
        }
      `}</style>

      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:block print-header">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">
              {settings.gymName || 'Gym Management App'}
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              {settings.address || 'Gym Operations Report'}
              {settings.phone ? ` | Phone: ${settings.phone}` : ''}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-extrabold text-rose-600 uppercase">
              {reportType === 'membership'
                ? 'Membership Report'
                : reportType === 'attendance'
                ? 'Attendance Report'
                : 'Fees & Revenue Report'}
            </h2>
            <p className="text-xs font-semibold text-slate-700">Date Range: {dateBounds.label}</p>
            <p className="text-[10px] text-slate-500">Generated: {currentGeneratedDateStr}</p>
          </div>
        </div>
      </div>

      {/* 1. TOP CONTROLS BAR (Report Type, Date Range, Print & Export) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Report Type Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            <button
              onClick={() => setReportType('membership')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                reportType === 'membership'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4 text-rose-500" />
              <span>Membership Report</span>
            </button>

            <button
              onClick={() => setReportType('attendance')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                reportType === 'attendance'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CalendarCheck className="w-4 h-4 text-rose-500" />
              <span>Attendance Report</span>
            </button>

            <button
              onClick={() => setReportType('fees')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                reportType === 'fees'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CreditCard className="w-4 h-4 text-rose-500" />
              <span>Fees Report</span>
            </button>
          </div>

          {/* Date Range Selector & Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Date Range Dropdown */}
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRangeType)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-rose-500"
              >
                <option value="today">Today</option>
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="custom">Custom Date Range</option>
                <option value="all">All Time</option>
              </select>
            </div>

            {/* Custom Date Range Inputs */}
            {dateRange === 'custom' && (
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                />
                <span className="text-slate-400 text-xs font-bold">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                />
              </div>
            )}

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              disabled={isCustomDateError}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-md shadow-rose-600/20 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              disabled={isCustomDateError}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors disabled:opacity-50"
              title="Print Report"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Date Validation Error Banner */}
        {isCustomDateError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>Start date must be before end date.</span>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 2. MEMBERSHIP REPORT SECTION               */}
      {/* ========================================== */}
      {reportType === 'membership' && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Total Members
                </span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{totalMembersCount}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">All registered members</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Active Members
                </span>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{activeMembersCount}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Valid active memberships</p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Expiring Soon
                </span>
                <p className="text-2xl font-bold text-amber-600 mt-1">{expiringSoonCount}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Expires in 7 days or less</p>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Expired Members
                </span>
                <p className="text-2xl font-bold text-rose-600 mt-1">{expiredMembersCount}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Membership ended</p>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Membership Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 print:hidden">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search Member Name or Member ID..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
              <select
                value={memberStatusFilter}
                onChange={(e) => setMemberStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-rose-500"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Expiring Soon">Expiring Soon Only</option>
                <option value="Expired">Expired Only</option>
              </select>
            </div>
          </div>

          {/* Membership Report Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Member ID</th>
                    <th className="py-3.5 px-4">Member Name</th>
                    <th className="py-3.5 px-4">Membership Plan</th>
                    <th className="py-3.5 px-4">Start Date</th>
                    <th className="py-3.5 px-4">Expiry Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Days Remaining</th>
                    <th className="py-3.5 px-4">Membership Amount</th>
                    <th className="py-3.5 px-4">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 text-xs font-medium">
                        No records found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((m) => {
                      const daysRem = calculateDaysRemaining(m.expiryDate);
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{m.id}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{m.fullName}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-600">{m.planName}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">{formatDate(m.startDate)}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">{formatDate(m.expiryDate)}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                                m.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : m.status === 'Expiring Soon'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {m.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-600">{daysRem.label}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {formatCurrency(m.amount, settings.currencySymbol)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                m.paymentStatus === 'Paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : m.paymentStatus === 'Partial'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {m.paymentStatus || 'Paid'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 3. ATTENDANCE REPORT SECTION               */}
      {/* ========================================== */}
      {reportType === 'attendance' && (
        <div className="space-y-6 animate-fade-in">
          {/* Attendance Sub-tabs & Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Total Records
                </span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{totalAttendanceRecords}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Recorded check-ins</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200">
                <CalendarCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Present Count
                </span>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{presentAttendanceCount}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Successful check-ins</p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Absent Count
                </span>
                <p className="text-2xl font-bold text-rose-600 mt-1">{absentAttendanceCount}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Unrecorded check-ins</p>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Attendance Rate
                </span>
                <p className="text-2xl font-bold text-amber-600 mt-1">{attendanceRate}%</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Present vs Total</p>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Attendance Controls Bar (Subtabs + Filters) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 print:hidden">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Log View vs Monthly Summary Switch */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setAttendanceSubTab('log')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    attendanceSubTab === 'log'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Daily Log ({filteredAttendance.length})
                </button>
                <button
                  onClick={() => setAttendanceSubTab('summary')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    attendanceSubTab === 'summary'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Monthly Attendance Summary ({monthlySummaryList.length})
                </button>
              </div>

              {/* Attendance Search Input */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search Member Name or ID..."
                  value={attendanceSearch}
                  onChange={(e) => setAttendanceSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Sub-Filters for Log Mode */}
            {attendanceSubTab === 'log' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Filter Member
                  </label>
                  <select
                    value={attendanceMemberFilter}
                    onChange={(e) => setAttendanceMemberFilter(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none"
                  >
                    <option value="All">All Members</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Filter Attendance Status
                  </label>
                  <select
                    value={attendanceStatusFilter}
                    onChange={(e) => setAttendanceStatusFilter(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Present">Present Only</option>
                    <option value="Absent">Absent Only</option>
                  </select>
                </div>
              </div>
            ) : (
              /* Sub-Filters for Summary Mode */
              <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100 text-xs">
                <span className="font-semibold text-slate-500">
                  Showing summary for date range: <strong className="text-slate-800">{dateBounds.label}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-400 text-[11px]">Sort By:</span>
                  <select
                    value={summarySortBy}
                    onChange={(e) => setSummarySortBy(e.target.value as any)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
                  >
                    <option value="name">Member Name</option>
                    <option value="present">Present Days</option>
                    <option value="percentage">Attendance %</option>
                  </select>

                  <button
                    onClick={() => setSummarySortDir(summarySortDir === 'asc' ? 'desc' : 'asc')}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1"
                    title="Toggle Sort Direction"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-rose-600" />
                    <span className="text-[10px] uppercase">{summarySortDir}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Attendance Table Views */}
          {attendanceSubTab === 'log' ? (
            /* DAILY ATTENDANCE TABLE */
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Member ID</th>
                      <th className="py-3.5 px-4">Member Name</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Check-in Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredAttendance.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 text-xs font-medium">
                          No records found for the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredAttendance.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                            {formatDate(a.date)}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-500">{a.memberId}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{a.memberName}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                                a.status === 'Present'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {a.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            {a.checkInTime || 'N/A'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* MONTHLY SUMMARY TABLE */
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Member Name</th>
                      <th className="py-3.5 px-4">Member ID</th>
                      <th className="py-3.5 px-4">Present Days</th>
                      <th className="py-3.5 px-4">Absent Days</th>
                      <th className="py-3.5 px-4">Total Days</th>
                      <th className="py-3.5 px-4">Attendance Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {monthlySummaryList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 text-xs font-medium">
                          No records found for the selected filters.
                        </td>
                      </tr>
                    ) : (
                      monthlySummaryList.map((s) => (
                        <tr key={s.memberId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">{s.memberName}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-500">{s.memberId}</td>
                          <td className="py-3.5 px-4 font-bold text-emerald-600">{s.presentDays} Days</td>
                          <td className="py-3.5 px-4 font-bold text-rose-600">{s.absentDays} Days</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700">{s.totalDays} Days</td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 w-12">{s.percentage}%</span>
                              <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden print:hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    s.percentage >= 75
                                      ? 'bg-emerald-500'
                                      : s.percentage >= 50
                                      ? 'bg-amber-500'
                                      : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${Math.min(100, s.percentage)}%` }}
                                />
                              </div>
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
        </div>
      )}

      {/* ========================================== */}
      {/* 4. FEES REPORT SECTION                     */}
      {/* ========================================== */}
      {reportType === 'fees' && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Total Collection
                </span>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {formatCurrency(totalCollectionSum, settings.currencySymbol)}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Sum of filtered payments</p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Total Pending
                </span>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {formatCurrency(totalPendingDuesSum, settings.currencySymbol)}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Total outstanding dues</p>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Number of Payments
                </span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{paymentCount}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Receipts generated</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Average Payment
                </span>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {formatCurrency(averagePayment, settings.currencySymbol)}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Per receipt average</p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Fees Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
            {/* Search Input */}
            <div className="relative sm:col-span-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search Name, Member ID, Receipt #..."
                value={feeSearch}
                onChange={(e) => setFeeSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Payment Method Filter */}
            <div>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-rose-500"
              >
                <option value="All">All Payment Methods</option>
                <option value="Cash">Cash Only</option>
                <option value="UPI">UPI Only</option>
                <option value="Card">Card Only</option>
                <option value="Bank Transfer">Bank Transfer Only</option>
              </select>
            </div>

            {/* Purpose Filter */}
            <div>
              <select
                value={purposeFilter}
                onChange={(e) => setPurposeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-rose-500"
              >
                <option value="All">All Purposes</option>
                <option value="New Membership">New Membership</option>
                <option value="Membership Renewal">Membership Renewal</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Fees Report Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Receipt Number</th>
                    <th className="py-3.5 px-4">Member Name</th>
                    <th className="py-3.5 px-4">Member ID</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Payment Date</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-xs font-medium">
                        No records found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{p.receiptNo}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{p.memberName}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">{p.memberId}</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600">
                          {formatCurrency(p.amount, settings.currencySymbol)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">{formatDate(p.paymentDate)}</td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-100">
                            {p.purpose || 'Fee Payment'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
