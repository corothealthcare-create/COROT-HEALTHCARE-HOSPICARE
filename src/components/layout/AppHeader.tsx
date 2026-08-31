import React, { useState } from 'react';
import {
  Search,
  Bell,
  Activity,
  ShieldCheck,
  Building,
  LogOut,
  User,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { ROLE_CONFIGS } from '../../lib/rbac';
import { Badge } from '../ui/Badge';

interface AppHeaderProps {
  onOpenSearch: () => void;
  onNavigate: (module: string) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenSearch, onNavigate }) => {
  const { user, activeHospital, logout } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const roleConfig = user ? ROLE_CONFIGS[user.role] : null;

  return (
    <header className="bg-[#040810]/90 border-b border-white/5 px-6 py-3.5 flex items-center justify-between sticky top-10 z-20 backdrop-blur-xl">
      {/* Left: Current Hospital Badge & Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-400/30 flex items-center justify-center text-white font-bold text-lg shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            {activeHospital?.name.slice(0, 1) || 'C'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">
                {activeHospital?.name || 'Corot Healthcare Hospicare'}
              </h2>
              <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                {activeHospital?.code || 'COROT-CLOUD'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {activeHospital?.city}, {activeHospital?.state} • {activeHospital?.hospital_type} ({activeHospital?.bed_capacity} Beds)
            </p>
          </div>
        </div>
      </div>

      {/* Center: Universal Search Button */}
      <div className="hidden md:flex items-center">
        <button
          onClick={onOpenSearch}
          className="flex items-center justify-between w-80 lg:w-96 px-4 py-2 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-blue-500/30 text-slate-400 hover:text-white transition-all shadow-inner text-xs group"
        >
          <span className="flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
            <span>Search UHID, Patient, Doctor, Rx, Invoices...</span>
          </span>
          <span className="text-[10px] font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-slate-400">
            ⌘K
          </span>
        </button>
      </div>

      {/* Right: Telemetry & Actions */}
      <div className="flex items-center gap-4">
        {/* HUD Telemetry Indicator */}
        <div className="hidden xl:flex items-center gap-5 pr-4 border-r border-white/5 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
            <span>RLS ISOLATION ACTIVE</span>
          </div>
          <div className="text-slate-400">
            LATENCY: <strong className="text-blue-400">14.2ms</strong>
          </div>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2.5 rounded-2xl bg-slate-900/60 border border-white/5 text-slate-300 hover:text-white hover:border-white/20 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-[0_0_10px_rgba(244,63,94,0.6)]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifMenu && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#090d16] border border-white/10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.8)] z-50 p-4 overflow-hidden backdrop-blur-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">System Alerts</h4>
                  {unreadCount > 0 && <Badge variant="rose" size="sm">{unreadCount} New</Badge>}
                </div>
                <button
                  onClick={() => setShowNotifMenu(false)}
                  className="text-[11px] text-blue-400 hover:underline"
                >
                  Close
                </button>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 text-xs">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        n.is_read
                          ? 'bg-white/[0.01] border-white/5 text-slate-400'
                          : 'bg-slate-900/80 border-blue-500/30 text-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {n.type === 'critical' ? (
                          <Flame className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        ) : n.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        ) : n.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white truncate">{n.title}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{n.message}</div>
                          <div className="text-[9px] font-mono text-slate-500 mt-1">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {n.module}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-1.5 pl-3 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-white/20 transition-all text-left"
          >
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white truncate max-w-[140px]">{user?.full_name}</div>
              <div className="text-[10px] text-slate-400 font-mono">{roleConfig?.label.split(' ')[0]}</div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300 font-bold text-xs">
              {user?.full_name.slice(0, 1)}
            </div>
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-3 w-64 bg-[#090d16] border border-white/10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.8)] z-50 p-4 backdrop-blur-xl">
              <div className="pb-3 border-b border-white/5 mb-3">
                <div className="text-xs font-bold text-white">{user?.full_name}</div>
                <div className="text-[11px] text-slate-400">{user?.email}</div>
                <div className="mt-2">
                  <span className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded-full border ${roleConfig?.badgeColor}`}>
                    {roleConfig?.label}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onNavigate('audit');
                  }}
                  className="w-full text-left p-2 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white"
                >
                  My Security & Audit Log
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full text-left p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out of Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
