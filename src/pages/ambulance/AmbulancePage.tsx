import React, { useState } from 'react';
import {
  Truck,
  Search,
  Plus,
  Printer,
  FileSpreadsheet,
  Phone,
  MapPin,
  CheckCircle2,
  Navigation,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/database';
import { Ambulance } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { exportToCSV } from '../../lib/exportService';

export const AmbulancePage: React.FC = () => {
  const { user, activeHospital } = useAuth();
  const hospId = activeHospital?.id;
  const isSuper = user?.is_super_admin;

  const [ambulances, setAmbulances] = useState<Ambulance[]>(db.getAmbulances(hospId, isSuper));
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedAmb, setSelectedAmb] = useState<Ambulance | null>(null);

  // Dispatch state
  const [pickupLocation, setPickupLocation] = useState('');
  const [emergencyType, setEmergencyType] = useState('Acute Cardiac Trauma / Severe Dyspnea');

  const refreshList = () => {
    setAmbulances(db.getAmbulances(hospId, isSuper));
  };

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAmb) return;

    const updated: Ambulance = {
      ...selectedAmb,
      status: 'on_trip',
      current_location: pickupLocation || 'En Route to Scene'
    };

    db.saveAmbulance(updated);
    db.addAuditLog({
      hospital_id: hospId,
      hospital_name: activeHospital?.name,
      user_id: user?.id || 'usr-anon',
      user_email: user?.email || '',
      user_role: user?.role || 'ambulance_driver',
      action: 'UPDATE',
      module: 'Ambulance Fleet',
      record_id: selectedAmb.id,
      details: `Dispatched ${selectedAmb.vehicle_number} (${selectedAmb.type}) to ${pickupLocation}`
    });

    refreshList();
    setShowDispatchModal(false);
    setSelectedAmb(null);
  };

  const handleReturnToBay = (amb: Ambulance) => {
    const updated: Ambulance = {
      ...amb,
      status: 'available',
      current_location: `${activeHospital?.name || 'Hospital'} Trauma Bay`
    };
    db.saveAmbulance(updated);
    refreshList();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="blue" size="sm">EMERGENCY LOGISTICS</Badge>
            <span className="text-xs text-slate-400 font-mono">GPS TELEMETRY FLEET</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Ambulance Fleet & Rapid Dispatch</h1>
          <p className="text-xs text-slate-400 mt-1">
            Advanced Life Support (ALS) & Basic Life Support (BLS) dispatch, driver coordination, and live incident navigation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV(ambulances, 'Ambulance_Fleet_Log')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/60 border border-white/5 text-slate-300 hover:text-white text-xs font-semibold"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Fleet CSV</span>
          </button>
        </div>
      </div>

      {/* Fleet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ambulances.map((amb) => {
          const isBusy = amb.status === 'on_trip';
          return (
            <div
              key={amb.id}
              className={`p-5 rounded-3xl border transition-all ${
                isBusy ? 'bg-blue-950/20 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'bg-slate-900/40 border-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white font-mono">{amb.vehicle_number}</h3>
                    <span className="text-[10px] text-slate-400">{amb.type} AMBULANCE</span>
                  </div>
                </div>
                <Badge variant={isBusy ? 'amber' : 'emerald'} size="sm" pulse={isBusy}>
                  {amb.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-2 py-3 border-y border-white/5 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Driver & Contact:</span>
                  <strong className="text-white">{amb.driver_name} ({amb.driver_phone})</strong>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" /> Current Zone:
                  </span>
                  <span className="font-medium text-slate-200">{amb.current_location}</span>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                {isBusy ? (
                  <button
                    onClick={() => handleReturnToBay(amb)}
                    className="w-full py-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white font-bold text-xs transition-all"
                  >
                    Mark Trip Completed / Back at Bay
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedAmb(amb);
                      setShowDispatchModal(true);
                    }}
                    className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all"
                  >
                    Dispatch to Emergency
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dispatch Modal */}
      {selectedAmb && (
        <Modal
          isOpen={showDispatchModal}
          onClose={() => setShowDispatchModal(false)}
          title={`Emergency Ambulance Dispatch: ${selectedAmb.vehicle_number}`}
          subtitle={`Driver: ${selectedAmb.driver_name} (${selectedAmb.driver_phone})`}
        >
          <form onSubmit={handleDispatch} className="space-y-4 text-xs">
            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Incident Pickup Address *</label>
              <input
                type="text"
                required
                value={pickupLocation}
                onChange={e => setPickupLocation(e.target.value)}
                placeholder="e.g. Sector 18, Commercial Hub, Near Metro Pillar 44"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-mono uppercase text-slate-400 mb-1">Emergency Nature & Patient Status</label>
              <input
                type="text"
                value={emergencyType}
                onChange={e => setEmergencyType(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)]"
              >
                Trigger Siren & Dispatch
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
