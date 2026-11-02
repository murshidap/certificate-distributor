import { CertificateTemplate, TextBox, ParticipantRecord, ColumnMapping } from '../types/certificate';

// Helper to ensure web fonts are ready before rendering
export async function ensureFontsLoaded(fontFamilies: string[]): Promise<void> {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      const promises = fontFamilies.map((font) =>
        document.fonts.load(`16px "${font}"`)
      );
      await Promise.all(promises);
    } catch {
      // Fallback silently
    }
  }
}

export interface RenderResult {
  dataUrl: string;
  blob?: Blob;
  overflowDetected: boolean;
  autoFitApplied: boolean;
}

export async function renderCertificateCanvas(
  template: CertificateTemplate,
  participant?: ParticipantRecord,
  mapping?: ColumnMapping,
  overrideFields?: Record<string, string>
): Promise<RenderResult> {
  const canvas = document.createElement('canvas');
  canvas.width = template.width || 1920;
  canvas.height = template.height || 1080;
  const ctx = canvas.getContext('2d', { alpha: false });

  if (!ctx) {
    throw new Error('Unable to create 2D canvas context');
  }

  // Draw background image
  const bgImg = new Image();
  bgImg.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    bgImg.onload = () => resolve();
    bgImg.onerror = (e) => reject(e);
    bgImg.src = template.imageUrl;
  });

  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  let overflowDetected = false;
  let autoFitApplied = false;

  // Render each text box
  for (const box of template.textBoxes) {
    let rawText = '';

    if (overrideFields && overrideFields[box.fieldId] !== undefined) {
      rawText = String(overrideFields[box.fieldId]);
    } else if (participant && mapping) {
      const mappedCol = mapping[box.fieldId];
      if (mappedCol && participant[mappedCol] !== undefined) {
        rawText = String(participant[mappedCol]);
      } else if (participant[box.fieldId] !== undefined) {
        rawText = String(participant[box.fieldId]);
      } else {
        rawText = box.placeholderText || `{{${box.fieldId}}}`;
      }
    } else {
      rawText = box.placeholderText || `{{${box.fieldId}}}`;
    }

    // Apply text transform
    if (box.textTransform === 'uppercase') {
      rawText = rawText.toUpperCase();
    } else if (box.textTransform === 'lowercase') {
      rawText = rawText.toLowerCase();
    } else if (box.textTransform === 'capitalize') {
      rawText = rawText.replace(/\b\w/g, (c) => c.toUpperCase());
    }

    if (!rawText.trim()) continue;

    // Convert normalized coordinates to native canvas pixels
    const boxX = (box.x / 100) * canvas.width;
    const boxY = (box.y / 100) * canvas.height;
    const boxWidth = (box.width / 100) * canvas.width;
    const boxHeight = (box.height / 100) * canvas.height;

    // Auto-fit calculation
    let currentFontSize = box.fontSize;
    const minFontSize = Math.max(12, Math.floor(box.fontSize * 0.35));

    const checkFit = (size: number): boolean => {
      ctx.font = `${box.fontStyle === 'italic' ? 'italic ' : ''}${box.fontWeight} ${size}px "${box.fontFamily}", sans-serif`;
      const metrics = ctx.measureText(rawText);
      const textWidth = metrics.width;
      const textHeight = size * 1.1; // approximate cap height
      return textWidth <= boxWidth && textHeight <= boxHeight;
    };

    if (box.autoFit) {
      while (!checkFit(currentFontSize) && currentFontSize > minFontSize) {
        currentFontSize -= 1;
        autoFitApplied = true;
      }
      if (!checkFit(currentFontSize)) {
        overflowDetected = true;
      }
    } else {
      if (!checkFit(currentFontSize)) {
        overflowDetected = true;
      }
    }

    // Set canvas font styling
    ctx.font = `${box.fontStyle === 'italic' ? 'italic ' : ''}${box.fontWeight} ${currentFontSize}px "${box.fontFamily}", sans-serif`;
    ctx.fillStyle = box.color;
    ctx.textBaseline = 'middle';

    // Letter spacing support
    if ('letterSpacing' in ctx && box.letterSpacing) {
      (ctx as any).letterSpacing = `${box.letterSpacing}px`;
    }

    // Compute text position based on alignment
    let textX = boxX;
    if (box.textAlign === 'center') {
      textX = boxX + boxWidth / 2;
      ctx.textAlign = 'center';
    } else if (box.textAlign === 'right') {
      textX = boxX + boxWidth;
      ctx.textAlign = 'right';
    } else {
      textX = boxX;
      ctx.textAlign = 'left';
    }

    const textY = boxY + boxHeight / 2;

    ctx.fillText(rawText, textX, textY);
  }

  const dataUrl = canvas.toDataURL('image/png', 0.95);

  const blob = await new Promise<Blob | undefined>((resolve) => {
    canvas.toBlob((b) => resolve(b || undefined), 'image/png', 0.95);
  });

  return {
    dataUrl,
    blob,
    overflowDetected,
    autoFitApplied,
  };
}
