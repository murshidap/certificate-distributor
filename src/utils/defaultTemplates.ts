import { CertificateTemplate } from '../types/certificate';

// Helper to convert SVG string to data URL
function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// 1. Glacier Modern Excellence Award (Landscape 1920 x 1080)
const glacierSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8faff"/>
      <stop offset="50%" stop-color="#edf2ff"/>
      <stop offset="100%" stop-color="#e0e8ff"/>
    </linearGradient>
    <linearGradient id="iceBorder" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#006382"/>
      <stop offset="35%" stop-color="#7dd3fc"/>
      <stop offset="70%" stop-color="#006382"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
    <linearGradient id="goldAcc" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="50%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
  </defs>

  <!-- Base background -->
  <rect width="1920" height="1080" fill="url(#bgGrad)"/>

  <!-- Guilloche / Decorative Pattern in corners -->
  <g opacity="0.12" stroke="#006382" fill="none" stroke-width="1.5">
    <circle cx="100" cy="100" r="160"/>
    <circle cx="100" cy="100" r="130"/>
    <circle cx="100" cy="100" r="100"/>
    <circle cx="1820" cy="100" r="160"/>
    <circle cx="1820" cy="100" r="130"/>
    <circle cx="1820" cy="100" r="100"/>
    <circle cx="100" cy="980" r="160"/>
    <circle cx="100" cy="980" r="130"/>
    <circle cx="100" cy="980" r="100"/>
    <circle cx="1820" cy="980" r="160"/>
    <circle cx="1820" cy="980" r="130"/>
    <circle cx="1820" cy="980" r="100"/>
  </g>

  <!-- Double Frame Outer & Inner -->
  <rect x="50" y="50" width="1820" height="980" rx="16" fill="none" stroke="url(#iceBorder)" stroke-width="8"/>
  <rect x="70" y="70" width="1780" height="940" rx="10" fill="none" stroke="#6d778e" stroke-opacity="0.3" stroke-width="2" stroke-dasharray="8 6"/>
  <rect x="85" y="85" width="1750" height="910" rx="8" fill="none" stroke="url(#goldAcc)" stroke-width="1.5"/>

  <!-- Top Emblem / Crest Badge -->
  <g transform="translate(960, 170)">
    <circle cx="0" cy="0" r="44" fill="#006382" opacity="0.08"/>
    <circle cx="0" cy="0" r="36" fill="none" stroke="url(#iceBorder)" stroke-width="3"/>
    <path d="M-15 -6 L0 -22 L15 -6 L0 18 Z" fill="url(#goldAcc)"/>
    <circle cx="0" cy="-2" r="4" fill="#ffffff"/>
  </g>

  <!-- Static Certificate Header Text -->
  <text x="960" y="275" font-family="'Cinzel', serif" font-size="20" font-weight="600" letter-spacing="8" fill="#525b72" text-anchor="middle">CERTIFICATE OF RECOGNITION</text>
  <text x="960" y="325" font-family="'Cinzel', serif" font-size="44" font-weight="700" letter-spacing="4" fill="#006382" text-anchor="middle">EXCELLENCE &amp; ACHIEVEMENT</text>
  <line x1="820" y1="350" x2="1100" y2="350" stroke="url(#goldAcc)" stroke-width="3"/>

  <!-- Static Subtitle line -->
  <text x="960" y="420" font-family="'Inter', sans-serif" font-size="19" font-weight="400" fill="#6d778e" text-anchor="middle">THIS IS PROUDLY PRESENTED TO</text>

  <!-- Static Recognition Statement -->
  <text x="960" y="605" font-family="'Inter', sans-serif" font-size="18" font-weight="400" fill="#525b72" text-anchor="middle">FOR OUTSTANDING PERFORMANCE AND ACTIVE PARTICIPATION IN</text>

  <!-- Signature Lines at bottom -->
  <g transform="translate(420, 890)">
    <line x1="-140" y1="0" x2="140" y2="0" stroke="#a3adc7" stroke-width="1.5"/>
    <text x="0" y="25" font-family="'Inter', sans-serif" font-size="15" font-weight="600" fill="#252f43" text-anchor="middle">Authorized Director</text>
    <text x="0" y="45" font-family="'Inter', sans-serif" font-size="13" fill="#6d778e" text-anchor="middle">Academic Council</text>
    <path d="M-60 -25 C-30 -50 0 -5 40 -35 C60 -15 80 -40 90 -20" stroke="#006382" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </g>

  <!-- Gold Seal Emblem -->
  <g transform="translate(960, 870)">
    <circle cx="0" cy="0" r="50" fill="url(#goldAcc)"/>
    <circle cx="0" cy="0" r="44" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="4 3"/>
    <polygon points="0,-30 8,-12 28,-12 12,2 18,22 0,10 -18,22 -12,2 -28,-12 -8,-12" fill="#ffffff" opacity="0.9"/>
    <!-- Ribbons -->
    <path d="M-20 40 L-35 80 L-10 68 L10 80 L-5 40 Z" fill="#b45309"/>
    <path d="M5 40 L-10 80 L15 68 L35 80 L20 40 Z" fill="#d97706"/>
  </g>

  <!-- Signature 2 -->
  <g transform="translate(1500, 890)">
    <line x1="-140" y1="0" x2="140" y2="0" stroke="#a3adc7" stroke-width="1.5"/>
    <text x="0" y="25" font-family="'Inter', sans-serif" font-size="15" font-weight="600" fill="#252f43" text-anchor="middle">Program Chairperson</text>
    <text x="0" y="45" font-family="'Inter', sans-serif" font-size="13" fill="#6d778e" text-anchor="middle">Global Certification Board</text>
    <path d="M-70 -20 C-40 -40 -10 -10 30 -40 C50 -20 70 -35 80 -15" stroke="#006382" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </g>
