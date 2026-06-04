import React, { useState } from 'react';
import { 
  Award, 
  Mail, 
  Users, 
  Wallet, 
  CheckCircle, 
  ArrowRight, 
  Search, 
  RefreshCw, 
  Download, 
  AlertCircle, 
  Check, 
  Send, 
  Filter, 
  FileText,
  BadgeAlert,
  Loader,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Recipient, Template } from '../types';
import { downloadSingleCertificate } from '../utils/pdfGenerator';

interface DashboardProps {
  recipients: Recipient[];
  template: Template;
  activeView: string;
  setActiveView: (view: string) => void;
  onResendEmail: (id: string) => Promise<{ success: boolean; message: string }>;
}

export default function Dashboard({ 
  recipients, 
  template, 
  activeView, 
  setActiveView,
  onResendEmail
}: DashboardProps) {
  
  // High level statistic aggregations
  const total = recipients.length;
  const generated = recipients.filter((r) => r.status === 'generated').length;
  const sent = recipients.filter((r) => r.emailStatus === 'sent').length;
  const failed = recipients.filter((r) => r.emailStatus === 'failed').length;
  const sending = recipients.filter((r) => r.emailStatus === 'sending').length;
  const pendingGen = total - generated;

  // Search & Filtering registries states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'generated' | 'pending' | 'sent' | 'failed' | 'sending'>('all');
  
  // Async feedback markers
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ id: string; success: boolean; text: string } | null>(null);

  // Saved calculation (estimates ₦1,200.00 average cost per API/SaaS certificate issued)
  const savingsPerCertificate = 1200;
  const totalSaved = generated * savingsPerCertificate;

  const formatNaira = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getCompletionPercentage = () => {
    if (total === 0) return 0;
    return Math.round((generated / total) * 100);
  };

  const getEmailPercentage = () => {
    if (total === 0) return 0;
    return Math.round((sent / total) * 100);
  };

  // Sifting recipient registry array
  const filteredRecipients = recipients.filter((r) => {
    const matchesSearch = 
      (r?.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (r?.email || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (r?.id || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (r?.course && r.course.toLowerCase().includes((searchTerm || '').toLowerCase()));

    if (!matchesSearch) return false;

    switch (statusFilter) {
      case 'generated':
        return r.status === 'generated';
      case 'pending':
        return r.status === 'pending';
      case 'sent':
        return r.emailStatus === 'sent';
      case 'failed':
        return r.emailStatus === 'failed';
      case 'sending':
        return r.emailStatus === 'sending';
      case 'all':
      default:
        return true;
    }
  });

  const handleResendClick = async (id: string) => {
    setResendingId(id);
    setFeedbackMsg(null);
    try {
      const outcome = await onResendEmail(id);
      if (outcome.success) {
        setFeedbackMsg({ id, success: true, text: 'Dispatched successfully!' });
      } else {
        setFeedbackMsg({ id, success: false, text: outcome.message || 'Delivery failed' });
      }
    } catch (e: any) {
      setFeedbackMsg({ id, success: false, text: e.message || 'Error occurred' });
    } finally {
      setResendingId(null);
      // Fade notification toast after 4.5 seconds
      setTimeout(() => setFeedbackMsg(null), 4500);
    }
  };

  const handleDownloadCopy = async (recipient: Recipient) => {
    try {
      await downloadSingleCertificate(recipient, template);
    } catch {
      alert('Could not render certificate on canvas preview. Please verify template values are correct.');
    }
  };

  return (
    <div className="space-y-6" id="dashboard-section">
      
      {/* Banner / Premium Welcoming card */}
      <div className="bg-white border border-slate-200/80 p-8 rounded-2xl relative overflow-hidden shadow-sm flex flex-col md:flex-row items-center justify-between gap-6" id="dashboard-welcomer-banner">
        <div className="relative z-10 max-w-2xl">
          <span className="bg-indigo-50 text-indigo-600 text-[11px] px-3 py-1 rounded-full font-bold tracking-wider uppercase">
            Academy Cost Eliminator
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-3 text-slate-900">
            Automated Certificate Platform
          </h2>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-lg">
            Generate unlimited premium vector academic PDFs and manage email campaigns in-house. 
            No subscriptions. No per-certificate metering fees. 
          </p>
          <div className="mt-5 flex gap-3 flex-wrap">
            <button
              onClick={() => setActiveView('template')}
              className="bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
            >
              Configure Design
              <ArrowRight className="w-4 h-4 text-indigo-650" />
            </button>
            <button
              onClick={() => setActiveView('recipients')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg cursor-pointer transition-colors shadow-sm shadow-indigo-100"
            >
              Upload Recipients CSV
            </button>
          </div>
        </div>
        {/* Direct modern illustration container */}
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center shrink-0">
          <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
      </div>

      {/* Grid status cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Students */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-start gap-4">
          <div className="h-11 w-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block tracking-wider uppercase">
              Total Students
            </span>
            <span className="text-2xl font-bold text-slate-800 tracking-tight block mt-1">
              {total}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Parsed from current batch
            </span>
          </div>
        </div>

        {/* Card 2: PDFs Rendered */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-start gap-4">
          <div className="h-11 w-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <Award className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block tracking-wider uppercase">
              PDFs Generated
            </span>
            <span className="text-2xl font-bold text-slate-800 tracking-tight block mt-1">
              {generated} <span className="text-sm font-normal text-slate-400">/ {total}</span>
            </span>
            <div className="w-32 bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-indigo-505 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${getCompletionPercentage()}%`, backgroundColor: '#4f46e5' }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Email Dispatched */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-start gap-4">
          <div className="h-11 w-11 bg-indigo-50/70 text-indigo-700 rounded-xl flex items-center justify-center shrink-0">
            <Mail className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block tracking-wider uppercase">
              Emails Sent
            </span>
            <span className="text-2xl font-bold text-slate-800 tracking-tight block mt-1">
              {sent} <span className="text-sm font-normal text-slate-400">/ {total}</span>
            </span>
            <div className="w-32 bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-indigo-650 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${getEmailPercentage()}%`, backgroundColor: '#3b82f6' }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Cost Savings */}
        <div className="bg-white border border-emerald-100 bg-emerald-50/25 rounded-2xl p-5 shadow-sm flex items-start gap-4">
          <div className="h-11 w-11 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
            <Wallet className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-700 block tracking-wider uppercase">
              Your Budget Saved
            </span>
            <span className="text-2xl font-bold text-slate-800 tracking-tight block mt-1">
              {formatNaira(totalSaved)}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">
              @ ₦1,200 saved per issuance
            </span>
          </div>
        </div>
      </div>

      {/* Main split sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Quick Campaign Console (Left/Mid) */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-150">
            <div>
              <h3 className="font-bold text-lg text-slate-850 tracking-tight">Active Certificate Campaign</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Summary of the active template and recipient cohort</p>
            </div>
            <span className="bg-indigo-50 text-indigo-750 font-bold font-mono text-xs px-2.5 py-1 rounded">
              {template.credentialPrefix || 'ACAD'} SERIES
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-xl">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-tight block">Active Design Template</span>
              <p className="font-bold text-slate-800 text-sm">{template.name}</p>
              <p className="text-xs text-slate-500 mt-1">
                Academy: <span className="font-semibold text-slate-700">{template.academyName}</span>
              </p>
              <p className="text-xs text-slate-500">
                Course: <span className="font-semibold text-slate-700">{template.courseName}</span>
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-tight block">Signatory Panel</span>
              <p className="text-xs font-semibold text-slate-700">1. {template.signatory1Name} <span className="text-slate-400 font-medium">({template.signatory1Title})</span></p>
              <p className="text-xs font-semibold text-slate-700">2. {template.signatory2Name} <span className="text-slate-400 font-medium font-semibold">({template.signatory2Title})</span></p>
              <p className="text-[10px] text-slate-400 italic mt-1.5 block">Pre-rendered and signed electronically</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase">AUTOMATION PROCESS CHECKLIST</h4>
            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 rounded-full p-0.5 ${total > 0 ? 'bg-indigo-100 text-indigo-650' : 'bg-slate-100 text-slate-400'}`}>
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">1. Recipient List Uploaded</p>
                  <p className="text-xs text-slate-500">
                    {total > 0 ? `Successfully imported ${total} students with emails mapped.` : 'Navigate to Recipient section to load your CSV or paste simple columns.'}
                  </p>
                </div>
              </div>
              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 rounded-full p-0.5 ${generated > 0 && generated === total ? 'bg-indigo-100 text-indigo-600' : generated > 0 ? 'bg-indigo-50 text-indigo-505 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">2. Render Vectors &amp; PDF Files</p>
                  <p className="text-xs text-slate-500">
                    {generated === total 
                      ? 'All PDF digital credentials rendered locally at high definition DPI (100% complete).' 
                      : `${generated} out of ${total} files computed. Ready to queue up and construct remaining.`}
                  </p>
                </div>
              </div>
              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 rounded-full p-0.5 ${sent === total && total > 0 ? 'bg-indigo-100 text-indigo-600' : sent > 0 ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-100 text-slate-400'}`}>
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">3. Email Deliveries Or Offline Archive</p>
                  <p className="text-xs text-slate-500">
                    {sent === total && total > 0
                      ? 'Emails dispatched and certificates successfully delivered.' 
                      : `Sent to ${sent} / ${total} students. You can also download a bulk ZIP archive instantly.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Column & Performance Guide (Right) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
          <h3 className="font-bold text-lg text-slate-850 tracking-tight border-b border-slate-100 pb-3">How it pulls down cost</h3>
          
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-50/50 rounded-xl space-y-1">
              <h4 className="text-xs font-bold text-indigo-750 tracking-wider">Client-Side Engine</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Most platforms render PDFs on heavy, expensive cloud servers (charging you $0.20+ each). 
                CertifyAcademy renders complex layouts inside your student's standard browser in milliseconds, running entirely free.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50/50 rounded-xl space-y-1">
              <h4 className="text-xs font-bold text-indigo-750 tracking-wider">Campaign Bulk Export</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Export all certificates directly as a zipped package. You can mail merge, distribute in WhatsApp groups, or upload to Google Drive without needing any payment plans.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50/50 rounded-xl space-y-1">
              <h4 className="text-xs font-bold text-indigo-750 tracking-wider">Plug &amp; Play API Keys</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Use your own Resend or SMTP api configuration. 
                Instead of paying 3x or 5x markup, utilize your provider's free plans (Resend offers 3,000 free emails monthly).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Registry Delivery Reports - Certificate Status & failed/delivered dispatch log */}
      <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm space-y-4" id="registrar-registry-delivery-report">
        
        {/* Header containing Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Certificate Registry &amp; Delivery Monitor
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Sift names, generated file states, verify serial keys or resend failed deliveries</p>
          </div>
          
          {/* Quick status tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {(['all', 'generated', 'pending', 'sent', 'failed', 'sending'] as const).map((filter) => {
              const count = 
                filter === 'all' ? total : 
                filter === 'generated' ? generated : 
                filter === 'pending' ? pendingGen :
                filter === 'sent' ? sent :
                filter === 'failed' ? failed : sending;

              return (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-tight capitalize cursor-pointer transition-colors ${
                    statusFilter === filter
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {filter} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Search controls row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search recipient name, email domain, or credential ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50/50 hover:bg-slate-50 text-slate-800 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all font-medium"
            />
          </div>
          <button 
            onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
            className="bg-slate-50 hover:bg-slate-100 text-slate-650 border border-slate-150 rounded-xl px-4 py-2.5 text-xs font-semibold cursor-pointer shrink-0 transition-colors"
          >
            Clear Filters
          </button>
        </div>

        {/* Recipients registry status list table */}
        <div className="overflow-x-auto border border-slate-150 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-150 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-3 px-4">Student Name &amp; Mail</th>
                <th className="py-3 px-4">Credential unique Key</th>
                <th className="py-3 px-4">PDF Layout status</th>
                <th className="py-3 px-4">Email delivery status</th>
                <th className="py-3 px-4 text-right">Registry Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRecipients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                    No registry rows match your current sifting filters. Try clearing inputs.
                  </td>
                </tr>
              ) : (
                filteredRecipients.map((r) => {
                  const isResending = resendingId === r.id;
                  const hasFeedback = feedbackMsg?.id === r.id;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 leading-tight">{r.name}</div>
                        <div className="text-slate-500 font-mono text-[10px] mt-0.5">{r.email}</div>
                      </td>
                      
                      <td className="py-3.5 px-4 font-mono text-[10px] font-bold text-slate-600">
                        {r.id}
                      </td>

                      <td className="py-3.5 px-4">
                        {r.status === 'generated' ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            <Check className="w-3 h-3 text-emerald-600" />
                            PDF Generated
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            Pending Render
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {r.emailStatus === 'sent' && (
                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                              <Check className="w-3.5 h-3.5 text-green-600" />
                              Delivered successfully
                            </span>
                          )}
                          {r.emailStatus === 'failed' && (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 bg-red-50 text-red-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                                <AlertCircle className="w-3.5 h-3.5 text-red-650" />
                                Delivery failure
                              </span>
                              {r.errorMessage && (
                                <p className="text-[10px] text-red-600 line-clamp-1 italic max-w-xs font-mono" title={r.errorMessage}>
                                  {r.errorMessage}
                                </p>
                              )}
                            </div>
                          )}
                          {r.emailStatus === 'sending' && (
                            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                              <Loader className="w-3 h-3 text-indigo-650 animate-spin" />
                              Sending email...
                            </span>
                          )}
                          {r.emailStatus === 'queued' && (
                            <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-500 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                              Queued
                            </span>
                          )}
                          {r.emailStatus === 'idle' && (
                            <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-400 text-[10px] px-2.5 py-0.5 rounded-full font-medium">
                              Not Sent
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          
                          {/* Async feedback toasts micro layout */}
                          {hasFeedback && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded mr-1 ${
                              feedbackMsg.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                              {feedbackMsg.text}
                            </span>
                          )}

                          {/* Trigger immediate individual PDF render for review */}
                          <button
                            onClick={() => handleDownloadCopy(r)}
                            className="text-slate-500 hover:text-indigo-600 p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                            title="Download PDF Copy"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Dynamic Action Trigger: Resend failed or trigger send for first-time */}
                          {(r.emailStatus === 'failed' || r.emailStatus === 'idle') ? (
                            <button
                              onClick={() => handleResendClick(r.id)}
                              disabled={isResending}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 cursor-pointer transition-all ${
                                isResending
                                  ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'
                                  : r.emailStatus === 'failed'
                                  ? 'bg-red-50 hover:bg-red-100 font-semibold text-red-700 border-red-200'
                                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                              }`}
                              title={r.emailStatus === 'failed' ? 'Retry immediate delivery' : 'Send Certificate'}
                            >
                              {isResending ? (
                                <Loader className="w-3 h-3 animate-spin text-slate-400" />
                              ) : (
                                <Send className="w-3 h-3 shrink-0" />
                              )}
                              <span>{r.emailStatus === 'failed' ? 'Retry' : 'Dispatch'}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleResendClick(r.id)}
                              disabled={isResending}
                              className="text-[10px] font-semibold text-slate-400 hover:text-indigo-600 hover:bg-slate-50 cursor-pointer border-none bg-transparent px-2 py-1 select-none flex items-center gap-1"
                              title="Force duplicate transmission override"
                            >
                              {isResending ? (
                                <Loader className="w-3 h-3 animate-spin text-slate-400" />
                              ) : (
                                <RefreshCw className="w-3 h-3 shrink-0" />
                              )}
                              <span>Re-dispatch</span>
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
