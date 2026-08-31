/**
 * COROT HEALTHCARE HOSPICARE - ROLE-BASED ACCESS CONTROL (RBAC)
 */

import { UserRole } from '../types';

export interface RoleConfig {
  id: UserRole;
  label: string;
  badgeColor: string;
  description: string;
  canAccessModules: string[];
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  super_admin: {
    id: 'super_admin',
    label: 'Super Admin (Platform Owner)',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    description: 'Full multi-hospital cloud authority, license configuration, and cross-hospital audit view.',
    canAccessModules: ['superadmin', 'dashboard', 'hospitals', 'users', 'audit', 'settings', 'reports']
  },
  hospital_admin: {
    id: 'hospital_admin',
    label: 'Hospital Administrator',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    description: 'Chief operational officer managing all departments, doctors, beds, and billing in own hospital.',
    canAccessModules: ['dashboard', 'patients', 'opd', 'ipd', 'emergency', 'beds', 'doctors', 'departments', 'pharmacy', 'laboratory', 'radiology', 'bloodbank', 'ambulance', 'billing', 'insurance', 'inventory', 'hr', 'reports', 'audit', 'settings']
  },
  management: {
    id: 'management',
    label: 'Hospital Owner / Management',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    description: 'Executive board view of occupancy, revenue analytics, staff metrics, and compliance.',
    canAccessModules: ['dashboard', 'reports', 'billing', 'hr', 'inventory', 'audit']
  },
  medical_superintendent: {
    id: 'medical_superintendent',
    label: 'Medical Superintendent',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    description: 'Clinical head supervising doctor rosters, clinical audits, mortality records, and quality care.',
    canAccessModules: ['dashboard', 'patients', 'opd', 'ipd', 'emergency', 'doctors', 'laboratory', 'radiology', 'pharmacy', 'bloodbank', 'reports', 'audit']
  },
  doctor: {
    id: 'doctor',
    label: 'Specialist / Consultant Doctor',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    description: 'Clinical desk for OPD appointments, patient consultations, prescriptions, lab reviews, and IPD rounds.',
    canAccessModules: ['dashboard', 'patients', 'opd', 'ipd', 'emergency', 'prescriptions', 'laboratory', 'radiology', 'reports']
  },
  nurse: {
    id: 'nurse',
    label: 'Inpatient / Critical Care Nurse',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    description: 'Ward nursing care, real-time vitals logging, medication administration, and shift handovers.',
    canAccessModules: ['dashboard', 'patients', 'ipd', 'emergency', 'beds', 'vitals']
  },
  receptionist: {
    id: 'receptionist',
    label: 'Front Desk / Receptionist',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description: 'Patient registration, UHID generation, OPD token queue, doctor schedule lookup, and quick fees.',
    canAccessModules: ['dashboard', 'patients', 'opd', 'appointments', 'billing', 'doctors']
  },
  pharmacist: {
    id: 'pharmacist',
    label: 'Pharmacy / Chemist Manager',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    description: 'Medicine inventory, batch tracking, expiry monitoring, POS counter sales, and POs.',
    canAccessModules: ['dashboard', 'pharmacy', 'billing', 'inventory', 'reports']
  },
  lab_technician: {
    id: 'lab_technician',
    label: 'Laboratory Biochemist / Pathologist',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    description: 'Sample barcode collection, automated test entry, reference range alerts, and report sign-off.',
    canAccessModules: ['dashboard', 'laboratory', 'billing', 'reports']
  },
  radiology_technician: {
    id: 'radiology_technician',
    label: 'Radiology & Imaging Specialist',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    description: 'X-Ray, CT, MRI, Ultrasound scheduling, scan verification, and diagnostic impressions.',
    canAccessModules: ['dashboard', 'radiology', 'billing', 'reports']
  },
  accountant: {
    id: 'accountant',
    label: 'Finance & Accounts Officer',
    badgeColor: 'bg-green-500/20 text-green-300 border-green-500/30',
    description: 'Invoicing, daily collections, cash/card/UPI receipts, insurance claims, and financial ledgers.',
    canAccessModules: ['dashboard', 'billing', 'insurance', 'reports', 'audit']
  },
  hr_manager: {
    id: 'hr_manager',
    label: 'HR & Staff Administrator',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    description: 'Employee onboarding, department designations, attendance, leave rosters, and payroll.',
    canAccessModules: ['dashboard', 'hr', 'departments', 'reports']
  },
  inventory_manager: {
    id: 'inventory_manager',
    label: 'Central Store & Inventory Lead',
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    description: 'Medical consumables, PPE stocks, vendor purchase orders, and stock requisitions.',
    canAccessModules: ['dashboard', 'inventory', 'reports']
  },
  blood_bank_staff: {
    id: 'blood_bank_staff',
    label: 'Blood Bank Transfusion Officer',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    description: 'Donor registry, blood unit components (PRBC, FFP, Platelets), crossmatch, and expiry alerts.',
    canAccessModules: ['dashboard', 'bloodbank', 'reports']
  },
  ambulance_staff: {
    id: 'ambulance_staff',
    label: 'Ambulance & Emergency Dispatcher',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
    description: 'Fleet tracking, ALS/BLS vehicles, live trip dispatches, paramedic logs, and fuel logs.',
    canAccessModules: ['dashboard', 'ambulance', 'emergency']
  },
  patient: {
    id: 'patient',
    label: 'Patient Portal Client',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    description: 'View own health records, download digital prescriptions, lab reports, and billing receipts.',
    canAccessModules: ['dashboard', 'patients', 'prescriptions', 'laboratory', 'radiology', 'billing']
  },
  radiologist: {
    id: 'radiologist',
    label: 'Consultant Radiologist',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    description: 'Specialist for PACS imaging review, diagnostic scan interpretation, and findings sign-off.',
    canAccessModules: ['dashboard', 'radiology', 'reports']
  },
  ambulance_driver: {
    id: 'ambulance_driver',
    label: 'Ambulance Driver / Pilot',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
    description: 'Vehicle GPS dispatch, patient transport, emergency siren trips, and odometer logs.',
    canAccessModules: ['dashboard', 'ambulance', 'emergency']
  },
  support_staff: {
    id: 'support_staff',
    label: 'Support & Facility Staff',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    description: 'Housekeeping, bed sanitization status updates, and general maintenance.',
    canAccessModules: ['dashboard', 'beds']
  }
};

export function canAccess(role: UserRole, moduleName: string): boolean {
  if (role === 'super_admin') return true;
  const config = ROLE_CONFIGS[role];
  if (!config) return false;
  return config.canAccessModules.includes(moduleName);
}
