import React, { useState, useEffect } from 'react';
import { api } from './api';
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ReportCreate from './components/ReportCreate';
import ReportView from './components/ReportView';
import AgencySettings from './components/AgencySettings';

export default function App() {
  const [user, setUser] = useState(api.getUser());
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'new_report' | 'settings' | 'view_report'
  const [activeReport, setActiveReport] = useState(null);
  const [publicToken, setPublicToken] = useState(null);
  const [publicReport, setPublicReport] = useState(null);
  const [loadingPublic, setLoadingPublic] = useState(false);
  const [publicError, setPublicError] = useState('');

  // 1. Check for public shareable link query: ?view=<token>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('view');
    if (token) {
      setPublicToken(token);
      loadPublicReport(token);
    }
  }, []);

  const loadPublicReport = async (token) => {
    setLoadingPublic(true);
    setPublicError('');
    try {
      const res = await api.getPublicReport(token);
      setPublicReport(res.report);
    } catch (err) {
      setPublicError(err.message || 'The requested performance report is unavailable.');
    } finally {
      setLoadingPublic(false);
    }
  };

  // 2. Public Read-Only Client Route
  if (publicToken) {
    if (loadingPublic) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <span className="text-sm font-semibold">Loading Client Performance Report...</span>
        </div>
      );
    }

    if (publicError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 text-center shadow-lg">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3 text-lg font-bold">
              !
            </div>
            <h2 className="text-lg font-bold text-slate-900">Report Not Found</h2>
            <p className="text-xs text-slate-500 mt-1 mb-6">{publicError}</p>
            <a
              href={window.location.pathname}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Go to Agency Home
            </a>
          </div>
        </div>
      );
    }

    return <ReportView report={publicReport} isPublic={true} />;
  }

  // 3. Authenticated Check
  if (!user) {
    return <Auth onAuthSuccess={(authenticatedUser) => setUser(authenticatedUser)} />;
  }

  const handleLogout = () => {
    api.setToken(null);
    api.setUser(null);
    setUser(null);
  };

  const handleSelectReport = async (reportId) => {
    try {
      const res = await api.getReport(reportId);
      setActiveReport(res.report);
      setActiveTab('view_report');
    } catch (err) {
      alert('Failed to load report.');
    }
  };

  const handleReportCreated = (createdReport) => {
    setActiveReport(createdReport);
    setActiveTab('view_report');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveReport(null);
          setActiveTab(tab);
        }}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {activeTab === 'dashboard' && (
          <Dashboard
            user={user}
            onSelectReport={handleSelectReport}
            onNewReport={() => setActiveTab('new_report')}
          />
        )}

        {activeTab === 'new_report' && (
          <ReportCreate
            user={user}
            onReportCreated={handleReportCreated}
          />
        )}

        {activeTab === 'settings' && (
          <AgencySettings
            user={user}
            onUserUpdated={(updatedUser) => setUser(updatedUser)}
          />
        )}

        {activeTab === 'view_report' && activeReport && (
          <ReportView
            report={activeReport}
            isPublic={false}
            onBack={() => setActiveTab('dashboard')}
          />
        )}
      </main>
    </div>
  );
}
