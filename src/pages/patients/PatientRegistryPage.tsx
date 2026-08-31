import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Printer,
  FileSpreadsheet,
  QrCode,
  Heart,
  AlertCircle,
  FileText,
  Eye,
  Shield,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/database';
import { Patient } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { exportToCSV } from '../../lib/exportService';
import { openPrintWindow } from '../../lib/printService';

export const PatientRegistryPage: React.FC = () => {
  const { user, activeHospital } = useAuth();
  const hospId = activeHospital?.id;
  const isSuper = user?.is_super_admin;

  const [patients, setPatients] = useState<Patient[]>(db.getPatients(hospId, isSuper));
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('All');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [dob, setDob] = useState('1990-01-01');
  const [age, setAge] = useState(36);
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState(activeHospital?.city || 'Mumbai');
  const [state, setState] = useState(activeHospital?.state || 'Maharashtra');
  const [pin, setPin] = useState('400001');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [allergiesText, setAllergiesText] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insurancePolicyNo, setInsurancePolicyNo] = useState('');

  const refreshList = () => {
    setPatients(db.getPatients(hospId, isSuper));
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.uhid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery);
    const matchesGender = genderFilter === 'All' || p.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const hospCode = activeHospital?.code || 'COROT';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const generatedUhid = `${hospCode}-UHID-2026-${randomNum}`;

    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      hospital_id: hospId || 'hosp-apex-01',
      uhid: generatedUhid,
      name,
      gender,
      dob,
      age: Number(age),
      blood_group: bloodGroup,
      phone,
      email,
      address,
      city,
      state,
      pin,
      emergency_contact: emergencyContact || phone,
      allergies: allergiesText ? allergiesText.split(',').map(s => s.trim()) : [],
      medical_history: medicalHistory || 'None reported at time of registration.',
      existing_conditions: [],
      insurance_provider: insuranceProvider,
      insurance_policy_no: insurancePolicyNo,
      registered_at: new Date().toISOString(),
      status: 'active'
    };

    db.savePatient(newPatient);
    db.addAuditLog({
      hospital_id: hospId,
      hospital_name: activeHospital?.name,
      user_id: user?.id || 'usr-anon',
      user_email: user?.email || '',
      user_role: user?.role || 'receptionist',
      action: 'CREATE',
      module: 'Patient Registry',
      record_id: newPatient.id,
      details: `Generated new UHID ${generatedUhid} for Patient ${name} (${gender}, ${age}y)`
    });

    refreshList();
    setShowRegisterModal(false);
    // Reset Form
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setAllergiesText('');
    setMedicalHistory('');
  };

  const handlePrintPatientCard = (patient: Patient) => {
    const html = `
      <div style="max-width: 500px; margin: 0 auto; border: 2px solid #0f2444; border-radius: 12px; padding: 20px; background: #ffffff;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f2444; padding-bottom: 10px; margin-bottom: 15px;">
          <div>
            <div style="font-size: 14px; font-weight: 800; color: #0f2444; text-transform: uppercase;">COROT DIGITAL HEALTH ID</div>
            <div style="font-size: 10px; color: #0284c7; font-weight: 600;">LONGITUDINAL PATIENT IDENTIFIER</div>
          </div>
          <div style="background: #0f2444; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; font-family: monospace;">
            BLOOD: ${patient.blood_group}
          </div>
        </div>

        <div style="display: flex; gap: 15px; margin-bottom: 15px;">
          <div style="width: 80px; height: 80px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 28px; color: #64748b;">
            👤
          </div>
          <div style="flex: 1;">
            <div style="font-size: 16px; font-weight: bold; color: #0f172a;">${patient.name}</div>
            <div style="font-size: 12px; color: #334155; margin-top: 2px;">
              ${patient.gender} • ${patient.age} Years (DOB: ${patient.dob})
            </div>
            <div style="font-size: 12px; color: #334155; margin-top: 2px;">
              📞 ${patient.phone}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              📍 ${patient.city}, ${patient.state} - ${patient.pin}
            </div>
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; font-size: 11px;">
          <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">UNIQUE HEALTHCARE IDENTIFIER (UHID)</div>
          <div style="font-size: 14px; font-weight: bold; color: #0f2444; font-family: monospace; letter-spacing: 0.5px;">
            ${patient.uhid}
          </div>
        </div>

        ${patient.allergies.length > 0 ? `
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 6px 10px; margin-bottom: 10px; font-size: 11px; color: #991b1b;">
            <strong>⚠️ CRITICAL ALLERGIES:</strong> ${patient.allergies.join(', ')}
          </div>
        ` : ''}

        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
          <div>Emergency: ${patient.emergency_contact}</div>
          <div>Issued: ${new Date(patient.registered_at).toLocaleDateString()}</div>
        </div>
      </div>
    `;

    openPrintWindow('PATIENT HEALTH IDENTITY CARD', html, activeHospital || undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="blue" size="sm">PATIENT EMR REGISTRY</Badge>
            <span className="text-xs text-slate-400 font-mono">SCOPED TO {activeHospital?.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Patient Registry & UHID Master</h1>
          <p className="text-xs text-slate-400 mt-1">
            Universal Health Identification, demographics, longitudinal clinical history, and verifiable patient cards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV(patients, 'Patients_Master_Registry')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/60 border border-white/5 text-slate-300 hover:text-white hover:border-white/20 text-xs font-semibold transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register Patient</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search Name, UHID or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-mono">Gender:</span>
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="All">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <span className="text-xs font-mono text-slate-500">{filteredPatients.length} Records</span>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 font-mono uppercase text-[11px]">
                <th className="pb-3 px-3">UHID & Name</th>
                <th className="pb-3 px-3">Demographics</th>
                <th className="pb-3 px-3">Blood Group</th>
                <th className="pb-3 px-3">Contact & City</th>
                <th className="pb-3 px-3">Allergies & Alerts</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No matching patient records found in this hospital scope.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-3">
                      <div className="font-bold text-white text-sm">{patient.name}</div>
                      <div className="text-[11px] font-mono text-blue-400 font-semibold tracking-wide">
                        {patient.uhid}
                      </div>
                    </td>
                    <td className="py-4 px-3">
                      <div className="text-slate-200 font-medium">{patient.gender}, {patient.age}y</div>
                      <div className="text-[10px] text-slate-400">DOB: {patient.dob}</div>
                    </td>
                    <td className="py-4 px-3">
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {patient.blood_group}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <div className="text-slate-300 font-mono">{patient.phone}</div>
                      <div className="text-[10px] text-slate-400">{patient.city}, {patient.state}</div>
                    </td>
                    <td className="py-4 px-3">
                      {patient.allergies.length > 0 ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium">
                          ⚠️ {patient.allergies.join(', ')}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">No known drug allergies</span>
                      )}
                    </td>
                    <td className="py-4 px-3">
                      <Badge
                        variant={patient.status === 'admitted' ? 'purple' : 'emerald'}
                        size="sm"
                        pulse={patient.status === 'admitted'}
                      >
                        {patient.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-4 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedPatient(patient)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                          title="View Longitudinal Health Record"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintPatientCard(patient)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white font-semibold transition-all text-[11px]"
                          title="Print Patient Card"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Card</span>
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

      {/* Register Patient Modal */}
      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title="Register New Patient"
        subtitle={`Generates verifiable UHID under ${activeHospital?.name}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleRegisterPatient} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Sumanth Narang"
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Gender *</label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as any)}
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={e => setDob(e.target.value)}
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Age (Years) *</label>
              <input
                type="number"
                required
                value={age}
                onChange={e => setAge(Number(e.target.value))}
                min="0"
                max="120"
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Blood Group *</label>
              <select
                value={bloodGroup}
                onChange={e => setBloodGroup(e.target.value)}
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Mobile Phone *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98XXX XXXXX"
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Emergency Contact</label>
              <input
                type="text"
                value={emergencyContact}
                onChange={e => setEmergencyContact(e.target.value)}
                placeholder="Relative Name & Phone"
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Residential Address</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Flat No, Building, Street"
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Known Allergies (Comma Separated)</label>
              <input
                type="text"
                value={allergiesText}
                onChange={e => setAllergiesText(e.target.value)}
                placeholder="e.g. Penicillin, Sulfa, Aspirin"
                className="w-full bg-slate-900/80 border border-rose-500/30 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Insurance / TPA Provider</label>
              <input
                type="text"
                value={insuranceProvider}
                onChange={e => setInsuranceProvider(e.target.value)}
                placeholder="e.g. Star Health / HDFC Ergo"
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowRegisterModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)]"
            >
              Register & Generate UHID
            </button>
          </div>
        </form>
      </Modal>

      {/* View Patient Longitudinal Record Modal */}
      {selectedPatient && (
        <Modal
          isOpen={!!selectedPatient}
          onClose={() => setSelectedPatient(null)}
          title={`Longitudinal Health Record: ${selectedPatient.name}`}
          subtitle={`UHID: ${selectedPatient.uhid}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-white/5">
              <div>
                <span className="text-slate-500 font-mono uppercase block text-[10px]">Age / Gender</span>
                <strong className="text-white text-sm">{selectedPatient.age}y / {selectedPatient.gender}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-mono uppercase block text-[10px]">Blood Group</span>
                <strong className="text-rose-400 text-sm">{selectedPatient.blood_group}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-mono uppercase block text-[10px]">Phone</span>
                <strong className="text-white text-sm">{selectedPatient.phone}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-mono uppercase block text-[10px]">Current Status</span>
                <Badge variant={selectedPatient.status === 'admitted' ? 'purple' : 'emerald'} size="sm">
                  {selectedPatient.status.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 space-y-2">
              <h4 className="font-mono uppercase text-blue-400 font-bold text-[11px]">Clinical Background & Allergies</h4>
              <p className="text-slate-300">
                <strong>Medical History:</strong> {selectedPatient.medical_history || 'No chronic history recorded.'}
              </p>
              {selectedPatient.allergies.length > 0 ? (
                <p className="text-rose-300 font-medium">
                  <strong>⚠️ Drug Allergies:</strong> {selectedPatient.allergies.join(', ')}
                </p>
              ) : (
                <p className="text-slate-500 font-mono">No known allergies.</p>
              )}
            </div>

            {selectedPatient.insurance_provider && (
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5">
                <h4 className="font-mono uppercase text-emerald-400 font-bold text-[11px] mb-1">Insurance & Cashless Details</h4>
                <div className="text-slate-300">
                  <span>Provider: <strong>{selectedPatient.insurance_provider}</strong></span> • <span>Policy: <strong>{selectedPatient.insurance_policy_no || 'N/A'}</strong></span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
              <button
                onClick={() => handlePrintPatientCard(selectedPatient)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold"
              >
                <Printer className="w-4 h-4" />
                <span>Print Physical ID Card</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
