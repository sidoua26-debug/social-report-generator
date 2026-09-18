import React, { useState } from 'react';
import {
  Users,
  Heart,
  TrendingUp,
  Share2,
  Download,
  Link as LinkIcon,
  Check,
  Calendar,
  Sparkles,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  MessageCircle,
  Bookmark,
  Send,
  Eye,
  ArrowLeft
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { getBackendUrl } from '../api';

export default function ReportView({ report, isPublic = false, onBack }) {
  const [copied, setCopied] = useState(false);

  if (!report) return null;

  const brandColor = report.brand_color || '#4F46E5';
  const logoUrl = report.logo_url ? getBackendUrl(report.logo_url) : null;
  const metrics = report.computed_metrics || {};

  const followers = metrics.followers || {};
  const engagement = metrics.engagement || {};
  const trend = metrics.trend || {};
  const topPosts = metrics.topPosts || [];
  const timeline = metrics.timeline || [];

  const shareableUrl = `${window.location.origin}?view=${report.shareable_token}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100/70 py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      
      {/* Top Toolbar (Hidden when printing) */}
      <div className="no-print max-w-5xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4">
        {onBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        ) : <div />}

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 shadow-sm transition"
            title="Copy shareable link to send to client"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <LinkIcon className="w-4 h-4 text-slate-500" />}
            <span>{copied ? 'Client Link Copied!' : 'Copy Shareable Link'}</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-2 text-xs font-semibold text-white px-4 py-2 rounded-xl shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: brandColor }}
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Report</span>
          </button>
        </div>
      </div>

      {/* Main Printable Document Page */}
      <div className="print-page max-w-5xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-10 transition">
        
        {/* Header: Agency Identity & Client Metadata */}
        <div className="border-b border-slate-200 pb-8 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={report.agency_name}
                className="h-14 w-auto max-w-[180px] object-contain rounded-lg"
              />
            ) : (
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md"
                style={{ backgroundColor: brandColor }}
              >
                {report.agency_name ? report.agency_name.charAt(0).toUpperCase() : 'A'}
              </div>
            )}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Prepared by {report.agency_name || 'Social Media Agency'}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                {report.client_name}
              </h1>
              <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Reporting Period: {report.period_start} — {report.period_end}</span>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-end gap-2 text-right">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-sm"
              style={{ backgroundColor: brandColor }}
            >
              Instagram Analytics
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Generated {new Date(report.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* AI Executive Summary Card */}
        <div
          className="mb-8 p-6 rounded-2xl border transition relative overflow-hidden"
          style={{
            borderColor: `${brandColor}33`,
            backgroundColor: `${brandColor}08`
          }}
        >
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles className="w-4 h-4" style={{ color: brandColor }} />
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: brandColor }}>
              Executive Performance Summary
            </h3>
          </div>
          <p className="text-slate-800 text-sm sm:text-base leading-relaxed font-medium">
            {report.summary_text}
          </p>
        </div>

        {/* 4 Key Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
          
          {/* Card 1: Follower Growth */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 relative">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Followers</span>
              <div className="p-2 rounded-xl bg-white shadow-xs text-slate-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {followers.end ? followers.end.toLocaleString() : '—'}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold">
              {followers.netChange >= 0 ? (
                <span className="text-emerald-700 flex items-center bg-emerald-100/70 px-1.5 py-0.5 rounded-md">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                  +{followers.netChange.toLocaleString()} ({followers.growthRatePct}%)
                </span>
              ) : (
                <span className="text-red-700 flex items-center bg-red-100/70 px-1.5 py-0.5 rounded-md">
                  <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                  {followers.netChange.toLocaleString()} ({followers.growthRatePct}%)
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Total Engagement */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Engagement</span>
              <div className="p-2 rounded-xl bg-white shadow-xs text-rose-500">
                <Heart className="w-4 h-4 fill-rose-500" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {engagement.total ? engagement.total.toLocaleString() : '0'}
            </div>
            <div className="mt-1.5 text-xs text-slate-500 flex items-center gap-2">
              <span>{engagement.likes?.toLocaleString()} likes</span>
              <span>•</span>
              <span>{engagement.comments?.toLocaleString()} comments</span>
            </div>
          </div>

          {/* Card 3: Engagement Rate */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Engagement Rate</span>
              <div
                className="p-2 rounded-xl bg-white shadow-xs font-bold text-xs"
                style={{ color: brandColor }}
              >
                %
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {engagement.engagementRatePct}%
            </div>
            <div className="mt-1.5 text-xs text-slate-500">
              Per reach & interactions
            </div>
          </div>

          {/* Card 4: Trend Momentum */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Period Momentum</span>
              <div className="p-2 rounded-xl bg-white shadow-xs text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {trend.percentageChange >= 0 ? `+${trend.percentageChange}%` : `${trend.percentageChange}%`}
            </div>
            <div className="mt-1.5 text-xs text-slate-500 truncate" title={trend.description}>
              Half-over-half growth
            </div>
          </div>

        </div>

        {/* Engagement Trend Interactive Chart */}
        {timeline.length > 1 && (
          <div className="mb-8 p-6 bg-slate-50/60 rounded-2xl border border-slate-200/80 break-inside-avoid">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Engagement Velocity & Trajectory</h3>
                <p className="text-xs text-slate-400">Daily interaction volume throughout the reporting cycle</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: brandColor }}></span>
                  Total Interactions
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline} margin={{ top: 10, right: 35, left: -15, bottom: 8 }}>
                  <defs>
                    <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={brandColor} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={brandColor} stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    padding={{ left: 12, right: 24 }}
                    interval="preserveStartEnd"
                    dy={6}
                    tickFormatter={(v) => {
                      if (!v) return '';
                      const parts = v.split('-');
                      if (parts.length === 3) {
                        return `${parts[1]}/${parts[2]}`;
                      }
                      return v.slice(5);
                    }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="engagement"
                    name="Interactions"
                    stroke={brandColor}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorEngagement)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Top 3 Performing Posts */}
        <div className="mb-8 break-inside-avoid">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5" style={{ color: brandColor }} />
                Top Performing Posts
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">The 3 pieces of content that generated the highest total audience engagement</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {topPosts.map((post, idx) => (
              <div
                key={post.id || idx}
                className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition relative group"
              >
                {/* Rank Badge */}
                <div className="flex justify-between items-start mb-3">
                  <span
                    className="h-7 w-7 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-xs"
                    style={{ backgroundColor: brandColor }}
                  >
                    #{idx + 1}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 bg-white border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg uppercase">
                      {post.type}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {post.date}
                    </span>
                  </div>
                </div>

                {/* Caption Snippet */}
                <div className="text-xs text-slate-700 font-medium line-clamp-3 mb-4 leading-relaxed italic bg-white/80 p-3 rounded-xl border border-slate-100">
                  &ldquo;{post.caption}&rdquo;
                </div>

                {/* Metrics Breakdown Grid */}
                <div>
                  <div className="pt-3 border-t border-slate-200/80 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-2 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center justify-center gap-0.5">
                        <Heart className="w-3 h-3 text-rose-500 inline" />
                        Likes
                      </div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">
                        {post.likes.toLocaleString()}
                      </div>
                    </div>

                    <div className="bg-white p-2 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center justify-center gap-0.5">
                        <MessageCircle className="w-3 h-3 text-indigo-500 inline" />
                        Comments
                      </div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">
                        {post.comments.toLocaleString()}
                      </div>
                    </div>

                    <div className="bg-white p-2 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center justify-center gap-0.5">
                        <Share2 className="w-3 h-3 text-emerald-500 inline" />
                        Shares
                      </div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">
                        {post.shares.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-between items-center text-xs font-bold px-1">
                    <span className="text-slate-500">Total Engagement:</span>
                    <span style={{ color: brandColor }} className="text-sm">
                      {post.totalEngagement.toLocaleString()}
                    </span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Report Footer */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Confidential Client Performance Report</span>
            <span>•</span>
            <span>Prepared with {report.agency_name}</span>
          </div>
          <div>
            Powered by Social Report Studio
          </div>
        </div>

      </div>

    </div>
  );
}
