import React, { useState, useEffect } from 'react';
import { X, Calendar, CreditCard, RefreshCw, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Member, MembershipPlan, PaymentMethod, GymSettings } from '../../types';
import {
  formatCurrency,
  formatDate,
  getTodayDateString,
  calculateRenewalStartDate,
  addDurationToDate,
  getStatusBadgeClass,
} from '../../utils/formatters';
import { RenewalParams } from '../../services/memberService';

interface RenewModalProps {
  member: Member | null;
  plans: MembershipPlan[];
  settings: GymSettings;
  onClose: () => void;
  onRenewSuccess: (params: RenewalParams) => void;
}

export const RenewModal: React.FC<RenewModalProps> = ({
  member,
  plans,
  settings,
  onClose,
  onRenewSuccess,
}) => {
  if (!member) return null;

  const activePlans = plans.filter((p) => p.isActive !== false);

  const defaultPlan = activePlans[0] || plans[0];
  const initialStartDate = calculateRenewalStartDate(member.expiryDate, member.status);

  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    member.planId && activePlans.some((p) => p.id === member.planId)
      ? member.planId
      : defaultPlan?.id || ''
  );
  const [startDate, setStartDate] = useState<string>(initialStartDate);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [amount, setAmount] = useState<number>(defaultPlan?.price || 0);
  const [recordPayment, setRecordPayment] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentDate, setPaymentDate] = useState<string>(getTodayDateString());
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  // Recalculate expiry & amount when plan or start date changes
  useEffect(() => {
    const plan = plans.find((p) => p.id === selectedPlanId);
    if (plan && startDate) {
      const duration = plan.duration || plan.durationMonths || 1;
      const unit = plan.durationUnit || 'Months';
      const calculatedExpiry = addDurationToDate(startDate, duration, unit);
      setExpiryDate(calculatedExpiry);
      setAmount(plan.price);
    }
  }, [selectedPlanId, startDate, plans]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    setFormError(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedPlanId || !selectedPlan) {
      setFormError('Please select a valid membership plan.');
      return;
    }

    if (!startDate) {
      setFormError('Please select a valid membership start date.');
      return;
    }

    if (!expiryDate) {
      setFormError('Please select a valid membership expiry date.');
      return;
    }

    if (expiryDate <= startDate) {
      setFormError('Expiry date must be after the start date.');
      return;
    }

    if (isNaN(amount) || amount < 0) {
      setFormError('Renewal amount must be 0 or greater.');
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirmRenew = () => {
    if (!selectedPlan) return;

    onRenewSuccess({
      memberId: member.id,
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      startDate,
      expiryDate,
      amount,
      recordPayment,
      paymentMethod: recordPayment ? paymentMethod : undefined,
      paymentDate: recordPayment ? paymentDate : undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[92vh] flex flex-col relative animate-fade-in overflow-hidden">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white shrink-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Renew Membership</h3>
              <p className="text-xs text-slate-500 truncate max-w-[220px]">
                {member.fullName} ({member.id})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-xl hover:bg-slate-100 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleFormSubmit} className="flex flex-col min-h-0 flex-1 overflow-hidden">
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            {/* Current Status Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                  Current Status
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full font-semibold border text-[11px] ${getStatusBadgeClass(
                    member.status
                  )}`}
                >
                  {member.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span>Current Plan: <strong>{member.planName}</strong></span>
                <span>Expiry: <strong>{formatDate(member.expiryDate)}</strong></span>
              </div>
            </div>

            {/* Select New Membership Plan */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                Select New Plan *
              </label>
              <div className="grid grid-cols-1 gap-2">
                {activePlans.map((plan) => {
                  const isSelected = plan.id === selectedPlanId;
                  const dur = plan.duration || plan.durationMonths || 1;
                  const unit = plan.durationUnit || 'Months';
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => handlePlanChange(plan.id)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-rose-600 bg-rose-50/40 text-slate-900 shadow-xs ring-1 ring-rose-600/30'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm flex items-center gap-1.5">
                          <span>{plan.name}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Duration: {dur} {unit} • {plan.description || 'Full access'}
                        </p>
                      </div>
                      <span className="font-bold text-sm text-slate-900 shrink-0 ml-3">
                        {formatCurrency(plan.price, settings.currencySymbol)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Renewal Start & Expiry Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">New Start Date *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-medium focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">New Expiry Date *</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-medium focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Renewal Amount */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Renewal Fee ({settings.currencySymbol}) *
              </label>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-sm text-slate-900 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Record Payment Section */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={recordPayment}
                  onChange={(e) => setRecordPayment(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                />
                <span>Record Renewal Payment Now</span>
              </label>

              {recordPayment && (
                <div className="space-y-3 pt-2 border-t border-slate-200/80 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-600 block mb-1">
                        Payment Method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:border-rose-500"
                      >
                        <option value="UPI">UPI</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-600 block mb-1">
                        Payment Date
                      </label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Optional Notes */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Extended special discount, cash paid upfront..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Actions Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Confirm Renewal</span>
            </button>
          </div>
        </form>

        {/* Renewal Confirmation Dialog Overlay */}
        {showConfirm && (
          <div className="absolute inset-0 z-20 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 max-w-sm w-full space-y-4 shadow-2xl text-slate-800">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Confirm Renewal</h4>
                  <p className="text-xs text-slate-500">Member: {member.fullName}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 text-xs space-y-1.5 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Plan:</span>
                  <span className="font-bold text-slate-900">{selectedPlan?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">New Period:</span>
                  <span className="font-semibold text-slate-800">
                    {formatDate(startDate)} → {formatDate(expiryDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount:</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(amount, settings.currencySymbol)}
                  </span>
                </div>
                {recordPayment && (
                  <div className="flex justify-between text-emerald-700 font-semibold pt-1 border-t border-slate-200/60">
                    <span>Payment:</span>
                    <span>{paymentMethod} ({formatDate(paymentDate)})</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRenew}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all"
                >
                  Yes, Apply Renewal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
