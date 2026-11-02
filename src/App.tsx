import React, { useState, useEffect, useCallback } from 'react';
import {
  ActiveTab,
  CertificateTemplate,
  ParticipantRecord,
  ColumnMapping,
  GeneratedCertificate,
} from './types/certificate';
import { DEFAULT_TEMPLATES } from './utils/defaultTemplates';
import { SAMPLE_PARTICIPANTS } from './utils/sampleData';
import { ensureFontsLoaded, renderCertificateCanvas } from './utils/certificateRenderer';
import { Header } from './components/Header';
import { TemplateManager } from './components/TemplateManager';
import { CertificateEditor } from './components/CertificateEditor';
import { DataImporter } from './components/DataImporter';
import { CertificatePreview } from './components/CertificatePreview';
import { EmailDistributor } from './components/EmailDistributor';
import { BulkDownloader } from './components/BulkDownloader';

const STORAGE_KEY_TEMPLATES = 'certiglacier_templates_v1';
const STORAGE_KEY_PARTICIPANTS = 'certiglacier_participants_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('preview');
  
  // Templates state
  const [templates, setTemplates] = useState<CertificateTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TEMPLATES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_TEMPLATES;
  });

  const [activeTemplate, setActiveTemplate] = useState<CertificateTemplate>(
    templates[0] || DEFAULT_TEMPLATES[0]
  );

  // Participants state
  const [participants, setParticipants] = useState<ParticipantRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PARTICIPANTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return SAMPLE_PARTICIPANTS;
  });

  // Column mapping state
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    name: 'name',
    certificateid: 'certificateid',
    rank: 'rank',
    eventname: 'eventname',
    date: 'date',
    institution: 'institution',
  });

  // Generated certificates state
  const [generatedCertificates, setGeneratedCertificates] = useState<GeneratedCertificate[]>([]);

  // Pre-load certificate web fonts on startup
  useEffect(() => {
    ensureFontsLoaded([
      'Playfair Display',
      'Cinzel',
      'Great Vibes',
      'Alex Brush',
      'Plus Jakarta Sans',
      'Inter',
      'Montserrat',
      'JetBrains Mono',
    ]);
  }, []);

  // Save templates to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates));
    } catch {
      // Ignore quota errors for large images
    }
  }, [templates]);

  // Save participants to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PARTICIPANTS, JSON.stringify(participants));
    } catch {
      // Ignore
    }
  }, [participants]);

  // Handle template selection
  const handleSelectTemplate = (template: CertificateTemplate) => {
    setActiveTemplate(template);
    // Clear generated certs to force regenerate on preview
    setGeneratedCertificates([]);
  };

  // Handle saving a template
  const handleSaveTemplate = (updated: CertificateTemplate) => {
    const exists = templates.some((t) => t.id === updated.id);
    let newTemplates: CertificateTemplate[];
    if (exists) {
      newTemplates = templates.map((t) => (t.id === updated.id ? updated : t));
    } else {
      newTemplates = [updated, ...templates];
    }
    setTemplates(newTemplates);
    setActiveTemplate(updated);
    setGeneratedCertificates([]);
  };

  // Handle deleting a template
  const handleDeleteTemplate = (id: string) => {
    const remaining = templates.filter((t) => t.id !== id);
    if (remaining.length > 0) {
      setTemplates(remaining);
      if (activeTemplate.id === id) {
        setActiveTemplate(remaining[0]);
      }
    }
  };

  // Handle newly uploaded design
  const handleUploadNewDesign = (newTemplate: CertificateTemplate) => {
    const updated = [newTemplate, ...templates];
    setTemplates(updated);
    setActiveTemplate(newTemplate);
    setActiveTab('editor');
    setGeneratedCertificates([]);
  };

  // Quick generate action from header
  const handleQuickGenerate = () => {
    setActiveTab('preview');
  };

  // Extract available column headers from participants
  const availableColumns = Array.from(
    new Set(
      participants.flatMap((p) =>
        Object.keys(p).filter((k) => !k.startsWith('_'))
      )
    )
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f6ff] text-slate-800">
      {/* Glacier Atmospheric Backdrop Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-indigo-100/40 blur-3xl" />
        <div className="absolute bottom-10 left-1/4 w-80 h-80 rounded-full bg-teal-100/30 blur-3xl" />
      </div>

      {/* Main App Bar adhering to Top Bar Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        participantCount={participants.length}
        generatedCount={generatedCertificates.length}
        templateName={activeTemplate.name}
        onQuickGenerate={handleQuickGenerate}
      />

      {/* Workspace Viewport Container */}
      <main className="relative z-10 flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
        {/* Module 1: Template Management */}
        {activeTab === 'templates' && (
          <TemplateManager
            templates={templates}
            activeTemplate={activeTemplate}
            onSelectTemplate={handleSelectTemplate}
            onSaveTemplate={handleSaveTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onUploadNewDesign={handleUploadNewDesign}
            onProceedToEditor={() => setActiveTab('editor')}
          />
        )}

        {/* Module 2: Certificate Editor */}
        {activeTab === 'editor' && (
          <CertificateEditor
            template={activeTemplate}
            onUpdateTemplate={handleSaveTemplate}
            onProceedToImport={() => setActiveTab('import')}
          />
        )}

        {/* Module 3: Excel/CSV Import & Column Mapping */}
        {activeTab === 'import' && (
          <DataImporter
            template={activeTemplate}
            participants={participants}
            columnMapping={columnMapping}
            onUpdateParticipants={setParticipants}
            onUpdateMapping={setColumnMapping}
            onProceedToPreview={() => setActiveTab('preview')}
          />
        )}

        {/* Modules 4 & 5: Certificate Preview & Bulk Generation */}
        {activeTab === 'preview' && (
          <CertificatePreview
            template={activeTemplate}
            participants={participants}
            columnMapping={columnMapping}
            generatedCertificates={generatedCertificates}
            onUpdateGeneratedCertificates={setGeneratedCertificates}
            onReturnToEditor={() => setActiveTab('editor')}
            onProceedToEmail={() => setActiveTab('email')}
            onProceedToDownload={() => setActiveTab('download')}
          />
        )}

        {/* Module 6: Email Distribution */}
        {activeTab === 'email' && (
          <EmailDistributor
            template={activeTemplate}
            generatedCertificates={generatedCertificates}
            onUpdateGeneratedCertificates={setGeneratedCertificates}
            availableColumns={availableColumns}
          />
        )}

        {/* Module 7: Bulk Certificate Download */}
        {activeTab === 'download' && (
          <BulkDownloader
            template={activeTemplate}
            certificates={generatedCertificates}
            onSelectCertificates={setGeneratedCertificates}
          />
        )}
      </main>
    </div>
  );
}
