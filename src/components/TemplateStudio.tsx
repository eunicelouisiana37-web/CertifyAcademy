import React, { useEffect, useRef, useState } from 'react';
import { Layout, Palette, Signature, FileText, Check, Award, Download, Sparkles, BookOpen, Upload, RefreshCw, Eye, Move, EyeOff, Type, Image } from 'lucide-react';
import { Template, Recipient } from '../types';
import { drawCertificateOnCanvas, generateCertificatePDF, downloadSingleCertificate, injectCertificateFonts } from '../utils/pdfGenerator';
import { PRESET_TEMPLATES } from '../data';
import { PRESET_BACKGROUND_TEMPLATES, PresetBackground } from '../utils/imageTemplates';

interface TemplateStudioProps {
  template: Template;
  setTemplate: (template: Template) => void;
}

const DEFAULT_PREVIEW_RECIPIENT: Recipient = {
  id: 'ACAD-2026-TR81',
  name: 'Chinedu Mubarak Balogun',
  email: 'chinedu.balogun@academy.com',
  course: 'Strategic Development & Systems Architecture',
  date: '04/06/2026',
  status: 'generated',
  emailStatus: 'idle',
};

export default function TemplateStudio({ template, setTemplate }: TemplateStudioProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const signature1InputRef = useRef<HTMLInputElement | null>(null);
  const signature2InputRef = useRef<HTMLInputElement | null>(null);

  const [selectedPresetId, setSelectedPresetId] = useState<string>(template.id);
  const [successMsg, setSuccessMsg] = useState<string>('');
  
  // Controls Sidebar tab toggle: 'preset' | 'custom_graphic' | 'typography' | 'alignment' | 'signatories'
  const [activeTab, setActiveTab] = useState<'preset' | 'custom_graphic' | 'typography' | 'alignment' | 'signatories'>('preset');

  // Local state mirror to make typing immediate and snappy
  const [localTemplate, setLocalTemplate] = useState<Template>({ ...template });

  // Load fonts on mount
  useEffect(() => {
    injectCertificateFonts();
  }, []);

  // Update canvas preview whenever local values change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use a high-density dimension for sharp previews in standard cards
    canvas.width = 1100;
    canvas.height = 778;

    // Wait a brief tick for fonts to be ready
    const handleDraw = () => {
      drawCertificateOnCanvas(ctx, canvas.width, canvas.height, DEFAULT_PREVIEW_RECIPIENT, localTemplate, true);
    };

    // Trigger draw
    handleDraw();

    // Secondary draw just in case fonts loaded progressively
    const timer = setTimeout(handleDraw, 150);
    return () => clearTimeout(timer);
  }, [localTemplate]);

  const handleFieldChange = (field: keyof Template, value: any) => {
    const updated = { ...localTemplate, [field]: value };
    setLocalTemplate(updated);
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = PRESET_TEMPLATES.find((p) => p.id === presetId);
    if (preset) {
      setLocalTemplate({
        ...preset,
        bgImage: undefined,
        bgType: undefined,
        textColor: undefined,
        textYShift: 0,
        textXShift: 0,
        hideBorders: false,
        hideSignatures: false,
        logoUrl: undefined,
        titleFont: undefined,
        nameFont: undefined,
        courseFont: undefined,
        titleFontSize: undefined,
        nameFontSize: undefined,
        courseFontSize: undefined,
        metaFontSize: undefined,
        signature1Image: undefined,
        signature2Image: undefined,
      });
      setSelectedPresetId(presetId);
      showTemporaryToast('Preset vector layout applied!');
    }
  };

  const handleApplyGraphicTemplate = (presetBg: PresetBackground) => {
    setLocalTemplate((prev) => ({
      ...prev,
      layoutType: 'custom',
      bgImage: presetBg.dataUri,
      bgType: 'preset',
      primaryColor: presetBg.defaultPrimary,
      accentColor: presetBg.defaultAccent,
      textColor: presetBg.textColor,
      hideBorders: true, // Hide vector border lines so template takes over
      textYShift: prev.textYShift || 0,
      textXShift: prev.textXShift || 0,
    }));
    showTemporaryToast(`Applied: ${presetBg.name}`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (e.g. 3.5MB to stay performant in localStorage/state)
    if (file.size > 3.5 * 1024 * 1024) {
      alert('The file is too large. Please upload an image under 3.5MB to ensure snappy browser performance.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Str = event.target?.result as string;
      setLocalTemplate((prev) => ({
        ...prev,
        layoutType: 'custom',
        bgImage: base64Str,
        bgType: 'uploaded',
        hideBorders: true, // Default to clean borders for custom papers
      }));
      showTemporaryToast('Custom graphical template template loaded!');
    };
    reader.readAsDataURL(file);
  };

  const handleClearBackground = () => {
    setLocalTemplate((prev) => ({
      ...prev,
      layoutType: 'classic',
      bgImage: undefined,
      bgType: undefined,
      textColor: undefined,
      hideBorders: false,
    }));
    showTemporaryToast('Custom backgrounds cleared.');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('The brand logo is too large. Please upload an image under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Str = event.target?.result as string;
      setLocalTemplate((prev) => ({
        ...prev,
        logoUrl: base64Str,
        logoSize: prev.logoSize || 80,
        logoYShift: prev.logoYShift || 0,
      }));
      showTemporaryToast('Brand logo successfully loaded!');
    };
    reader.readAsDataURL(file);
  };

  const handleClearLogo = () => {
    setLocalTemplate((prev) => ({
      ...prev,
      logoUrl: undefined,
    }));
    showTemporaryToast('Brand logo cleared.');
  };

  const handleSignatureUpload = (signatoryNum: 1 | 2, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      alert('This file is too heavy. Please upload a lightweight signature graphic under 1.5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Str = event.target?.result as string;
      setLocalTemplate((prev) => ({
        ...prev,
        [signatoryNum === 1 ? 'signature1Image' : 'signature2Image']: base64Str,
      }));
      showTemporaryToast(`Signatory ${signatoryNum} handwritten PNG applied!`);
    };
    reader.readAsDataURL(file);
  };

  const handleClearSignatureImage = (signatoryNum: 1 | 2) => {
    setLocalTemplate((prev) => ({
      ...prev,
      [signatoryNum === 1 ? 'signature1Image' : 'signature2Image']: undefined,
    }));
    showTemporaryToast(`Signatory ${signatoryNum} graphic removed. Switched to cursive text.`);
  };

  const handleSaveAndApply = () => {
    setTemplate(localTemplate);
    showTemporaryToast('Template design saved and applied globally.');
  };

  const handleDownloadTestPdf = async () => {
    try {
      await downloadSingleCertificate(DEFAULT_PREVIEW_RECIPIENT, localTemplate);
    } catch (e) {
      console.error('Test PDF download failed', e);
    }
  };

  const showTemporaryToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  // Color Swatches presets
  const primaryColors = [
    { name: 'Navy Blue', hex: '#1A3C6E' },
    { name: 'Charcoal', hex: '#0F172A' },
    { name: 'Emerald', hex: '#047857' },
    { name: 'Deep Burgundy', hex: '#7F1D1D' },
    { name: 'Teal Block', hex: '#0F766E' },
  ];

  const accentColors = [
    { name: 'Warm Gold', hex: '#D4A843' },
    { name: 'Sunset Amber', hex: '#F59E0B' },
    { name: 'Vibrant Teal', hex: '#0D9488' },
    { name: 'Neon Fuchsia', hex: '#D946EF' },
    { name: 'Crimson Red', stroke: '#DC2626' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="template-studio">
      
      {/* 1. Left controls panel: occupy 5 columns */}
      <div className="lg:col-span-5 bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-5 max-h-[85vh] overflow-y-auto">
        
        {/* Panel Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              Template Studio
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Configure professional vector frames, or upload your own graphic designs</p>
          </div>
          <button
            onClick={handleSaveAndApply}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm"
          >
            Apply Design
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-150 overflow-x-auto scroller-none">
          <button
            onClick={() => setActiveTab('preset')}
            className={`pb-2 text-[10px] sm:text-xs font-bold border-b-2 text-center px-2 whitespace-nowrap transition-all ${
              activeTab === 'preset'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Vector Framers
          </button>
          <button
            onClick={() => setActiveTab('custom_graphic')}
            className={`pb-2 text-[10px] sm:text-xs font-bold border-b-2 text-center px-2 whitespace-nowrap transition-all ${
              activeTab === 'custom_graphic'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Graphic &amp; Logos
          </button>
          <button
            onClick={() => setActiveTab('typography')}
            className={`pb-2 text-[10px] sm:text-xs font-bold border-b-2 text-center px-2 whitespace-nowrap transition-all ${
              activeTab === 'typography'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Typography &amp; Sizes
          </button>
          <button
            onClick={() => setActiveTab('alignment')}
            className={`pb-2 text-[10px] sm:text-xs font-bold border-b-2 text-center px-2 whitespace-nowrap transition-all ${
              activeTab === 'alignment'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Alignment Shifts
          </button>
          <button
            onClick={() => setActiveTab('signatories')}
            className={`pb-2 text-[10px] sm:text-xs font-bold border-b-2 text-center px-2 whitespace-nowrap transition-all ${
              activeTab === 'signatories'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Signatures
          </button>
        </div>

        {/* TAB 1: VECTOR FRAMERS */}
        {activeTab === 'preset' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Vector Presets selector */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider block uppercase">Select High-Res Vector Frame Preset:</span>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_TEMPLATES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleApplyPreset(p.id)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      !localTemplate.bgImage && localTemplate.layoutType === p.layoutType && localTemplate.name === p.name
                        ? "border-indigo-600 bg-indigo-50/20 text-slate-950 font-semibold ring-2 ring-indigo-100"
                        : "border-slate-150 hover:border-slate-200 text-slate-600 bg-slate-50/50"
                    }`}
                  >
                    <div className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-600 opacity-80">
                      {p.layoutType} Frame
                    </div>
                    <div className="text-xs truncate font-medium mt-0.5">
                      {p.name.split(' (')[0]}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Geometry settings */}
            <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-150">
              <span className="text-[10px] font-bold text-slate-500 tracking-wider block uppercase">Configure Vector Frame Geometry</span>
              <div className="grid grid-cols-4 gap-2">
                {(['classic', 'corporate', 'modern', 'creative'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      handleFieldChange('layoutType', type);
                      handleFieldChange('bgImage', undefined); // Clear graphical base if revert to pure vector
                    }}
                    className={`py-2 rounded-lg border text-xs capitalize font-semibold cursor-pointer transition-all text-center ${
                      !localTemplate.bgImage && localTemplate.layoutType === type
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider block uppercase">Vector Theme Palette</span>
              
              <div>
                <span className="text-[11px] font-medium text-slate-500 block mb-1">Primary Theme Block (Naras, Headers):</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={localTemplate.primaryColor}
                    onChange={(e) => handleFieldChange('primaryColor', e.target.value)}
                    className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
                  />
                  <div className="flex gap-1.5 flex-wrap">
                    {primaryColors.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => handleFieldChange('primaryColor', c.hex)}
                        className="w-5 h-5 rounded-full border border-slate-200 relative cursor-pointer"
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {(localTemplate.primaryColor || '').toLowerCase() === (c.hex || '').toLowerCase() && (
                          <Check className="w-3 h-3 text-white absolute inset-0 m-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-500 block mb-1">Accent Highlighting (Frames, Ribbon seals):</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={localTemplate.accentColor}
                    onChange={(e) => handleFieldChange('accentColor', e.target.value)}
                    className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
                  />
                  <div className="flex gap-1.5 flex-wrap">
                    {accentColors.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => handleFieldChange('accentColor', c.hex)}
                        className="w-5 h-5 rounded-full border border-slate-200 relative cursor-pointer"
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {(localTemplate.accentColor || '').toLowerCase() === (c.hex || '').toLowerCase() && (
                          <Check className="w-3 h-3 text-white absolute inset-0 m-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GRAPHICAL BACKGROUNDS & BRAND LOGOS */}
        {activeTab === 'custom_graphic' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Part A: Brand Logo Upload */}
            <div className="bg-amber-50/30 p-4 border border-amber-100 rounded-xl space-y-3">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Academy Brand Logo (Transparency PNG/JPG)
              </span>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Add your official stamp or color emblem to be displayed cleanly at the top-center of digital credentials.
              </p>

              <div className="flex items-center gap-3">
                {localTemplate.logoUrl ? (
                  <div className="relative h-14 w-14 rounded-lg border border-amber-200 overflow-hidden bg-white shrink-0 flex items-center justify-center p-1">
                    <img referrerPolicy="no-referrer" src={localTemplate.logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                    <button
                      onClick={handleClearLogo}
                      className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700"
                    >
                      <Check className="w-3 h-3 rotate-45" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => logoInputRef.current?.click()}
                    className="h-14 w-14 rounded-lg border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-white cursor-pointer flex items-center justify-center shrink-0 transition-colors"
                  >
                    <Upload className="w-4 h-4 text-slate-400" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-850 bg-transparent border-none cursor-pointer"
                  >
                    {localTemplate.logoUrl ? 'Change Brand Logo' : 'Upload PNG Stamp'}
                  </button>
                  <span className="text-[10px] text-slate-400 block mt-0.5">High contrast image under 2MB</span>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>

              {localTemplate.logoUrl && (
                <div className="space-y-2 pt-2 border-t border-amber-100">
                  {/* Logo Size */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-semibold text-slate-500">Logo Scale Width</span>
                      <span className="font-mono text-slate-700">{localTemplate.logoSize || 80}px</span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="200"
                      step="5"
                      value={localTemplate.logoSize || 80}
                      onChange={(e) => handleFieldChange('logoSize', parseInt(e.target.value))}
                      className="w-full accent-amber-500 h-1 bg-slate-150 rounded"
                    />
                  </div>

                  {/* Logo Y Position */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-semibold text-slate-500">Logo Vertical Alignment</span>
                      <span className="font-mono text-slate-700">{localTemplate.logoYShift || 0}px</span>
                    </div>
                    <input
                      type="range"
                      min="-60"
                      max="100"
                      step="2"
                      value={localTemplate.logoYShift || 0}
                      onChange={(e) => handleFieldChange('logoYShift', parseInt(e.target.value))}
                      className="w-full accent-amber-500 h-1 bg-slate-150 rounded"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Part B: Background Graphics */}
            <div className="bg-indigo-50/40 p-4 border border-indigo-100 rounded-xl space-y-3">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-indigo-650" />
                Upload Custom JPG / PNG Template
              </span>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Upload your pre-designed empty certificate page. Ensure it is saved in landscape (A4 ratio recommended). Your dynamic recipient names and codes will automatically align over top.
              </p>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-white/60 p-4 rounded-xl text-center cursor-pointer hover:bg-white transition-all space-y-1.5"
              >
                <Upload className="w-6 h-6 text-indigo-500 mx-auto" />
                <span className="text-xs font-semibold text-indigo-600 block">Select Image File</span>
                <span className="text-[9px] text-slate-400 block">PNG or JPG up to 3.5MB</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg"
                onChange={handleImageUpload}
                className="hidden"
              />

              {localTemplate.bgImage && localTemplate.bgType === 'uploaded' && (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] p-2 rounded-lg font-medium">
                  <span className="truncate">Active uploaded image template loaded</span>
                  <button 
                    onClick={handleClearBackground}
                    className="text-red-650 hover:underline font-semibold border-none bg-transparent cursor-pointer ml-2 shrink-0"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Predefined templates list */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider block uppercase">OR CHOOSE PRE-DEFINED PROFESSIONAL TEMPLATES:</span>
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {PRESET_BACKGROUND_TEMPLATES.map((b) => {
                  const isActive = localTemplate.bgImage === b.dataUri;
                  return (
                    <div 
                      key={b.id}
                      onClick={() => handleApplyGraphicTemplate(b)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-3 ${
                        isActive
                          ? 'border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-100'
                          : 'border-slate-150 hover:border-slate-200 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      {/* Mini Thumbnail representation */}
                      <div className="h-10 w-14 rounded border border-slate-200 shrink-0 overflow-hidden relative bg-slate-50 flex items-center justify-center">
                        <img 
                          referrerPolicy="no-referrer"
                          src={b.dataUri} 
                          alt="Layout Thumbnail" 
                          className="w-full h-full object-cover" 
                        />
                        {isActive && (
                          <div className="absolute inset-0 bg-indigo-600/10 flex items-center justify-center">
                            <Check className="w-5 h-5 text-indigo-700 font-bold" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1.5">
                          {b.name}
                          <span className="text-[8px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded uppercase font-bold tracking-tight">
                            {b.layoutName}
                          </span>
                        </h5>
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{b.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {localTemplate.bgImage && (
                <button
                  type="button"
                  onClick={handleClearBackground}
                  className="text-xs font-bold text-red-600 hover:text-red-750 flex items-center gap-1 mt-2 mx-auto cursor-pointer border-none bg-transparent"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset to empty vector frames
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TYPOGRAPHY & FONT OVERRIDES */}
        {activeTab === 'typography' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3 bg-indigo-50/25 border border-indigo-100 rounded-xl">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <Type className="w-4 h-4 text-indigo-600" />
                Dynamic Typography Customizer
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                Choose gorgeous display pairing font-families and fine-tune sizing sliders to guarantee your certificate has absolute design authority.
              </p>
            </div>

            {/* Custom Fonts */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Header Title Font Family</label>
                <select
                  value={localTemplate.titleFont || ''}
                  onChange={(e) => handleFieldChange('titleFont', e.target.value || undefined)}
                  className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none"
                >
                  <option value="">Default theme preset</option>
                  <option value="'Cinzel', serif">Cinzel (Imperial Prestige)</option>
                  <option value="'Space Grotesk', sans-serif">Space Grotesk (Tech Modernist)</option>
                  <option value="'Montserrat', sans-serif">Montserrat (Executive Clean)</option>
                  <option value="'Playfair Display', serif">Playfair Display (Elegant Editorial)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Recipient Student Name Font Family</label>
                <select
                  value={localTemplate.nameFont || ''}
                  onChange={(e) => handleFieldChange('nameFont', e.target.value || undefined)}
                  className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none"
                >
                  <option value="">Default theme preset</option>
                  <option value="'Cinzel', serif">Cinzel (Traditional Serif)</option>
                  <option value="'Montserrat', sans-serif">Montserrat (Bold Modernist)</option>
                  <option value="'Playfair Display', serif">Playfair Display (Classy Serif Italics)</option>
                  <option value="'Alex Brush', cursive">Alex Brush (Premium Calligraphy Handwrite)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Course Citation Font Family</label>
                <select
                  value={localTemplate.courseFont || ''}
                  onChange={(e) => handleFieldChange('courseFont', e.target.value || undefined)}
                  className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none"
                >
                  <option value="">Default theme preset</option>
                  <option value="'Montserrat', sans-serif">Montserrat (Bold Business)</option>
                  <option value="'Space Grotesk', sans-serif">Space Grotesk (Tech Minimalist)</option>
                  <option value="'Cinzel', serif">Cinzel (Traditional Elite)</option>
                </select>
              </div>
            </div>

            {/* Custom Sizing Sliders */}
            <div className="space-y-3.5 pt-3 border-t border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 block tracking-wider uppercase">Granular Font Sizes Override</span>
              
              {/* Title size */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-semibold text-slate-650">Title Font Size</span>
                  <span className="font-mono bg-slate-100 px-1 rounded text-[10px] font-bold text-slate-700">
                    {localTemplate.titleFontSize || (localTemplate.layoutType === 'classic' ? 64 : 56)}px
                  </span>
                </div>
                <input
                  type="range"
                  min="32"
                  max="100"
                  step="2"
                  value={localTemplate.titleFontSize || (localTemplate.layoutType === 'classic' ? 64 : 56)}
                  onChange={(e) => handleFieldChange('titleFontSize', parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-150 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              {/* Name size */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-semibold text-slate-650">Student Name Font Size</span>
                  <span className="font-mono bg-slate-100 px-1 rounded text-[10px] font-bold text-slate-700">
                    {localTemplate.nameFontSize || (localTemplate.layoutType === 'classic' ? 72 : 60)}px
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="110"
                  step="2"
                  value={localTemplate.nameFontSize || (localTemplate.layoutType === 'classic' ? 72 : 60)}
                  onChange={(e) => handleFieldChange('nameFontSize', parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-150 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              {/* Course size */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-semibold text-slate-650">Course Title Font Size</span>
                  <span className="font-mono bg-slate-100 px-1 rounded text-[10px] font-bold text-slate-700">
                    {localTemplate.courseFontSize || 32}px
                  </span>
                </div>
                <input
                  type="range"
                  min="18"
                  max="50"
                  step="1"
                  value={localTemplate.courseFontSize || 32}
                  onChange={(e) => handleFieldChange('courseFontSize', parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-150 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              {/* Metadata size */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-semibold text-slate-650">Date &amp; ID Code Metadata Size</span>
                  <span className="font-mono bg-slate-100 px-1 rounded text-[10px] font-bold text-slate-700">
                    {localTemplate.metaFontSize || 13}px
                  </span>
                </div>
                <input
                  type="range"
                  min="9"
                  max="22"
                  step="1"
                  value={localTemplate.metaFontSize || 13}
                  onChange={(e) => handleFieldChange('metaFontSize', parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-150 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setLocalTemplate((prev) => ({
                    ...prev,
                    titleFont: undefined,
                    nameFont: undefined,
                    courseFont: undefined,
                    titleFontSize: undefined,
                    nameFontSize: undefined,
                    courseFontSize: undefined,
                    metaFontSize: undefined,
                  }));
                  showTemporaryToast('Reset typography to layout defaults.');
                }}
                className="text-[10px] text-slate-400 hover:text-indigo-600 font-bold block mx-auto underline mt-2"
              >
                Reset Fonts &amp; Sizes
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: OVERLAY ALIGNMENT SHIFTS */}
        {activeTab === 'alignment' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3 bg-indigo-50/20 border border-indigo-100 rounded-xl">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <Move className="w-4 h-4 text-indigo-600" />
                Advanced Overlay Fitting
              </span>
              <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                When using custom graphic backgrounds, you can shift all text together or modify colors to avoid pre-printed certificate marks perfectly!
              </p>
            </div>

            {/* Vertical Y Shift */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500 flex items-center gap-1">
                  Text Vertical Shift (Y-Offset)
                </span>
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 text-[10px] font-bold">
                  {localTemplate.textYShift || 0}px
                </span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={localTemplate.textYShift || 0}
                onChange={(e) => handleFieldChange('textYShift', parseInt(e.target.value))}
                className="w-full accent-indigo-600 h-1.5 bg-slate-150 rounded"
              />
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>Shift Up (-180px)</span>
                <button 
                  onClick={() => handleFieldChange('textYShift', 0)}
                  className="font-bold text-indigo-600 hover:underline border-none bg-transparent cursor-pointer"
                >
                  Reset Center
                </button>
                <span>Shift Down (+180px)</span>
              </div>
            </div>

            {/* Horizontal X Shift */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500 flex items-center gap-1">
                  Horizontal Alignment Shift (X-Offset)
                </span>
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 text-[10px] font-bold">
                  {localTemplate.textXShift || 0}px
                </span>
              </div>
              <input
                type="range"
                min="-200"
                max="200"
                step="5"
                value={localTemplate.textXShift || 0}
                onChange={(e) => handleFieldChange('textXShift', parseInt(e.target.value))}
                className="w-full accent-indigo-600 h-1.5 bg-slate-150 rounded"
              />
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>Shift Left (-200px)</span>
                <button 
                  onClick={() => handleFieldChange('textXShift', 0)}
                  className="font-bold text-indigo-600 hover:underline border-none bg-transparent cursor-pointer"
                >
                  Reset Center
                </button>
                <span>Shift Right (+200px)</span>
              </div>
            </div>

            {/* Custom overlay font color */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 block">Overlay Text Color Fill (Contrast Backdrop)</span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={localTemplate.textColor || '#111827'}
                  onChange={(e) => handleFieldChange('textColor', e.target.value)}
                  className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
                />
                <div className="flex gap-1">
                  {['#111827', '#F1F5F9', '#1E3A8A', '#7F1D1D', '#0F766E'].map((col) => (
                    <button
                      key={col}
                      onClick={() => handleFieldChange('textColor', col)}
                      className="w-5 h-5 rounded border border-slate-300 cursor-pointer"
                      style={{ backgroundColor: col }}
                      title={col}
                    />
                  ))}
                  <button 
                    onClick={() => handleFieldChange('textColor', undefined)}
                    className="text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200 px-2 rounded hover:bg-slate-100 cursor-pointer"
                  >
                    Auto
                  </button>
                </div>
              </div>
            </div>

            {/* Visual elements toggles */}
            <div className="space-y-2.5 pt-3 border-t border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider block uppercase">VISIBILITY SWITCHERS</span>
              
              <label className="flex items-center gap-2.5 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!localTemplate.hideBorders}
                  onChange={(e) => handleFieldChange('hideBorders', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 border-slate-300"
                />
                <span>Hide borders, crest decorations &amp; background fills</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!localTemplate.hideSignatures}
                  onChange={(e) => handleFieldChange('hideSignatures', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 border-slate-300"
                />
                <span>Hide handwritten signatures lines &amp; script fonts</span>
              </label>
            </div>
          </div>
        )}

        {/* TAB 5: SIGNATURES & CUSTOM GRAPHIC UPLOADS */}
        {activeTab === 'signatories' && (
          <div className="space-y-4 animate-in fade-in duration-200 overflow-y-auto max-h-[50vh] pr-1">
            <div className="space-y-3">
              <div className="p-3 bg-indigo-50/10 border border-slate-150 rounded-xl">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Signature className="w-4 h-4 text-indigo-600" />
                  Dual Signatory Credentials
                </span>
                <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">
                  Configure signatory designations. Upload transparent PNG custom graphics of hand-drawn signatures, or type names to use cursive calligraphic fonts!
                </p>
              </div>
              
              <div className="space-y-4">
                {/* SIGNATORY 1 */}
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-150">
                  <span className="text-[11px] font-bold text-indigo-950 block">Signatory 1 (Left Side Placement)</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-slate-505 uppercase font-bold">Full Name</label>
                      <input
                        type="text"
                        value={localTemplate.signatory1Name}
                        onChange={(e) => handleFieldChange('signatory1Name', e.target.value)}
                        className="w-full text-slate-800 text-xs px-2.5 py-1.5 border border-slate-200 rounded bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-550 uppercase font-bold">Designation Title</label>
                      <input
                        type="text"
                        value={localTemplate.signatory1Title}
                        onChange={(e) => handleFieldChange('signatory1Title', e.target.value)}
                        className="w-full text-slate-800 text-xs px-2.5 py-1.5 border border-slate-200 rounded bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Custom Signature Graphic Upload */}
                  <div className="pt-2 border-t border-slate-200/60 mt-1.5 space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-tight block">Handwritten PNG Signature</label>
                    <div className="flex items-center gap-2">
                      {localTemplate.signature1Image ? (
                        <div className="relative h-10 w-24 rounded border border-slate-300 bg-white overflow-hidden p-1 flex items-center justify-center shrink-0">
                          <img referrerPolicy="no-referrer" src={localTemplate.signature1Image} alt="Sig 1" className="max-w-full max-h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => handleClearSignatureImage(1)}
                            className="absolute inset-0 m-auto bg-red-650/80 text-white font-bold text-[9px] hover:bg-red-700 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => signature1InputRef.current?.click()}
                          className="h-10 w-24 bg-white hover:bg-slate-100 border border-dashed border-slate-300 hover:border-indigo-400 cursor-pointer flex items-center justify-center rounded shrink-0 transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[9px] text-slate-500 font-semibold ml-1">PNG Upload</span>
                        </div>
                      )}
                      
                      <div className="min-w-0 flex-1">
                        <label className="text-[9px] text-slate-405 block">OR type cursive fallback calligraphy:</label>
                        <input
                          type="text"
                          value={localTemplate.signature1 || ''}
                          onChange={(e) => handleFieldChange('signature1', e.target.value)}
                          placeholder={localTemplate.signatory1Name}
                          disabled={!!localTemplate.signature1Image}
                          className="w-full text-slate-800 text-xs px-2 py-1 border border-slate-200 rounded bg-white font-serif italic text-indigo-900 disabled:opacity-40 focus:outline-none"
                        />
                      </div>
                      <input
                        ref={signature1InputRef}
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={(e) => handleSignatureUpload(1, e)}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* SIGNATORY 2 */}
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-150">
                  <span className="text-[11px] font-bold text-indigo-950 block">Signatory 2 (Right Side Placement)</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-slate-505 uppercase font-bold">Full Name</label>
                      <input
                        type="text"
                        value={localTemplate.signatory2Name}
                        onChange={(e) => handleFieldChange('signatory2Name', e.target.value)}
                        className="w-full text-slate-800 text-xs px-2.5 py-1.5 border border-slate-200 rounded bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-550 uppercase font-bold">Designation Title</label>
                      <input
                        type="text"
                        value={localTemplate.signatory2Title}
                        onChange={(e) => handleFieldChange('signatory2Title', e.target.value)}
                        className="w-full text-slate-800 text-xs px-2.5 py-1.5 border border-slate-200 rounded bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Custom Signature Graphic Upload */}
                  <div className="pt-2 border-t border-slate-200/60 mt-1.5 space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-tight block">Handwritten PNG Signature</label>
                    <div className="flex items-center gap-2">
                      {localTemplate.signature2Image ? (
                        <div className="relative h-10 w-24 rounded border border-slate-300 bg-white overflow-hidden p-1 flex items-center justify-center shrink-0">
                          <img referrerPolicy="no-referrer" src={localTemplate.signature2Image} alt="Sig 2" className="max-w-full max-h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => handleClearSignatureImage(2)}
                            className="absolute inset-0 m-auto bg-red-650/80 text-white font-bold text-[9px] hover:bg-red-700 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => signature2InputRef.current?.click()}
                          className="h-10 w-24 bg-white hover:bg-slate-100 border border-dashed border-slate-300 hover:border-indigo-400 cursor-pointer flex items-center justify-center rounded shrink-0 transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[9px] text-slate-500 font-semibold ml-1">PNG Upload</span>
                        </div>
                      )}
                      
                      <div className="min-w-0 flex-1">
                        <label className="text-[9px] text-slate-405 block">OR type cursive fallback calligraphy:</label>
                        <input
                          type="text"
                          value={localTemplate.signature2 || ''}
                          onChange={(e) => handleFieldChange('signature2', e.target.value)}
                          placeholder={localTemplate.signatory2Name}
                          disabled={!!localTemplate.signature2Image}
                          className="w-full text-slate-800 text-xs px-2 py-1 border border-slate-200 rounded bg-white font-serif italic text-indigo-900 disabled:opacity-40 focus:outline-none"
                        />
                      </div>
                      <input
                        ref={signature2InputRef}
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={(e) => handleSignatureUpload(2, e)}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Nomenclature and text configurations inputs */}
        <div className="space-y-4 border-t border-slate-100 pt-4">
          <label className="text-xs font-bold text-slate-400 tracking-wider flex items-center gap-1 uppercase">
            <BookOpen className="w-3.5 h-3.5" />
            Academy &amp; Citation Nomenclature
          </label>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-slate-500 block mb-1">Academy Name / Issuing Authority</label>
              <input
                type="text"
                value={localTemplate.academyName}
                onChange={(e) => handleFieldChange('academyName', e.target.value)}
                placeholder="PRO-TRAINING ACADEMY"
                className="w-full text-slate-800 text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-500 block mb-1">Default Course Name</label>
              <input
                type="text"
                value={localTemplate.courseName}
                onChange={(e) => handleFieldChange('courseName', e.target.value)}
                placeholder="Advanced Full-Stack Engineering Bootcamp"
                className="w-full text-slate-800 text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1 uppercase tracking-tight">Prefix ID</label>
                <input
                  type="text"
                  value={localTemplate.credentialPrefix}
                  onChange={(e) => handleFieldChange('credentialPrefix', e.target.value.toUpperCase())}
                  className="w-full text-slate-800 text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none font-mono uppercase"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1 uppercase tracking-tight">Issue Date</label>
                <input
                  type="text"
                  value={localTemplate.issueDate}
                  onChange={(e) => handleFieldChange('issueDate', e.target.value)}
                  className="w-full text-slate-800 text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-500 block mb-1">Certificate Body narrative description</label>
              <textarea
                value={localTemplate.customText}
                onChange={(e) => handleFieldChange('customText', e.target.value)}
                rows={3}
                placeholder="is hereby certified to have successfully attended, completed and satisfied all examinations..."
                className="w-full text-slate-800 text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 resize-none"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveAndApply}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-colors mt-4 flex items-center justify-center gap-1 shadow-sm"
        >
          Save Template &amp; Sync Dashboard
        </button>

      </div>

      {/* 2. Right living preview panel: occupies 7 columns */}
      <div className="lg:col-span-7 bg-slate-50/50 border border-slate-150 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-start">
        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-indigo-500 h-2 w-2 rounded-full bg-indigo-505 ring-4 ring-indigo-500/20 block animate-pulse" />
            <h4 className="text-xs font-bold text-slate-700 tracking-wider">CERTIFICATE LIVE RENDER STUDIO</h4>
          </div>
          <span className="text-[10px] text-indigo-600 bg-indigo-50 font-semibold px-2 py-0.5 rounded-lg whitespace-nowrap">
            {localTemplate.bgImage ? (localTemplate.bgType === 'uploaded' ? 'Uploaded Image' : 'Preset Back') : 'Vector Render'}
          </span>
        </div>

        {/* Live Canvas Frame */}
        <div className="bg-white p-4 rounded-2xl shadow-inner border border-slate-150 flex items-center justify-center overflow-hidden">
          <div className="relative w-full max-w-full">
            <canvas
              ref={canvasRef}
              className="w-full h-auto border border-slate-100 rounded-lg shadow-md bg-white block"
              style={{ maxHeight: '52vh', objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* Actions bar underneath canvas */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-wrap gap-3 items-center justify-between shadow-xs">
          <div className="text-[11px] text-slate-500 leading-relaxed max-w-sm">
            This live preview renders A4 Landscape templates inside your student's standard browser. Click <strong>"Apply Design"</strong> to update campaigns.
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleDownloadTestPdf}
              className="bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 border border-slate-200 font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Download Test PDF
            </button>
            <button
              onClick={handleSaveAndApply}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm shadow-indigo-100"
            >
              <Check className="w-4 h-4" />
              Apply to Campaign
            </button>
          </div>
        </div>

        {/* Floating Toast Notification */}
        {successMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-800 text-white font-medium text-xs py-3 px-5 rounded-lg shadow-xl flex items-center gap-2">
            <Award className="w-4.5 h-4.5 text-indigo-400" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

    </div>
  );
}
