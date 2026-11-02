import React, { useState } from 'react';
import { GeneratedCertificate, CertificateTemplate } from '../types/certificate';
import { generateCertificatesZip, triggerDownload } from '../utils/zipGenerator';
import { downloadCertificatePdf, downloadCertificatePng } from '../utils/pdfGenerator';
import {
  Download,
  Archive,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  FileCheck,
  Search,
  Filter,
} from 'lucide-react';

interface BulkDownloaderProps {
  template: CertificateTemplate;
  certificates: GeneratedCertificate[];
  onSelectCertificates: (updated: GeneratedCertificate[]) => void;
}

export const BulkDownloader: React.FC<BulkDownloaderProps> = ({
  template,
  certificates,
  onSelectCertificates,
}) => {
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'png'>('pdf');
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedCount = certificates.filter((c) => c.record._selected).length;
  const totalCount = certificates.length;

  const handleToggleAll = (checked: boolean) => {
    const updated = certificates.map((c) => ({
      ...c,
      record: { ...c.record, _selected: checked },
    }));
    onSelectCertificates(updated);
  };

  const handleToggleSingle = (id: string, checked: boolean) => {
    const updated = certificates.map((c) =>
      c.participantId === id
        ? { ...c, record: { ...c.record, _selected: checked } }
        : c
    );
    onSelectCertificates(updated);
  };

  // Download ZIP of all or selected
  const handleDownloadZip = async (selectedOnly: boolean) => {
    const targets = selectedOnly
      ? certificates.filter((c) => c.record._selected)
      : certificates;

    if (targets.length === 0) return;

    setIsZipping(true);
    setZipProgress(0);

    try {
      const zipBlob = await generateCertificatesZip(
        targets,
        template,
        downloadFormat,
        (percent) => setZipProgress(percent)
      );

      const zipName = `${template.name.replace(/\s+/g, '_')}_Certificates_${downloadFormat.toUpperCase()}.zip`;
      triggerDownload(zipBlob, zipName);
    } catch (err) {
      console.error('Failed to generate ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownloadSingle = async (cert: GeneratedCertificate) => {
    if (downloadFormat === 'pdf') {
      await downloadCertificatePdf(cert.previewUrl, template, cert.fileName);
    } else {
      downloadCertificatePng(cert.previewUrl, cert.fileName);
    }
  };

  const filteredCerts = certificates.filter((c) => {
    if (!searchTerm) return true;
    const name = c.record.name || '';
    const certId = c.fileName || '';
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      certId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Bulk Certificate Download &amp; Archive
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Bundle certificates into a ZIP archive with meaningful filenames, or download selected individuals.
          </p>
        </div>

        {/* Format Selector */}
        <div className="flex items-center gap-2 bg-slate-200/60 p-1 rounded-lg">
          <button
            onClick={() => setDownloadFormat('pdf')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
              downloadFormat === 'pdf'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF Archive</span>
          </button>
          <button
            onClick={() => setDownloadFormat('png')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
              downloadFormat === 'png'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>PNG Archive</span>
          </button>
        </div>
      </div>

      {/* Progress banner during ZIP compilation */}
      {isZipping && (
        <div className="glass-panel p-4 rounded-xl space-y-2 border border-sky-300">
          <div className="flex items-center justify-between text-xs font-semibold text-sky-900">
            <span className="flex items-center gap-2">
              <Archive className="w-4 h-4 animate-spin text-sky-700" />
              Compressing certificates into ZIP archive...
            </span>
            <span className="font-mono tabular-nums">{zipProgress}%</span>
          </div>
          <div className="w-full h-2 bg-sky-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-700 transition-all duration-150"
              style={{ width: `${zipProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Download Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Download All */}
        <div className="glass-panel-elevated p-6 rounded-xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                <Archive className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Download All Certificates</h3>
                <span className="text-xs text-slate-500">
                  Total archive contains all {totalCount} participants
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              Generates a single ZIP package containing high-resolution {downloadFormat.toUpperCase()}{' '}
              files, cleanly named with recipient names and certificate IDs.
            </p>
          </div>

          <button
            onClick={() => handleDownloadZip(false)}
            disabled={isZipping || totalCount === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm border border-sky-600 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download All ({totalCount} {downloadFormat.toUpperCase()}s) as ZIP</span>
          </button>
        </div>

        {/* Card 2: Download Selected Only */}
        <div className="glass-panel p-6 rounded-xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Download Selected Only</h3>
                <span className="text-xs text-slate-500">
                  {selectedCount} of {totalCount} certificates currently selected
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              Download only the checked participants from the table below into a tailored ZIP
              archive.
            </p>
          </div>

          <button
            onClick={() => handleDownloadZip(true)}
            disabled={isZipping || selectedCount === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed border border-sky-200 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-sky-700" />
            <span>Download Selected ({selectedCount}) as ZIP</span>
          </button>
        </div>
      </div>

      {/* Certificate File Explorer Table */}
      <div className="glass-panel p-5 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-sky-100">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-900">Generated File Index</h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <button
                onClick={() => handleToggleAll(true)}
                className="text-sky-700 hover:underline"
              >
                Select All
              </button>
              <span>·</span>
              <button
                onClick={() => handleToggleAll(false)}
                className="text-slate-500 hover:underline"
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or file..."
              className="glass-input text-xs pl-8 pr-3 py-1.5 rounded-lg w-full text-slate-900"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-sky-100 max-h-[500px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="sticky top-0 bg-sky-50 text-slate-800 text-[11px] uppercase tracking-wider font-semibold border-b border-sky-100">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={totalCount > 0 && selectedCount === totalCount}
                    onChange={(e) => handleToggleAll(e.target.checked)}
                    className="rounded accent-sky-700"
                  />
                </th>
                <th className="p-3">Generated Filename</th>
                <th className="p-3">Participant Name</th>
                <th className="p-3">Email</th>
                <th className="p-3 text-right">Individual Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/60 bg-white/70">
              {filteredCerts.map((cert) => {
                const isSelected = cert.record._selected ?? true;
                const email = cert.record.email || 'N/A';
                return (
                  <tr
                    key={cert.participantId}
                    className={`hover:bg-sky-50/40 transition-colors ${
                      isSelected ? '' : 'opacity-60 bg-slate-50/30'
                    }`}
                  >
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleToggleSingle(cert.participantId, e.target.checked)}
                        className="rounded accent-sky-700"
                      />
                    </td>
                    <td className="p-3 font-mono font-semibold text-sky-900 max-w-xs truncate">
                      {cert.fileName}
                    </td>
                    <td className="p-3 font-medium text-slate-900">
                      {cert.record.name || 'Participant'}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">{email}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDownloadSingle(cert)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        <span>{downloadFormat.toUpperCase()}</span>
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
  );
};
