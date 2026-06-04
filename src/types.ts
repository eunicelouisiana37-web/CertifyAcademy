/**
 * Types and interfaces for the Certificate Issuing Platform
 */

export type LayoutType = 'classic' | 'modern' | 'corporate' | 'creative' | 'custom';

export interface Template {
  id: string;
  name: string;
  academyName: string;
  courseName: string;
  signatory1Name: string;
  signatory1Title: string;
  signatory2Name: string;
  signatory2Title: string;
  layoutType: LayoutType;
  primaryColor: string; // Hex color code
  accentColor: string;  // Hex color code
  customText: string;   // Description text on the certificate
  logoUrl?: string;     // Base64 or local URL
  signature1?: string;  // Base64 signature image or text
  signature2?: string;  // Base64 signature image or text
  credentialPrefix: string;
  issueDate: string;
  bgImage?: string;             // Base64 dataURI of uploaded template, or preset template dataURI
  bgType?: 'vector' | 'preset' | 'uploaded';
  textColor?: string;           // Custom text color overlay (e.g. for dark backdrops)
  textYShift?: number;          // Shift all typography vertically to align with preprinted text
  textXShift?: number;          // Shift all typography horizontally
  hideBorders?: boolean;        // Hide dynamic bounding boxes/borders for custom images
  hideSignatures?: boolean;     // Hide drawn signatures if already pre-printed
  titleFont?: string;           // Custom font for the main certificate title
  nameFont?: string;            // Custom font for the student name
  courseFont?: string;          // Custom font for the course title
  titleFontSize?: number;       // Custom font size override for the title
  nameFontSize?: number;        // Custom font size override for student name
  courseFontSize?: number;      // Custom font size override for course name
  metaFontSize?: number;        // Custom font size override for date/verification details
  logoSize?: number;            // Size/scale of the uploaded logo in px
  logoYShift?: number;          // Vertical Y alignment of the logo
  signature1Image?: string;     // Base64 image to overwrite signature text 1
  signature2Image?: string;     // Base64 image to overwrite signature text 2
}

export interface Recipient {
  id: string;          // Certificate Code, e.g. "ACAD-2026-X8Y1"
  name: string;
  email: string;
  course: string;      // Specific course if parsed, otherwise defaults to template course
  date: string;        // Explicit issue date for this recipient, defaults to template date
  status: 'pending' | 'generated' | 'failed';
  emailStatus: 'idle' | 'queued' | 'sending' | 'sent' | 'failed';
  errorMessage?: string;
  pdfBlob?: Blob;      // Dynamic generated cache
}

export interface DeliveryConfig {
  senderName: string;
  senderEmail: string;
  emailSubject: string;
  emailBody: string;
  resendApiKey: string;
}

export interface EmailLog {
  id: string;
  recipientName: string;
  recipientEmail: string;
  status: 'queued' | 'sending' | 'sent' | 'failed';
  timestamp: string;
  message: string;
}
