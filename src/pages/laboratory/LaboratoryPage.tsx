import React, { useState } from 'react';
import {
  Activity,
  Search,
  Plus,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FlaskConical,
  Eye,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/database';
import { LabOrder, LabTest, Patient, Doctor } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { exportToCSV } from '../../lib/exportService';
import { openPrintWindow } from '../../lib/printService';

export const LaboratoryPage: React.FC = () => {
  const { user, activeHospital } = useAuth();
  const hospId = activeHospital?.id;
  const isSuper = user?.is_super_admin;

  const [orders, setOrders] = useState<LabOrder[]>(db.getLabOrders(hospId, isSuper));
  const [tests] = useState<LabTest[]>(db.getLabTests(hospId, isSuper));
  const [patients] = useState<Patient[]>(db.getPatients(hospId, isSuper));
  const [doctors] = useState<Doctor[]>(db.getDoctors(hospId, isSuper));

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [resultEntryOrder, setResultEntryOrder] = useState<LabOrder | null>(null);

  // New Order State
  const [patientId, setPatientId] = useState(patients[0]?.id || '');
  const [doctorId, setDoctorId] = useState(doctors[0]?.id || '');
  const [testId, setTestId] = useState(tests[0]?.id || '');

  // Result Entry State
  const [resultValue, setResultValue] = useState('');
  const [resultUnit, setResultUnit] = useState('mg/dL');
  const [referenceRange, setReferenceRange] = useState('70 - 100 mg/dL');
  const [isAbnormal, setIsAbnormal] = useState(false);
  const [pathologistRemarks, setPathologistRemarks] = useState('');

  const refreshList = () => {
    setOrders(db.getLabOrders(hospId, isSuper));
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      o.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.patient_uhid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.test_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find(p => p.id === patientId);
    const doc = doctors.find(d => d.id === doctorId);
    const test = tests.find(t => t.id === testId);
    if (!pat || !doc || !test) return;

    const orderNo = `LAB-ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: LabOrder = {
      id: `labord-${Date.now()}`,
      hospital_id: hospId || 'hosp-apex-01',
      order_number: orderNo,
      patient_id: pat.id,
      patient_uhid: pat.uhid,
      patient_name: pat.name,
      doctor_name: doc.name,
      test_id: test.id,
      test_name: test.name,
      category: test.category,
      ordered_at: new Date().toISOString(),
      status: 'sample_collected'
    };

    db.saveLabOrder(newOrder);
    db.addAuditLog({
      hospital_id: hospId,
      hospital_name: activeHospital?.name,
      user_id: user?.id || 'usr-anon',
      user_email: user?.email || '',
      user_role: user?.role || 'lab_technician',
      action: 'CREATE',
      module: 'Pathology Laboratory',
      record_id: newOrder.id,
      details: `Ordered ${test.name} for ${pat.name} (${orderNo})`
    });

    refreshList();
    setShowOrderModal(false);
  };

  const handleSaveResult = () => {
    if (!resultEntryOrder) return;

    const updated: LabOrder = {
      ...resultEntryOrder,
      status: 'completed',
      result_value: resultValue || '14.2',
      result_unit: resultUnit,
      reference_range: referenceRange,
      is_abnormal: isAbnormal,
      verified_by: user?.full_name || 'Dr. Sunita Gupta (Chief Pathologist)',
      verified_at: new Date().toISOString(),
      pathologist_remarks: pathologistRemarks || 'Specimen processed using automated analyzer. Internal QC verified.'
    };

    db.saveLabOrder(updated);
    db.addAuditLog({
      hospital_id: hospId,
      hospital_name: activeHospital?.name,
      user_id: user?.id || 'usr-anon',
      user_email: user?.email || '',
      user_role: user?.role || 'lab_technician',
      action: 'UPDATE',
      module: 'Pathology Laboratory',
      record_id: resultEntryOrder.id,
      details: `Entered diagnostic results for ${resultEntryOrder.patient_name} - ${resultEntryOrder.test_name}`
    });

    refreshList();
    setResultEntryOrder(null);
  };

  const handlePrintLabReport = (order: LabOrder) => {
    const html = `
      <div style="margin-bottom: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #0f2444; padding-bottom: 8px; margin-bottom: 15px;">
          <div style="font-size: 16px; font-weight: 800; color: #0f2444;">VERIFIED PATHOLOGY DIAGNOSTIC REPORT</div>
          <div style="font-size: 11px; color: #0284c7; font-weight: 600;">NABL ACCREDITED CENTRAL CLINICAL LABORATORY</div>
        </div>

        <div class="patient-box">
          <div><span class="label">Patient Name</span><span class="value">${order.patient_name}</span></div>
          <div><span class="label">UHID</span><span class="value">${order.patient_uhid}</span></div>
          <div><span class="label">Lab Order No</span><span class="value">${order.order_number}</span></div>
          <div><span class="label">Referring Doctor</span><span class="value">${order.doctor_name}</span></div>
          <div><span class="label">Sample Collected</span><span class="value">${new Date(order.ordered_at).toLocaleString()}</span></div>
          <div><span class="label">Report Verified</span><span class="value">${order.verified_at ? new Date(order.verified_at).toLocaleString() : 'N/A'}</span></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Investigation Parameter</th>
              <th>Observed Result</th>
              <th>Reference Interval</th>
              <th>Unit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${order.test_name}</strong></td>
              <td style="font-size: 14px; font-weight: bold; color: ${order.is_abnormal ? '#ef4444' : '#0f172a'};">
                ${order.result_value || 'Normal'}
              </td>
              <td>${order.reference_range || 'Normal'}</td>
              <td>${order.result_unit || ''}</td>
              <td>
                <span style="color: ${order.is_abnormal ? '#ef4444' : '#16a34a'}; font-weight: bold;">
                  ${order.is_abnormal ? '⚠️ ABNORMAL / HIGH' : 'NORMAL'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 15px; font-size: 12px; color: #334155; background: #f8fafc; padding: 10px; border-radius: 6px;">
          <strong>Pathologist Remarks:</strong><br/>
          ${order.pathologist_remarks || 'Findings correlate clinically. Correlate with serial enzyme markers.'}
        </div>

        <div style="margin-top: 25px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div style="font-size: 10px; color: #64748b;">
            System Generated Electronic Pathology Record<br/>
            COROT LABORATORY INFORMATION SYSTEM (LIS)
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; font-weight: bold; color: #0f2444;">${order.verified_by || 'Dr. Sunita Gupta'}</div>
            <div style="font-size: 10px; color: #64748b;">MD (Pathology) • Chief Pathologist</div>
          </div>
        </div>
      </div>
    `;

    openPrintWindow('PATHOLOGY DIAGNOSTIC REPORT', html, activeHospital || undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="cyan" size="sm">PATHOLOGY & BIOCHEMISTRY</Badge>
            <span className="text-xs text-slate-400 font-mono">NABL COMPLIANT LIS</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Laboratory & Pathology</h1>
          <p className="text-xs text-slate-400 mt-1">
            Sample accessioning, automated analyzer result entry, reference interval checks, and electronic reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV(orders, 'Laboratory_Orders_Log')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/60 border border-white/5 text-slate-300 hover:text-white text-xs font-semibold"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Orders CSV</span>
          </button>

          <button
            onClick={() => setShowOrderModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)]"
          >
            <Plus className="w-4 h-4" />
            <span>Order Lab Test</span>
          </button>
        </div>
      </div>

      {/* Orders Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search Patient, UHID, Test or Order No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-mono">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="All">All Orders</option>
            <option value="pending">Pending</option>
            <option value="sample_collected">Sample Collected</option>
            <option value="completed">Completed / Verified</option>
          </select>
          <span className="text-xs font-mono text-slate-500">{filteredOrders.length} Orders</span>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 font-mono uppercase text-[11px]">
                <th className="pb-3 px-3">Order No & Date</th>
                <th className="pb-3 px-3">Patient & UHID</th>
                <th className="pb-3 px-3">Test Investigation</th>
                <th className="pb-3 px-3">Doctor</th>
                <th className="pb-3 px-3">Observed Result</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-3">
                    <div className="font-mono font-bold text-white">{order.order_number}</div>
                    <div className="text-[10px] text-slate-400">{new Date(order.ordered_at).toLocaleDateString()}</div>
                  </td>
                  <td className="py-4 px-3">
                    <div className="font-bold text-white text-sm">{order.patient_name}</div>
                    <div className="text-[10px] font-mono text-blue-400">{order.patient_uhid}</div>
                  </td>
                  <td className="py-4 px-3">
                    <div className="text-white font-medium">{order.test_name}</div>
                    <div className="text-[10px] text-slate-400">{order.category}</div>
                  </td>
                  <td className="py-4 px-3 text-slate-300">{order.doctor_name}</td>
                  <td className="py-4 px-3 font-mono">
                    {order.result_value ? (
                      <span className={order.is_abnormal ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {order.result_value} {order.result_unit} {order.is_abnormal && '(HIGH)'}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Awaiting Analyzer</span>
                    )}
                  </td>
                  <td className="py-4 px-3">
                    <Badge
                      variant={order.status === 'completed' ? 'emerald' : order.status === 'sample_collected' ? 'amber' : 'slate'}
                      size="sm"
                    >
                      {order.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-4 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {order.status !== 'completed' && (
                        <button
                          onClick={() => {
                            setResultEntryOrder(order);
                            const t = tests.find(x => x.name === order.test_name);
                            if (t) {
                              setResultUnit(t.unit);
                              setReferenceRange(t.reference_range);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600 hover:text-white font-semibold text-[11px]"
                        >
                          Enter Result
                        </button>
                      )}
                      <button
                        onClick={() => handlePrintLabReport(order)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                        title="Print Diagnostic Report"
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

      {/* Order Test Modal */}
      <Modal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        title="Order Diagnostic Pathology Investigation"
        subtitle={`Generates lab order in ${activeHospital?.name}`}
      >
        <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
          <div>
            <label className="block font-mono uppercase text-slate-400 mb-1">Select Patient *</label>
            <select
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-cyan-500 cursor-pointer"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.uhid})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-mono uppercase text-slate-400 mb-1">Prescribing Doctor *</label>
            <select
              value={doctorId}
              onChange={e => setDoctorId(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-cyan-500 cursor-pointer"
            >
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-mono uppercase text-slate-400 mb-1">Select Lab Test Investigation *</label>
            <select
              value={testId}
              onChange={e => setTestId(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-cyan-500 cursor-pointer"
            >
              {tests.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.category} - ₹{t.price})</option>
              ))}
            </select>
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
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
            >
              Generate Lab Order
            </button>
          </div>
        </form>
      </Modal>

      {/* Result Entry Modal */}
      {resultEntryOrder && (
        <Modal
          isOpen={!!resultEntryOrder}
          onClose={() => setResultEntryOrder(null)}
          title={`Pathology Result Entry: ${resultEntryOrder.test_name}`}
          subtitle={`Patient: ${resultEntryOrder.patient_name} • Order #${resultEntryOrder.order_number}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono uppercase text-slate-400 mb-1">Observed Numeric / Text Value *</label>
                <input
                  type="text"
                  required
                  value={resultValue}
                  onChange={e => setResultValue(e.target.value)}
                  placeholder="e.g. 14.2 or Positive"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block font-mono uppercase text-slate-400 mb-1">Unit of Measure</label>
                <input
                  type="text"
                  value={resultUnit}
                  onChange={e => setResultUnit(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Reference Biological Interval</label>
              <input
                type="text"
                value={referenceRange}
                onChange={e => setReferenceRange(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-900/60 p-3 rounded-xl border border-white/5">
              <input
                type="checkbox"
                id="abnormalCheck"
                checked={isAbnormal}
                onChange={e => setIsAbnormal(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
              />
              <label htmlFor="abnormalCheck" className="text-white font-medium cursor-pointer">
                Flag as <strong className="text-rose-400">Critical / Abnormal Value</strong> (Requires Doctor Alert)
              </label>
            </div>

            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Pathologist Remarks / Impression</label>
              <textarea
                rows={2}
                value={pathologistRemarks}
                onChange={e => setPathologistRemarks(e.target.value)}
                placeholder="e.g. Normocytic normochromic blood picture."
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setResultEntryOrder(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveResult}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
              >
                Verify & Publish Report
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
