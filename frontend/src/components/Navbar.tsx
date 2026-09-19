import React from 'react';
import { Menu, Scale, User as UserIcon } from 'lucide-react';
import type { FinancialProfile } from '../types';

interface NavbarProps {
  currentProfile: FinancialProfile;
  onToggleMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProfile,
  onToggleMobileSidebar
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 border-b border-white/10 backdrop-blur-xl px-4 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Left: Mobile Menu Toggle & App Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-400 p-0.5 flex items-center justify-center">
              <div className="w-full h-full rounded-[calc(0.75rem-0.125rem)] bg-slate-950 flex items-center justify-center">
                <Scale className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
            <div>
              <span className="font-display font-extrabold text-lg text-white tracking-tight">
                Buy or Wait?
              </span>
              <span className="text-[10px] text-slate-400 font-medium block lg:hidden">
                AI Financial Agent
              </span>
            </div>
          </div>
        </div>

        {/* Right: Clean Profile Status Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-white/10 text-xs text-slate-200">
            <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-white">{currentProfile.user_name || `User ${currentProfile.user_id}`}</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-[10px]">
              {currentProfile.home_currency}
            </span>
          </div>
        </div>

      </div>
    </header>
  );
};
