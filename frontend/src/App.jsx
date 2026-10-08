import React, { useState, useEffect } from 'react';
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

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [dbMode, setDbMode] = useState('SIMULATION');
  const [toast, setToast] = useState(null);

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

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar 
        currentTab={currentTab} 
        onSelectTab={setCurrentTab} 
        dbMode={dbMode} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar 
          currentTab={currentTab} 
          onQuickVerify={() => setCurrentTab('verify')}
          dbMode={dbMode}
        />

        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardPage 
              onNavigate={setCurrentTab} 
            />
          )}

          {currentTab === 'verify' && (
            <VerifyPackagePage 
              onToast={showToast} 
            />
          )}

          {currentTab === 'parties' && (
            <PartiesPage 
              onToast={showToast} 
            />
          )}

          {currentTab === 'drugs' && (
            <DrugsPage 
              onToast={showToast} 
            />
          )}

          {currentTab === 'batches' && (
            <BatchesPage 
              onToast={showToast} 
            />
          )}

          {currentTab === 'quality-tests' && (
            <QualityTestsPage 
              onToast={showToast} 
            />
          )}

          {currentTab === 'packages' && (
            <PackagesPage 
              onToast={showToast}
              onNavigateToVerify={handleNavigateToVerify}
            />
          )}

          {currentTab === 'shipments' && (
            <ShipmentsPage 
              onToast={showToast} 
            />
          )}

          {currentTab === 'recalls' && (
            <RecallsPage 
              onToast={showToast} 
            />
          )}

          {currentTab === 'dispensing' && (
            <DispensingPage 
              onToast={showToast} 
            />
          )}

          {currentTab === 'analytics' && (
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
