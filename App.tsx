import React, { useState, useEffect, useCallback } from 'react';
import {
  Member,
  AttendanceRecord,
  FeePayment,
  GymSettings,
  TabType,
} from './types';
import {
  getMembers,
  createMember as addMember,
  updateMember,
  renewMembership,
  deleteMember,
  getAttendance,
  markAttendance as markAttendanceRecord,
  getPayments,
  createPayment as recordNewPayment,
  updatePayment as updateFeePayment,
  deletePayment as deleteFeePayment,
  getSettings as getGymSettings,
  updateSettings as saveGymSettings,
  resetAllData as resetDataToDefaults,
  downloadBackupFile,
  restoreBackup,
} from './services';
import { GYM_DATA_UPDATED_EVENT } from './utils/storage';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Toast, ToastMessage } from './components/Toast';
import { ConfirmModal } from './components/ConfirmModal';

import { DashboardView } from './components/dashboard/DashboardView';
import { MembersView } from './components/members/MembersView';
import { MemberFormModal } from './components/members/MemberFormModal';
import { MemberDetailModal } from './components/members/MemberDetailModal';
import { RenewModal } from './components/members/RenewModal';
import { AttendanceView } from './components/attendance/AttendanceView';
import { FeesView } from './components/fees/FeesView';
import { ReceiptModal } from './components/fees/ReceiptModal';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';

