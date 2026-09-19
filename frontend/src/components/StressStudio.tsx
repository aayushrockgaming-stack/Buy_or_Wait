import React, { useState } from 'react';
import type { FinancialProfile, FinancialEvent } from '../types';
import { Sliders, Zap } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

interface StressStudioProps {
  profile: FinancialProfile;
  events: FinancialEvent[];
  onApplyStress: (salaryDelayDays: number, emergencyAmt: number, stoppedEvtIds: string[]) => void;
}

export const StressStudio: React.FC<StressStudioProps> = ({ profile, events, onApplyStress }) => {
  const [salaryDelayDays, setSalaryDelayDays] = useState<number>(0);
  const [emergencyAmt, setEmergencyAmt] = useState<number>(0);
  const [stoppedEvts, setStoppedEvts] = useState<Set<string>>(new Set());

  const userEvents = events.filter(e => e.user_id === profile.user_id);
  const flexEvents = userEvents.filter(e => e.flexibility === 'flexible');

  const toggleStopEvent = (evtId: string) => {
    const next = new Set(stoppedEvts);
    if (next.has(evtId)) {
      next.delete(evtId);
    } else {
      next.add(evtId);
    }
    setStoppedEvts(next);
    onApplyStress(salaryDelayDays, emergencyAmt, Array.from(next));
  };

  const handleSalarySliderChange = (days: number) => {
    setSalaryDelayDays(days);
    onApplyStress(days, emergencyAmt, Array.from(stoppedEvts));
  };

  const handleEmergencySliderChange = (amt: number) => {
    setEmergencyAmt(amt);
    onApplyStress(salaryDelayDays, amt, Array.from(stoppedEvts));
  };

  const totalMonthlyFlexSavings = flexEvents
    .filter(e => stoppedEvts.has(e.event_id))
    .reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="ring-1 ring-white/10 p-2 rounded-[2rem] bg-slate-950/80 backdrop-blur-2xl">
      <div className="p-6 rounded-[calc(2rem-0.5rem)] bg-slate-900/90 border border-white/10 bezel-inset space-y-6">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-rose-500/20 border border-amber-500/30 flex items-center justify-center">
              <Sliders className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-xl text-white">90-Day "What-If" Stress Studio</h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
                  Scenario Simulator
                </span>
              </div>
              <p className="text-xs text-slate-400">Test how your financial recommendation holds up under income delays or sudden emergencies.</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Monthly Flex Savings Unlocked</span>
            <span className="font-display font-bold text-lg text-emerald-400">
              {formatCurrency(totalMonthlyFlexSavings, profile.home_currency)} / mo
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Slider 1: Income / Salary Delay */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Salary Settlement Delay</span>
              <span className="font-display font-bold text-xs text-amber-400">{salaryDelayDays} Days</span>
            </div>

            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={salaryDelayDays}
              onChange={(e) => handleSalarySliderChange(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-slate-500">
              <span>On Time (0d)</span>
              <span>15 Days</span>
              <span>30 Days</span>
            </div>
          </div>

          {/* Slider 2: Emergency Expense Injection */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Sudden Emergency Bill</span>
              <span className="font-display font-bold text-xs text-rose-400">
                {formatCurrency(emergencyAmt, profile.home_currency)}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="2000"
              step="50"
              value={emergencyAmt}
              onChange={(e) => handleEmergencySliderChange(Number(e.target.value))}
              className="w-full accent-rose-400 cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-slate-500">
              <span>{formatCurrency(0, profile.home_currency)}</span>
              <span>{formatCurrency(1000, profile.home_currency)}</span>
              <span>{formatCurrency(2000, profile.home_currency)}</span>
            </div>
          </div>

          {/* Flexible Expense Cut Toggles */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Toggle Spending Cuts</span>
            </div>

            {flexEvents.length === 0 ? (
              <p className="text-xs text-slate-500">No flexible categories in profile.</p>
            ) : (
              <div className="space-y-2">
                {flexEvents.map(evt => {
                  const isStopped = stoppedEvts.has(evt.event_id);
                  return (
                    <div
                      key={evt.event_id}
                      onClick={() => toggleStopEvent(evt.event_id)}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs border transition-all cursor-pointer ${
                        isStopped
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-slate-900 border-white/5 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="truncate">{evt.description}</span>
                      <span className="font-bold font-display ml-2">
                        {isStopped ? 'PAUSED' : formatCurrency(Number(evt.amount), evt.currency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
