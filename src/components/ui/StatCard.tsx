import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  variant?: 'blue' | 'emerald' | 'purple' | 'amber' | 'rose' | 'cyan';
  badgeText?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  changeType = 'positive',
  icon: Icon,
  variant = 'blue',
  badgeText
}) => {
  const iconBgMap = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
  };

  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md hover:border-white/10 transition-all duration-200 group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
      
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${iconBgMap[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {badgeText && (
          <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
            {badgeText}
          </span>
        )}
      </div>

      <div className="text-2xl font-bold text-white tracking-tight mb-1 font-mono">{value}</div>
      <div className="text-xs font-medium text-slate-400 tracking-wide mb-1">{title}</div>
      
      {(subtitle || change) && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 mt-2 border-t border-white/5">
          {subtitle && <span>{subtitle}</span>}
          {change && (
            <span
              className={`font-medium ${
                changeType === 'positive'
                  ? 'text-emerald-400'
                  : changeType === 'negative'
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }`}
            >
              {change}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