</svg>
`;

// 2. Classic Academic Diploma (Landscape 1920 x 1358)
const classicSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1358" width="1920" height="1358">
  <defs>
    <linearGradient id="parchment" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#fdfbf7"/>
    </linearGradient>
    <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d97706"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#92400e"/>
    </linearGradient>
  </defs>

  <rect width="1920" height="1358" fill="url(#parchment)"/>

  <!-- Ornate Border Frame -->
  <rect x="60" y="60" width="1800" height="1238" fill="none" stroke="#1e293b" stroke-width="14"/>
  <rect x="80" y="80" width="1760" height="1198" fill="none" stroke="url(#goldBorder)" stroke-width="4"/>
  <rect x="96" y="96" width="1728" height="1166" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="6 4"/>

  <!-- Header -->
  <text x="960" y="240" font-family="'Cinzel', serif" font-size="28" font-weight="700" letter-spacing="10" fill="#92400e" text-anchor="middle">INSTITUTE OF HIGHER STUDIES</text>
  <text x="960" y="320" font-family="'Playfair Display', serif" font-size="56" font-style="italic" font-weight="700" fill="#0f172a" text-anchor="middle">Certificate of Completion</text>
  <line x1="780" y1="360" x2="1140" y2="360" stroke="#d97706" stroke-width="2"/>

  <text x="960" y="460" font-family="'Plus Jakarta Sans', sans-serif" font-size="22" font-weight="400" fill="#64748b" text-anchor="middle">THIS CREDENTIAL CONFIRMS THAT</text>
  
  <text x="960" y="700" font-family="'Plus Jakarta Sans', sans-serif" font-size="20" font-weight="400" fill="#475569" text-anchor="middle">HAS SUCCESSFULLY MET ALL REQUIREMENTS AND DEMONSTRATED PROFICIENCY IN</text>

  <!-- Seals and Signatures -->
  <g transform="translate(960, 1140)">
    <circle cx="0" cy="0" r="60" fill="url(#goldBorder)"/>
    <circle cx="0" cy="0" r="52" fill="#ffffff" stroke="#d97706" stroke-width="2"/>
    <text x="0" y="-12" font-family="'Cinzel', serif" font-size="13" font-weight="700" fill="#92400e" text-anchor="middle">OFFICIAL</text>
    <text x="0" y="10" font-family="'Cinzel', serif" font-size="16" font-weight="800" fill="#92400e" text-anchor="middle">SEAL</text>
    <text x="0" y="28" font-family="'Cinzel', serif" font-size="11" font-weight="600" fill="#92400e" text-anchor="middle">VERIFIED</text>
  </g>

  <g transform="translate(420, 1150)">
    <line x1="-150" y1="0" x2="150" y2="0" stroke="#64748b" stroke-width="1.5"/>
    <text x="0" y="30" font-family="'Plus Jakarta Sans', sans-serif" font-size="18" font-weight="600" fill="#0f172a" text-anchor="middle">Academic Dean</text>
  </g>
  <g transform="translate(1500, 1150)">
    <line x1="-150" y1="0" x2="150" y2="0" stroke="#64748b" stroke-width="1.5"/>
    <text x="0" y="30" font-family="'Plus Jakarta Sans', sans-serif" font-size="18" font-weight="600" fill="#0f172a" text-anchor="middle">Registrar</text>
  </g>
</svg>
`;

