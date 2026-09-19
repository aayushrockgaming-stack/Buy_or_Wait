import React from 'react';
import { X, Layout, Sparkles, Palette, Layers, Sliders } from 'lucide-react';

interface FigmaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FigmaModal: React.FC<FigmaModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl bg-slate-950 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-indigo-500 p-0.5 flex items-center justify-center">
              <div className="w-full h-full rounded-[calc(1rem-0.125rem)] bg-slate-950 flex items-center justify-center">
                <Layout className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-xl text-white">Figma High-Fidelity UI Design Comps</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-semibold">
                  System Architecture
                </span>
              </div>
              <p className="text-xs text-slate-400">Visual design specifications, token scale, and layout structure</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Generated Figma UI Image Comp */}
        <div className="relative rounded-2xl border border-white/10 overflow-hidden shadow-2xl group">
          <img
            src="/figma_design_comp.jpg"
            alt="Figma UI Design Comp"
            className="w-full h-auto object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
            <span className="text-xs text-slate-200 font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Rendered High-Fidelity Figma Spec Board (16:9 4K resolution)
            </span>
          </div>
        </div>

        {/* Figma Design System Tokens */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
              <Palette className="w-4 h-4" />
              <span>Color System Tokens</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              OLED dark theme (<code className="text-indigo-300">#030305</code>), HSL emerald green for safe statuses, amber warning for threshold alerts, cyan for timeline events, and indigo accent gradients.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              <span>Doppelrand Architecture</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Double-bezel outer shell containers (<code className="text-cyan-300">rounded-[2.5rem] bg-white/5</code>) enclosing inner hairline inset cards (<code className="text-cyan-300">bezel-inset</code>).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <Sliders className="w-4 h-4" />
              <span>Taste Dial Configuration</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Enforces <code className="text-emerald-300">DESIGN_VARIANCE: 8</code>, <code className="text-emerald-300">MOTION_INTENSITY: 6</code>, and <code className="text-emerald-300">VISUAL_DENSITY: 4</code> for clean editorial rhythm.
            </p>
          </div>
        </div>

        {/* Close & Action Buttons */}
        <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
};
