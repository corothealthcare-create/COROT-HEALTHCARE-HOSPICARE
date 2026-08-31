import React, { useState } from 'react';
import {
  BedDouble,
  Users,
  Search,
  Plus,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Stethoscope,
  HeartPulse,
  Activity,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/database';
import { Bed, IpdAdmission, Patient, Doctor } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { exportToCSV } from '../../lib/exportService';
import { openPrintWindow } from '../../lib/printService';

export const IpdBedMatrixPage: React.FC = () => {
  const { user, activeHospital } = useAuth();
  const hospId = activeHospital?.id;
  const isSuper = user?.is_super_admin;

  const [beds, setBeds] = useState<Bed[]>(db.getBeds(hospId, isSuper));
  const [admissions, setAdmissions] = useState<IpdAdmission[]>(db.getAdmissions(hospId, isSuper));
  const [patients] = useState<Patient[]>(db.getPatients(hospId, isSuper));
  const [doctors] = useState<Doctor[]>(db.getDoctors(hospId, isSuper));

  const [selectedWard, setSelectedWard] = useState<string>('All');
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [dischargeTarget, setDischargeTarget] = useState<IpdAdmission | null>(null);

  // Form State
  const [admitPatientId, setAdmitPatientId] = useState(patients[0]?.id || '');
  const [admitDoctorId, setAdmitDoctorId] = useState(doctors[0]?.id || '');
  const [admitBedId, setAdmitBedId] = useState('');
  const [admitDiagnosis, setAdmitDiagnosis] = useState('');
  const [initialDeposit, setInitialDeposit] = useState(25000);

  // Discharge State
  const [dischargeDiagnosis, setDischargeDiagnosis] = useState('');
  const [dischargeCondition, setDischargeCondition] = useState<'Stable' | 'Improved' | 'Cured' | 'Referred'>('Improved');
  const [dischargeNotes, setDischargeNotes] = useState('');

  const refreshData = () => {
    setBeds(db.getBeds(hospId, isSuper));
    setAdmissions(db.getAdmissions(hospId, isSuper));
  };

  const wards = ['All', ...Array.from(new Set(beds.map(b => b.ward)))];

  const filteredBeds = beds.filter(b => {
    if (selectedWard === 'All') return true;
    return b.ward === selectedWard;
  });

  const availableBeds = beds.filter(b => b.status === 'available');
  const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
  const icuBeds = beds.filter(b => b.ward.includes('ICU') || b.ward.includes('CCU'));
  const freeIcuBeds = icuBeds.filter(b => b.status === 'available').length;

  const handleAdmitPatient = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find(p => p.id === admitPatientId);
    const doc = doctors.find(d => d.id === admitDoctorId);
    const targetBed = beds.find(b => b.id === (admitBedId || availableBeds[0]?.id));
    if (!pat || !doc || !targetBed) return;

    const ipdNo = `IPD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newAdm: IpdAdmission = {
      id: `adm-${Date.now()}`,
      hospital_id: hospId || 'hosp-apex-01',
      ipd_number: ipdNo,
      patient_id: pat.id,
      patient_uhid: pat.uhid,
      patient_name: pat.name,
      doctor_id: doc.id,
      doctor_name: doc.name,
      ward: targetBed.ward,
      bed_number: targetBed.bed_number,
      admission_date: new Date().toISOString(),
      admitting_diagnosis: admitDiagnosis || 'Acute Inpatient Admission',
      initial_deposit: Number(initialDeposit),
      status: 'admitted',
      insurance_claim_id: pat.insurance_provider ? `CLM-${Math.floor(100000 + Math.random() * 900000)}` : undefined
    };

    // Update Bed status
    const updatedBed: Bed = {
      ...targetBed,
      status: 'occupied',
      current_patient_id: pat.id,
      current_patient_name: pat.name,
      admission_id: newAdm.id
    };
    db.saveBed(updatedBed);

    // Update Patient status
    db.savePatient({ ...pat, status: 'admitted' });

    db.saveAdmission(newAdm);
    db.addAuditLog({
      hospital_id: hospId,
      hospital_name: activeHospital?.name,
      user_id: user?.id || 'usr-anon',
      user_email: user?.email || '',
      user_role: user?.role || 'nurse',
      action: 'CREATE',
      module: 'IPD Admissions',
      record_id: newAdm.id,
      details: `Admitted ${pat.name} to Bed ${targetBed.bed_number} (${targetBed.ward}) under ${doc.name}`
    });

    refreshData();
    setShowAdmitModal(false);
  };

  const handleDischargePatient = () => {
    if (!dischargeTarget) return;

    const updatedAdm: IpdAdmission = {
      ...dischargeTarget,
      status: 'discharged',
      discharge_date: new Date().toISOString(),
      discharge_summary: {
        final_diagnosis: dischargeDiagnosis || dischargeTarget.admitting_diagnosis,
        treatment_given: 'Standard Inpatient Medical & Nursing Protocol',
        condition_at_discharge: dischargeCondition,
        discharge_medications: 'Prescription continuation as advised',
        follow_up_advice: dischargeNotes || 'Review after 7 days in OPD'
      }
    };
    db.saveAdmission(updatedAdm);

    // Free Bed
    const bed = beds.find(b => b.admission_id === dischargeTarget.id || b.bed_number === dischargeTarget.bed_number);
    if (bed) {
      db.saveBed({
        ...bed,
        status: 'available',
        current_patient_id: undefined,
        current_patient_name: undefined,
        admission_id: undefined
      });
    }

    // Update Patient Status
    const pat = patients.find(p => p.id === dischargeTarget.patient_id);
    if (pat) {
      db.savePatient({ ...pat, status: 'discharged' });
    }

    db.addAuditLog({
      hospital_id: hospId,
      hospital_name: activeHospital?.name,
      user_id: user?.id || 'usr-anon',
      user_email: user?.email || '',
      user_role: user?.role || 'doctor',
      action: 'UPDATE',
      module: 'IPD Discharge',
      record_id: dischargeTarget.id,
      details: `Discharged ${dischargeTarget.patient_name} (${dischargeTarget.ipd_number}) from Bed ${dischargeTarget.bed_number}`
    });

    refreshData();
    setDischargeTarget(null);
  };

  const handlePrintDischargeSummary = (adm: IpdAdmission) => {
    const html = `
      <div style="margin-bottom: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #0f2444; padding-bottom: 10px; margin-bottom: 15px;">
          <div style="font-size: 16px; font-weight: 800; color: #0f2444; text-transform: uppercase;">CLINICAL DISCHARGE SUMMARY</div>
          <div style="font-size: 11px; color: #0284c7; font-weight: 600;">INPATIENT MEDICAL RECORD ARCHIVE</div>
        </div>

        <div class="patient-box">
          <div><span class="label">Patient Name</span><span class="value">${adm.patient_name}</span></div>
          <div><span class="label">UHID</span><span class="value">${adm.patient_uhid}</span></div>
          <div><span class="label">IPD Number</span><span class="value">${adm.ipd_number}</span></div>
          <div><span class="label">Ward & Bed</span><span class="value">${adm.ward} - Bed #${adm.bed_number}</span></div>
          <div><span class="label">Admitting Consultant</span><span class="value">${adm.doctor_name}</span></div>
          <div><span class="label">Admission Date</span><span class="value">${new Date(adm.admission_date).toLocaleString()}</span></div>
          <div><span class="label">Discharge Date</span><span class="value">${adm.discharge_date ? new Date(adm.discharge_date).toLocaleString() : 'Active'}</span></div>
          <div><span class="label">Condition on Discharge</span><span class="value">${adm.discharge_summary?.condition_at_discharge || 'Stable / Improved'}</span></div>
        </div>

        <div style="margin-bottom: 15px;">
          <div style="font-size: 12px; font-weight: bold; color: #0f2444; text-transform: uppercase; margin-bottom: 4px;">Final Clinical Diagnosis</div>
          <div style="font-size: 13px; color: #0f172a; font-weight: 600; background: #fafafa; border-left: 3px solid #0284c7; padding: 8px 12px;">
            ${adm.discharge_summary?.final_diagnosis || adm.admitting_diagnosis}
          </div>
        </div>

        <div style="margin-bottom: 15px;">
          <div style="font-size: 12px; font-weight: bold; color: #0f2444; text-transform: uppercase; margin-bottom: 4px;">Summary of Inpatient Hospital Course</div>
          <p style="font-size: 12px; color: #334155; line-height: 1.6;">
            Patient was admitted under ${adm.doctor_name} for management. Serial vitals, nursing telemetry, and laboratory markers were monitored daily. Patient responded favorably to intravenous and oral pharmacotherapy. Hemodynamically stable at the time of discharge.
          </p>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 15px;">
          <div style="font-size: 11px; font-weight: bold; color: #0f2444; text-transform: uppercase; margin-bottom: 4px;">Follow-up & Emergency Warning Signs</div>
          <div style="font-size: 12px; color: #334155;">
            ${adm.discharge_summary?.follow_up_advice || 'Report to OPD in 7 days. If fever >101°F or acute pain occurs, report immediately to 24x7 Emergency Casualty Bay.'}
          </div>
        </div>
      </div>
    `;

    openPrintWindow('INPATIENT DISCHARGE SUMMARY', html, activeHospital || undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="blue" size="sm">IPD & BED OCCUPANCY</Badge>
            <span className="text-xs text-slate-400 font-mono">REAL-TIME WARD MATRIX</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Inpatient Department (IPD)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Live ward telemetry, bed state allocations, inpatient admissions, and verified discharge summaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV(beds, 'Bed_Occupancy_Matrix')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/60 border border-white/5 text-slate-300 hover:text-white hover:border-white/20 text-xs font-semibold transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowAdmitModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Admit Inpatient</span>
          </button>
        </div>
      </div>

      {/* Bed Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-mono">TOTAL BEDS</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">{beds.length}</div>
        </div>
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4">
          <div className="text-xs text-blue-400 font-mono">OCCUPIED</div>
          <div className="text-2xl font-bold text-blue-400 font-mono mt-1">{occupiedBeds}</div>
        </div>
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4">
          <div className="text-xs text-emerald-400 font-mono">AVAILABLE BEDS</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{availableBeds.length}</div>
        </div>
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4">
          <div className="text-xs text-rose-400 font-mono">ICU / CCU FREE</div>
          <div className="text-2xl font-bold text-rose-400 font-mono mt-1">{freeIcuBeds}</div>
        </div>
      </div>

      {/* Ward Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {wards.map((w) => (
          <button
            key={w}
            onClick={() => setSelectedWard(w)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedWard === w
                ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                : 'bg-slate-900/60 text-slate-400 border-white/5 hover:text-white hover:border-white/20'
            }`}
          >
            {w}
          </button>
        ))}
      </div>

      {/* Interactive Bed Matrix Grid */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-4">
          Interactive Ward Bed Matrix
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBeds.map((bed) => {
            const isOcc = bed.status === 'occupied';
            const adm = admissions.find(a => a.id === bed.admission_id || (a.bed_number === bed.bed_number && a.status === 'admitted'));

            return (
              <div
                key={bed.id}
                className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                  isOcc
                    ? 'bg-blue-950/20 border-blue-500/30'
                    : 'bg-slate-900/40 border-white/5 hover:border-emerald-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-white">Bed #{bed.bed_number}</span>
                  <Badge variant={isOcc ? 'blue' : 'emerald'} size="sm" pulse={isOcc}>
                    {bed.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="text-xs text-slate-400 font-medium mb-3">{bed.ward}</div>

                {isOcc && adm ? (
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div>
                      <div className="text-xs font-bold text-white">{adm.patient_name}</div>
                      <div className="text-[10px] font-mono text-blue-400">{adm.patient_uhid}</div>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Dr. {adm.doctor_name}
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => setDischargeTarget(adm)}
                        className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Discharge</span>
                      </button>
                      <button
                        onClick={() => handlePrintDischargeSummary(adm)}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-mono"
                      >
                        Summary
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-3 text-center text-slate-500 text-xs">
                    <span className="text-emerald-400 font-mono text-[11px]">Ready for Admission</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Inpatient Admission List */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Active Inpatient Admissions Log
          </h3>
          <span className="text-xs font-mono text-slate-500">{admissions.length} Admissions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 font-mono uppercase text-[11px]">
                <th className="pb-3 px-3">IPD #</th>
                <th className="pb-3 px-3">Patient & UHID</th>
                <th className="pb-3 px-3">Ward & Bed</th>
                <th className="pb-3 px-3">Attending Doctor</th>
                <th className="pb-3 px-3">Admitting Diagnosis</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {admissions.map((adm) => (
                <tr key={adm.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-3 font-mono font-bold text-white">{adm.ipd_number}</td>
                  <td className="py-4 px-3">
                    <div className="font-bold text-white">{adm.patient_name}</div>
                    <div className="text-[10px] font-mono text-blue-400">{adm.patient_uhid}</div>
                  </td>
                  <td className="py-4 px-3 font-mono text-slate-300">
                    {adm.ward} - Bed #{adm.bed_number}
                  </td>
                  <td className="py-4 px-3 text-slate-200">{adm.doctor_name}</td>
                  <td className="py-4 px-3 text-slate-300">{adm.admitting_diagnosis}</td>
                  <td className="py-4 px-3">
                    <Badge variant={adm.status === 'admitted' ? 'purple' : 'emerald'} size="sm">
                      {adm.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-4 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {adm.status === 'admitted' && (
                        <button
                          onClick={() => setDischargeTarget(adm)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600 hover:text-white font-semibold transition-all text-[11px]"
                        >
                          Discharge
                        </button>
                      )}
                      <button
                        onClick={() => handlePrintDischargeSummary(adm)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                        title="Print Discharge Summary"
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

      {/* Admit Patient Modal */}
      <Modal
        isOpen={showAdmitModal}
        onClose={() => setShowAdmitModal(false)}
        title="Admit Patient to IPD Ward"
        subtitle={`Allocates physical bed under ${activeHospital?.name}`}
      >
        <form onSubmit={handleAdmitPatient} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Select Patient *</label>
            <select
              value={admitPatientId}
              onChange={e => setAdmitPatientId(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.uhid})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Attending Specialist Consultant *</label>
            <select
              value={admitDoctorId}
              onChange={e => setAdmitDoctorId(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Allocate Available Bed *</label>
            <select
              value={admitBedId}
              onChange={e => setAdmitBedId(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {availableBeds.map(b => (
                <option key={b.id} value={b.id}>{b.ward} - Bed #{b.bed_number} (₹{b.daily_charge}/day)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Admitting Clinical Diagnosis *</label>
            <input
              type="text"
              required
              value={admitDiagnosis}
              onChange={e => setAdmitDiagnosis(e.target.value)}
              placeholder="e.g. Acute Appendicitis / High Grade Pyrexia"
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowAdmitModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)]"
            >
              Confirm Admission & Allocate Bed
            </button>
          </div>
        </form>
      </Modal>

      {/* Discharge Patient Modal */}
      {dischargeTarget && (
        <Modal
          isOpen={!!dischargeTarget}
          onClose={() => setDischargeTarget(null)}
          title={`Discharge Protocol: ${dischargeTarget.patient_name}`}
          subtitle={`IPD: ${dischargeTarget.ipd_number} • Bed #${dischargeTarget.bed_number}`}
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Final Discharge Diagnosis *</label>
              <input
                type="text"
                value={dischargeDiagnosis || dischargeTarget.admitting_diagnosis}
                onChange={e => setDischargeDiagnosis(e.target.value)}
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Clinical Condition at Discharge</label>
              <select
                value={dischargeCondition}
                onChange={e => setDischargeCondition(e.target.value as any)}
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs focus:border-blue-500 cursor-pointer"
              >
                <option value="Stable">Stable</option>
                <option value="Improved">Improved</option>
                <option value="Cured">Cured</option>
                <option value="Referred">Referred</option>
              </select>
            </div>

            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Follow-up Advice & Instructions</label>
              <textarea
                rows={3}
                value={dischargeNotes}
                onChange={e => setDischargeNotes(e.target.value)}
                placeholder="e.g. Review in OPD in 7 days with repeat CBC. Suture removal on day 10."
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setDischargeTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDischargePatient}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(244,63,94,0.4)]"
              >
                Process Discharge & Free Bed
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
