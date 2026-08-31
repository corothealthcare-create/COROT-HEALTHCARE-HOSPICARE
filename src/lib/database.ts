/**
 * COROT HEALTHCARE HOSPICARE - DATABASE ENGINE & TENANT REPOSITORY
 * Provides isolated PostgreSQL/Supabase data stores, RLS simulation, and transactional CRUD.
 */

import {
  Hospital,
  User,
  Doctor,
  Department,
  Patient,
  OpdAppointment,
  Vitals,
  Prescription,
  Ward,
  Bed,
  EmergencyVisit,
  IpdAdmission,
  Medicine,
  PharmacySale,
  LabTest,
  LabOrder,
  RadiologyTest,
  RadiologyOrder,
  BloodDonor,
  BloodUnit,
  Ambulance,
  AmbulanceTrip,
  Invoice,
  Payment,
  InsuranceClaim,
  InventoryItem,
  Employee,
  AuditLog,
  SystemNotification
} from '../types';

// Initial Demo Hospitals
const INITIAL_HOSPITALS: Hospital[] = [
  {
    id: 'hosp-apex-01',
    code: 'COROT-APEX-01',
    name: 'Corot Apex Super-Specialty Hospital',
    tagline: 'Center for Advanced Clinical Excellence & Research',
    address: 'Plot 42, Health City Avenue, Medical District',
    city: 'Mumbai',
    state: 'Maharashtra',
    pin: '400076',
    phone: '+91 22 2847 9000',
    email: 'contact@apex.corot.health',
    website: 'https://apex.corot.health',
    registration_no: 'MHC/2021/HOSP-88912',
    gst_number: '27AABCC1234F1Z8',
    emergency_contact: '+91 22 2847 9999 (24x7 ER)',
    hospital_type: 'Super-Specialty',
    bed_capacity: 350,
    departments: ['Cardiology', 'Neurology', 'Orthopedics', 'Oncology', 'Emergency Medicine', 'Pediatrics', 'Gastroenterology', 'Nephrology'],
    status: 'active',
    created_at: '2024-01-15T08:00:00Z'
  },
  {
    id: 'hosp-metro-02',
    code: 'COROT-METRO-02',
    name: 'Corot Metro Medical Center',
    tagline: 'Compassionate Community & Trauma Care',
    address: '88 Ring Road, Tech Corridor',
    city: 'Bengaluru',
    state: 'Karnataka',
    pin: '560100',
    phone: '+91 80 4912 7700',
    email: 'info@metro.corot.health',
    website: 'https://metro.corot.health',
    registration_no: 'KHC/2022/HOSP-44120',
    gst_number: '29AABCM9876Q1Z2',
    emergency_contact: '+91 80 4912 7799',
    hospital_type: 'Multi-Specialty',
    bed_capacity: 200,
    departments: ['General Medicine', 'General Surgery', 'Obstetrics & Gynecology', 'Emergency Medicine', 'ENT', 'Dermatology'],
    status: 'active',
    created_at: '2024-03-10T10:00:00Z'
  },
  {
    id: 'hosp-memorial-03',
    code: 'COROT-MEMORIAL-03',
    name: 'Corot Memorial Care Hospital',
    tagline: 'Dedicated to Holistic Recovery & Rehabilitation',
    address: '14 Parkside Boulevard',
    city: 'New Delhi',
    state: 'Delhi',
    pin: '110025',
    phone: '+91 11 2691 3000',
    email: 'support@memorial.corot.health',
    website: 'https://memorial.corot.health',
    registration_no: 'DHC/2023/HOSP-11029',
    gst_number: '07AABCD5678R1Z5',
    emergency_contact: '+91 11 2691 3333',
    hospital_type: 'General',
    bed_capacity: 120,
    departments: ['General Medicine', 'Pulmonology', 'Physical Rehabilitation', 'Geriatric Care'],
    status: 'active',
    created_at: '2024-06-01T09:30:00Z'
  }
];

// Demo Users for All 17+ Roles
const INITIAL_USERS: User[] = [
  {
    id: 'usr-superadmin',
    email: 'superadmin@corot.health',
    full_name: 'Dr. Alok Verma',
    phone: '+91 98110 00001',
    is_super_admin: true,
    role: 'super_admin',
    designation: 'Chief Platform Director',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'usr-hospadmin-apex',
    email: 'admin.apex@corot.health',
    full_name: 'Col. Sanjeev Nair (Retd.)',
    phone: '+91 98200 11223',
    is_super_admin: false,
    hospital_id: 'hosp-apex-01',
    role: 'hospital_admin',
    designation: 'Chief Operating Officer & Administrator',
    is_active: true,
    created_at: '2024-01-16T09:00:00Z'
  },
  {
    id: 'usr-doc-sharma',
    email: 'dr.sharma@apex.corot.health',
    full_name: 'Dr. Priya Sharma, MD, DM',
    phone: '+91 98201 44556',
    is_super_admin: false,
    hospital_id: 'hosp-apex-01',
    role: 'doctor',
    department_id: 'dept-cardio-01',
    doctor_id: 'doc-sharma-01',
    designation: 'Chief Interventional Cardiologist',
    is_active: true,
    created_at: '2024-01-20T10:00:00Z'
  },
  {
    id: 'usr-doc-patel-metro',
    email: 'dr.patel@metro.corot.health',
    full_name: 'Dr. Vikram Patel, MS, MCh',
    phone: '+91 98450 77889',
    is_super_admin: false,
    hospital_id: 'hosp-metro-02',
    role: 'doctor',
    doctor_id: 'doc-patel-02',
    designation: 'Lead Neurosurgeon',
    is_active: true,
    created_at: '2024-03-12T11:00:00Z'
  },
  {
    id: 'usr-nurse-anita',
    email: 'nurse.anita@apex.corot.health',
    full_name: 'Nurse Anita Roy, BSc Nursing',
    phone: '+91 98202 77881',
    is_super_admin: false,
    hospital_id: 'hosp-apex-01',
    role: 'nurse',
    designation: 'ICU Charge Nurse',
    is_active: true,
    created_at: '2024-01-22T08:00:00Z'
  },
  {
    id: 'usr-reception-apex',
    email: 'reception@apex.corot.health',
    full_name: 'Rohan Mehra',
    phone: '+91 98203 11990',
    is_super_admin: false,
    hospital_id: 'hosp-apex-01',
    role: 'receptionist',
    designation: 'Lead Front Desk Officer',
    is_active: true,
    created_at: '2024-01-23T07:30:00Z'
  },
  {
    id: 'usr-pharma-apex',
    email: 'pharma@apex.corot.health',
    full_name: 'Rajesh Kulkarni, B.Pharm',
    phone: '+91 98204 33221',
    is_super_admin: false,
    hospital_id: 'hosp-apex-01',
    role: 'pharmacist',
    designation: 'Chief Pharmacist',
    is_active: true,
    created_at: '2024-01-24T08:30:00Z'
  },
  {
    id: 'usr-lab-apex',
    email: 'lab@apex.corot.health',
    full_name: 'Dr. Sunita Gupta, PhD',
    phone: '+91 98205 99887',
    is_super_admin: false,
    hospital_id: 'hosp-apex-01',
    role: 'lab_technician',
    designation: 'Head Clinical Biochemist',
    is_active: true,
    created_at: '2024-01-25T09:00:00Z'
  },
  {
    id: 'usr-radiology-apex',
    email: 'radiology@apex.corot.health',
    full_name: 'Kunal Deshmukh',
    phone: '+91 98206 55443',
    is_super_admin: false,
    hospital_id: 'hosp-apex-01',
    role: 'radiology_technician',
    designation: 'Senior Radiographer & MRI Specialist',
    is_active: true,
    created_at: '2024-01-26T09:00:00Z'
  },
  {
    id: 'usr-accounts-apex',
    email: 'accounts@apex.corot.health',
    full_name: 'Meenakshi Iyer, CA',
    phone: '+91 98207 22110',
    is_super_admin: false,
    hospital_id: 'hosp-apex-01',
    role: 'accountant',
    designation: 'Head of Billing & Accounts',
    is_active: true,
    created_at: '2024-01-27T09:30:00Z'
  },
  {
    id: 'usr-hr-apex',
    email: 'hr@apex.corot.health',
    full_name: 'Pooja Bhattacharya',
    phone: '+91 98208 88776',
    is_super_admin: false,
    hospital_id: 'hosp-apex-01',
    role: 'hr_manager',
    designation: 'Human Resources Director',
    is_active: true,
    created_at: '2024-01-28T10:00:00Z'
  },
  {
    id: 'usr-inventory-apex',
    email: 'inventory@apex.corot.health',
    full_name: 'Manoj Tiwari',
    phone: '+91 98209 66554',
    is_super_admin: false,
    hospital_id: 'hosp-apex-01',
    role: 'inventory_manager',
    designation: 'Central Supply & Store Manager',
    is_active: true,
    created_at: '2024-01-29T10:30:00Z'
  },
  {
    id: 'usr-bloodbank-apex',
    email: 'bloodbank@apex.corot.health',
    full_name: 'Dr. Vivek Menon',
    phone: '+91 98210 11442',
    is_super_admin: false,
    hospital_id: 'hosp-apex-01',
    role: 'blood_bank_staff',
    designation: 'Blood Transfusion Officer',
    is_active: true,
    created_at: '2024-01-30T11:00:00Z'
  },
  {
    id: 'usr-ambulance-apex',
    email: 'ambulance@apex.corot.health',
    full_name: 'Ganesh Shinde',
    phone: '+91 98211 99001',
    is_super_admin: false,
    hospital_id: 'hosp-apex-01',
    role: 'ambulance_staff',
    designation: 'Emergency Fleet & Dispatch Lead',
    is_active: true,
    created_at: '2024-01-31T07:00:00Z'
  },
  {
    id: 'usr-patient-rajesh',
    email: 'patient.rajesh@gmail.com',
    full_name: 'Rajesh Kumar Mehta',
    phone: '+91 98920 12345',
    is_super_admin: false,
    hospital_id: 'hosp-apex-01',
    role: 'patient',
    designation: 'Registered Inpatient / OPD Client',
    is_active: true,
    created_at: '2024-02-01T12:00:00Z'
  }
];

