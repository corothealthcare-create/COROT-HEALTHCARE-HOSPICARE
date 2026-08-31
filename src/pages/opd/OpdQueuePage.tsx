import React, { useState } from 'react';
import {
  Calendar,
  Search,
  Plus,
  Printer,
  FileSpreadsheet,
  Stethoscope,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  HeartPulse,
  Pill,
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/database';
import { OpdAppointment, Doctor, Patient, PrescriptionItem, Vitals } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { exportToCSV } from '../../lib/exportService';
import { openPrintWindow } from '../../lib/printService';

export const OpdQueuePage: React.FC = () => {
  const { user, activeHospital } = useAuth();
  const hospId = activeHospital?.id;
  const isSuper = user?.is_super_admin;

  const [appointments, setAppointments] = useState<OpdAppointment[]>(db.getAppointments(hospId, isSuper));
  const [patients] = useState<Patient[]>(db.getPatients(hospId, isSuper));
  const [doctors] = useState<Doctor[]>(db.getDoctors(hospId, isSuper));

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showBookModal, setShowBookModal] = useState(false);
  const [consultationAppt, setConsultationAppt] = useState<OpdAppointment | null>(null);

  // New Booking State
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.id || '');
  const [appointmentType, setAppointmentType] = useState<'New' | 'Follow-up' | 'Emergency' | 'Review'>('New');

  // Consultation Desk State
  const [bpSys, setBpSys] = useState(120);
  const [bpDia, setBpDia] = useState(80);
  const [pulse, setPulse] = useState(76);
  const [tempF, setTempF] = useState(98.4);
  const [spo2, setSpo2] = useState(99);
  const [diagnosis, setDiagnosis] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [rxItems, setRxItems] = useState<PrescriptionItem[]>([
    { id: '1', medicine_name: 'Atorvastatin 40mg', dosage: '40mg', frequency: '0-0-1 (Night)', timing: 'After food', duration_days: 30, total_quantity: 30, instructions: 'Take with water at bedtime' }
  ]);
  const [newDrugName, setNewDrugName] = useState('');
  const [newDrugDosage, setNewDrugDosage] = useState('500mg');
  const [newDrugFreq, setNewDrugFreq] = useState('1-0-1 (Twice daily)');
  const [newDrugDuration, setNewDrugDuration] = useState(5);

  const refreshList = () => {
    setAppointments(db.getAppointments(hospId, isSuper));
  };

  const filteredAppointments = appointments.filter(a => {
    const matchesSearch =
      a.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.patient_uhid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.doctor_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find(p => p.id === selectedPatientId);
    const doc = doctors.find(d => d.id === selectedDoctorId);
    if (!pat || !doc) return;

    const tokenNum = appointments.length + 101;
    const newApt: OpdAppointment = {
      id: `apt-${Date.now()}`,
      hospital_id: hospId || 'hosp-apex-01',
      patient_id: pat.id,
      patient_uhid: pat.uhid,
      patient_name: pat.name,
      patient_phone: pat.phone,
      doctor_id: doc.id,
      doctor_name: doc.name,
      department_name: doc.department_name,
      token_number: tokenNum,
      appointment_date: new Date().toISOString().slice(0, 10),
      appointment_time: '10:30 AM',
      type: appointmentType,
      status: 'checked_in',
      fee_amount: doc.consultation_fee,
      is_paid: true,
      created_at: new Date().toISOString()
    };

    db.saveAppointment(newApt);
    db.addAuditLog({
      hospital_id: hospId,
      hospital_name: activeHospital?.name,
      user_id: user?.id || 'usr-anon',
      user_email: user?.email || '',
      user_role: user?.role || 'receptionist',
      action: 'CREATE',
      module: 'OPD Queue',
      record_id: newApt.id,
      details: `Generated OPD Token #${tokenNum} for ${pat.name} under ${doc.name}`
    });

    refreshList();
    setShowBookModal(false);
  };

  const handleAddRxItem = () => {
    if (!newDrugName) return;
    const item: PrescriptionItem = {
      id: String(Date.now()),
      medicine_name: newDrugName,
      dosage: newDrugDosage,
      frequency: newDrugFreq,
      timing: 'After food',
      duration_days: Number(newDrugDuration),
      total_quantity: Number(newDrugDuration) * (newDrugFreq.includes('Twice') ? 2 : 1)
    };
    setRxItems([...rxItems, item]);
    setNewDrugName('');
  };

  const handleSaveConsultation = () => {
    if (!consultationAppt) return;
    const vitals: Vitals = {
      blood_pressure_sys: bpSys,
      blood_pressure_dia: bpDia,
      pulse_rate: pulse,
      temperature_f: tempF,
      spo2_percent: spo2,
      recorded_at: new Date().toISOString(),
      recorded_by: user?.full_name
    };

    const updatedAppt: OpdAppointment = {
      ...consultationAppt,
      status: 'completed',
      vitals,
      diagnosis: diagnosis || 'Essential Hypertension / Review Examination',
      doctor_notes: doctorNotes || 'Patient examined. Advised regular follow-up and dietary moderation.'
    };

    db.saveAppointment(updatedAppt);
    db.addAuditLog({
      hospital_id: hospId,
      hospital_name: activeHospital?.name,
      user_id: user?.id || 'usr-anon',
      user_email: user?.email || '',
      user_role: user?.role || 'doctor',
      action: 'UPDATE',
      module: 'Doctor Consultation Desk',
      record_id: consultationAppt.id,
      details: `Completed consultation for ${consultationAppt.patient_name} with diagnosis: ${updatedAppt.diagnosis}`
    });

    refreshList();
    setConsultationAppt(null);
  };

  const handlePrintPrescription = (apt: OpdAppointment) => {
    const html = `
      <div style="margin-bottom: 20px;">
        <div style="border-bottom: 1.5px solid #0f2444; padding-bottom: 8px; margin-bottom: 15px; display: flex; justify-content: space-between;">
          <div>
            <div style="font-size: 16px; font-weight: bold; color: #0f2444;">${apt.doctor_name}</div>
            <div style="font-size: 11px; color: #0284c7; font-weight: 600;">${apt.department_name}</div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            <div>TOKEN #${apt.token_number} | DATE: ${apt.appointment_date}</div>
          </div>
        </div>

        <div class="patient-box">
          <div><span class="label">Patient Name</span><span class="value">${apt.patient_name}</span></div>
          <div><span class="label">UHID</span><span class="value">${apt.patient_uhid}</span></div>
          <div><span class="label">Contact</span><span class="value">${apt.patient_phone}</span></div>
        </div>

        <div style="background: #f1f5f9; padding: 8px 12px; border-radius: 6px; margin-bottom: 15px; font-size: 11px; display: flex; gap: 20px;">
          <div><strong>BP:</strong> ${apt.vitals?.blood_pressure_sys || 120}/${apt.vitals?.blood_pressure_dia || 80} mmHg</div>
          <div><strong>Pulse:</strong> ${apt.vitals?.pulse_rate || 76} bpm</div>
          <div><strong>Temp:</strong> ${apt.vitals?.temperature_f || 98.4}°F</div>
          <div><strong>SpO2:</strong> ${apt.vitals?.spo2_percent || 99}%</div>
        </div>

        <div style="margin-bottom: 15px;">
          <div style="font-size: 12px; font-weight: bold; color: #0f2444; text-transform: uppercase; margin-bottom: 4px;">Primary Clinical Diagnosis</div>
          <div style="font-size: 13px; color: #0f172a; font-weight: 600; background: #fafafa; border-left: 3px solid #0284c7; padding: 6px 12px;">
            ${apt.diagnosis || 'Clinical Follow-up / Routine Consultation'}
          </div>
        </div>

        <div style="font-size: 14px; font-weight: bold; color: #0f2444; margin-bottom: 8px;">Rx - MEDICATIONS PRESCRIBED</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Medicine Name</th>
              <th>Dosage</th>
              <th>Frequency & Timing</th>
              <th>Duration</th>
              <th>Qty</th>
            </tr>
          </thead>
          <tbody>
            ${rxItems.map((item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${item.medicine_name}</strong></td>
                <td>${item.dosage}</td>
                <td>${item.frequency} (${item.timing})</td>
                <td>${item.duration_days} Days</td>
                <td>${item.total_quantity}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 15px; font-size: 12px; color: #334155;">
          <strong>Clinical Notes & Lifestyle Advice:</strong><br/>
          ${apt.doctor_notes || 'Continue prescribed medications without interruption. Maintain low-sodium diet and daily hydration.'}
        </div>
      </div>
    `;

    openPrintWindow('DIGITAL MEDICAL PRESCRIPTION', html, activeHospital || undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="purple" size="sm">OPD QUEUE & TOKENS</Badge>
            <span className="text-xs text-slate-400 font-mono">LIVE CLINICAL DESK</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Outpatient Department (OPD)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Live token queue, specialist scheduling, electronic vitals recording, and digital prescriptions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV(appointments, 'OPD_Queue_Appointments')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/60 border border-white/5 text-slate-300 hover:text-white hover:border-white/20 text-xs font-semibold transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowBookModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Issue OPD Token</span>
          </button>
        </div>
      </div>

      {/* Queue Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search Patient, UHID, Doctor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-mono">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="checked_in">Checked In</option>
            <option value="completed">Completed</option>
          </select>
          <span className="text-xs font-mono text-slate-500">{filteredAppointments.length} Tokens</span>
        </div>
      </div>

      {/* OPD Queue List Table */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 font-mono uppercase text-[11px]">
                <th className="pb-3 px-3">Token #</th>
                <th className="pb-3 px-3">Patient Details</th>
                <th className="pb-3 px-3">Assigned Doctor</th>
                <th className="pb-3 px-3">Visit Type</th>
                <th className="pb-3 px-3">Fee Status</th>
                <th className="pb-3 px-3">Consultation Status</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No OPD tokens in queue for this selection.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-mono font-bold text-sm">
                        #{apt.token_number}
                      </div>
                    </td>
                    <td className="py-4 px-3">
                      <div className="font-bold text-white text-sm">{apt.patient_name}</div>
                      <div className="text-[11px] font-mono text-blue-400">{apt.patient_uhid}</div>
                    </td>
                    <td className="py-4 px-3">
                      <div className="text-slate-200 font-medium">{apt.doctor_name}</div>
                      <div className="text-[10px] text-slate-400">{apt.department_name}</div>
                    </td>
                    <td className="py-4 px-3">
                      <span className="font-mono text-slate-300 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                        {apt.type}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <Badge variant="emerald" size="sm">
                        ₹{apt.fee_amount} PAID
                      </Badge>
                    </td>
                    <td className="py-4 px-3">
                      <Badge
                        variant={apt.status === 'completed' ? 'emerald' : apt.status === 'checked_in' ? 'amber' : 'slate'}
                        size="sm"
                        pulse={apt.status === 'checked_in'}
                      >
                        {apt.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-4 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {apt.status !== 'completed' && (
                          <button
                            onClick={() => setConsultationAppt(apt)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all text-xs"
                          >
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span>Consult Desk</span>
                          </button>
                        )}
                        <button
                          onClick={() => handlePrintPrescription(apt)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-[11px]"
                          title="Print Digital Prescription"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Rx</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book OPD Appointment Modal */}
      <Modal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        title="Issue New OPD Token"
        subtitle={`Generates queue token for ${activeHospital?.name}`}
      >
        <form onSubmit={handleBookAppointment} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Select Patient *</label>
            <select
              value={selectedPatientId}
              onChange={e => setSelectedPatientId(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.uhid})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Select Specialist Doctor *</label>
            <select
              value={selectedDoctorId}
              onChange={e => setSelectedDoctorId(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name} - {d.specialization} (Fee: ₹{d.consultation_fee})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Visit Type</label>
            <select
              value={appointmentType}
              onChange={e => setAppointmentType(e.target.value as any)}
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="New">New Consultation</option>
              <option value="Follow-up">Follow-up Review</option>
              <option value="Emergency">Emergency OPD</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowBookModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)]"
            >
              Generate Token & Collect Fee
            </button>
          </div>
        </form>
      </Modal>

      {/* Doctor Consultation Desk Modal */}
      {consultationAppt && (
        <Modal
          isOpen={!!consultationAppt}
          onClose={() => setConsultationAppt(null)}
          title={`Doctor Clinical Desk: ${consultationAppt.patient_name}`}
          subtitle={`Token #${consultationAppt.token_number} • ${consultationAppt.patient_uhid}`}
          maxWidth="4xl"
        >
          <div className="space-y-6 text-xs">
            {/* Vitals Recording Section */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5">
              <h4 className="font-mono uppercase text-blue-400 font-bold text-[11px] mb-3 flex items-center gap-2">
                <HeartPulse className="w-4 h-4" />
                <span>Patient Vitals Logging</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">BP Sys (mmHg)</label>
                  <input
                    type="number"
                    value={bpSys}
                    onChange={e => setBpSys(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">BP Dia (mmHg)</label>
                  <input
                    type="number"
                    value={bpDia}
                    onChange={e => setBpDia(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Pulse (bpm)</label>
                  <input
                    type="number"
                    value={pulse}
                    onChange={e => setPulse(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Temp (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tempF}
                    onChange={e => setTempF(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">SpO2 (%)</label>
                  <input
                    type="number"
                    value={spo2}
                    onChange={e => setSpo2(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Diagnosis & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Primary Clinical Diagnosis *</label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Coronary Syndrome / Essential Hypertension"
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Clinical Instructions & Notes</label>
                <input
                  type="text"
                  value={doctorNotes}
                  onChange={e => setDoctorNotes(e.target.value)}
                  placeholder="e.g. Advised 2D Echocardiogram, low salt diet"
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Prescription Items */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 space-y-3">
              <h4 className="font-mono uppercase text-teal-400 font-bold text-[11px] flex items-center gap-2">
                <Pill className="w-4 h-4" />
                <span>Electronic Rx - Prescribed Drugs</span>
              </h4>

              {/* Add Drug Row */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                <input
                  type="text"
                  placeholder="Drug Name (e.g. Ecosprin 75mg)"
                  value={newDrugName}
                  onChange={e => setNewDrugName(e.target.value)}
                  className="sm:col-span-2 bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:border-teal-500"
                />
                <input
                  type="text"
                  placeholder="Dosage (75mg)"
                  value={newDrugDosage}
                  onChange={e => setNewDrugDosage(e.target.value)}
                  className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:border-teal-500"
                />
                <select
                  value={newDrugFreq}
                  onChange={e => setNewDrugFreq(e.target.value)}
                  className="bg-slate-900 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white focus:border-teal-500"
                >
                  <option value="1-0-0 (Morning)">1-0-0 (Morning)</option>
                  <option value="1-0-1 (Twice daily)">1-0-1 (Twice daily)</option>
                  <option value="1-1-1 (Thrice daily)">1-1-1 (Thrice daily)</option>
                  <option value="0-0-1 (Night)">0-0-1 (Night)</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddRxItem}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs py-1.5"
                >
                  + Add Drug
                </button>
              </div>

              {/* Current Rx List */}
              <div className="space-y-1.5 pt-2">
                {rxItems.map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono">{idx + 1}.</span>
                      <strong className="text-white">{item.medicine_name}</strong>
                      <span className="text-slate-400">({item.dosage})</span>
                      <span className="text-teal-400 font-mono">• {item.frequency}</span>
                    </div>
                    <span className="font-mono text-slate-400">{item.duration_days} Days</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setConsultationAppt(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveConsultation}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)]"
              >
                Complete Consultation & Finalize Rx
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
