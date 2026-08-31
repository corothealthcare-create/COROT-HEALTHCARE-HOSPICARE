import React, { useState, useMemo } from 'react';
import { Search, User, FileText, Pill, Activity, Stethoscope, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/database';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEntity: (type: string, id: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onSelectEntity }) => {
  const { user, activeHospital } = useAuth();
  const [query, setQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const hospId = activeHospital?.id;
    const isSuper = user?.is_super_admin;

    const patients = db.getPatients(hospId, isSuper).filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.uhid.toLowerCase().includes(q) ||
      p.phone.includes(q)
    ).map(p => ({
      id: p.id,
      title: p.name,
      subtitle: `UHID: ${p.uhid} | Age: ${p.age} | Blood: ${p.blood_group}`,
      type: 'patient',
      icon: User,
      badge: 'Patient'
    }));

    const doctors = db.getDoctors(hospId, isSuper).filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.specialization.toLowerCase().includes(q) ||
      d.department_name.toLowerCase().includes(q)
    ).map(d => ({
      id: d.id,
      title: d.name,
      subtitle: `${d.specialization} • ${d.department_name}`,
      type: 'doctor',
      icon: Stethoscope,
      badge: 'Doctor'
    }));

    const medicines = db.getMedicines(hospId, isSuper).filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.generic_name.toLowerCase().includes(q) ||
      m.code.toLowerCase().includes(q)
    ).map(m => ({
      id: m.id,
      title: m.name,
      subtitle: `Generic: ${m.generic_name} • Cat: ${m.category}`,
      type: 'pharmacy',
      icon: Pill,
      badge: 'Pharmacy'
    }));

    const labTests = db.getLabTests(hospId, isSuper).filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    ).map(t => ({
      id: t.id,
      title: t.name,
      subtitle: `${t.category} • ₹${t.price}`,
      type: 'laboratory',
      icon: Activity,
      badge: 'Lab Test'
    }));

    const invoices = db.getInvoices(hospId, isSuper).filter(i =>
      i.invoice_no.toLowerCase().includes(q) ||
      i.patient_name.toLowerCase().includes(q)
    ).map(i => ({
      id: i.id,
      title: `Invoice ${i.invoice_no}`,
      subtitle: `${i.patient_name} • ₹${i.grand_total.toLocaleString()} • ${i.status.toUpperCase()}`,
      type: 'billing',
      icon: FileText,
      badge: 'Invoice'
    }));

    return [...patients, ...doctors, ...medicines, ...labTests, ...invoices].slice(0, 10);
  }, [query, activeHospital, user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div className="fixed inset-0 bg-[#02040a]/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#090d16] border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden z-10">
        {/* Search Header */}
        <div className="flex items-center px-5 py-4 border-b border-white/10 bg-slate-900/60">
          <Search className="w-5 h-5 text-blue-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search Patients (Name/UHID/Phone), Doctors, Medicines, Lab Tests, Invoices..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-500 hover:text-white mr-2">
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-mono uppercase bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-400">
            ESC
          </span>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-2">
          {!query.trim() ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <p className="font-mono uppercase tracking-wider mb-1">Instant Enterprise Health Index</p>
              <p>Type patient name, UHID, doctor specialization, or drug name...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <p className="text-slate-400 font-medium mb-1">No matching clinical or operational records found</p>
              <p>Search is securely scoped to <strong className="text-blue-400">{activeHospital?.name || 'Selected Hospital'}</strong></p>
            </div>
          ) : (
            <div className="space-y-1">
              {searchResults.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => {
                      onSelectEntity(item.type, item.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] hover:bg-blue-600/10 border border-transparent hover:border-blue-500/20 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-white/5 flex items-center justify-center text-blue-400 group-hover:border-blue-500/30">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-semibold text-white group-hover:text-blue-300 truncate">
                          {item.title}
                        </div>
                        <div className="text-xs text-slate-400 truncate">{item.subtitle}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                        {item.badge}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
