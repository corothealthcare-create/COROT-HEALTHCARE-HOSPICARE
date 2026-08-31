/**
 * COROT HEALTHCARE HOSPICARE - ENTERPRISE TYPE SYSTEM
 * Multi-Tenant, RBAC, Clinical, Diagnostics, Operations & Finance
 */

export type UserRole =
  | 'super_admin'
  | 'hospital_admin'
  | 'management'
  | 'medical_superintendent'
  | 'doctor'
  | 'nurse'
  | 'receptionist'
  | 'pharmacist'
  | 'lab_technician'
  | 'radiology_technician'
  | 'accountant'
  | 'hr_manager'
  | 'inventory_manager'
  | 'blood_bank_staff'
  | 'ambulance_staff'
  | 'patient'
  | 'support_staff'
  | 'radiologist'
  | 'ambulance_driver';

export interface Hospital {
  id: string;
  code: string;
  name: string;
  logo_url?: string;
  tagline?: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  phone: string;
  email: string;
  website?: string;
  registration_no: string;
  gst_number?: string;
  emergency_contact: string;
  hospital_type: 'General' | 'Multi-Specialty' | 'Super-Specialty' | 'Clinic' | 'Trauma Center' | string;
  bed_capacity: number;
  departments: string[];
  status: 'active' | 'inactive' | 'suspended' | string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  avatar_url?: string;
  is_super_admin: boolean;
  hospital_id?: string; // Current authorized active hospital
  role: UserRole;
  department_id?: string;
  designation?: string;
  doctor_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface Department {
  id: string;
  hospital_id: string;
  name: string;
  code: string;
  description: string;
  head_doctor_id?: string;
  head_doctor_name?: string;
  is_active: boolean;
}

export interface Doctor {
  id: string;
  hospital_id: string;
  user_id?: string;
  name: string;
  specialization: string;
  qualification: string;
  registration_no: string;
  department_id: string;
  department_name: string;
  phone: string;
  email: string;
  avatar_url?: string;
  consultation_fee: number;
  available_days: string[];
  timing_start: string;
  timing_end: string;
  room_no: string;
  is_active: boolean;
}

export interface Patient {
  id: string;
  hospital_id: string;
  uhid: string;
  name: string;
  gender: 'Male' | 'Female' | 'Other' | string;
  dob: string;
  age: number;
  blood_group: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  emergency_contact: string;
  guardian_name?: string;
  id_proof_type?: string;
  id_proof_number?: string;
  allergies: string[];
  medical_history: string;
  existing_conditions: string[];
  insurance_provider?: string;
  insurance_policy_no?: string;
  registered_at: string;
  status: 'active' | 'admitted' | 'discharged' | string;
}

export type AppointmentStatus = 'scheduled' | 'checked_in' | 'in_consultation' | 'completed' | 'cancelled' | 'no_show' | string;

export interface OpdAppointment {
  id: string;
  hospital_id: string;
  patient_id: string;
  patient_uhid: string;
  patient_name: string;
  patient_phone: string;
  doctor_id: string;
  doctor_name: string;
  department_name: string;
  token_number: number;
  appointment_date: string;
  appointment_time: string;
  type: 'New' | 'Follow-up' | 'Emergency' | 'Review' | string;
  status: AppointmentStatus;
  vitals?: Vitals;
  symptoms?: string;
  diagnosis?: string;
  doctor_notes?: string;
  prescription_id?: string;
  fee_amount: number;
  is_paid: boolean;
  created_at: string;
}

export interface Vitals {
  blood_pressure_sys?: number;
  blood_pressure_dia?: number;
  pulse_rate?: number;
  temperature_f?: number;
  spo2_percent?: number;
  respiratory_rate?: number;
  weight_kg?: number;
  height_cm?: number;
  bmi?: number;
  recorded_at?: string;
  recorded_by?: string;
}

export interface PrescriptionItem {
  id?: string;
  medicine_id?: string;
  medicine_name: string;
  dosage: string; // e.g. "500mg"
  frequency: string; // e.g. "1-0-1 (Twice daily)"
  timing: string; // e.g. "After food"
  duration_days: number;
  total_quantity: number;
  instructions?: string;
}

export interface Prescription {
  id: string;
  hospital_id: string;
  patient_id: string;
  patient_uhid: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  appointment_id?: string;
  ipd_admission_id?: string;
  diagnosis: string;
  items: PrescriptionItem[];
  lab_investigations_advised?: string[];
  radiology_advised?: string[];
  diet_lifestyle_advice?: string;
  follow_up_date?: string;
  is_dispensed: boolean;
  created_at: string;
}

export type BedStatus = 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance' | 'blocked' | string;

export interface Ward {
  id: string;
  hospital_id: string;
  name: string;
  building: string;
  floor: string;
  type: 'General' | 'ICU' | 'NICU' | 'CCU' | 'Emergency' | 'Maternity' | 'Pediatric' | 'Private' | 'Deluxe' | string;
  total_beds: number;
}

export interface Bed {
  id: string;
  hospital_id: string;
  ward_id?: string;
  ward_name?: string;
  ward?: string;
  room_number?: string;
  bed_number: string;
  type: string;
  daily_rate: number;
  status: BedStatus;
  current_patient_id?: string;
  current_patient_name?: string;
  current_admission_no?: string;
  admission_id?: string;
  occupied_since?: string;
}

export type TriagePriority = 'red_resuscitation' | 'yellow_emergent' | 'green_urgent' | 'blue_non_urgent' | 'RED' | 'YELLOW' | 'GREEN' | 'BLUE' | string;

export interface EmergencyVisit {
  id: string;
  hospital_id: string;
  emergency_id?: string;
  patient_id: string;
  patient_name: string;
  patient_uhid: string;
  triage_priority?: TriagePriority;
  triage_category?: any;
  chief_complaint?: string;
  vitals?: Vitals;
  attending_doctor_id?: string;
  attending_doctor_name?: string;
  attending_doctor?: string;
  gcs_score?: number;
  trauma_type?: string;
  assigned_bed_id?: string;
  status: 'triage' | 'treatment' | 'stabilized' | 'converted_to_ipd' | 'referred' | 'discharged' | 'expired' | string;
  disposition_notes?: string;
  arrival_time: string;
  departure_time?: string;
}

export interface IpdAdmission {
  id: string;
  hospital_id: string;
  admission_no?: string;
  ipd_number?: string;
  patient_id: string;
  patient_uhid: string;
  patient_name: string;
  patient_phone?: string;
  attending_doctor_id?: string;
  attending_doctor_name?: string;
  doctor_id?: string;
  doctor_name?: string;
  department_name?: string;
  ward_id?: string;
  ward_name?: string;
  ward?: string;
  bed_id?: string;
  bed_number: string;
  admission_date: string;
  admitted_for_diagnosis?: string;
  admitting_diagnosis?: string;
  initial_deposit?: number;
  insurance_approved_amount?: number;
  insurance_claim_id?: string;
  status: 'admitted' | 'under_discharge' | 'discharged' | string;
  nursing_notes?: { timestamp: string; note: string; author: string }[];
  vitals_history?: Vitals[];
  discharge_date?: string;
  discharge_summary?: {
    final_diagnosis: string;
    treatment_given: string;
    clinical_condition_at_discharge: string;
    condition_at_discharge?: string;
    discharge_medications: PrescriptionItem[];
    follow_up_instructions: string;
    follow_up_advice?: string;
    discharged_by_doctor: string;
  };
}

export interface MedicineBatch {
  id: string;
  batch_no: string;
  expiry_date: string;
  purchase_price: number;
  mrp: number;
  selling_price: number;
  gst_percent: number;
  current_stock: number;
}

export interface Medicine {
  id: string;
  hospital_id: string;
  code: string;
  name: string;
  generic_name: string;
  brand?: string;
  category: string;
  manufacturer?: string;
  unit?: string;
  min_stock_alert?: number;
  batches?: MedicineBatch[];
  batch_no?: string;
  expiry_date?: string;
  stock_quantity?: number;
  unit_price?: number;
  reorder_level?: number;
  status?: string;
}

export interface PharmacySale {
  id: string;
  hospital_id: string;
  invoice_no: string;
  patient_id?: string;
  patient_name: string;
  patient_uhid?: string;
  doctor_name?: string;
  prescription_id?: string;
  items: {
    medicine_id: string;
    medicine_name: string;
    batch_no: string;
    expiry_date: string;
    quantity: number;
    unit_price: number;
    gst_amount: number;
    total: number;
  }[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  grand_total: number;
  payment_mode: 'Cash' | 'Card' | 'UPI' | 'Credit' | 'Insurance' | string;
  created_at: string;
}

export interface InvoiceItem {
  id?: string;
  description: string;
  category: string;
  quantity: number;
  unit_price: number;
  total_price?: number;
  total?: number;
}

export interface Invoice {
  id: string;
  hospital_id: string;
  invoice_no: string;
  patient_id: string;
  patient_uhid: string;
  patient_name: string;
  invoice_type?: 'OPD' | 'IPD' | 'Emergency' | 'Pharmacy' | 'Laboratory' | 'Radiology' | 'General' | string;
  encounter_ref_no?: string;
  items: InvoiceItem[];
  subtotal?: number;
  total_amount?: number;
  discount_amount: number;
  tax_amount: number;
  grand_total: number;
  paid_amount: number;
  due_amount?: number;
  balance_amount?: number;
  payment_mode?: string;
  status: 'paid' | 'partial' | 'unpaid' | 'waived' | 'insurance_pending' | string;
  tpa_claim_id?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  hospital_id: string;
  receipt_no: string;
  invoice_id: string;
  patient_name: string;
  amount: number;
  payment_mode: 'Cash' | 'Credit Card' | 'Debit Card' | 'UPI' | 'Net Banking' | 'Insurance / TPA' | 'Cheque' | string;
  transaction_ref?: string;
  collected_by: string;
  created_at: string;
}

export interface LabTest {
  id: string;
  hospital_id: string;
  code: string;
  name: string;
  category: string;
  sample_type?: string;
  price: number;
  reference_range?: string;
  unit?: string;
  reference_ranges?: { parameter: string; normal_range: string; unit: string }[];
  turnaround_hours?: number;
}

export interface LabOrder {
  id: string;
  hospital_id: string;
  order_no?: string;
  order_number?: string;
  patient_id: string;
  patient_uhid: string;
  patient_name: string;
  referred_by_doctor?: string;
  doctor_name?: string;
  test_ids?: string[];
  test_names?: string[];
  test_id?: string;
  test_name?: string;
  category?: string;
  status: string;
  ordered_at?: string;
  result_value?: string;
  result_unit?: string;
  reference_range?: string;
  is_abnormal?: boolean;
  results?: {
    test_id?: string;
    parameter: string;
    observed_value: string;
    normal_range: string;
    unit: string;
    is_abnormal: boolean;
  }[];
  critical_alert_flag?: boolean;
  verified_by?: string;
  verified_at?: string;
  pathologist_remarks?: string;
  created_at?: string;
}

export interface RadiologyTest {
  id: string;
  hospital_id: string;
  code: string;
  name: string;
  modality: 'X-Ray' | 'CT Scan' | 'MRI' | 'Ultrasound' | 'Mammography' | 'PET-CT' | 'Fluoroscopy' | string;
  price: number;
  preparation_instructions?: string;
}

export interface RadiologyOrder {
  id: string;
  hospital_id: string;
  order_no?: string;
  order_number?: string;
  patient_id: string;
  patient_uhid: string;
  patient_name: string;
  referred_by_doctor?: string;
  doctor_name?: string;
  test_id?: string;
  test_name?: string;
  study_name?: string;
  modality: string;
  clinical_indication?: string;
  status: string;
  findings?: string;
  impression?: string;
  image_url?: string;
  radiologist_name?: string;
  reported_by?: string;
  reported_at?: string;
  ordered_at?: string;
  created_at?: string;
}

export interface BloodStock {
  id: string;
  hospital_id: string;
  blood_group: string;
  component: 'PRBC' | 'FFP' | 'Platelets' | 'Whole Blood' | string;
  units_available: number;
  expiry_date: string;
  status: string;
}

export interface BloodDonor {
  id: string;
  hospital_id: string;
  donor_id: string;
  name: string;
  gender: string;
  age: number;
  blood_group: string;
  phone: string;
  email?: string;
  last_donation_date: string;
  eligible_status: 'Eligible' | 'Deferred' | 'Permanent Ineligible' | string;
}

export interface BloodUnit {
  id: string;
  hospital_id: string;
  unit_bag_no: string;
  component_type: 'Whole Blood' | 'Packed Red Blood Cells (PRBC)' | 'Fresh Frozen Plasma (FFP)' | 'Platelet Concentrate' | 'Cryoprecipitate' | string;
  blood_group: string;
  collection_date: string;
  expiry_date: string;
  volume_ml: number;
  status: 'available' | 'reserved' | 'issued' | 'expired' | 'discarded' | string;
  crossmatched_for_patient?: string;
}

export interface Ambulance {
  id: string;
  hospital_id: string;
  vehicle_no?: string;
  vehicle_number?: string;
  type?: string;
  vehicle_type?: string;
  driver_name: string;
  driver_phone: string;
  paramedic_name?: string;
  status: 'available' | 'on_trip' | 'maintenance' | 'refueling' | string;
  fuel_level_percent?: number;
  last_service_date?: string;
  current_location?: string;
}

export interface AmbulanceTrip {
  id: string;
  hospital_id: string;
  trip_no: string;
  ambulance_id: string;
  vehicle_no: string;
  driver_name: string;
  patient_name?: string;
  pickup_location: string;
  drop_location: string;
  emergency_level: 'Critical' | 'Urgent' | 'Routine' | string;
  distance_km: number;
  status: 'dispatched' | 'reached_pickup' | 'in_transit' | 'completed' | 'cancelled' | string;
  cost_amount: number;
  start_time: string;
  end_time?: string;
}

export interface InsuranceClaim {
  id: string;
  hospital_id: string;
  claim_no?: string;
  claim_number?: string;
  patient_id: string;
  patient_name: string;
  patient_uhid: string;
  admission_no?: string;
  tpa_company?: string;
  tpa_company_name?: string;
  policy_number: string;
  claim_amount?: number;
  claimed_amount?: number;
  pre_auth_amount?: number;
  approved_amount?: number;
  settled_amount?: number;
  status: string;
  submitted_date?: string;
  created_at?: string;
  settled_date?: string;
}

export interface InventoryItem {
  id: string;
  hospital_id: string;
  item_code: string;
  name?: string;
  item_name?: string;
  category: string;
  current_stock?: number;
  quantity?: number;
  unit: string;
  reorder_level?: number;
  reorder_threshold?: number;
  location_shelf?: string;
  unit_cost: number;
  status?: string;
}

export interface Employee {
  id: string;
  hospital_id: string;
  emp_code: string;
  name: string;
  department_name: string;
  designation: string;
  role: UserRole;
  phone: string;
  email: string;
  joining_date: string;
  salary: number;
  status: 'active' | 'on_leave' | 'resigned' | 'terminated' | string;
}

export interface AuditLog {
  id: string;
  hospital_id?: string;
  hospital_name?: string;
  user_id: string;
  user_email: string;
  user_role: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'SECURITY_VIOLATION' | 'DISCHARGE' | 'DISPENSE' | 'VERIFY' | string;
  module: string;
  record_id?: string;
  details: string;
  ip_address?: string;
  timestamp?: string;
  created_at?: string;
}

export interface SystemNotification {
  id: string;
  hospital_id?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  module: string;
  is_read: boolean;
  created_at: string;
}

export interface SuperAdminAccessGrant {
  id: string;
  hospital_id: string;
  hospital_name: string;
  reason: string;
  access_mode: 'read_only' | 'administrative';
  duration_minutes: number;
  granted_at: string;
  expires_at: string;
  granted_by: string;
}
