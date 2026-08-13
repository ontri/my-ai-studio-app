import React, { useState } from 'react';
import {
  CalendarCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  UserX,
  Calendar as CalendarIcon,
  Filter,
  AlertTriangle,
  Users,
  ArrowUpDown,
  ChevronDown,
  Eye,
} from 'lucide-react';
import { Member, AttendanceRecord } from '../../types';
import { formatDate, getTodayDateString, getStatusBadgeClass } from '../../utils/formatters';

interface AttendanceViewProps {
  members: Member[];
  attendance: AttendanceRecord[];
  onMarkAttendance: (
    memberId: string,
    memberName: string,
    date: string,
    status: 'Present' | 'Absent'
  ) => void;
  onViewMemberDetail?: (member: Member) => void;
}

type AttendanceTabMode = 'daily' | 'monthly';
type MonthlySortOption = 'name' | 'percentage' | 'present';

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  members,
  attendance,
  onMarkAttendance,
  onViewMemberDetail,
}) => {
  const today = getTodayDateString();
  const currentMonthDefault = today.substring(0, 7); // YYYY-MM

  const [activeSubTab, setActiveSubTab] = useState<AttendanceTabMode>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthDefault);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Monthly sorting state
  const [monthlySort, setMonthlySort] = useState<MonthlySortOption>('name');
  const [sortAscending, setSortAscending] = useState<boolean>(true);

  // Expired Member Confirmation Modal State
  const [expiredWarningState, setExpiredWarningState] = useState<{
    member: Member;
    status: 'Present' | 'Absent';
  } | null>(null);

  // --- DAILY ATTENDANCE CALCULATIONS ---
  const recordsForDate = attendance.filter((a) => a.date === selectedDate);
  const presentCount = recordsForDate.filter((a) => a.status === 'Present').length;
  const absentCount = recordsForDate.filter((a) => a.status === 'Absent').length;
  const totalMembersCount = members.length;
  const attendancePercentage =
    totalMembersCount > 0 ? Math.round((presentCount / totalMembersCount) * 100) : 0;

  // Combine members with attendance records for selected date
  const memberAttendanceList = members.map((member) => {
    const existing = recordsForDate.find((a) => a.memberId === member.id);
    return {
      member,
      status: existing ? existing.status : null,
      checkInTime: existing ? existing.checkInTime : '-',
    };
  });

  // Filter list by search term (Name or ID) and status filter
  const filteredDailyList = memberAttendanceList.filter(({ member, status }) => {
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      query === '' ||
      member.fullName.toLowerCase().includes(query) ||
      member.id.toLowerCase().includes(query);

    let matchesStatus = true;
    if (filterStatus === 'Present') matchesStatus = status === 'Present';
    if (filterStatus === 'Absent') matchesStatus = status === 'Absent';
    if (filterStatus === 'Unmarked') matchesStatus = status === null;

    return matchesSearch && matchesStatus;
  });

  // --- HANDLER FOR MARKING ATTENDANCE ---
  const handleInitiateMark = (member: Member, intendedStatus: 'Present' | 'Absent') => {
    const isExpired = member.status === 'Expired' || new Date(member.expiryDate) < new Date(today);

    if (isExpired) {
      // Trigger warning modal for expired member
      setExpiredWarningState({ member, status: intendedStatus });
    } else {
      // Mark directly
      onMarkAttendance(member.id, member.fullName, selectedDate, intendedStatus);
    }
  };

  const handleConfirmExpiredMark = () => {
    if (!expiredWarningState) return;
    const { member, status } = expiredWarningState;
    onMarkAttendance(member.id, member.fullName, selectedDate, status);
    setExpiredWarningState(null);
  };

  // --- MONTHLY ATTENDANCE CALCULATIONS ---
  const monthlyRecords = attendance.filter((a) => a.date.startsWith(selectedMonth));

  const monthlyMemberStats = members.map((member) => {
    const mRecords = monthlyRecords.filter((a) => a.memberId === member.id);
    const mPresent = mRecords.filter((a) => a.status === 'Present').length;
    const mAbsent = mRecords.filter((a) => a.status === 'Absent').length;
    const totalLogged = mRecords.length;
    const percentage = totalLogged > 0 ? Math.round((mPresent / totalLogged) * 100) : 0;

    const lastPresent = mRecords
      .filter((a) => a.status === 'Present')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    return {
      member,
      presentDays: mPresent,
      absentDays: mAbsent,
      totalLogged,
      percentage,
      lastCheckIn: lastPresent
        ? `${formatDate(lastPresent.date)} (${lastPresent.checkInTime})`
        : '—',
    };
  });

  // Filter monthly list by search term
  const filteredMonthlyList = monthlyMemberStats
    .filter(({ member }) => {
      const query = searchTerm.toLowerCase().trim();
      return (
        query === '' ||
        member.fullName.toLowerCase().includes(query) ||
        member.id.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      if (monthlySort === 'name') {
        comparison = a.member.fullName.localeCompare(b.member.fullName);
      } else if (monthlySort === 'percentage') {
        comparison = b.percentage - a.percentage;
      } else if (monthlySort === 'present') {
        comparison = b.presentDays - a.presentDays;
      }

      return sortAscending ? comparison : -comparison;
    });

  // Overall monthly metrics
  const totalMonthCheckIns = monthlyRecords.filter((a) => a.status === 'Present').length;
  const avgMonthlyAttendanceRate =
    monthlyMemberStats.length > 0
      ? Math.round(
          monthlyMemberStats.reduce((acc, m) => acc + m.percentage, 0) / monthlyMemberStats.length
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('daily')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'daily'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Daily Attendance Marking</span>
          </button>
          <button
            onClick={() => setActiveSubTab('monthly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'monthly'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Monthly Attendance Report</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total Members: <strong className="text-slate-900">{totalMembersCount}</strong>
        </div>
      </div>

      {/* DAILY ATTENDANCE MODE */}
      {activeSubTab === 'daily' && (
        <>
          {/* Top Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Present Today */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Present Today
                </span>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{presentCount}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Checked in ({selectedDate === today ? 'Today' : formatDate(selectedDate)})
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>

            {/* Card 2: Absent Today */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Absent Today
                </span>
                <p className="text-2xl font-bold text-rose-600 mt-1">{absentCount}</p>
                <p className="text-xs text-slate-400 mt-0.5">Explicitly marked absent</p>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
                <UserX className="w-6 h-6" />
              </div>
            </div>

            {/* Card 3: Total Members */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Total Members
                </span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{totalMembersCount}</p>
                <p className="text-xs text-slate-400 mt-0.5">Registered gym members</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200">
                <Users className="w-6 h-6" />
              </div>
            </div>

            {/* Card 4: Attendance Percentage */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Attendance %
                </span>
                <p className="text-2xl font-bold text-blue-600 mt-1">{attendancePercentage}%</p>
                <p className="text-xs text-slate-400 mt-0.5">Turnout rate for selected date</p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                <CalendarCheck className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Controls: Date Picker & Search Filters */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Daily Attendance Control</h3>
                <p className="text-xs text-slate-500">
                  Select date and mark member attendance. Changes save automatically.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
                  <CalendarIcon className="w-4 h-4 text-rose-600" />
                  <span>Date:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer"
                  />
                </div>
                {selectedDate !== today && (
                  <button
                    onClick={() => setSelectedDate(today)}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-xs"
                  >
                    Go to Today
                  </button>
                )}
              </div>
            </div>

            {/* Search Input & Status Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search member by Name or Member ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="relative">
                <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500 bg-white"
                >
                  <option value="All">All Statuses</option>
                  <option value="Present">Present Only</option>
                  <option value="Absent">Absent Only</option>
                  <option value="Unmarked">Not Marked</option>
                </select>
              </div>
            </div>
          </div>

          {/* Member List Table / Cards */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Member ID</th>
                    <th className="py-3.5 px-4">Member Name</th>
                    <th className="py-3.5 px-4">Membership Status</th>
                    <th className="py-3.5 px-4">Attendance Status</th>
                    <th className="py-3.5 px-4">Check-in Time</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredDailyList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                        {searchTerm ? `No members found matching "${searchTerm}".` : 'No members found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredDailyList.map(({ member, status, checkInTime }) => {
                      const isExpired = member.status === 'Expired';

                      return (
                        <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Member ID */}
                          <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-700">
                            {member.id}
                          </td>

                          {/* Member Name & Photo */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={member.photoUrl}
                                alt={member.fullName}
                                className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                              />
                              <div className="min-w-0">
                                <button
                                  onClick={() => onViewMemberDetail && onViewMemberDetail(member)}
                                  className="font-semibold text-slate-900 hover:text-rose-600 transition-colors text-left block truncate"
                                >
                                  {member.fullName}
                                </button>
                                <span className="text-xs text-slate-400 block truncate">
                                  {member.planName}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Membership Status Badge */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${getStatusBadgeClass(
                                member.status
                              )}`}
                            >
                              {member.status}
                            </span>
                          </td>

                          {/* Attendance Status */}
                          <td className="py-3.5 px-4">
                            {status === 'Present' ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Present</span>
                              </span>
                            ) : status === 'Absent' ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Absent</span>
                              </span>
                            ) : (
                              <span className="inline-block text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                Not Marked
                              </span>
                            )}
                          </td>

                          {/* Check-in Time */}
                          <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{checkInTime}</span>
                            </div>
                          </td>

                          {/* Mark Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleInitiateMark(member, 'Present')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                  status === 'Present'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                }`}
                              >
                                {status === 'Present' ? 'Present' : 'Mark Present'}
                              </button>
                              <button
                                onClick={() => handleInitiateMark(member, 'Absent')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                  status === 'Absent'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                }`}
                              >
                                {status === 'Absent' ? 'Absent' : 'Mark Absent'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* MONTHLY ATTENDANCE REPORT MODE */}
      {activeSubTab === 'monthly' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Monthly Attendance Report</h3>
                <p className="text-xs text-slate-500">
                  Select month to view cumulative member attendance stats and turnout rates.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
                  <CalendarIcon className="w-4 h-4 text-rose-600" />
                  <span>Select Month:</span>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Search & Sort Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search member by Name or Member ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <ArrowUpDown className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <select
                    value={monthlySort}
                    onChange={(e) => setMonthlySort(e.target.value as MonthlySortOption)}
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-rose-500 bg-white"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="percentage">Sort by Attendance %</option>
                    <option value="present">Sort by Present Days</option>
                  </select>
                </div>

                <button
                  onClick={() => setSortAscending(!sortAscending)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors shrink-0"
                  title="Toggle Direction"
                >
                  {sortAscending ? 'Asc' : 'Desc'}
                </button>
              </div>
            </div>
          </div>

          {/* Monthly High-Level Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Total Monthly Visits
                </span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{totalMonthCheckIns}</p>
                <p className="text-xs text-slate-400 mt-0.5">Check-ins in {selectedMonth}</p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Avg Turnout Rate
                </span>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {avgMonthlyAttendanceRate}%
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Across all tracked members</p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                <CalendarCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Total Tracked Members
                </span>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {monthlyMemberStats.length}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Active gym directory</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Monthly Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Member ID & Name</th>
                    <th className="py-3.5 px-4">Plan Name</th>
                    <th className="py-3.5 px-4 text-center">Present Days</th>
                    <th className="py-3.5 px-4 text-center">Absent Days</th>
                    <th className="py-3.5 px-4 text-center">Total Logged</th>
                    <th className="py-3.5 px-4 text-center">Attendance %</th>
                    <th className="py-3.5 px-4 text-right">Last Check-in</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredMonthlyList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                        No monthly attendance records found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredMonthlyList.map((stat) => (
                      <tr key={stat.member.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Member */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={stat.member.photoUrl}
                              alt={stat.member.fullName}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <p className="font-semibold text-slate-900">{stat.member.fullName}</p>
                              <p className="text-xs font-mono text-slate-500">{stat.member.id}</p>
                            </div>
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                          {stat.member.planName}
                        </td>

                        {/* Present Days */}
                        <td className="py-3.5 px-4 text-center font-bold text-emerald-600">
                          {stat.presentDays}
                        </td>

                        {/* Absent Days */}
                        <td className="py-3.5 px-4 text-center font-semibold text-rose-600">
                          {stat.absentDays}
                        </td>

                        {/* Total Logged */}
                        <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                          {stat.totalLogged}
                        </td>

                        {/* Attendance % */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs ${
                              stat.percentage >= 75
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : stat.percentage >= 50
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {stat.percentage}%
                          </span>
                        </td>

                        {/* Last Check-in */}
                        <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-600">
                          {stat.lastCheckIn}
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

      {/* EXPIRED MEMBER WARNING MODAL */}
      {expiredWarningState && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Membership Expired</h4>
                <p className="text-xs text-amber-700">Gym Member Expiry Warning</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              The membership for <strong>{expiredWarningState.member.fullName}</strong> (
              {expiredWarningState.member.id}) expired on{' '}
              <strong className="text-rose-600">
                {formatDate(expiredWarningState.member.expiryDate)}
              </strong>
              .
              <br />
              Do you still want to record attendance for this member?
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setExpiredWarningState(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmExpiredMark}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all"
              >
                Record Attendance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
