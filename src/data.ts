import { Template, Recipient, DeliveryConfig } from './types';

export const PRESET_TEMPLATES: Template[] = [
  {
    id: 'tpl_classic',
    name: 'Presidential Classic (Traditional & Prestigious)',
    academyName: 'Horizon Creative & Digital Academy',
    courseName: 'Advanced Full-Stack Engineering Bootcamp',
    signatory1Name: 'Prof. Kenneth Ndubusi',
    signatory1Title: 'Academic Registrar',
    signatory2Name: 'Dr. Eunice Louisiana',
    signatory2Title: 'Academy Director',
    layoutType: 'classic',
    primaryColor: '#0F172A', // Slate 900 / Deep charcoal
    accentColor: '#D4A843',  // Radiant Gold
    customText: 'has successfully attended, participated, and satisfied all professional qualifications and exams prescribed for the program of study in',
    credentialPrefix: 'HCDA',
    issueDate: '04/06/2026',
  },
  {
    id: 'tpl_corporate',
    name: 'Executive Elite (Modern Corporate Branding)',
    academyName: 'Apex Leadership & Business Institute',
    courseName: 'Strategic Business Development & Product Management',
    signatory1Name: 'Chidi Okonkwo',
    signatory1Title: 'Senior Vice President',
    signatory2Name: 'Aisha Balogun',
    signatory2Title: 'Managing Partner',
    layoutType: 'corporate',
    primaryColor: '#1E3A8A', // Strong Classic Blue
    accentColor: '#F59E0B',  // Amber Yellow
    customText: 'has demonstrated professional mastery, strategic acumen, and exceptional leadership competencies in completing the corporate executive track for',
    credentialPrefix: 'ALBI',
    issueDate: '28/05/2026',
  },
  {
    id: 'tpl_modern',
    name: 'Aesthetic Agency (Sleek, Geometric, Minimal)',
    academyName: 'PixelCraft Design Labs',
    courseName: 'UI/UX Design & Creative Direction Masterclass',
    signatory1Name: 'Damian Stone',
    signatory1Title: 'Lead Product Designer',
    signatory2Name: 'Maya Adebayo',
    signatory2Title: 'Chief Creative Officer',
    layoutType: 'modern',
    primaryColor: '#111827', // Clean absolute gray/charcoal
    accentColor: '#D946EF',  // Modern Neon Fuchsia
    customText: 'is hereby awarded this special modern studio credential for creative ingenuity and completed core hours in the advanced coursework of',
    credentialPrefix: 'PCDL',
    issueDate: '15/05/2026',
  },
  {
    id: 'tpl_creative',
    name: 'Artisan Contemporary (Pastels & Abstract Accents)',
    academyName: 'The Coding Initiative Africa',
    courseName: 'Creative Coding & Interactive Media',
    signatory1Name: 'Yusuf Ibrahim',
    signatory1Title: 'Head of Engineering',
    signatory2Name: 'Kemi Sowande',
    signatory2Title: 'Ecosystem Curator',
    layoutType: 'creative',
    primaryColor: '#047857', // Forest Emerald
    accentColor: '#F59E0B',  // Sun Amber
    customText: 'has dynamically built, conceptualized, and successfully published decentralized solutions during the ecosystem-funded program in',
    credentialPrefix: 'TCIA',
    issueDate: '01/06/2026',
  }
];

export const INITIAL_RECIPIENTS: Recipient[] = [
  {
    id: 'HCDA-2026-F9W1',
    name: 'Tobi Emmanuel Adebayo',
    email: 'tobi.adebayo@example.com',
    course: 'Advanced Full-Stack Engineering Bootcamp',
    date: '04/06/2026',
    status: 'pending',
    emailStatus: 'idle',
  },
  {
    id: 'HCDA-2026-M5Q2',
    name: 'Amara Florence Chukwu',
    email: 'amara.chukwu@example.com',
    course: 'Advanced Full-Stack Engineering Bootcamp',
    date: '04/06/2026',
    status: 'pending',
    emailStatus: 'idle',
  },
  {
    id: 'HCDA-2026-A2B8',
    name: 'Zainab Fatima Yusuf',
    email: 'zainab.y@example.com',
    course: 'Advanced Full-Stack Engineering Bootcamp',
    date: '04/06/2026',
    status: 'pending',
    emailStatus: 'idle',
  },
  {
    id: 'HCDA-2026-R8J9',
    name: 'Efe Nelson Ukpere',
    email: 'efe.ukpere@example.com',
    course: 'Advanced Full-Stack Engineering Bootcamp',
    date: '04/06/2026',
    status: 'pending',
    emailStatus: 'idle',
  },
  {
    id: 'HCDA-2026-K1C4',
    name: 'Chioma Grace Obi',
    email: 'chioma.obi@example.com',
    course: 'Advanced Full-Stack Engineering Bootcamp',
    date: '04/06/2026',
    status: 'pending',
    emailStatus: 'idle',
  }
];

export const DEFAULT_DELIVERY_CONFIG: DeliveryConfig = {
  senderName: 'Horizon Academy Registry',
  senderEmail: 'registrar@horizonacademy.edu',
  emailSubject: 'Congratulations! Your Official Certificate of Completion is Ready',
  emailBody: 'Dear {{name}},\n\nCongratulations on successfully completing the course: "{{course}}"!\n\nWe are pleased to inform you that your academic certificate has been automatically generated and is attached to this email as a high-resolution PDF credential.\n\nCertificate ID: {{id}}\nDate of Issue: {{date}}\n\nYou can also verify the authenticity of your digital credential on our Academy Verification Portal at any time by entering your Unique ID.\n\nThank you for choosing Horizon Digital Academy, and we wish you absolute success in your professional career!\n\nBest regards,\nHorizon Creative & Digital Academy Registrar',
  resendApiKey: '',
};
