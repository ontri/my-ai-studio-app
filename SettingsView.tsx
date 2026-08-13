import React, { useState, useRef } from 'react';
import {
  Settings,
  Building2,
  DollarSign,
  UserCheck,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Image,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Database,
  Download,
  Upload,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { GymSettings, MembershipPlan } from '../../types';

interface SettingsViewProps {
  settings: GymSettings;
  onSaveSettings: (settings: GymSettings) => void;
  onResetData: () => void;
  onExportBackup: () => void;
  onRestoreBackup: (jsonContent: string) => { success: boolean; message: string };
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetData,
  onExportBackup,
  onRestoreBackup,
}) => {
  const [gymName, setGymName] = useState(settings.gymName);
  const [gymLogo, setGymLogo] = useState(settings.gymLogo);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [adminName, setAdminName] = useState(settings.adminName);
  const [adminEmail, setAdminEmail] = useState(settings.adminEmail);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || '$');
  const [plans, setPlans] = useState<MembershipPlan[]>(settings.plans || []);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [confirmDeletePlanIndex, setConfirmDeletePlanIndex] = useState<number | null>(null);

  // Restore Modal State
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [pendingFileContent, setPendingFileContent] = useState<string | null>(null);
  const [pendingFileName, setPendingFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPendingFileContent(content);
        setPendingFileName(file.name);
        setShowRestoreModal(true);
      }
    };
    reader.readAsText(file);

    // Reset input so re-selecting same file works
    e.target.value = '';
  };

  const handleConfirmRestore = () => {
    if (!pendingFileContent) return;
    const res = onRestoreBackup(pendingFileContent);
    setShowRestoreModal(false);
    setPendingFileContent(null);

    if (res.success) {
      setRestoreMessage({ type: 'success', text: 'Backup restored successfully.' });
    } else {
      setRestoreMessage({ type: 'error', text: res.message || 'Invalid backup file.' });
    }

    setTimeout(() => {
      setRestoreMessage(null);
    }, 5000);
  };

  // Handle plan updates
  const handleUpdatePlan = (index: number, field: keyof MembershipPlan, value: any) => {
    const updated = [...plans];
    updated[index] = { ...updated[index], [field]: value };
    setPlans(updated);
  };

  const handleAddPlan = () => {
    const newPlan: MembershipPlan = {
      id: `plan-${Date.now()}`,
      name: 'Custom Plan',
      duration: 1,
      durationMonths: 1,
      durationUnit: 'Months',
      price: 1500,
      description: 'Custom duration membership plan',
      isActive: true,
    };
    setPlans([...plans, newPlan]);
  };

  const handleDeletePlanConfirm = () => {
    if (confirmDeletePlanIndex === null) return;
    const updated = plans.filter((_, i) => i !== confirmDeletePlanIndex);
    setPlans(updated);
    setConfirmDeletePlanIndex(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      gymName,
      gymLogo,
      address,
      phone,
      email,
      adminName,
      adminEmail,
      currencySymbol,
      plans,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Gym & System Settings</h2>
          <p className="text-xs text-slate-500">
            Configure gym branding, contact details, pricing plans, and admin profile.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onResetData}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold text-xs transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset Demo Data</span>
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-md shadow-rose-600/20"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* 1. GYM BRANDING & CONTACT DETAILS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-rose-600" />
          <span>Gym Profile & Branding</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Gym Name */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Gym / Business Name *</label>
            <input
              type="text"
              required
              value={gymName}
              onChange={(e) => setGymName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Currency Symbol */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Currency Symbol *</label>
            <input
              type="text"
              required
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Logo URL */}
          <div className="sm:col-span-2">
            <label className="font-semibold text-slate-700 block mb-1">Gym Logo URL</label>
            <div className="relative">
              <Image className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="https://..."
                value={gymLogo}
                onChange={(e) => setGymLogo(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Contact Phone *</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Contact Email *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Address */}
          <div className="sm:col-span-2">
            <label className="font-semibold text-slate-700 block mb-1">Gym Address *</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. MEMBERSHIP PLANS & PRICING */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-rose-600" />
              <span>Membership Plans & Pricing Config</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize membership plans, prices, durations, and active statuses.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddPlan}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Plan</span>
          </button>
        </div>

        <div className="space-y-4">
          {plans.map((plan, index) => {
            const isActive = plan.isActive !== false;
            const duration = plan.duration || plan.durationMonths || 1;
            const unit = plan.durationUnit || 'Months';

            return (
              <div
                key={plan.id}
                className={`p-4 rounded-xl border transition-all space-y-3 ${
                  isActive
                    ? 'border-slate-200 bg-slate-50/50'
                    : 'border-slate-200 bg-slate-100/60 opacity-75'
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs items-center">
                  {/* Plan Name */}
                  <div className="sm:col-span-4">
                    <label className="font-semibold text-slate-600 block mb-1">Plan Name *</label>
                    <input
                      type="text"
                      required
                      value={plan.name}
                      onChange={(e) => handleUpdatePlan(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-sm focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  {/* Duration Value */}
                  <div className="sm:col-span-2">
                    <label className="font-semibold text-slate-600 block mb-1">Duration *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={duration}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 1;
                        handleUpdatePlan(index, 'duration', val);
                        handleUpdatePlan(index, 'durationMonths', unit === 'Months' ? val : Math.max(1, Math.round(val / 30)));
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  {/* Duration Unit */}
                  <div className="sm:col-span-2">
                    <label className="font-semibold text-slate-600 block mb-1">Unit *</label>
                    <select
                      value={unit}
                      onChange={(e) => {
                        const u = e.target.value as 'Months' | 'Days' | 'Years';
                        handleUpdatePlan(index, 'durationUnit', u);
                        handleUpdatePlan(index, 'durationMonths', u === 'Months' ? duration : Math.max(1, Math.round(duration / 30)));
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-rose-500"
                    >
                      <option value="Months">Months</option>
                      <option value="Days">Days</option>
                      <option value="Years">Years</option>
                    </select>
                  </div>

                  {/* Price */}
                  <div className="sm:col-span-2">
                    <label className="font-semibold text-slate-600 block mb-1">
                      Price ({currencySymbol}) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={plan.price}
                      onChange={(e) => handleUpdatePlan(index, 'price', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-900 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  {/* Active Toggle & Delete */}
                  <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-4">
                    <button
                      type="button"
                      onClick={() => handleUpdatePlan(index, 'isActive', !isActive)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors border ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300'
                      }`}
                    >
                      {isActive ? 'Active' : 'Inactive'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmDeletePlanIndex(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Description input */}
                <div>
                  <input
                    type="text"
                    placeholder="Short description (e.g. Full gym access + cardio zone included)"
                    value={plan.description || ''}
                    onChange={(e) => handleUpdatePlan(index, 'description', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200/80 bg-white text-xs text-slate-600 placeholder:text-slate-400 focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Delete Confirmation Modal */}
        {confirmDeletePlanIndex !== null && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 max-w-sm w-full space-y-4 shadow-2xl text-slate-800">
              <div className="flex items-center gap-3 text-rose-600">
                <Trash2 className="w-6 h-6 shrink-0" />
                <h4 className="font-bold text-slate-900 text-base">Delete Membership Plan?</h4>
              </div>
              <p className="text-xs text-slate-600">
                Are you sure you want to delete the plan{' '}
                <strong>"{plans[confirmDeletePlanIndex]?.name}"</strong>? Existing members will retain their current membership history, but this plan will no longer be available for new members or renewals.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeletePlanIndex(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeletePlanConfirm}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all"
                >
                  Delete Plan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. ADMIN PROFILE */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-amber-500" />
          <span>Admin / Owner Profile</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Admin Name *</label>
            <input
              type="text"
              required
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Admin Email *</label>
            <input
              type="email"
              required
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* 4. DATA MANAGEMENT (BACKUP & RESTORE) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Database className="w-5 h-5 text-rose-600" />
              <span>Data Management</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Export system backups, restore previous data backups, or reset application defaults.
            </p>
          </div>
        </div>

        {restoreMessage && (
          <div
            className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
              restoreMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {restoreMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{restoreMessage.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Export Backup Card */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Export Backup</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Download a JSON backup containing members, membership plans, attendance logs, payment receipts, and gym settings.
              </p>
            </div>

            <button
              type="button"
              onClick={onExportBackup}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Export Application Data</span>
            </button>
          </div>

          {/* Restore Backup Card */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Upload className="w-4 h-4 text-amber-600" />
                <span>Restore Backup</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Upload a previously exported JSON backup file to restore application records.
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-xs"
            >
              <Upload className="w-4 h-4" />
              <span>Select Backup File</span>
            </button>
          </div>
        </div>

        {/* Reset Demo Data Button */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">Need to restore clean demo records?</span>
          <button
            type="button"
            onClick={onResetData}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* RESTORE CONFIRMATION MODAL */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 max-w-md w-full space-y-4 shadow-2xl text-slate-800">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="font-bold text-slate-900 text-base">Restore Backup?</h4>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <p className="font-semibold text-slate-800">
                Selected File: <span className="font-mono text-amber-700">{pendingFileName}</span>
              </p>
              <p className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-medium">
                Restoring this backup may replace existing application data. Continue?
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowRestoreModal(false);
                  setPendingFileContent(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
              >
                Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

