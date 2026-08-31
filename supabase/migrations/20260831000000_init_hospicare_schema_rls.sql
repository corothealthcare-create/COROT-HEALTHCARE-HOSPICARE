-- ==============================================================================
-- COROT HEALTHCARE HOSPICARE - ENTERPRISE MULTI-TENANT DATABASE & RLS ENGINE
-- PostgreSQL Migration Version: 20260831000000
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE user_role_type AS ENUM (
    'super_admin',
    'hospital_admin',
    'medical_superintendent',
    'doctor',
    'nurse',
    'receptionist',
    'pharmacist',
    'lab_technician',
    'radiologist',
    'accountant',
    'hr_manager',
    'inventory_manager',
    'blood_bank_staff',
    'ambulance_driver',
    'patient',
    'support_staff'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'provisioning', 'maintenance');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE access_mode_type AS ENUM ('read_only', 'administrative');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. CORE TENANT & IDENTITY TABLES
-- ==============================================================================

-- HOSPITALS (Tenants)
CREATE TABLE IF NOT EXISTS public.hospitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  tagline VARCHAR(255),
  license_number VARCHAR(100) NOT NULL,
  status tenant_status DEFAULT 'active',
  tier VARCHAR(50) DEFAULT 'Enterprise Standard',
  bed_capacity INTEGER DEFAULT 100 CHECK (bed_capacity >= 0),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  phone VARCHAR(50),
  emergency_phone VARCHAR(50),
  email VARCHAR(255),
  tax_id VARCHAR(100),
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER PROFILES (Mapping auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  avatar_url TEXT,
  is_super_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER ROLES & HOSPITAL MEMBERSHIP (Tenant Authorization Bridge)
CREATE TABLE IF NOT EXISTS public.user_hospitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  role user_role_type NOT NULL,
  department_id UUID,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, hospital_id, role)
);

-- SUPER ADMIN CONTROLLED ACCESS GRANTS
CREATE TABLE IF NOT EXISTS public.controlled_access_grants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  super_admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  access_mode access_mode_type NOT NULL DEFAULT 'read_only',
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT
);

-- HOSPITAL SETTINGS
CREATE TABLE IF NOT EXISTS public.hospital_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID UNIQUE NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  currency_symbol VARCHAR(10) DEFAULT '₹',
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  invoice_prefix VARCHAR(20) DEFAULT 'INV',
  opd_token_prefix VARCHAR(20) DEFAULT 'OPD',
  uhid_prefix VARCHAR(20) DEFAULT 'UHID',
  gst_tax_rate NUMERIC(5,2) DEFAULT 18.00,
  tax_identifier VARCHAR(100),
  enable_nabh_compliance BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DEPARTMENTS
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  head_of_department VARCHAR(255),
  floor_location VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hospital_id, code)
);

-- DOCTORS
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  specialty VARCHAR(255) NOT NULL,
  qualification VARCHAR(255),
  registration_number VARCHAR(100) NOT NULL,
  consultation_fee NUMERIC(10,2) DEFAULT 500.00 CHECK (consultation_fee >= 0),
  room_number VARCHAR(50),
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PATIENTS
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  uhid VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 0 AND age <= 150),
  gender VARCHAR(20) NOT NULL,
  blood_group VARCHAR(10),
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  allergies TEXT[],
  chronic_conditions TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hospital_id, uhid)
);

-- APPOINTMENTS & OPD QUEUE
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  token_number INTEGER NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  time_slot VARCHAR(50),
  status VARCHAR(50) DEFAULT 'waiting' CHECK (status IN ('scheduled', 'waiting', 'in_consultation', 'completed', 'cancelled')),
  symptoms TEXT,
  triage_priority VARCHAR(20) DEFAULT 'Normal',
  consultation_fee NUMERIC(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRESCRIPTIONS
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  diagnosis TEXT NOT NULL,
  vitals JSONB DEFAULT '{}'::jsonb,
  clinical_notes TEXT,
  advice TEXT,
  is_dispensed BOOLEAN DEFAULT FALSE,
  dispensed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRESCRIPTION ITEMS
CREATE TABLE IF NOT EXISTS public.prescription_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  medicine_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  instructions TEXT
);

-- WARDS & BED MATRIX
CREATE TABLE IF NOT EXISTS public.wards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  ward_type VARCHAR(100) NOT NULL,
  floor VARCHAR(50),
  capacity INTEGER DEFAULT 20,
  daily_charge NUMERIC(10,2) DEFAULT 1000.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.beds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  ward_id UUID NOT NULL REFERENCES public.wards(id) ON DELETE CASCADE,
  bed_number VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'cleaning', 'maintenance', 'reserved')),
  daily_rate NUMERIC(10,2) DEFAULT 1000.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ward_id, bed_number)
);

