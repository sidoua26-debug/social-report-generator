import React from 'react';
import { BarChart3, PlusCircle, Settings, LogOut, FileText } from 'lucide-react';
import { getBackendUrl } from '../api';

export default function Navbar({ user, activeTab, setActiveTab, onLogout }) {
  const brandColor = user?.brand_color || '#4F46E5';
  const logoUrl = user?.logo_url ? getBackendUrl(user.logo_url) : null;

  return (
    <nav className="no-print bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Agency Brand & App Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={user?.agency_name || 'Agency Logo'}
                className="h-9 w-auto max-w-[140px] object-contain rounded"
              />
            ) : (
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
                style={{ backgroundColor: brandColor }}
              >
                <BarChart3 className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="font-semibold text-slate-900 leading-tight">
                {user?.agency_name || 'Agency Portal'}
              </div>
              <div className="text-xs text-slate-400 font-medium">Social Report Studio</div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center gap-1 sm:gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'dashboard'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Reports</span>
            </button>

            <button
              onClick={() => setActiveTab('new_report')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
              style={{ backgroundColor: brandColor }}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Generate Report</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'settings'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title="Agency Branding Settings"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Branding</span>
            </button>

            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sign out</span>
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}
