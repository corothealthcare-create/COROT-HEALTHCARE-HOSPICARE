import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Plus,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/database';
import { InsuranceClaim, Patient } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { exportToCSV } from '../../lib/exportService';

export const InsuranceClaimsPage: React.FC = () => {
  const { user, activeHospital } = useAuth();
  const hospId = activeHospital?.id;
  const isSuper = user?.is_super_admin;

  const [claims, setClaims] = useState<InsuranceClaim[]>(db.getInsuranceClaims(hospId, isSuper));
  const [patients] = useState<Patient[]>(db.getPatients(hospId, isSuper));
  const [showClaimModal, setShowClaimModal] = useState(false);

  // New Claim Form State
  const [patientId, setPatientId] = useState(patients[0]?.id || '');
  const [tpaCompany, setTpaCompany] = useState('Star Health & Allied Insurance');
  const [policyNumber, setPolicyNumber] = useState('SH-POL-2026-99120');
  const [claimedAmount, setClaimedAmount] = useState(75000);

  const refreshList = () => {
    setClaims(db.getInsuranceClaims(hospId, isSuper));
  };

  const handleCreateClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find(p => p.id === patientId);
    if (!pat) return;

    const claimNo = `CLM-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const newClaim: InsuranceClaim = {
      id: `claim-${Date.now()}`,
      hospital_id: hospId || 'hosp-apex-01',
      claim_number: claimNo,
      patient_id: pat.id,
      patient_name: pat.name,
      patient_uhid: pat.uhid,
      tpa_company: tpaCompany,
      policy_number: policyNumber,
      claimed_amount: Number(claimedAmount),
      approved_amount: Math.round(Number(claimedAmount) * 0.9),
      status: 'approved',
      created_at: new Date().toISOString()
    };

    db.saveInsuranceClaim(newClaim);
    db.addAuditLog({
      hospital_id: hospId,
      hospital_name: activeHospital?.name,
      user_id: user?.id || 'usr-anon',
      user_email: user?.email || '',
      user_role: user?.role || 'accountant',
      action: 'CREATE',
      module: 'TPA Insurance Desk',
      record_id: newClaim.id,
      details: `Submitted Cashless Pre-Auth Claim ${claimNo} (₹${claimedAmount}) for ${pat.name}`
    });

    refreshList();
    setShowClaimModal(false);
  };

  const totalSanctioned = claims.filter(c => c.status === 'approved' || c.status === 'settled').reduce((acc, c) => acc + (c.approved_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="purple" size="sm">CASHLESS TPA DESK</Badge>
            <span className="text-xs text-slate-400 font-mono">INSURANCE PRE-AUTH</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Insurance & TPA Claims Desk</h1>
          <p className="text-xs text-slate-400 mt-1">
            Cashless pre-authorization, TPA query resolution, sanction limits, and final settlement logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV(claims, 'Insurance_Claims_Master')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/60 border border-white/5 text-slate-300 hover:text-white text-xs font-semibold"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Claims CSV</span>
          </button>

          <button
            onClick={() => setShowClaimModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)]"
          >
            <Plus className="w-4 h-4" />
            <span>New Pre-Auth Claim</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-purple-950/20 border border-purple-500/30 rounded-2xl p-4">
          <div className="text-xs text-purple-400 font-mono font-bold">TOTAL SANCTIONED AMOUNT</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">₹{totalSanctioned.toLocaleString()}</div>
          <div className="text-[10px] text-purple-300 mt-1">Approved for cashless hospital stay</div>
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-mono">TOTAL CLAIMS LODGED</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">{claims.length} Cases</div>
          <div className="text-[10px] text-slate-500 mt-1">100% Pre-Auth Tracking</div>
        </div>

        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4">
          <div className="text-xs text-emerald-400 font-mono font-bold">TPA APPROVAL RATIO</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">94.2%</div>
          <div className="text-[10px] text-emerald-300 mt-1">Faster cashless discharge</div>
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 font-mono uppercase text-[11px]">
                <th className="pb-3 px-3">Claim No & Date</th>
                <th className="pb-3 px-3">Patient & UHID</th>
                <th className="pb-3 px-3">TPA / Insurance Co.</th>
                <th className="pb-3 px-3">Policy No</th>
                <th className="pb-3 px-3">Claimed (₹)</th>
                <th className="pb-3 px-3">Sanctioned (₹)</th>
                <th className="pb-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {claims.map((claim) => (
                <tr key={claim.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-3">
                    <div className="font-mono font-bold text-white">{claim.claim_number}</div>
                    <div className="text-[10px] text-slate-400">{new Date(claim.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="py-4 px-3">
                    <div className="font-bold text-white text-sm">{claim.patient_name}</div>
                    <div className="text-[10px] font-mono text-blue-400">{claim.patient_uhid}</div>
                  </td>
                  <td className="py-4 px-3 text-white font-medium">{claim.tpa_company}</td>
                  <td className="py-4 px-3 font-mono text-slate-300">{claim.policy_number}</td>
                  <td className="py-4 px-3 font-mono text-slate-200">₹{claim.claimed_amount.toLocaleString()}</td>
                  <td className="py-4 px-3 font-mono font-bold text-emerald-400">
                    ₹{(claim.approved_amount || 0).toLocaleString()}
                  </td>
                  <td className="py-4 px-3">
                    <Badge variant={claim.status === 'approved' ? 'emerald' : 'purple'} size="sm">
                      {claim.status.toUpperCase()}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Claim Modal */}
      <Modal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        title="Lodge Cashless Pre-Auth Claim"
        subtitle={`Transmits pre-authorization under ${activeHospital?.name}`}
      >
        <form onSubmit={handleCreateClaim} className="space-y-4 text-xs">
          <div>
            <label className="block font-mono uppercase text-slate-400 mb-1">Select Patient *</label>
            <select
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-purple-500 cursor-pointer"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.uhid})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-mono uppercase text-slate-400 mb-1">Insurance / TPA Provider *</label>
            <input
              type="text"
              required
              value={tpaCompany}
              onChange={e => setTpaCompany(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Policy / Card Number *</label>
              <input
                type="text"
                required
                value={policyNumber}
                onChange={e => setPolicyNumber(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Estimated Hospitalization Cost (₹) *</label>
              <input
                type="number"
                required
                value={claimedAmount}
                onChange={e => setClaimedAmount(Number(e.target.value))}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowClaimModal(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
            >
              Submit Pre-Auth to TPA
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