export const DEFAULT_TEMPLATES: CertificateTemplate[] = [
  {
    id: 'tpl-glacier-excellence',
    name: 'Glacier Excellence Award',
    orientation: 'landscape',
    width: 1920,
    height: 1080,
    imageUrl: svgToDataUrl(glacierSvg),
    createdAt: Date.now() - 100000,
    updatedAt: Date.now(),
    textBoxes: [
      {
        id: 'tb-1',
        fieldId: 'name',
        x: 20,
        y: 45,
        width: 60,
        height: 11,
        fontFamily: 'Playfair Display',
        fontSize: 54,
        color: '#006382',
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'center',
        textTransform: 'none',
        letterSpacing: 1,
        lineHeight: 1.2,
        autoFit: true,
        placeholderText: 'Alexandria Montgomery',
      },
      {
        id: 'tb-2',
        fieldId: 'eventname',
        x: 20,
        y: 62.5,
        width: 60,
        height: 8,
        fontFamily: 'Montserrat',
        fontSize: 32,
        color: '#252f43',
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 2,
        lineHeight: 1.2,
        autoFit: true,
        placeholderText: 'Global AI & Innovation Summit 2026',
      },
      {
        id: 'tb-3',
        fieldId: 'rank',
        x: 25,
        y: 71.5,
        width: 50,
        height: 6,
        fontFamily: 'Inter',
        fontSize: 22,
        color: '#b45309',
        fontWeight: '600',
        fontStyle: 'normal',
        textAlign: 'center',
        textTransform: 'none',
        letterSpacing: 1,
        lineHeight: 1.2,
        autoFit: true,
        placeholderText: 'First Place Distinction · Grand Winner',
      },
      {
        id: 'tb-4',
        fieldId: 'certificateid',
        x: 6.5,
        y: 92.5,
        width: 25,
        height: 4.5,
        fontFamily: 'JetBrains Mono',
        fontSize: 16,
        color: '#525b72',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'left',
        textTransform: 'uppercase',
        letterSpacing: 1,
        lineHeight: 1.2,
        autoFit: true,
        placeholderText: 'ID: CERT-2026-001',
      },
      {
        id: 'tb-5',
        fieldId: 'date',
        x: 68.5,
        y: 92.5,
        width: 25,
        height: 4.5,
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#525b72',
        fontWeight: '500',
        fontStyle: 'normal',
        textAlign: 'right',
        textTransform: 'none',
        letterSpacing: 0,
        lineHeight: 1.2,
        autoFit: true,
        placeholderText: 'Date: November 2, 2026',
      },
      {
        id: 'tb-6',
        fieldId: 'institution',
        x: 30,
        y: 77.5,
        width: 40,
        height: 5,
        fontFamily: 'Inter',
        fontSize: 18,
        color: '#525b72',
        fontWeight: 'normal',
        fontStyle: 'italic',
        textAlign: 'center',
        textTransform: 'none',
        letterSpacing: 0,
        lineHeight: 1.2,
        autoFit: true,
        placeholderText: 'Awarded by Institute of Advanced Technology',
      },
    ],
  },
  {
    id: 'tpl-classic-diploma',
    name: 'Classic Academic Diploma',
    orientation: 'landscape',
    width: 1920,
    height: 1358,
    imageUrl: svgToDataUrl(classicSvg),
    createdAt: Date.now() - 200000,
    updatedAt: Date.now(),
    textBoxes: [
      {
        id: 'tb-c1',
        fieldId: 'name',
        x: 18,
        y: 40,
        width: 64,
        height: 10,
        fontFamily: 'Alex Brush',
        fontSize: 70,
        color: '#0f172a',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'center',
        textTransform: 'none',
        letterSpacing: 0,
        lineHeight: 1.2,
        autoFit: true,
        placeholderText: 'Marcus Aurelius Vance',
      },
      {
        id: 'tb-c2',
        fieldId: 'eventname',
        x: 20,
        y: 57,
        width: 60,
        height: 8,
        fontFamily: 'Cinzel',
        fontSize: 34,
        color: '#92400e',
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 3,
        lineHeight: 1.2,
        autoFit: true,
        placeholderText: 'Mastery in Data Engineering & Algorithms',
      },
      {
        id: 'tb-c3',
        fieldId: 'rank',
        x: 25,
        y: 66,
        width: 50,
        height: 6,
        fontFamily: 'Playfair Display',
        fontSize: 24,
        color: '#334155',
        fontWeight: '600',
        fontStyle: 'italic',
        textAlign: 'center',
        textTransform: 'none',
        letterSpacing: 1,
        lineHeight: 1.2,
        autoFit: true,
        placeholderText: 'Graduated with Magna Cum Laude Honors',
      },
      {
        id: 'tb-c4',
        fieldId: 'certificateid',
        x: 7,
        y: 93,
        width: 25,
        height: 4,
        fontFamily: 'JetBrains Mono',
        fontSize: 16,
        color: '#64748b',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'left',
        textTransform: 'none',
        letterSpacing: 1,
        lineHeight: 1.2,
        autoFit: true,
        placeholderText: 'REG NO: 2026-ENG-8491',
      },
      {
        id: 'tb-c5',
        fieldId: 'date',
        x: 68,
        y: 93,
        width: 25,
        height: 4,
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 16,
        color: '#64748b',
        fontWeight: '500',
        fontStyle: 'normal',
        textAlign: 'right',
        textTransform: 'none',
        letterSpacing: 0,
        lineHeight: 1.2,
        autoFit: true,
        placeholderText: 'Issued: November 2, 2026',
      },
    ],
  },
];
