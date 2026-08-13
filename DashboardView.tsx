import React, { useMemo } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  CalendarCheck,
  DollarSign,
  AlertCircle,
  ArrowRight,
  UserPlus,
  CreditCard,
  Clock,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  Calendar,
  AlertTriangle,
  Receipt,
  Eye,
} from 'lucide-react';
import { Member, AttendanceRecord, FeePayment, GymSettings, TabType } from '../../types';
import {
  formatCurrency,
  formatDate,
  calculateDaysRemaining,
  getStatusBadgeClass,
  getTodayDateString,
} from '../../utils/formatters';

interface DashboardViewProps {
  members: Member[];
  attendance: AttendanceRecord[];
  payments: FeePayment[];
  settings: GymSettings;
  setActiveTab: (tab: TabType) => void;
  onSelectMember: (member: Member) => void;
  onSelectPayment: (payment: FeePayment) => void;
  onQuickAction: (action: 'addMember' | 'recordFee' | 'attendance') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  members,
  attendance,
  payments,
  settings,
  setActiveTab,
  onSelectMember,
  onSelectPayment,
  onQuickAction,
}) => {
  const todayStr = getTodayDateString();

  // 1. Core Member Statistics
  const totalMembers = members.length;
  const activeMembersCount = members.filter((m) => m.status === 'Active').length;
  const expiringSoonMembersCount = members.filter((m) => m.status === 'Expiring Soon').length;
  const expiredMembersCount = members.filter((m) => m.status === 'Expired').length;

  const activePct = totalMembers > 0 ? Math.round((activeMembersCount / totalMembers) * 100) : 0;
  const expiringPct = totalMembers > 0 ? Math.round((expiringSoonMembersCount / totalMembers) * 100) : 0;
  const expiredPct = totalMembers > 0 ? Math.round((expiredMembersCount / totalMembers) * 100) : 0;

  // 2. Attendance Statistics
  const todayAttendanceRecords = useMemo(() => {
    return attendance.filter((a) => a.date === todayStr);
  }, [attendance, todayStr]);

  const todayPresentCount = todayAttendanceRecords.filter((a) => a.status === 'Present').length;
  const todayAbsentCount = todayAttendanceRecords.filter((a) => a.status === 'Absent').length;
  const todayAttendancePct =
    totalMembers > 0 ? Math.round((todayPresentCount / totalMembers) * 100) : 0;

  // 3. Collection Overview (Today, This Week, This Month)
  const feesToday = useMemo(() => {
    return payments
      .filter((p) => p.paymentDate === todayStr)
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments, todayStr]);

  const feesThisWeek = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    const startStr = sevenDaysAgo.toISOString().split('T')[0];

    return payments
      .filter((p) => p.paymentDate >= startStr && p.paymentDate <= todayStr)
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments, todayStr]);

  const currentMonthYear = todayStr.substring(0, 7); // YYYY-MM
  const feesThisMonth = useMemo(() => {
    return payments
      .filter((p) => p.paymentDate.startsWith(currentMonthYear))
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments, currentMonthYear]);

  // 4. Pending Fees Calculation
  const membersWithPendingFees = useMemo(() => {
    return members
      .map((m) => {
        const totalPaid = payments
          .filter((p) => p.memberId === m.id)
          .reduce((sum, p) => sum + p.amount, 0);
        const pending = Math.max(0, m.amount - totalPaid);
        return {
          member: m,
          totalAmount: m.amount,
          paidAmount: totalPaid,
          pendingAmount: pending,
        };
      })
      .filter((item) => item.pendingAmount > 0)
      .sort((a, b) => b.pendingAmount - a.pendingAmount);
  }, [members, payments]);

  const totalPendingFeesSum = membersWithPendingFees.reduce(
    (sum, item) => sum + item.pendingAmount,
    0
  );

  // 5. Membership Alerts (Expiring Soon + Expired)
  const expiringAlertMembers = useMemo(() => {
    return members
      .filter((m) => m.status === 'Expiring Soon' || m.status === 'Expired')
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }, [members]);

  // Alert Badge Counts
  const expiredCount = expiredMembersCount;
  const expiringSoonCount = expiringSoonMembersCount;
  const pendingCount = membersWithPendingFees.length;
  const totalAlertsCount = expiredCount + expiringSoonCount + pendingCount;

  // 6. Recent Members (Latest 5)
  const recentMembers = useMemo(() => {
    return [...members]
      .sort((a, b) => new Date(b.joiningDate).getTime() - new Date(a.joiningDate).getTime())
      .slice(0, 5);
  }, [members]);

  // 7. Recent Payments (Latest 5)
  const recentPayments = useMemo(() => {
    return [...payments]
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
      .slice(0, 5);
  }, [payments]);

  return (
    <div className="space-y-6">
      {/* 1. WELCOME & QUICK ACTIONS HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 md:p-8 border border-slate-800 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{settings.gymName || 'Gym Management App'} Overview</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Welcome back, {settings.adminName || 'Manager'}!
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Track attendance, collections, member renewals, and pending dues in real time.
            </p>
          </div>

          {/* Quick Actions (Exactly 3 Buttons) */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => onQuickAction('addMember')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Member</span>
            </button>

            <button
              onClick={() => onQuickAction('attendance')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold transition-all"
            >
              <CalendarCheck className="w-4 h-4 text-emerald-400" />
              <span>Mark Attendance</span>
            </button>

            <button
              onClick={() => onQuickAction('recordFee')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold transition-all"
            >
              <CreditCard className="w-4 h-4 text-rose-400" />
              <span>Record Payment</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. ALERT BADGE / BANNER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        {totalAlertsCount > 0 ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">Attention Required</h3>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-extrabold text-[11px]">
                    {totalAlertsCount} Action Items
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {expiredCount > 0 && `${expiredCount} expired membership(s). `}
                  {expiringSoonCount > 0 && `${expiringSoonCount} expiring within 7 days. `}
                  {pendingCount > 0 && `${pendingCount} member(s) with pending dues.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 shrink-0 self-end sm:self-auto">
              {expiredCount > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                  {expiredCount} Expired
                </span>
              )}
              {expiringSoonCount > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                  {expiringSoonCount} Expiring
                </span>
              )}
              {pendingCount > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                  {pendingCount} Pending Dues
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-emerald-700">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Everything looks good.</h3>
              <p className="text-xs text-slate-500">
                All memberships are active and fee payments are up to date.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. OVERVIEW METRICS CARDS (ROW 1 & ROW 2) */}
      <div className="space-y-4">
        {/* ROW 1: Members Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setActiveTab('members')}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Members
              </span>
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-200 transition-colors">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-900">{totalMembers}</p>
              <p className="text-xs text-slate-500 mt-0.5">Registered in system</p>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('members')}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Members
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold text-emerald-600">{activeMembersCount}</p>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {activePct}%
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Valid membership plans</p>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('members')}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Expiring Soon
              </span>
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold text-amber-600">{expiringSoonMembersCount}</p>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  {expiringPct}%
                </span>
              </div>
              <p className="text-xs text-amber-600 font-medium mt-0.5">Expires in 7 days</p>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('members')}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-rose-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Expired Members
              </span>
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-100 transition-colors">
                <UserX className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold text-rose-600">{expiredMembersCount}</p>
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                  {expiredPct}%
                </span>
              </div>
              <p className="text-xs text-rose-500 font-medium mt-0.5">Plan ended - renewal needed</p>
            </div>
          </div>
        </div>

        {/* ROW 2: Financials & Today's Attendance Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setActiveTab('attendance')}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Today's Attendance
              </span>
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold text-slate-900">{todayPresentCount}</p>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {todayAttendancePct}% Rate
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Present: {todayPresentCount} • Absent: {todayAbsentCount}
              </p>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('fees')}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Today's Collection
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(feesToday, settings.currencySymbol)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Collected today ({todayStr})</p>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('fees')}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                This Month's Collection
              </span>
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-100 transition-colors">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(feesThisMonth, settings.currencySymbol)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Month to date revenue</p>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('fees')}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pending Fees
              </span>
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-amber-600">
                {formatCurrency(totalPendingFeesSum, settings.currencySymbol)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Across {membersWithPendingFees.length} member(s)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. FINANCIAL & MEMBERSHIP SUMMARY PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Collection Overview Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Collection Overview</span>
            </h3>
            <button
              onClick={() => setActiveTab('fees')}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
            >
              <span>View Fees</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Today</span>
              <p className="text-base font-bold text-slate-900 mt-1">
                {formatCurrency(feesToday, settings.currencySymbol)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                This Week
              </span>
              <p className="text-base font-bold text-slate-900 mt-1">
                {formatCurrency(feesThisWeek, settings.currencySymbol)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-center">
              <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                This Month
              </span>
              <p className="text-base font-bold text-emerald-700 mt-1">
                {formatCurrency(feesThisMonth, settings.currencySymbol)}
              </p>
            </div>
          </div>
        </div>

        {/* Membership Summary Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-rose-600" />
              <span>Membership Distribution</span>
            </h3>
            <button
              onClick={() => setActiveTab('members')}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
            >
              <span>View Members</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-center">
              <span className="text-[10px] font-bold text-emerald-700 uppercase block">Active</span>
              <p className="text-lg font-bold text-emerald-700 mt-0.5">{activeMembersCount}</p>
              <p className="text-[10px] text-emerald-600 font-semibold">{activePct}% of total</p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 text-center">
              <span className="text-[10px] font-bold text-amber-700 uppercase block">Expiring</span>
              <p className="text-lg font-bold text-amber-700 mt-0.5">
                {expiringSoonMembersCount}
              </p>
              <p className="text-[10px] text-amber-600 font-semibold">{expiringPct}% of total</p>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 text-center">
              <span className="text-[10px] font-bold text-rose-700 uppercase block">Expired</span>
              <p className="text-lg font-bold text-rose-700 mt-0.5">{expiredMembersCount}</p>
              <p className="text-[10px] text-rose-600 font-semibold">{expiredPct}% of total</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. MEMBERSHIP ALERTS & PENDING FEES ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Membership Alerts (Expiring Soon & Expired) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm">Membership Alerts</h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {expiringAlertMembers.length} Expiring / Expired
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {expiringAlertMembers.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-medium">
                  No memberships expiring soon or expired.
                </div>
              ) : (
                expiringAlertMembers.map((m) => {
                  const daysRem = calculateDaysRemaining(m.expiryDate);
                  return (
                    <div
                      key={m.id}
                      onClick={() => onSelectMember(m)}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-rose-50/40 hover:border-rose-200 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={m.photoUrl}
                          alt={m.fullName}
                          className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {m.fullName}
                            </p>
                            <span className="text-[10px] font-mono text-slate-400">({m.id})</span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">{m.planName}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold border ${getStatusBadgeClass(
                            m.status
                          )}`}
                        >
                          {m.status}
                        </span>
                        <p className="text-[10px] font-semibold text-slate-600 mt-1">
                          Expiry: {formatDate(m.expiryDate)} ({daysRem.label})
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('members')}
            className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors border-t border-slate-100 pt-3"
          >
            <span>Manage All Members</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pending Fees Alert */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">Pending Fees Alert</h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {membersWithPendingFees.length} Pending
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {membersWithPendingFees.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-medium">
                  No outstanding fee payments pending.
                </div>
              ) : (
                membersWithPendingFees.map(({ member, totalAmount, paidAmount, pendingAmount }) => (
                  <div
                    key={member.id}
                    onClick={() => onSelectMember(member)}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-amber-50/40 hover:border-amber-200 transition-all cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {member.fullName}
                        </p>
                        <span className="text-[10px] font-mono text-slate-400">({member.id})</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {member.planName} • Total: {formatCurrency(totalAmount, settings.currencySymbol)} | Paid: {formatCurrency(paidAmount, settings.currencySymbol)}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 block">
                        Due: {formatCurrency(pendingAmount, settings.currencySymbol)}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Expires: {formatDate(member.expiryDate)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('fees')}
            className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors border-t border-slate-100 pt-3"
          >
            <span>View Fee Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 6. TODAY'S ATTENDANCE + RECENT PAYMENTS + RECENT MEMBERS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Today's Attendance Overview */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Today's Attendance</h3>
              </div>
              <button
                onClick={() => setActiveTab('attendance')}
                className="text-xs text-slate-500 hover:text-slate-900 font-semibold"
              >
                View Log
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {todayAttendanceRecords.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-medium">
                  No attendance recorded today.
                </div>
              ) : (
                todayAttendanceRecords.slice(0, 5).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{a.memberName}</p>
                      <p className="text-[10px] text-slate-400">
                        {a.checkInTime ? `Check-in: ${a.checkInTime}` : 'Recorded'}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        a.status === 'Present'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onQuickAction('attendance')}
            className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors border-t border-slate-100 pt-3"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Mark Attendance</span>
          </button>
        </div>

        {/* 2. Recent Payments */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Recent Payments</h3>
              </div>
              <button
                onClick={() => setActiveTab('fees')}
                className="text-xs text-slate-500 hover:text-slate-900 font-semibold"
              >
                View all
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {recentPayments.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-medium">
                  No payments recorded yet.
                </div>
              ) : (
                recentPayments.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onSelectPayment(p)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {p.memberName}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {p.receiptNo} • {p.paymentMethod}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-emerald-700 block">
                        {formatCurrency(p.amount, settings.currencySymbol)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(p.paymentDate)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onQuickAction('recordFee')}
            className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors border-t border-slate-100 pt-3"
          >
            <CreditCard className="w-3.5 h-3.5 text-rose-600" />
            <span>Record Fee Payment</span>
          </button>
        </div>

        {/* 3. Recent Members */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-700" />
                <h3 className="font-bold text-slate-900 text-sm">Recently Added Members</h3>
              </div>
              <button
                onClick={() => setActiveTab('members')}
                className="text-xs text-slate-500 hover:text-slate-900 font-semibold"
              >
                View all
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {recentMembers.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-medium">
                  No members added yet.
                </div>
              ) : (
                recentMembers.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => onSelectMember(m)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={m.photoUrl}
                        alt={m.fullName}
                        className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {m.fullName}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          Joined {formatDate(m.joiningDate)}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getStatusBadgeClass(
                        m.status
                      )}`}
                    >
                      {m.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onQuickAction('addMember')}
            className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors border-t border-slate-100 pt-3"
          >
            <UserPlus className="w-3.5 h-3.5 text-rose-600" />
            <span>Add New Member</span>
          </button>
        </div>
      </div>
    </div>
  );
};
