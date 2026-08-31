import React, { useState } from 'react';
import { Shield, Sparkles, Building2, UserCheck, ShieldAlert, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/database';
import { Hospital } from '../../types';
import { Modal } from '../ui/Modal';

interface RoleSwitcherBarProps {
  onNavigate?: (module: string) => void;
}

export const RoleSwitcherBar: React.FC<RoleSwitcherBarProps> = ({ onNavigate }) => {
  const { user, activeHospital, switchDemoRole, superAdminGrant, grantSuperAdminAccess, revokeSuperAdminAccess } = useAuth();
  const users = db.getUsers();
  const hospitals = db.getHospitals();

  const [pendingHospital, setPendingHospital] = useState<Hospital | null>(null);
  const [accessReason, setAccessReason] = useState('Regulatory Compliance & Quality Audit');
  const [accessMode, setAccessMode] = useState<'read_only' | 'administrative'>('read_only');
  const [accessDuration, setAccessDuration] = useState(30);

  const handleSelectHospital = (hospId: string) => {
    const selected = hospitals.find(h => h.id === hospId);
    if (!selected) return;
    setPendingHospital(selected);
  };

  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingHospital) return;
    grantSuperAdminAccess(pendingHospital, accessReason, accessMode, accessDuration);
    setPendingHospital(null);
  };

  return (
    <div className="bg-[#040814] border-b border-blue-500/20 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs z-30 sticky top-0 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-blue-400 font-mono font-bold tracking-wider uppercase text-[11px]">
          <Shield className="w-4 h-4 text-blue-400 animate-pulse" />
          <span>ENTERPRISE RBAC & MULTI-TENANT SIMULATOR:</span>
        </div>

        {/* Quick Role Select */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-[50vw]">
          {users.map((u) => {
            const isCurrent = user?.id === u.id;
            return (
              <button
                key={u.id}
                onClick={() => {
                  switchDemoRole(u.email);
                  if (u.is_super_admin && onNavigate) {
                    onNavigate('superadmin');
                  }
                }}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all border ${
                  isCurrent
                    ? 'bg-blue-600/30 text-blue-300 border-blue-400/50 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                    : 'bg-slate-900/60 text-slate-400 border-white/5 hover:text-white hover:border-white/20'
                }`}
                title={`${u.full_name} (${u.designation})`}
              >
                <span className="font-semibold">{u.role.replace('_', ' ').toUpperCase()}</span>
                <span className="opacity-60 ml-1 text-[10px]">({u.full_name.split(' ')[0]})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Super Admin Hospital Tenant Switcher */}
      {user?.is_super_admin && (
        <div className="flex items-center gap-2">
          {superAdminGrant && (
            <button
              onClick={revokeSuperAdminAccess}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500 hover:text-black font-mono text-[10px] transition-all"
              title="Click to revoke temporary access grant"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>GRANT ACTIVE ({superAdminGrant.access_mode.toUpperCase()})</span>
            </button>
          )}

          <div className="flex items-center gap-2 bg-slate-900/80 border border-purple-500/30 px-3 py-1 rounded-xl">
            <Building2 className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[11px] text-purple-300 font-mono font-semibold">Tenant Scope:</span>
            <select
              value={activeHospital?.id || ''}
              onChange={(e) => handleSelectHospital(e.target.value)}
              className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {hospitals.map(h => (
                <option key={h.id} value={h.id} className="bg-[#090d16] text-white">
                  {h.name} ({h.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Non-Super Admin Locked Scope Indicator */}
      {!user?.is_super_admin && (
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Active Scope: <strong className="text-white">{activeHospital?.name}</strong></span>
        </div>
      )}

      {/* Controlled Access Prompt Modal for Super Admin */}
      <Modal
        isOpen={!!pendingHospital}
        onClose={() => setPendingHospital(null)}
        title="Super Admin Controlled Tenant Switch"
        subtitle={`Authorize controlled access to ${pendingHospital?.name}`}
      >
        <form onSubmit={handleAuthorize} className="space-y-4">
          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-slate-300">
            Switching tenant scope as Super Admin creates a tracked, time-bounded clinical access session recorded in the forensic audit log.
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Access Reason *</label>
            <select
              value={accessReason}
              onChange={e => setAccessReason(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Regulatory Compliance & Quality Audit">Regulatory Compliance & Quality Audit</option>
              <option value="Emergency Technical Support">Emergency Technical Support</option>
              <option value="Billing & Claim Investigation">Billing & Claim Investigation</option>
              <option value="Forensic Security Review">Forensic Security Review</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Access Mode *</label>
              <select
                value={accessMode}
                onChange={e => setAccessMode(e.target.value as any)}
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="read_only">Read-Only Audit</option>
                <option value="administrative">Administrative Override</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Duration *</label>
              <select
                value={accessDuration}
                onChange={e => setAccessDuration(Number(e.target.value))}
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value={15}>15 Mins</option>
                <option value={30}>30 Mins</option>
                <option value={60}>60 Mins</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => setPendingHospital(null)}
              className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Authorize Access</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

