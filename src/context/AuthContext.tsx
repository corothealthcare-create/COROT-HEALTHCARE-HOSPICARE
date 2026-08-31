/**
 * COROT HEALTHCARE HOSPICARE - AUTH CONTEXT
 * Provides Global Unified Login, Role Resolution, and Tenant Access Verification.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Hospital, SuperAdminAccessGrant } from '../types';
import { db } from '../lib/database';
import { canAccess } from '../lib/rbac';

interface AuthContextType {
  user: User | null;
  activeHospital: Hospital | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  superAdminGrant: SuperAdminAccessGrant | null;
  canAccessModule: (moduleName: string) => boolean;
  login: (email: string, password?: string, hospitalCode?: string) => Promise<{ success: boolean; error?: string }>;
  switchDemoRole: (email: string) => void;
  logout: () => void;
  setActiveHospital: (hospital: Hospital | null) => void;
  grantSuperAdminAccess: (
    hospital: Hospital,
    reason: string,
    mode: 'read_only' | 'administrative',
    durationMinutes: number
  ) => void;
  revokeSuperAdminAccess: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeHospital, setActiveHospitalState] = useState<Hospital | null>(null);
  const [superAdminGrant, setSuperAdminGrant] = useState<SuperAdminAccessGrant | null>(null);

  // Check grant expiration timer
  useEffect(() => {
    if (!superAdminGrant) return;
    const interval = setInterval(() => {
      if (new Date() > new Date(superAdminGrant.expires_at)) {
        // Grant expired
        db.addAuditLog({
          hospital_id: superAdminGrant.hospital_id,
          hospital_name: superAdminGrant.hospital_name,
          user_id: user?.id || 'usr-super',
          user_email: user?.email || '',
          user_role: 'super_admin',
          action: 'SECURITY_GRANT_EXPIRED',
          module: 'Platform Access Control',
          details: `Temporary Super Admin access to [${superAdminGrant.hospital_name}] has expired automatically.`
        });
        setSuperAdminGrant(null);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [superAdminGrant, user]);

  // Initialize from session
  useEffect(() => {
    const savedUserEmail = localStorage.getItem('corot_session_email');
    const users = db.getUsers();
    const hospitals = db.getHospitals();

    if (savedUserEmail) {
      const found = users.find(u => u.email.toLowerCase() === savedUserEmail.toLowerCase());
      if (found) {
        setUser(found);
        if (found.hospital_id) {
          const hosp = hospitals.find(h => h.id === found.hospital_id) || hospitals[0];
          setActiveHospitalState(hosp);
        } else if (found.is_super_admin) {
          setActiveHospitalState(hospitals[0]);
        }
        return;
      }
    }

    // Default to Super Admin on fresh start for full ERP demonstration
    const defaultSuperAdmin = users.find(u => u.is_super_admin) || users[0];
    setUser(defaultSuperAdmin);
    setActiveHospitalState(hospitals[0]);
    localStorage.setItem('corot_session_email', defaultSuperAdmin.email);
  }, []);

  const login = async (email: string, _password?: string, _hospitalCode?: string): Promise<{ success: boolean; error?: string }> => {
    const users = db.getUsers();
    const hospitals = db.getHospitals();
    const matched = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

    if (!matched) {
      return { success: false, error: 'Invalid medical credentials or user profile not registered.' };
    }

    if (!matched.is_active) {
      return { success: false, error: 'User account has been suspended or deactivated. Contact Hospital Super Admin.' };
    }

    setUser(matched);
    localStorage.setItem('corot_session_email', matched.email);

    if (matched.hospital_id) {
      const hosp = hospitals.find(h => h.id === matched.hospital_id) || hospitals[0];
      setActiveHospitalState(hosp);
    } else if (matched.is_super_admin) {
      setActiveHospitalState(hospitals[0]);
    }

    db.addAuditLog({
      hospital_id: matched.hospital_id,
      hospital_name: matched.hospital_id ? hospitals.find(h => h.id === matched.hospital_id)?.name : 'Platform Wide',
      user_id: matched.id,
      user_email: matched.email,
      user_role: matched.role,
      action: 'LOGIN',
      module: 'Authentication',
      details: `User ${matched.full_name} logged in with role [${matched.role.toUpperCase()}]`
    });

    return { success: true };
  };

  const switchDemoRole = (email: string) => {
    const users = db.getUsers();
    const hospitals = db.getHospitals();
    const found = users.find(u => u.email === email);
    if (found) {
      setUser(found);
      localStorage.setItem('corot_session_email', found.email);
      if (found.hospital_id) {
        const hosp = hospitals.find(h => h.id === found.hospital_id) || hospitals[0];
        setActiveHospitalState(hosp);
      }
    }
  };

  const logout = () => {
    if (user) {
      db.addAuditLog({
        hospital_id: user.hospital_id,
        user_id: user.id,
        user_email: user.email,
        user_role: user.role,
        action: 'LOGOUT',
        module: 'Authentication',
        details: `User ${user.full_name} signed out of session.`
      });
    }
    localStorage.removeItem('corot_session_email');
    const users = db.getUsers();
    const patientUser = users.find(u => u.role === 'patient') || users[0];
    setUser(patientUser);
    setSuperAdminGrant(null);
  };

  const setActiveHospital = (hosp: Hospital | null) => {
    if (user?.is_super_admin) {
      setActiveHospitalState(hosp);
    }
  };

  const grantSuperAdminAccess = (
    hospital: Hospital,
    reason: string,
    mode: 'read_only' | 'administrative',
    durationMinutes: number
  ) => {
    if (!user?.is_super_admin) return;

    const grantedAt = new Date();
    const expiresAt = new Date(grantedAt.getTime() + durationMinutes * 60000);

    const grant: SuperAdminAccessGrant = {
      id: `grant-${Date.now()}`,
      hospital_id: hospital.id,
      hospital_name: hospital.name,
      reason,
      access_mode: mode,
      duration_minutes: durationMinutes,
      granted_at: grantedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      granted_by: user.email
    };

    setSuperAdminGrant(grant);
    setActiveHospitalState(hospital);

    db.addAuditLog({
      hospital_id: hospital.id,
      hospital_name: hospital.name,
      user_id: user.id,
      user_email: user.email,
      user_role: 'super_admin',
      action: 'SECURITY_CONTROLLED_ACCESS_AUTHORIZED',
      module: 'Platform Tenant Isolation',
      record_id: grant.id,
      details: `Super Admin [${user.email}] authorized controlled session for hospital [${hospital.name}]. Mode: ${mode.toUpperCase()}, Duration: ${durationMinutes} mins. Justification: "${reason}"`
    });
  };

  const revokeSuperAdminAccess = () => {
    if (!superAdminGrant) return;
    db.addAuditLog({
      hospital_id: superAdminGrant.hospital_id,
      hospital_name: superAdminGrant.hospital_name,
      user_id: user?.id || 'usr-super',
      user_email: user?.email || '',
      user_role: 'super_admin',
      action: 'SECURITY_CONTROLLED_ACCESS_REVOKED',
      module: 'Platform Tenant Isolation',
      details: `Super Admin manually closed authorized controlled session for [${superAdminGrant.hospital_name}].`
    });
    setSuperAdminGrant(null);
  };

  const isSuperAdmin = Boolean(user?.is_super_admin || user?.role === 'super_admin');

  const canAccessModule = useCallback(
    (moduleName: string): boolean => {
      if (!user) return false;
      return canAccess(user.role, moduleName);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        activeHospital,
        isAuthenticated: !!user,
        isSuperAdmin,
        superAdminGrant,
        canAccessModule,
        login,
        switchDemoRole,
        logout,
        setActiveHospital,
        grantSuperAdminAccess,
        revokeSuperAdminAccess
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
