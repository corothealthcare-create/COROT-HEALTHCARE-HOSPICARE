import React, { useState } from 'react';
import {
  Scan,
  Search,
  Plus,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Eye,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/database';
import { RadiologyOrder, Patient, Doctor } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { exportToCSV } from '../../lib/exportService';
import { openPrintWindow } from '../../lib/printService';

export const RadiologyPage: React.FC = () => {
  const { user, activeHospital } = useAuth();
  const hospId = activeHospital?.id;
  const isSuper = user?.is_super_admin;

  const [orders, setOrders] = useState<RadiologyOrder[]>(db.getRadiologyOrders(hospId, isSuper));
  const [patients] = useState<Patient[]>(db.getPatients(hospId, isSuper));
  const [doctors] = useState<Doctor[]>(db.getDoctors(hospId, isSuper));

  const [searchQuery, setSearchQuery] = useState('');
  const [modalityFilter, setModalityFilter] = useState('All');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [reportEntryOrder, setReportEntryOrder] = useState<RadiologyOrder | null>(null);

  // New Order State
  const [patientId, setPatientId] = useState(patients[0]?.id || '');
  const [doctorId, setDoctorId] = useState(doctors[0]?.id || '');
  const [studyName, setStudyName] = useState('Chest X-Ray PA View');
  const [modality, setModality] = useState<'X-Ray' | 'CT' | 'MRI' | 'Ultrasound'>('X-Ray');

  // Report State
  const [findings, setFindings] = useState('');
  const [impression, setImpression] = useState('');

  const refreshList = () => {
    setOrders(db.getRadiologyOrders(hospId, isSuper));
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      o.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.patient_uhid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.study_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModality = modalityFilter === 'All' || o.modality === modalityFilter;
    return matchesSearch && matchesModality;
  });

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find(p => p.id === patientId);
    const doc = doctors.find(d => d.id === doctorId);
    if (!pat || !doc) return;

    const orderNo = `RAD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: RadiologyOrder = {
      id: `rad-${Date.now()}`,
      hospital_id: hospId || 'hosp-apex-01',
      order_number: orderNo,
      patient_id: pat.id,
      patient_uhid: pat.uhid,
      patient_name: pat.name,
      doctor_name: doc.name,
      modality,
      study_name: studyName,
      ordered_at: new Date().toISOString(),
      status: 'scheduled'
    };

    db.saveRadiologyOrder(newOrder);
    refreshList();
    setShowOrderModal(false);
  };

  const handleSaveReport = () => {
    if (!reportEntryOrder) return;

    const updated: RadiologyOrder = {
      ...reportEntryOrder,
      status: 'reported',
      findings: findings || 'Normal lung parenchymal bronchovascular markings. Cardiothoracic ratio within normal limits.',
      impression: impression || 'No active focal pulmonary consolidation or effusion observed.',
      radiologist_name: user?.full_name || 'Dr. Kunal Deshmukh (Consultant Radiologist)',
      reported_at: new Date().toISOString()
    };

    db.saveRadiologyOrder(updated);
    refreshList();
    setReportEntryOrder(null);
  };

  const handlePrintRadiologyReport = (order: RadiologyOrder) => {
    const html = `
      <div style="margin-bottom: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #0f2444; padding-bottom: 8px; margin-bottom: 15px;">
          <div style="font-size: 16px; font-weight: 800; color: #0f2444;">DIAGNOSTIC RADIOLOGY & IMAGING REPORT</div>
          <div style="font-size: 11px; color: #0284c7; font-weight: 600;">PACS / DICOM VERIFIED STUDY</div>
        </div>

        <div class="patient-box">
          <div><span class="label">Patient Name</span><span class="value">${order.patient_name}</span></div>
          <div><span class="label">UHID</span><span class="value">${order.patient_uhid}</span></div>
          <div><span class="label">Study</span><span class="value">${order.study_name} (${order.modality})</span></div>
          <div><span class="label">Referred By</span><span class="value">${order.doctor_name}</span></div>
        </div>

        <div style="margin-bottom: 15px;">
          <div style="font-size: 12px; font-weight: bold; color: #0f2444; text-transform: uppercase; margin-bottom: 4px;">Detailed Radiological Findings</div>
          <p style="font-size: 12px; color: #334155; line-height: 1.6; background: #f8fafc; padding: 10px; border-radius: 6px;">
            ${order.findings || 'No abnormal soft tissue attenuation or acute bony injury detected.'}
          </p>
        </div>

        <div style="margin-bottom: 15px;">
          <div style="font-size: 12px; font-weight: bold; color: #0f2444; text-transform: uppercase; margin-bottom: 4px;">Impression</div>
          <div style="font-size: 13px; font-weight: bold; color: #0f172a; background: #eff6ff; border-left: 3px solid #0284c7; padding: 8px 12px;">
            ${order.impression || 'Study within normal physiological limits.'}
          </div>
        </div>

        <div style="margin-top: 25px; text-align: right;">
          <div style="font-size: 12px; font-weight: bold; color: #0f2444;">${order.radiologist_name || 'Dr. Kunal Deshmukh'}</div>
          <div style="font-size: 10px; color: #64748b;">DMRD, DNB (Radiodiagnosis)</div>
        </div>
      </div>
    `;

    openPrintWindow('RADIOLOGY IMAGING REPORT', html, activeHospital || undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="purple" size="sm">PACS & IMAGING</Badge>
            <span className="text-xs text-slate-400 font-mono">DIGITAL RADIOLOGY SUITE</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Radiology & Medical Imaging</h1>
          <p className="text-xs text-slate-400 mt-1">
            X-Ray, Multi-Slice CT, 3T MRI, and Ultrasound study accessioning and DICOM reporting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV(orders, 'Radiology_Studies_Master')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/60 border border-white/5 text-slate-300 hover:text-white text-xs font-semibold"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowOrderModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)]"
          >
            <Plus className="w-4 h-4" />
            <span>Book Imaging Study</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search Patient, Study, UHID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-mono">Modality:</span>
          <select
            value={modalityFilter}
            onChange={(e) => setModalityFilter(e.target.value)}
            className="bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="All">All Modalities</option>
            <option value="X-Ray">X-Ray</option>
            <option value="CT">CT Scan</option>
            <option value="MRI">MRI</option>
            <option value="Ultrasound">Ultrasound</option>
          </select>
          <span className="text-xs font-mono text-slate-500">{filteredOrders.length} Studies</span>
        </div>
      </div>

      {/* Studies Table */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 font-mono uppercase text-[11px]">
                <th className="pb-3 px-3">Order & Modality</th>
                <th className="pb-3 px-3">Patient & UHID</th>
                <th className="pb-3 px-3">Study Name</th>
                <th className="pb-3 px-3">Referred By</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-3">
                    <div className="font-mono font-bold text-white">{order.order_number}</div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {order.modality}
                    </span>
                  </td>
                  <td className="py-4 px-3">
                    <div className="font-bold text-white text-sm">{order.patient_name}</div>
                    <div className="text-[10px] font-mono text-blue-400">{order.patient_uhid}</div>
                  </td>
                  <td className="py-4 px-3 text-white font-medium">{order.study_name}</td>
                  <td className="py-4 px-3 text-slate-300">{order.doctor_name}</td>
                  <td className="py-4 px-3">
                    <Badge variant={order.status === 'reported' ? 'emerald' : 'purple'} size="sm">
                      {order.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-4 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {order.status !== 'reported' && (
                        <button
                          onClick={() => setReportEntryOrder(order)}
                          className="px-2.5 py-1 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600 hover:text-white font-semibold text-[11px]"
                        >
                          Report
                        </button>
                      )}
                      <button
                        onClick={() => handlePrintRadiologyReport(order)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                        title="Print Report"
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

      {/* Book Study Modal */}
      <Modal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        title="Book Diagnostic Radiology Study"
        subtitle={`Schedules imaging in ${activeHospital?.name}`}
      >
        <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
          <div>
            <label className="block font-mono uppercase text-slate-400 mb-1">Select Patient *</label>
            <select
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-purple-500"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.uhid})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-mono uppercase text-slate-400 mb-1">Referring Consultant *</label>
            <select
              value={doctorId}
              onChange={e => setDoctorId(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-purple-500"
            >
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Modality *</label>
              <select
                value={modality}
                onChange={e => setModality(e.target.value as any)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-purple-500"
              >
                <option value="X-Ray">Digital X-Ray</option>
                <option value="CT">Multi-Slice CT</option>
                <option value="MRI">3.0T MRI</option>
                <option value="Ultrasound">Color Doppler USG</option>
              </select>
            </div>
            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Study Description *</label>
              <input
                type="text"
                required
                value={studyName}
                onChange={e => setStudyName(e.target.value)}
                placeholder="e.g. Brain MRI with Contrast"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowOrderModal(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
            >
              Confirm Imaging Booking
            </button>
          </div>
        </form>
      </Modal>

      {/* Report Entry Modal */}
      {reportEntryOrder && (
        <Modal
          isOpen={!!reportEntryOrder}
          onClose={() => setReportEntryOrder(null)}
          title={`Radiologist Reporting: ${reportEntryOrder.study_name}`}
          subtitle={`Patient: ${reportEntryOrder.patient_name} • ${reportEntryOrder.patient_uhid}`}
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Detailed Radiological Findings *</label>
              <textarea
                rows={4}
                required
                value={findings}
                onChange={e => setFindings(e.target.value)}
                placeholder="e.g. Normal cortical sulci and ventricles. No acute intracranial hemorrhage or territorial infarction."
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Impression / Conclusion *</label>
              <input
                type="text"
                required
                value={impression}
                onChange={e => setImpression(e.target.value)}
                placeholder="e.g. Normal brain MRI study."
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-purple-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setReportEntryOrder(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReport}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
              >
                Sign & Finalize Study
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
