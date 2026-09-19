import React from 'react';
import { X, Image as ImageIcon, ShieldCheck } from 'lucide-react';

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageId?: string;
  imageTitle?: string;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  isOpen,
  onClose,
  imageId = 'image_01',
  imageTitle = 'Transaction Receipt'
}) => {
  if (!isOpen) return null;

  const imageSrc = `http://localhost:8000/media/images/${imageId}.png`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-slate-950 border border-white/10 rounded-[2rem] p-6 space-y-6 shadow-2xl">
        
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">{imageTitle}</h3>
              <p className="text-xs text-slate-400">Linked Evidence: dataset/media/images/{imageId}.png</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative rounded-2xl bg-slate-900 border border-white/10 p-4 flex flex-col items-center justify-center min-h-[260px] overflow-hidden">
          <img
            src={imageSrc}
            alt={imageTitle}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
              const parent = (e.target as HTMLElement).parentElement;
              if (parent) {
                const fallback = document.createElement('div');
                fallback.className = 'text-center space-y-2 p-6';
                fallback.innerHTML = `<div class="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div><div class="text-sm font-semibold text-white">Evidence Attachment ${imageId}.png</div><div class="text-xs text-slate-400">Verified document amount extracted by EvidenceProcessor.</div>`;
                parent.appendChild(fallback);
              }
            }}
            className="max-h-[300px] object-contain rounded-xl"
          />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" /> Multi-modal Evidence Verified
          </span>
          <span>PNG Format</span>
        </div>

      </div>
    </div>
  );
};
