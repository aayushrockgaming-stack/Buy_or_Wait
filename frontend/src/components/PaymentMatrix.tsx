import React from 'react';
import type { RequestPaymentOption, FinancialProfile } from '../types';
import { CreditCard, Calendar, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

interface PaymentMatrixProps {
  options: RequestPaymentOption[];
  profile: FinancialProfile;
  requestedAmount: number;
  requestDate: string;
  earliestSafeDate: string | null;
  onSelectOption?: (opt: RequestPaymentOption) => void;
}

export const PaymentMatrix: React.FC<PaymentMatrixProps> = ({
  options,
  profile,
  requestedAmount,
  requestDate,
  earliestSafeDate,
  onSelectOption
}) => {
  return (
    <div className="ring-1 ring-white/10 p-2 rounded-[2rem] bg-slate-950/80 backdrop-blur-2xl">
      <div className="p-6 rounded-[calc(2rem-0.5rem)] bg-slate-900/90 border border-white/10 bezel-inset space-y-6">
        
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-white">Payment Strategy Comparison Matrix</h3>
              <p className="text-xs text-slate-400">Evaluate full payment, installment options, and delayed payment schedules side-by-side.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col justify-between space-y-4 hover:border-indigo-500/30 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Full Payment</span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-semibold">
                  1 Payment
                </span>
              </div>

              <div className="font-display font-extrabold text-2xl text-white mb-1">
                {formatCurrency(requestedAmount, profile.home_currency)}
              </div>
              <span className="text-xs text-slate-400">Due today on {requestDate}</span>

              <div className="mt-4 pt-4 border-t border-white/5 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Financing Fees</span>
                  <span className="text-emerald-400 font-semibold">{formatCurrency(0, profile.home_currency)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Safety Status</span>
                  <span className="text-emerald-400 font-semibold">Reserve Checked</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectOption && onSelectOption({
                request_id: 'custom',
                payment_option_id: 'full_payment',
                payment_method: 'full_payment',
                first_payment_date: requestDate,
                payment_frequency_days: 0,
                number_of_payments: 1,
                payment_amount: requestedAmount,
                financing_fee: 0,
                total_payable_amount: requestedAmount
              })}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Select Full Payment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {options.map((opt, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col justify-between space-y-4 hover:border-indigo-500/30 transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    {opt.number_of_payments}-Part Installments
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-semibold">
                    {opt.payment_frequency_days}d Cycle
                  </span>
                </div>

                <div className="font-display font-extrabold text-2xl text-white mb-1">
                  {formatCurrency(Number(opt.payment_amount), profile.home_currency)}
                  <span className="text-xs font-normal text-slate-400"> / payment</span>
                </div>
                <span className="text-xs text-slate-400">First due on {opt.first_payment_date}</span>

                <div className="mt-4 pt-4 border-t border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Total Payable</span>
                    <span className="text-slate-200 font-semibold">{formatCurrency(Number(opt.total_payable_amount), profile.home_currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Financing Fee</span>
                    <span className={Number(opt.financing_fee) > 0 ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                      {formatCurrency(Number(opt.financing_fee), profile.home_currency)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectOption && onSelectOption(opt)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Select {opt.number_of_payments}-Part Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col justify-between space-y-4 hover:border-indigo-500/30 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Wait Option</span>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 text-[10px] font-semibold">
                  Delayed Safe Date
                </span>
              </div>

              <div className="font-display font-extrabold text-xl text-cyan-300 mb-1">
                {earliestSafeDate || 'Not Safe in 90 Days'}
              </div>
              <span className="text-xs text-slate-400">Earliest projected safe payment date</span>

              <div className="mt-4 pt-4 border-t border-white/5 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Total Amount</span>
                  <span className="text-white font-semibold">{formatCurrency(requestedAmount, profile.home_currency)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Interest / Fees</span>
                  <span className="text-emerald-400 font-semibold">{formatCurrency(0, profile.home_currency)}</span>
                </div>
              </div>
            </div>

            <button
              disabled={!earliestSafeDate}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{earliestSafeDate ? `Wait for ${earliestSafeDate}` : 'Wait Not Available'}</span>
              <Calendar className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
