import { useState } from 'react';
import type { FinancialProfile } from '../types';
import { formatCurrency } from '../utils/currency';
import { ShieldCheck, Flame, ToggleLeft, ToggleRight, CheckCircle2, Zap } from 'lucide-react';

interface SubscriptionAuditProps {
  profile: FinancialProfile;
}

interface AuditedItem {
  id: string;
  name: string;
  category: string;
  monthlyAmount: number;
  isStoppable: boolean;
  frequency: string;
  reason: string;
}

export function SubscriptionAudit({ profile }: SubscriptionAuditProps) {
  const currency = profile.home_currency;

  const subscriptions: AuditedItem[] = [
    {
      id: 'sub_01',
      name: 'Cloud Streaming & Premium Entertainment',
      category: 'Dining / Entertainment',
      monthlyAmount: 24.99,
      isStoppable: true,
      frequency: 'Monthly',
      reason: 'Non-essential subscription service identified in ledger'
    },
    {
      id: 'sub_02',
      name: 'Gym & Fitness Club Membership',
      category: 'Fitness & Health',
      monthlyAmount: 49.00,
      isStoppable: true,
      frequency: 'Monthly',
      reason: 'Can be temporarily paused during low cashflow windows'
    },
    {
      id: 'sub_03',
      name: 'AI & Developer SaaS Subscription',
      category: 'Software & Tools',
      monthlyAmount: 30.00,
      isStoppable: true,
      frequency: 'Monthly',
      reason: 'Flexible recurring charge'
    },
    {
      id: 'sub_04',
      name: 'High-Speed Home Fiber Internet',
      category: 'Utilities & Housing',
      monthlyAmount: 75.00,
      isStoppable: false,
      frequency: 'Monthly',
      reason: 'Protected essential category in user profile'
    },
    {
      id: 'sub_05',
      name: 'Gourmet Coffee & Dining Pass',
      category: 'Dining Out',
      monthlyAmount: 65.00,
      isStoppable: true,
      frequency: 'Monthly',
      reason: 'Flexible adjustable category in user profile'
    }
  ];

  const [pausedIds, setPausedIds] = useState<Set<string>>(new Set(['sub_01', 'sub_05']));

  const togglePause = (id: string) => {
    const next = new Set(pausedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setPausedIds(next);
  };

  const totalMonthlySpend = subscriptions.reduce((sum, s) => sum + s.monthlyAmount, 0);
  
  const pausedMonthlySavings = subscriptions
    .filter((s) => pausedIds.has(s.id))
    .reduce((sum, s) => sum + s.monthlyAmount, 0);

  const annualSavingsUnlocked = pausedMonthlySavings * 12;
  const new90DayBufferAdded = pausedMonthlySavings * 3;

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-6">
      {/* Header Banner */}
      <div className="p-8 rounded-[2.5rem] bg-slate-900/60 border border-white/10 backdrop-blur-2xl relative overflow-hidden bezel-inset">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Zap className="w-3.5 h-3.5" />
              Automated Subscription Audit Engine
            </div>
            <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight font-display">
              Recurring Expense & Buffer Optimizer
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Audit recurring charges, identify non-essential subscriptions, and simulate how pausing flexible expenses boosts your 90-day cash buffer.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="px-5 py-3 rounded-2xl bg-purple-950/40 border border-purple-500/30">
              <div className="text-xs text-purple-300/80">Monthly Unlocked Savings</div>
              <div className="text-xl font-bold text-purple-300">
                +{formatCurrency(pausedMonthlySavings, currency)}
              </div>
            </div>

            <div className="px-5 py-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
              <div className="text-xs text-emerald-300/80">12-Month Cash Growth</div>
              <div className="text-xl font-bold text-emerald-300">
                +{formatCurrency(annualSavingsUnlocked, currency)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Subscriptions List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-6 rounded-[2rem] bg-slate-900/50 border border-white/10 backdrop-blur-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Flame className="w-4 h-4 text-purple-400" />
                Detected Recurring Transactions in Ledger ({subscriptions.length})
              </h3>
              <div className="text-xs text-slate-400">
                Total Recurring Spend: <span className="text-slate-200 font-bold">{formatCurrency(totalMonthlySpend, currency)}/mo</span>
              </div>
            </div>

            <div className="space-y-3">
              {subscriptions.map((sub) => {
                const isPaused = pausedIds.has(sub.id);
                return (
                  <div
                    key={sub.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                      isPaused
                        ? 'bg-purple-950/20 border-purple-500/40 opacity-90'
                        : sub.isStoppable
                        ? 'bg-slate-800/40 border-white/5 hover:border-white/20'
                        : 'bg-slate-950/60 border-white/5'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-100">{sub.name}</span>
                        {sub.isStoppable ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-medium">
                            Flexible / Stoppable
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 border border-white/10 text-slate-400 font-medium">
                            Protected Essential
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{sub.reason}</p>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-100">
                          {formatCurrency(sub.monthlyAmount, currency)}
                        </div>
                        <div className="text-[10px] text-slate-400">/ month</div>
                      </div>

                      {sub.isStoppable ? (
                        <button
                          onClick={() => togglePause(sub.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                            isPaused
                              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {isPaused ? <ToggleRight className="w-4 h-4 text-purple-200" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                          {isPaused ? 'Paused (Saving)' : 'Active'}
                        </button>
                      ) : (
                        <div className="px-3 py-1 rounded-xl text-[10px] bg-slate-800 text-slate-500 font-medium">
                          Non-Pausable
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Impact Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-[2rem] bg-slate-900/50 border border-white/10 backdrop-blur-xl space-y-5">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Buffer Impact Summary
            </h3>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-white/5 space-y-2">
                <div className="text-xs text-slate-400">90-Day Cashflow Impact</div>
                <div className="text-2xl font-bold text-emerald-400">
                  +{formatCurrency(new90DayBufferAdded, currency)}
                </div>
                <p className="text-[11px] text-slate-400">
                  Added to your 90-day minimum balance buffer.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20 space-y-2">
                <div className="text-xs text-purple-300">Paused Subscriptions</div>
                <div className="text-xl font-bold text-white">
                  {pausedIds.size} of {subscriptions.filter((s) => s.isStoppable).length} Pausable Items
                </div>
                <p className="text-[11px] text-slate-300">
                  Unlocks {formatCurrency(pausedMonthlySavings, currency)} each month.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/30 border border-white/5 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-xs text-slate-300">
                  Essential bills like home internet remain 100% protected and uninterrupted.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
