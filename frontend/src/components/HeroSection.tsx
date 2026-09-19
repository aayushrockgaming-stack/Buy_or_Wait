import React from 'react';
import { ShieldCheck, Calendar, Sparkles, TrendingUp, DollarSign } from 'lucide-react';
import type { FinancialProfile } from '../types';
import { formatCurrency } from '../utils/currency';

interface HeroSectionProps {
  profile: FinancialProfile;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ profile }) => {
  const availableBuffer = Math.max(0, profile.current_available_balance - profile.minimum_balance_to_keep);

  return (
    <section className="relative py-16 md:py-20 px-4 max-w-7xl mx-auto overflow-hidden">
      {/* Background Ambient Mesh Light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-indigo-600/25 via-purple-600/20 to-cyan-400/20 blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute top-0 right-10 w-[300px] h-[300px] bg-purple-600/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-10 w-[300px] h-[300px] bg-cyan-600/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="relative text-center max-w-5xl mx-auto space-y-8">
        
        {/* Eyebrow Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-slate-900/90 to-indigo-950/80 border border-white/10 text-[11px] uppercase tracking-[0.2em] font-semibold text-indigo-300 shadow-xl backdrop-blur-xl">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Autonomous 90-Day Financial Forecast Engine</span>
        </div>

        {/* Main H1 Headline */}
        <h1 className="font-display font-extrabold text-4xl sm:text-6xl md:text-7xl tracking-tight text-white leading-[1.08]">
          Can I afford this today, <br className="hidden sm:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400">
            or should I wait?
          </span>
        </h1>

        {/* Subtitle Paragraph */}
        <p className="text-slate-400 text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-normal">
          Beyond simple balance checks. Our AI financial agent evaluates recurring salary streams, pending debits, minimum safety reserves, flexible spending, and provider installment plans across a strict 90-day horizon.
        </p>

        {/* Double-Bezel Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left pt-4">
          
          {/* Card 1: Available Balance */}
          <div className="p-1 rounded-[2rem] bg-white/5 border border-white/10 ring-1 ring-white/5 backdrop-blur-xl group hover:border-emerald-500/40 transition-all duration-500">
            <div className="p-5 rounded-[calc(2rem-0.25rem)] bg-slate-900/90 border border-white/10 bezel-inset space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-medium">Available Balance</span>
                <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>
              <div className="font-display text-2xl font-extrabold text-emerald-400">
                {formatCurrency(profile.current_available_balance, profile.home_currency)}
              </div>
              <div className="text-[10px] text-slate-400">Liquid cash in connected accounts</div>
            </div>
          </div>

          {/* Card 2: Minimum Safety Reserve */}
          <div className="p-1 rounded-[2rem] bg-white/5 border border-white/10 ring-1 ring-white/5 backdrop-blur-xl group hover:border-amber-500/40 transition-all duration-500">
            <div className="p-5 rounded-[calc(2rem-0.25rem)] bg-slate-900/90 border border-white/10 bezel-inset space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-medium">Safety Reserve Limit</span>
                <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                </div>
              </div>
              <div className="font-display text-2xl font-extrabold text-amber-400">
                {formatCurrency(profile.minimum_balance_to_keep, profile.home_currency)}
              </div>
              <div className="text-[10px] text-slate-400">Protected non-touchable threshold</div>
            </div>
          </div>

          {/* Card 3: Free Liquid Buffer */}
          <div className="p-1 rounded-[2rem] bg-white/5 border border-white/10 ring-1 ring-white/5 backdrop-blur-xl group hover:border-cyan-500/40 transition-all duration-500">
            <div className="p-5 rounded-[calc(2rem-0.25rem)] bg-slate-900/90 border border-white/10 bezel-inset space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-medium">Free Liquid Buffer</span>
                <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                </div>
              </div>
              <div className="font-display text-2xl font-extrabold text-cyan-300">
                {formatCurrency(availableBuffer, profile.home_currency)}
              </div>
              <div className="text-[10px] text-slate-400">Discretionary headroom available</div>
            </div>
          </div>

          {/* Card 4: Simulation Horizon */}
          <div className="p-1 rounded-[2rem] bg-white/5 border border-white/10 ring-1 ring-white/5 backdrop-blur-xl group hover:border-indigo-500/40 transition-all duration-500">
            <div className="p-5 rounded-[calc(2rem-0.25rem)] bg-slate-900/90 border border-white/10 bezel-inset space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-medium">Safety Horizon</span>
                <div className="w-7 h-7 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                </div>
              </div>
              <div className="font-display text-2xl font-extrabold text-indigo-300 flex items-center gap-1.5">
                <span>90 Days</span>
              </div>
              <div className="text-[10px] text-slate-400">Daily balance cashflow simulation</div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