-- IPD ADMISSIONS
CREATE TABLE IF NOT EXISTS public.ipd_admissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  ipd_number VARCHAR(100) NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  bed_id UUID NOT NULL REFERENCES public.beds(id) ON DELETE RESTRICT,
  admitted_at TIMESTAMPTZ DEFAULT NOW(),
  admission_diagnosis TEXT,
  estimated_stay_days INTEGER DEFAULT 3,
  status VARCHAR(50) DEFAULT 'admitted' CHECK (status IN ('admitted', 'discharged', 'transferred', 'absconded')),
  discharge_summary TEXT,
  discharged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hospital_id, ipd_number)
);

-- EMERGENCY TRIAGE
CREATE TABLE IF NOT EXISTS public.emergency_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  er_number VARCHAR(100) NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  triage_level VARCHAR(20) NOT NULL CHECK (triage_level IN ('Red', 'Yellow', 'Green', 'Black')),
  gcs_score INTEGER CHECK (gcs_score BETWEEN 3 AND 15),
  vitals JSONB DEFAULT '{}'::jsonb,
  chief_complaint TEXT NOT NULL,
  assigned_doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'under_triage' CHECK (status IN ('under_triage', 'resuscitation', 'stabilized', 'admitted_ipd', 'discharged', 'transferred')),
  arrived_at TIMESTAMPTZ DEFAULT NOW(),
  disposition_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hospital_id, er_number)
);

-- PHARMACY MEDICINES & BATCHES
CREATE TABLE IF NOT EXISTS public.medicines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  category VARCHAR(100) NOT NULL,
  dosage_form VARCHAR(100) NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  mrp NUMERIC(10,2) NOT NULL CHECK (mrp >= 0),
  reorder_level INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hospital_id, code)
);

CREATE TABLE IF NOT EXISTS public.medicine_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  batch_number VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  purchase_price NUMERIC(10,2) NOT NULL,
  sale_price NUMERIC(10,2) NOT NULL,
  expiry_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(medicine_id, batch_number)
);

-- PHARMACY SALES
CREATE TABLE IF NOT EXISTS public.pharmacy_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  invoice_number VARCHAR(100) NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  tax_amount NUMERIC(10,2) DEFAULT 0.00,
  payment_mode VARCHAR(50) DEFAULT 'Cash',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hospital_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS public.pharmacy_sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES public.pharmacy_sales(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE RESTRICT,
  batch_id UUID NOT NULL REFERENCES public.medicine_batches(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL
);

-- LABORATORY & PATHOLOGY
CREATE TABLE IF NOT EXISTS public.lab_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  order_number VARCHAR(100) NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  test_name VARCHAR(255) NOT NULL,
  sample_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'ordered' CHECK (status IN ('ordered', 'sample_collected', 'in_progress', 'completed', 'cancelled')),
  results JSONB DEFAULT '{}'::jsonb,
  technician_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hospital_id, order_number)
);

-- RADIOLOGY & IMAGING
CREATE TABLE IF NOT EXISTS public.radiology_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  order_number VARCHAR(100) NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  modality VARCHAR(50) NOT NULL CHECK (modality IN ('X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'PET-CT')),
  body_part VARCHAR(100) NOT NULL,
  findings TEXT,
  impression TEXT,
  dicom_image_url TEXT,
  status VARCHAR(50) DEFAULT 'ordered' CHECK (status IN ('ordered', 'captured', 'reported', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hospital_id, order_number)
);

-- BLOOD BANK
CREATE TABLE IF NOT EXISTS public.blood_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  unit_number VARCHAR(100) NOT NULL,
  blood_group VARCHAR(10) NOT NULL,
  component VARCHAR(50) DEFAULT 'PRBC',
  donor_id VARCHAR(100),
  volume_ml INTEGER DEFAULT 350,
  expiry_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'transfused', 'expired', 'discarded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hospital_id, unit_number)
);

-- AMBULANCES
CREATE TABLE IF NOT EXISTS public.ambulances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  vehicle_number VARCHAR(50) NOT NULL,
  vehicle_type VARCHAR(100) DEFAULT 'Advanced Life Support (ALS)',
  driver_name VARCHAR(255) NOT NULL,
  driver_phone VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'dispatched', 'on_mission', 'maintenance')),
  current_location VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hospital_id, vehicle_number)
);

