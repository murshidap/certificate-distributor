import { jsPDF } from 'jspdf';
import { CertificateTemplate } from '../types/certificate';

export async function createPdfFromDataUrl(
  dataUrl: string,
  template: CertificateTemplate
): Promise<{ doc: jsPDF; blob: Blob }> {
  const isLandscape = template.orientation === 'landscape';
  
  // Standard A4 dimensions in mm: 297 x 210
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: isLandscape ? [297, 210] : [210, 297],
    compress: true,
  });

  const pageWidth = isLandscape ? 297 : 210;
  const pageHeight = isLandscape ? 210 : 297;

  doc.addImage(dataUrl, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');

  const blob = doc.output('blob');
  return { doc, blob };
}

export async function downloadCertificatePdf(
  dataUrl: string,
  template: CertificateTemplate,
  fileName: string
): Promise<void> {
  const { doc } = await createPdfFromDataUrl(dataUrl, template);
  const cleanName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  doc.save(cleanName);
}

export function downloadCertificatePng(dataUrl: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