// Initial Departments
const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-cardio-01', hospital_id: 'hosp-apex-01', name: 'Cardiology', code: 'CARD', description: 'Comprehensive Heart & Vascular Care', head_doctor_name: 'Dr. Priya Sharma', is_active: true },
  { id: 'dept-neuro-01', hospital_id: 'hosp-apex-01', name: 'Neurology & Neurosurgery', code: 'NEUR', description: 'Brain, Spine & Nerve Care', head_doctor_name: 'Dr. Anupam Bose', is_active: true },
  { id: 'dept-ortho-01', hospital_id: 'hosp-apex-01', name: 'Orthopedics & Joint Replacement', code: 'ORTH', description: 'Bone, Joint & Trauma Care', head_doctor_name: 'Dr. Sandeep Rao', is_active: true },
  { id: 'dept-er-01', hospital_id: 'hosp-apex-01', name: 'Emergency & Trauma Care', code: 'EMER', description: '24x7 Resuscitation & Emergency Services', head_doctor_name: 'Dr. Neha Kapoor', is_active: true },
  { id: 'dept-gastro-01', hospital_id: 'hosp-apex-01', name: 'Gastroenterology', code: 'GAST', description: 'Digestive & Liver Center', head_doctor_name: 'Dr. Amit Joshi', is_active: true },
  // Metro departments
  { id: 'dept-gen-metro', hospital_id: 'hosp-metro-02', name: 'General Medicine', code: 'GMED', description: 'Internal Medicine & Chronic Disease', head_doctor_name: 'Dr. Ramesh Sethi', is_active: true },
  { id: 'dept-surg-metro', hospital_id: 'hosp-metro-02', name: 'General Surgery', code: 'GSUR', description: 'Laparoscopic & Open Surgeries', head_doctor_name: 'Dr. Vikram Patel', is_active: true }
];

// Initial Doctors
const INITIAL_DOCTORS: Doctor[] = [
  {
    id: 'doc-sharma-01',
    hospital_id: 'hosp-apex-01',
    name: 'Dr. Priya Sharma',
    specialization: 'Interventional Cardiology',
    qualification: 'MBBS, MD (Medicine), DM (Cardiology), FACC',
    registration_no: 'MCI-2010-88421',
    department_id: 'dept-cardio-01',
    department_name: 'Cardiology',
    phone: '+91 98201 44556',
    email: 'dr.sharma@apex.corot.health',
    consultation_fee: 1500,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    timing_start: '09:00',
    timing_end: '14:00',
    room_no: 'OPD Suite 104',
    is_active: true
  },
  {
    id: 'doc-bose-01',
    hospital_id: 'hosp-apex-01',
    name: 'Dr. Anupam Bose',
    specialization: 'Neurology',
    qualification: 'MBBS, MD, DM (Neurology)',
    registration_no: 'MCI-2012-76120',
    department_id: 'dept-neuro-01',
    department_name: 'Neurology & Neurosurgery',
    phone: '+91 98201 99112',
    email: 'dr.bose@apex.corot.health',
    consultation_fee: 1800,
    available_days: ['Monday', 'Wednesday', 'Friday'],
    timing_start: '11:00',
    timing_end: '16:00',
    room_no: 'OPD Suite 202',
    is_active: true
  },
  {
    id: 'doc-kapoor-01',
    hospital_id: 'hosp-apex-01',
    name: 'Dr. Neha Kapoor',
    specialization: 'Emergency Medicine',
    qualification: 'MBBS, MEM, MRCEM (UK)',
    registration_no: 'MCI-2015-33419',
    department_id: 'dept-er-01',
    department_name: 'Emergency & Trauma Care',
    phone: '+91 98201 77334',
    email: 'dr.kapoor@apex.corot.health',
    consultation_fee: 1200,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    timing_start: '08:00',
    timing_end: '20:00',
    room_no: 'ER Bay 1',
    is_active: true
  },
  {
    id: 'doc-patel-02',
    hospital_id: 'hosp-metro-02',
    name: 'Dr. Vikram Patel',
    specialization: 'Neurosurgery',
    qualification: 'MBBS, MS (Surgery), MCh (Neurosurgery)',
    registration_no: 'KMC-2009-41129',
    department_id: 'dept-surg-metro',
    department_name: 'General Surgery',
    phone: '+91 98450 77889',
    email: 'dr.patel@metro.corot.health',
    consultation_fee: 1600,
    available_days: ['Monday', 'Tuesday', 'Thursday', 'Saturday'],
    timing_start: '10:00',
    timing_end: '15:00',
    room_no: 'Room 305',
    is_active: true
  }
];

// Initial Patients
const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat-001',
    hospital_id: 'hosp-apex-01',
    uhid: 'COROT-APEX-UHID-2026-0014',
    name: 'Rajesh Kumar Mehta',
    gender: 'Male',
    dob: '1974-05-12',
    age: 52,
    blood_group: 'B+',
    phone: '+91 98920 12345',
    email: 'rajesh.mehta@gmail.com',
    address: 'B-402, Sea Crest Towers, Worli',
    city: 'Mumbai',
    state: 'Maharashtra',
    pin: '400018',
    emergency_contact: 'Sunita Mehta (Wife) - +91 98920 54321',
    guardian_name: 'Sunita Mehta',
    id_proof_type: 'Aadhaar Card',
    id_proof_number: 'XXXX-XXXX-8912',
    allergies: ['Penicillin', 'Sulfa drugs'],
    medical_history: 'Type-2 Diabetes Mellitus (8 yrs), Hypertension (4 yrs), Prior Stent placement (2022)',
    existing_conditions: ['Diabetes', 'Hypertension', 'Ischemic Heart Disease'],
    insurance_provider: 'Star Health & Allied Insurance',
    insurance_policy_no: 'SH-IND-2025-998812',
    registered_at: '2026-02-10T09:15:00Z',
    status: 'admitted'
  },
  {
    id: 'pat-002',
    hospital_id: 'hosp-apex-01',
    uhid: 'COROT-APEX-UHID-2026-0015',
    name: 'Ananya Deshpande',
    gender: 'Female',
    dob: '1992-11-28',
    age: 33,
    blood_group: 'O+',
    phone: '+91 98190 67890',
    email: 'ananya.d@outlook.com',
    address: 'Flat 12, Sunrise Residency, Andheri West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pin: '400053',
    emergency_contact: 'Rohit Deshpande (Brother) - +91 98190 99988',
    allergies: ['NSAIDs (Aspirin/Ibuprofen)'],
    medical_history: 'Mild Asthma, Migraine with aura',
    existing_conditions: ['Asthma'],
    insurance_provider: 'HDFC ERGO Health',
    insurance_policy_no: 'HE-MED-8812903',
    registered_at: '2026-02-15T11:30:00Z',
    status: 'active'
  },
  {
    id: 'pat-003',
    hospital_id: 'hosp-apex-01',
    uhid: 'COROT-APEX-UHID-2026-0016',
    name: 'Mohd. Tariq Sheikh',
    gender: 'Male',
    dob: '1968-08-04',
    age: 58,
    blood_group: 'A+',
    phone: '+91 98200 44332',
    email: 'tariq.sheikh@gmail.com',
    address: '78 Crescent Road, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pin: '400050',
    emergency_contact: 'Farida Sheikh (Daughter) - +91 98200 55667',
    allergies: [],
    medical_history: 'Hyperlipidemia, Chronic Lower Back Ache',
    existing_conditions: ['Hyperlipidemia'],
    insurance_provider: 'Care Health Insurance',
    insurance_policy_no: 'CHI-FLT-441098',
    registered_at: '2026-02-20T14:10:00Z',
    status: 'active'
  },
  // Metro Patient (for strict isolation verification)
  {
    id: 'pat-metro-01',
    hospital_id: 'hosp-metro-02',
    uhid: 'COROT-METRO-UHID-2026-0001',
    name: 'Kavita Sundaram',
    gender: 'Female',
    dob: '1985-03-21',
    age: 41,
    blood_group: 'AB+',
    phone: '+91 98450 11223',
    email: 'kavita.s@gmail.com',
    address: '42 Indiranagar 100ft Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pin: '560038',
    emergency_contact: 'Suresh Sundaram - +91 98450 44556',
    allergies: ['Ciprofloxacin'],
    medical_history: 'Hypothyroidism',
    existing_conditions: ['Thyroid Disorder'],
    registered_at: '2026-02-25T10:00:00Z',
    status: 'active'
  }
];

