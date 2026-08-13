import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Phone, Mail, MapPin, DollarSign, Image } from 'lucide-react';
import { Member, MembershipPlan, Gender, PaymentStatus } from '../../types';
import { addDurationToDate, addMonthsToDate, getTodayDateString } from '../../utils/formatters';

interface MemberFormModalProps {
  isOpen: boolean;
  memberToEdit?: Member | null;
  plans: MembershipPlan[];
  currencySymbol: string;
  onSave: (data: Omit<Member, 'id' | 'status'> | Member) => void;
  onClose: () => void;
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
];

export const MemberFormModal: React.FC<MemberFormModalProps> = ({
  isOpen,
  memberToEdit,
  plans,
  currencySymbol,
  onSave,
  onClose,
}) => {
  const today = getTodayDateString();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('1995-01-01');
  const [gender, setGender] = useState<Gender>('Male');
  const [address, setAddress] = useState('');
  const [joiningDate, setJoiningDate] = useState(today);
  const [planId, setPlanId] = useState(plans[0]?.id || 'plan-1');
  const [startDate, setStartDate] = useState(today);
  const [expiryDate, setExpiryDate] = useState('');
  const [amount, setAmount] = useState<number>(plans[0]?.price || 50);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid');
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  const [photoUrl, setPhotoUrl] = useState(DEFAULT_AVATARS[0]);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [notes, setNotes] = useState('');

  const [formError, setFormError] = useState<string | null>(null);

  const activePlans = plans.filter((p) => p.isActive !== false);
  const availablePlans = activePlans.length > 0 ? activePlans : plans;

  // Auto update price & expiry when plan or startDate changes
  useEffect(() => {
    if (memberToEdit) return; // Don't overwrite if editing existing
    const selectedPlan = plans.find((p) => p.id === planId);
    if (selectedPlan) {
      setAmount(selectedPlan.price);
      if (startDate) {
        const duration = selectedPlan.duration || selectedPlan.durationMonths || 1;
        const unit = selectedPlan.durationUnit || 'Months';
        const calculatedExpiry = addDurationToDate(startDate, duration, unit);
        setExpiryDate(calculatedExpiry);
      }
    }
  }, [planId, startDate, plans, memberToEdit]);

  useEffect(() => {
    setFormError(null);
    if (memberToEdit) {
      setFullName(memberToEdit.fullName);
      setPhone(memberToEdit.phone);
      setEmail(memberToEdit.email);
      setDob(memberToEdit.dob);
      setGender(memberToEdit.gender);
      setAddress(memberToEdit.address);
      setJoiningDate(memberToEdit.joiningDate);
      setPlanId(memberToEdit.planId);
      setStartDate(memberToEdit.startDate);
      setExpiryDate(memberToEdit.expiryDate);
      setAmount(memberToEdit.amount);
      setPaymentStatus(memberToEdit.paymentStatus);
      setPendingAmount(memberToEdit.pendingAmount || 0);
      setPhotoUrl(memberToEdit.photoUrl);
      setEmergencyContact(memberToEdit.emergencyContact || '');
      setNotes(memberToEdit.notes || '');
    } else {
      // Reset defaults
      setFullName('');
      setPhone('');
      setEmail('');
      setDob('1995-01-01');
      setGender('Male');
      setAddress('');
      setJoiningDate(today);
      setPlanId(plans[0]?.id || 'plan-1');
      setStartDate(today);
      const firstPlan = plans[0];
      if (firstPlan) {
        setAmount(firstPlan.price);
        setExpiryDate(addMonthsToDate(today, firstPlan.durationMonths));
      }
      setPaymentStatus('Paid');
      setPendingAmount(0);
      setPhotoUrl(DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)]);
      setEmergencyContact('');
      setNotes('');
    }
  }, [memberToEdit, isOpen, plans, today]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1. Name check
    if (!fullName.trim()) {
      setFormError('Member Full Name is required.');
      return;
    }

    // 2. Phone check (at least 7 digits)
    const phoneDigits = phone.replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length < 7) {
      setFormError('Please enter a valid phone number (at least 7 digits).');
      return;
    }

    // 3. Email check if provided
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }

    // 4. Dates check
    if (!startDate || !expiryDate || !joiningDate) {
      setFormError('Joining Date, Start Date, and Expiry Date are required.');
      return;
    }

    if (new Date(expiryDate) < new Date(startDate)) {
      setFormError('Expiry Date cannot be earlier than Start Date.');
      return;
    }

    // 5. Amount check
    if (isNaN(amount) || amount <= 0) {
      setFormError('Plan Amount must be greater than 0.');
      return;
    }

    const selectedPlan = plans.find((p) => p.id === planId);
    const planName = selectedPlan ? selectedPlan.name : 'Custom Plan';

    const memberPayload = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      dob,
      gender,
      address: address.trim(),
      joiningDate,
      planId,
      planName,
      startDate,
      expiryDate,
      amount: Number(amount),
      paymentStatus,
      pendingAmount: paymentStatus === 'Paid' ? 0 : Number(pendingAmount),
      photoUrl,
      emergencyContact: emergencyContact.trim(),
      notes: notes.trim(),
    };

    if (memberToEdit) {
      onSave({
        ...memberToEdit,
        ...memberPayload,
      });
    } else {
      onSave(memberPayload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col relative animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 shrink-0 z-10 bg-white">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              {memberToEdit ? 'Edit Member Details' : 'Add New Member'}
            </h3>
            <p className="text-xs text-slate-500">
              {memberToEdit
                ? `Updating profile for Member ID: ${memberToEdit.id}`
                : 'Fill in member profile & membership duration'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-xl hover:bg-slate-100 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container with scrollable body */}
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 overflow-hidden">
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

          {/* Avatar selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-rose-600" />
              <span>Profile Photo</span>
            </label>
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {DEFAULT_AVATARS.map((url, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setPhotoUrl(url)}
                  className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all shrink-0 ${
                    photoUrl === url
                      ? 'border-rose-600 scale-105 shadow-md'
                      : 'border-slate-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="Avatar option" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* DOB & Gender */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-amber-500 bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">Address</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Street address, City, State"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Membership Plan Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Membership Plan *
              </label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500 bg-white"
              >
                {availablePlans.map((p) => {
                  const dur = p.duration || p.durationMonths || 1;
                  const unit = p.durationUnit || 'Months';
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} ({dur} {unit} - {currencySymbol}
                      {p.price})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Start Date & Expiry Date */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Amount & Payment Status */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Plan Amount ({currencySymbol}) *
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  min="0"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Payment Status *
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500 bg-white"
              >
                <option value="Paid">Paid (Full)</option>
                <option value="Pending">Pending (Due)</option>
                <option value="Partial">Partial Payment</option>
              </select>
            </div>

            {paymentStatus !== 'Paid' && (
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-amber-700 block mb-1">
                  Pending Dues Amount ({currencySymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  value={pendingAmount}
                  onChange={(e) => setPendingAmount(Number(e.target.value))}
                  placeholder="Enter remaining pending amount"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-amber-50/30 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {/* Emergency Contact */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Emergency Contact
              </label>
              <input
                type="text"
                placeholder="+1 (555) 999-0000"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Joining Date */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Joining Date
              </label>
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Notes / Remarks</label>
            <textarea
              rows={2}
              placeholder="Fitness goals, medical considerations, or payment notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          </div>

          {/* Fixed Actions Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-md shadow-rose-600/20"
            >
              {memberToEdit ? 'Save Changes' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
