import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  XCircle, 
  ArrowRight, 
  Sparkles, 
  Calendar as CalendarIcon, 
  SlidersHorizontal,
  BookmarkPlus,
  Cpu
} from 'lucide-react';
import type { FinancialProfile, FinancialEvent, RequestItem, RequestPaymentOption, EvaluationResult } from '../types';
import { SAMPLE_REQUESTS, SAMPLE_OPTIONS } from '../data/mockData';
import { evaluateRequestViaApi } from '../api/client';
import { formatCurrency, convertCurrency } from '../utils/currency';

interface RequestEvaluatorProps {
  profile: FinancialProfile;
  events: FinancialEvent[];
  onEvaluationComplete: (result: EvaluationResult, simulationDays: any[]) => void;
  onSaveToCloud: (result: EvaluationResult, requestTitle: string, amount: number) => void;
}

export const RequestEvaluator: React.FC<RequestEvaluatorProps> = ({
  profile,
  events,
  onEvaluationComplete,
  onSaveToCloud
}) => {
  const [selectedSampleId, setSelectedSampleId] = useState<string>('req_101');
  const [requestedAmount, setRequestedAmount] = useState<number>(1200);
  const [requestText, setRequestText] = useState<string>('Can I afford this M3 MacBook Air laptop for work and side projects?');
  const [requestType, setRequestType] = useState<string>('purchase');
  const [requestDate, setRequestDate] = useState<string>('2026-09-19');
  const [completionDate, setCompletionDate] = useState<string>('2026-11-15');
  const [allowsPartial, setAllowsPartial] = useState<boolean>(true);

  const [customOptions, setCustomOptions] = useState<RequestPaymentOption[]>(SAMPLE_OPTIONS['req_101'] || []);
  const [currentResult, setCurrentResult] = useState<EvaluationResult | null>(null);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSelectSample = (sampleId: string) => {
    setSelectedSampleId(sampleId);
    const sample = SAMPLE_REQUESTS.find(r => r.request_id === sampleId);
    if (sample) {
      const amtUSD = Number(sample.requested_amount);
      const convertedAmt = Math.round(convertCurrency(amtUSD, 'USD', profile.home_currency));
      setRequestedAmount(convertedAmt);
      setRequestText(sample.request_text);
      setRequestType(sample.request_type);
      setRequestDate(sample.request_date);
      setCompletionDate(sample.desired_completion_date);
      setAllowsPartial(sample.allows_partial_payment);
      setCustomOptions(SAMPLE_OPTIONS[sampleId] || [
        {
          request_id: sampleId,
          payment_option_id: `${sampleId}_full`,
          payment_method: 'full_payment',
          first_payment_date: sample.request_date,
          payment_frequency_days: 0,
          number_of_payments: 1,
          payment_amount: convertedAmt,
          financing_fee: 0,
          total_payable_amount: convertedAmt
        }
      ]);
    }
  };

  const runEvaluation = async () => {
    setLoading(true);
    const activeReq: RequestItem = {
      request_id: selectedSampleId || `req_custom_${Date.now()}`,
      user_id: profile.user_id,
      request_date: requestDate,
      request_type: requestType,
      requested_amount: requestedAmount,
      desired_completion_date: completionDate,
      allows_partial_payment: allowsPartial,
      request_text: requestText
    };

    const { result, simulation, isLiveApi: apiStatus } = await evaluateRequestViaApi(
      profile,
      events,
      activeReq,
      customOptions
    );

    setCurrentResult(result);
    setIsLiveApi(apiStatus);
    onEvaluationComplete(result, simulation);
    setLoading(false);
  };

  useEffect(() => {
    runEvaluation();
  }, [profile.user_id, selectedSampleId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'affordable_now':
        return {
          label: 'Affordable Now',
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 glow-emerald',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        };
      case 'affordable_with_plan':
        return {
          label: 'Affordable with Plan',
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30 glow-amber',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />
        };
      case 'affordable_later':
        return {
          label: 'Affordable Later',
          color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30 glow-cyan',
          icon: <Clock className="w-5 h-5 text-cyan-400" />
        };
      default:
        return {
          label: 'Not Affordable',
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/30 glow-rose',
          icon: <XCircle className="w-5 h-5 text-rose-400" />
        };
    }
  };

  const statusConfig = currentResult ? getStatusBadge(currentResult.affordability_status) : null;
  const safePercentage = Math.min(100, Math.max(0, (currentResult?.amount_safe_to_pay || 0) / (requestedAmount || 1) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* LEFT COLUMN: Request Input Form */}
      <div className="lg:col-span-5 space-y-6">
        
        <div className="p-1.5 rounded-[2.5rem] bg-white/5 border border-white/10 ring-1 ring-white/5 backdrop-blur-2xl">
          <div className="p-6 rounded-[calc(2.5rem-0.375rem)] bg-slate-900/90 border border-white/10 bezel-inset space-y-5">
            
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                <h3 className="font-display font-semibold text-lg text-white">Evaluate Request</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Profile: {profile.user_id} ({profile.home_currency})</span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Load Benchmark Scenario
              </label>
              <select
                value={selectedSampleId}
                onChange={(e) => handleSelectSample(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                {SAMPLE_REQUESTS.map(req => (
                  <option key={req.request_id} value={req.request_id}>
                    {req.request_text.slice(0, 50)}... ({formatCurrency(Number(req.requested_amount), profile.home_currency)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Purchase Item / Question Description
              </label>
              <textarea
                rows={2}
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                placeholder="Can I afford to purchase..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Amount ({profile.home_currency})
                </label>
                <input
                  type="number"
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(Number(e.target.value))}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Category
                </label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors capitalize cursor-pointer"
                >
                  {['purchase', 'travel', 'education', 'family_transfer', 'debt_repayment', 'housing', 'investment', 'emergency_expense'].map(t => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Request Date
                </label>
                <input
                  type="date"
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Completion Deadline
                </label>
                <input
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-xs text-slate-300 font-medium">Allows Partial Payment</span>
              <button
                type="button"
                onClick={() => setAllowsPartial(!allowsPartial)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${allowsPartial ? 'bg-indigo-600' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${allowsPartial ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <button
              onClick={runEvaluation}
              disabled={loading}
              className="group relative w-full flex items-center justify-between py-3.5 px-6 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all duration-500 active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <Sparkles className={`w-4 h-4 text-indigo-200 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Simulating 90 Days...' : 'Run Affordability Evaluation'}</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:translate-x-1">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            </button>

          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Evaluation Result Dashboard */}
      <div className="lg:col-span-7">
        
        {currentResult && statusConfig && (
          <div className="p-1.5 rounded-[2.5rem] bg-white/5 border border-white/10 ring-1 ring-white/5 backdrop-blur-2xl">
            <div className="p-6 rounded-[calc(2.5rem-0.375rem)] bg-slate-900/90 border border-white/10 bezel-inset space-y-6">
              
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Decision Recommendation</span>
                    {isLiveApi && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                        <Cpu className="w-3 h-3" /> FastAPI Live
                      </span>
                    )}
                  </div>
                  <h4 className="font-display font-bold text-2xl text-white">Affordability Analysis</h4>
                </div>

                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${statusConfig.color} font-bold text-sm shadow-lg`}>
                  {statusConfig.icon}
                  <span>{statusConfig.label}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Safe to Pay Immediately</span>
                  <span className="font-bold text-emerald-400 font-display text-sm">
                    {formatCurrency(currentResult.amount_safe_to_pay, profile.home_currency)} / {formatCurrency(requestedAmount, profile.home_currency)}
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500 transition-all duration-700"
                    style={{ width: `${safePercentage}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-left">
                
                <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1 font-semibold">Recommended Method</div>
                  <div className="font-display font-bold text-sm text-indigo-300 capitalize">
                    {currentResult.recommended_payment_method.replace('_', ' ')}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1 font-semibold">Earliest Safe Full Date</div>
                  <div className="font-display font-bold text-sm text-cyan-300">
                    {currentResult.earliest_date_for_full_payment || 'Not Safe in 90 Days'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5 col-span-2 sm:col-span-1">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1 font-semibold">Spending Adjustments</div>
                  <div className="font-display font-bold text-xs text-amber-300 truncate">
                    {currentResult.spending_changes_needed}
                  </div>
                </div>

              </div>

              {currentResult.payment_plan !== 'none' && (
                <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                  <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Recommended Payment Plan Schedule</div>
                  <div className="flex flex-wrap gap-2">
                    {currentResult.payment_plan.split('|').map((pmt, idx) => {
                      const [date, amt] = pmt.split(':');
                      return (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs">
                          <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-slate-300">{date}:</span>
                          <span className="font-bold text-white">{formatCurrency(Number(amt), profile.home_currency)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>AI Agent Decision Justification</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {currentResult.decision_explanation}
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => onSaveToCloud(currentResult, requestText, requestedAmount)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition-all active:scale-95 cursor-pointer shadow-lg"
                >
                  <BookmarkPlus className="w-4 h-4 text-emerald-400" />
                  <span>Save Decision to Firebase History</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
};