// Initial Wards & Beds
const INITIAL_WARDS: Ward[] = [
  { id: 'ward-icu-01', hospital_id: 'hosp-apex-01', name: 'Intensive Cardiac Care Unit (ICCU)', building: 'Main Medical Tower', floor: '3rd Floor', type: 'ICU', total_beds: 12 },
  { id: 'ward-deluxe-01', hospital_id: 'hosp-apex-01', name: 'Deluxe Private Wing', building: 'Pavilion Wing A', floor: '5th Floor', type: 'Deluxe', total_beds: 20 },
  { id: 'ward-general-01', hospital_id: 'hosp-apex-01', name: 'General Medical Ward (Male)', building: 'Main Medical Tower', floor: '2nd Floor', type: 'General', total_beds: 30 },
  { id: 'ward-er-01', hospital_id: 'hosp-apex-01', name: 'Emergency Resuscitation & Observation', building: 'Ground Block', floor: 'Ground Floor', type: 'Emergency', total_beds: 15 }
];

const INITIAL_BEDS: Bed[] = [
  { id: 'bed-iccu-101', hospital_id: 'hosp-apex-01', ward_id: 'ward-icu-01', ward_name: 'ICCU', room_number: 'ICCU-Bay-1', bed_number: 'BED-ICU-01', type: 'ICU Multi-Para Bed', daily_rate: 12000, status: 'occupied', current_patient_id: 'pat-001', current_patient_name: 'Rajesh Kumar Mehta', current_admission_no: 'IPD-2026-0108', occupied_since: '2026-08-28T14:30:00Z' },
  { id: 'bed-iccu-102', hospital_id: 'hosp-apex-01', ward_id: 'ward-icu-01', ward_name: 'ICCU', room_number: 'ICCU-Bay-1', bed_number: 'BED-ICU-02', type: 'ICU Multi-Para Bed', daily_rate: 12000, status: 'available' },
  { id: 'bed-iccu-103', hospital_id: 'hosp-apex-01', ward_id: 'ward-icu-01', ward_name: 'ICCU', room_number: 'ICCU-Bay-2', bed_number: 'BED-ICU-03', type: 'ICU Multi-Para Bed', daily_rate: 12000, status: 'cleaning' },
  { id: 'bed-dlx-501', hospital_id: 'hosp-apex-01', ward_id: 'ward-deluxe-01', ward_name: 'Deluxe Private Wing', room_number: 'Suite 501', bed_number: 'BED-DLX-01', type: 'Motorized Luxury Bed', daily_rate: 9500, status: 'available' },
  { id: 'bed-dlx-502', hospital_id: 'hosp-apex-01', ward_id: 'ward-deluxe-01', ward_name: 'Deluxe Private Wing', room_number: 'Suite 502', bed_number: 'BED-DLX-02', type: 'Motorized Luxury Bed', daily_rate: 9500, status: 'reserved' },
  { id: 'bed-gen-201', hospital_id: 'hosp-apex-01', ward_id: 'ward-general-01', ward_name: 'General Medical Ward', room_number: 'Ward 2A', bed_number: 'BED-GEN-01', type: 'Standard Hospital Bed', daily_rate: 2500, status: 'available' },
  { id: 'bed-gen-202', hospital_id: 'hosp-apex-01', ward_id: 'ward-general-01', ward_name: 'General Medical Ward', room_number: 'Ward 2A', bed_number: 'BED-GEN-02', type: 'Standard Hospital Bed', daily_rate: 2500, status: 'maintenance' }
];

// Initial IPD Admissions
const INITIAL_ADMISSIONS: IpdAdmission[] = [
  {
    id: 'ipd-001',
    hospital_id: 'hosp-apex-01',
    admission_no: 'IPD-2026-0108',
    patient_id: 'pat-001',
    patient_uhid: 'COROT-APEX-UHID-2026-0014',
    patient_name: 'Rajesh Kumar Mehta',
    patient_phone: '+91 98920 12345',
    attending_doctor_id: 'doc-sharma-01',
    attending_doctor_name: 'Dr. Priya Sharma',
    department_name: 'Cardiology',
    ward_id: 'ward-icu-01',
    ward_name: 'Intensive Cardiac Care Unit (ICCU)',
    bed_id: 'bed-iccu-101',
    bed_number: 'BED-ICU-01',
    admission_date: '2026-08-28T14:30:00Z',
    admitted_for_diagnosis: 'Acute Coronary Syndrome (NSTEMI) with Uncontrolled Hyperglycemia',
    insurance_approved_amount: 250000,
    status: 'admitted',
    nursing_notes: [
      { timestamp: '2026-08-31T06:00:00Z', note: 'Patient comfortable, chest pain score 0/10. Continuous ECG shows sinus rhythm. Morning insulin administered.', author: 'Nurse Anita Roy' },
      { timestamp: '2026-08-30T20:00:00Z', note: 'Evening vitals stable. SpO2 99% on room air. Troponin serial titers declining as expected.', author: 'Nurse Anita Roy' }
    ],
    vitals_history: [
      { blood_pressure_sys: 128, blood_pressure_dia: 82, pulse_rate: 74, temperature_f: 98.4, spo2_percent: 99, respiratory_rate: 16, recorded_at: '2026-08-31T06:30:00Z', recorded_by: 'Nurse Anita Roy' },
      { blood_pressure_sys: 134, blood_pressure_dia: 86, pulse_rate: 80, temperature_f: 98.6, spo2_percent: 98, respiratory_rate: 18, recorded_at: '2026-08-30T18:00:00Z', recorded_by: 'Nurse Anita Roy' }
    ]
  }
];

// Initial OPD Appointments
const INITIAL_APPOINTMENTS: OpdAppointment[] = [
  {
    id: 'apt-001',
    hospital_id: 'hosp-apex-01',
    patient_id: 'pat-002',
    patient_uhid: 'COROT-APEX-UHID-2026-0015',
    patient_name: 'Ananya Deshpande',
    patient_phone: '+91 98190 67890',
    doctor_id: 'doc-sharma-01',
    doctor_name: 'Dr. Priya Sharma',
    department_name: 'Cardiology',
    token_number: 101,
    appointment_date: '2026-08-31',
    appointment_time: '10:00 AM',
    type: 'New',
    status: 'checked_in',
    vitals: { blood_pressure_sys: 118, blood_pressure_dia: 76, pulse_rate: 72, temperature_f: 98.2, spo2_percent: 99, bmi: 21.4, recorded_at: '2026-08-31T09:45:00Z', recorded_by: 'Nurse Anita Roy' },
    symptoms: 'Occasional palpitation and dizziness during high-stress workouts.',
    fee_amount: 1500,
    is_paid: true,
    created_at: '2026-08-30T16:00:00Z'
  },
  {
    id: 'apt-002',
    hospital_id: 'hosp-apex-01',
    patient_id: 'pat-003',
    patient_uhid: 'COROT-APEX-UHID-2026-0016',
    patient_name: 'Mohd. Tariq Sheikh',
    patient_phone: '+91 98200 44332',
    doctor_id: 'doc-bose-01',
    doctor_name: 'Dr. Anupam Bose',
    department_name: 'Neurology & Neurosurgery',
    token_number: 102,
    appointment_date: '2026-08-31',
    appointment_time: '11:30 AM',
    type: 'Follow-up',
    status: 'scheduled',
    fee_amount: 1800,
    is_paid: true,
    created_at: '2026-08-30T17:20:00Z'
  }
];

