import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  CertificateTemplate,
  TextBox,
  TextAlignment,
  FontWeight,
  TextTransform,
} from '../types/certificate';
import {
  Type,
  Trash2,
  Move,
  Maximize2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Sparkles,
  MousePointer,
  Crosshair,
  Plus,
  HelpCircle,
  AlertCircle,
  Eye,
  RotateCcw,
} from 'lucide-react';

interface CertificateEditorProps {
  template: CertificateTemplate;
  onUpdateTemplate: (updated: CertificateTemplate) => void;
  onProceedToImport: () => void;
}

const COMMON_FIELDS = [
  { id: 'name', label: 'Participant Name', defaultFont: 'Playfair Display', defaultSize: 48, defaultWeight: 'bold' as FontWeight },
  { id: 'certificateid', label: 'Certificate ID', defaultFont: 'JetBrains Mono', defaultSize: 16, defaultWeight: 'normal' as FontWeight },
  { id: 'rank', label: 'Rank / Award', defaultFont: 'Inter', defaultSize: 22, defaultWeight: '600' as FontWeight },
  { id: 'eventname', label: 'Event Name', defaultFont: 'Montserrat', defaultSize: 28, defaultWeight: 'bold' as FontWeight },
  { id: 'date', label: 'Date', defaultFont: 'Inter', defaultSize: 16, defaultWeight: '500' as FontWeight },
  { id: 'institution', label: 'Institution / Council', defaultFont: 'Inter', defaultSize: 18, defaultWeight: 'normal' as FontWeight },
];

