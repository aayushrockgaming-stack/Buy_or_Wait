import React, { useState } from 'react';
import type { FinancialProfile, FinancialEvent } from '../types';
import { Wallet, Search, ArrowUpRight, ArrowDownLeft, RefreshCw, Lock, Unlock } from 'lucide-react';

interface LedgerWorkbenchProps {
  profile: FinancialProfile;
  events: FinancialEvent[];
}

export const LedgerWorkbench: React.FC<LedgerWorkbenchProps> = ({ profile, events }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const userEvents = events.filter(e => e.user_id === profile.user_id);

  const filteredEvents = userEvents.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.category.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterType === 'recurring') return matchesSearch && e.is_recurring;
    if (filterType === 'pending') return matchesSearch && e.status === 'pending';
    if (filterType === 'credit') return matchesSearch && e.direction === 'credit';
    if (filterType === 'debit') return matchesSearch && e.direction === 'debit';
    return matchesSearch;
  });

  return (
    <section className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      <div className="ring-1 ring-white/10 p-2 rounded-[2rem] bg-slate-950/70 backdrop-blur-2xl">
        <div className="p-6 rounded-[calc(2rem-0.5rem)] bg-slate-900/90 border border-white/10 bezel-inset space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-white">Financial Profile & Reserve Rules</h3>
                <p className="text-xs text-slate-400">User: {profile.user_name} • Home Currency: {profile.home_currency}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase text-slate-400 font-semibold block">Available Cash</span>
                <span className="font-display font-extrabold text-xl text-emerald-400">
                  {profile.home_currency} {profile.current_available_balance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <Lock className="w-4 h-4 text-rose-400" />
                <span>Protected Essential Categories (Non-Modifiable)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.protected_spending_categories.map(cat => (
                  <span key={cat} className="px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <Unlock className="w-4 h-4 text-emerald-400" />
                <span>Flexible Adjustable Categories (Can Reduce/Stop)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.adjustable_spending_categories.map(cat => (
                  <span key={cat} className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
                    {cat}
                  </span>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

      <div className="ring-1 ring-white/10 p-2 rounded-[2rem] bg-slate-950/70 backdrop-blur-2xl">
        <div className="p-6 rounded-[calc(2rem-0.5rem)] bg-slate-900/90 border border-white/10 bezel-inset space-y-4">
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-xl text-white">Financial Events & Stream Ledger</h3>
              <p className="text-xs text-slate-400">Reconstructed timeline of income, recurring bills, and pending debits.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search ledger..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-950/80 border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-950/80 border border-white/10 rounded-full px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">All Events</option>
                <option value="recurring">Recurring Streams</option>
                <option value="pending">Pending</option>
                <option value="credit">Income Only</option>
                <option value="debit">Expenses Only</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Event Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Direction</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Flexibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-slate-900/50">
                {filteredEvents.map(evt => (
                  <tr key={evt.event_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-200 flex items-center gap-2">
                      {evt.direction === 'credit' ? (
                        <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4 text-rose-400" />
                      )}
                      <div>
                        <div>{evt.description}</div>
                        {evt.is_recurring && (
                          <span className="text-[10px] text-indigo-400 flex items-center gap-1 mt-0.5">
                            <RefreshCw className="w-2.5 h-2.5" /> Recurring ({evt.frequency_days}d)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                        {evt.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 capitalize font-semibold">
                      <span className={evt.direction === 'credit' ? 'text-emerald-400' : 'text-rose-400'}>
                        {evt.direction}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-display font-bold text-sm text-white">
                      {evt.currency} {evt.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{evt.event_date}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-semibold capitalize text-[10px] ${
                        evt.status === 'settled' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        evt.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {evt.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {evt.flexibility ? (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize ${
                          evt.flexibility === 'flexible' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
                        }`}>
                          {evt.flexibility}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>

    </section>
  );
};
