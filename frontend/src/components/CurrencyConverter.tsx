import React, { useState } from 'react';
import { ArrowLeftRight, Coins } from 'lucide-react';
import { convertCurrency, formatCurrency, CURRENCY_SYMBOLS } from '../utils/currency';

interface CurrencyConverterProps {
  initialAmount?: number;
  initialFromCurrency?: string;
}

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  initialAmount = 1000,
  initialFromCurrency = 'USD'
}) => {
  const [amount, setAmount] = useState<number>(initialAmount);
  const [fromCurr, setFromCurr] = useState<string>(initialFromCurrency);
  const [toCurr, setToCurr] = useState<string>('EUR');

  const converted = convertCurrency(amount, fromCurr, toCurr);
  const rate = convertCurrency(1, fromCurr, toCurr);

  const currencies = ['USD', 'EUR', 'GBP', 'INR', 'ZAR', 'IDR'];

  const handleSwap = () => {
    const temp = fromCurr;
    setFromCurr(toCurr);
    setToCurr(temp);
  };

  return (
    <div className="ring-1 ring-white/10 p-2 rounded-[2rem] bg-slate-950/80 backdrop-blur-2xl">
      <div className="p-6 rounded-[calc(2rem-0.5rem)] bg-slate-900/90 border border-white/10 bezel-inset space-y-6">
        
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Coins className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-white">Live Multi-Currency FX Converter</h3>
              <p className="text-xs text-slate-400">Convert foreign financial requests to your account home currency using dated exchange rates.</p>
            </div>
          </div>

          <div className="text-right text-xs text-slate-400">
            <span>Exchange Rate:</span>
            <span className="font-display font-bold text-cyan-300 block">1 {fromCurr} = {rate} {toCurr}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
          
          <div className="md:col-span-3 space-y-2 p-4 rounded-2xl bg-slate-950/60 border border-white/5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Amount to Convert
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-transparent text-xl font-display font-bold text-white focus:outline-none"
              />
              <select
                value={fromCurr}
                onChange={(e) => setFromCurr(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                {currencies.map(c => (
                  <option key={c} value={c}>{c} ({CURRENCY_SYMBOLS[c]})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="md:col-span-1 flex justify-center">
            <button
              onClick={handleSwap}
              className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 border border-white/10 flex items-center justify-center text-indigo-400 transition-transform active:scale-90 cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          <div className="md:col-span-3 space-y-2 p-4 rounded-2xl bg-slate-950/60 border border-white/5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Converted Equivalent
            </label>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xl font-display font-bold text-emerald-400">
                {formatCurrency(converted, toCurr)}
              </span>
              <select
                value={toCurr}
                onChange={(e) => setToCurr(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                {currencies.map(c => (
                  <option key={c} value={c}>{c} ({CURRENCY_SYMBOLS[c]})</option>
                ))}
              </select>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
