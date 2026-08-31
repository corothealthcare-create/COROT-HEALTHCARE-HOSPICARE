import React, { useState } from 'react';
import {
  HeartHandshake,
  Search,
  Plus,
  Printer,
  FileSpreadsheet,
  Droplet,
  CheckCircle2,
  AlertTriangle,
  User,
  Heart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/database';
import { BloodStock, Patient } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { exportToCSV } from '../../lib/exportService';

export const BloodBankPage: React.FC = () => {
  const { user, activeHospital } = useAuth();
  const hospId = activeHospital?.id;
  const isSuper = user?.is_super_admin;

  const [bloodStock, setBloodStock] = useState<BloodStock[]>(db.getBloodStock(hospId, isSuper));
  const [patients] = useState<Patient[]>(db.getPatients(hospId, isSuper));
  const [showDonorModal, setShowDonorModal] = useState(false);

  // Donor Form State
  const [donorName, setDonorName] = useState('');
  const [donorGroup, setDonorGroup] = useState('O+');
  const [component, setComponent] = useState<'PRBC' | 'FFP' | 'Platelets' | 'Whole Blood'>('PRBC');
  const [units, setUnits] = useState(1);

  const refreshList = () => {
    setBloodStock(db.getBloodStock(hospId, isSuper));
  };

  const totalUnits = bloodStock.reduce((acc, b) => acc + b.units_available, 0);

  const handleAddDonation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName) return;

    const existing = bloodStock.find(b => b.blood_group === donorGroup && b.component === component);
    if (existing) {
      const updated: BloodStock = {
        ...existing,
        units_available: existing.units_available + Number(units)
      };
      db.saveBloodStock(updated);
    } else {
      const newStock: BloodStock = {
        id: `blood-${Date.now()}`,
        hospital_id: hospId || 'hosp-apex-01',
        blood_group: donorGroup,
        component,
        units_available: Number(units),
        expiry_date: '2026-10-15',
        status: 'tested_safe'
      };
      db.saveBloodStock(newStock);
    }

    refreshList();
    setShowDonorModal(false);
    setDonorName('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="rose" size="sm">TRANSFUSION MEDICINE</Badge>
            <span className="text-xs text-slate-400 font-mono">NABH ACCREDITED BLOOD BANK</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Blood Bank & Component Separation</h1>
          <p className="text-xs text-slate-400 mt-1">
            PRBC, Platelets, FFP, cross-matching compatibility, voluntary donors, and emergency release protocol.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV(bloodStock, 'Blood_Bank_Inventory')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/60 border border-white/5 text-slate-300 hover:text-white text-xs font-semibold"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Stock CSV</span>
          </button>

          <button
            onClick={() => setShowDonorModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(244,63,94,0.4)]"
          >
            <Plus className="w-4 h-4" />
            <span>Register Blood Donation</span>
          </button>
        </div>
      </div>

      {/* Blood Inventory Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-4">
          <div className="text-xs text-rose-400 font-mono font-bold">TOTAL UNITS</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">{totalUnits} Bags</div>
        </div>
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-mono">PRBC (PACKED CELLS)</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">
            {bloodStock.filter(b => b.component === 'PRBC').reduce((a, b) => a + b.units_available, 0)} Units
          </div>
        </div>
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4">
          <div className="text-xs text-amber-400 font-mono">FFP (PLASMA)</div>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-1">
            {bloodStock.filter(b => b.component === 'FFP').reduce((a, b) => a + b.units_available, 0)} Units
          </div>
        </div>
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4">
          <div className="text-xs text-purple-400 font-mono">PLATELETS (RDP)</div>
          <div className="text-2xl font-bold text-purple-400 font-mono mt-1">
            {bloodStock.filter(b => b.component === 'Platelets').reduce((a, b) => a + b.units_available, 0)} Units
          </div>
        </div>
      </div>

      {/* Blood Group Matrix Grid */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-4">
          Blood Group Availability Matrix
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => {
            const count = bloodStock.filter(b => b.blood_group === bg).reduce((acc, b) => acc + b.units_available, 0);
            return (
              <div key={bg} className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 text-center">
                <div className="text-xl font-black text-rose-500 font-mono">{bg}</div>
                <div className="text-lg font-bold text-white font-mono mt-1">{count} Bags</div>
                <span className="text-[10px] text-slate-500 block mt-1">Tested Safe</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stock Units Table */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 font-mono uppercase text-[11px]">
                <th className="pb-3 px-3">Blood Group</th>
                <th className="pb-3 px-3">Component Type</th>
                <th className="pb-3 px-3">Available Bags</th>
                <th className="pb-3 px-3">Expiration Date</th>
                <th className="pb-3 px-3">Quality Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bloodStock.map((b) => (
                <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-3 font-mono font-bold text-rose-400 text-sm">{b.blood_group}</td>
                  <td className="py-4 px-3 text-white font-medium">{b.component}</td>
                  <td className="py-4 px-3 font-mono text-white font-bold">{b.units_available} Units</td>
                  <td className="py-4 px-3 text-slate-400 font-mono">{b.expiry_date}</td>
                  <td className="py-4 px-3">
                    <Badge variant="emerald" size="sm">TESTED &amp; SAFE</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Donor Modal */}
      <Modal
        isOpen={showDonorModal}
        onClose={() => setShowDonorModal(false)}
        title="Register Voluntary Blood Donation"
        subtitle={`Collects and tests blood bag in ${activeHospital?.name}`}
      >
        <form onSubmit={handleAddDonation} className="space-y-4 text-xs">
          <div>
            <label className="block font-mono uppercase text-slate-400 mb-1">Donor Full Name *</label>
            <input
              type="text"
              required
              value={donorName}
              onChange={e => setDonorName(e.target.value)}
              placeholder="e.g. Ramesh Chandra"
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-rose-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Blood Group *</label>
              <select
                value={donorGroup}
                onChange={e => setDonorGroup(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-rose-500"
              >
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Separated Component *</label>
              <select
                value={component}
                onChange={e => setComponent(e.target.value as any)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-rose-500"
              >
                <option value="PRBC">PRBC (Packed Red Cells)</option>
                <option value="FFP">FFP (Fresh Frozen Plasma)</option>
                <option value="Platelets">Platelet Concentrate</option>
                <option value="Whole Blood">Whole Blood</option>
              </select>
            </div>
            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Units (Bags) *</label>
              <input
                type="number"
                min="1"
                max="5"
                value={units}
                onChange={e => setUnits(Number(e.target.value))}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-rose-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowDonorModal(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
            >
              Record Blood Unit
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
