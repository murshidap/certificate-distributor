import React from 'react';
import { ActiveTab } from '../types/certificate';
import { Award, Layers, Type, FileSpreadsheet, Eye, Mail, Download } from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  participantCount: number;
  generatedCount: number;
  templateName: string;
  onQuickGenerate: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  participantCount,
  generatedCount,
  templateName,
  onQuickGenerate,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'templates', label: 'Templates', icon: <Layers className="w-4 h-4" /> },
    { id: 'editor', label: 'Editor', icon: <Type className="w-4 h-4" /> },
    { id: 'import', label: 'Data Import', icon: <FileSpreadsheet className="w-4 h-4" />, count: participantCount },
    { id: 'preview', label: 'Preview & Gen', icon: <Eye className="w-4 h-4" />, count: generatedCount },
    { id: 'email', label: 'Email Queue', icon: <Mail className="w-4 h-4" /> },
    { id: 'download', label: 'Export ZIP', icon: <Download className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-8 px-6 py-3.5 border-b border-sky-100/70 bg-white/75 backdrop-blur-xl">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-600 text-white shadow-sm">
          <Award className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
            CertiGlacier
          </span>
          <span className="text-xs text-slate-400 font-normal hidden sm:inline">
            · {templateName || 'Certificate Studio'}
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links (Single-Line, Top Bar Contract) */}
      <nav className="flex items-center gap-1.5 md:gap-2 overflow-x-auto py-1 scrollbar-none">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-all ${
                isActive
                  ? 'bg-sky-600/10 text-sky-800 shadow-sm border border-sky-300/40 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className="text-[10px] tabular-nums font-mono opacity-80 bg-white/80 px-1.5 py-0.2 rounded border border-sky-200">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onQuickGenerate}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 active:scale-[0.98] rounded-md transition-all whitespace-nowrap shrink-0 shadow-sm border border-sky-600"
        >
          <Award className="w-3.5 h-3.5" />
          <span>Generate Certificates</span>
        </button>
      </div>
    </header>
  );
};
