import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Filter,
  User,
  Building
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/database';
import { AuditLog } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { exportToCSV } from '../../lib/exportService';

export const HospitalAuditTrailPage: React.FC = () => {
  const { user, activeHospital } = useAuth();
  const hospId = activeHospital?.id;
  const isSuper = user?.is_super_admin;

  const [logs, setLogs] = useState<AuditLog[]>(db.getAuditLogs(hospId, isSuper));
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('All');

  const filteredLogs = logs.filter(l => {
    const matchesSearch =
      l.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.module.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'All' || l.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="blue" size="sm">COMPLIANCE & INTEGRITY</Badge>
            <span className="text-xs text-slate-400 font-mono">TAMPER-EVIDENT FORENSIC LOG</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Security & System Audit Trail</h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable tracking of clinical chart updates, pharmacy sales, drug dispensing, bed transfers, and billing events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV(logs, 'Hospital_Audit_Trail')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/60 border border-white/5 text-slate-300 hover:text-white text-xs font-semibold"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Audit CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search Log Detail, User, Module..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-mono">Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="All">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="DISPENSE">DISPENSE</option>
            <option value="DISCHARGE">DISCHARGE</option>
          </select>
          <span className="text-xs font-mono text-slate-500">{filteredLogs.length} Events</span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 font-mono uppercase text-[11px]">
                <th className="pb-3 px-3">Timestamp</th>
                <th className="pb-3 px-3">Actor / User</th>
                <th className="pb-3 px-3">Role</th>
                <th className="pb-3 px-3">Action</th>
                <th className="pb-3 px-3">Module</th>
                <th className="pb-3 px-3">Event Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-3 font-mono text-slate-400 text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="font-semibold text-white">{log.user_email}</div>
                    {isSuper && log.hospital_name && (
                      <div className="text-[10px] text-blue-400">{log.hospital_name}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-mono text-[10px] uppercase text-slate-400 px-2 py-0.5 rounded bg-white/5 border border-white/5">
                      {log.user_role}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <Badge
                      variant={
                        log.action === 'CREATE'
                          ? 'emerald'
                          : log.action === 'UPDATE'
                          ? 'blue'
                          : log.action === 'DELETE'
                          ? 'rose'
                          : 'purple'
                      }
                      size="sm"
                    >
                      {log.action}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-3 text-slate-300 font-medium">{log.module}</td>
                  <td className="py-3.5 px-3 text-slate-300 max-w-md truncate">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
