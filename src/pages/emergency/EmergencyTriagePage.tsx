import React, { useState } from 'react';
import {
  Flame,
  Search,
  Plus,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  HeartPulse,
  Activity,
  BedDouble,
  User,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/database';
import { EmergencyVisit, Patient, Doctor } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { exportToCSV } from '../../lib/exportService';
import { openPrintWindow } from '../../lib/printService';

export const EmergencyTriagePage: React.FC = () => {
  const { user, activeHospital } = useAuth();
  const hospId = activeHospital?.id;
  const isSuper = user?.is_super_admin;

  const [emergencies, setEmergencies] = useState<EmergencyVisit[]>(db.getEmergencyVisits(hospId, isSuper));
  const [patients] = useState<Patient[]>(db.getPatients(hospId, isSuper));
  const [doctors] = useState<Doctor[]>(db.getDoctors(hospId, isSuper));

  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Intake State
  const [patientId, setPatientId] = useState(patients[0]?.id || '');
  const [triageCategory, setTriageCategory] = useState<'RED' | 'YELLOW' | 'GREEN' | 'BLUE'>('RED');
  const [complaint, setComplaint] = useState('');
  const [trauma, setTrauma] = useState('RTA / Blunt Chest Trauma');
  const [gcs, setGcs] = useState(14);
  const [cmoDoctor, setCmoDoctor] = useState(doctors[0]?.name || 'Dr. Priya Sharma');

  const refreshList = () => {
    setEmergencies(db.getEmergencyVisits(hospId, isSuper));
  };

  const filteredEmergencies = emergencies.filter(e => {
    if (priorityFilter === 'All') return true;
    return e.triage_category === priorityFilter;
  });

  const redCases = emergencies.filter(e => String(e.triage_category || e.triage_priority || '').toUpperCase().includes('RED')).length;
  const yellowCases = emergencies.filter(e => String(e.triage_category || e.triage_priority || '').toUpperCase().includes('YELLOW')).length;

  const handleRegisterIntake = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find(p => p.id === patientId);
    if (!pat) return;

    const newEmg: EmergencyVisit = {
      id: `emg-${Date.now()}`,
      hospital_id: hospId || 'hosp-apex-01',
      patient_id: pat.id,
      patient_uhid: pat.uhid,
      patient_name: pat.name,
      triage_category: triageCategory,
      chief_complaint: complaint || 'Acute severe distress / Trauma',
      trauma_type: trauma,
      gcs_score: Number(gcs),
      arrival_time: new Date().toISOString(),
      attending_doctor: cmoDoctor,
      status: 'triage'
    };

    db.saveEmergencyVisit(newEmg);
    db.addAuditLog({
      hospital_id: hospId,
      hospital_name: activeHospital?.name,
      user_id: user?.id || 'usr-anon',
      user_email: user?.email || '',
      user_role: user?.role || 'emergency_physician',
      action: 'CREATE',
      module: 'Emergency / Triage Bay',
      record_id: newEmg.id,
      details: `Admitted Emergency Case (${triageCategory}) for ${pat.name} - GCS: ${gcs}`
    });

    refreshList();
    setShowIntakeModal(false);
  };

  const handleUpdateStatus = (emg: EmergencyVisit, newStatus: EmergencyVisit['status']) => {
    const updated: EmergencyVisit = { ...emg, status: newStatus };
    db.saveEmergencyVisit(updated);
    refreshList();
  };

  const handlePrintTriageCard = (emg: EmergencyVisit) => {
    const isRed = String(emg.triage_category || emg.triage_priority || '').toUpperCase().includes('RED');
    const html = `
      <div style="max-width: 600px; margin: 0 auto; border: 3px solid ${isRed ? '#ef4444' : '#f59e0b'}; border-radius: 12px; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f2444; padding-bottom: 10px; margin-bottom: 15px;">
          <div>
            <div style="font-size: 16px; font-weight: 900; color: #0f2444;">EMERGENCY CASUALTY TRIAGE CARD</div>
            <div style="font-size: 11px; color: #64748b;">TRAUMA CODE & RAPID RESUS PROTOCOL</div>
          </div>
          <div style="background: ${isRed ? '#ef4444' : '#f59e0b'}; color: #ffffff; padding: 6px 14px; border-radius: 6px; font-weight: 900; font-size: 14px;">
            TRIAGE: ${emg.triage_category || emg.triage_priority || 'RED'}
          </div>
        </div>

        <div class="patient-box">
          <div><span class="label">Patient Name</span><span class="value">${emg.patient_name}</span></div>
          <div><span class="label">UHID</span><span class="value">${emg.patient_uhid}</span></div>
          <div><span class="label">Arrival Timestamp</span><span class="value">${new Date(emg.arrival_time).toLocaleString()}</span></div>
          <div><span class="label">Attending CMO</span><span class="value">${emg.attending_doctor}</span></div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 15px;">
          <div style="font-size: 12px; font-weight: bold; color: #0f2444; text-transform: uppercase; margin-bottom: 6px;">Triage Clinical Assessment</div>
          <div style="font-size: 12px; color: #334155; line-height: 1.6;">
            <strong>Chief Complaint:</strong> ${emg.chief_complaint}<br/>
            <strong>Trauma Category:</strong> ${emg.trauma_type || 'Non-trauma acute medical'}<br/>
            <strong>Glasgow Coma Scale (GCS):</strong> ${emg.gcs_score || 15} / 15
          </div>
        </div>

        <div style="border-top: 1px dashed #cbd5e1; padding-top: 10px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between;">
          <span>Status: ${emg.status.toUpperCase()}</span>
          <span>Verified by Casualty CMO</span>
        </div>
      </div>
    `;

    openPrintWindow('EMERGENCY CASUALTY TRIAGE CARD', html, activeHospital || undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="rose" size="sm" pulse>24x7 TRAUMA BAY</Badge>
            <span className="text-xs text-slate-400 font-mono">CODE RED RESUS PROTOCOL</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Emergency & Casualty Triage</h1>
          <p className="text-xs text-slate-400 mt-1">
            Rapid casualty intake, Manchester Triage acuity scoring, GCS tracking, and instant trauma stabilization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV(emergencies, 'Emergency_Casualty_Log')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/60 border border-white/5 text-slate-300 hover:text-white hover:border-white/20 text-xs font-semibold transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowIntakeModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Casualty Intake</span>
          </button>
        </div>
      </div>

      {/* Triage Priority HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-4">
          <div className="text-xs text-rose-400 font-mono font-bold">RED (IMMEDIATE)</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">{redCases}</div>
          <div className="text-[10px] text-rose-300 mt-1">0 Min Delay SLA</div>
        </div>
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4">
          <div className="text-xs text-amber-400 font-mono font-bold">YELLOW (EMERGENT)</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">{yellowCases}</div>
          <div className="text-[10px] text-amber-300 mt-1">&lt; 15 Min SLA</div>
        </div>
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4">
          <div className="text-xs text-emerald-400 font-mono font-bold">GREEN (URGENT)</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">
            {emergencies.filter(e => e.triage_category === 'GREEN').length}
          </div>
          <div className="text-[10px] text-emerald-300 mt-1">&lt; 60 Min SLA</div>
        </div>
        <div className="bg-blue-950/20 border border-blue-500/30 rounded-2xl p-4">
          <div className="text-xs text-blue-400 font-mono font-bold">BLUE (NON-URGENT)</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">
            {emergencies.filter(e => e.triage_category === 'BLUE').length}
          </div>
          <div className="text-[10px] text-blue-300 mt-1">OPD Re-route</div>
        </div>
      </div>

      {/* Priority Filter */}
      <div className="flex items-center gap-2">
        {['All', 'RED', 'YELLOW', 'GREEN', 'BLUE'].map(p => (
          <button
            key={p}
            onClick={() => setPriorityFilter(p)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              priorityFilter === p
                ? 'bg-rose-600 text-white border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                : 'bg-slate-900/60 text-slate-400 border-white/5 hover:text-white'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Emergency Active Board */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 font-mono uppercase text-[11px]">
                <th className="pb-3 px-3">Triage Acuity</th>
                <th className="pb-3 px-3">Patient & UHID</th>
                <th className="pb-3 px-3">Chief Complaint & Trauma</th>
                <th className="pb-3 px-3">GCS Score</th>
                <th className="pb-3 px-3">Attending CMO</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredEmergencies.map((emg) => (
                <tr key={emg.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-3">
                    <span
                      className={`font-mono font-bold px-2.5 py-1 rounded-xl text-xs border ${
                        emg.triage_category === 'RED'
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse'
                          : emg.triage_category === 'YELLOW'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      }`}
                    >
                      {emg.triage_category}
                    </span>
                  </td>
                  <td className="py-4 px-3">
                    <div className="font-bold text-white text-sm">{emg.patient_name}</div>
                    <div className="text-[10px] font-mono text-blue-400">{emg.patient_uhid}</div>
                  </td>
                  <td className="py-4 px-3">
                    <div className="text-slate-200 font-medium">{emg.chief_complaint}</div>
                    <div className="text-[10px] text-slate-400">{emg.trauma_type}</div>
                  </td>
                  <td className="py-4 px-3 font-mono font-bold">
                    <span className={emg.gcs_score && emg.gcs_score < 10 ? 'text-rose-400' : 'text-emerald-400'}>
                      {emg.gcs_score || 15} / 15
                    </span>
                  </td>
                  <td className="py-4 px-3 text-slate-300">{emg.attending_doctor}</td>
                  <td className="py-4 px-3">
                    <Badge variant={emg.status === 'triage' ? 'rose' : 'emerald'} size="sm">
                      {emg.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-4 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {emg.status === 'triage' && (
                        <button
                          onClick={() => handleUpdateStatus(emg, 'stabilized')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white font-semibold transition-all text-[11px]"
                        >
                          Stabilize
                        </button>
                      )}
                      <button
                        onClick={() => handlePrintTriageCard(emg)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                        title="Print Triage Card"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Casualty Intake Modal */}
      <Modal
        isOpen={showIntakeModal}
        onClose={() => setShowIntakeModal(false)}
        title="Register Emergency Casualty Intake"
        subtitle={`Immediate triage logging under ${activeHospital?.name}`}
      >
        <form onSubmit={handleRegisterIntake} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Select Patient *</label>
            <select
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.uhid})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Triage Priority Category *</label>
              <select
                value={triageCategory}
                onChange={e => setTriageCategory(e.target.value as any)}
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="RED">RED (Immediate Resuscitation)</option>
                <option value="YELLOW">YELLOW (Emergent / 15 mins)</option>
                <option value="GREEN">GREEN (Urgent / 60 mins)</option>
                <option value="BLUE">BLUE (Non-Urgent)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Glasgow Coma Scale (GCS 3-15) *</label>
              <input
                type="number"
                required
                min="3"
                max="15"
                value={gcs}
                onChange={e => setGcs(Number(e.target.value))}
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Chief Presenting Complaint *</label>
            <input
              type="text"
              required
              value={complaint}
              onChange={e => setComplaint(e.target.value)}
              placeholder="e.g. Severe crushing chest pain radiating to left arm / polytrauma"
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Trauma Mechanism</label>
            <input
              type="text"
              value={trauma}
              onChange={e => setTrauma(e.target.value)}
              placeholder="e.g. Vehicular Collision / Fall from height"
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowIntakeModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(244,63,94,0.4)]"
            >
              Admit to Resuscitation Bay
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
