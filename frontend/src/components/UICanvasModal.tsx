import React from 'react';
import { X, Palette, Sparkles, ExternalLink, Box, RefreshCw } from 'lucide-react';

interface UICanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UICanvasModal: React.FC<UICanvasModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-6xl bg-slate-950 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 via-emerald-600 to-indigo-500 p-0.5 flex items-center justify-center">
              <div className="w-full h-full rounded-[calc(1rem-0.125rem)] bg-slate-950 flex items-center justify-center">
                <Palette className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-xl text-white">UICanvas Design Preview & Artboard Studio</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Server 3200
                </span>
              </div>
              <p className="text-xs text-slate-400">Developer infinite UI preview canvas, artboard renderer, and component library</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="http://localhost:3200"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-full bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <span>Launch Full Canvas</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Embedded UICanvas Frame */}
        <div className="relative rounded-2xl border border-white/10 overflow-hidden bg-slate-900 h-[500px] shadow-2xl">
          <iframe
            src="http://localhost:3200"
            title="UICanvas Live Studio"
            className="w-full h-full border-0"
          />
        </div>

        {/* UICanvas Features & Component Library Specs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
              <Box className="w-4 h-4" />
              <span>Built-in Component Gallery</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pre-built iOS (Apple HIG) and Web (Shadcn/Vercel-style) components including Stat Cards, Segmented Controls, and List Groups.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Real-Time MCP Bridge</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Connects AI agents directly via MCP stdio (<code className="text-emerald-300">node server.js --stdio</code>) to construct artboards and query DOM trees.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <RefreshCw className="w-4 h-4" />
              <span>Design System Alignment</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Automatically syncs design tokens, color swatches, typography scales, and spacing rules across canvas artboards.
            </p>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close UICanvas Studio
          </button>
        </div>

      </div>
    </div>
  );
};
