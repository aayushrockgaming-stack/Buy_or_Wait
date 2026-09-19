import React, { useState, useEffect } from 'react';
import { X, Cloud, LogIn, LogOut, History, CheckCircle2, HelpCircle, Server } from 'lucide-react';
import { auth, googleProvider, getEvaluationHistory } from '../firebase';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import type { SavedEvaluation } from '../types';

interface FirebaseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSaved: (evaluation: SavedEvaluation) => void;
}

export const FirebaseDrawer: React.FC<FirebaseDrawerProps> = ({ isOpen, onClose, onSelectSaved }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [history, setHistory] = useState<SavedEvaluation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeFaq, setActiveFaq] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        loadHistory(user.uid);
      } else {
        loadHistory('guest');
      }
    });
    return () => unsubscribe();
  }, []);

  const loadHistory = async (uid: string) => {
    setLoading(true);
    const data = await getEvaluationHistory(uid);
    setHistory(data);
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google Auth Error:', err);
    }
  };

  const handleLogout = async () => {
    await firebaseSignOut(auth);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md h-full bg-slate-950 border-l border-white/10 p-6 flex flex-col justify-between overflow-y-auto space-y-6">
        
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-indigo-400" />
              <h3 className="font-display font-bold text-lg text-white">Firebase & Backend Setup</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-3">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setActiveFaq(!activeFaq)}>
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>Is Firebase Needed with the Backend?</span>
              </div>
              <span className="text-slate-400 text-xs">{activeFaq ? '▲' : '▼'}</span>
            </div>

            {activeFaq && (
              <div className="text-xs text-slate-300 space-y-2 pt-2 border-t border-indigo-500/10 leading-relaxed">
                <p>
                  <strong className="text-white">No mandatory setup required!</strong> The application connects directly to the live Python FastAPI Backend Engine (<code className="text-emerald-400">http://localhost:8000</code>).
                </p>
                <p>
                  Firebase is an <strong className="text-indigo-300">optional 1-click cloud sync layer</strong> if you want Google Sign-In & multi-device cloud decision history across browsers.
                </p>
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Minimal Firebase Setup</span>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Auto-Fallback Ready
              </span>
            </div>

            <p className="text-xs text-slate-400">
              To activate live Google Login & Firestore, add these 2 lines to your <code className="text-slate-200 bg-slate-800 px-1 py-0.5 rounded">frontend/.env</code> file:
            </p>

            <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-300 border border-white/5 space-y-1 overflow-x-auto">
              <div>VITE_FIREBASE_API_KEY="your_api_key"</div>
              <div>VITE_FIREBASE_PROJECT_ID="your_project_id"</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Authentication</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                currentUser ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
              }`}>
                {currentUser ? 'Authenticated' : 'Guest / Local Mode'}
              </span>
            </div>

            {currentUser ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="Avatar" className="w-9 h-9 rounded-full ring-2 ring-indigo-500/30" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white">
                      {currentUser.displayName?.[0] || 'U'}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-white">{currentUser.displayName || 'Firebase User'}</div>
                    <div className="text-[10px] text-slate-400">{currentUser.email}</div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In with Google</span>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <History className="w-4 h-4 text-indigo-400" />
              <span>Saved Decision History</span>
            </div>

            {loading ? (
              <div className="text-xs text-slate-500 py-4 text-center">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 text-xs text-slate-400 text-center">
                No saved financial decisions yet. Evaluate any request and click "Save Decision to Firebase History".
              </div>
            ) : (
              <div className="space-y-2.5">
                {history.map(item => (
                  <div
                    key={item.id}
                    onClick={() => { onSelectSaved(item); onClose(); }}
                    className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 transition-colors cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white truncate max-w-[200px]">{item.requestTitle}</span>
                      <span className="font-display font-bold text-xs text-emerald-400">{item.currency} {item.requestedAmount}</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="capitalize text-indigo-300 font-medium">{item.result.affordability_status.replace('_', ' ')}</span>
                      <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 text-center text-[10px] text-slate-500 flex items-center justify-center gap-2">
          <Server className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real Python FastAPI Backend + Optional Firebase Sync</span>
        </div>

      </div>
    </div>
  );
};
