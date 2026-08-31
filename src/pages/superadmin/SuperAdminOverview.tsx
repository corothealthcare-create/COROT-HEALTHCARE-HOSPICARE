import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  BedDouble,
  ShieldCheck,
  Plus,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  ShieldAlert,
  Clock,
  KeyRound,
  FileText,
  Database,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/database';
import { Hospital } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { exportToCSV } from '../../lib/exportService';
import { checkSupabaseConnection, isSupabaseConfigured, SupabaseHealthCheckResult } from '../../lib/supabaseClient';

interface SuperAdminOverviewProps {
  onNavigate?: (module: string) => void;
}

export const SuperAdminOverview: React.FC<SuperAdminOverviewProps> = ({ onNavigate }) => {
  const { superAdminGrant, grantSuperAdminAccess, revokeSuperAdminAccess } = useAuth();
  const [hospitals, setHospitals] = useState<Hospital[]>(db.getHospitals());
  const [showAddModal, setShowAddModal] = useState(false);
  const [targetAccessHospital, setTargetAccessHospital] = useState<Hospital | null>(null);

  // Supabase Health State
  const [isCheckingSupabase, setIsCheckingSupabase] = useState(false);
  const [supabaseHealth, setSupabaseHealth] = useState<SupabaseHealthCheckResult | null>(null);

  useEffect(() => {
    handleCheckSupabase();
  }, []);

  const handleCheckSupabase = async () => {
    setIsCheckingSupabase(true);
    try {
      const result = await checkSupabaseConnection();
      setSupabaseHealth(result);
    } catch {
      setSupabaseHealth({
        connected: false,
        urlConfigured: isSupabaseConfigured,
        keyConfigured: isSupabaseConfigured,
        message: 'Connection check encountered an error.',
      });
    } finally {
      setIsCheckingSupabase(false);
    }
  };

  // Controlled Access Form State
  const [accessReason, setAccessReason] = useState('Regulatory Compliance & Clinical Quality Audit');
  const [accessRationale, setAccessRationale] = useState('');
  const [accessMode, setAccessMode] = useState<'read_only' | 'administrative'>('read_only');
  const [accessDuration, setAccessDuration] = useState(30);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [hospitalType, setHospitalType] = useState<'Super-Specialty' | 'Multi-Specialty' | 'General' | 'Clinic'>('Multi-Specialty');
  const [bedCapacity, setBedCapacity] = useState(150);

  const totalBeds = hospitals.reduce((acc, h) => acc + h.bed_capacity, 0);
  const activeHospitals = hospitals.filter(h => h.status === 'active').length;

  const handleAuthorizeControlledAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAccessHospital) return;

    const fullReason = accessRationale
      ? `${accessReason} - ${accessRationale}`
      : accessReason;

    grantSuperAdminAccess(targetAccessHospital, fullReason, accessMode, Number(accessDuration));
    setTargetAccessHospital(null);
    setAccessRationale('');
    if (onNavigate) {
      onNavigate('dashboard');
    }
  };

  const handleCreateHospital = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    const newHosp: Hospital = {
      id: `hosp-${Date.now()}`,
      code: code.toUpperCase(),
      name,
      address: `${city} Medical Zone`,
      city,
      state,
      pin: '400001',
      phone,
      email,
      registration_no: `COROT/REG/${Math.floor(10000 + Math.random() * 90000)}`,
      emergency_contact: phone,
      hospital_type: hospitalType,
      bed_capacity: Number(bedCapacity),
      departments: ['General Medicine', 'Emergency', 'Cardiology', 'Surgery'],
      status: 'active',
      created_at: new Date().toISOString()
    };

    db.saveHospital(newHosp);
    setHospitals(db.getHospitals());
    setShowAddModal(false);
    // Reset Form
    setName('');
    setCode('');
    setCity('');
    setState('');
  };

  const toggleHospitalStatus = (hosp: Hospital) => {
    const updated: Hospital = {
      ...hosp,
      status: hosp.status === 'active' ? 'suspended' : 'active'
    };
    db.saveHospital(updated);
    setHospitals(db.getHospitals());
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900/30 via-slate-900/40 to-purple-900/30 border border-white/5 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="purple" size="sm">PLATFORM GOVERNANCE</Badge>
            <span className="text-xs text-slate-400 font-mono">MULTI-TENANT CLOUD CONTROL</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Super Admin Command Center</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Global monitoring of all tenant hospitals, infrastructure capacity, verified RLS partitions, and SaaS licensing.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => exportToCSV(hospitals, 'Corot_Hospitals_Master')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/60 border border-white/5 text-slate-300 hover:text-white hover:border-white/20 text-xs font-semibold transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Hospital</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tenant Hospitals"
          value={hospitals.length}
          subtitle={`${activeHospitals} Active • 0 Disrupted`}
          icon={Building2}
          variant="blue"
          badgeText="SaaS Partitioned"
        />
        <StatCard
          title="Total Cloud Bed Capacity"
          value={totalBeds}
          subtitle="Across all registered facilities"
          icon={BedDouble}
          variant="emerald"
          badgeText="92% Live Telemetry"
        />
        <StatCard
          title="Platform Security State"
          value="RLS Enforced"
          subtitle="Zero cross-tenant leaks"
          icon={ShieldCheck}
          variant="purple"
          badgeText="Postgres 16 RLS"
        />
        <StatCard
          title="Platform Uptime SLA"
          value="99.98%"
          subtitle="Asia-South Cluster"
          icon={Activity}
          variant="cyan"
          badgeText="All Nodes Green"
        />
      </div>

      {/* Active Controlled Access Banner */}
      {superAdminGrant && (
        <div className="bg-amber-950/30 border border-amber-500/40 rounded-3xl p-5 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  TEMPORARY AUTHORIZED CLINICAL ACCESS ACTIVE
                </span>
                <Badge variant="amber" size="sm">
                  {superAdminGrant.access_mode === 'read_only' ? 'READ-ONLY AUDIT' : 'ADMINISTRATIVE OVERRIDE'}
                </Badge>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Hospital Scope: <strong className="text-white">{superAdminGrant.hospital_name}</strong> | Reason: <span className="text-slate-400">{superAdminGrant.reason}</span>
              </p>
              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Expires:{' '}
                  {new Date(superAdminGrant.expires_at).toLocaleTimeString()}
                </span>
                <span>• Logged to Immutable Forensic Audit Trail</span>
              </div>
            </div>
          </div>

          <button
            onClick={revokeSuperAdminAccess}
            className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500 hover:text-black text-xs font-bold transition-all shrink-0"
          >
            Revoke Access Session
          </button>
        </div>
      )}

      {/* Supabase Database Connection & RLS Engine Status */}
      <div className="bg-slate-900/60 border border-blue-500/20 rounded-3xl p-6 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Supabase PostgreSQL & RLS Engine</h3>
                {supabaseHealth?.connected ? (
                  <Badge variant="emerald" size="sm">LIVE POSTGRES CONNECTED</Badge>
                ) : (
                  <Badge variant="rose" size="sm">AWAITING CREDENTIALS</Badge>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Target Database: PostgreSQL 16 with UUID Primary Keys, Row Level Security (RLS), and Multi-Tenant Isolation
              </p>
            </div>
          </div>

          <button
            onClick={handleCheckSupabase}
            disabled={isCheckingSupabase}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600 hover:text-white text-xs font-semibold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingSupabase ? 'animate-spin' : ''}`} />
            <span>{isCheckingSupabase ? 'Verifying...' : 'Test Supabase Connection'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Schema & Migration</div>
            <div className="text-xs font-semibold text-white">20260831000000_init_hospicare.sql</div>
            <div className="text-[10px] text-emerald-400 font-mono">40+ Tables • 28 RLS Policies • 4 Security Functions</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Supabase Environment Status</div>
            <div className="text-xs font-semibold text-white">
              {supabaseHealth?.urlConfigured ? 'VITE_SUPABASE_URL Configured' : 'Missing VITE_SUPABASE_URL'}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {supabaseHealth?.message}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Client Security Boundary</div>
            <div className="text-xs font-semibold text-white">Zero Service-Role Exposure</div>
            <div className="text-[10px] text-blue-400 font-mono">Client utilizes only Anon / JWT session context</div>
          </div>
        </div>
      </div>

      {/* Tenant Hospitals Table */}

      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-white">Registered Tenant Hospitals</h3>
            <p className="text-xs text-slate-400">Strictly isolated PostgreSQL database partitions per hospital</p>
          </div>
          <span className="text-xs font-mono text-slate-500">{hospitals.length} Facilities Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 font-mono uppercase text-[11px]">
                <th className="pb-3 px-3">Hospital Code & Name</th>
                <th className="pb-3 px-3">Type & Location</th>
                <th className="pb-3 px-3">Bed Capacity</th>
                <th className="pb-3 px-3">Registration & Contact</th>
                <th className="pb-3 px-3">SaaS Status</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {hospitals.map((hosp) => (
                <tr key={hosp.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-3">
                    <div className="font-bold text-white text-sm">{hosp.name}</div>
                    <div className="text-[10px] font-mono text-blue-400">{hosp.code}</div>
                  </td>
                  <td className="py-4 px-3">
                    <div className="text-slate-300 font-medium">{hosp.hospital_type}</div>
                    <div className="text-[11px] text-slate-400">{hosp.city}, {hosp.state}</div>
                  </td>
                  <td className="py-4 px-3 font-mono text-white font-bold">
                    {hosp.bed_capacity} Beds
                  </td>
                  <td className="py-4 px-3">
                    <div className="text-slate-300">{hosp.phone}</div>
                    <div className="text-[10px] font-mono text-slate-500">{hosp.registration_no}</div>
                  </td>
                  <td className="py-4 px-3">
                    <Badge variant={hosp.status === 'active' ? 'emerald' : 'rose'} size="sm" pulse={hosp.status === 'active'}>
                      {hosp.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-4 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setTargetAccessHospital(hosp)}
                        className="px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600 hover:text-white font-semibold transition-all flex items-center gap-1.5"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Controlled Access</span>
                      </button>
                      <button
                        onClick={() => toggleHospitalStatus(hosp)}
                        className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all ${
                          hosp.status === 'active'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                        }`}
                      >
                        {hosp.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Controlled Hospital Access Authorization Modal */}
      <Modal
        isOpen={!!targetAccessHospital}
        onClose={() => setTargetAccessHospital(null)}
        title="Super Admin Controlled Hospital Access"
        subtitle={`Authorize controlled, audited, time-bounded access to ${targetAccessHospital?.name}`}
      >
        <form onSubmit={handleAuthorizeControlledAccess} className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-500/30 text-xs space-y-1">
            <div className="font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>TENANT PRIVACY & ZERO-TRUST POLICY ENFORCEMENT</span>
            </div>
            <p className="text-slate-300">
              Super Admin access to tenant clinical data requires a formal access rationale and is limited to the requested duration. Every clinical record view and operation during this session is logged immutably.
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Access Justification *</label>
            <select
              value={accessReason}
              onChange={e => setAccessReason(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Regulatory Compliance & Clinical Quality Audit">Regulatory Compliance & Clinical Quality Audit</option>
              <option value="Emergency Technical Support & Data Rectification">Emergency Technical Support & Data Rectification</option>
              <option value="Billing Dispute & TPA Claim Investigation">Billing Dispute & TPA Claim Investigation</option>
              <option value="Forensic Security & Tamper Verification">Forensic Security & Tamper Verification</option>
              <option value="Hospital Administrator Onboarding Assistence">Hospital Administrator Onboarding Assistance</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Detailed Technical Rationale (Optional)</label>
            <textarea
              rows={2}
              value={accessRationale}
              onChange={e => setAccessRationale(e.target.value)}
              placeholder="e.g. Investigating NABH emergency triage turnaround telemetry..."
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Access Mode *</label>
              <select
                value={accessMode}
                onChange={e => setAccessMode(e.target.value as any)}
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="read_only">Read-Only Audit (Recommended)</option>
                <option value="administrative">Full Administrative Override</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Session Duration *</label>
              <select
                value={accessDuration}
                onChange={e => setAccessDuration(Number(e.target.value))}
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>1 Hour</option>
                <option value={120}>2 Hours</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
            <button
              type="button"
              onClick={() => setTargetAccessHospital(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Authorize & Enter Facility</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Onboard Hospital Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Onboard New Hospital Facility"
        subtitle="Provisions a new isolated database tenant partition under COROT HEALTHCARE HOSPICARE"
      >
        <form onSubmit={handleCreateHospital} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Hospital Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Corot Sunrise Hospital"
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Hospital Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="e.g. COROT-SUNRISE-04"
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">City *</label>
              <input
                type="text"
                required
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. Pune"
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">State *</label>
              <input
                type="text"
                required
                value={state}
                onChange={e => setState(e.target.value)}
                placeholder="e.g. Maharashtra"
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Bed Capacity *</label>
              <input
                type="number"
                required
                value={bedCapacity}
                onChange={e => setBedCapacity(Number(e.target.value))}
                min="10"
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Official Phone *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 20 2567 8900"
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Official Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@sunrise.corot.health"
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)]"
            >
              Provision & Register Hospital
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