// Initial Emergency Visits
const INITIAL_EMERGENCY_VISITS: EmergencyVisit[] = [
  {
    id: 'emg-001',
    hospital_id: 'hosp-apex-01',
    emergency_id: 'EMG-2026-0042',
    patient_id: 'pat-001',
    patient_name: 'Rajesh Kumar Mehta',
    patient_uhid: 'COROT-APEX-UHID-2026-0014',
    triage_priority: 'red_resuscitation',
    chief_complaint: 'Severe retrosternal crushing chest pain radiating to left arm with diaphoresis (onset 45 mins ago).',
    vitals: { blood_pressure_sys: 156, blood_pressure_dia: 98, pulse_rate: 104, temperature_f: 98.6, spo2_percent: 94, respiratory_rate: 22, recorded_at: '2026-08-28T13:40:00Z' },
    attending_doctor_id: 'doc-kapoor-01',
    attending_doctor_name: 'Dr. Neha Kapoor',
    trauma_type: 'Cardiac Emergency',
    status: 'converted_to_ipd',
    disposition_notes: 'Urgent Coronary Angiogram performed. Admitted to ICCU under Dr. Priya Sharma.',
    arrival_time: '2026-08-28T13:30:00Z',
    departure_time: '2026-08-28T14:30:00Z'
  }
];

// Initial Medicines & Batches (Pharmacy ERP)
const INITIAL_MEDICINES: Medicine[] = [
  {
    id: 'med-001',
    hospital_id: 'hosp-apex-01',
    code: 'MED-ATV-40',
    name: 'Atorvastatin 40mg',
    generic_name: 'Atorvastatin Calcium',
    brand: 'Lipitor (Pfizer) / Atorva',
    category: 'Tablet',
    manufacturer: 'Pfizer India Ltd.',
    unit: 'Strip of 10 Tablets',
    min_stock_alert: 50,
    batches: [
      { id: 'b-atv-101', batch_no: 'PFZ-2025-A89', expiry_date: '2027-06-30', purchase_price: 120.00, mrp: 210.00, selling_price: 195.00, gst_percent: 12, current_stock: 320 },
      { id: 'b-atv-102', batch_no: 'PFZ-2024-X41', expiry_date: '2026-09-15', purchase_price: 115.00, mrp: 205.00, selling_price: 190.00, gst_percent: 12, current_stock: 45 }
    ]
  },
  {
    id: 'med-002',
    hospital_id: 'hosp-apex-01',
    code: 'MED-ASP-75',
    name: 'Ecosprin 75mg Gastro-Resistant',
    generic_name: 'Aspirin',
    brand: 'Ecosprin (USV)',
    category: 'Tablet',
    manufacturer: 'USV Private Limited',
    unit: 'Strip of 14 Tablets',
    min_stock_alert: 100,
    batches: [
      { id: 'b-asp-201', batch_no: 'USV-8821B', expiry_date: '2027-11-30', purchase_price: 8.50, mrp: 16.50, selling_price: 15.00, gst_percent: 5, current_stock: 580 }
    ]
  },
  {
    id: 'med-003',
    hospital_id: 'hosp-apex-01',
    code: 'MED-AUG-625',
    name: 'Augmentin 625 Duo',
    generic_name: 'Amoxicillin + Potassium Clavulanate (500mg+125mg)',
    brand: 'Augmentin (GSK)',
    category: 'Tablet',
    manufacturer: 'GlaxoSmithKline Pharmaceuticals',
    unit: 'Strip of 10 Tablets',
    min_stock_alert: 40,
    batches: [
      { id: 'b-aug-301', batch_no: 'GSK-2025-C12', expiry_date: '2026-12-31', purchase_price: 140.00, mrp: 235.00, selling_price: 215.00, gst_percent: 12, current_stock: 190 }
    ]
  },
  {
    id: 'med-004',
    hospital_id: 'hosp-apex-01',
    code: 'MED-MET-500',
    name: 'Glycomet-SR 500mg',
    generic_name: 'Metformin Sustained Release',
    brand: 'Glycomet (USV)',
    category: 'Tablet',
    manufacturer: 'USV Private Limited',
    unit: 'Strip of 20 Tablets',
    min_stock_alert: 60,
    batches: [
      { id: 'b-met-401', batch_no: 'USV-7712M', expiry_date: '2027-08-31', purchase_price: 28.00, mrp: 52.00, selling_price: 48.00, gst_percent: 5, current_stock: 410 }
    ]
  }
];

// Initial Lab Tests
const INITIAL_LAB_TESTS: LabTest[] = [
  {
    id: 'test-cbc-01',
    hospital_id: 'hosp-apex-01',
    code: 'LAB-CBC',
    name: 'Complete Blood Count (CBC) with Automated Differential',
    category: 'Hematology',
    sample_type: 'Blood (EDTA Tube - Lavender Top)',
    price: 450,
    turnaround_hours: 4,
    reference_ranges: [
      { parameter: 'Hemoglobin (Hb)', normal_range: '13.0 - 17.0', unit: 'g/dL' },
      { parameter: 'Total WBC Count', normal_range: '4,000 - 11,000', unit: 'cells/cu.mm' },
      { parameter: 'Platelet Count', normal_range: '150,000 - 450,000', unit: 'cells/cu.mm' },
      { parameter: 'RBC Count', normal_range: '4.5 - 5.5', unit: 'mill/cu.mm' },
      { parameter: 'Neutrophils', normal_range: '40 - 70', unit: '%' }
    ]
  },
  {
    id: 'test-trop-01',
    hospital_id: 'hosp-apex-01',
    code: 'LAB-TROP-I',
    name: 'High Sensitivity Cardiac Troponin-I (hs-cTnI)',
    category: 'Biochemistry',
    sample_type: 'Serum (SST Tube - Gold Top)',
    price: 1800,
    turnaround_hours: 1,
    reference_ranges: [
      { parameter: 'Cardiac Troponin-I', normal_range: '< 0.04 (Negative)', unit: 'ng/mL' }
    ]
  },
  {
    id: 'test-lft-01',
    hospital_id: 'hosp-apex-01',
    code: 'LAB-LFT',
    name: 'Liver Function Test (LFT) Comprehensive Profile',
    category: 'Biochemistry',
    sample_type: 'Serum',
    price: 950,
    turnaround_hours: 6,
    reference_ranges: [
      { parameter: 'Total Bilirubin', normal_range: '0.2 - 1.2', unit: 'mg/dL' },
      { parameter: 'SGOT / AST', normal_range: '10 - 40', unit: 'U/L' },
      { parameter: 'SGPT / ALT', normal_range: '10 - 45', unit: 'U/L' },
      { parameter: 'Alkaline Phosphatase (ALP)', normal_range: '44 - 147', unit: 'U/L' },
      { parameter: 'Total Protein', normal_range: '6.4 - 8.3', unit: 'g/dL' }
    ]
  }
];

// Initial Lab Orders
const INITIAL_LAB_ORDERS: LabOrder[] = [
  {
    id: 'labord-001',
    hospital_id: 'hosp-apex-01',
    order_no: 'LAB-2026-0089',
    patient_id: 'pat-001',
    patient_uhid: 'COROT-APEX-UHID-2026-0014',
    patient_name: 'Rajesh Kumar Mehta',
    referred_by_doctor: 'Dr. Priya Sharma',
    test_ids: ['test-cbc-01', 'test-trop-01'],
    test_names: ['Complete Blood Count (CBC)', 'High Sensitivity Cardiac Troponin-I'],
    status: 'verified',
    critical_alert_flag: false,
    verified_by: 'Dr. Sunita Gupta, PhD',
    verified_at: '2026-08-30T14:30:00Z',
    results: [
      { test_id: 'test-cbc-01', parameter: 'Hemoglobin (Hb)', observed_value: '14.2', normal_range: '13.0 - 17.0', unit: 'g/dL', is_abnormal: false },
      { test_id: 'test-cbc-01', parameter: 'Total WBC Count', observed_value: '8,400', normal_range: '4,000 - 11,000', unit: 'cells/cu.mm', is_abnormal: false },
      { test_id: 'test-cbc-01', parameter: 'Platelet Count', observed_value: '220,000', normal_range: '150,000 - 450,000', unit: 'cells/cu.mm', is_abnormal: false },
      { test_id: 'test-trop-01', parameter: 'Cardiac Troponin-I', observed_value: '0.02', normal_range: '< 0.04 (Negative)', unit: 'ng/mL', is_abnormal: false }
    ],
    created_at: '2026-08-30T11:00:00Z'
  }
];

