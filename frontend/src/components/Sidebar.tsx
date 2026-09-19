import React from 'react';
import { 
  BarChart3, 
  SlidersHorizontal, 
  ShieldAlert, 
  Grid, 
  PiggyBank, 
  Zap, 
  DollarSign, 
  FileText, 
  Layout, 
  Palette,
  Cloud,
  ChevronRight,
  X,
  User as UserIcon,
  Server
} from 'lucide-react';
import type { FinancialProfile } from '../types';

export type TabType = 
  | 'dashboard' 
  | 'simulator' 
  | 'stress' 
  | 'matrix' 
  | 'planner' 
  | 'subscriptions' 
  | 'converter' 
  | 'ledger';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  currentProfile: FinancialProfile;
  profiles: Record<string, FinancialProfile>;
  onSelectProfile: (id: string) => void;
  onOpenFirebaseDrawer: () => void;
  onOpenFigmaModal: () => void;
  onOpenUICanvasModal: () => void;
  isLiveApiConnected: boolean;
  isOpenMobile: boolean;
  onToggleMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentProfile,
  profiles,
  onSelectProfile,
  onOpenFirebaseDrawer,
  onOpenFigmaModal,
  onOpenUICanvasModal,
  isLiveApiConnected,
  isOpenMobile,
  onToggleMobile
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Purchase Dashboard', icon: <BarChart3 className="w-4 h-4" />, category: 'Core Intelligence' },
    { id: 'simulator', label: 'Affordability Evaluator', icon: <SlidersHorizontal className="w-4 h-4" />, category: 'Core Intelligence' },
    { id: 'stress', label: '"What-If" Stress Studio', icon: <ShieldAlert className="w-4 h-4" />, category: 'Simulation & Stress' },
    { id: 'matrix', label: 'Payment Options Matrix', icon: <Grid className="w-4 h-4" />, category: 'Financing Strategy' },
    { id: 'planner', label: 'Target Savings Planner', icon: <PiggyBank className="w-4 h-4" />, category: 'Financing Strategy' },
    { id: 'subscriptions', label: 'Subscription Audit', icon: <Zap className="w-4 h-4" />, category: 'Buffer Optimization' },
    { id: 'converter', label: 'Multi-Currency FX', icon: <DollarSign className="w-4 h-4" />, category: 'Tools & Ledger' },
    { id: 'ledger', label: 'Profiles & Ledger', icon: <FileText className="w-4 h-4" />, category: 'Tools & Ledger' },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onToggleMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden animate-fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-72 bg-slate-950/95 border-r border-white/10 p-5 flex flex-col justify-between backdrop-blur-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Logo & App Title */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <div className="w-full h-full rounded-[calc(1rem-0.125rem)] bg-slate-950 flex items-center justify-center font-display font-extrabold text-indigo-400">
                  ⚖️
                </div>
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-white tracking-tight">Buy or Wait?</h2>
                <span className="text-[10px] text-slate-400 font-medium block">AI Financial Intelligence</span>
              </div>
            </div>

            <button
              onClick={onToggleMobile}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Profile Switcher */}
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <span>Active User Profile</span>
              <span className="text-emerald-400 font-extrabold">{currentProfile.home_currency}</span>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs">
              <UserIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <select
                value={currentProfile.user_id}
                onChange={(e) => onSelectProfile(e.target.value)}
                className="w-full bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
              >
                {Object.values(profiles).map((p) => (
                  <option key={p.user_id} value={p.user_id} className="bg-slate-900 text-slate-200">
                    {p.user_name || `User ${p.user_id}`} ({p.home_currency})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Navigation Items Grouped by Category */}
          <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
            {navItems.map((item, idx) => {
              const isSelected = activeTab === item.id;
              const showCategory = idx === 0 || navItems[idx - 1].category !== item.category;

              return (
                <div key={item.id} className="space-y-1">
                  {showCategory && (
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-2">
                      {item.category}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      onSelectTab(item.id as TabType);
                      if (isOpenMobile) onToggleMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {isSelected && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Utility Tools (Figma, UICanvas, Firebase) */}
        <div className="space-y-2 pt-4 border-t border-white/10">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
            Design & Cloud Tools
          </div>

          <button
            onClick={onOpenFigmaModal}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/20 text-purple-300 text-xs font-medium transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Layout className="w-3.5 h-3.5 text-purple-400" />
              <span>Figma Specs</span>
            </div>
            <span className="text-[10px] text-purple-400 font-mono">4K Comps</span>
          </button>

          <button
            onClick={onOpenUICanvasModal}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-500/20 text-cyan-300 text-xs font-medium transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              <span>UICanvas Studio</span>
            </div>
            <span className="text-[10px] text-cyan-400 font-mono">:3200</span>
          </button>

          <button
            onClick={onOpenFirebaseDrawer}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 text-xs font-medium transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Cloud className="w-3.5 h-3.5 text-indigo-400" />
              <span>Firebase Cloud</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">Auth/DB</span>
          </button>

          <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Server className="w-3 h-3 text-emerald-400" />
              <span>{isLiveApiConnected ? 'FastAPI Connected' : 'Engine Ready'}</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      </aside>
    </>
  );
};
