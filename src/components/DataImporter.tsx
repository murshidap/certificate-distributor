import React, { useRef, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { ParticipantRecord, ColumnMapping, CertificateTemplate } from '../types/certificate';
import { SAMPLE_PARTICIPANTS } from '../utils/sampleData';
import {
  FileSpreadsheet,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Table,
  Search,
  Plus,
  Trash2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface DataImporterProps {
  template: CertificateTemplate;
  participants: ParticipantRecord[];
  columnMapping: ColumnMapping;
  onUpdateParticipants: (records: ParticipantRecord[]) => void;
  onUpdateMapping: (mapping: ColumnMapping) => void;
  onProceedToPreview: () => void;
}

export const DataImporter: React.FC<DataImporterProps> = ({
  template,
  participants,
  columnMapping,
  onUpdateParticipants,
  onUpdateMapping,
  onProceedToPreview,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Extract available columns whenever participants change
  useEffect(() => {
    if (participants.length > 0) {
      const keys = new Set<string>();
      participants.forEach((p) => {
        Object.keys(p).forEach((k) => {
          if (!k.startsWith('_')) keys.add(k);
        });
      });
      const colList = Array.from(keys);
      setColumns(colList);

      // Perform automatic column mapping if mapping is empty or missing fields
      autoMapColumns(colList, template);
    } else {
      setColumns([]);
    }
  }, [participants, template]);

  // Automatic column mapping logic using fuzzy heuristics
  const autoMapColumns = (cols: string[], currentTemplate: CertificateTemplate) => {
    const newMapping: ColumnMapping = { ...columnMapping };

    currentTemplate.textBoxes.forEach((box) => {
      const target = box.fieldId.toLowerCase();

      // If already mapped and the column exists in data, keep it
      if (newMapping[box.fieldId] && cols.includes(newMapping[box.fieldId])) {
        return;
      }

      // Exact match
      const exact = cols.find((c) => c.toLowerCase() === target);
      if (exact) {
        newMapping[box.fieldId] = exact;
        return;
      }

      // Heuristic matches
      if (target === 'name' || target === 'fullname' || target === 'participant') {
        const match = cols.find((c) => {
          const l = c.toLowerCase();
          return l.includes('name') || l.includes('student') || l.includes('recipient') || l.includes('participant');
        });
        if (match) newMapping[box.fieldId] = match;
      } else if (target === 'certificateid' || target === 'certid' || target === 'id') {
        const match = cols.find((c) => {
          const l = c.toLowerCase();
          return l.includes('id') || l.includes('cert') || l.includes('roll') || l.includes('reg');
        });
        if (match) newMapping[box.fieldId] = match;
      } else if (target === 'rank' || target === 'award' || target === 'position') {
        const match = cols.find((c) => {
          const l = c.toLowerCase();
          return l.includes('rank') || l.includes('award') || l.includes('grade') || l.includes('place') || l.includes('position');
        });
        if (match) newMapping[box.fieldId] = match;
      } else if (target === 'eventname' || target === 'event' || target === 'course') {
        const match = cols.find((c) => {
          const l = c.toLowerCase();
          return l.includes('event') || l.includes('course') || l.includes('workshop') || l.includes('title');
        });
        if (match) newMapping[box.fieldId] = match;
      } else if (target === 'date') {
        const match = cols.find((c) => {
          const l = c.toLowerCase();
          return l.includes('date') || l.includes('issued') || l.includes('time');
        });
        if (match) newMapping[box.fieldId] = match;
      } else if (target === 'institution' || target === 'organization') {
        const match = cols.find((c) => {
          const l = c.toLowerCase();
          return l.includes('institution') || l.includes('org') || l.includes('college') || l.includes('school') || l.includes('company');
        });
        if (match) newMapping[box.fieldId] = match;
      }
    });

    onUpdateMapping(newMapping);
  };

  // Parse Excel (.xlsx, .xls) or CSV
  const parseFile = async (file: File) => {
    setErrorMsg(null);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error('Workbook contains no sheets.');
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

      if (rawJson.length === 0) {
        throw new Error('Spreadsheet appears to be empty.');
      }

      const formatted: ParticipantRecord[] = rawJson.map((row, idx) => ({
        _id: `rec-${Date.now()}-${idx}`,
        _selected: true,
        ...row,
      }));

      onUpdateParticipants(formatted);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to read spreadsheet file.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  };

  const handleLoadSample = () => {
    onUpdateParticipants(SAMPLE_PARTICIPANTS);
  };

  const handleMappingChange = (fieldId: string, colName: string) => {
    onUpdateMapping({
      ...columnMapping,
      [fieldId]: colName,
    });
  };

  const handleAddRow = () => {
    const newRecord: ParticipantRecord = {
      _id: `rec-${Date.now()}`,
      _selected: true,
      name: 'New Participant',
      email: 'participant@example.com',
      certificateid: `CERT-${String(participants.length + 1).padStart(3, '0')}`,
      eventname: 'Global AI Summit',
      date: 'November 2, 2026',
    };
    onUpdateParticipants([newRecord, ...participants]);
  };

  const handleDeleteRow = (id: string) => {
    onUpdateParticipants(participants.filter((p) => p._id !== id));
  };

  const handleToggleSelectAll = (checked: boolean) => {
    onUpdateParticipants(participants.map((p) => ({ ...p, _selected: checked })));
  };

  const handleToggleRowSelect = (id: string, checked: boolean) => {
    onUpdateParticipants(
      participants.map((p) => (p._id === id ? { ...p, _selected: checked } : p))
    );
  };

  const filteredParticipants = participants.filter((p) => {
    if (!searchTerm) return true;
    return Object.values(p).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Participant Data &amp; Column Mapping
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Upload Excel (.xlsx) or CSV files, automatically match certificate fields with columns, and review records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLoadSample}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>Load Sample Participants (7)</span>
          </button>

          <button
            onClick={onProceedToPreview}
            disabled={participants.length === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm border border-sky-600 transition-all"
          >
            <span>Proceed to Preview</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`glass-panel border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-sky-500 bg-sky-50/60 scale-[1.005]'
            : 'border-sky-200/80 hover:border-sky-400 hover:bg-white/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-sky-100/80 border border-sky-200 flex items-center justify-center text-sky-700 shadow-sm">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Drop Excel (.xlsx, .xls) or CSV spreadsheet here
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Automatically reads column headers and extracts all participant records.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>{participants.length} records loaded</span>
            <span>·</span>
            <span>{columns.length} columns detected</span>
          </div>
        </div>
        {errorMsg && <p className="text-xs font-medium text-rose-600 mt-2">{errorMsg}</p>}
      </div>

      {/* Column Mapping Section */}
      <div className="glass-panel-elevated p-6 rounded-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-sky-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Certificate Column Mapping</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Map each certificate text box field to the corresponding column in your spreadsheet.
            </p>
          </div>
          <button
            onClick={() => autoMapColumns(columns, template)}
            disabled={columns.length === 0}
            className="flex items-center gap-1.5 text-xs text-sky-700 hover:text-sky-800 font-semibold px-2.5 py-1 rounded-md bg-sky-50 hover:bg-sky-100 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-run Auto-Mapping</span>
          </button>
        </div>

        {template.textBoxes.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No dynamic text fields configured in the current template. Open the Editor to add text fields.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {template.textBoxes.map((box) => {
              const mappedCol = columnMapping[box.fieldId];
              const isMapped = !!mappedCol && columns.includes(mappedCol);
              const sampleValue =
                isMapped && participants[0] ? String(participants[0][mappedCol] || '') : null;

              return (
                <div
                  key={box.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isMapped
                      ? 'bg-white/90 border-sky-200/80 shadow-xs'
                      : 'bg-amber-50/40 border-amber-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {box.fieldId}
                    </span>
                    {isMapped ? (
                      <span className="text-[10px] text-emerald-700 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Mapped
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-700 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3 h-3" />
                        Unmapped
                      </span>
                    )}
                  </div>

                  <select
                    value={mappedCol || ''}
                    onChange={(e) => handleMappingChange(box.fieldId, e.target.value)}
                    className="glass-input w-full text-xs px-2.5 py-1.5 rounded-lg text-slate-900"
                  >
                    <option value="">-- Select Sheet Column --</option>
                    {columns.map((c) => (
                      <option key={c} value={c}>
                        Column: {c}
                      </option>
                    ))}
                  </select>

                  {sampleValue && (
                    <div className="mt-2 text-[11px] text-slate-500 truncate">
                      Sample: <span className="text-slate-800 font-medium">"{sampleValue}"</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Participant Data Table */}
      <div className="glass-panel p-6 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-sky-100">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-sky-700" />
            <h2 className="text-base font-bold text-slate-900">Extracted Participant Records</h2>
            <span className="text-xs text-slate-500 tabular-nums font-mono">
              ({participants.length} total)
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search participants..."
                className="glass-input text-xs pl-8 pr-3 py-1.5 rounded-lg w-full text-slate-900"
              />
            </div>

            <button
              onClick={handleAddRow}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Row</span>
            </button>
          </div>
        </div>

        {participants.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <p className="text-xs text-slate-500">No participant records imported yet.</p>
            <button
              onClick={handleLoadSample}
              className="px-3.5 py-1.5 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg shadow-sm"
            >
              Click here to load 7 sample participants
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-sky-100">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-sky-50/70 text-slate-800 text-[11px] uppercase tracking-wider font-semibold border-b border-sky-100">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        participants.length > 0 && participants.every((p) => p._selected)
                      }
                      onChange={(e) => handleToggleSelectAll(e.target.checked)}
                      className="rounded accent-sky-700"
                    />
                  </th>
                  <th className="p-3 w-12 font-mono">#</th>
                  {columns.map((c) => (
                    <th key={c} className="p-3 whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                  <th className="p-3 w-12 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100/60 bg-white/70">
                {filteredParticipants.map((row, idx) => (
                  <tr
                    key={row._id}
                    className={`hover:bg-sky-50/40 transition-colors ${
                      row._selected ? '' : 'opacity-60 bg-slate-50/30'
                    }`}
                  >
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={row._selected ?? true}
                        onChange={(e) => handleToggleRowSelect(row._id, e.target.checked)}
                        className="rounded accent-sky-700"
                      />
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">{idx + 1}</td>
                    {columns.map((c) => (
                      <td key={c} className="p-3 whitespace-nowrap max-w-xs truncate font-medium">
                        {String(row[c] || '-')}
                      </td>
                    ))}
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteRow(row._id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
