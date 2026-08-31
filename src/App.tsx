import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { AppSidebar } from './components/layout/AppSidebar';
import { AppHeader } from './components/layout/AppHeader';
import { RoleSwitcherBar } from './components/layout/RoleSwitcherBar';
import { GlobalSearchModal } from './components/search/GlobalSearchModal';

// Pages
import { SuperAdminOverview } from './pages/superadmin/SuperAdminOverview';
import { DynamicDashboard } from './pages/dashboard/DynamicDashboard';
import { PatientRegistryPage } from './pages/patients/PatientRegistryPage';
import { OpdQueuePage } from './pages/opd/OpdQueuePage';
import { IpdBedMatrixPage } from './pages/ipd/IpdBedMatrixPage';
import { EmergencyTriagePage } from './pages/emergency/EmergencyTriagePage';
import { PharmacyPosPage } from './pages/pharmacy/PharmacyPosPage';
import { LaboratoryPage } from './pages/laboratory/LaboratoryPage';
import { RadiologyPage } from './pages/radiology/RadiologyPage';
import { BloodBankPage } from './pages/bloodbank/BloodBankPage';
import { AmbulancePage } from './pages/ambulance/AmbulancePage';
import { InventoryStoresPage } from './pages/inventory/InventoryStoresPage';
import { HrStaffDirectoryPage } from './pages/hr/HrStaffDirectoryPage';
import { BillingOverviewPage } from './pages/billing/BillingOverviewPage';
import { InsuranceClaimsPage } from './pages/insurance/InsuranceClaimsPage';
import { EnterpriseReportsPage } from './pages/reports/EnterpriseReportsPage';
import { HospitalAuditTrailPage } from './pages/audit/HospitalAuditTrailPage';

const MainLayout: React.FC = () => {
  const { user, isSuperAdmin, canAccessModule } = useAuth();
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // If superadmin switches persona, default to appropriate module
  useEffect(() => {
    if (isSuperAdmin && activeModule === 'dashboard') {
      // Super admin can choose superadmin or dashboard
    } else if (!canAccessModule(activeModule)) {
      setActiveModule('dashboard');
    }
  }, [user?.role, isSuperAdmin]);

  // Global Keyboard Shortcut for Search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'superadmin':
        return <SuperAdminOverview onNavigate={setActiveModule} />;
      case 'dashboard':
        return <DynamicDashboard onNavigate={setActiveModule} />;
      case 'patients':
        return <PatientRegistryPage />;
      case 'opd':
        return <OpdQueuePage />;
      case 'ipd':
        return <IpdBedMatrixPage />;
      case 'emergency':
        return <EmergencyTriagePage />;
      case 'pharmacy':
        return <PharmacyPosPage />;
      case 'laboratory':
        return <LaboratoryPage />;
      case 'radiology':
        return <RadiologyPage />;
      case 'bloodbank':
        return <BloodBankPage />;
      case 'ambulance':
        return <AmbulancePage />;
      case 'inventory':
        return <InventoryStoresPage />;
      case 'staff':
        return <HrStaffDirectoryPage />;
      case 'billing':
        return <BillingOverviewPage />;
      case 'insurance':
        return <InsuranceClaimsPage />;
      case 'reports':
        return <EnterpriseReportsPage />;
      case 'audit':
        return <HospitalAuditTrailPage />;
      default:
        return <DynamicDashboard onNavigate={setActiveModule} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#030712] text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Sidebar Navigation */}
      <AppSidebar
        activeModule={activeModule}
        onNavigate={setActiveModule}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-gradient-to-b from-[#030712] via-[#080d1e] to-[#030712]">
        {/* Quick Role & Tenant Switcher Bar */}
        <RoleSwitcherBar onNavigate={setActiveModule} />

        {/* Global App Header */}
        <AppHeader onOpenSearch={() => setIsSearchOpen(true)} onNavigate={setActiveModule} />

        {/* Viewport Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="max-w-7xl mx-auto">
            {renderActiveModule()}
          </div>
        </main>
      </div>

      {/* Global Command / Spotlight Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={setActiveModule}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainLayout />
      </NotificationProvider>
    </AuthProvider>
  );
}
