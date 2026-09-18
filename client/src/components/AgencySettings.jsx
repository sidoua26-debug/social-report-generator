import React, { useState } from 'react';
import { Upload, Check, Palette, Building2, Image as ImageIcon, Sparkles } from 'lucide-react';
import { api, getBackendUrl } from '../api';

const PRESET_COLORS = [
  { name: 'Indigo', hex: '#4F46E5' },
  { name: 'Violet', hex: '#7C3AED' },
  { name: 'Rose', hex: '#E11D48' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Ocean', hex: '#0284C7' },
  { name: 'Amber', hex: '#D97706' },
  { name: 'Slate', hex: '#334155' }
];

export default function AgencySettings({ user, onUserUpdated }) {
  const [agencyName, setAgencyName] = useState(user?.agency_name || '');
  const [brandColor, setBrandColor] = useState(user?.brand_color || '#4F46E5');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(
    user?.logo_url ? getBackendUrl(user.logo_url) : null
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      // 1. Update text fields
      const brandRes = await api.updateBranding({
        agency_name: agencyName,
        brand_color: brandColor
      });

      let updatedUser = brandRes.user;

      // 2. Upload logo if new file selected
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        const logoRes = await api.uploadLogo(formData);
        updatedUser = logoRes.user;
      }

      api.setUser(updatedUser);
      onUserUpdated(updatedUser);
      setMessage('Agency branding updated successfully!');
      setLogoFile(null);
    } catch (err) {
      setError(err.message || 'Failed to save branding settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Agency Branding & Style</h1>
        <p className="text-slate-500 text-sm mt-1">
          Customize your agency identity. These settings automatically apply to all client performance reports, PDF exports, and shareable client links.
        </p>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Form Controls */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            
            {/* Agency Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                Agency or Business Name
              </label>
              <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="e.g. Apex Social Media Studio"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-slate-400" />
                Agency Logo
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-4 text-center cursor-pointer bg-slate-50 hover:bg-slate-100 transition flex flex-col items-center justify-center">
                  <Upload className="w-6 h-6 text-slate-400 mb-1.5" />
                  <span className="text-xs font-semibold text-slate-700">Click to upload logo</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, or SVG (max 5MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Brand Color Selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <Palette className="w-4 h-4 text-slate-400" />
                Primary Brand Color
              </label>
              
              {/* Preset swatches */}
              <div className="flex flex-wrap gap-2.5 mb-3">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setBrandColor(preset.hex)}
                    className="h-8 w-8 rounded-full flex items-center justify-center border-2 transition shadow-sm"
                    style={{
                      backgroundColor: preset.hex,
                      borderColor: brandColor.toLowerCase() === preset.hex.toLowerCase() ? '#0f172a' : 'transparent'
                    }}
                    title={preset.name}
                  >
                    {brandColor.toLowerCase() === preset.hex.toLowerCase() && (
                      <Check className="w-4 h-4 text-white drop-shadow-sm" />
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Hex input */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl border border-slate-300 shrink-0 shadow-inner"
                  style={{ backgroundColor: brandColor }}
                />
                <input
                  type="text"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  placeholder="#4F46E5"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  className="w-36 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-400">Used for headers, charts, and metric accents.</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 px-4 rounded-xl text-white font-semibold text-sm shadow-sm transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: brandColor }}
            >
              {saving ? 'Saving changes...' : 'Save Branding'}
            </button>
          </div>

          {/* Right Column: Live Report Header Preview */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Live Report Header Preview
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="border-b border-slate-100 pb-5 mb-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="h-10 max-w-[140px] object-contain rounded"
                    />
                  ) : (
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: brandColor }}
                    >
                      {agencyName ? agencyName.charAt(0).toUpperCase() : 'A'}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      {agencyName || 'Your Agency Name'}
                    </div>
                    <div className="text-[11px] text-slate-400">Monthly Social Intelligence Report</div>
                  </div>
                </div>

                <div
                  className="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: brandColor }}
                >
                  Client Ready
                </div>
              </div>

              {/* Sample Metric Mockup */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[11px] text-slate-400 font-medium">Follower Growth</div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">+1,470</div>
                  <div className="text-[11px] font-semibold mt-1" style={{ color: brandColor }}>
                    +11.8% this period
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[11px] text-slate-400 font-medium">Engagement Rate</div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">13.6%</div>
                  <div className="text-[11px] text-slate-500 mt-1">Above benchmark</div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500 italic bg-slate-50/50">
                &ldquo;Executive summary: Performance grew +25% period-over-period driven by high-engagement Reels...&rdquo;
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Every client report, PDF document, and shareable link will consistently use your logo and brand accent.
            </p>
          </div>

        </div>
      </form>
    </div>
  );
}
