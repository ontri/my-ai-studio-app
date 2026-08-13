import React from 'react';
import { Menu, UserPlus, CreditCard, CalendarCheck2, Clock } from 'lucide-react';
import { TabType, GymSettings } from '../types';

interface HeaderProps {
  activeTab: TabType;
  onOpenMobileSidebar: () => void;
  settings: GymSettings;
  onQuickAction: (action: 'addMember' | 'recordFee' | 'attendance') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenMobileSidebar,
  settings,
  onQuickAction,
}) => {
  const getTabDetails = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Dashboard',
          subtitle: 'Gym overview, quick actions, and key metrics.',
        };
      case 'members':
        return {
          title: 'Member Management',
          subtitle: 'Search, add, edit, and filter gym members.',
        };
      case 'attendance':
        return {
          title: 'Attendance Tracker',
          subtitle: 'Mark daily check-ins and review attendance logs.',
        };
      case 'fees':
        return {
          title: 'Fees & Payments',
          subtitle: 'Record payments, issue receipts, and manage dues.',
        };
      case 'reports':
        return {
          title: 'Reports & Analytics',
          subtitle: 'Insights on membership, attendance, and revenue.',
        };
      case 'settings':
        return {
          title: 'Settings',
          subtitle: 'Gym configuration, membership plans, and profile.',
        };
    }
  };

  const { title, subtitle } = getTabDetails();
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5 print:hidden">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu + Tab Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-none truncate">
              {title}
            </h2>
            <p className="text-xs text-slate-500 mt-1 truncate hidden sm:block">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right Side: Date + Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Date Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-rose-600" />
            <span>{todayFormatted}</span>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => onQuickAction('addMember')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-all shadow-xs"
              title="Add New Member"
            >
              <UserPlus className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Add Member</span>
            </button>

            <button
              onClick={() => onQuickAction('recordFee')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all shadow-xs shadow-rose-600/20"
              title="Record Fee Payment"
            >
              <CreditCard className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">Record Fee</span>
            </button>

            <button
              onClick={() => onQuickAction('attendance')}
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-all"
              title="Mark Attendance"
            >
              <CalendarCheck2 className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Check-in</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