// Initial Radiology Tests & Orders
const INITIAL_RADIOLOGY_TESTS: RadiologyTest[] = [
  { id: 'rad-xray-01', hospital_id: 'hosp-apex-01', code: 'RAD-CXR-PA', name: 'Digital Chest X-Ray PA View', modality: 'X-Ray', price: 650, preparation_instructions: 'Remove metallic necklaces and undergarments with metal wire.' },
  { id: 'rad-mri-01', hospital_id: 'hosp-apex-01', code: 'RAD-MRI-BRN', name: 'MRI Brain with Contrast (3.0 Tesla)', modality: 'MRI', price: 8500, preparation_instructions: '4 hours fasting. Strict screening for cardiac pacemakers and metallic implants.' },
  { id: 'rad-ct-01', hospital_id: 'hosp-apex-01', code: 'RAD-CT-ABD', name: 'CT Abdomen & Pelvis (Triple Phase)', modality: 'CT Scan', price: 7200, preparation_instructions: '6 hours fasting, serum creatinine test mandatory before contrast administration.' }
];

const INITIAL_RADIOLOGY_ORDERS: RadiologyOrder[] = [
  {
    id: 'radord-001',
    hospital_id: 'hosp-apex-01',
    order_no: 'RAD-2026-0044',
    patient_id: 'pat-001',
    patient_uhid: 'COROT-APEX-UHID-2026-0014',
    patient_name: 'Rajesh Kumar Mehta',
    referred_by_doctor: 'Dr. Priya Sharma',
    test_id: 'rad-xray-01',
    test_name: 'Digital Chest X-Ray PA View',
    modality: 'X-Ray',
    clinical_indication: 'Rule out pulmonary congestion post-coronary intervention.',
    status: 'verified',
    findings: 'Both lung fields appear clear without focal consolidation or pneumothorax. Bronchovascular markings are normal. Cardiac silhouette is within normal limits. Costophrenic angles are sharp.',
    impression: 'Normal study. No radiographic evidence of acute pulmonary edema or focal infiltrates.',
    reported_by: 'Dr. Kunal Deshmukh / Dr. V. Gokhale (MD Radiology)',
    reported_at: '2026-08-29T16:00:00Z',
    created_at: '2026-08-29T14:00:00Z'
  }
];

// Initial Blood Bank Inventory
const INITIAL_BLOOD_UNITS: BloodUnit[] = [
  { id: 'bld-001', hospital_id: 'hosp-apex-01', unit_bag_no: 'BB-PRBC-B-8812', component_type: 'Packed Red Blood Cells (PRBC)', blood_group: 'B+', collection_date: '2026-08-15', expiry_date: '2026-09-26', volume_ml: 350, status: 'available' },
  { id: 'bld-002', hospital_id: 'hosp-apex-01', unit_bag_no: 'BB-PRBC-O-9941', component_type: 'Packed Red Blood Cells (PRBC)', blood_group: 'O+', collection_date: '2026-08-18', expiry_date: '2026-09-29', volume_ml: 350, status: 'available' },
  { id: 'bld-003', hospital_id: 'hosp-apex-01', unit_bag_no: 'BB-FFP-A-1102', component_type: 'Fresh Frozen Plasma (FFP)', blood_group: 'A+', collection_date: '2026-08-20', expiry_date: '2027-08-20', volume_ml: 200, status: 'available' },
  { id: 'bld-004', hospital_id: 'hosp-apex-01', unit_bag_no: 'BB-PLT-AB-4412', component_type: 'Platelet Concentrate', blood_group: 'AB+', collection_date: '2026-08-29', expiry_date: '2026-09-03', volume_ml: 60, status: 'available' }
];

const INITIAL_BLOOD_DONORS: BloodDonor[] = [
  { id: 'donor-001', hospital_id: 'hosp-apex-01', donor_id: 'DNR-2026-001', name: 'Vikramaditya Rao', gender: 'Male', age: 29, blood_group: 'B+', phone: '+91 98200 88771', email: 'vikram.rao@gmail.com', last_donation_date: '2026-08-15', eligible_status: 'Eligible' },
  { id: 'donor-002', hospital_id: 'hosp-apex-01', donor_id: 'DNR-2026-002', name: 'Swati Sen', gender: 'Female', age: 34, blood_group: 'O+', phone: '+91 98201 11229', email: 'swati.sen@yahoo.com', last_donation_date: '2026-08-18', eligible_status: 'Eligible' }
];

// Initial Ambulances
const INITIAL_AMBULANCES: Ambulance[] = [
  { id: 'amb-001', hospital_id: 'hosp-apex-01', vehicle_no: 'MH-02-CB-1008', vehicle_type: 'Advanced Life Support (ALS)', driver_name: 'Ganesh Shinde', driver_phone: '+91 98211 99001', paramedic_name: 'Suresh Patil (EMT-P)', status: 'available', fuel_level_percent: 88, last_service_date: '2026-08-10' },
  { id: 'amb-002', hospital_id: 'hosp-apex-01', vehicle_no: 'MH-02-CB-2009', vehicle_type: 'Basic Life Support (BLS)', driver_name: 'Dattatray Pawar', driver_phone: '+91 98211 99002', status: 'available', fuel_level_percent: 94, last_service_date: '2026-08-12' }
];

const INITIAL_AMBULANCE_TRIPS: AmbulanceTrip[] = [
  { id: 'trip-001', hospital_id: 'hosp-apex-01', trip_no: 'TRIP-2026-0038', ambulance_id: 'amb-001', vehicle_no: 'MH-02-CB-1008', driver_name: 'Ganesh Shinde', patient_name: 'Rajesh Kumar Mehta', pickup_location: 'Worli Sea Face Residence', drop_location: 'Apex Emergency Bay', emergency_level: 'Critical', distance_km: 14.5, status: 'completed', cost_amount: 3500, start_time: '2026-08-28T12:50:00Z', end_time: '2026-08-28T13:30:00Z' }
];

// Initial Invoices & Payments
const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-001',
    hospital_id: 'hosp-apex-01',
    invoice_no: 'INV-2026-0419',
    patient_id: 'pat-001',
    patient_uhid: 'COROT-APEX-UHID-2026-0014',
    patient_name: 'Rajesh Kumar Mehta',
    invoice_type: 'IPD',
    encounter_ref_no: 'IPD-2026-0108',
    items: [
      { description: 'ICCU Bed Charges (3 Days @ ₹12,000/day)', category: 'Bed / Room Charges', quantity: 3, unit_price: 12000, total: 36000 },
      { description: 'Emergency Resuscitation & Triage Care', category: 'Emergency Services', quantity: 1, unit_price: 8500, total: 8500 },
      { description: 'Emergency ALS Ambulance Transport', category: 'Transport', quantity: 1, unit_price: 3500, total: 3500 },
      { description: 'Cardiac Intervention & Catheterization Procedure', category: 'Procedure Charges', quantity: 1, unit_price: 145000, total: 145000 },
      { description: 'Consultant Specialist Rounds (Dr. Priya Sharma)', category: 'Doctor Charges', quantity: 3, unit_price: 2000, total: 6000 },
      { description: 'Cardiac Troponin-I & Diagnostic Panel', category: 'Laboratory Charges', quantity: 1, unit_price: 2250, total: 2250 },
      { description: 'Digital Chest X-Ray PA View', category: 'Radiology Charges', quantity: 1, unit_price: 650, total: 650 },
      { description: 'Inpatient Pharmacy & IV Medications', category: 'Pharmacy Charges', quantity: 1, unit_price: 14800, total: 14800 }
    ],
    subtotal: 216700,
    discount_amount: 0,
    tax_amount: 0,
    grand_total: 216700,
    paid_amount: 200000,
    due_amount: 16700,
    status: 'partial',
    tpa_claim_id: 'clm-001',
    created_at: '2026-08-28T15:00:00Z'
  },
  {
    id: 'inv-002',
    hospital_id: 'hosp-apex-01',
    invoice_no: 'INV-2026-0420',
    patient_id: 'pat-002',
    patient_uhid: 'COROT-APEX-UHID-2026-0015',
    patient_name: 'Ananya Deshpande',
    invoice_type: 'OPD',
    items: [
      { description: 'Cardiology Super-Specialist Consultation (Dr. Priya Sharma)', category: 'OPD Consultation', quantity: 1, unit_price: 1500, total: 1500 }
    ],
    subtotal: 1500,
    discount_amount: 0,
    tax_amount: 0,
    grand_total: 1500,
    paid_amount: 1500,
    due_amount: 0,
    status: 'paid',
    created_at: '2026-08-31T09:45:00Z'
  }
];

const INITIAL_PAYMENTS: Payment[] = [
  { id: 'pay-001', hospital_id: 'hosp-apex-01', receipt_no: 'RCP-2026-0901', invoice_id: 'inv-001', patient_name: 'Rajesh Kumar Mehta', amount: 200000, payment_mode: 'Insurance / TPA', transaction_ref: 'TPA-STAR-APPRV-88910', collected_by: 'Meenakshi Iyer, CA', created_at: '2026-08-29T11:00:00Z' },
  { id: 'pay-002', hospital_id: 'hosp-apex-01', receipt_no: 'RCP-2026-0902', invoice_id: 'inv-002', patient_name: 'Ananya Deshpande', amount: 1500, payment_mode: 'UPI', transaction_ref: 'UPI/260831/98129038', collected_by: 'Rohan Mehra', created_at: '2026-08-31T09:46:00Z' }
];

