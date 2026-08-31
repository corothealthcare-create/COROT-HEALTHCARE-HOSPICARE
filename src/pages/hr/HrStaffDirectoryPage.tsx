import React, { useState } from 'react';
import {
  UserCheck,
  Search,
  Plus,
  Printer,
  FileSpreadsheet,
  Mail,
  Phone,
  Shield,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/database';
import { User } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { exportToCSV } from '../../lib/exportService';

export const HrStaffDirectoryPage: React.FC = () => {
  const { user, activeHospital } = useAuth();
  const hospId = activeHospital?.id;
  const isSuper = user?.is_super_admin;

  const users = db.getUsers(hospId, isSuper);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.designation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="blue" size="sm">HUMAN RESOURCES & STAFF</Badge>
            <span className="text-xs text-slate-400 font-mono">SCOPED TO {activeHospital?.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Staff & Credentialing Directory</h1>
          <p className="text-xs text-slate-400 mt-1">
            Clinical staff, duty rosters, designated roles, contact directories, and active platform access accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV(users, 'Hospital_Staff_Directory')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/60 border border-white/5 text-slate-300 hover:text-white text-xs font-semibold"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Staff CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search Staff Name, Email, Designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-mono">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="All">All Roles</option>
            <option value="doctor">Doctor</option>
            <option value="nurse">Nurse</option>
            <option value="pharmacist">Pharmacist</option>
            <option value="lab_technician">Lab Tech</option>
            <option value="radiologist">Radiologist</option>
            <option value="accountant">Accountant</option>
            <option value="receptionist">Receptionist</option>
          </select>
          <span className="text-xs font-mono text-slate-500">{filteredUsers.length} Staff</span>
        </div>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((u) => (
          <div key={u.id} className="p-5 rounded-3xl bg-slate-900/40 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                {u.full_name.slice(0, 1)}
              </div>
              <Badge variant="blue" size="sm">
                {u.role.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>

            <div>
              <h3 className="font-bold text-white text-sm">{u.full_name}</h3>
              <div className="text-xs text-slate-400">{u.designation}</div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-white/5 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-slate-400">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span className="truncate">{u.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>{u.phone || '+91 98200 11223'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