-- BILLING & INVOICES
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  invoice_number VARCHAR(100) NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  bill_type VARCHAR(50) DEFAULT 'OPD' CHECK (bill_type IN ('OPD', 'IPD', 'Emergency', 'Pharmacy', 'Lab', 'Radiology')),
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  discount NUMERIC(10,2) DEFAULT 0.00 CHECK (discount >= 0),
  tax_amount NUMERIC(10,2) DEFAULT 0.00 CHECK (tax_amount >= 0),
  grand_total NUMERIC(10,2) NOT NULL CHECK (grand_total >= 0),
  paid_amount NUMERIC(10,2) DEFAULT 0.00 CHECK (paid_amount >= 0),
  balance_due NUMERIC(10,2) NOT NULL CHECK (balance_due >= 0),
  status VARCHAR(50) DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partially_paid', 'paid', 'refunded', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hospital_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_price NUMERIC(10,2) NOT NULL CHECK (total_price >= 0)
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  receipt_number VARCHAR(100) NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('Cash', 'Card', 'UPI', 'Bank_Transfer', 'Insurance_TPA')),
  transaction_ref VARCHAR(100),
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hospital_id, receipt_number)
);

-- INSURANCE & TPA CLAIMS
CREATE TABLE IF NOT EXISTS public.insurance_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  claim_number VARCHAR(100) NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  tpa_provider VARCHAR(255) NOT NULL,
  policy_number VARCHAR(100) NOT NULL,
  claim_amount NUMERIC(10,2) NOT NULL,
  approved_amount NUMERIC(10,2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'settled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hospital_id, claim_number)
);

-- INVENTORY & STORES
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  item_code VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  quantity_on_hand INTEGER DEFAULT 0 CHECK (quantity_on_hand >= 0),
  unit_of_measure VARCHAR(50) DEFAULT 'pcs',
  reorder_level INTEGER DEFAULT 20,
  cost_per_unit NUMERIC(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hospital_id, item_code)
);

-- IMMUTABLE AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  user_role VARCHAR(100),
  action VARCHAR(100) NOT NULL,
  module VARCHAR(100) NOT NULL,
  record_id VARCHAR(100),
  details TEXT NOT NULL,
  ip_address VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. PERFORMANCE & TENANT ISOLATION INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_user_hospitals_user_hosp ON public.user_hospitals(user_id, hospital_id);
