import React, { useState, useEffect } from 'react';
import { Mail, Settings, Play, Pause, RefreshCw, Send, Terminal, AlertCircle, CheckCircle2, Sliders, ChevronRight, X } from 'lucide-react';
import { Recipient, Template, DeliveryConfig, EmailLog } from '../types';
import { generateCertificatePDF } from '../utils/pdfGenerator';
import { DEFAULT_DELIVERY_CONFIG } from '../data';

interface EmailQueueProps {
  recipients: Recipient[];
  setRecipients: React.Dispatch<React.SetStateAction<Recipient[]>>;
  template: Template;
  deliveryConfig: DeliveryConfig;
  setDeliveryConfig: (config: DeliveryConfig) => void;
}

export default function EmailQueue({
  recipients,
  setRecipients,
  template,
  deliveryConfig,
  setDeliveryConfig,
}: EmailQueueProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'queue'>('editor');
  
  // Local config form states
  const [localConfig, setLocalConfig] = useState<DeliveryConfig>({ ...deliveryConfig });
  const [useSimulation, setUseSimulation] = useState(true);
  const [apiKeyInput, setApiKeyInput] = useState(deliveryConfig.resendApiKey || '');

  // Mailer delivery state
  const [isSending, setIsSending] = useState(false);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [toastMsg, setToastMsg] = useState('');

  // Track progress counts
  const totalInBatch = recipients.length;
  const readyToSend = recipients.filter((r) => r.status === 'generated').length;
  const mailedCount = recipients.filter((r) => r.emailStatus === 'sent').length;
  const failedCount = recipients.filter((r) => r.emailStatus === 'failed').length;

  useEffect(() => {
    setLocalConfig({ ...deliveryConfig });
    setApiKeyInput(deliveryConfig.resendApiKey || '');
  }, [deliveryConfig]);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...localConfig,
      resendApiKey: apiKeyInput,
    };
    setDeliveryConfig(updated);
    showNotice('Delivery draft settings updated.');
  };

  const showNotice = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Replace double brace templates with recipient specific variables
  const getParsedEmailContent = (rawText: string, student: Recipient) => {
    let parsed = rawText;
    parsed = parsed.replace(/{{name}}/g, student.name);
    parsed = parsed.replace(/{{email}}/g, student.email);
    parsed = parsed.replace(/{{course}}/g, student.course || template.courseName);
    parsed = parsed.replace(/{{date}}/g, student.date || template.issueDate);
    parsed = parsed.replace(/{{id}}/g, student.id);
    return parsed;
  };

  // Run the automated email dispatch runner loops
  const startDispatchCampaign = async () => {
    // Only send to students who have generated certificates but haven't successfully mailed yet
    const targetQueue = recipients.filter((r) => r.status === 'generated' && r.emailStatus !== 'sent');

    if (targetQueue.length === 0) {
      alert('No generated certificates found. Please go to the Recipients tab and click "Generate All PDFs" first.');
      return;
    }

    setIsSending(true);
    setActiveTab('queue');
    
    // Add initiating logs
    appendLog('SYSTEM', 'ALL', 'Initiating email dispatch series...', 'queued');
    appendLog('SYSTEM', 'ALL', `Connection parameters established. Simulation Mode: ${useSimulation ? 'ACTIVE' : 'OFF'}`, 'queued');

    const updatedRecipients = [...recipients];

    for (let i = 0; i < updatedRecipients.length; i++) {
      const student = updatedRecipients[i];
      
      // Filter out unmatched recipients
      if (student.status !== 'generated' || student.emailStatus === 'sent') continue;

      updatedRecipients[i].emailStatus = 'sending';
      setRecipients([...updatedRecipients]);

      appendLog(student.name, student.email, 'Generating multi-part mime-attachment...', 'sending');
      
      // Simulate/Trigger PDF compilation in backend
      try {
        const certPdf = await generateCertificatePDF(student, template);
        const pdfBase64 = certPdf.output('datauristring').split(',')[1]; // Base64 chunk
        
        appendLog(student.name, student.email, `Attaching payload: Certificate_${student.id}.pdf (${Math.round(pdfBase64.length / 1.3)} bytes)`, 'sending');

        let isSuccess = false;
        let logMessage = '';

        if (useSimulation) {
          // Play simulated network ping
          await new Promise((res) => setTimeout(res, 1800));
          isSuccess = true;
          logMessage = 'SMTP Status: 250 Sent successfully (ID: msg_' + generateRandomHex() + ')';
        } else {
          // Real API Dispatch logic
          const apiKey = apiKeyInput.trim() || process.env.RESEND_API_KEY;
          if (!apiKey) {
            isSuccess = false;
            logMessage = 'Error: Resend API key missing. Configure key in Draft inputs to unlock live sending.';
          } else {
            try {
              const parsedSubject = getParsedEmailContent(localConfig.emailSubject, student);
              const parsedBody = getParsedEmailContent(localConfig.emailBody, student);
              
              // Express API call
              const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  apiKey,
                  to: student.email,
                  subject: parsedSubject,
                  bodyText: parsedBody,
                  pdfBase64,
                  senderName: localConfig.senderName,
                  senderEmail: localConfig.senderEmail,
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
            } catch (err: any) {
              isSuccess = false;
              logMessage = `Network Error: ${err.message || 'Transmission hand-shake timed out'}`;
            }
          }
        }

        if (isSuccess) {
          updatedRecipients[i].emailStatus = 'sent';
          appendLog(student.name, student.email, logMessage, 'sent');
        } else {
          updatedRecipients[i].emailStatus = 'failed';
          appendLog(student.name, student.email, logMessage, 'failed');
        }

      } catch (err: any) {
        updatedRecipients[i].emailStatus = 'failed';
        appendLog(student.name, student.email, `Failed: ${err.message || 'Mime conversion failure'}`, 'failed');
      }

      setRecipients([...updatedRecipients]);
      
      // Delay space between mailings to prevent server congestion and duplicate triggers
      await new Promise((res) => setTimeout(res, 600));
    }

    appendLog('SYSTEM', 'ALL', 'Dispatch campaign completed.', 'sent');
    setIsSending(false);
  };

  const appendLog = (name: string, email: string, msg: string, status: 'queued' | 'sending' | 'sent' | 'failed') => {
    const newLog: EmailLog = {
      id: generateRandomHex(),
      recipientName: name,
      recipientEmail: email,
      status,
      timestamp: new Date().toLocaleTimeString(),
      message: msg,
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const generateRandomHex = () => {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  };

  // Preview an example email mockup based on the first student in the list
  const getMailPreview = () => {
    const sampleRecipient: Recipient = recipients[0] || {
      id: 'HCDA-2026-F9W1',
      name: 'Tobi Emmanuel Adebayo',
      email: 'tobi.adebayo@example.com',
      course: template.courseName,
      date: template.issueDate,
      status: 'pending',
      emailStatus: 'idle',
    };

    return {
      to: `${sampleRecipient.name} <${sampleRecipient.email}>`,
      subject: getParsedEmailContent(localConfig.emailSubject, sampleRecipient),
      body: getParsedEmailContent(localConfig.emailBody, sampleRecipient),
    };
  };

  const mailPreview = getMailPreview();

  return (
    <div className="space-y-6" id="email-queue">
      
      {/* Campaign metric flags */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
        <div className="p-3 text-center border-r border-slate-100 last:border-0">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Batch Size</span>
          <span className="text-xl font-bold font-mono block text-slate-800 mt-1">{totalInBatch}</span>
        </div>
        <div className="p-3 text-center border-r border-slate-100 last:border-0">
          <span className="text-[10px] uppercase font-bold text-indigo-600">PDFs Compiled</span>
          <span className="text-xl font-bold font-mono block text-indigo-700 mt-1">{readyToSend}</span>
        </div>
        <div className="p-3 text-center border-r border-slate-100 last:border-0">
          <span className="text-[10px] uppercase font-bold text-emerald-600 font-semibold">Sent Successfully</span>
          <span className="text-xl font-bold font-mono block text-emerald-700 mt-1">{mailedCount}</span>
        </div>
        <div className="p-3 text-center last:border-0">
          <span className="text-[10px] uppercase font-bold text-red-500">Failed / Queued</span>
          <span className="text-xl font-bold font-mono block text-red-600 mt-1">{failedCount}</span>
        </div>
      </div>

      {/* Primary Tab Headers */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('editor')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'editor' ? 'border-indigo-600 text-indigo-650' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Customize Message Draft
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'queue' ? 'border-indigo-600 text-indigo-650' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Active Delivery Engine {logs.length > 0 && `(${logs.length})`}
        </button>
      </div>

      {activeTab === 'editor' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Editor Form Columns (7 cols) */}
          <form onSubmit={handleSaveConfig} className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 tracking-tight">Mail Merge Configuration</h3>
              <p className="text-xs text-slate-500">Draft your automated email. Use double curlies as placeholders.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">SENDER NAME</label>
                <input
                  type="text"
                  required
                  value={localConfig.senderName}
                  onChange={(e) => setLocalConfig({ ...localConfig, senderName: e.target.value })}
                  placeholder="Horizon Registry"
                  className="w-full text-xs text-slate-800 p-2 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">SENDER EMAIL ADDRESS</label>
                <input
                  type="email"
                  required
                  value={localConfig.senderEmail}
                  onChange={(e) => setLocalConfig({ ...localConfig, senderEmail: e.target.value })}
                  placeholder="registry@youracademy.com"
                  className="w-full text-xs text-slate-800 p-2 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">EMAIL SUBJECT HEADER</label>
              <input
                type="text"
                required
                value={localConfig.emailSubject}
                onChange={(e) => setLocalConfig({ ...localConfig, emailSubject: e.target.value })}
                className="w-full text-xs text-slate-800 p-2 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-400 block">BODY TEXT (DRAFT TEXT)</label>
                <span className="text-[9px] text-indigo-600 bg-indigo-50 rounded px-1.5 py-0.5 font-semibold">
                  Variables: &#123;&#123;name&#125;&#125; | &#123;&#123;course&#125;&#125; | &#123;&#123;date&#125;&#125; | &#123;&#123;id&#125;&#125;
                </span>
              </div>
              <textarea
                value={localConfig.emailBody}
                required
                rows={9}
                onChange={(e) => setLocalConfig({ ...localConfig, emailBody: e.target.value })}
                className="w-full text-xs text-slate-800 p-3 border border-slate-200 rounded-xl focus:outline-none resize-none font-sans leading-relaxed"
              />
            </div>

            {/* Provider Key config */}
            <div className="bg-slate-50 p-4 border border-slate-150 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Email Gateway Integration</h4>
                  <p className="text-[10px] text-slate-500">Enable real-world deliveries or sandbox testing</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${useSimulation ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {useSimulation ? 'SIMULATION MODE' : 'LIVE API DISPATCH'}
                  </span>
                  <input
                    type="checkbox"
                    checked={useSimulation}
                    onChange={(e) => setUseSimulation(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>

              {!useSimulation && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-505 block">Resend Provider API Key</label>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full text-xs text-slate-800 p-2 border border-slate-200 bg-white rounded-lg focus:outline-none font-mono"
                  />
                  <span className="text-[9px] text-slate-400 block">
                    Your key is saved locally in this browser. Resend gives you <strong>3,000 free emails/month</strong> on private domains.
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                className="bg-slate-900 override-borders text-white hover:bg-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
              >
                Save Delivery Rules
              </button>
              <button
                type="button"
                disabled={isSending}
                onClick={startDispatchCampaign}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-150"
              >
                <Send className="w-4 h-4" />
                Dispatch Campaigns ({readyToSend} ready)
              </button>
            </div>
          </form>

          {/* Live Preview of email (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white text-slate-800 rounded-2xl border border-slate-150 p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-indigo-600 tracking-wider uppercase flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                RECIPIENT EMAIL PREVIEW
              </h4>

              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 space-y-2 text-xs font-mono text-slate-700">
                <div>
                  <span className="text-slate-400">From:</span> {localConfig.senderName} &lt;{localConfig.senderEmail}&gt;
                </div>
                <div>
                  <span className="text-slate-400">To:</span> {mailPreview.to}
                </div>
                <div className="truncate">
                  <span className="text-slate-400 font-medium">Subject:</span> <span className="text-slate-800 font-semibold">{mailPreview.subject}</span>
                </div>
              </div>

              {/* Body container */}
              <div className="bg-slate-50 text-slate-800 p-4 rounded-lg text-xs leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-wrap font-sans border border-slate-200">
                {mailPreview.body}
                
                {/* Visual rendering of the attachment block */}
                <div className="mt-6 p-2.5 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-red-100 text-red-600 rounded flex items-center justify-center font-bold font-mono text-[9px]">
                      PDF
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-700">Certificate_Credential.pdf</p>
                      <p className="text-[9px] text-slate-400">High Resolution Vector Graphic - attached</p>
                    </div>
                  </div>
                  <X className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="bg-indigo-50/30 border border-indigo-100/45 p-4 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-indigo-650 shrink-0" />
              <div className="text-xs text-slate-600 leading-relaxed">
                <strong>Important Campaign Tip:</strong> Make sure you render all certificates first in the <strong>Recipients</strong> panel prior to beginning dispatcher sweeps, ensuring all attachment buffers are locked.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* SMTP/API REAL TIME MONITORING */
        <div className="bg-[#0F172A] border border-slate-800 text-slate-300 p-5 rounded-2xl shadow-lg space-y-4 font-mono select-none">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className={`w-3.5 h-3.5 rounded-full ${isSending ? 'bg-amber-500 animate-ping' : 'bg-slate-500'}`} />
              <span className="text-sm font-bold text-white uppercase tracking-wider">Gateway SMTP Control Plane</span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setLogs([])}
                className="text-[11px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 font-medium px-2.5 py-1 rounded cursor-pointer transition-colors"
              >
                Flush Logs console
              </button>
            </div>
          </div>

          <div className="h-[400px] overflow-y-auto border border-slate-800 bg-slate-950 rounded-lg p-4 space-y-2 text-xs scrollbar-thin">
            {logs.length === 0 ? (
              <p className="text-slate-600 italic text-center pt-24 text-[11px]">
                Consoles idle. Begin campaign dispatch in Customizer tab to power trace terminal logs...
              </p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex flex-col sm:flex-row sm:items-start gap-1 py-1 border-b border-slate-900/30">
                  <span className="text-slate-500 whitespace-nowrap">[{log.timestamp}]</span>
                  <span className="text-[#D4A843] whitespace-nowrap uppercase font-semibold">
                    {log.recipientName === 'SYSTEM' ? 'SYS_KERNEL' : log.recipientName.split(' ')[0]}
                  </span>
                  <span className="text-slate-500 hidden sm:inline">&lt;{log.recipientEmail}&gt;</span>
                  <ChevronRight className="w-3 h-3 text-slate-600 mt-0.5 shrink-0" />
                  <span className={`flex-1 ${
                    log.status === 'sent' 
                      ? 'text-emerald-400 font-semibold' 
                      : log.status === 'failed' 
                      ? 'text-red-400 font-bold' 
                      : log.status === 'sending' 
                      ? 'text-indigo-300' 
                      : 'text-slate-300'
                  }`}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-850 flex items-center justify-between text-[11px] text-slate-400">
            <span>Terminal Process running at thread client. Perfect.</span>
            <span>Logs Count: {logs.length} feeds</span>
          </div>
        </div>
      )}

      {/* Floating alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1A3C6E] text-white py-3 px-5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#D4A843]" />
          {toastMsg}
        </div>
      )}

    </div>
  );
}
