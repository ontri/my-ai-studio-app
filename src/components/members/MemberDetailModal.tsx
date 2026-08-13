import React from 'react';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  History,
  ShieldAlert,
  ArrowLeft,
  RefreshCw,
  Award,
  CalendarCheck,
} from 'lucide-react';
import { Member, AttendanceRecord, FeePayment, GymSettings } from '../../types';
import {
  formatCurrency,
  formatDate,
  getStatusBadgeClass,
  calculateDaysRemaining,
} from '../../utils/formatters';
import { calculateMemberAttendanceSummary } from '../../services/attendanceService';

interface MemberDetailModalProps {
  member: Member | null;
  attendance: AttendanceRecord[];
  payments: FeePayment[];
  settings: GymSettings;
  onClose: () => void;
  onEdit: (member: Member) => void;
  onRecordFeeForMember: (member: Member) => void;
  onOpenRenewModal: (member: Member) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  member,
  attendance,
  payments,
  settings,
  onClose,
  onEdit,
  onRecordFeeForMember,
  onOpenRenewModal,
}) => {
  if (!member) return null;

  const memberAttendance = attendance.filter((a) => a.memberId === member.id);
  const attSummary = calculateMemberAttendanceSummary(member.id, attendance);
  const memberPayments = payments.filter((p) => p.memberId === member.id);
  const daysInfo = calculateDaysRemaining(member.expiryDate);
  const membershipHistory = member.membershipHistory || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col relative animate-fade-in overflow-hidden">
        {/* Fixed Header Bar with Back Button */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white shrink-0 z-10">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2 min-w-0 px-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 shrink-0">
              {member.id}
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border truncate ${getStatusBadgeClass(
                member.status
              )}`}
            >
              {member.status}
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-xl hover:bg-slate-100 shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Profile Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4 min-w-0">
              <img
                src={member.photoUrl}
                alt={member.fullName}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-rose-600 shadow-md shrink-0"
              />

              <div className="space-y-1 min-w-0 flex-1">
                <h2 className="text-xl font-bold text-slate-900">{member.fullName}</h2>
                <p className="text-xs text-slate-500">
                  {member.planName} • Member since {formatDate(member.joiningDate)}
                </p>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 font-bold text-[11px] mt-1">
                  <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>{daysInfo.label}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenRenewModal(member);
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Renew Membership</span>
            </button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Phone className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase">Phone</p>
                <p className="text-sm font-semibold text-slate-800">{member.phone}</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Mail className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-400 uppercase">Email</p>
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {member.email || 'N/A'}
                </p>
              </div>
            </div>

            {/* DOB & Gender */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <User className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase">DOB / Gender</p>
                <p className="text-sm font-semibold text-slate-800">
                  {formatDate(member.dob)} ({member.gender})
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <MapPin className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase">Address</p>
                <p className="text-sm font-semibold text-slate-800">{member.address || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Current Membership Info Box */}
          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-rose-600" />
                <span>Current Membership Plan</span>
              </h4>
              <span className="text-sm font-bold text-slate-900">
                {formatCurrency(member.amount, settings.currencySymbol)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div>
                <span className="text-slate-500 block">Plan:</span>
                <span className="font-semibold text-slate-900">{member.planName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Start Date:</span>
                <span className="font-semibold text-slate-900">
                  {formatDate(member.startDate)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Expiry Date:</span>
                <span className="font-semibold text-amber-700">
                  {formatDate(member.expiryDate)}
                </span>
              </div>
            </div>

            {member.pendingAmount && member.pendingAmount > 0 ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>Pending Dues Outstanding:</span>
                </div>
                <span>{formatCurrency(member.pendingAmount, settings.currencySymbol)}</span>
              </div>
            ) : null}
          </div>

          {/* Emergency Contact & Notes */}
          {(member.emergencyContact || member.notes) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {member.emergencyContact && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-700 block mb-0.5 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                    <span>Emergency Contact</span>
                  </span>
                  <span className="text-slate-800">{member.emergencyContact}</span>
                </div>
              )}
              {member.notes && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-700 block mb-0.5">Notes</span>
                  <span className="text-slate-600 italic">{member.notes}</span>
                </div>
              )}
            </div>
          )}

          {/* History Sections */}
          <div className="space-y-6 pt-2">
            {/* Membership History */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-rose-600" />
                  <span>Membership History</span>
                </span>
                <span className="text-xs font-normal text-slate-500">
                  {membershipHistory.length} Record{membershipHistory.length === 1 ? '' : 's'}
                </span>
              </h4>

              {membershipHistory.length === 0 ? (
                <div className="p-3.5 mt-2 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
                  Current plan: <strong>{member.planName}</strong> ({formatDate(member.startDate)} to {formatDate(member.expiryDate)})
                </div>
              ) : (
                <div className="space-y-2 mt-3">
                  {membershipHistory.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                          <span>{item.planName}</span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                            {item.type || 'Plan'}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px]">
                          {formatDate(item.startDate)} → {formatDate(item.expiryDate)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <span className="font-bold text-slate-900">
                          {formatCurrency(item.amount, settings.currencySymbol)}
                        </span>
                        {item.receiptNo && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-mono text-[10px] font-bold">
                            {item.receiptNo}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attendance Summary & History Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <CalendarCheck className="w-4 h-4 text-rose-600" />
                  <span>Member Attendance Summary & History</span>
                </h4>
                <span className="text-xs font-semibold text-slate-500">
                  {attSummary.total} Recorded Day{attSummary.total === 1 ? '' : 's'}
                </span>
              </div>

              {/* Attendance Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100/80">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                    Present
                  </span>
                  <p className="text-lg font-bold text-emerald-700 mt-0.5">{attSummary.present}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100/80">
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                    Absent
                  </span>
                  <p className="text-lg font-bold text-rose-700 mt-0.5">{attSummary.absent}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                    Total Logged
                  </span>
                  <p className="text-lg font-bold text-slate-800 mt-0.5">{attSummary.total}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100/80">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                    Attendance Rate
                  </span>
                  <p className="text-lg font-bold text-blue-800 mt-0.5">{attSummary.percentage}%</p>
                </div>
              </div>

              {attSummary.lastCheckIn && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                  <span className="font-medium">Last Check-in:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {formatDate(attSummary.lastCheckIn.date)} at {attSummary.lastCheckIn.time}
                  </span>
                </div>
              )}

              {/* Attendance History Table */}
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Attendance History
                </p>
                {attSummary.records.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No attendance records found.</p>
                ) : (
                  <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200/80 bg-white">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 bg-slate-50">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Check-in Time</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {attSummary.records.map((att) => (
                          <tr key={att.id} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              {formatDate(att.date)}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">
                              {att.checkInTime || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {att.status === 'Present' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Present</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                  <XCircle className="w-3 h-3" />
                                  <span>Absent</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Payments Mini Log */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                <span>Payment History ({memberPayments.length} receipts)</span>
              </p>
              {memberPayments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No payments recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {memberPayments.map((pay) => (
                    <div
                      key={pay.id}
                      className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-800">{pay.receiptNo}</span>
                        <span className="text-slate-400 ml-2">• {pay.paymentMethod}</span>
                        {pay.purpose && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-medium">
                            {pay.purpose}
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-slate-900">
                        {formatCurrency(pay.amount, settings.currencySymbol)} ({formatDate(pay.paymentDate)})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fixed Footer with Actions & Back Button */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                onClose();
                onOpenRenewModal(member);
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Renew</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(member);
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              Edit Profile
            </button>
            <button
              onClick={() => {
                onClose();
                onRecordFeeForMember(member);
              }}
              className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-all"
            >
              Record Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