CREATE INDEX IF NOT EXISTS idx_patients_hosp_uhid ON public.patients(hospital_id, uhid);
CREATE INDEX IF NOT EXISTS idx_appointments_hosp_date ON public.appointments(hospital_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_hosp_patient ON public.prescriptions(hospital_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_hosp_invno ON public.invoices(hospital_id, invoice_number);
CREATE INDEX IF NOT EXISTS idx_audit_logs_hosp_time ON public.audit_logs(hospital_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_grants_admin_hosp ON public.controlled_access_grants(super_admin_id, hospital_id, expires_at);

-- ==============================================================================
-- 5. SECURITY DEFINER FUNCTIONS (RLS ENGINE)
-- ==============================================================================

-- Check if current authenticated user is a platform Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

-- Check if Super Admin has an active, unexpired, non-revoked controlled access grant for a specific hospital
CREATE OR REPLACE FUNCTION public.has_controlled_hospital_access(target_hospital_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.controlled_access_grants
    WHERE super_admin_id = auth.uid()
      AND hospital_id = target_hospital_id
      AND is_revoked = FALSE
      AND expires_at > NOW()
  );
$$;

-- Determine if current user has authorized access to a hospital (via direct membership OR valid super admin grant)
CREATE OR REPLACE FUNCTION public.user_has_hospital_access(target_hospital_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT (
    -- Case 1: User is directly enrolled in this hospital tenant
    EXISTS (
      SELECT 1 FROM public.user_hospitals
      WHERE user_id = auth.uid()
        AND hospital_id = target_hospital_id
        AND is_active = TRUE
    )
    OR
    -- Case 2: User is Super Admin with an active, unexpired, non-revoked controlled access grant
    (public.is_super_admin() AND public.has_controlled_hospital_access(target_hospital_id))
  );
$$;

-- Determine write capability (Super Admins in read_only mode are blocked from write operations)
CREATE OR REPLACE FUNCTION public.user_can_write_hospital(target_hospital_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT (
    -- Normal hospital staff member
    EXISTS (
      SELECT 1 FROM public.user_hospitals
      WHERE user_id = auth.uid()
        AND hospital_id = target_hospital_id
        AND is_active = TRUE
    )
    OR
    -- Super admin with ADMINISTRATIVE override grant
    (
      public.is_super_admin() AND EXISTS (
        SELECT 1 FROM public.controlled_access_grants
        WHERE super_admin_id = auth.uid()
          AND hospital_id = target_hospital_id
          AND access_mode = 'administrative'
          AND is_revoked = FALSE
          AND expires_at > NOW()
      )
    )
  );
$$;

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES ON ALL TENANT-OWNED TABLES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controlled_access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipd_admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radiology_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambulances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 6.1 HOSPITALS POLICIES
DROP POLICY IF EXISTS hospitals_select ON public.hospitals;
CREATE POLICY hospitals_select ON public.hospitals
  FOR SELECT TO authenticated
  USING (public.is_super_admin() OR public.user_has_hospital_access(id));

DROP POLICY IF EXISTS hospitals_modify ON public.hospitals;
CREATE POLICY hospitals_modify ON public.hospitals
  FOR ALL TO authenticated
  USING (public.is_super_admin());

-- 6.2 PROFILES POLICIES
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_super_admin());

-- 6.3 CONTROLLED ACCESS GRANTS POLICIES
DROP POLICY IF EXISTS grants_policy ON public.controlled_access_grants;
CREATE POLICY grants_policy ON public.controlled_access_grants
  FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.user_has_hospital_access(hospital_id));

-- 6.4 MACRO HELPER FOR STANDARD TENANT TABLES
-- We apply tenant-isolated policies across all tenant-owned tables:
-- SELECT: user_has_hospital_access(hospital_id)
-- INSERT: user_can_write_hospital(hospital_id)
-- UPDATE: user_can_write_hospital(hospital_id)
-- DELETE: user_can_write_hospital(hospital_id)

DO $$
DECLARE
  tbl text;
  tenant_tables text[] := ARRAY[
    'hospital_settings',
    'departments',
    'doctors',
    'patients',
    'appointments',
    'prescriptions',
    'prescription_items',
    'wards',
    'beds',
    'ipd_admissions',
    'emergency_visits',
    'medicines',
    'medicine_batches',
    'pharmacy_sales',
    'pharmacy_sale_items',
    'lab_orders',
    'radiology_orders',
    'blood_inventory',
    'ambulances',
    'invoices',
    'invoice_items',
    'payments',
    'insurance_claims',
    'inventory_items',
    'audit_logs'
  ];
BEGIN
  FOREACH tbl IN ARRAY tenant_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_select_policy ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY %I_select_policy ON public.%I FOR SELECT TO authenticated USING (public.user_has_hospital_access(hospital_id))',
      tbl, tbl
    );

    EXECUTE format('DROP POLICY IF EXISTS %I_insert_policy ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY %I_insert_policy ON public.%I FOR INSERT TO authenticated WITH CHECK (public.user_can_write_hospital(hospital_id))',
      tbl, tbl
    );

    EXECUTE format('DROP POLICY IF EXISTS %I_update_policy ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY %I_update_policy ON public.%I FOR UPDATE TO authenticated USING (public.user_can_write_hospital(hospital_id)) WITH CHECK (public.user_can_write_hospital(hospital_id))',
      tbl, tbl
    );

    EXECUTE format('DROP POLICY IF EXISTS %I_delete_policy ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY %I_delete_policy ON public.%I FOR DELETE TO authenticated USING (public.user_can_write_hospital(hospital_id))',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ==============================================================================
-- 7. SEED TEST DATA (HOSPITAL-A & HOSPITAL-B)
-- ==============================================================================

INSERT INTO public.hospitals (id, code, name, tagline, license_number, bed_capacity, city, state)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'HOSPITAL-A', 'Apollo Care Multispecialty', 'Center for Clinical Excellence', 'NABH-2026-DEL-01', 350, 'New Delhi', 'Delhi'),
  ('22222222-2222-2222-2222-222222222222', 'HOSPITAL-B', 'Max Health Institute', 'Precision Medical Care', 'NABH-2026-MUM-02', 250, 'Mumbai', 'Maharashtra')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.patients (id, hospital_id, uhid, name, age, gender, blood_group, phone)
VALUES
  ('a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'UHID-2026-000101', 'Rajesh Sharma', 48, 'Male', 'O+', '+91 98111 22334'),
  ('b2222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'UHID-2026-000201', 'Sunita Deshmukh', 52, 'Female', 'B+', '+91 98222 33445')
ON CONFLICT DO NOTHING;

INSERT INTO public.medicines (id, hospital_id, code, name, category, dosage_form, unit_price, mrp)
VALUES
  ('m1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'MED-AUG-625', 'Augmentin 625mg', 'Antibiotic', 'Tablet', 18.50, 22.00),
  ('m2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'MED-MET-500', 'Metformin 500mg SR', 'Antidiabetic', 'Tablet', 6.00, 8.50)
ON CONFLICT DO NOTHING;

INSERT INTO public.invoices (id, hospital_id, invoice_number, patient_id, subtotal, discount, grand_total, paid_amount, balance_due, status)
VALUES
  ('i1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'INV-2026-001001', 'a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1500.00, 0.00, 1500.00, 1500.00, 0.00, 'paid'),
  ('i2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'INV-2026-002001', 'b2222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2400.00, 200.00, 2200.00, 1000.00, 1200.00, 'partially_paid')
ON CONFLICT DO NOTHING;
