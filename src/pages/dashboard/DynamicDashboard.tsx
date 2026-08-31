import React from 'react';
import {
  Users,
  Calendar,
  BedDouble,
  Flame,
  Pill,
  Activity,
  ReceiptText,
  Clock,
  TrendingUp,
  AlertTriangle,
  Stethoscope,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/database';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';

interface DynamicDashboardProps {
  onNavigate: (module: string) => void;
}

const CLINICAL_VOLUME_DATA = [
  { time: '08:00', opd: 12, emergency: 2, ipd: 1 },
  { time: '10:00', opd: 38, emergency: 5, ipd: 4 },
  { time: '12:00', opd: 54, emergency: 8, ipd: 6 },
  { time: '14:00', opd: 42, emergency: 6, ipd: 3 },
  { time: '16:00', opd: 35, emergency: 9, ipd: 5 },
  { time: '18:00', opd: 28, emergency: 12, ipd: 4 },
  { time: '20:00', opd: 15, emergency: 7, ipd: 2 }
];

export const DynamicDashboard: React.FC<DynamicDashboardProps> = ({ onNavigate }) => {
  const { user, activeHospital } = useAuth();
  const hospId = activeHospital?.id;
  const isSuper = user?.is_super_admin;

  const patients = db.getPatients(hospId, isSuper);
  const appointments = db.getAppointments(hospId, isSuper);
  const admissions = db.getAdmissions(hospId, isSuper);
  const beds = db.getBeds(hospId, isSuper);
  const emergencies = db.getEmergencyVisits(hospId, isSuper);
  const medicines = db.getMedicines(hospId, isSuper);
  const labOrders = db.getLabOrders(hospId, isSuper);
  const invoices = db.getInvoices(hospId, isSuper);

  const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
  const totalBeds = beds.length || 1;
  const occupancyPercent = Math.round((occupiedBeds / totalBeds) * 100);

  const todayRevenue = invoices.reduce((acc, i) => acc + i.paid_amount, 0);
  const activeEmergencies = emergencies.filter(e => e.status === 'triage' || e.status === 'treatment').length;

  return (
    <div className="space-y-6">
      {/* Header Greeting & Tenant Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono font-bold text-blue-400 uppercase tracking-wider">
              {activeHospital?.name || 'Corot Healthcare ERP'} • {user?.role.toUpperCase().replace('_', ' ')}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome back, {user?.full_name}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Live clinical telemetry, occupancy status, and verified department queues.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right font-mono text-xs">
            <div className="text-slate-400">TODAY REVENUE</div>
            <div className="text-emerald-400 font-bold text-lg">₹{todayRevenue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Bed Occupancy"
          value={`${occupancyPercent}%`}
          subtitle={`${occupiedBeds} of ${totalBeds} Beds Occupied`}
          icon={BedDouble}
          variant="blue"
          badgeText="Real-Time"
        />
        <StatCard
          title="Today's OPD Queue"
          value={appointments.length}
          subtitle="Tokens Generated"
          icon={Calendar}
          variant="purple"
          badgeText="OPD Active"
        />
        <StatCard
          title="Emergency Resus Bay"
          value={activeEmergencies}
          subtitle="Under Active Triage"
          icon={Flame}
          variant="rose"
          badgeText="Critical 24x7"
        />
        <StatCard
          title="Total Registered UHIDs"
          value={patients.length}
          subtitle="Longitudinal Health Records"
          icon={Users}
          variant="emerald"
          badgeText="Verified ID"
        />
      </div>

      {/* Main Charts & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Real-Time Clinical Activity Chart (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Real-Time Patient Flow & Department Throughput
              </h3>
              <p className="text-xs text-slate-400">Hourly patient influx across OPD, Emergency & Inpatient Admissions</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> OPD
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Emergency
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CLINICAL_VOLUME_DATA}>
                <defs>
                  <linearGradient id="colorOpd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorEmg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="opd" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorOpd)" name="OPD Visits" />
                <Area type="monotone" dataKey="emergency" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorEmg)" name="Emergency Cases" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Quick Actions & Live Department Status (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Quick Action Navigation Card */}
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-5 backdrop-blur-md space-y-3">
            <h4 className="text-xs font-mono uppercase font-bold text-slate-400 tracking-wider">
              Quick Clinical Actions
            </h4>

            <button
              onClick={() => onNavigate('patients')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 text-blue-300 transition-all text-xs font-semibold text-left group"
            >
              <span className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-blue-400" />
                <span>Register New Patient & UHID</span>
              </span>
              <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate('opd')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-purple-600/10 border border-purple-500/20 hover:bg-purple-600/20 text-purple-300 transition-all text-xs font-semibold text-left group"
            >
              <span className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>Issue OPD Token / Consultation</span>
              </span>
              <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate('emergency')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-rose-600/10 border border-rose-500/20 hover:bg-rose-600/20 text-rose-300 transition-all text-xs font-semibold text-left group"
            >
              <span className="flex items-center gap-2.5">
                <Flame className="w-4 h-4 text-rose-400" />
                <span>Emergency Casualty Triage</span>
              </span>
              <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Department Readiness Matrix */}
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-5 backdrop-blur-md space-y-3">
            <h4 className="text-xs font-mono uppercase font-bold text-slate-400 tracking-wider">
              Diagnostic & Support Readiness
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02]">
                <span className="flex items-center gap-2 text-slate-300">
                  <Pill className="w-3.5 h-3.5 text-teal-400" /> Central Pharmacy
                </span>
                <Badge variant="emerald" size="sm">Online</Badge>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02]">
                <span className="flex items-center gap-2 text-slate-300">
                  <Activity className="w-3.5 h-3.5 text-sky-400" /> Pathology Lab
                </span>
                <Badge variant="emerald" size="sm">Online</Badge>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02]">
                <span className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> TPA Desk
                </span>
                <Badge variant="emerald" size="sm">Cashless OK</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
