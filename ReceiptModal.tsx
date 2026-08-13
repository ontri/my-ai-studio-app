import React from 'react';
import { X, Printer, Dumbbell, CheckCircle, ShieldCheck } from 'lucide-react';
import { FeePayment, GymSettings, Member } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface ReceiptModalProps {
  payment: FeePayment | null;
  member?: Member | null;
  settings: GymSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  payment,
  member,
  settings,
  onClose,
}) => {
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[92vh] flex flex-col p-6 sm:p-8 relative animate-fade-in print:shadow-none print:border-none print:p-0 overflow-hidden">
        {/* Close & Print Action Header (Hidden when printing) */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 shrink-0 print:hidden">
          <h3 className="font-bold text-slate-900 text-lg">Official Fee Receipt</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs"
            >
              <Printer className="w-4 h-4 text-rose-400" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* RECEIPT BODY (PRINTABLE AREA) */}
        <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50 print:bg-white print:border-slate-300 space-y-6 overflow-y-auto flex-1">
          {/* Header Branding */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-rose-400 flex items-center justify-center shrink-0 shadow-xs">
                {settings.gymLogo ? (
                  <img
                    src={settings.gymLogo}
                    alt={settings.gymName}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <Dumbbell className="w-6 h-6" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{settings.gymName}</h2>
                <p className="text-xs text-slate-500">{settings.address}</p>
                <p className="text-[11px] text-slate-400">
                  Tel: {settings.phone} | {settings.email}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block bg-rose-100 px-2.5 py-1 rounded-full border border-rose-200">
                PAYMENT RECEIPT
              </span>
              <p className="text-xs font-mono font-bold text-slate-900 mt-2">
                {payment.receiptNo}
              </p>
              <p className="text-[10px] text-slate-400">{formatDate(payment.paymentDate)}</p>
            </div>
          </div>

          {/* Member & Payment Details */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Received From</p>
              <p className="font-bold text-slate-900 text-sm">{payment.memberName}</p>
              <p className="text-slate-500 font-mono">Member ID: {payment.memberId}</p>
              {member?.phone && <p className="text-slate-500">Phone: {member.phone}</p>}
            </div>

            <div className="text-right">
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Payment Method & Purpose</p>
              <p className="font-bold text-slate-900 text-sm">{payment.paymentMethod}</p>
              <p className="text-rose-600 font-semibold text-xs">{payment.purpose || 'Fee Payment'}</p>
              <p className="text-emerald-600 font-semibold flex items-center justify-end gap-1 mt-0.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Status: Paid</span>
              </p>
            </div>
          </div>

          {/* Table Breakdown */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3">
                    <span className="font-bold text-slate-900 block">{payment.planName}</span>
                    <span className="text-[11px] text-slate-500">
                      Purpose: {payment.purpose || 'Fee Payment'} for {payment.memberName}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900 text-sm">
                    {formatCurrency(payment.amount, settings.currencySymbol)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total Box */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 text-white">
            <span className="text-xs font-semibold text-slate-300">Total Amount Paid</span>
            <span className="text-xl font-bold text-rose-400">
              {formatCurrency(payment.amount, settings.currencySymbol)}
            </span>
          </div>

          {payment.notes && (
            <div className="text-xs text-slate-500 italic bg-white p-2.5 rounded-lg border border-slate-100">
              Note: {payment.notes}
            </div>
          )}

          {/* Thank You Footer */}
          <div className="text-center pt-2">
            <p className="text-sm font-bold text-slate-800 tracking-wide uppercase">Thank you!</p>
          </div>

          {/* Footer Signature */}
          <div className="flex items-end justify-between pt-6 border-t border-slate-200 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Computer generated official gym receipt</span>
            </div>

            <div className="text-center">
              <div className="w-32 border-b border-slate-300 mb-1" />
              <p className="text-[10px] font-semibold text-slate-500 uppercase">
                Authorized Signature
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
