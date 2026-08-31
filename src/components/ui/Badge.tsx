import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate' | 'cyan';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'blue', size = 'md', pulse = false }) => {
  const variantStyles = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    slate: 'bg-slate-800/80 text-slate-300 border-slate-700',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 tracking-wider uppercase font-semibold font-mono',
    md: 'text-xs px-2.5 py-1 font-medium'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles[variant]} ${sizeStyles[size]}`}>
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            variant === 'emerald' ? 'bg-emerald-400' : variant === 'rose' ? 'bg-rose-400' : 'bg-blue-400'
          }`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${
            variant === 'emerald' ? 'bg-emerald-500' : variant === 'rose' ? 'bg-rose-500' : 'bg-blue-500'
          }`} />
        </span>
      )}
      {children}
    </span>
  );
};
