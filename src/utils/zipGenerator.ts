import JSZip from 'jszip';
import { GeneratedCertificate, CertificateTemplate } from '../types/certificate';
import { createPdfFromDataUrl } from './pdfGenerator';

export async function generateCertificatesZip(
  certificates: GeneratedCertificate[],
  template: CertificateTemplate,
  format: 'pdf' | 'png' = 'pdf',
  onProgress?: (percent: number, current: number, total: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder('Certificates') || zip;
  const total = certificates.length;

  for (let i = 0; i < total; i++) {
    const cert = certificates[i];
    const baseName = cert.fileName.replace(/\.(pdf|png)$/i, '');

    if (format === 'pdf') {
      const { blob } = await createPdfFromDataUrl(cert.previewUrl, template);
      folder.file(`${baseName}.pdf`, blob);
    } else {
      // PNG base64 stripped
      const base64Data = cert.previewUrl.replace(/^data:image\/png;base64,/, '');
      folder.file(`${baseName}.png`, base64Data, { base64: true });
    }

    if (onProgress) {
      onProgress(Math.round(((i + 1) / total) * 100), i + 1, total);
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}

export function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
