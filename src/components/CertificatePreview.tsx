import React, { useState, useEffect, useCallback } from 'react';
import {
  CertificateTemplate,
  ParticipantRecord,
  ColumnMapping,
  GeneratedCertificate,
} from '../types/certificate';
import { renderCertificateCanvas } from '../utils/certificateRenderer';
import { downloadCertificatePdf, downloadCertificatePng } from '../utils/pdfGenerator';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Layers,
  FileText,
  Image as ImageIcon,
  Sliders,
  Settings2,
  Mail,
} from 'lucide-react';

interface CertificatePreviewProps {
  template: CertificateTemplate;
  participants: ParticipantRecord[];
  columnMapping: ColumnMapping;
  generatedCertificates: GeneratedCertificate[];
  onUpdateGeneratedCertificates: (certs: GeneratedCertificate[]) => void;
  onReturnToEditor: () => void;
  onProceedToEmail: () => void;
  onProceedToDownload: () => void;
}

export const CertificatePreview: React.FC<CertificatePreviewProps> = ({
  template,
  participants,
  columnMapping,
  generatedCertificates,
  onUpdateGeneratedCertificates,
  onReturnToEditor,
  onProceedToEmail,
  onProceedToDownload,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [viewMode, setViewMode] = useState<'rendered' | 'wireframe' | 'raw'>('rendered');
  const [namingPattern, setNamingPattern] = useState('{certificateid}_{name}');
  const [outputFormat, setOutputFormat] = useState<'pdf' | 'png'>('pdf');
  const [isTestingLongName, setIsTestingLongName] = useState(false);

  // Helper to format clean filename
  const formatFileName = useCallback(
    (record: ParticipantRecord, index: number, ext: 'pdf' | 'png') => {
      let name = namingPattern;
      // Replace tokens
      Object.keys(record).forEach((key) => {
        if (!key.startsWith('_')) {
          name = name.replace(new RegExp(`{${key}}`, 'gi'), String(record[key]));
        }
      });
      // Fallback tokens if not replaced
      name = name.replace(/{index}/gi, String(index + 1).padStart(3, '0'));
      name = name.replace(/[{}]/g, '');
      // Clean illegal characters
      name = name.replace(/[^a-zA-Z0-9_\-]/g, '_');
      if (!name) name = `Certificate_${index + 1}`;
      return `${name}.${ext}`;
    },
    [namingPattern]
  );

  // Generate certificates for all participants
  const generateAllCertificates = useCallback(async () => {
    if (participants.length === 0) return;
    setIsGenerating(true);
    setGenerationProgress(0);

    const generated: GeneratedCertificate[] = [];
    const total = participants.length;

    for (let i = 0; i < total; i++) {
      const record = participants[i];
      try {
        const render = await renderCertificateCanvas(template, record, columnMapping);
        const fileName = formatFileName(record, i, outputFormat);

        // Preserve previous email status if existed
        const prevCert = generatedCertificates.find((g) => g.participantId === record._id);

        generated.push({
          participantId: record._id,
          record,
          fileName,
          previewUrl: render.dataUrl,
          canvasBlob: render.blob,
          overflowDetected: render.overflowDetected,
          autoFitApplied: render.autoFitApplied,
          emailStatus: prevCert ? prevCert.emailStatus : 'Pending',
          emailSentAt: prevCert?.emailSentAt,
          emailError: prevCert?.emailError,
        });
      } catch (err) {
        console.error('Failed to render certificate for row', i, err);
      }

      setGenerationProgress(Math.round(((i + 1) / total) * 100));
    }

    onUpdateGeneratedCertificates(generated);
    setIsGenerating(false);
  }, [
    participants,
    template,
    columnMapping,
    formatFileName,
    outputFormat,
    generatedCertificates,
    onUpdateGeneratedCertificates,
  ]);

  // Initial trigger if none generated
  useEffect(() => {
    if (generatedCertificates.length === 0 && participants.length > 0) {
      generateAllCertificates();
    }
  }, [participants.length]);

  const currentCert = generatedCertificates[currentIndex] || null;
  const currentRecord = currentCert?.record || participants[currentIndex] || null;

  const handleNext = () => {
    if (currentIndex < generatedCertificates.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleDownloadCurrent = async () => {
    if (!currentCert) return;
    if (outputFormat === 'pdf') {
      await downloadCertificatePdf(currentCert.previewUrl, template, currentCert.fileName);
    } else {
      downloadCertificatePng(currentCert.previewUrl, currentCert.fileName);
    }
  };

  // Test Long Name stress test
  const handleTestLongNameToggle = async () => {
    const nextState = !isTestingLongName;
    setIsTestingLongName(nextState);

    if (currentRecord) {
      const stressRecord = {
        ...currentRecord,
        name: nextState
          ? 'Archduchess Alexandria Sophia Von Hohenzollern-Sigmaringen'
          : participants[currentIndex]?.name || currentRecord.name,
      };

      const render = await renderCertificateCanvas(template, stressRecord, columnMapping);
      const updatedList = [...generatedCertificates];
      if (updatedList[currentIndex]) {
        updatedList[currentIndex] = {
          ...updatedList[currentIndex],
          previewUrl: render.dataUrl,
          overflowDetected: render.overflowDetected,
          autoFitApplied: render.autoFitApplied,
        };
        onUpdateGeneratedCertificates(updatedList);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Controls & Navigation */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Certificate Preview &amp; Bulk Generation
            </h1>
            {currentCert && (
              <span className="text-xs text-slate-500 font-mono">
                (Viewing {currentIndex + 1} of {generatedCertificates.length})
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Inspect individual generated certificates, test text overflow/auto-fit, or adjust naming patterns.
          </p>
        </div>

        {/* View Mode Tabs & Quick Actions */}
        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center p-0.5 bg-slate-200/70 rounded-lg">
            <button
              onClick={() => setViewMode('rendered')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === 'rendered'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rendered
            </button>
            <button
              onClick={() => setViewMode('wireframe')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === 'wireframe'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Box Wireframe
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === 'raw'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Raw Template
            </button>
          </div>

          <button
            onClick={onReturnToEditor}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-all"
          >
            <Edit className="w-3.5 h-3.5 text-sky-700" />
            <span>Modify in Editor</span>
          </button>

          <button
            onClick={generateAllCertificates}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg shadow-sm transition-all"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>Regenerate All</span>
          </button>
        </div>
      </div>

      {/* Progress Bar during generation */}
      {isGenerating && (
        <div className="glass-panel p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-800">
            <span>Generating certificates for {participants.length} participants...</span>
            <span className="font-mono tabular-nums">{generationProgress}%</span>
          </div>
          <div className="w-full h-2 bg-sky-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-700 transition-all duration-200"
              style={{ width: `${generationProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Preview Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Certificate Viewer (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="glass-panel p-3 rounded-xl flex items-center justify-between text-xs text-slate-600">
            {/* Carousel navigation controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="p-1 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous certificate"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono tabular-nums font-semibold text-slate-800">
                {generatedCertificates.length > 0 ? currentIndex + 1 : 0} /{' '}
                {generatedCertificates.length}
              </span>
              <button
                onClick={handleNext}
                disabled={currentIndex >= generatedCertificates.length - 1}
                className="p-1 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next certificate"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick jump dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Recipient:</span>
              <select
                value={currentIndex}
                onChange={(e) => setCurrentIndex(Number(e.target.value))}
                className="glass-input text-xs px-2 py-1 rounded-md text-slate-900 font-medium max-w-xs truncate"
              >
                {generatedCertificates.map((cert, idx) => (
                  <option key={cert.participantId} value={idx}>
                    #{idx + 1} - {cert.record.name || 'Participant'} ({cert.fileName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Canvas or Image Display */}
          <div
            className="relative w-full rounded-xl overflow-hidden shadow-xl border border-sky-200/80 bg-white"
            style={{
              aspectRatio: `${template.width} / ${template.height}`,
            }}
          >
            {viewMode === 'raw' && (
              <img
                src={template.imageUrl}
                alt="Raw Certificate Design"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            )}

            {viewMode === 'rendered' && currentCert && (
              <img
                src={currentCert.previewUrl}
                alt={currentCert.fileName}
                className="w-full h-full object-contain animate-fadeIn"
                referrerPolicy="no-referrer"
              />
            )}

            {viewMode === 'wireframe' && (
              <div className="relative w-full h-full">
                <img
                  src={template.imageUrl}
                  alt="Certificate Template"
                  className="w-full h-full object-contain opacity-60"
                  referrerPolicy="no-referrer"
                />
                {template.textBoxes.map((b) => (
                  <div
                    key={b.id}
                    className="absolute border border-dashed border-sky-600 bg-sky-500/15 flex items-center justify-center p-1 text-[10px] font-mono text-sky-900 font-semibold"
                    style={{
                      left: `${b.x}%`,
                      top: `${b.y}%`,
                      width: `${b.width}%`,
                      height: `${b.height}%`,
                    }}
                  >
                    <span>{b.fieldId}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overflow & Auto-fit Status Strip */}
          {currentCert && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-sky-50/60 border border-sky-200 text-xs">
              <div className="flex items-center gap-3">
                {currentCert.autoFitApplied ? (
                  <span className="flex items-center gap-1.5 text-sky-800 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    <span>Auto-fit Active (Text smoothly scaled to fit box)</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-emerald-800 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Text fits perfectly within margins</span>
                  </span>
                )}

                {currentCert.overflowDetected && (
                  <span className="flex items-center gap-1 text-rose-700 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Overflow risk: text exceeds box height</span>
                  </span>
                )}
              </div>

              {/* Long name test toggle */}
              <button
                onClick={handleTestLongNameToggle}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all ${
                  isTestingLongName
                    ? 'bg-sky-700 text-white font-medium'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{isTestingLongName ? 'Reset Name' : 'Test Long Name Overflow'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Generation Inspector & Single Download (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Current Certificate Meta Card */}
          {currentCert && (
            <div className="glass-panel-elevated p-5 rounded-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-sky-100">
                <h3 className="text-sm font-bold text-slate-900">Certificate Details</h3>
                <span className="text-[11px] font-mono text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  {outputFormat.toUpperCase()}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Generated Filename:</span>
                  <span className="font-mono font-semibold text-slate-900 break-all">
                    {currentCert.fileName}
                  </span>
                </div>

                <div className="pt-2 border-t border-sky-100 space-y-1">
                  <span className="text-slate-500 block">Mapped Participant Values:</span>
                  <div className="bg-slate-50 p-2.5 rounded-lg space-y-1 font-mono text-[11px]">
                    {Object.keys(currentCert.record)
                      .filter((k) => !k.startsWith('_'))
                      .map((k) => (
                        <div key={k} className="flex justify-between gap-2">
                          <span className="text-slate-500">{k}:</span>
                          <span className="text-slate-800 font-medium truncate max-w-[180px]">
                            {String(currentCert.record[k])}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Single Download Button */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleDownloadCurrent}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm border border-sky-600 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download This Certificate ({outputFormat.toUpperCase()})</span>
                </button>
              </div>
            </div>
          )}

          {/* Module 4: Generation Output & Naming Settings */}
          <div className="glass-panel p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Bulk Generation Settings
            </h3>

            {/* Output format toggle */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-600 font-medium">Output Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setOutputFormat('pdf');
                    generateAllCertificates();
                  }}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-medium border transition-all ${
                    outputFormat === 'pdf'
                      ? 'bg-sky-50 border-sky-400 text-sky-800 font-bold shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF (Standard)</span>
                </button>
                <button
                  onClick={() => {
                    setOutputFormat('png');
                    generateAllCertificates();
                  }}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-medium border transition-all ${
                    outputFormat === 'png'
                      ? 'bg-sky-50 border-sky-400 text-sky-800 font-bold shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>PNG (High-Res)</span>
                </button>
              </div>
            </div>

            {/* Naming Pattern */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-600 font-medium flex items-center justify-between">
                <span>Filename Pattern</span>
                <span className="text-[10px] text-slate-400">Tokens: {'{name}, {id}'}</span>
              </label>
              <input
                type="text"
                value={namingPattern}
                onChange={(e) => setNamingPattern(e.target.value)}
                placeholder="{certificateid}_{name}"
                className="glass-input w-full text-xs font-mono px-3 py-2 rounded-lg text-slate-900"
              />
              <p className="text-[11px] text-slate-500">
                Example:{' '}
                <span className="font-mono text-slate-800">
                  {formatFileName(
                    participants[0] || { certificateid: 'CERT001', name: 'Aliya' },
                    0,
                    outputFormat
                  )}
                </span>
              </p>
            </div>

            {/* Next Steps Buttons */}
            <div className="pt-2 border-t border-sky-100 space-y-2">
              <button
                onClick={onProceedToEmail}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-sky-200 rounded-lg shadow-sm transition-all"
              >
                <Mail className="w-3.5 h-3.5 text-sky-700" />
                <span>Distribute via Email</span>
              </button>

              <button
                onClick={onProceedToDownload}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-lg shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5 text-sky-700" />
                <span>Download All as ZIP</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