import { Dumbbell, Lock, ArrowRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);

  // Core Data State
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [settings, setSettings] = useState<GymSettings>(getGymSettings());

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals state
  const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);

  const [selectedMemberForDetail, setSelectedMemberForDetail] = useState<Member | null>(null);
  const [selectedMemberForRenew, setSelectedMemberForRenew] = useState<Member | null>(null);

  const [selectedMemberForFee, setSelectedMemberForFee] = useState<Member | null>(null);

  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<FeePayment | null>(null);

  // Confirm Modal state
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Login / Lock Screen state
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');

  // Toast Helper
  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Reload data from local storage
  const loadAllData = useCallback(() => {
    setMembers(getMembers());
    setAttendance(getAttendance());
    setPayments(getPayments());
    setSettings(getGymSettings());
  }, []);

  useEffect(() => {
    loadAllData();

    const handleStorageChange = () => {
      loadAllData();
    };

    window.addEventListener(GYM_DATA_UPDATED_EVENT, handleStorageChange);
    return () => {
      window.removeEventListener(GYM_DATA_UPDATED_EVENT, handleStorageChange);
    };
  }, [loadAllData]);

  // MEMBER HANDLERS
  const handleSaveMember = (data: Omit<Member, 'id' | 'status'> | Member) => {
    if ('id' in data) {
      updateMember(data as Member);
      showToast('success', `Member profile for ${data.fullName} updated.`);
    } else {
      const created = addMember(data);
      showToast('success', `New member ${created.fullName} (${created.id}) added successfully!`);
    }
  };

  const handleRenewMembership = (
    memberId: string,
    planId: string,
    startDate: string,
    expiryDate: string,
    amount: number,
    paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Other',
    recordPayment: boolean
  ) => {
    const selectedPlan = settings.plans.find((p) => p.id === planId);
    const planName = selectedPlan ? selectedPlan.name : 'Renewal Plan';

    const result = renewMembership({
      memberId,
      planId,
      planName,
      startDate,
      expiryDate,
      amount,
      recordPayment,
      paymentMethod,
    });

    if (result && result.updatedMember) {
      showToast(
        'success',
        `Membership for ${result.updatedMember.fullName} renewed until ${expiryDate}!`
      );
    }
    setSelectedMemberForRenew(null);
  };

  const handleDeleteMemberClick = (member: Member) => {
    setConfirmModalState({
      isOpen: true,
      title: 'Delete Member Record',
      message: `Are you sure you want to delete ${member.fullName} (${member.id})? This will permanently remove their records.`,
      isDanger: true,
      onConfirm: () => {
        deleteMember(member.id);
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        showToast('info', `Member ${member.fullName} was deleted.`);
      },
    });
  };

  // ATTENDANCE HANDLER
  const handleMarkAttendance = (
    memberId: string,
    memberName: string,
    date: string,
    status: 'Present' | 'Absent'
  ) => {
    const res = markAttendanceRecord(memberId, memberName, date, status);
    if (res.isDuplicate) {
      showToast('info', 'Attendance already recorded for today.');
    } else if (res.isUpdated) {
      showToast('success', `Attendance for ${memberName} updated to ${status}.`);
    } else {
      showToast('success', `Marked ${memberName} as ${status} for ${date}.`);
    }
  };

  // PAYMENT HANDLER
  const handleRecordPayment = (paymentData: Omit<FeePayment, 'id' | 'receiptNo'>) => {
    const newPayment = recordNewPayment(paymentData);
    showToast(
      'success',
      `Payment recorded! Receipt #${newPayment.receiptNo} generated for ${newPayment.memberName}.`
    );
  };

  const handleUpdatePayment = (id: string, paymentData: Partial<FeePayment>) => {
    const updated = updateFeePayment(id, paymentData);
    if (updated) {
      showToast('success', `Payment receipt #${updated.receiptNo} updated successfully.`);
    }
  };

  const handleDeletePayment = (id: string) => {
    deleteFeePayment(id);
    showToast('info', 'Payment record deleted and member balance recalculated.');
  };

  // SETTINGS RESET HANDLER
  const handleResetDataClick = () => {
    setConfirmModalState({
      isOpen: true,
      title: 'Reset Demo Data',
      message:
        'This will reset all members, attendance logs, and fee receipts to initial demo defaults. Proceed?',
      isDanger: true,
      onConfirm: () => {
        resetDataToDefaults();
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        showToast('info', 'Demo data restored to default settings.');
      },
    });
  };

  // QUICK ACTIONS
  const handleQuickAction = (action: 'addMember' | 'recordFee' | 'attendance') => {
    if (action === 'addMember') {
      setMemberToEdit(null);
      setIsMemberFormOpen(true);
    } else if (action === 'recordFee') {
      setActiveTab('fees');
    } else if (action === 'attendance') {
      setActiveTab('attendance');
    }
  };

  // LOGOUT / LOCK SCREEN
  if (isLoggedOut) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{settings.gymName}</h1>
            <p className="text-xs text-slate-400">Gym Manager Session Locked</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setIsLoggedOut(false);
              setLoginPassword('');
              showToast('success', `Welcome back, ${settings.adminName}!`);
            }}
            className="space-y-4 pt-2"
          >
            <div>
              <input
                type="password"
                placeholder="Enter password (any key to unlock demo)"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-amber-500 text-center text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <span>Unlock Application</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  const expiredCount = members.filter((m) => m.status === 'Expired').length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        isOpenMobile={isOpenMobileSidebar}
        setIsOpenMobile={setIsOpenMobileSidebar}
        onLogout={() => {
          setConfirmModalState({
            isOpen: true,
            title: 'Logout / Lock Session',
            message: 'Are you sure you want to log out and lock your gym management session?',
            isDanger: false,
            onConfirm: () => {
              setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
              setIsLoggedOut(true);
              showToast('info', 'Session locked.');
            },
          });
        }}
        totalMembersCount={members.length}
        expiredCount={expiredCount}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 lg:pl-64 print:pl-0 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsOpenMobileSidebar(true)}
          settings={settings}
          onQuickAction={handleQuickAction}
        />

        {/* Dynamic View Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              members={members}
              attendance={attendance}
              payments={payments}
              settings={settings}
              setActiveTab={setActiveTab}
              onSelectMember={(m) => setSelectedMemberForDetail(m)}
              onSelectPayment={(p) => setSelectedPaymentForReceipt(p)}
              onQuickAction={handleQuickAction}
            />
          )}

          {activeTab === 'members' && (
            <MembersView
              members={members}
              plans={settings.plans}
              settings={settings}
              onAddMember={() => {
                setMemberToEdit(null);
                setIsMemberFormOpen(true);
              }}
              onEditMember={(m) => {
                setMemberToEdit(m);
                setIsMemberFormOpen(true);
              }}
              onViewMember={(m) => setSelectedMemberForDetail(m)}
              onDeleteMember={handleDeleteMemberClick}
              onOpenRenewModal={(m) => setSelectedMemberForRenew(m)}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceView
              members={members}
              attendance={attendance}
              onMarkAttendance={handleMarkAttendance}
              onViewMemberDetail={(m) => setSelectedMemberForDetail(m)}
            />
          )}

          {activeTab === 'fees' && (
            <FeesView
              members={members}
              payments={payments}
              settings={settings}
              onRecordPayment={handleRecordPayment}
              onUpdatePayment={handleUpdatePayment}
              onDeletePayment={handleDeletePayment}
              selectedMemberForPayment={selectedMemberForFee}
              clearSelectedMember={() => setSelectedMemberForFee(null)}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              members={members}
              attendance={attendance}
              payments={payments}
              settings={settings}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={(updated) => {
                saveGymSettings(updated);
                setSettings(updated);
                showToast('success', 'Gym settings updated!');
              }}
              onResetData={handleResetDataClick}
              onExportBackup={() => {
                downloadBackupFile();
                showToast('success', 'Backup exported successfully!');
              }}
              onRestoreBackup={(jsonContent) => {
                const res = restoreBackup(jsonContent);
                if (res.success) {
                  loadAllData();
                  showToast('success', 'Backup restored successfully.');
                }
                return res;
              }}
            />
          )}
        </main>
      </div>

      {/* MODALS */}

      {/* Member Add/Edit Form Modal */}
      <MemberFormModal
        isOpen={isMemberFormOpen}
        memberToEdit={memberToEdit}
        plans={settings.plans}
        currencySymbol={settings.currencySymbol || '$'}
        onSave={handleSaveMember}
        onClose={() => setIsMemberFormOpen(false)}
      />

      {/* Member Profile Detail Drawer/Modal */}
      <MemberDetailModal
        member={selectedMemberForDetail}
        attendance={attendance}
        payments={payments}
        settings={settings}
        onClose={() => setSelectedMemberForDetail(null)}
        onEdit={(m) => {
          setMemberToEdit(m);
          setIsMemberFormOpen(true);
        }}
        onRecordFeeForMember={(m) => {
          setSelectedMemberForFee(m);
          setActiveTab('fees');
        }}
        onOpenRenewModal={(m) => setSelectedMemberForRenew(m)}
      />

      {/* Renew Membership Modal */}
      <RenewModal
        member={selectedMemberForRenew}
        plans={settings.plans}
        currencySymbol={settings.currencySymbol || '$'}
        onRenew={handleRenewMembership}
        onClose={() => setSelectedMemberForRenew(null)}
      />

      {/* Receipt Printable Modal */}
      <ReceiptModal
        payment={selectedPaymentForReceipt}
        member={
          selectedPaymentForReceipt
            ? members.find((m) => m.id === selectedPaymentForReceipt.memberId)
            : null
        }
        settings={settings}
        onClose={() => setSelectedPaymentForReceipt(null)}
      />

      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        isDanger={confirmModalState.isDanger}
        onConfirm={confirmModalState.onConfirm}
        onCancel={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