// Initial Insurance Claims
const INITIAL_CLAIMS: InsuranceClaim[] = [
  {
    id: 'clm-001',
    hospital_id: 'hosp-apex-01',
    claim_no: 'CLM-STAR-2026-0031',
    patient_id: 'pat-001',
    patient_name: 'Rajesh Kumar Mehta',
    patient_uhid: 'COROT-APEX-UHID-2026-0014',
    admission_no: 'IPD-2026-0108',
    tpa_company_name: 'Star Health & Allied Insurance TPA Desk',
    policy_number: 'SH-IND-2025-998812',
    claim_amount: 216700,
    pre_auth_amount: 250000,
    approved_amount: 200000,
    settled_amount: 200000,
    status: 'approved',
    submitted_date: '2026-08-28T16:00:00Z',
    settled_date: '2026-08-29T10:30:00Z'
  }
];

// Initial Inventory Items (Central Stores)
const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv-item-01', hospital_id: 'hosp-apex-01', item_code: 'STORE-GLV-NTR', name: 'Nitrile Examination Gloves (Box of 100)', category: 'PPE & Hygiene', current_stock: 450, unit: 'Boxes', reorder_level: 100, location_shelf: 'Rack A-04', unit_cost: 320 },
  { id: 'inv-item-02', hospital_id: 'hosp-apex-01', item_code: 'STORE-IV-SET', name: 'Vented IV Infusion Administration Set', category: 'Surgical Consumables', current_stock: 1200, unit: 'Pcs', reorder_level: 300, location_shelf: 'Rack B-12', unit_cost: 45 },
  { id: 'inv-item-03', hospital_id: 'hosp-apex-01', item_code: 'STORE-SYR-5ML', name: 'Disposable Syringes with Needle 5ml', category: 'Surgical Consumables', current_stock: 2500, unit: 'Pcs', reorder_level: 500, location_shelf: 'Rack B-08', unit_cost: 6.50 },
  { id: 'inv-item-04', hospital_id: 'hosp-apex-01', item_code: 'STORE-N95-MSK', name: 'N95 Medical Respirator Masks (Box of 50)', category: 'PPE & Hygiene', current_stock: 180, unit: 'Boxes', reorder_level: 50, location_shelf: 'Rack A-02', unit_cost: 650 }
];

// Initial Employees
const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'emp-001', hospital_id: 'hosp-apex-01', emp_code: 'EMP-COROT-001', name: 'Col. Sanjeev Nair (Retd.)', department_name: 'Administration & Operations', designation: 'Chief Operating Officer', role: 'hospital_admin', phone: '+91 98200 11223', email: 'admin.apex@corot.health', joining_date: '2024-01-16', salary: 280000, status: 'active' },
  { id: 'emp-002', hospital_id: 'hosp-apex-01', emp_code: 'EMP-COROT-002', name: 'Dr. Priya Sharma', department_name: 'Cardiology', designation: 'Chief Interventional Cardiologist', role: 'doctor', phone: '+91 98201 44556', email: 'dr.sharma@apex.corot.health', joining_date: '2024-01-20', salary: 350000, status: 'active' },
  { id: 'emp-003', hospital_id: 'hosp-apex-01', emp_code: 'EMP-COROT-003', name: 'Nurse Anita Roy', department_name: 'Nursing & Critical Care', designation: 'ICU Charge Nurse', role: 'nurse', phone: '+91 98202 77881', email: 'nurse.anita@apex.corot.health', joining_date: '2024-01-22', salary: 65000, status: 'active' },
  { id: 'emp-004', hospital_id: 'hosp-apex-01', emp_code: 'EMP-COROT-004', name: 'Rohan Mehra', department_name: 'Front Office & Reception', designation: 'Lead Front Desk Officer', role: 'receptionist', phone: '+91 98203 11990', email: 'reception@apex.corot.health', joining_date: '2024-01-23', salary: 38000, status: 'active' },
  { id: 'emp-005', hospital_id: 'hosp-apex-01', emp_code: 'EMP-COROT-005', name: 'Rajesh Kulkarni', department_name: 'Pharmacy & Therapeutics', designation: 'Chief Pharmacist', role: 'pharmacist', phone: '+91 98204 33221', email: 'pharma@apex.corot.health', joining_date: '2024-01-24', salary: 72000, status: 'active' },
  { id: 'emp-006', hospital_id: 'hosp-apex-01', emp_code: 'EMP-COROT-006', name: 'Dr. Sunita Gupta', department_name: 'Pathology & Laboratory Medicine', designation: 'Head Clinical Biochemist', role: 'lab_technician', phone: '+91 98205 99887', email: 'lab@apex.corot.health', joining_date: '2024-01-25', salary: 110000, status: 'active' }
];

// Initial Audit Logs
const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: 'aud-001', hospital_id: 'hosp-apex-01', hospital_name: 'Corot Apex Super-Specialty Hospital', user_id: 'usr-hospadmin-apex', user_email: 'admin.apex@corot.health', user_role: 'hospital_admin', action: 'LOGIN', module: 'Auth', details: 'User authenticated successfully via Enterprise SSO / Unified Password Gateway', ip_address: '103.21.244.18', created_at: '2026-08-31T04:00:00Z' },
  { id: 'aud-002', hospital_id: 'hosp-apex-01', hospital_name: 'Corot Apex Super-Specialty Hospital', user_id: 'usr-reception-apex', user_email: 'reception@apex.corot.health', user_role: 'receptionist', action: 'CREATE', module: 'OPD Queue', record_id: 'apt-001', details: 'Registered OPD Appointment Token #101 for Patient Ananya Deshpande under Dr. Priya Sharma', ip_address: '192.168.1.42', created_at: '2026-08-31T09:45:00Z' },
  { id: 'aud-003', hospital_id: 'hosp-apex-01', hospital_name: 'Corot Apex Super-Specialty Hospital', user_id: 'usr-lab-apex', user_email: 'lab@apex.corot.health', user_role: 'lab_technician', action: 'VERIFY', module: 'Laboratory', record_id: 'labord-001', details: 'Verified Cardiac Diagnostic Panel for Inpatient Rajesh Kumar Mehta (Troponin hs-cTnI Negative)', ip_address: '192.168.1.88', created_at: '2026-08-30T14:30:00Z' }
];

// Initial System Notifications
const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  { id: 'notif-001', hospital_id: 'hosp-apex-01', title: 'Critical Alert: Emergency Triage Conversion', message: 'Patient Rajesh Kumar Mehta stabilized and transferred from ER Bay 1 to ICCU Bed #101.', type: 'critical', module: 'Emergency', is_read: false, created_at: '2026-08-28T14:35:00Z' },
  { id: 'notif-002', hospital_id: 'hosp-apex-01', title: 'Near-Expiry Stock Warning', message: 'Medicine Atorvastatin Batch PFZ-2024-X41 expires in 15 days (Stock: 45 strips).', type: 'warning', module: 'Pharmacy', is_read: false, created_at: '2026-08-31T01:00:00Z' },
  { id: 'notif-003', hospital_id: 'hosp-apex-01', title: 'TPA Pre-Authorization Approved', message: 'Star Health approved cashless coverage of ₹200,000 for IPD-2026-0108.', type: 'success', module: 'Insurance', is_read: false, created_at: '2026-08-29T10:35:00Z' }
];

