import React from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Stethoscope,
  BedDouble,
  Flame,
  Pill,
  Activity,
  Scan,
  HeartHandshake,
  Truck,
  ReceiptText,
  ShieldAlert,
  Boxes,
  UserCheck,
  FileBarChart,
  History,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  HeartPulse
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { canAccess } from '../../lib/rbac';

interface AppSidebarProps {
  activeModule: string;
  onNavigate?: (module: string) => void;
  onSelectModule?: (module: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeModule,
  onNavigate,
  onSelectModule,
  isCollapsed,
  onToggleCollapse
}) => {
  const { user } = useAuth();
  const role = user?.role || 'hospital_admin';
  const handleSelect = onNavigate || onSelectModule || (() => {});

  const menuSections = [
    {
      title: 'PLATFORM GOVERNANCE',
      showIf: user?.is_super_admin,
      items: [
        { id: 'superadmin', label: 'Super Admin Overview', icon: Building2 },
        { id: 'hospitals', label: 'Hospital Master Registry', icon: Building2 },
        { id: 'platform_users', label: 'Platform Admins & Roles', icon: Users }
      ]
    },
    {
      title: 'CLINICAL SUITE',
      items: [
        { id: 'dashboard', label: 'Dynamic Dashboard', icon: LayoutDashboard },
        { id: 'patients', label: 'Patient Registry & UHID', icon: Users },
        { id: 'opd', label: 'OPD Queue & Appointments', icon: Calendar },
        { id: 'doctors', label: 'Doctor Schedule & OPD', icon: Stethoscope },
        { id: 'ipd', label: 'IPD & Bed Occupancy', icon: BedDouble },
        { id: 'emergency', label: 'Emergency / Triage Bay', icon: Flame }
      ]
    },
    {
      title: 'DIAGNOSTICS & DRUGS',
      items: [
        { id: 'pharmacy', label: 'Pharmacy & Chemist ERP', icon: Pill },
        { id: 'laboratory', label: 'Laboratory & Pathology', icon: Activity },
        { id: 'radiology', label: 'Radiology & Imaging', icon: Scan },
        { id: 'bloodbank', label: 'Blood Bank & Donors', icon: HeartHandshake }
      ]
    },
    {
      title: 'OPERATIONS & STORES',
      items: [
        { id: 'ambulance', label: 'Ambulance & Fleet', icon: Truck },
        { id: 'inventory', label: 'Central Store & Inventory', icon: Boxes },
        { id: 'hr', label: 'HR & Staff Directory', icon: UserCheck }
      ]
    },
    {
      title: 'BILLING & FINANCE',
      items: [
        { id: 'billing', label: 'Billing & Cashier Desk', icon: ReceiptText },
        { id: 'insurance', label: 'Insurance & TPA Claims', icon: ShieldAlert }
      ]
    },
    {
      title: 'ANALYTICS & COMPLIANCE',
      items: [
        { id: 'reports', label: 'Enterprise Reports (18+)', icon: FileBarChart },
        { id: 'audit', label: 'Audit Trail & Security', icon: History }
      ]
    }
  ];

  return (
    <aside
      className={`bg-[#030611] border-r border-white/5 flex flex-col justify-between transition-all duration-300 relative z-10 shrink-0 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="p-5 flex items-center justify-between border-b border-white/5">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <HeartPulse className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xs font-black tracking-widest text-white uppercase">COROT HOSPICARE</h1>
                <span className="text-[9px] font-mono text-blue-400 font-semibold tracking-wider">CLOUD HOSPITAL ERP</span>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-full flex justify-center">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <HeartPulse className="w-5 h-5" />
              </div>
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors hidden lg:block"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
          {menuSections.map((section, sIdx) => {
            if (section.showIf === false) return null;

            const visibleItems = section.items.filter((item) => canAccess(role, item.id));
            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 text-[10px] font-mono uppercase font-bold text-slate-500 tracking-widest mb-2">
                    {section.title}
                  </div>
                )}
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeModule === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white font-semibold shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-white/5 text-[10px] font-mono text-slate-500">
        {!isCollapsed && (
          <div className="flex justify-between items-center">
            <span>VERSION 4.02</span>
            <span className="text-emerald-400 font-semibold">CLOUD OK</span>
          </div>
        )}
      </div>
    </aside>
  );
};
