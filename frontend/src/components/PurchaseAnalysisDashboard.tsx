import React, { useState } from 'react';
import type { FinancialProfile, FinancialEvent, RequestPaymentOption, EvaluationResult, SimulationDay } from '../types';
import { formatCurrency } from '../utils/currency';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  XCircle, 
  Sparkles, 
  ShieldCheck, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  TrendingDown, 
  Info, 
  SlidersHorizontal,
  User as UserIcon,
  CreditCard,
  List,
  FileText,
  Activity
} from 'lucide-react';
import { SAMPLE_REQUESTS, SAMPLE_OPTIONS } from '../data/mockData';

interface PurchaseAnalysisDashboardProps {
  profile: FinancialProfile;
  events: FinancialEvent[];
  currentResult: EvaluationResult | null;
  simulationDays: SimulationDay[];
  onSelectRequest: (sampleId: string) => void;
  isLiveApiConnected: boolean;
}

export const PurchaseAnalysisDashboard: React.FC<PurchaseAnalysisDashboardProps> = ({
  profile,
  events,
  currentResult,
  simulationDays,
  onSelectRequest,
  isLiveApiConnected
}) => {
  const currency = profile.home_currency;

  const [selectedSampleId, setSelectedSampleId] = useState<string>('req_101');
  const [activeNavTab, setActiveNavTab] = useState<'dashboard' | 'analysis' | 'transactions' | 'requests'>('analysis');

  // Find active request data
  const currentSample = SAMPLE_REQUESTS.find(r => r.request_id === selectedSampleId) || SAMPLE_REQUESTS[0];
  const requestedAmount = Number(currentSample.requested_amount);
  const paymentOptions: RequestPaymentOption[] = SAMPLE_OPTIONS[selectedSampleId] || [
    {
      request_id: selectedSampleId,
      payment_option_id: `${selectedSampleId}_full`,
      payment_method: 'full_payment',
      first_payment_date: currentSample.request_date,
      payment_frequency_days: 0,
      number_of_payments: 1,
      payment_amount: requestedAmount,
      financing_fee: 0,
      total_payable_amount: requestedAmount
    }
  ];

  const handleRequestChange = (reqId: string) => {
    setSelectedSampleId(reqId);
    onSelectRequest(reqId);
  };

  // Helper for status styling
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'affordable_now':
        return {
          label: 'Affordable Now',
          badgeBg: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400',
          cardBorder: 'border-emerald-500/40',
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />,
          summaryColor: 'text-emerald-400'
        };
      case 'affordable_with_plan':
        return {
          label: 'Affordable With Plan',
          badgeBg: 'bg-amber-950/60 border-amber-500/40 text-amber-400',
          cardBorder: 'border-amber-500/40',
          icon: <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />,
          summaryColor: 'text-amber-400'
        };
      case 'affordable_later':
        return {
          label: 'Affordable Later',
          badgeBg: 'bg-cyan-950/60 border-cyan-500/40 text-cyan-400',
          cardBorder: 'border-cyan-500/40',
          icon: <Clock className="w-6 h-6 text-cyan-400 shrink-0" />,
          summaryColor: 'text-cyan-400'
        };
      default:
        return {
          label: 'Not Affordable',
          badgeBg: 'bg-rose-950/60 border-rose-500/40 text-rose-400',
          cardBorder: 'border-rose-500/40',
          icon: <XCircle className="w-6 h-6 text-rose-400 shrink-0" />,
          summaryColor: 'text-rose-400'
        };
    }
  };

  const statusConfig = currentResult ? getStatusConfig(currentResult.affordability_status) : getStatusConfig('affordable_now');

  // Parse spending changes
  const parseSpendingChanges = (raw: string): string[] => {
    if (!raw || raw.trim() === '' || raw.trim() === 'none') {
      return ['No spending changes required'];
    }
    const items = raw.split('|');
    const parsed: string[] = [];
    for (const item of items) {
      const trimmed = item.trim();
      if (trimmed.startsWith('stop:')) {
        const evtId = trimmed.replace('stop:', '');
        parsed.push(`Stop recurring subscription (${evtId})`);
      } else if (trimmed.startsWith('reduce_to:')) {
        const parts = trimmed.split(':');
        if (parts.length >= 3) {
          parsed.push(`Reduce flexible expense (${parts[1]}) to ${formatCurrency(Number(parts[2]), currency)}`);
        } else {
          parsed.push(`Reduce spending on ${trimmed}`);
        }
      } else if (trimmed !== 'none') {
        parsed.push(trimmed);
      }
    }
    return parsed.length > 0 ? parsed.slice(0, 3) : ['No spending changes required'];
  };

  const spendingChangesList = currentResult ? parseSpendingChanges(currentResult.spending_changes_needed) : ['No spending changes required'];

  // Calculate formula components for 90-day horizon
  const totalIncome90 = simulationDays.reduce((sum, d) => sum + d.income, 0);
  const totalObligations90 = simulationDays.reduce((sum, d) => sum + d.pending_debits + d.essential_expenses, 0);
  const totalFlexible90 = simulationDays.reduce((sum, d) => sum + d.flexible_expenses, 0);
  const projectedEndBalance = simulationDays.length > 0 ? simulationDays[simulationDays.length - 1].ending_balance : profile.current_available_balance;

  // Filter chronological timeline events (sorted by date)
  const sortedTimelineEvents = [...events]
    .filter(e => e.event_date >= currentSample.request_date)
    .sort((a, b) => a.event_date.localeCompare(b.event_date))
    .slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-10 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* 1. TOP NAVIGATION */}
      <nav className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-400 p-0.5 flex items-center justify-center">
            <div className="w-full h-full rounded-[calc(1rem-0.125rem)] bg-slate-950 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <span className="font-display font-extrabold text-lg text-white tracking-tight">Buy or Wait?</span>
            <span className="text-[10px] text-slate-400 block -mt-1 font-medium">Financial Intelligence System</span>
          </div>
        </div>

        {/* Minimal Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-950/80 border border-white/5">
          {[
            { key: 'dashboard', label: 'Dashboard', icon: <Activity className="w-3.5 h-3.5" /> },
            { key: 'analysis', label: 'Purchase Analysis', icon: <FileText className="w-3.5 h-3.5" /> },
            { key: 'transactions', label: 'Transactions', icon: <List className="w-3.5 h-3.5" /> },
            { key: 'requests', label: 'Requests', icon: <CreditCard className="w-3.5 h-3.5" /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveNavTab(tab.key as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                activeNavTab === tab.key
                  ? 'bg-slate-800 text-white border border-white/10 shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* User Profile Area */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/60 border border-white/10 text-xs">
            <UserIcon className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-200">{profile.user_name || `User ${profile.user_id}`}</span>
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold">
              {currency}
            </span>
          </div>
        </div>
      </nav>

      {/* 2. HEADER */}
      <div className="space-y-2 border-b border-white/5 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Decision Evaluation Engine</span>
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
          Purchase Affordability Analysis
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-3xl leading-relaxed">
          Affordability is evaluated using projected future cash flow, guaranteed salary inflows, pending commitments, and safety reserve thresholds over a strict 90-day horizon — not just today's static balance.
        </p>
      </div>

      {/* BENCHMARK REQUEST SELECTOR */}
      <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
          <span>Select Benchmark Request Scenario:</span>
        </div>
        <select
          value={selectedSampleId}
          onChange={(e) => handleRequestChange(e.target.value)}
          className="w-full sm:w-auto bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          {SAMPLE_REQUESTS.map(req => (
            <option key={req.request_id} value={req.request_id}>
              {req.request_id}: {req.request_text.slice(0, 60)}... ({formatCurrency(Number(req.requested_amount), currency)})
            </option>
          ))}
        </select>
      </div>

      {/* 3. PURCHASE SUMMARY CARD & 4. PRIMARY DECISION CARD (Asymmetric 2-Column) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Section 3: Purchase Summary Card */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-900/60 border border-white/10 space-y-6 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Purchase Request Details
            </div>
            <h2 className="font-display font-bold text-2xl text-white leading-tight">
              {currentSample.request_text}
            </h2>
            <div className="mt-4 p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-center">
              <span className="text-xs text-indigo-300 font-medium block mb-1">Requested Purchase Amount</span>
              <span className="font-display font-extrabold text-3xl text-indigo-300">
                {formatCurrency(requestedAmount, currency)}
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Desired Completion Date</span>
              <span className="text-slate-200 font-semibold flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                {currentSample.desired_completion_date}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Current Available Balance</span>
              <span className="text-emerald-400 font-bold">
                {formatCurrency(profile.current_available_balance, currency)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Minimum Required Reserve</span>
              <span className="text-amber-400 font-bold">
                {formatCurrency(profile.minimum_balance_to_keep, currency)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Allows Partial Payments</span>
              <span className="text-slate-200 font-medium">
                {currentSample.allows_partial_payment ? 'Yes (Flexible)' : 'No (Full Payment Only)'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Primary Decision Card (Most Important Element!) */}
        <div className={`lg:col-span-7 p-6 rounded-3xl bg-slate-900/80 border ${statusConfig.cardBorder} space-y-6 flex flex-col justify-between relative overflow-hidden`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Primary Decision Recommendation
              </span>
              {isLiveApiConnected && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                  Python Engine Live
                </span>
              )}
            </div>

            {/* Decision Status Badge */}
            <div className={`p-4 rounded-2xl border ${statusConfig.badgeBg} flex items-center gap-4`}>
              {statusConfig.icon}
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold opacity-80 block">
                  Affordability Classification
                </span>
                <span className="font-display font-extrabold text-2xl text-white">
                  {statusConfig.label}
                </span>
              </div>
            </div>

            {/* Key Decision Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
                <span className="text-[11px] text-slate-400 block font-medium">Amount Safe to Pay Now</span>
                <span className="font-display font-bold text-xl text-emerald-400">
                  {formatCurrency(currentResult?.amount_safe_to_pay || 0, currency)}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
                <span className="text-[11px] text-slate-400 block font-medium">Recommended Method</span>
                <span className="font-display font-bold text-base text-indigo-300 capitalize">
                  {(currentResult?.recommended_payment_method || 'full_payment').replace('_', ' ')}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
                <span className="text-[11px] text-slate-400 block font-medium">Earliest Safe Full Date</span>
                <span className="font-display font-bold text-base text-cyan-300">
                  {currentResult?.earliest_date_for_full_payment || 'Not Safe in 90 Days'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 flex items-center gap-3">
            <Info className="w-5 h-5 text-indigo-400 shrink-0" />
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Core Affordability Principle:</strong> Purchases are safe only if projected daily balance never breaches the <strong>{formatCurrency(profile.minimum_balance_to_keep, currency)}</strong> safety reserve over the next 90 days.
            </p>
          </div>
        </div>

      </div>

      {/* 5. "WHY THIS DECISION?" SECTION */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 space-y-6">
        <div>
          <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            Mathematical Rationale
          </div>
          <h3 className="font-display font-bold text-2xl text-white">
            Why Was This Decision Made?
          </h3>
        </div>

        {/* 90-Day Cashflow Formula Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/5 space-y-4">
          <div className="text-xs font-semibold text-slate-300">
            90-Day Projected Cashflow Accounting Formula:
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
              <span className="text-slate-400 block mb-1">Available Balance</span>
              <span className="font-bold text-emerald-400">{formatCurrency(profile.current_available_balance, currency)}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
              <span className="text-slate-400 block mb-1">+ Future Income</span>
              <span className="font-bold text-emerald-400">+{formatCurrency(totalIncome90, currency)}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
              <span className="text-slate-400 block mb-1">- Obligations & Bills</span>
              <span className="font-bold text-rose-400">-{formatCurrency(totalObligations90, currency)}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
              <span className="text-slate-400 block mb-1">- Flexible Spend</span>
              <span className="font-bold text-amber-400">-{formatCurrency(totalFlexible90, currency)}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
              <span className="text-slate-400 block mb-1">- Purchase Payment</span>
              <span className="font-bold text-indigo-300">-{formatCurrency(requestedAmount, currency)}</span>
            </div>

            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30">
              <span className="text-indigo-300 block mb-1">= Projected End</span>
              <span className="font-bold text-white">{formatCurrency(projectedEndBalance, currency)}</span>
            </div>
          </div>
        </div>

        {/* Backend Decision Explanation Text */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
          <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Python Decision Engine Justification</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">
            {currentResult?.decision_explanation || 'Loading decision rationale...'}
          </p>
        </div>
      </div>

      {/* 6. 90-DAY CASH FLOW CHART */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
              Deterministic Simulation
            </div>
            <h3 className="font-display font-bold text-2xl text-white">
              90-Day Projected Cash Flow Curve
            </h3>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 rounded-full bg-indigo-500" />
              <span className="text-slate-300">Projected Balance</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 rounded-full bg-amber-400" />
              <span className="text-slate-300">Min Reserve Threshold</span>
            </div>
          </div>
        </div>

        {/* Chart Visualizer */}
        <div className="p-6 rounded-2xl bg-slate-950/80 border border-white/5 space-y-4">
          <div className="h-56 w-full flex items-end gap-1 pt-6 border-b border-white/10 pb-2 relative">
            {/* Horizontal Minimum Reserve Alert Line */}
            <div className="absolute inset-x-0 bottom-16 border-b border-dashed border-amber-500/50 pointer-events-none flex justify-end">
              <span className="text-[10px] text-amber-400 font-bold bg-slate-950 px-2 -mb-2.5">
                Reserve Target: {formatCurrency(profile.minimum_balance_to_keep, currency)}
              </span>
            </div>

            {simulationDays.length > 0 ? (
              simulationDays.map((day) => {
                const maxVal = Math.max(...simulationDays.map(d => d.ending_balance), profile.minimum_balance_to_keep * 2, 1000);
                const heightPct = Math.min(100, Math.max(10, (day.ending_balance / maxVal) * 100));
                const isSafe = day.is_safe;

                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-30 p-2 rounded-xl bg-slate-900 border border-white/20 text-[10px] text-slate-200 whitespace-nowrap shadow-xl">
                      <div className="font-bold text-white">{day.date}</div>
                      <div>Balance: {formatCurrency(day.ending_balance, currency)}</div>
                      {day.income > 0 && <div className="text-emerald-400">+ Income: {formatCurrency(day.income, currency)}</div>}
                      {day.essential_expenses > 0 && <div className="text-rose-400">- Expense: {formatCurrency(day.essential_expenses, currency)}</div>}
                    </div>

                    <div
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        isSafe ? 'bg-indigo-500/60 group-hover:bg-indigo-400' : 'bg-rose-500/80 group-hover:bg-rose-400'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                );
              })
            ) : (
              <div className="w-full text-center text-slate-500 text-sm py-20">
                Loading 90-day cashflow simulation curve...
              </div>
            )}
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>Day 1 ({currentSample.request_date})</span>
            <span>Day 45</span>
            <span>Day 90 ({simulationDays.length > 0 ? simulationDays[simulationDays.length - 1].date : 'Completion'})</span>
          </div>
        </div>
      </div>

      {/* 7. PAYMENT OPTIONS */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 space-y-6">
        <div>
          <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            Financing Options Comparison
          </div>
          <h3 className="font-display font-bold text-2xl text-white">
            Available Payment Strategies
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {paymentOptions.map((opt) => {
            const isRecommended = (currentResult?.recommended_payment_method || 'full_payment') === opt.payment_method;
            return (
              <div
                key={opt.payment_option_id}
                className={`p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-5 ${
                  isRecommended
                    ? 'bg-gradient-to-b from-indigo-950/50 to-slate-900 border-indigo-500/60 shadow-xl shadow-indigo-950/40 ring-1 ring-indigo-500/30'
                    : 'bg-slate-950/60 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {opt.payment_method.replace('_', ' ')}
                    </span>
                    {isRecommended && (
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold">
                        RECOMMENDED
                      </span>
                    )}
                  </div>

                  <div className="font-display font-extrabold text-2xl text-white">
                    {formatCurrency(Number(opt.payment_amount), currency)}
                    {opt.number_of_payments > 1 && (
                      <span className="text-xs text-slate-400 font-normal"> / payment</span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400">
                    {opt.number_of_payments} payment term(s) starting on {opt.first_payment_date}.
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-white/5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Payable:</span>
                    <span className="text-slate-200 font-semibold">{formatCurrency(Number(opt.total_payable_amount), currency)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Financing Fee:</span>
                    <span className="text-slate-200 font-semibold">{formatCurrency(Number(opt.financing_fee), currency)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Feasibility:</span>
                    <span className={`font-bold ${isRecommended ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {isRecommended ? 'Feasible & Safe' : 'Evaluated'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 8. SPENDING CHANGES & 9. FINANCIAL TIMELINE (Asymmetric 2-Column) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Section 8: Spending Changes (Max 3) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-900/60 border border-white/10 space-y-6">
          <div>
            <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
              Required Budget Adjustments
            </div>
            <h3 className="font-display font-bold text-2xl text-white">
              Recommended Spending Changes
            </h3>
          </div>

          <div className="space-y-3">
            {spendingChangesList.map((change, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center gap-3 text-xs text-slate-200"
              >
                <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span>{change}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 9: Financial Timeline */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-900/60 border border-white/10 space-y-6">
          <div>
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              Upcoming Cash Events
            </div>
            <h3 className="font-display font-bold text-2xl text-white">
              90-Day Financial Timeline
            </h3>
          </div>

          <div className="space-y-3">
            {sortedTimelineEvents.map((evt) => {
              const isCredit = evt.direction === 'credit';
              return (
                <div
                  key={evt.event_id}
                  className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isCredit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {isCredit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{evt.description}</div>
                      <div className="text-[10px] text-slate-400">{evt.event_date} • {evt.category}</div>
                    </div>
                  </div>

                  <div className={`font-bold ${isCredit ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {isCredit ? '+' : '-'}{formatCurrency(evt.amount, currency)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 10. DECISION SUMMARY (Compact Bottom Summary Bar) */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Executive Decision Summary</span>
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="font-display font-extrabold text-xl text-white">Purchase Status:</span>
            <span className={`font-display font-extrabold text-xl ${statusConfig.summaryColor}`}>
              {statusConfig.label}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-slate-300">
          <div>
            <span className="text-slate-400 block text-[10px]">Safe Amount Today:</span>
            <span className="font-bold text-emerald-400 text-sm">
              {formatCurrency(currentResult?.amount_safe_to_pay || 0, currency)}
            </span>
          </div>

          <div className="h-6 w-px bg-white/10 hidden sm:block" />

          <div>
            <span className="text-slate-400 block text-[10px]">Recommended Method:</span>
            <span className="font-bold text-indigo-300 text-sm capitalize">
              {(currentResult?.recommended_payment_method || 'full_payment').replace('_', ' ')}
            </span>
          </div>

          <div className="h-6 w-px bg-white/10 hidden sm:block" />

          <div>
            <span className="text-slate-400 block text-[10px]">Earliest Safe Date:</span>
            <span className="font-bold text-cyan-300 text-sm">
              {currentResult?.earliest_date_for_full_payment || 'N/A'}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