// LOCAL STORAGE REPOSITORY CLASS WITH MULTI-TENANT ISOLATION
class LocalStorageRepository {
  private get<T>(key: string, fallback: T): T {
    try {
      const stored = localStorage.getItem(`corot_hospicare_${key}`);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return fallback;
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`corot_hospicare_${key}`, JSON.stringify(value));
    } catch {
      // ignore
    }
  }

  // --- Multi-Tenant Query Filter Helper (Simulating Supabase RLS) ---
  private filterByTenant<T extends { hospital_id?: string }>(items: T[], activeHospitalId?: string, isSuperAdmin?: boolean): T[] {
    if (isSuperAdmin && !activeHospitalId) {
      return items; // Super Admin sees platform-wide if no filter chosen
    }
    if (!activeHospitalId) return [];
    return items.filter(item => item.hospital_id === activeHospitalId);
  }

  // Hospitals
  getHospitals(): Hospital[] {
    return this.get<Hospital[]>('hospitals', INITIAL_HOSPITALS);
  }
  saveHospital(hosp: Hospital): void {
    const list = this.getHospitals();
    const idx = list.findIndex(h => h.id === hosp.id);
    if (idx >= 0) list[idx] = hosp;
    else list.unshift(hosp);
    this.set('hospitals', list);
  }

  // Users
  getUsers(hospitalId?: string, isSuperAdmin?: boolean): User[] {
    const all = this.get<User[]>('users', INITIAL_USERS);
    if (isSuperAdmin && !hospitalId) return all;
    if (!hospitalId) return all;
    return all.filter(u => !u.hospital_id || u.hospital_id === hospitalId);
  }
  saveUser(user: User): void {
    const list = this.getUsers();
    const idx = list.findIndex(u => u.id === user.id);
    if (idx >= 0) list[idx] = user;
    else list.unshift(user);
    this.set('users', list);
  }

  // Departments
  getDepartments(hospitalId?: string, isSuperAdmin?: boolean): Department[] {
    const all = this.get<Department[]>('departments', INITIAL_DEPARTMENTS);
    return this.filterByTenant(all, hospitalId, isSuperAdmin);
  }
  saveDepartment(dept: Department): void {
    const list = this.get<Department[]>('departments', INITIAL_DEPARTMENTS);
    const idx = list.findIndex(d => d.id === dept.id);
    if (idx >= 0) list[idx] = dept;
    else list.push(dept);
    this.set('departments', list);
  }

  // Doctors
  getDoctors(hospitalId?: string, isSuperAdmin?: boolean): Doctor[] {
    const all = this.get<Doctor[]>('doctors', INITIAL_DOCTORS);
    return this.filterByTenant(all, hospitalId, isSuperAdmin);
  }
  saveDoctor(doctor: Doctor): void {
    const list = this.get<Doctor[]>('doctors', INITIAL_DOCTORS);
    const idx = list.findIndex(d => d.id === doctor.id);
    if (idx >= 0) list[idx] = doctor;
    else list.push(doctor);
    this.set('doctors', list);
  }

  // Patients
  getPatients(hospitalId?: string, isSuperAdmin?: boolean): Patient[] {
    const all = this.get<Patient[]>('patients', INITIAL_PATIENTS);
    return this.filterByTenant(all, hospitalId, isSuperAdmin);
  }
  savePatient(patient: Patient): void {
    const list = this.get<Patient[]>('patients', INITIAL_PATIENTS);
    const idx = list.findIndex(p => p.id === patient.id);
    if (idx >= 0) list[idx] = patient;
    else list.unshift(patient);
    this.set('patients', list);
  }

  // Wards & Beds
  getWards(hospitalId?: string, isSuperAdmin?: boolean): Ward[] {
    const all = this.get<Ward[]>('wards', INITIAL_WARDS);
    return this.filterByTenant(all, hospitalId, isSuperAdmin);
  }
  saveWard(ward: Ward): void {
    const list = this.get<Ward[]>('wards', INITIAL_WARDS);
    const idx = list.findIndex(w => w.id === ward.id);
    if (idx >= 0) list[idx] = ward;
    else list.push(ward);
    this.set('wards', list);
  }

  getBeds(hospitalId?: string, isSuperAdmin?: boolean): Bed[] {
    const all = this.get<Bed[]>('beds', INITIAL_BEDS);
    return this.filterByTenant(all, hospitalId, isSuperAdmin);
  }
  saveBed(bed: Bed): void {
    const list = this.get<Bed[]>('beds', INITIAL_BEDS);
    const idx = list.findIndex(b => b.id === bed.id);
    if (idx >= 0) list[idx] = bed;
    else list.push(bed);
    this.set('beds', list);
  }

  // OPD Appointments
  getAppointments(hospitalId?: string, isSuperAdmin?: boolean): OpdAppointment[] {
    const all = this.get<OpdAppointment[]>('appointments', INITIAL_APPOINTMENTS);
    return this.filterByTenant(all, hospitalId, isSuperAdmin);
  }
  saveAppointment(apt: OpdAppointment): void {
    const list = this.get<OpdAppointment[]>('appointments', INITIAL_APPOINTMENTS);
    const idx = list.findIndex(a => a.id === apt.id);
    if (idx >= 0) list[idx] = apt;
    else list.unshift(apt);
    this.set('appointments', list);
  }

  // IPD Admissions
  getAdmissions(hospitalId?: string, isSuperAdmin?: boolean): IpdAdmission[] {
    const all = this.get<IpdAdmission[]>('admissions', INITIAL_ADMISSIONS);
    return this.filterByTenant(all, hospitalId, isSuperAdmin);
  }
  saveAdmission(adm: IpdAdmission): void {
    const list = this.get<IpdAdmission[]>('admissions', INITIAL_ADMISSIONS);
    const idx = list.findIndex(a => a.id === adm.id);
    if (idx >= 0) list[idx] = adm;
    else list.unshift(adm);
    this.set('admissions', list);
  }

  // Emergency Visits
  getEmergencyVisits(hospitalId?: string, isSuperAdmin?: boolean): EmergencyVisit[] {
    const all = this.get<EmergencyVisit[]>('emergency_visits', INITIAL_EMERGENCY_VISITS);
    return this.filterByTenant(all, hospitalId, isSuperAdmin);
  }
  getTriageRecords(hospitalId?: string, isSuperAdmin?: boolean): EmergencyVisit[] {
    return this.getEmergencyVisits(hospitalId, isSuperAdmin);
  }
  saveEmergencyVisit(emg: EmergencyVisit): void {
    const list = this.get<EmergencyVisit[]>('emergency_visits', INITIAL_EMERGENCY_VISITS);
    const idx = list.findIndex(e => e.id === emg.id);
    if (idx >= 0) list[idx] = emg;
    else list.unshift(emg);
    this.set('emergency_visits', list);
  }

  // Medicines (Pharmacy ERP)
  getMedicines(hospitalId?: string, isSuperAdmin?: boolean): Medicine[] {
    const all = this.get<Medicine[]>('medicines', INITIAL_MEDICINES);
    return this.filterByTenant(all, hospitalId, isSuperAdmin);
  }
  saveMedicine(med: Medicine): void {
    const list = this.get<Medicine[]>('medicines', INITIAL_MEDICINES);
    const idx = list.findIndex(m => m.id === med.id);
    if (idx >= 0) list[idx] = med;
    else list.unshift(med);
    this.set('medicines', list);
  }

  getPharmacySales(hospitalId?: string, isSuperAdmin?: boolean): PharmacySale[] {
    const all = this.get<PharmacySale[]>('pharmacy_sales', []);
    return this.filterByTenant(all, hospitalId, isSuperAdmin);
  }
  savePharmacySale(sale: PharmacySale): void {
    const list = this.get<PharmacySale[]>('pharmacy_sales', []);
    list.unshift(sale);
    this.set('pharmacy_sales', list);
  }

  // Lab Tests & Orders
  getLabTests(hospitalId?: string, isSuperAdmin?: boolean): LabTest[] {
    const all = this.get<LabTest[]>('lab_tests', INITIAL_LAB_TESTS);
    return this.filterByTenant(all, hospitalId, isSuperAdmin);
  }
  saveLabTest(test: LabTest): void {
    const list = this.get<LabTest[]>('lab_tests', INITIAL_LAB_TESTS);
    const idx = list.findIndex(t => t.id === test.id);
    if (idx >= 0) list[idx] = test;
    else list.push(test);
    this.set('lab_tests', list);
  }

  getLabOrders(hospitalId?: string, isSuperAdmin?: boolean): LabOrder[] {
    const all = this.get<LabOrder[]>('lab_orders', INITIAL_LAB_ORDERS);
    return this.filterByTenant(all, hospitalId, isSuperAdmin);
  }
  saveLabOrder(order: LabOrder): void {
    const list = this.get<LabOrder[]>('lab_orders', INITIAL_LAB_ORDERS);
    const idx = list.findIndex(o => o.id === order.id);
    if (idx >= 0) list[idx] = order;
    else list.unshift(order);
    this.set('lab_orders', list);
  }

  // Radiology
  getRadiologyTests(hospitalId?: string, isSuperAdmin?: boolean): RadiologyTest[] {
    const all = this.get<RadiologyTest[]>('radiology_tests', INITIAL_RADIOLOGY_TESTS);
    return this.filterByTenant(all, hospitalId, isSuperAdmin);
  }
  getRadiologyOrders(hospitalId?: string, isSuperAdmin?: boolean): RadiologyOrder[] {
    const all = this.get<RadiologyOrder[]>('radiology_orders', INITIAL_RADIOLOGY_ORDERS);
    return this.filterByTenant(all, hospitalId, isSuperAdmin);
  }
  saveRadiologyOrder(order: RadiologyOrder): void {
    const list = this.get<RadiologyOrder[]>('radiology_orders', INITIAL_RADIOLOGY_ORDERS);
    const idx = list.findIndex(o => o.id === order.id);
    if (idx >= 0) list[idx] = order;
    else list.unshift(order);
    this.set('radiology_orders', list);
  }

  // Blood Bank
  getBloodUnits(hospitalId?: string, isSuperAdmin?: boolean): BloodUnit[] {
    const all = this.get<BloodUnit[]>('blood_units', INITIAL_BLOOD_UNITS);
    return this.filterByTenant(all, hospitalId, isSuperAdmin);
  }
  getBloodStock(hospitalId?: string, isSuperAdmin?: boolean): any[] {
    const all = this.get<any[]>('blood_stock', [
      { id: 'bs-1', hospital_id: 'hosp-apex-01', blood_group: 'A+', component: 'PRBC', units_available: 18, expiry_date: '2026-09-20', status: 'Optimal' },
      { id: 'bs-2', hospital_id: 'hosp-apex-01', blood_group: 'B+', component: 'PRBC', units_available: 24, expiry_date: '2026-09-22', status: 'Optimal' },
      { id: 'bs-3', hospital_id: 'hosp-apex-01', blood_group: 'O+', component: 'PRBC', units_available: 32, expiry_date: '2026-09-25', status: 'Optimal' },
      { id: 'bs-4', hospital_id: 'hosp-apex-01', blood_group: 'AB+', component: 'PRBC', units_available: 8, expiry_date: '2026-09-15', status: 'Low Stock' },
      { id: 'bs-5', hospital_id: 'hosp-apex-01', blood_group: 'O-', component: 'PRBC', units_available: 3, expiry_date: '2026-09-10', status: 'Critical' },
      { id: 'bs-6', hospital_id: 'hosp-apex-01', blood_group: 'A+', component: 'FFP', units_available: 15, expiry_date: '2027-08-10', status: 'Optimal' },
      { id: 'bs-7', hospital_id: 'hosp-apex-01', blood_group: 'B+', component: 'Platelets', units_available: 12, expiry_date: '2026-09-04', status: 'Optimal' }
    ]);
    return this.filterByTenant(all, hospitalId, isSuperAdmin);
  }
  saveBloodStock(stock: any): void {
    const list = this.get<any[]>('blood_stock', []);
    const idx = list.findIndex((s: any) => s.id === stock.id);
    if (idx >= 0) list[idx] = stock;
    else list.unshift(stock);
    this.set('blood_stock', list);
  }
  saveBloodUnit(unit: BloodUnit): void {
    const list = this.get<BloodUnit[]>('blood_units', INITIAL_BLOOD_UNITS);
    const idx = list.findIndex(b => b.id === unit.id);
    if (idx >= 0) list[idx] = unit;
    else list.unshift(unit);
    this.set('blood_units', list);
  }
  getBloodDonors(hospitalId?: string, isSuperAdmin?: boolean): BloodDonor[] {
    const all = this.get<BloodDonor[]>('blood_donors', INITIAL_BLOOD_DONORS);
    return this.filterByTenant(all, hospitalId, isSuperAdmin);
  }
  saveBloodDonor(donor: BloodDonor): void {
    const list = this.get<BloodDonor[]>('blood_donors', INITIAL_BLOOD_DONORS);
    const idx = list.findIndex(d => d.id === donor.id);
    if (idx >= 0) list[idx] = donor;
    else list.unshift(donor);
    this.set('blood_donors', list);
  }

  // Ambulance
  getAmbulances(hospitalId?: string, isSuperAdmin?: boolean): Ambulance[] {
    const all = this.get<Ambulance[]>('ambulances', INITIAL_AMBULANCES);
    return this.filterByTenant(all, hospitalId, isSuperAdmin);
  }
  saveAmbulance(amb: Ambulance): void {
    const list = this.get<Ambulance[]>('ambulances', INITIAL_AMBULANCES);
    const idx = list.findIndex(a => a.id === amb.id);
    if (idx >= 0) list[idx] = amb;
    else list.push(amb);
    this.set('ambulances', list);
  }
  getAmbulanceTrips(hospitalId?: string, isSuperAdmin?: boolean): AmbulanceTrip[] {
    const all = this.get<AmbulanceTrip[]>('ambulance_trips', INITIAL_AMBULANCE_TRIPS);
    return this.filterByTenant(all, hospitalId, isSuperAdmin);
  }
  saveAmbulanceTrip(trip: AmbulanceTrip): void {
    const list = this.get<AmbulanceTrip[]>('ambulance_trips', INITIAL_AMBULANCE_TRIPS);
    const idx = list.findIndex(t => t.id === trip.id);
    if (idx >= 0) list[idx] = trip;
    else list.unshift(trip);
    this.set('ambulance_trips', list);
  }

  // Invoices & Payments
  getInvoices(hospitalId?: string, isSuperAdmin?: boolean): Invoice[] {
    const all = this.get<Invoice[]>('invoices', INITIAL_INVOICES);
    return this.filterByTenant(all, hospitalId, isSuperAdmin);
  }
  saveInvoice(inv: Invoice): void {
    const list = this.get<Invoice[]>('invoices', INITIAL_INVOICES);
    const idx = list.findIndex(i => i.id === inv.id);
    if (idx >= 0) list[idx] = inv;
    else list.unshift(inv);
    this.set('invoices', list);
  }
  getPayments(hospitalId?: string, isSuperAdmin?: boolean): Payment[] {
    const all = this.get<Payment[]>('payments', INITIAL_PAYMENTS);
    return this.filterByTenant(all, hospitalId, isSuperAdmin);
  }
  savePayment(pay: Payment): void {
    const list = this.get<Payment[]>('payments', INITIAL_PAYMENTS);
    list.unshift(pay);
    this.set('payments', list);
  }
  getInsuranceClaims(hospitalId?: string, isSuperAdmin?: boolean): InsuranceClaim[] {
    const all = this.get<InsuranceClaim[]>('insurance_claims', INITIAL_CLAIMS);
    return this.filterByTenant(all, hospitalId, isSuperAdmin);
  }
  saveInsuranceClaim(claim: InsuranceClaim): void {
    const list = this.get<InsuranceClaim[]>('insurance_claims', INITIAL_CLAIMS);
    const idx = list.findIndex(c => c.id === claim.id);
    if (idx >= 0) list[idx] = claim;
    else list.unshift(claim);
    this.set('insurance_claims', list);
  }

  // Inventory Stores
  getInventoryItems(hospitalId?: string, isSuperAdmin?: boolean): InventoryItem[] {
    const all = this.get<InventoryItem[]>('inventory_items', INITIAL_INVENTORY);
    return this.filterByTenant(all, hospitalId, isSuperAdmin);
  }
  saveInventoryItem(item: InventoryItem): void {
    const list = this.get<InventoryItem[]>('inventory_items', INITIAL_INVENTORY);
    const idx = list.findIndex(i => i.id === item.id);
    if (idx >= 0) list[idx] = item;
    else list.unshift(item);
    this.set('inventory_items', list);
  }

  // Employees (HR)
  getEmployees(hospitalId?: string, isSuperAdmin?: boolean): Employee[] {
    const all = this.get<Employee[]>('employees', INITIAL_EMPLOYEES);
    return this.filterByTenant(all, hospitalId, isSuperAdmin);
  }
  saveEmployee(emp: Employee): void {
    const list = this.get<Employee[]>('employees', INITIAL_EMPLOYEES);
    const idx = list.findIndex(e => e.id === emp.id);
    if (idx >= 0) list[idx] = emp;
    else list.unshift(emp);
    this.set('employees', list);
  }

  // Audit Logs
  getAuditLogs(hospitalId?: string, isSuperAdmin?: boolean): AuditLog[] {
    const all = this.get<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);
    if (isSuperAdmin && !hospitalId) return all;
    if (!hospitalId) return [];
    return all.filter(l => !l.hospital_id || l.hospital_id === hospitalId);
  }
  addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): void {
    const list = this.get<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);
    const newLog: AuditLog = {
      ...log,
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString()
    };
    list.unshift(newLog);
    this.set('audit_logs', list.slice(0, 500)); // Cap to recent 500 logs
  }

  // Notifications
  getNotifications(hospitalId?: string, isSuperAdmin?: boolean): SystemNotification[] {
    const all = this.get<SystemNotification[]>('notifications', INITIAL_NOTIFICATIONS);
    if (isSuperAdmin && !hospitalId) return all;
    if (!hospitalId) return [];
    return all.filter(n => !n.hospital_id || n.hospital_id === hospitalId);
  }
  markNotificationRead(id: string): void {
    const list = this.get<SystemNotification[]>('notifications', INITIAL_NOTIFICATIONS);
    const item = list.find(n => n.id === id);
    if (item) item.is_read = true;
    this.set('notifications', list);
  }
}

export const db = new LocalStorageRepository();
