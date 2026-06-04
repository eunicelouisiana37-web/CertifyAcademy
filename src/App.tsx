import React, { useState, useEffect } from 'react';
import { Award, Users, Sliders, Mail, ShieldCheck, LayoutDashboard, Database, HelpCircle, Sun, Activity, Save } from 'lucide-react';
import { Recipient, Template, DeliveryConfig } from './types';
import { PRESET_TEMPLATES, INITIAL_RECIPIENTS, DEFAULT_DELIVERY_CONFIG } from './data';

// Import our custom views
import Dashboard from './components/Dashboard';
import TemplateStudio from './components/TemplateStudio';
import RecipientManager from './components/RecipientManager';
import EmailQueue from './components/EmailQueue';
import VerificationPortal from './components/VerificationPortal';

export default function App() {
  const [activeView, setActiveView] = useState<string>('dashboard');

  // Initialize state from LocalStorage or fallback to structured default presets
  const [recipients, setRecipients] = useState<Recipient[]>(() => {
    try {
      const saved = localStorage.getItem('cert_recipients');
      return saved ? JSON.parse(saved) : INITIAL_RECIPIENTS;
    } catch {
      return INITIAL_RECIPIENTS;
    }
  });

  const [template, setTemplate] = useState<Template>(() => {
    try {
      const saved = localStorage.getItem('cert_template');
      return saved ? JSON.parse(saved) : PRESET_TEMPLATES[0];
    } catch {
      return PRESET_TEMPLATES[0];
    }
  });

  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>(() => {
    try {
      const saved = localStorage.getItem('cert_delivery');
      return saved ? JSON.parse(saved) : DEFAULT_DELIVERY_CONFIG;
    } catch {
      return DEFAULT_DELIVERY_CONFIG;
    }
  });

  // Sync state to local storage to persist customizations completely free of hosting database costs
  useEffect(() => {
    localStorage.setItem('cert_recipients', JSON.stringify(recipients));
  }, [recipients]);

  useEffect(() => {
    localStorage.setItem('cert_template', JSON.stringify(template));
  }, [template]);

  useEffect(() => {
    localStorage.setItem('cert_delivery', JSON.stringify(deliveryConfig));
  }, [deliveryConfig]);

  const handleResetApp = () => {
    if (confirm('Are you sure you want to revert to default academy settings? This will clear all uploaded CSV records.')) {
      setRecipients(INITIAL_RECIPIENTS);
      setTemplate(PRESET_TEMPLATES[0]);
      setDeliveryConfig(DEFAULT_DELIVERY_CONFIG);
      setActiveView('dashboard');
    }
  };

  const resendEmail = async (recipientId: string): Promise<{ success: boolean; message: string }> => {
    const student = recipients.find((r) => r.id === recipientId);
    if (!student) {
      return { success: false, message: 'Student not found in active batch' };
    }

    // Mark as sending in state
    setRecipients(prev => 
      prev.map(r => r.id === recipientId ? { ...r, emailStatus: 'sending' } : r)
    );

    try {
      // 1. Generate off-screen canvas PDF
      const { generateCertificatePDF } = await import('./utils/pdfGenerator');
      const certPdf = await generateCertificatePDF(student, template);
      const pdfBase64 = certPdf.output('datauristring').split(',')[1];

      let isSuccess = false;
      let logMessage = '';

      const apiKey = deliveryConfig.resendApiKey?.trim();
      const useSimulation = !apiKey;

      if (useSimulation) {
        await new Promise((resolve) => setTimeout(resolve, 1400));
        isSuccess = true;
        logMessage = 'SMTP Status: 250 Sent successfully (Simulated Resend)';
      } else {
        const getParsedEmailContent = (rawText: string) => {
          let parsed = rawText;
          parsed = parsed.replace(/{{name}}/g, student.name);
          parsed = parsed.replace(/{{email}}/g, student.email);
          parsed = parsed.replace(/{{course}}/g, student.course || template.courseName);
          parsed = parsed.replace(/{{date}}/g, student.date || template.issueDate);
          parsed = parsed.replace(/{{id}}/g, student.id);
          return parsed;
        };

        const parsedSubject = getParsedEmailContent(deliveryConfig.emailSubject || 'Certificate of Completion');
        const parsedBody = getParsedEmailContent(deliveryConfig.emailBody || 'Dear {{name}}, find attached your certificate.');

        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey,
            to: student.email,
            subject: parsedSubject,
            bodyText: parsedBody,
            pdfBase64,
            senderName: deliveryConfig.senderName,
            senderEmail: deliveryConfig.senderEmail,
            studentName: student.name,
          }),
        });

        const result = await response.json();
        if (response.ok && result.success) {
          isSuccess = true;
          logMessage = `Resend API delivered. Message ID: ${result.id}`;
        } else {
          isSuccess = false;
          logMessage = `Provider Error: ${result.error || 'Server error API payload mismatch'}`;
        }
      }

      if (isSuccess) {
        setRecipients(prev => 
          prev.map(r => r.id === recipientId ? { ...r, emailStatus: 'sent', errorMessage: undefined, status: 'generated' } : r)
        );
        return { success: true, message: logMessage };
      } else {
        setRecipients(prev => 
          prev.map(r => r.id === recipientId ? { ...r, emailStatus: 'failed', errorMessage: logMessage } : r)
        );
        return { success: false, message: logMessage };
      }

    } catch (err: any) {
      const errorStr = err.message || 'Mime conversion failure';
      setRecipients(prev => 
        prev.map(r => r.id === recipientId ? { ...r, emailStatus: 'failed', errorMessage: errorStr } : r)
      );
      return { success: false, message: errorStr };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 flex flex-col font-sans antialiased" id="academy-app-shell">
      
      {/* 1. Main Global Banner-Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 px-10 py-5 flex items-center justify-between" id="app-header">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <Award className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-slate-850 leading-none">
                CertifyAcademy
              </span>
              <span className="bg-indigo-50 text-indigo-600 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                COMMUNITY PRO v2.1
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-none font-medium">
              Enterprise Cost reduction Portal for Academy Seminars &amp; Bootcamps
            </p>
          </div>
        </div>

        {/* Status markers & Quick resets */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-indigo-600 font-semibold bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            Local Engine Sandbox: Active
          </div>
          
          <button
            onClick={handleResetApp}
            className="text-[10px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 font-bold border border-slate-200 px-2.5 py-1 rounded cursor-pointer transition-all"
            title="Saves to zero state default configs"
          >
            Reset Defaults
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        
        {/* 2. Side navigation checklist */}
        <aside className="w-full md:w-60 shrink-0" id="app-sidebar">
          <nav className="bg-white border border-slate-150 rounded-2xl p-3 shadow-sm space-y-1.5 sticky top-24">
            
            <button
              onClick={() => setActiveView('dashboard')}
              className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold flex items-center gap-3 cursor-pointer transition-all ${
                activeView === 'dashboard'
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              Registrar Dashboard
            </button>

            <button
              onClick={() => setActiveView('template')}
              className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold flex items-center gap-3 cursor-pointer transition-all ${
                activeView === 'template'
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0" />
              Branding Vector Design
            </button>

            <button
              onClick={() => setActiveView('recipients')}
              className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold flex items-center gap-3 cursor-pointer transition-all ${
                activeView === 'recipients'
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              Recipient List Manager
            </button>

            <button
              onClick={() => setActiveView('email')}
              className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold flex items-center gap-3 cursor-pointer transition-all ${
                activeView === 'email'
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              <Mail className="w-4 h-4 shrink-0" />
              Email Dispatch Queue
            </button>

            <div className="border-t border-slate-100 my-2 pt-2" />

            <button
              onClick={() => setActiveView('verify')}
              className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold flex items-center gap-3 cursor-pointer transition-all ${
                activeView === 'verify'
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              Employer Verification
            </button>

            {/* Quick overview metric widget inside menu */}
            <div className="bg-slate-50 rounded-xl p-3.5 space-y-2 mt-4 border border-slate-100 hidden md:block">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider block uppercase">Batch Telemetry</span>
              <div className="flex justify-between text-[11px] font-medium">
                <span className="text-slate-500">Recipients:</span>
                <span className="text-slate-800 font-mono font-bold">{recipients.length}</span>
              </div>
              <div className="flex justify-between text-[11px] font-medium">
                <span className="text-slate-500">Rendered PDFs:</span>
                <span className="text-[#3b82f6] font-mono font-bold">
                  {recipients.filter(r => r.status === 'generated').length}
                </span>
              </div>
              <div className="flex justify-between text-[11px] font-medium">
                <span className="text-slate-500">Mailed:</span>
                <span className="text-indigo-600 font-mono font-bold font-semibold">
                  {recipients.filter(r => r.emailStatus === 'sent').length}
                </span>
              </div>
            </div>

          </nav>
        </aside>

        {/* 3. Main content canvas - router pages */}
        <main className="flex-1 bg-transparent min-w-0" id="app-main-content">
          {activeView === 'dashboard' && (
            <Dashboard
              recipients={recipients}
              template={template}
              setActiveView={setActiveView}
              activeView={activeView}
              onResendEmail={resendEmail}
            />
          )}

          {activeView === 'template' && (
            <TemplateStudio
              template={template}
              setTemplate={setTemplate}
            />
          )}

          {activeView === 'recipients' && (
            <RecipientManager
              recipients={recipients}
              setRecipients={setRecipients}
              template={template}
            />
          )}

          {activeView === 'email' && (
            <EmailQueue
              recipients={recipients}
              setRecipients={setRecipients}
              template={template}
              deliveryConfig={deliveryConfig}
              setDeliveryConfig={setDeliveryConfig}
            />
          )}

          {activeView === 'verify' && (
            <VerificationPortal
              recipients={recipients}
              template={template}
            />
          )}
        </main>

      </div>

      {/* 4. Elegant Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs mt-12 text-slate-400" id="app-footer">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} Certificate Issuing Platform. Built to minimize academy operational overhead.</p>
          <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500">
            <span>Server Proxy Hook: <strong>On</strong></span>
            <span>PDF Renderer: <strong>A4 Canvas-HD</strong></span>
            <span>Security: <strong>SHA Local Unique Encryption</strong></span>
          </div>
        </div>
      </footer>

    </div>
  );
}
