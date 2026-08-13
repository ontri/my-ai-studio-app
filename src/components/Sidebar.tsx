import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Dumbbell,
  X,
} from 'lucide-react';
import { TabType, GymSettings } from '../types';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  settings: GymSettings;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  onLogout: () => void;
  totalMembersCount: number;
  expiredCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  settings,
  isOpenMobile,
  setIsOpenMobile,
  onLogout,
  totalMembersCount,
  expiredCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'members' as TabType,
      label: 'Members',
      icon: Users,
      badge: totalMembersCount > 0 ? totalMembersCount : undefined,
    },
    {
      id: 'attendance' as TabType,
      label: 'Attendance',
      icon: CalendarCheck,
    },
    {
      id: 'fees' as TabType,
      label: 'Fees',
      icon: CreditCard,
      badge: expiredCount > 0 ? `${expiredCount} Due` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    {
      id: 'reports' as TabType,
      label: 'Reports',
      icon: BarChart3,
    },
  ];

  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab);
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800/80 transition-transform duration-300 ease-in-out lg:translate-x-0 print:hidden ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Gym Brand / Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-500 p-0.5 shadow-md shadow-rose-600/20 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center overflow-hidden">
                {settings.gymLogo ? (
                  <img
                    src={settings.gymLogo}
                    alt={settings.gymName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Dumbbell className="w-5 h-5 text-rose-500" />
                )}
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-white tracking-tight truncate">
                {settings.gymName || 'Gym Manager'}
              </h1>
              <p className="text-xs text-slate-400 truncate">Gym Operations</p>
            </div>
          </div>

          <button
            onClick={() => setIsOpenMobile(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Nav Items */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Main Menu
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                      item.badgeColor ||
                      (isActive
                        ? 'bg-white/20 text-white border-white/20'
                        : 'bg-slate-800 text-slate-300 border-slate-700')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-800/80">
            <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              System
            </p>
            <button
              onClick={() => handleSelectTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Settings
                className={`w-5 h-5 ${
                  activeTab === 'settings' ? 'text-white' : 'text-slate-400'
                }`}
              />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Admin Profile & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0 border border-rose-500/30">
                {settings.adminName?.charAt(0) || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {settings.adminName || 'Admin'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">Manager</p>
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Logout / Lock Screen"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
