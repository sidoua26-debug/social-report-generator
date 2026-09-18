import React, { useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  Link as LinkIcon,
  Check,
  Calendar,
  Trash2,
  Eye,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../api';

export default function Dashboard({ user, onSelectReport, onNewReport }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState('');

  const brandColor = user?.brand_color || '#4F46E5';

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await api.getReports();
      setReports(res.reports || []);
    } catch (err) {
      setError('Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleCopyLink = (token, id, e) => {
    e.stopPropagation();
    const url = `${window.location.origin}?view=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await api.deleteReport(id);
      setReports(reports.filter(r => r.id !== id));
    } catch (err) {
      alert('Failed to delete report.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Client Reports
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your generated Instagram performance reports and client presentation links.
          </p>
        </div>

        <button
          onClick={onNewReport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm shadow-sm transition hover:opacity-95"
          style={{ backgroundColor: brandColor }}
        >
          <Plus className="w-4 h-4" />
          <span>New Client Report</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Reports Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <span className="text-sm font-medium">Loading reports...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No client reports yet</h3>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 mb-6 max-w-md mx-auto">
            Upload an Instagram analytics export CSV (or use our instant sample dataset) to generate your first branded report with AI summaries.
          </p>
          <button
            onClick={onNewReport}
            className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow-md transition hover:opacity-90 inline-flex items-center gap-2"
            style={{ backgroundColor: brandColor }}
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate First Report</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div
              key={report.id}
              onClick={() => onSelectReport(report.id)}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between group hover:border-slate-300"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                    Instagram
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {new Date(report.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition flex items-center justify-between">
                  <span>{report.client_name}</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition" />
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1 mb-4">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{report.period_start} to {report.period_end}</span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                  &ldquo;{report.summary_text}&rdquo;
                </p>
              </div>

              {/* Card Actions */}
              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => handleCopyLink(report.shareable_token, report.id, e)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 py-1 px-2 rounded-lg hover:bg-slate-100 transition"
                  title="Copy unguessable client link"
                >
                  {copiedId === report.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>Share Link</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onSelectReport(report.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                    title="View report"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(report.id, e)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
