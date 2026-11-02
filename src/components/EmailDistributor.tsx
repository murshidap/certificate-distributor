import React, { useState } from 'react';
import {
  GeneratedCertificate,
  EmailConfig,
  CertificateTemplate,
  ParticipantRecord,
} from '../types/certificate';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  FileText,
  Paperclip,
  Check,
  X,
  Eye,
  Sliders,
  Filter,
} from 'lucide-react';

interface EmailDistributorProps {
  template: CertificateTemplate;
  generatedCertificates: GeneratedCertificate[];
  onUpdateGeneratedCertificates: (updated: GeneratedCertificate[]) => void;
  availableColumns: string[];
}

export const EmailDistributor: React.FC<EmailDistributorProps> = ({
  template,
  generatedCertificates,
  onUpdateGeneratedCertificates,
  availableColumns,
}) => {
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    senderName: 'Certification Authority',
    emailColumn:
      availableColumns.find((c) => c.toLowerCase().includes('email')) ||
      availableColumns[0] ||
      'email',
    subject: 'Congratulations {{name}}! Here is your Certificate for {{eventname}}',
    messageBody: `Dear {{name}},\n\nCongratulations on successfully completing {{eventname}}! We are delighted to present your official Certificate of Achievement.\n\nCertificate ID: {{certificateid}}\nDate Issued: {{date}}\n\nPlease find your official certificate attached to this email. You may verify and share this credential with your network.\n\nWarm regards,\nAcademic & Certification Committee`,
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);
  const [currentSendingIndex, setCurrentSendingIndex] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Sent' | 'Failed'>('All');
  const [auditCert, setAuditCert] = useState<GeneratedCertificate | null>(null);

  // Status counts
  const totalCount = generatedCertificates.length;
  const pendingCount = generatedCertificates.filter((c) => c.emailStatus === 'Pending').length;
  const sendingCount = generatedCertificates.filter((c) => c.emailStatus === 'Sending').length;
  const sentCount = generatedCertificates.filter((c) => c.emailStatus === 'Sent').length;
  const failedCount = generatedCertificates.filter((c) => c.emailStatus === 'Failed').length;

  // Insert token into body
  const insertToken = (token: string) => {
    setEmailConfig((prev) => ({
      ...prev,
      messageBody: `${prev.messageBody} {{${token}}}`,
    }));
  };

  // Helper to render personalized email content
  const renderTemplateText = (templateText: string, record: ParticipantRecord) => {
    let result = templateText;
    Object.keys(record).forEach((k) => {
      if (!k.startsWith('_')) {
        result = result.replace(new RegExp(`{{${k}}}`, 'gi'), String(record[k] || ''));
      }
    });
    return result;
  };

  // Automated Sequential Distribution
  const startDistribution = async () => {
    setShowConfirmModal(false);
    setIsDistributing(true);

    const queue = [...generatedCertificates];

    for (let i = 0; i < queue.length; i++) {
      const cert = queue[i];
      // Only process Pending or Failed
      if (cert.emailStatus === 'Sent') continue;

      setCurrentSendingIndex(i);

      // 1. Set status to Sending
      queue[i] = { ...queue[i], emailStatus: 'Sending' };
      onUpdateGeneratedCertificates([...queue]);

      // 2. Retrieve corresponding email address
      const email = cert.record[emailConfig.emailColumn] || cert.record.email;

      // Realistic latency simulation (600ms per email)
      await new Promise((resolve) => setTimeout(resolve, 600));

      // 3. Check email validity
      if (!email || !String(email).includes('@')) {
        queue[i] = {
          ...queue[i],
          emailStatus: 'Failed',
          emailError: 'Missing or invalid recipient email address',
        };
      } else {
        // 4. Mark Sent
        queue[i] = {
          ...queue[i],
          emailStatus: 'Sent',
          emailSentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          emailError: undefined,
        };
      }

      onUpdateGeneratedCertificates([...queue]);
    }

    setCurrentSendingIndex(null);
    setIsDistributing(false);
  };

  // Retry failed only
  const retryFailed = () => {
    const updated = generatedCertificates.map((c) =>
      c.emailStatus === 'Failed' ? { ...c, emailStatus: 'Pending' as const } : c
    );
    onUpdateGeneratedCertificates(updated);
    setShowConfirmModal(true);
  };

  const filteredCerts = generatedCertificates.filter((c) => {
    if (statusFilter === 'All') return true;
    return c.emailStatus === statusFilter;
  });

  const sampleRecord = generatedCertificates[0]?.record || {
    name: 'Aliya Rahman',
    eventname: 'Global AI Summit',
    certificateid: 'CERT001_Aliya',
    date: 'November 2, 2026',
    email: 'aliya.rahman@example.com',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Email Distribution &amp; Live Tracking
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Configure personalized messages, attach individual certificates, and track real-time delivery status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {failedCount > 0 && (
            <button
              onClick={retryFailed}
              disabled={isDistributing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg shadow-sm transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry {failedCount} Failed</span>
            </button>
          )}

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isDistributing || generatedCertificates.length === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm border border-sky-600 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send to All Recipients ({pendingCount || totalCount})</span>
          </button>
        </div>
      </div>

      {/* Module 6.4 Status Tracking Indicators (Unboxed Clean Typography) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Pending Dispatch</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-800 mt-2">
            {pendingCount}
          </div>
          <span className="text-[11px] text-slate-400">Ready in queue</span>
        </div>

        <div className="glass-panel p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-sky-700 font-medium">
            <span>Currently Sending</span>
            <RefreshCw className={`w-4 h-4 text-sky-600 ${isDistributing ? 'animate-spin' : ''}`} />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-sky-800 mt-2">
            {sendingCount}
          </div>
          <span className="text-[11px] text-slate-400">Active worker</span>
        </div>

        <div className="glass-panel p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-emerald-700 font-medium">
            <span>Delivered (Sent)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-800 mt-2">
            {sentCount}
          </div>
          <span className="text-[11px] text-slate-400">Attached &amp; sent</span>
        </div>

        <div className="glass-panel p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-rose-700 font-medium">
            <span>Delivery Failed</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-rose-800 mt-2">
            {failedCount}
          </div>
          <span className="text-[11px] text-slate-400">Invalid email or bounce</span>
        </div>
      </div>

      {/* 2-Column: Email Configuration + Delivery Tracking Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Email Configuration Form (5 cols) */}
        <div className="lg:col-span-5 glass-panel-elevated p-5 rounded-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-sky-100">
            <Mail className="w-4 h-4 text-sky-700" />
            <h2 className="text-sm font-bold text-slate-900">Email Configuration</h2>
          </div>

          {/* Email Column Selector */}
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-semibold">Recipient Email Column</label>
            <select
              value={emailConfig.emailColumn}
              onChange={(e) =>
                setEmailConfig((prev) => ({ ...prev, emailColumn: e.target.value }))
              }
              className="glass-input w-full text-xs px-2.5 py-1.5 rounded-lg text-slate-900"
            >
              {availableColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          {/* Sender Name */}
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-semibold">Sender Display Name</label>
            <input
              type="text"
              value={emailConfig.senderName}
              onChange={(e) =>
                setEmailConfig((prev) => ({ ...prev, senderName: e.target.value }))
              }
              className="glass-input w-full text-xs px-3 py-1.5 rounded-lg text-slate-900"
            />
          </div>

          {/* Email Subject */}
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-semibold">Email Subject</label>
            <input
              type="text"
              value={emailConfig.subject}
              onChange={(e) => setEmailConfig((prev) => ({ ...prev, subject: e.target.value }))}
              placeholder="Certificate Notification: {{name}}"
              className="glass-input w-full text-xs px-3 py-1.5 rounded-lg text-slate-900"
            />
          </div>

          {/* Dynamic Placeholder Tokens */}
          <div className="space-y-1">
            <label className="text-[11px] text-slate-500 font-medium">Click to insert token:</label>
            <div className="flex flex-wrap gap-1">
              {['name', 'certificateid', 'eventname', 'date', 'rank', 'institution'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => insertToken(t)}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 transition-colors"
                >
                  +{`{{${t}}}`}
                </button>
              ))}
            </div>
          </div>

          {/* Email Message Body */}
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-semibold">Email Message / Body</label>
            <textarea
              rows={7}
              value={emailConfig.messageBody}
              onChange={(e) =>
                setEmailConfig((prev) => ({ ...prev, messageBody: e.target.value }))
              }
              className="glass-input w-full text-xs px-3 py-2 rounded-lg text-slate-900 leading-relaxed font-sans"
            />
          </div>

          {/* Sample Preview Accordion */}
          <div className="pt-2 border-t border-sky-100 text-[11px] space-y-1">
            <span className="font-semibold text-slate-700 block">Sample Email Preview:</span>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800 truncate">
                Subj: {renderTemplateText(emailConfig.subject, sampleRecord)}
              </p>
              <p className="whitespace-pre-line text-[10px] line-clamp-4">
                {renderTemplateText(emailConfig.messageBody, sampleRecord)}
              </p>
              <div className="flex items-center gap-1.5 text-sky-700 text-[10px] font-mono pt-1 border-t border-slate-200">
                <Paperclip className="w-3 h-3" />
                <span>Attachment: CERT001_Aliya.pdf</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tracking Table (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-sky-100">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Email Delivery Tracking</h2>
              <span className="text-xs font-mono text-slate-500">({filteredCerts.length})</span>
            </div>

            {/* Filter segmented buttons */}
            <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg text-xs">
              {(['All', 'Pending', 'Sent', 'Failed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                    statusFilter === status
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-sky-100 max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="sticky top-0 bg-sky-50 text-slate-800 text-[11px] uppercase tracking-wider font-semibold border-b border-sky-100">
                <tr>
                  <th className="p-3">Recipient</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100/60 bg-white/70">
                {filteredCerts.map((cert) => {
                  const email = cert.record[emailConfig.emailColumn] || cert.record.email || 'N/A';
                  return (
                    <tr key={cert.participantId} className="hover:bg-sky-50/30 transition-colors">
                      <td className="p-3 font-semibold text-slate-900 max-w-[140px] truncate">
                        {cert.record.name || 'Participant'}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-600 max-w-[160px] truncate">
                        {email}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {cert.emailStatus === 'Pending' && (
                          <span className="text-slate-500 text-[11px] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Pending
                          </span>
                        )}
                        {cert.emailStatus === 'Sending' && (
                          <span className="text-sky-700 font-semibold text-[11px] flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Sending...
                          </span>
                        )}
                        {cert.emailStatus === 'Sent' && (
                          <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Sent · {cert.emailSentAt}
                          </span>
                        )}
                        {cert.emailStatus === 'Failed' && (
                          <span
                            className="text-rose-700 font-semibold text-[11px] flex items-center gap-1"
                            title={cert.emailError}
                          >
                            <AlertCircle className="w-3 h-3" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setAuditCert(cert)}
                          className="p-1 text-slate-400 hover:text-sky-700 rounded transition-colors"
                          title="View Email Audit"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Module 6.2 Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel-elevated w-full max-w-lg p-6 rounded-2xl shadow-2xl space-y-5 border border-sky-300">
            <div className="flex items-center justify-between pb-3 border-b border-sky-100">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-sky-700" />
                <h3 className="text-base font-bold text-slate-900">Confirm Email Distribution</h3>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                You are about to initiate automated distribution to{' '}
                <strong className="text-slate-900">{totalCount} recipients</strong>. Each recipient
                will receive a personalized email with their individual certificate attached.
              </p>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Subject Preview:
                  </span>
                  <p className="font-semibold text-slate-900">
                    {renderTemplateText(emailConfig.subject, sampleRecord)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    First Attachment Preview:
                  </span>
                  <p className="font-mono text-sky-800 font-medium">
                    {generatedCertificates[0]?.fileName || 'CERT001_Aliya.pdf'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-sky-100">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={startDistribution}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm border border-sky-600 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm &amp; Send All</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {auditCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel-elevated w-full max-w-xl p-6 rounded-2xl shadow-2xl space-y-4 border border-sky-300">
            <div className="flex items-center justify-between pb-3 border-b border-sky-100">
              <h3 className="text-sm font-bold text-slate-900">
                Email Audit: {auditCert.record.name}
              </h3>
              <button
                onClick={() => setAuditCert(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block">Status:</span>
                  <span className="font-bold text-slate-800">{auditCert.emailStatus}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Sent At:</span>
                  <span className="text-slate-800">{auditCert.emailSentAt || 'Not sent'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Recipient Email:</span>
                  <span className="text-slate-800">
                    {auditCert.record[emailConfig.emailColumn] || auditCert.record.email}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Attachment File:</span>
                  <span className="text-sky-800 font-semibold">{auditCert.fileName}</span>
                </div>
              </div>

              {/* Rendered Body */}
              <div className="border border-slate-200 p-3 rounded-lg bg-white space-y-1">
                <span className="font-bold text-slate-800 block">
                  Subject: {renderTemplateText(emailConfig.subject, auditCert.record)}
                </span>
                <p className="whitespace-pre-line text-slate-600 text-xs">
                  {renderTemplateText(emailConfig.messageBody, auditCert.record)}
                </p>
              </div>

              {/* Attached preview thumbnail */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-600 block">
                  Attached Certificate Document:
                </span>
                <img
                  src={auditCert.previewUrl}
                  alt={auditCert.fileName}
                  className="w-full max-h-48 object-contain rounded-lg border border-slate-200 bg-slate-100"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setAuditCert(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
