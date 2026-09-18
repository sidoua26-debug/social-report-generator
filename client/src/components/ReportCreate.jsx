import React, { useState } from 'react';
import { Upload, FileText, Sparkles, CheckCircle2, AlertCircle, ArrowRight, Download, Calendar } from 'lucide-react';
import { api, getBackendUrl } from '../api';

export default function ReportCreate({ user, onReportCreated }) {
  const [clientName, setClientName] = useState('');
  const [file, setFile] = useState(null);
  const [useSample, setUseSample] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');

  const brandColor = user?.brand_color || '#4F46E5';

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.toLowerCase().endsWith('.csv')) {
        setError('Please select a valid .csv file.');
        return;
      }
      setFile(selected);
      setUseSample(false);
      setError('');
    }
  };

  const handleUseSample = () => {
    setUseSample(true);
    setFile(null);
    if (!clientName) {
      setClientName('Glow Botanicals');
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!useSample && !file) {
      setError('Please upload an Instagram analytics CSV file or click "Use Sample Instagram Data".');
      return;
    }

    setLoading(true);
    setError('');
    setLoadingStep('Uploading & parsing Instagram analytics CSV...');

    try {
      const formData = new FormData();
      formData.append('client_name', clientName || 'Valued Client');

      if (useSample) {
        formData.append('use_sample', 'true');
      } else if (file) {
        formData.append('csv_file', file);
      }

      setLoadingStep('Calculating follower growth, engagement rates, and top posts...');
      
      // Delay step message slightly for great UX feel
      setTimeout(() => {
        setLoadingStep('Synthesizing plain-English executive summary with AI...');
      }, 700);

      const response = await api.generateReport(formData);
      onReportCreated(response.report);
    } catch (err) {
      setError(err.message || 'Failed to generate report.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Generate Client Report</h1>
        <p className="text-slate-500 text-sm mt-1">
          Upload your client's Instagram analytics CSV export. We'll automatically compute engagement rates, follower growth, top 3 posts, and an AI executive summary.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Error Processing CSV</div>
            <div className="text-xs mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {/* Quick Test Card for zero-friction evaluation */}
      <div className="mb-8 p-5 bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-white rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-900 text-sm">Want to test right now without a CSV file?</span>
          </div>
          <p className="text-xs text-slate-500 max-w-lg">
            Use our built-in 30-day Instagram analytics dataset (featuring organic skincare brand &ldquo;Glow Botanicals&rdquo; with 12 posts, Reels, and real engagement metrics).
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleUseSample}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm ${
              useSample
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-800 border border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
            }`}
          >
            {useSample ? '✓ Sample Selected' : 'Load Sample Data'}
          </button>
          <a
            href={getBackendUrl('/api/reports/download/sample-csv')}
            download="sample_instagram_export.csv"
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
            title="Download sample CSV file to inspect columns"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        
        {/* Client Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1.5">
            Client or Brand Name *
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="e.g. Glow Botanicals"
            required
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        {/* Automatic Reporting Period Detection Notice */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-3">
          <Calendar className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800">Automatic Period Detection: </span>
            The reporting period is strictly derived from the earliest and latest post dates in your uploaded Instagram CSV export.
          </div>
        </div>

        {/* File Upload / Selected Sample */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-2">
            Instagram Analytics Export (.csv) *
          </label>

          {useSample ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="text-sm font-semibold text-emerald-900">Pre-loaded Instagram Sample Dataset</div>
                  <div className="text-xs text-emerald-700">30-day analytics with 12 posts, Reels, and follower metrics</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUseSample(false)}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline"
              >
                Upload my own CSV instead
              </button>
            </div>
          ) : (
            <label className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-2xl p-8 text-center cursor-pointer bg-slate-50 hover:bg-slate-100 transition flex flex-col items-center justify-center group">
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-slate-800">
                {file ? file.name : 'Click to select Instagram CSV export'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {file ? `${(file.size / 1024).toFixed(1)} KB selected` : 'Supports standard Meta Business Suite / Instagram analytics exports'}
              </div>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || (!file && !useSample)}
          className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: brandColor }}
        >
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{loadingStep || 'Generating report...'}</span>
            </div>
          ) : (
            <>
              <span>Generate Branded Report</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

      </form>
    </div>
  );
}
