import { useState, useRef } from 'react';
import { analyzeImage, saveInspection } from '../services/api';
import {
  Camera, Upload, ScanLine, CheckCircle2, AlertTriangle, AlertCircle,
  FileText, Code2, ImageIcon, ShieldCheck, Download, Save, RefreshCw,
  X, Copy, Check, Zap
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

type Tab = 'summary' | 'text' | 'json' | 'image';

export default function NewInspection() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [scanStep, setScanStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [copied, setCopied] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scanSteps = [
    'Initializing OCR Engine...',
    'Extracting text from image...',
    'Identifying mandatory declarations...',
    'Validating Legal Metrology Rules...',
    'Calculating compliance score...',
  ];

  const handleFileSelect = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setErrorMsg(null);
    setSaveStatus('idle');
  };

  const handleAnalyze = async (demoMode = false, demoType = 'compliant') => {
    if (!file && !demoMode) return;
    setAnalyzing(true);
    setResult(null);
    setErrorMsg(null);
    setScanStep(0);

    const interval = setInterval(() => {
      setScanStep(prev => (prev >= scanSteps.length - 1 ? prev : prev + 1));
    }, 550);

    try {
      const formData = new FormData();
      if (file) formData.append('image', file);
      if (demoMode) {
        formData.append('useDemoData', 'true');
        formData.append('demoType', demoType);
      }
      const data = await analyzeImage(formData);
      clearInterval(interval);
      setScanStep(scanSteps.length - 1);
      setTimeout(() => {
        setResult(data);
        setAnalyzing(false);
        setActiveTab('summary');
      }, 400);
    } catch (err: any) {
      clearInterval(interval);
      setAnalyzing(false);
      setErrorMsg(
        err?.message?.includes('fetch')
          ? 'Cannot reach the backend (port 3001). Make sure the backend server is running.'
          : 'Analysis failed. Please try again or use a Demo button.'
      );
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaveStatus('saving');
    try {
      await saveInspection({
        product_id: 1, user_id: 1,
        date: new Date().toISOString(),
        status: result.status, score: result.score,
        image_url: result.imageUrl || '/placeholder.jpg',
        declarations: result.declarations,
        violations: result.violations,
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generatePDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
    const pdf = new jsPDF('p', 'mm', 'a4');
    const w = pdf.internal.pageSize.getWidth();
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, (canvas.height * w) / canvas.width);
    pdf.save(`MetroCheck_Report_${Date.now()}.pdf`);
  };

  const resetAll = () => {
    setResult(null); setFile(null); setPreview(null);
    setErrorMsg(null); setSaveStatus('idle'); setScanStep(0);
  };

  const statusColors = {
    COMPLIANT:      { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700' },
    WARNING:        { bg: 'bg-amber-50',   border: 'border-amber-300',   text: 'text-amber-700'   },
    'NON-COMPLIANT':{ bg: 'bg-red-50',     border: 'border-red-300',     text: 'text-red-700'     },
  };
  const sc = result ? (statusColors[result.status as keyof typeof statusColors] ?? statusColors['NON-COMPLIANT']) : null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'summary', label: 'Summary', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'text',    label: 'Text',    icon: <FileText    className="w-4 h-4" /> },
    { id: 'json',    label: 'JSON',    icon: <Code2       className="w-4 h-4" /> },
    { id: 'image',   label: 'Image',   icon: <ImageIcon   className="w-4 h-4" /> },
  ];

  const jsonString = result
    ? JSON.stringify(
        {
          status: result.status,
          score: result.score,
          missing_fields: result.missing_fields,
          summary: result.summary,
          declarations: result.declarations,
          violations: result.violations,
        },
        null, 2
      )
    : '';

  /* ══════════════ UPLOAD / CAPTURE SCREEN ═══════════════ */
  if (!result && !analyzing) {
    return (
      <div className="max-w-2xl mx-auto animate-in fade-in duration-500 space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4 border border-brand-200">
            <Zap className="w-3.5 h-3.5" /> METRO-CHECK AI · OCR Scanner
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Product Label Scanner</h1>
          <p className="text-slate-500 mt-2">Take a photo or upload a packaged commodity image — AI will extract and verify all mandatory declarations.</p>
        </div>

        {errorMsg && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 px-5 py-4 rounded-xl">
            <AlertCircle className="w-5 h-5 mt-0.5 text-red-500 flex-shrink-0" />
            <div className="flex-1 text-sm"><p className="font-semibold">Error</p><p>{errorMsg}</p></div>
            <button onClick={() => setErrorMsg(null)}><X className="w-4 h-4 text-red-400 hover:text-red-600" /></button>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Drop zone / preview */}
          <div
            className="relative h-72 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center cursor-pointer group"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); e.dataTransfer.files[0] && handleFileSelect(e.dataTransfer.files[0]); }}
            onClick={() => !preview && fileInputRef.current?.click()}
          >
            {preview ? (
              <>
                <img src={preview} alt="preview" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                  <button
                    onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); }}
                    className="opacity-0 group-hover:opacity-100 bg-white text-red-500 rounded-full p-2 shadow-lg transition-all"
                  ><X className="w-5 h-5" /></button>
                </div>
                <div className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">✓ Image Ready</div>
              </>
            ) : (
              <div className="text-center text-slate-400 group-hover:text-brand-500 transition-colors select-none">
                <Upload className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-semibold">Drag & drop image here</p>
                <p className="text-sm mt-1">or use the buttons below</p>
              </div>
            )}
          </div>

          <div className="p-6 space-y-4">
            {/* Camera + Upload */}
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-semibold py-5 rounded-2xl cursor-pointer transition-all shadow-lg shadow-brand-500/30 group">
                <Camera className="w-8 h-8 group-hover:scale-110 transition-transform" />
                <span className="text-sm">Take Photo</span>
                <input type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
              </label>
              <label className="flex flex-col items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-semibold py-5 rounded-2xl cursor-pointer transition-all group">
                <Upload className="w-8 h-8 group-hover:scale-110 transition-transform" />
                <span className="text-sm">Upload Image</span>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
              </label>
            </div>

            {/* Analyze */}
            <button
              onClick={() => handleAnalyze()}
              disabled={!file}
              className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                file
                  ? 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white shadow-lg shadow-brand-500/30 active:scale-[0.98]'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <ScanLine className="w-5 h-5" />
              {file ? 'Scan & Analyze Label' : 'Select an image first'}
            </button>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="font-medium">or try a demo</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Demo buttons */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'compliant',     label: 'Pass Demo', cls: 'text-emerald-700 border-emerald-300 hover:bg-emerald-50' },
                { type: 'warning',       label: 'Warn Demo', cls: 'text-amber-700 border-amber-300 hover:bg-amber-50' },
                { type: 'non-compliant', label: 'Fail Demo', cls: 'text-red-700 border-red-300 hover:bg-red-50' },
              ].map(d => (
                <button key={d.type} onClick={() => handleAnalyze(true, d.type)}
                  className={`py-2 text-xs font-bold rounded-xl border bg-white transition-all active:scale-95 ${d.cls}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          Validates against <strong>Legal Metrology (Packaged Commodities) Rules, 2011</strong>
        </p>
      </div>
    );
  }

  /* ══════════════ SCANNING ANIMATION ═══════════════ */
  if (analyzing) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10 w-full text-center">
          {preview && (
            <div className="relative w-48 h-48 mx-auto mb-8 rounded-2xl overflow-hidden border-4 border-brand-200">
              <img src={preview} alt="scanning" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-brand-900/20" />
              {/* Corner markers */}
              {['top-2 left-2 border-t-2 border-l-2','top-2 right-2 border-t-2 border-r-2','bottom-2 left-2 border-b-2 border-l-2','bottom-2 right-2 border-b-2 border-r-2'].map((c,i) => (
                <div key={i} className={`absolute w-6 h-6 border-brand-400 ${c}`} />
              ))}
              {/* Laser line */}
              <div className="absolute left-0 right-0 h-0.5 bg-brand-400 shadow-[0_0_10px_4px_#38bdf8] animate-ping" style={{top:'50%'}} />
            </div>
          )}
          {!preview && <ScanLine className="w-16 h-16 text-brand-400 animate-pulse mx-auto mb-8" />}

          <div className="space-y-3 text-left max-w-xs mx-auto">
            {scanSteps.map((step, i) => (
              <div key={i} className={`flex items-center gap-3 text-sm transition-all ${
                i < scanStep ? 'text-emerald-600' : i === scanStep ? 'text-brand-600 font-semibold' : 'text-slate-300'
              }`}>
                {i < scanStep
                  ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  : i === scanStep
                  ? <div className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin flex-shrink-0" />
                  : <div className="w-4 h-4 rounded-full border-2 border-slate-200 flex-shrink-0" />}
                {step}
              </div>
            ))}
          </div>

          <div className="mt-8 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500"
              style={{ width: `${((scanStep + 1) / scanSteps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════ RESULT — TABBED VIEW ═══════════════ */
  return (
    <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-400 space-y-5">

      {/* Action bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100">
        <button onClick={resetAll} className="btn-secondary text-sm py-1.5 px-3">
          <Camera className="w-4 h-4" /> New Scan
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={`btn-secondary text-sm py-1.5 px-3 ${saveStatus === 'saved' ? 'border-emerald-400 text-emerald-700' : saveStatus === 'error' ? 'border-red-400 text-red-700' : ''}`}
          >
            {saveStatus === 'saving' ? <RefreshCw className="w-4 h-4 animate-spin" /> : saveStatus === 'saved' ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Failed' : 'Save'}
          </button>
          <button onClick={generatePDF} className="btn-primary text-sm py-1.5 px-3">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Status banner */}
      <div className={`rounded-2xl px-6 py-5 border flex items-center justify-between gap-4 flex-wrap ${sc?.bg} ${sc?.border}`}>
        <div className="flex items-center gap-4">
          {result.status === 'COMPLIANT'
            ? <CheckCircle2 className="w-10 h-10 text-emerald-500 flex-shrink-0" />
            : result.status === 'WARNING'
            ? <AlertTriangle className="w-10 h-10 text-amber-500 flex-shrink-0" />
            : <AlertCircle className="w-10 h-10 text-red-500 flex-shrink-0" />}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Overall Result</p>
            <h2 className={`text-xl font-extrabold ${sc?.text}`}>
              {result.status === 'WARNING' ? 'WARNING — Manual Verification Required' : result.status}
            </h2>
            {result.missing_fields?.length > 0 && (
              <p className="text-sm text-slate-600 mt-0.5">
                Missing: <span className="font-semibold text-red-600">{result.missing_fields.join(', ')}</span>
              </p>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl px-5 py-3 text-center shadow-sm border border-white/80">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Score</p>
          <p className={`text-3xl font-black ${sc?.text}`}>{result.score}<span className="text-slate-300 text-lg">/100</span></p>
        </div>
      </div>

      {/* Tab bar — exactly like Asprise */}
      <div className="flex bg-white rounded-2xl shadow-sm border border-slate-100 p-1.5 gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div ref={reportRef} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

        {/* SUMMARY */}
        {activeTab === 'summary' && (
          <div className="p-6 space-y-6">
            {/* AI message */}
            <div className={`p-4 rounded-xl border-l-4 text-sm ${
              result.status === 'COMPLIANT'     ? 'border-emerald-500 bg-emerald-50 text-emerald-800' :
              result.status === 'WARNING'       ? 'border-amber-500 bg-amber-50 text-amber-800' :
                                                  'border-red-500 bg-red-50 text-red-800'
            }`}>
              <p className="font-bold mb-1 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> AI Assessment</p>
              <p className="leading-relaxed">{result.summary}</p>
            </div>

            {/* Declarations grid */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Extracted Declarations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.declarations.map((dec: any, i: number) => (
                  <div key={i} className={`rounded-xl p-4 border flex items-start gap-3 ${dec.is_valid ? 'border-slate-100 bg-slate-50' : 'border-red-100 bg-red-50'}`}>
                    {dec.is_valid
                      ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      : <AlertCircle  className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{dec.field_name}</p>
                      <p className={`font-semibold text-sm truncate ${dec.is_valid ? 'text-slate-800' : 'text-red-600'}`}>{dec.value}</p>
                      {dec.confidence > 0 && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${dec.confidence >= 80 ? 'bg-emerald-500' : dec.confidence >= 60 ? 'bg-amber-500' : 'bg-red-400'}`}
                              style={{ width: `${dec.confidence}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">{dec.confidence}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Violations */}
            {result.violations.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Violations ({result.violations.length})</h3>
                <div className="space-y-2">
                  {result.violations.map((v: any, i: number) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border-l-4 ${
                      v.severity === 'HIGH'   ? 'border-red-500 bg-red-50' :
                      v.severity === 'MEDIUM' ? 'border-amber-500 bg-amber-50' :
                                                'border-yellow-400 bg-yellow-50'
                    }`}>
                      <span className={`text-xs font-black px-2 py-0.5 rounded-md flex-shrink-0 ${
                        v.severity === 'HIGH'   ? 'bg-red-200 text-red-800' :
                        v.severity === 'MEDIUM' ? 'bg-amber-200 text-amber-800' :
                                                  'bg-yellow-200 text-yellow-800'
                      }`}>{v.rule_id}</span>
                      <div>
                        <p className="text-xs font-bold text-slate-500">{v.severity}</p>
                        <p className="text-sm text-slate-700">{v.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TEXT */}
        {activeTab === 'text' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Raw Extracted Text</h3>
              <button onClick={() => handleCopy(result.extractedText || '')}
                className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-all">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="bg-slate-900 rounded-xl p-5 font-mono text-sm text-slate-100 min-h-[200px] max-h-[500px] overflow-y-auto leading-relaxed whitespace-pre-wrap">
              {result.extractedText
                ? result.extractedText
                : <span className="text-slate-500 italic">No raw text available (Demo Mode bypasses OCR).</span>}
            </div>
          </div>
        )}

        {/* JSON */}
        {activeTab === 'json' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">JSON Response</h3>
              <button onClick={() => handleCopy(jsonString)}
                className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-all">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy JSON'}
              </button>
            </div>
            <div className="bg-slate-900 rounded-xl p-5 font-mono text-xs max-h-[520px] overflow-y-auto">
              <pre className="whitespace-pre-wrap break-words">
                {jsonString.split('\n').map((line, i) => {
                  const hl = line
                    .replace(/"([^"]+)":/g, '<span style="color:#7dd3fc">"$1":</span>')
                    .replace(/: "([^"]*)"([,]?)$/g, ': <span style="color:#86efac">"$1"</span>$2')
                    .replace(/: (true|false)([,]?)$/g, ': <span style="color:#fbbf24">$1</span>$2')
                    .replace(/: (-?\d+\.?\d*)([,]?)$/g, ': <span style="color:#c084fc">$1</span>$2');
                  return <div key={i} className="text-slate-100" dangerouslySetInnerHTML={{ __html: hl }} />;
                })}
              </pre>
            </div>
          </div>
        )}

        {/* IMAGE */}
        {activeTab === 'image' && (
          <div className="p-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Evidence Image</h3>
            {preview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <img src={preview} alt="evidence" className="w-full h-auto" />
                {/* Detection overlays */}
                <div className="absolute top-[12%] left-[5%] w-[45%] h-[10%] border-2 border-brand-400 bg-brand-400/10 rounded pointer-events-none">
                  <span className="absolute -top-6 left-0 bg-brand-500 text-white text-[10px] px-2 py-0.5 rounded-md font-bold whitespace-nowrap">Net Qty / MRP</span>
                </div>
                <div className="absolute bottom-[20%] right-[8%] w-[38%] h-[12%] border-2 border-emerald-400 bg-emerald-400/10 rounded pointer-events-none">
                  <span className="absolute -top-6 left-0 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-md font-bold whitespace-nowrap">Manufacturer / Date</span>
                </div>
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  OCR Confidence: {result.declarations.find((d: any) => d.confidence > 0)?.confidence ?? 0}%
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-slate-200 h-48 flex flex-col items-center justify-center text-slate-400 gap-2">
                <ImageIcon className="w-10 h-10" />
                <p className="text-sm">No image available (Demo Mode)</p>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-center text-xs text-slate-400 pb-4">
        System-generated preliminary assessment · Not legally binding · METRO-CHECK AI v2.0
      </p>
    </div>
  );
}
