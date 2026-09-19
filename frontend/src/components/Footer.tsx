import React from 'react';
import { Scale } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-white/10 bg-slate-950 py-12 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-400">
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Scale className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <span className="font-display font-bold text-sm text-white">Buy or Wait?</span>
            <p className="text-[11px] text-slate-500">AI Financial Affordability & 90-Day Simulator Platform</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <span className="px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-slate-300">Vite 6</span>
          <span className="px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-slate-300">React 19</span>
          <span className="px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-slate-300">Tailwind v4</span>
          <span className="px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-slate-300">Chart.js</span>
          <span className="px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-slate-300">Firebase Firestore</span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <span>Engineered with precision for AI Financial Decisioning</span>
        </div>

      </div>
    </footer>
  );
};
