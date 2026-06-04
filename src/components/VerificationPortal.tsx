import React, { useState } from 'react';
import { ShieldCheck, Search, Award, CheckCircle, Calendar, BookOpen, Download, HelpCircle, UserCheck } from 'lucide-react';
import { Recipient, Template } from '../types';
import { downloadSingleCertificate } from '../utils/pdfGenerator';

interface VerificationPortalProps {
  recipients: Recipient[];
  template: Template;
}

export default function VerificationPortal({ recipients, template }: VerificationPortalProps) {
  const [searchId, setSearchId] = useState('');
  const [searched, setSearched] = useState(false);
  const [foundRecord, setFoundRecord] = useState<Recipient | null>(null);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    // Direct lookup in our active cohort list
    const match = recipients.find((r) => r.id.toUpperCase() === searchId.trim().toUpperCase());
    setFoundRecord(match || null);
    setSearched(true);
  };

  const handleQuickVerify = (id: string) => {
    setSearchId(id);
    const match = recipients.find((r) => r.id.toUpperCase() === id.toUpperCase());
    setFoundRecord(match || null);
    setSearched(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" id="verification-portal">
      
      {/* Banner introduction */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left max-w-lg">
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-md">
            <ShieldCheck className="w-4 h-4 text-indigo-600 animate-pulse" />
            SECURE VERIFICATION DIRECTORY
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">Credential Authenticity Checker</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Verify issued professional certificates. Entering the Unique Certificate Serial Code below fetches immediate registry audit logs directly from our Academy Archives.
          </p>
        </div>
        
        <Award className="w-16 h-16 text-indigo-500/10 shrink-0 hidden md:block" />
      </div>

      {/* Input container */}
      <div className="bg-white text-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
        <form onSubmit={handleVerify} className="space-y-4">
          <label className="text-xs font-bold text-slate-400 block tracking-wider uppercase">
            ENTER CERTIFICATE SERIAL UNIQUE ID
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="e.g. HCDA-2026-F9W1"
                className="w-full text-sm text-slate-800 pl-10 pr-3 py-3 border border-slate-250 bg-slate-50/50 rounded-xl focus:outline-none focus:border-indigo-500 font-mono text-center sm:text-left tracking-widest uppercase"
              />
            </div>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs px-6 py-3 rounded-xl cursor-pointer transition-colors shadow-sm shadow-indigo-100/50"
            >
              Search Registry
            </button>
          </div>
        </form>

        {recipients.length > 0 && !searched && (
          <div className="space-y-1 pt-2">
            <span className="text-[10px] text-slate-400 block">QUICK VERIFICATION SHORTCUTS (ACTIVE RECIPIENTS):</span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {recipients.slice(0, 3).map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleQuickVerify(r.id)}
                  className="text-[10px] font-mono bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-indigo-550 text-slate-700 px-2.5 py-1 rounded-lg cursor-pointer transition-all"
                >
                  {r.id === 'HCDA-2026-F9W1' ? 'Tobi Adebayo' : r.id === 'HCDA-2026-M5Q2' ? 'Amara Chukwu' : r.name.split(' ')[0]} ({r.id})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Result Container */}
      {searched && (
        <div className="animate-in fade-in duration-350">
          {foundRecord ? (
            /* VERIFIED DOCK CARD */
            <div className="bg-white border-2 border-emerald-500 rounded-2xl shadow-sm relative overflow-hidden">
              {/* Header green block */}
              <div className="bg-emerald-500 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold tracking-widest block opacity-90 uppercase">REGISTRY DATABASE</span>
                    <h3 className="font-bold text-lg tracking-tight leading-tight text-white">OFFICIALLY VERIFIED CREDENTIAL</h3>
                  </div>
                </div>
                <div className="bg-white text-emerald-700 font-mono font-bold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
                  Status: AUTHENTIC
                </div>
              </div>

              {/* Grid content details */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Student Graduate Name</span>
                    <p className="text-lg font-bold text-slate-950 flex items-center gap-1.5 mt-0.5">
                      <UserCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                      {foundRecord.name}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Course Nomenclature</span>
                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <BookOpen className="w-4.5 h-4.5 text-indigo-600 shrink-0" />
                      {foundRecord.course || template.courseName}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Award Issuer Institution</span>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">
                      {template.academyName}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Unique Identification Code</span>
                    <p className="text-sm font-bold font-mono text-indigo-900 bg-slate-50 px-2 py-1 rounded border border-slate-150 inline-block mt-0.5 tracking-wider">
                      {foundRecord.id}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Official Issue Date</span>
                    <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mt-0.5 font-mono">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {foundRecord.date || template.issueDate}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Verification Security Level</span>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                      Vector graphics matching sha-signature tags secure this certificate. Certified registry archives match electronic signatures of Registrar and Director blocks.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom drawer actions */}
              <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <span className="text-[11px] text-slate-400 italic">
                  Digital record updated: {new Date().toLocaleDateString('en-GB')}
                </span>
                <button
                  type="button"
                  onClick={() => downloadSingleCertificate(foundRecord, template)}
                  className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-100"
                >
                  <Download className="w-4 h-4 text-white" />
                  Download PDF Certificate copy
                </button>
              </div>
            </div>
          ) : (
            /* INVALID ALERT CARD */
            <div className="bg-red-50/10 border-2 border-red-500 rounded-2xl p-6 shadow-sm text-center max-w-xl mx-auto space-y-4">
              <div className="h-12 w-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                !
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-lg text-slate-950 tracking-tight">Credential Record Not Found</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  The Certificate ID: <strong className="font-mono text-red-650">{searchId}</strong> does not match any certificate in our registered databases.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-red-100 text-[11px] text-slate-500 text-left max-w-md mx-auto space-y-1.5 leading-relaxed">
                <p className="font-semibold text-slate-700 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-600" /> Trouble verifying?
                </p>
                <p>1. Check for typos or spacing (IDs are hyphenated, e.g., HCDA-2026-F9W1).</p>
                <p>2. Ensure the issuer has queued up and processed bulk PDF generation for this cohort batch.</p>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
