import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import { api } from './services/api';

// Pages
import DashboardPage from './pages/DashboardPage';
import PartiesPage from './pages/PartiesPage';
import DrugsPage from './pages/DrugsPage';
import BatchesPage from './pages/BatchesPage';
import QualityTestsPage from './pages/QualityTestsPage';
import PackagesPage from './pages/PackagesPage';
import ShipmentsPage from './pages/ShipmentsPage';
import RecallsPage from './pages/RecallsPage';
import DispensingPage from './pages/DispensingPage';
import AnalyticsPage from './pages/AnalyticsPage';
import VerifyPackagePage from './pages/VerifyPackagePage';
import UserManagementPage from './pages/UserManagementPage';
import AuditLogsPage from './pages/AuditLogsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PendingApprovalPage from './pages/PendingApprovalPage';

import { RefreshCw, ShieldAlert } from 'lucide-react';

function AppContent() {
  const { user, loading, isAuthenticated, isPending, isSuspended } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [dbMode, setDbMode] = useState('SIMULATION');
  const [toast, setToast] = useState(null);
  const [authView, setAuthView] = useState('login'); // 'login' | 'register' | 'public-verify'

  // Check backend health and database mode
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await api.getHealth();
        if (res.databaseMode === 'ORACLE_21C_LIVE') {
          setDbMode('ORACLE');
        } else {
          setDbMode('SIMULATION');
        }
      } catch (err) {
        setDbMode('OFFLINE');
      }
    }
    checkHealth();
  }, []);

  const showToast = (toastObj) => {
    setToast(toastObj);
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleNavigateToVerify = (qrCode) => {
    setCurrentTab('verify');
  };

  // 1. Loading state during session restoration
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-forest-800 animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Restoring authenticated session...</p>
        </div>
      </div>
    );
  }

  // 2. Public verification mode (unauthenticated users can still verify packages)
  if (!isAuthenticated && authView === 'public-verify') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-slate-900 text-lg">MedLedger</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-forest-100 text-forest-800 font-bold">Public Verification</span>
          </div>
          <button 
            onClick={() => setAuthView('login')}
            className="text-xs font-semibold px-3 py-1.5 bg-forest-800 text-white rounded-lg hover:bg-forest-900 transition-colors"
          >
            Sign In to Platform
          </button>
        </header>
        <main className="flex-1 overflow-y-auto">
          <VerifyPackagePage onToast={showToast} />
        </main>
        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  // 3. Unauthenticated views: Login / Register
  if (!user) {
    if (authView === 'register') {
      return (
        <RegisterPage 
          onNavigateToLogin={() => setAuthView('login')}
          onToast={showToast}
        />
      );
    }
    return (
      <LoginPage 
        onNavigateToRegister={() => setAuthView('register')}
        onNavigateToPublicVerify={() => setAuthView('public-verify')}
        onToast={showToast}
      />
    );
  }

  // 4. Pending, Suspended, or Declined status
  if (user.status !== 'APPROVED') {
    return <PendingApprovalPage />;
  }

  // 5. Authorized Role-Based Navigation Matrix
  const role = user.role;
  const isAllowed = (tab) => {
    switch (tab) {
      case 'dashboard':
        return true;
      case 'verify':
        return true;
      case 'drugs':
        return true; // shared catalogue
      case 'analytics':
        return true; // analytics queries
      case 'recalls':
        return true; // critical public safety
      case 'packages':
        return true;
      case 'shipments':
        return true;
      case 'batches':
        return ['ADMINISTRATOR', 'MANUFACTURER', 'DISTRIBUTOR', 'REGULATOR'].includes(role);
      case 'quality-tests':
        return ['ADMINISTRATOR', 'MANUFACTURER', 'REGULATOR'].includes(role);
      case 'dispensing':
        return ['ADMINISTRATOR', 'PHARMACY', 'REGULATOR'].includes(role);
      case 'parties':
        return ['ADMINISTRATOR', 'REGULATOR'].includes(role);
      case 'users':
        return role === 'ADMINISTRATOR';
      case 'audit-logs':
        return ['ADMINISTRATOR', 'REGULATOR'].includes(role);
      default:
        return false;
    }
  };

  // Safe navigation fallback if role cannot view current tab
  const activeTab = isAllowed(currentTab) ? currentTab : 'dashboard';

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      {/* Sidebar Navigation (role-filtered) */}
      <Sidebar 
        currentTab={activeTab} 
        onSelectTab={setCurrentTab} 
        dbMode={dbMode} 
        user={user}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar 
          currentTab={activeTab} 
          onQuickVerify={() => setCurrentTab('verify')}
          dbMode={dbMode}
        />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardPage 
              onNavigate={setCurrentTab} 
            />
          )}

          {activeTab === 'users' && isAllowed('users') && (
            <UserManagementPage 
              onToast={showToast} 
            />
          )}

          {activeTab === 'audit-logs' && isAllowed('audit-logs') && (
            <AuditLogsPage 
              onToast={showToast} 
            />
          )}

          {activeTab === 'verify' && (
            <VerifyPackagePage 
              onToast={showToast} 
            />
          )}

          {activeTab === 'parties' && isAllowed('parties') && (
            <PartiesPage 
              onToast={showToast} 
            />
          )}

          {activeTab === 'drugs' && (
            <DrugsPage 
              onToast={showToast} 
            />
          )}

          {activeTab === 'batches' && isAllowed('batches') && (
            <BatchesPage 
              onToast={showToast} 
            />
          )}

          {activeTab === 'quality-tests' && isAllowed('quality-tests') && (
            <QualityTestsPage 
              onToast={showToast} 
            />
          )}

          {activeTab === 'packages' && (
            <PackagesPage 
              onToast={showToast}
              onNavigateToVerify={handleNavigateToVerify}
            />
          )}

          {activeTab === 'shipments' && (
            <ShipmentsPage 
              onToast={showToast} 
            />
          )}

          {activeTab === 'recalls' && (
            <RecallsPage 
              onToast={showToast} 
            />
          )}

          {activeTab === 'dispensing' && isAllowed('dispensing') && (
            <DispensingPage 
              onToast={showToast} 
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPage 
              onToast={showToast} 
            />
          )}
        </main>
      </div>

      {/* Toast Notification Container */}
      <Toast 
        toast={toast} 
        onClose={() => setToast(null)} 
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
