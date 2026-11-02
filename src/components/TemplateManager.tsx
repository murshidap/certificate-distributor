import React, { useRef, useState } from 'react';
import { CertificateTemplate } from '../types/certificate';
import { Upload, Plus, Trash2, Edit3, Check, Layers, Image as ImageIcon, Copy, ArrowRight } from 'lucide-react';

interface TemplateManagerProps {
  templates: CertificateTemplate[];
  activeTemplate: CertificateTemplate;
  onSelectTemplate: (template: CertificateTemplate) => void;
  onSaveTemplate: (template: CertificateTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onUploadNewDesign: (template: CertificateTemplate) => void;
  onProceedToEditor: () => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  templates,
  activeTemplate,
  onSelectTemplate,
  onSaveTemplate,
  onDeleteTemplate,
  onUploadNewDesign,
  onProceedToEditor,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Handle image upload (PNG, JPG, JPEG)
  const processImageFile = (file: File) => {
    setUploadError(null);
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid format. Please upload a PNG, JPG, or JPEG file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth || 1920;
        const height = img.naturalHeight || 1080;
        const orientation = width >= height ? 'landscape' : 'portrait';

        const baseFileName = file.name.replace(/\.[^/.]+$/, '');
        const newTemplate: CertificateTemplate = {
          id: `tpl-custom-${Date.now()}`,
          name: `${baseFileName} Template`,
          orientation,
          width,
          height,
          imageUrl: dataUrl,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          textBoxes: [
            {
              id: `tb-${Date.now()}-1`,
              fieldId: 'name',
              x: 20,
              y: 45,
              width: 60,
              height: 10,
              fontFamily: 'Playfair Display',
              fontSize: Math.round(width * 0.028),
              color: '#1e293b',
              fontWeight: 'bold',
              fontStyle: 'normal',
              textAlign: 'center',
              textTransform: 'none',
              letterSpacing: 1,
              lineHeight: 1.2,
              autoFit: true,
              placeholderText: 'Recipient Full Name',
            },
            {
              id: `tb-${Date.now()}-2`,
              fieldId: 'certificateid',
              x: 70,
              y: 88,
              width: 25,
              height: 5,
              fontFamily: 'JetBrains Mono',
              fontSize: Math.round(width * 0.012),
              color: '#64748b',
              fontWeight: 'normal',
              fontStyle: 'normal',
              textAlign: 'right',
              textTransform: 'uppercase',
              letterSpacing: 1,
              lineHeight: 1.2,
              autoFit: true,
              placeholderText: 'ID: CERT-2026-001',
            },
            {
              id: `tb-${Date.now()}-3`,
              fieldId: 'date',
              x: 5,
              y: 88,
              width: 25,
              height: 5,
              fontFamily: 'Inter',
              fontSize: Math.round(width * 0.012),
              color: '#64748b',
              fontWeight: '500',
              fontStyle: 'normal',
              textAlign: 'left',
              textTransform: 'none',
              letterSpacing: 0,
              lineHeight: 1.2,
              autoFit: true,
              placeholderText: 'Date: November 2, 2026',
            },
          ],
        };

        onUploadNewDesign(newTemplate);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const startRename = (template: CertificateTemplate) => {
    setEditingId(template.id);
    setEditingName(template.name);
  };

  const saveRename = (template: CertificateTemplate) => {
    if (editingName.trim()) {
      onSaveTemplate({
        ...template,
        name: editingName.trim(),
        updatedAt: Date.now(),
      });
    }
    setEditingId(null);
  };

  const handleClone = (template: CertificateTemplate) => {
    const cloned: CertificateTemplate = {
      ...template,
      id: `tpl-${Date.now()}`,
      name: `${template.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onSaveTemplate(cloned);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Hero Intro */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Certificate Template Management
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Upload custom designs in PNG, JPG, or JPEG format, manage orientation, and configure reusable templates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm border border-sky-600 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Certificate Design</span>
          </button>
          <button
            onClick={onProceedToEditor}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 bg-white/80 hover:bg-white border border-sky-200 rounded-lg shadow-sm transition-all"
          >
            <span>Open in Editor</span>
            <ArrowRight className="w-3.5 h-3.5 text-sky-700" />
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`glass-panel border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-sky-500 bg-sky-50/60 scale-[1.005]'
            : 'border-sky-200/80 hover:border-sky-400 hover:bg-white/80'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-sky-100/80 border border-sky-200 flex items-center justify-center text-sky-700 shadow-sm">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Click to browse or drop certificate design here
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports PNG, JPG, and JPEG. Preserves native pixel dimensions & resolution.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Landscape &amp; Portrait</span>
            <span>·</span>
            <span>Up to 4K Ultra-HD</span>
            <span>·</span>
            <span>Zero Quality Loss</span>
          </div>
        </div>
        {uploadError && (
          <p className="text-xs font-medium text-rose-600 mt-3">{uploadError}</p>
        )}
      </div>

      {/* Template Gallery */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-700" />
            <h2 className="text-base font-semibold text-slate-900">Available Templates</h2>
            <span className="text-xs text-slate-500">({templates.length} saved)</span>
          </div>
          <span className="text-xs text-slate-500">
            Active: <strong className="text-sky-800">{activeTemplate.name}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((tpl) => {
            const isActive = tpl.id === activeTemplate.id;
            const isEditing = editingId === tpl.id;

            return (
              <div
                key={tpl.id}
                onClick={() => onSelectTemplate(tpl)}
                className={`glass-panel rounded-xl overflow-hidden cursor-pointer transition-all duration-200 flex flex-col ${
                  isActive
                    ? 'ring-2 ring-sky-600 border-sky-400 shadow-md'
                    : 'hover:border-sky-300 hover:shadow-sm'
                }`}
              >
                {/* Thumbnail Preview */}
                <div className="relative aspect-[16/10] bg-slate-100/80 overflow-hidden border-b border-sky-100 flex items-center justify-center">
                  <img
                    src={tpl.imageUrl}
                    alt={tpl.name}
                    className="w-full h-full object-contain p-2"
                    referrerPolicy="no-referrer"
                  />
                  {isActive && (
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-700 text-white text-[10px] font-semibold tracking-wide shadow-sm">
                      <Check className="w-3 h-3" />
                      <span>Active In Studio</span>
                    </div>
                  )}
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-slate-900/60 backdrop-blur-md text-white text-[10px] font-mono">
                    {tpl.width} × {tpl.height}
                  </div>
                </div>

                {/* Template Info & Actions */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {isEditing ? (
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveRename(tpl)}
                          autoFocus
                          className="glass-input text-xs font-semibold px-2.5 py-1 rounded w-full text-slate-900"
                        />
                        <button
                          onClick={() => saveRename(tpl)}
                          className="p-1 rounded text-sky-700 hover:bg-sky-100"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                          {tpl.name}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startRename(tpl);
                          }}
                          className="text-slate-400 hover:text-slate-700 p-0.5"
                          title="Rename template"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="capitalize">{tpl.orientation}</span>
                      <span>·</span>
                      <span>{tpl.textBoxes.length} dynamic fields</span>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-sky-100/60">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClone(tpl);
                      }}
                      className="flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-sky-700 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Duplicate</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {templates.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete template "${tpl.name}"?`)) {
                              onDeleteTemplate(tpl.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Delete template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTemplate(tpl);
                          onProceedToEditor();
                        }}
                        className="px-2.5 py-1 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100/80 rounded transition-colors"
                      >
                        Edit Canvas
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
