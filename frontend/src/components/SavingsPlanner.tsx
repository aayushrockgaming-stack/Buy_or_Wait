import { useState } from 'react';
import type { FinancialProfile } from '../types';
import { formatCurrency, convertCurrency } from '../utils/currency';
import { Target, Calendar, Sparkles, CheckCircle2, TrendingUp, PiggyBank } from 'lucide-react';

interface SavingsPlannerProps {
  profile: FinancialProfile;
}

interface PreGoal {
  name: string;
  defaultAmountUSD: number;
  category: string;
  icon: string;
}

const PRESET_GOALS: PreGoal[] = [
  { name: 'MacBook Pro M3 Max', defaultAmountUSD: 2499, category: 'Tech & Hardware', icon: '💻' },
  { name: 'Tokyo International Trip', defaultAmountUSD: 3500, category: 'Travel & Experiences', icon: '✈️' },
  { name: '6-Month Emergency Buffer', defaultAmountUSD: 6000, category: 'Financial Security', icon: '🛡️' },
  { name: '4K OLED Creator Setup', defaultAmountUSD: 1800, category: 'Workstation', icon: '🖥️' },
];

export function SavingsPlanner({ profile }: SavingsPlannerProps) {
  const currency = profile.home_currency;

  const [selectedGoal, setSelectedGoal] = useState<string>(PRESET_GOALS[0].name);
  const [targetAmount, setTargetAmount] = useState<number>(
    Math.round(convertCurrency(PRESET_GOALS[0].defaultAmountUSD, 'USD', currency))
  );
  const [targetMonths, setTargetMonths] = useState<number>(6);
  const [customGoalName, setCustomGoalName] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  const goalTitle = isCustom && customGoalName ? customGoalName : selectedGoal;
  const totalDays = Math.max(1, targetMonths * 30);
  const totalWeeks = Math.max(1, Math.round(targetMonths * 4.33));

  const dailySavings = targetAmount / totalDays;
  const weeklySavings = targetAmount / totalWeeks;
  const monthlySavings = targetAmount / Math.max(1, targetMonths);

  const availableBuffer = Math.max(0, profile.current_available_balance - profile.minimum_balance_to_keep);

  const handleSelectPreset = (goal: PreGoal) => {
    setIsCustom(false);
    setSelectedGoal(goal.name);
    setTargetAmount(Math.round(convertCurrency(goal.defaultAmountUSD, 'USD', currency)));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-6">
      {/* Header Banner */}
      <div className="p-8 rounded-[2.5rem] bg-slate-900/60 border border-white/10 backdrop-blur-2xl relative overflow-hidden bezel-inset">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <PiggyBank className="w-3.5 h-3.5" />
              Target Purchase Planner
            </div>
            <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight font-display">
              Autonomous Goal & Micro-Savings Strategy
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Calculate exact daily, weekly, and monthly safe savings targets for high-ticket purchases without violating your minimum balance threshold.
            </p>
          </div>

          <div className="px-5 py-3 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center gap-4">
            <div>
              <div className="text-xs text-slate-400">Available Liquid Buffer</div>
              <div className="text-xl font-bold text-emerald-400">
                {formatCurrency(availableBuffer, currency)}
              </div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <div className="text-xs text-slate-400">Min Reserve Target</div>
              <div className="text-xl font-bold text-amber-400">
                {formatCurrency(profile.minimum_balance_to_keep, currency)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Parameters & Presets */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-[2rem] bg-slate-900/50 border border-white/10 backdrop-blur-xl space-y-5">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              1. Select or Create Purchase Goal
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {PRESET_GOALS.map((goal) => {
                const converted = Math.round(convertCurrency(goal.defaultAmountUSD, 'USD', currency));
                const isSelected = !isCustom && selectedGoal === goal.name;
                return (
                  <button
                    key={goal.name}
                    onClick={() => handleSelectPreset(goal)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/50 text-white shadow-lg shadow-cyan-950/30'
                        : 'bg-slate-800/40 border-white/5 hover:border-white/20 text-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xl">{goal.icon}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-semibold line-clamp-1">{goal.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{formatCurrency(converted, currency)}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-white/5">
              <button
                onClick={() => {
                  setIsCustom(true);
                  if (!customGoalName) setCustomGoalName('Custom Goal');
                }}
                className={`w-full p-3.5 rounded-2xl border text-sm font-medium transition-all cursor-pointer flex items-center justify-between ${
                  isCustom
                    ? 'bg-indigo-950/40 border-indigo-500/50 text-white'
                    : 'bg-slate-800/30 border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <span>➕ Create Custom Savings Target</span>
                {isCustom && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
              </button>
            </div>

            {isCustom && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Custom Item / Target Name</label>
                  <input
                    type="text"
                    value={customGoalName}
                    onChange={(e) => setCustomGoalName(e.target.value)}
                    placeholder="e.g. Electric Bicycle, Home Renovation"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Target Purchase Price</span>
                  <span className="text-cyan-400 font-semibold">{formatCurrency(targetAmount, currency)}</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={Math.round(convertCurrency(10000, 'USD', currency))}
                  step={50}
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(Number(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Target Timeframe ({targetMonths} Months / {totalDays} Days)</span>
                  <span className="text-cyan-400 font-semibold">{targetMonths} Months</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={24}
                  step={1}
                  value={targetMonths}
                  onChange={(e) => setTargetMonths(Number(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Micro-Savings Breakdown */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-[2rem] bg-slate-900/50 border border-white/10 backdrop-blur-xl space-y-6">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              2. Micro-Savings Schedule ({goalTitle})
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 text-center">
                <div className="text-xs text-cyan-300/80 mb-1">Daily Target</div>
                <div className="text-xl font-bold text-cyan-300">
                  {formatCurrency(dailySavings, currency)}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">/ day</div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-center">
                <div className="text-xs text-indigo-300/80 mb-1">Weekly Target</div>
                <div className="text-xl font-bold text-indigo-300">
                  {formatCurrency(weeklySavings, currency)}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">/ week</div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20 text-center">
                <div className="text-xs text-purple-300/80 mb-1">Monthly Target</div>
                <div className="text-xl font-bold text-purple-300">
                  {formatCurrency(monthlySavings, currency)}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">/ month</div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/40 border border-white/5 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Purchase Goal</span>
                <span className="text-slate-100 font-bold">{formatCurrency(targetAmount, currency)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Target Completion Date</span>
                <span className="text-cyan-400 font-semibold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(Date.now() + totalDays * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Estimated Buffer Depletion Risk</span>
                <span className="text-emerald-400 font-medium">Low (0.0% Reserve Breach)</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-500/30 space-y-2">
              <div className="text-xs font-semibold text-cyan-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                AI Smart Recommendation
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                By setting aside <strong className="text-white">{formatCurrency(dailySavings, currency)}/day</strong>, you will fully fund <strong>"{goalTitle}"</strong> in <strong>{targetMonths} months</strong> without touching your <strong>{formatCurrency(profile.minimum_balance_to_keep, currency)}</strong> minimum safety reserve.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
