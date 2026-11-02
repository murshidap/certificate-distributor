export type TextAlignment = 'left' | 'center' | 'right';
export type FontWeight = 'normal' | '500' | '600' | 'bold' | '800';
export type TextTransform = 'none' | 'uppercase' | 'capitalize' | 'lowercase';

export interface TextBox {
  id: string;
  fieldId: string; // e.g. "name", "certificateid", "rank", "eventname", "date", "institution"
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  width: number; // percentage (0 - 100)
  height: number; // percentage (0 - 100)
  
  // Text formatting
  fontFamily: string;
  fontSize: number; // in pixels at reference resolution
  color: string;
  fontWeight: FontWeight;
  fontStyle: 'normal' | 'italic';
  textAlign: TextAlignment;
  textTransform: TextTransform;
  letterSpacing: number; // px
  lineHeight: number; // multiplier e.g. 1.2
  
  // Additional settings
  autoFit: boolean; // Auto-fit text to prevent overflow
  placeholderText?: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  orientation: 'landscape' | 'portrait';
  width: number; // native px width
  height: number; // native px height
  imageUrl: string; // base64 or SVG data url
  textBoxes: TextBox[];
  createdAt: number;
  updatedAt: number;
}

export interface ParticipantRecord {
  _id: string;
  _selected?: boolean;
  [key: string]: any;
}

export interface ColumnMapping {
  [fieldId: string]: string; // fieldId -> spreadsheet column name
}

export interface GeneratedCertificate {
  participantId: string;
  record: ParticipantRecord;
  fileName: string;
  previewUrl: string; // high-res data URL
  canvasBlob?: Blob;
  overflowDetected: boolean;
  autoFitApplied: boolean;
  emailStatus: 'Pending' | 'Sending' | 'Sent' | 'Failed';
  emailSentAt?: string;
  emailError?: string;
}

export interface EmailConfig {
  senderName: string;
  emailColumn: string;
  subject: string;
  messageBody: string;
}

export type ActiveTab = 'templates' | 'editor' | 'import' | 'preview' | 'email' | 'download';
