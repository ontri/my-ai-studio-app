import React, { useState } from 'react';
import {
  Search,
  Filter,
  UserPlus,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Calendar,
  CreditCard,
  UserCheck,
  UserX,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Member, MembershipPlan, MemberStatus, GymSettings } from '../../types';
import { formatDate, getStatusBadgeClass } from '../../utils/formatters';

interface MembersViewProps {
  members: Member[];
  plans: MembershipPlan[];
  settings: GymSettings;
  onAddMember: () => void;
  onEditMember: (member: Member) => void;
  onViewMember: (member: Member) => void;
  onDeleteMember: (member: Member) => void;
  onOpenRenewModal?: (member: Member) => void;
}

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  plans,
  settings,
  onAddMember,
  onEditMember,
  onViewMember,
  onDeleteMember,
  onOpenRenewModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [planFilter, setPlanFilter] = useState<string>('All');

  // Filter members
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || member.status === statusFilter;
    const matchesPlan = planFilter === 'All' || member.planId === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const activeCount = members.filter((m) => m.status === 'Active').length;
  const expiringCount = members.filter((m) => m.status === 'Expiring Soon').length;
  const expiredCount = members.filter((m) => m.status === 'Expired').length;

  return (
    <div className="space-y-5">
      {/* Top Banner & Quick Filter Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('All')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              statusFilter === 'All'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Members ({members.length})
          </button>
          <button
            onClick={() => setStatusFilter('Active')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'Active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Active ({activeCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('Expiring Soon')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'Expiring Soon'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Expiring Soon ({expiringCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('Expired')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'Expired'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Expired ({expiredCount})</span>
          </button>
        </div>

        <button
          onClick={onAddMember}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-md shadow-rose-600/20 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Member</span>
        </button>
      </div>

      {/* Search & Plan Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Search Input */}
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search member by Name, Member ID, Phone or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500"
          />
        </div>

        {/* Plan Filter */}
        <div className="relative">
          <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500 bg-white"
          >
            <option value="All">All Membership Plans</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Member ID</th>
                <th className="py-3.5 px-4">Member Name</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Plan</th>
                <th className="py-3.5 px-4">Start Date</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                    No members found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Member ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-700">
                      {member.id}
                    </td>

                    {/* Member Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={member.photoUrl}
                          alt={member.fullName}
                          className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 group-hover:text-rose-600 transition-colors">
                            {member.fullName}
                          </p>
                          <p className="text-xs text-slate-400">{member.gender}</p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4 text-slate-600 text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{member.phone}</span>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                        <CreditCard className="w-3 h-3 text-slate-500" />
                        <span>{member.planName}</span>
                      </span>
                    </td>

                    {/* Start Date */}
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {formatDate(member.startDate)}
                    </td>

                    {/* Expiry Date */}
                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-800">
                      {formatDate(member.expiryDate)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold border ${getStatusBadgeClass(
                          member.status
                        )}`}
                      >
                        {member.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onOpenRenewModal && (
                          <button
                            onClick={() => onOpenRenewModal(member)}
                            className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors font-semibold text-xs flex items-center gap-1"
                            title="Renew Membership"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Renew</span>
                          </button>
                        )}
                        <button
                          onClick={() => onViewMember(member)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Profile Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditMember(member)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Edit Member"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteMember(member)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Member"
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
    </div>
  );
};
