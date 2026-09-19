import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { SimulationDay, FinancialProfile } from '../types';
import { TrendingUp, ShieldAlert } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface CashflowChartProps {
  simulationDays: SimulationDay[];
  profile: FinancialProfile;
}

export const CashflowChart: React.FC<CashflowChartProps> = ({ simulationDays, profile }) => {
  if (!simulationDays || simulationDays.length === 0) return null;

  const sampledDays = simulationDays.filter((_, idx) => idx % 2 === 0);

  const labels = sampledDays.map(d => d.date.slice(5));
  const balanceData = sampledDays.map(d => d.ending_balance);
  const minReserveData = sampledDays.map(d => d.minimum_reserve);

  const isEverUnsafe = simulationDays.some(d => !d.is_safe);

  const data = {
    labels,
    datasets: [
      {
        label: 'Projected Ending Balance',
        data: balanceData,
        borderColor: isEverUnsafe ? '#f43f5e' : '#10b981',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          if (isEverUnsafe) {
            gradient.addColorStop(0, 'rgba(244, 63, 94, 0.35)');
            gradient.addColorStop(1, 'rgba(244, 63, 94, 0.0)');
          } else {
            gradient.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
            gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
          }
          return gradient;
        },
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 6,
        pointBackgroundColor: isEverUnsafe ? '#f43f5e' : '#10b981'
      },
      {
        label: `Minimum Reserve Threshold (${profile.home_currency} ${profile.minimum_balance_to_keep})`,
        data: minReserveData,
        borderColor: '#f59e0b',
        borderDash: [6, 6],
        borderWidth: 2,
        fill: false,
        pointRadius: 0
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#94a3b8',
          font: { family: 'Plus Jakarta Sans', size: 11 }
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${profile.home_currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#64748b',
          font: { size: 10 },
          callback: (value: any) => `${profile.home_currency} ${value.toLocaleString()}`
        }
      }
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="ring-1 ring-white/10 p-2 rounded-[2rem] bg-slate-950/70 backdrop-blur-2xl">
        <div className="p-6 rounded-[calc(2rem-0.5rem)] bg-slate-900/90 border border-white/10 bezel-inset space-y-4">
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="font-display font-bold text-xl text-white">90-Day Projected Cash Flow Curve</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Day-by-day account balance projection maintaining the minimum reserve threshold of {profile.home_currency} {profile.minimum_balance_to_keep.toLocaleString()}.
              </p>
            </div>

            {isEverUnsafe ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                <ShieldAlert className="w-4 h-4" />
                <span>Reserve Breach Detected in Horizon</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <span>100% Safe Balance Maintained</span>
              </div>
            )}
          </div>

          <div className="w-full h-[320px] pt-4">
            <Line data={data} options={options} />
          </div>

        </div>
      </div>
    </section>
  );
};
