import React, { useState, useRef } from 'react';
import { Upload, Users, FileText, Download, Plus, Search, Trash2, CheckCircle, RefreshCw, X, AlertCircle } from 'lucide-react';
import { Recipient, Template } from '../types';
import { downloadSingleCertificate, generateCertificatePDF } from '../utils/pdfGenerator';
import { INITIAL_RECIPIENTS } from '../data';
import JSZip from 'jszip';

interface RecipientManagerProps {
  recipients: Recipient[];
  setRecipients: React.Dispatch<React.SetStateAction<Recipient[]>>;
  template: Template;
}

export default function RecipientManager({ recipients, setRecipients, template }: RecipientManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCourse, setNewCourse] = useState('');
  
  // CSV Import State
  const [pasteInput, setPasteInput] = useState('');
  const [isPasting, setIsPasting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk Actions Processing State
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [isZipping, setIsZipping] = useState(false);

  // Helper: Generates an automatic 4-character random hexadecimal for uniqueness
  const generateRandomHex = () => {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1)
      .toUpperCase();
  };

  const generateAcademicId = (prefix: string) => {
    const year = new Date().getFullYear();
    const segment = generateRandomHex();
    const cleanPrefix = (prefix || 'CERT').toUpperCase();
    return `${cleanPrefix}-${year}-${segment}`;
  };

  // CSV/Text parser engine
  const parseCSVContent = (text: string) => {
    try {
      const lines = text.split(/\r?\n/);
      if (lines.length === 0) return;

      const parsedList: Recipient[] = [];
      const prefix = template.credentialPrefix;

      // Iteratively skip header lines checking for keywords
      let startIndex = 0;
      if (lines[0] && (lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('email'))) {
        startIndex = 1;
      }

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Splitting by comma or semi-colon or tabs
        let parts: string[] = [];
        if (line.includes('\t')) {
          parts = line.split('\t');
        } else if (line.includes(';')) {
          parts = line.split(';');
        } else {
          // Handle quoted commas elegantly
          parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        }

        const name = parts[0]?.replace(/^"|"$/g, '').trim() || '';
        const email = parts[1]?.replace(/^"|"$/g, '').trim() || '';
        const course = parts[2]?.replace(/^"|"$/g, '').trim() || template.courseName;
        const customDate = parts[3]?.replace(/^"|"$/g, '').trim() || template.issueDate;

        if (name && email) {
          parsedList.push({
            id: generateAcademicId(prefix),
            name,
            email,
            course,
            date: customDate,
            status: 'pending',
            emailStatus: 'idle',
          });
        }
      }

      if (parsedList.length > 0) {
        setRecipients((prev) => [...prev, ...parsedList]);
        setPasteInput('');
        setIsPasting(false);
        setErrorMsg('');
      } else {
        setErrorMsg('Could not find any rows with valid Name and Email values.');
      }
    } catch (e: any) {
      setErrorMsg(`Error parsing content: ${e.message}`);
    }
  };

  // CSV Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUploadedFile(e.target.files[0]);
    }
  };

  const handleUploadedFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) parseCSVContent(text);
    };
    reader.readAsText(file);
  };

  // Add individual student manually
  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const newRecord: Recipient = {
      id: generateAcademicId(template.credentialPrefix),
      name: newName.trim(),
      email: newEmail.trim(),
      course: newCourse.trim() || template.courseName,
      date: template.issueDate,
      status: 'pending',
      emailStatus: 'idle',
    };

    setRecipients((prev) => [...prev, newRecord]);
    setNewName('');
    setNewEmail('');
    setNewCourse('');
  };

  const handleDeleteRecipient = (id: string) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearAll = () => {
    if (confirm('Are you absolute sure you want to clear the entire recipient checklist?')) {
      setRecipients([]);
    }
  };

  const handleLoadDemo = () => {
    setRecipients(INITIAL_RECIPIENTS);
  };

  // 1. Bulk rendering queue: loops through all pending recipients and generates their PDFs client-side
  const handleBulkGenerate = async () => {
    const docsToGen = recipients.filter((r) => r.status === 'pending');
    if (docsToGen.length === 0) return;

    setIsGeneratingBulk(true);
    setBulkProgress({ current: 0, total: docsToGen.length });

    // Loop through recipients sequentially to prevent blocking the UI thread
    const updatedRecipients = [...recipients];
    
    for (let i = 0; i < updatedRecipients.length; i++) {
      if (updatedRecipients[i].status === 'pending') {
        try {
          // Trigger offscreen render of pdf. Add slight pacing to feel realistic
          await generateCertificatePDF(updatedRecipients[i], template);
          updatedRecipients[i].status = 'generated';
          setBulkProgress((prev) => ({ ...prev, current: prev.current + 1 }));
        } catch (err: any) {
          updatedRecipients[i].status = 'failed';
          updatedRecipients[i].errorMessage = err?.message || 'Print render failed';
        }
        // Force state update to refresh visual table statuses in real-time!
        setRecipients([...updatedRecipients]);
        await new Promise((res) => setTimeout(res, 35));
      }
    }

    setIsGeneratingBulk(false);
  };

  // 2. JSZip bulk download
  const handleDownloadZip = async () => {
    const generatedList = recipients.filter((r) => r.status === 'generated');
    if (generatedList.length === 0) {
      alert('Please click "Generate All PDFs" first to compile the certificate files.');
      return;
    }

    setIsZipping(true);
    const zip = new JSZip();

    for (let i = 0; i < generatedList.length; i++) {
      const student = generatedList[i];
      try {
        const pdf = await generateCertificatePDF(student, template);
        const pdfBlob = pdf.output('blob');
        const cleanName = student.name.replace(/[^a-zA-Z0-9]/g, '_');
        zip.file(`${student.id}_${cleanName}.pdf`, pdfBlob);
      } catch (err) {
        console.error('Error adding file to ZIP:', err);
      }
    }

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `Batch_Certificates_${template.credentialPrefix || 'ACAD'}_${new Date().getFullYear()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('ZIP generation failed', e);
    } finally {
      setIsZipping(false);
    }
  };

  // Filter Table search
  const filteredRecipients = recipients.filter(
    (r) =>
      (r?.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (r?.email || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (r?.id || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  return (
    <div className="space-y-6" id="recipient-manager">
      
      {/* Upload Console Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bulk loader (2 Columns) */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900 tracking-tight">Import Student Batch</h3>
              <p className="text-xs text-slate-500">Drop a CSV spreadsheet or paste text directly</p>
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsPasting(!isPasting)}
                className="text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
              >
                {isPasting ? 'Toggle File Drop' : 'Quick Clipboard Paste'}
              </button>
              <button
                type="button"
                onClick={handleLoadDemo}
                className="text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
              >
                Load Demo Cohort
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg('')} className="ml-auto text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {isPasting ? (
            <div className="space-y-3">
              <span className="text-[11px] font-medium text-slate-500 block">
                Paste tabular data containing <strong>NAME, EMAIL, [COURSE], [DATE]</strong>. Supports tab-spacing or lines copy-pasted directly from Excel or Google Sheets.
              </span>
              <textarea
                value={pasteInput}
                onChange={(e) => setPasteInput(e.target.value)}
                placeholder="Tobi Adebayo&#9;tobi.a@example.com&#9;Fullstack Design&#10;Amara Chukwu&#9;amara.c@example.com&#9;Fullstack Design"
                rows={4}
                className="w-full text-slate-800 text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-mono resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasting(false)}
                  className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => parseCSVContent(pasteInput)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg cursor-pointer"
                >
                  Process Paste List
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
                dragActive ? 'border-indigo-500 bg-indigo-50/10' : 'border-slate-200 hover:border-slate-300 bg-slate-50/10'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mb-3">
                <Upload className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                Drag &amp; drop student CSV spreadsheet here
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Or click on this area to choose from your computer
              </p>
              <div className="mt-4 flex gap-4 text-[10px] text-slate-400 font-medium">
                <span>Column Order: Name , Email, [Course], [Issue Date]</span>
              </div>
            </div>
          )}
        </div>

        {/* Individual manual input form (1 Column) */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="pb-2 border-b border-slate-100 mb-3">
              <h3 className="font-serif font-bold text-base text-slate-900">Add Student</h3>
              <p className="text-xs text-slate-500">Insert a single record manually into the table</p>
            </div>

            <form onSubmit={handleManualAdd} className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">STUDENT FULL NAME</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Aliko Dangote"
                  className="w-full text-slate-800 text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">STUDENT EMAIL ADDRESS</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. aliko@dangote.group"
                  className="w-full text-slate-800 text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">CUSTOM COURSE TITLE (OPTIONAL)</label>
                <input
                  type="text"
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value)}
                  placeholder={`Falls back to layout template`}
                  className="w-full text-slate-800 text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1 mt-2 shadow-sm shadow-indigo-100"
              >
                <Plus className="w-4 h-4" /> Add Student Record
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Recipients list table section */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden" id="recipients-table-card">
        
        {/* Table Toolbar Headers */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2 shrink-0">
            <Users className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-slate-800 tracking-tight">Recipients List</span>
            <span className="bg-slate-200 text-slate-700 text-xs font-bold font-mono px-2 py-0.5 rounded-full">
              {recipients.length} totals
            </span>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs text-slate-800 bg-white pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          {/* Bulk automated commands */}
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            {recipients.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-red-650 hover:text-red-700 hover:bg-red-50 border border-transparent font-medium text-xs px-2.5 py-2 rounded-xl cursor-pointer transition-all"
                >
                  <Trash2 className="w-4 h-4 inline mr-1" />
                  Clear List
                </button>

                <button
                  type="button"
                  disabled={isGeneratingBulk || recipients.filter((r) => r.status === 'pending').length === 0}
                  onClick={handleBulkGenerate}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer transition-colors flex items-center gap-1 shadow-sm shadow-indigo-150"
                >
                  {isGeneratingBulk ? (
                    <>
                      <RefreshCw className="w-4.5 h-4.5 animate-spin mr-1" />
                      Rendering ({bulkProgress.current}/{bulkProgress.total})
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4.5 h-4.5 text-white mr-1" />
                      Generate {recipients.filter((r) => r.status === 'pending').length} PDFs
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isZipping || recipients.filter((r) => r.status === 'generated').length === 0}
                  onClick={handleDownloadZip}
                  className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer transition-colors flex items-center gap-1 shadow-sm"
                >
                  {isZipping ? (
                    <>
                      <RefreshCw className="w-4.5 h-4.5 animate-spin mr-1" />
                      Archiving batched files...
                    </>
                  ) : (
                    <>
                      <Download className="w-4.5 h-4.5 mr-1" />
                      Download ZIP ({recipients.filter((r) => r.status === 'generated').length})
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Real Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/20 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Credential Code</th>
                <th className="py-3 px-4">Student Details</th>
                <th className="py-3 px-4">Course Designation</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Rendering status</th>
                <th className="py-3 px-4 text-center">Delivery Status</th>
                <th className="py-3 px-4 text-right">Interactive Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecipients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="max-w-md mx-auto space-y-2">
                      <FileText className="w-12 h-12 text-slate-200 mx-auto" />
                      <p className="font-semibold text-slate-700">No Student Records Found</p>
                      <p className="text-xs text-slate-500">
                        Upload a CSV spreadsheet, paste a student email checklist, or click <strong>"Load Demo Cohort"</strong> to inspect automated results.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecipients.map((recipient) => (
                  <tr key={recipient.id} className="border-b border-slate-100 hover:bg-slate-50/40 transition-colors text-xs text-slate-800">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-500/80">
                      {recipient.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{recipient.name}</div>
                      <div className="text-[11px] text-slate-500">{recipient.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="truncate max-w-[200px]" title={recipient.course}>
                        {recipient.course}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 uppercase font-mono text-[11px]">
                      {recipient.date || template.issueDate}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {recipient.status === 'generated' ? (
                        <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold text-[10px] tracking-wide inline-block">
                          READY (PDF OK)
                        </span>
                      ) : recipient.status === 'failed' ? (
                        <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded font-bold text-[10px] inline-block" title={recipient.errorMessage}>
                          RENDER ERROR
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-bold text-[10px] tracking-wide inline-block">
                          PENDING
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {recipient.emailStatus === 'sent' ? (
                        <span className="bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded-full text-[10px]">
                          DISPATCHED
                        </span>
                      ) : recipient.emailStatus === 'sending' ? (
                        <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded animate-pulse text-[10px]">
                          SENDING...
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded text-[10px]">
                          UNSENT
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => downloadSingleCertificate(recipient, template)}
                          className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Download PDF
                        </button>
                        <button
                          onClick={() => handleDeleteRecipient(recipient.id)}
                          className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