const FONT_FAMILIES = [
  { id: 'Playfair Display', name: 'Playfair Display (Editorial Serif)' },
  { id: 'Cinzel', name: 'Cinzel (Formal Classical Serif)' },
  { id: 'Great Vibes', name: 'Great Vibes (Calligraphic Script)' },
  { id: 'Alex Brush', name: 'Alex Brush (Elegant Signature Script)' },
  { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans (Modern Display)' },
  { id: 'Inter', name: 'Inter (Clean Technical Sans)' },
  { id: 'Montserrat', name: 'Montserrat (Geometric Caps)' },
  { id: 'JetBrains Mono', name: 'JetBrains Mono (Certificate Hash / Code)' },
];

const COLOR_SWATCHES = [
  '#006382', // Glacier Primary
  '#0a2540', // Deep Navy
  '#1e293b', // Rich Charcoal
  '#b45309', // Royal Amber Gold
  '#831843', // Deep Crimson
  '#064e3b', // Forest Emerald
  '#525b72', // Slate Gray
  '#ffffff', // Clean White
];

export const CertificateEditor: React.FC<CertificateEditorProps> = ({
  template,
  onUpdateTemplate,
  onProceedToImport,
}) => {
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(
    template.textBoxes[0]?.id || null
  );
  const [mode, setMode] = useState<'select' | 'draw'>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);

  // Dragging & Resizing state
  const [interactionState, setInteractionState] = useState<{
    type: 'move' | 'resize';
    boxId: string;
    handle?: string; // 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w'
    startX: number;
    startY: number;
    initialBox: TextBox;
  } | null>(null);

  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const selectedBox = template.textBoxes.find((b) => b.id === selectedBoxId) || null;

  // Update a text box
  const updateTextBox = useCallback(
    (boxId: string, updates: Partial<TextBox>) => {
      const updatedBoxes = template.textBoxes.map((box) =>
        box.id === boxId ? { ...box, ...updates } : box
      );
      onUpdateTemplate({
        ...template,
        textBoxes: updatedBoxes,
        updatedAt: Date.now(),
      });
    },
    [template, onUpdateTemplate]
  );

  // Delete a text box
  const deleteTextBox = (boxId: string) => {
    const updatedBoxes = template.textBoxes.filter((b) => b.id !== boxId);
    onUpdateTemplate({
      ...template,
      textBoxes: updatedBoxes,
      updatedAt: Date.now(),
    });
    if (selectedBoxId === boxId) {
      setSelectedBoxId(updatedBoxes[0]?.id || null);
    }
  };

  // Keyboard shortcut for delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBoxId) {
        // Only if not focused on an input
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
          return;
        }
        deleteTextBox(selectedBoxId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBoxId, template]);

  // Convert mouse event coordinates to percentages (0-100)
  const getRelativeCoords = (e: React.MouseEvent | MouseEvent) => {
    if (!canvasContainerRef.current) return { x: 0, y: 0 };
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    return { x, y };
  };

  // Handle Draw start
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (mode === 'draw') {
      const coords = getRelativeCoords(e);
      setIsDrawing(true);
      setDrawStart(coords);
      setDrawCurrent(coords);
    } else {
      // If clicking directly on canvas background in select mode, deselect
      if (e.target === canvasContainerRef.current || (e.target as HTMLElement).tagName === 'IMG') {
        setSelectedBoxId(null);
      }
    }
  };

  // Quick add button
  const handleAddBox = (preset?: typeof COMMON_FIELDS[0]) => {
    const fieldId = preset ? preset.id : `field_${template.textBoxes.length + 1}`;
    // Check if fieldId already exists; if so, append number
    let uniqueId = fieldId;
    let counter = 1;
    while (template.textBoxes.some((b) => b.fieldId === uniqueId)) {
      uniqueId = `${fieldId}_${counter++}`;
    }

    const newBox: TextBox = {
      id: `tb-${Date.now()}`,
      fieldId: uniqueId,
      x: 30,
      y: 40 + (template.textBoxes.length % 5) * 8,
      width: 40,
      height: 8,
      fontFamily: preset ? preset.defaultFont : 'Playfair Display',
      fontSize: preset ? preset.defaultSize : 32,
      color: '#006382',
      fontWeight: preset ? preset.defaultWeight : 'bold',
      fontStyle: 'normal',
      textAlign: 'center',
      textTransform: 'none',
      letterSpacing: 1,
      lineHeight: 1.2,
      autoFit: true,
      placeholderText: preset ? preset.label : `{{${uniqueId}}}`,
    };

    onUpdateTemplate({
      ...template,
      textBoxes: [...template.textBoxes, newBox],
      updatedAt: Date.now(),
    });
    setSelectedBoxId(newBox.id);
    setMode('select');
  };

  // Mouse Move listener during draw, drag, or resize
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (isDrawing && drawStart) {
        const coords = getRelativeCoords(e);
        setDrawCurrent(coords);
      } else if (interactionState) {
        const coords = getRelativeCoords(e);
        const { type, boxId, handle, startX, startY, initialBox } = interactionState;

        const deltaX = coords.x - startX;
        const deltaY = coords.y - startY;

        if (type === 'move') {
          const newX = Math.max(0, Math.min(100 - initialBox.width, initialBox.x + deltaX));
          const newY = Math.max(0, Math.min(100 - initialBox.height, initialBox.y + deltaY));
          updateTextBox(boxId, { x: Number(newX.toFixed(2)), y: Number(newY.toFixed(2)) });
        } else if (type === 'resize' && handle) {
          let newX = initialBox.x;
          let newY = initialBox.y;
          let newW = initialBox.width;
          let newH = initialBox.height;

          if (handle.includes('e')) {
            newW = Math.max(5, Math.min(100 - initialBox.x, initialBox.width + deltaX));
          }
          if (handle.includes('s')) {
            newH = Math.max(3, Math.min(100 - initialBox.y, initialBox.height + deltaY));
          }
          if (handle.includes('w')) {
            const rawW = initialBox.width - deltaX;
            if (rawW >= 5 && initialBox.x + deltaX >= 0) {
              newX = initialBox.x + deltaX;
              newW = rawW;
            }
          }
          if (handle.includes('n')) {
            const rawH = initialBox.height - deltaY;
            if (rawH >= 3 && initialBox.y + deltaY >= 0) {
              newY = initialBox.y + deltaY;
              newH = rawH;
            }
          }

          updateTextBox(boxId, {
            x: Number(newX.toFixed(2)),
            y: Number(newY.toFixed(2)),
            width: Number(newW.toFixed(2)),
            height: Number(newH.toFixed(2)),
          });
        }
      }
    };

    const handleWindowMouseUp = () => {
      if (isDrawing && drawStart && drawCurrent) {
        const minX = Math.min(drawStart.x, drawCurrent.x);
        const minY = Math.min(drawStart.y, drawCurrent.y);
        const w = Math.abs(drawCurrent.x - drawStart.x);
        const h = Math.abs(drawCurrent.y - drawStart.y);

        // Only create if meaningful size (at least 3% width and 2% height)
        if (w >= 3 && h >= 2) {
          const fieldId = `field_${template.textBoxes.length + 1}`;
          const newBox: TextBox = {
            id: `tb-${Date.now()}`,
            fieldId,
            x: Number(minX.toFixed(2)),
            y: Number(minY.toFixed(2)),
            width: Number(w.toFixed(2)),
            height: Number(h.toFixed(2)),
            fontFamily: 'Playfair Display',
            fontSize: 32,
            color: '#006382',
            fontWeight: 'bold',
            fontStyle: 'normal',
            textAlign: 'center',
            textTransform: 'none',
            letterSpacing: 1,
            lineHeight: 1.2,
            autoFit: true,
            placeholderText: `{{${fieldId}}}`,
          };

          onUpdateTemplate({
            ...template,
            textBoxes: [...template.textBoxes, newBox],
            updatedAt: Date.now(),
          });
          setSelectedBoxId(newBox.id);
          setMode('select');
        }

        setIsDrawing(false);
        setDrawStart(null);
        setDrawCurrent(null);
      }

      if (interactionState) {
        setInteractionState(null);
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isDrawing, drawStart, drawCurrent, interactionState, template, updateTextBox, onUpdateTemplate]);

  // Check for duplicate field IDs
  const duplicateFieldIds = template.textBoxes
    .map((b) => b.fieldId)
    .filter((id, idx, arr) => arr.indexOf(id) !== idx);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Editor Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Certificate Studio Editor
            </h1>
            <span className="text-xs text-slate-500 font-mono">
              ({template.width} × {template.height}px · {template.orientation})
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Click and drag on the certificate to draw new text boxes, or drag handles to reposition and resize.
          </p>
        </div>

        {/* Toolbar Modes & CTA */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center p-0.5 bg-slate-200/70 rounded-lg">
            <button
              onClick={() => setMode('select')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                mode === 'select'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span>Select &amp; Move</span>
            </button>
            <button
              onClick={() => setMode('draw')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                mode === 'draw'
                  ? 'bg-sky-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Draw Text Box</span>
            </button>
          </div>

          <button
            onClick={() => handleAddBox()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Box</span>
          </button>

          <button
            onClick={onProceedToImport}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm border border-sky-600 transition-all ml-2"
          >
            <span>Continue to Data Import</span>
          </button>
        </div>
      </div>

      {/* Warnings Bar if duplicate field IDs */}
      {duplicateFieldIds.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Duplicate field ID detected: <strong>{duplicateFieldIds.join(', ')}</strong>. Each text box must have a unique field ID.
          </span>
        </div>
      )}

      {/* Main Workspace: 2-Column Split (Canvas + Inspector) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Canvas Area (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="flex items-center gap-1.5">
              {mode === 'draw' ? (
                <span className="text-sky-700 font-medium flex items-center gap-1">
                  <Crosshair className="w-3.5 h-3.5 animate-pulse" />
                  Drawing Mode active: Click and drag anywhere on canvas
                </span>
              ) : (
                <span>Click any text box to edit properties or drag corners to resize</span>
              )}
            </span>
            <span>{template.textBoxes.length} configured fields</span>
          </div>

          {/* Canvas Wrapper */}
          <div
            ref={canvasContainerRef}
            onMouseDown={handleCanvasMouseDown}
            className={`relative w-full rounded-xl overflow-hidden shadow-lg border border-sky-200/80 select-none bg-slate-900/5 ${
              mode === 'draw' ? 'cursor-crosshair' : 'cursor-default'
            }`}
            style={{
              aspectRatio: `${template.width} / ${template.height}`,
            }}
          >
            {/* Background Image */}
            <img
              src={template.imageUrl}
              alt="Certificate Background"
              className="w-full h-full object-contain pointer-events-none"
              referrerPolicy="no-referrer"
            />

            {/* Render Existing Text Boxes */}
            {template.textBoxes.map((box) => {
              const isSelected = box.id === selectedBoxId;

              return (
                <div
                  key={box.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBoxId(box.id);
                  }}
                  onMouseDown={(e) => {
                    if (mode === 'draw') return;
                    e.stopPropagation();
                    setSelectedBoxId(box.id);
                    const coords = getRelativeCoords(e);
                    setInteractionState({
                      type: 'move',
                      boxId: box.id,
                      startX: coords.x,
                      startY: coords.y,
                      initialBox: { ...box },
                    });
                  }}
                  className={`absolute group flex items-center justify-center transition-shadow ${
                    isSelected
                      ? 'ring-2 ring-sky-600 bg-sky-500/10 shadow-sm z-30'
                      : 'hover:ring-1 hover:ring-sky-400/60 hover:bg-sky-300/5 z-10'
                  } ${mode === 'select' ? 'cursor-move' : ''}`}
                  style={{
                    left: `${box.x}%`,
                    top: `${box.y}%`,
                    width: `${box.width}%`,
                    height: `${box.height}%`,
                  }}
                >
                  {/* Field ID indicator tag */}
                  <div
                    className={`absolute -top-5 left-0 px-1.5 py-0.2 rounded text-[10px] font-mono whitespace-nowrap transition-opacity pointer-events-none ${
                      isSelected
                        ? 'bg-sky-700 text-white opacity-100 font-semibold'
                        : 'bg-slate-800/80 text-white opacity-0 group-hover:opacity-90'
                    }`}
                  >
                    {box.fieldId}
                  </div>

                  {/* Render simulated text inside box */}
                  <div
                    className="w-full h-full flex items-center px-1 overflow-hidden pointer-events-none"
                    style={{
                      justifyContent:
                        box.textAlign === 'center'
                          ? 'center'
                          : box.textAlign === 'right'
                          ? 'flex-end'
                          : 'flex-start',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: box.fontFamily,
                        fontSize: `clamp(10px, ${(box.fontSize / template.width) * 100}vw, ${box.fontSize}px)`,
                        color: box.color,
                        fontWeight: box.fontWeight,
                        fontStyle: box.fontStyle,
                        letterSpacing: `${box.letterSpacing}px`,
                        textTransform: box.textTransform,
                      }}
                      className="truncate max-w-full leading-none"
                    >
                      {box.placeholderText || `{{${box.fieldId}}}`}
                    </span>
                  </div>

                  {/* Resize Handles (Active only when selected) */}
                  {isSelected && mode === 'select' && (
                    <>
                      {/* 4 Corners */}
                      {['nw', 'ne', 'se', 'sw'].map((h) => {
                        const getCursor = () => {
                          if (h === 'nw' || h === 'se') return 'cursor-nwse-resize';
                          return 'cursor-nesw-resize';
                        };
                        const getPosClass = () => {
                          switch (h) {
                            case 'nw':
                              return '-top-1.5 -left-1.5';
                            case 'ne':
                              return '-top-1.5 -right-1.5';
                            case 'se':
                              return '-bottom-1.5 -right-1.5';
                            case 'sw':
                              return '-bottom-1.5 -left-1.5';
                            default:
                              return '';
                          }
                        };
                        return (
                          <div
                            key={h}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              const coords = getRelativeCoords(e);
                              setInteractionState({
                                type: 'resize',
                                boxId: box.id,
                                handle: h,
                                startX: coords.x,
                                startY: coords.y,
                                initialBox: { ...box },
                              });
                            }}
                            className={`absolute w-3 h-3 bg-white border-2 border-sky-600 rounded-sm shadow-sm ${getCursor()} ${getPosClass()} z-40`}
                          />
                        );
                      })}
                      {/* Edge Handles */}
                      {['n', 's', 'e', 'w'].map((h) => {
                        const getCursor = () => (h === 'n' || h === 's' ? 'cursor-ns-resize' : 'cursor-ew-resize');
                        const getPosClass = () => {
                          switch (h) {
                            case 'n':
                              return '-top-1 left-1/2 -translate-x-1/2 w-4 h-1.5';
                            case 's':
                              return '-bottom-1 left-1/2 -translate-x-1/2 w-4 h-1.5';
                            case 'e':
                              return '-right-1 top-1/2 -translate-y-1/2 w-1.5 h-4';
                            case 'w':
                              return '-left-1 top-1/2 -translate-y-1/2 w-1.5 h-4';
                            default:
                              return '';
                          }
                        };
                        return (
                          <div
                            key={h}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              const coords = getRelativeCoords(e);
                              setInteractionState({
                                type: 'resize',
                                boxId: box.id,
                                handle: h,
                                startX: coords.x,
                                startY: coords.y,
                                initialBox: { ...box },
                              });
                            }}
                            className={`absolute bg-sky-600 rounded-full ${getCursor()} ${getPosClass()} z-40`}
                          />
                        );
                      })}
                    </>
                  )}
                </div>
              );
            })}

            {/* Temporary Bounding Box while dragging to draw */}
            {isDrawing && drawStart && drawCurrent && (
              <div
                className="absolute border-2 border-dashed border-sky-500 bg-sky-500/20 pointer-events-none z-50 flex items-center justify-center text-xs font-mono text-sky-900"
                style={{
                  left: `${Math.min(drawStart.x, drawCurrent.x)}%`,
                  top: `${Math.min(drawStart.y, drawCurrent.y)}%`,
                  width: `${Math.abs(drawCurrent.x - drawStart.x)}%`,
                  height: `${Math.abs(drawCurrent.y - drawStart.y)}%`,
                }}
              >
                <span>New Field</span>
              </div>
            )}
          </div>

          {/* Quick presets footer */}
          <div className="glass-panel p-3 rounded-lg flex items-center justify-between gap-4">
            <span className="text-xs font-medium text-slate-700">Quick Field Templates:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {COMMON_FIELDS.map((preset) => {
                const exists = template.textBoxes.some((b) => b.fieldId === preset.id);
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleAddBox(preset)}
                    className={`text-[11px] px-2.5 py-1 rounded transition-colors ${
                      exists
                        ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        : 'bg-sky-50 text-sky-800 hover:bg-sky-100 font-medium'
                    }`}
                  >
                    + {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Properties Inspector (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {selectedBox ? (
            <div className="glass-panel-elevated p-5 rounded-xl space-y-5">
              {/* Header with Field ID and Delete */}
              <div className="flex items-center justify-between pb-3 border-b border-sky-100">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-sky-700" />
                  <h3 className="text-sm font-bold text-slate-900">Field Settings</h3>
                </div>
                <button
                  onClick={() => deleteTextBox(selectedBox.id)}
                  className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded transition-colors"
                  title="Delete this text box (or press Delete key)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>

              {/* Unique Field ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                  <span>Unique Field ID</span>
                  <span className="text-[10px] text-slate-500 font-normal">Mapped to Excel</span>
                </label>
                <input
                  type="text"
                  value={selectedBox.fieldId}
                  onChange={(e) =>
                    updateTextBox(selectedBox.id, {
                      fieldId: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
                    })
                  }
                  placeholder="e.g. name, rank, date"
                  className="glass-input w-full text-xs font-mono px-3 py-2 rounded-lg text-slate-900"
                />
              </div>

              {/* Placeholder preview text */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800">
                  Sample / Placeholder Text
                </label>
                <input
                  type="text"
                  value={selectedBox.placeholderText || ''}
                  onChange={(e) =>
                    updateTextBox(selectedBox.id, { placeholderText: e.target.value })
                  }
                  placeholder="Sample name to display in editor"
                  className="glass-input w-full text-xs px-3 py-2 rounded-lg text-slate-900"
                />
              </div>

              {/* Typography Settings */}
              <div className="space-y-3 pt-2 border-t border-sky-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Text Formatting
                </h4>

                {/* Font Family */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-medium">Font Family</label>
                  <select
                    value={selectedBox.fontFamily}
                    onChange={(e) => updateTextBox(selectedBox.id, { fontFamily: e.target.value })}
                    className="glass-input w-full text-xs px-2.5 py-2 rounded-lg text-slate-900"
                  >
                    {FONT_FAMILIES.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font Size & Weight */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-medium flex items-center justify-between">
                      <span>Size</span>
                      <span className="text-[10px] font-mono">{selectedBox.fontSize}px</span>
                    </label>
                    <input
                      type="range"
                      min="12"
                      max="120"
                      value={selectedBox.fontSize}
                      onChange={(e) =>
                        updateTextBox(selectedBox.id, { fontSize: Number(e.target.value) })
                      }
                      className="w-full accent-sky-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-medium">Font Weight</label>
                    <select
                      value={selectedBox.fontWeight}
                      onChange={(e) =>
                        updateTextBox(selectedBox.id, { fontWeight: e.target.value as FontWeight })
                      }
                      className="glass-input w-full text-xs px-2.5 py-1.5 rounded-lg text-slate-900"
                    >
                      <option value="normal">Normal (400)</option>
                      <option value="500">Medium (500)</option>
                      <option value="600">SemiBold (600)</option>
                      <option value="bold">Bold (700)</option>
                      <option value="800">ExtraBold (800)</option>
                    </select>
                  </div>
                </div>

                {/* Text Alignment & Styles */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  {/* Alignment buttons */}
                  <div className="flex items-center bg-slate-200/60 p-0.5 rounded-lg">
                    {(['left', 'center', 'right'] as TextAlignment[]).map((align) => (
                      <button
                        key={align}
                        onClick={() => updateTextBox(selectedBox.id, { textAlign: align })}
                        className={`p-1.5 rounded transition-all ${
                          selectedBox.textAlign === align
                            ? 'bg-white text-sky-800 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title={`Align ${align}`}
                      >
                        {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                        {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                        {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>

                  {/* Italic toggle */}
                  <button
                    onClick={() =>
                      updateTextBox(selectedBox.id, {
                        fontStyle: selectedBox.fontStyle === 'italic' ? 'normal' : 'italic',
                      })
                    }
                    className={`p-1.5 rounded-lg border transition-all ${
                      selectedBox.fontStyle === 'italic'
                        ? 'bg-sky-50 border-sky-300 text-sky-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    title="Toggle Italic"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>

                  {/* Text Transform */}
                  <select
                    value={selectedBox.textTransform}
                    onChange={(e) =>
                      updateTextBox(selectedBox.id, {
                        textTransform: e.target.value as TextTransform,
                      })
                    }
                    className="glass-input text-[11px] px-2 py-1.5 rounded-lg text-slate-900"
                  >
                    <option value="none">Normal Case</option>
                    <option value="uppercase">UPPERCASE</option>
                    <option value="capitalize">Capitalize</option>
                  </select>
                </div>

                {/* Color Palette */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs text-slate-600 font-medium flex items-center justify-between">
                    <span>Text Color</span>
                    <span className="text-[10px] font-mono">{selectedBox.color}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedBox.color}
                      onChange={(e) => updateTextBox(selectedBox.id, { color: e.target.value })}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0"
                    />
                    <div className="flex items-center gap-1.5 flex-1">
                      {COLOR_SWATCHES.map((swatch) => (
                        <button
                          key={swatch}
                          onClick={() => updateTextBox(selectedBox.id, { color: swatch })}
                          className={`w-5 h-5 rounded-full border transition-transform ${
                            selectedBox.color.toLowerCase() === swatch.toLowerCase()
                              ? 'scale-125 border-sky-600 ring-2 ring-sky-300'
                              : 'border-slate-300 hover:scale-110'
                          }`}
                          style={{ backgroundColor: swatch }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Additional Settings: Auto-Fit */}
                <div className="pt-3 border-t border-sky-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        Auto-Fit Text
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Shrinks font if participant text overflows box width
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedBox.autoFit}
                        onChange={(e) =>
                          updateTextBox(selectedBox.id, { autoFit: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-700"></div>
                    </label>
                  </div>
                </div>

                {/* Proportional Coordinates */}
                <div className="pt-2 text-[10px] font-mono text-slate-400 grid grid-cols-2 gap-1 bg-slate-50 p-2 rounded border border-slate-200/60">
                  <span>X: {selectedBox.x}%</span>
                  <span>Y: {selectedBox.y}%</span>
                  <span>W: {selectedBox.width}%</span>
                  <span>H: {selectedBox.height}%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-6 rounded-xl text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center mx-auto border border-sky-200">
                <MousePointer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">No Field Selected</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Click on an existing text box on the canvas to inspect its formatting, or switch to
                  Draw mode to drag a new field.
                </p>
              </div>
              <button
                onClick={() => handleAddBox(COMMON_FIELDS[0])}
                className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
              >
                + Add Name Field
              </button>
            </div>
          )}

          {/* List of all fields in template */}
          <div className="glass-panel p-4 rounded-xl space-y-2">
            <h4 className="text-xs font-semibold text-slate-800">Fields in this template</h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {template.textBoxes.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBoxId(b.id)}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                    b.id === selectedBoxId
                      ? 'bg-sky-100/80 text-sky-900 font-semibold border border-sky-300'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-sky-800">{b.fieldId}</span>
                    <span className="text-[10px] text-slate-400">({b.fontFamily})</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTextBox(b.id);
                    }}
                    className="text-slate-400 hover:text-rose-600 p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
