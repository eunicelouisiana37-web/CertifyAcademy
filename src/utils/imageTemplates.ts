/**
 * Pre-defined professional certificate background templates represented as clean, crisp SVG data URIs.
 * This guarantees sharp rendering at all screen sizes and prevents external URL dependency crashes.
 */

export interface PresetBackground {
  id: string;
  name: string;
  description: string;
  dataUri: string;
  defaultPrimary: string;
  defaultAccent: string;
  textColor: string;
  layoutName: string;
}

const ROYAL_GOLD_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="1414" viewBox="0 0 2000 1414">
  <!-- Soft ivory rich background -->
  <rect width="2000" height="1414" fill="#FDFBF7" />
  
  <!-- Double thin and thick outer borders -->
  <rect x="25" y="25" width="1950" height="1364" fill="none" stroke="#1A3C6E" stroke-width="8" rx="8" />
  <rect x="40" y="40" width="1920" height="1334" fill="none" stroke="#D4A843" stroke-width="3" rx="6" />
  <rect x="50" y="50" width="1900" height="1294" fill="none" stroke="#D4A843" stroke-width="1" rx="4" stroke-dasharray="8, 4" />
  
  <!-- Classic Gold Corner Ornaments -->
  <!-- Top Left -->
  <path d="M 40,140 L 140,40 M 40,180 L 180,40 M 40,100 L 100,40" stroke="#D4A843" stroke-width="3" fill="none" />
  <rect x="65" y="65" width="30" height="30" fill="none" stroke="#D4A843" stroke-width="2" />
  <circle cx="80" cy="80" r="4" fill="#D4A843" />
  
  <!-- Top Right -->
  <path d="M 1960,140 L 1860,40 M 1960,180 L 1820,40 M 1960,100 L 1900,40" stroke="#D4A843" stroke-width="3" fill="none" />
  <rect x="1905" y="65" width="30" height="30" fill="none" stroke="#D4A843" stroke-width="2" />
  <circle cx="1920" cy="80" r="4" fill="#D4A843" />
  
  <!-- Bottom Left -->
  <path d="M 40,1274 L 140,1374 M 40,1234 L 180,1374 M 40,1314 L 100,1374" stroke="#D4A843" stroke-width="3" fill="none" />
  <rect x="65" y="1319" width="30" height="30" fill="none" stroke="#D4A843" stroke-width="2" />
  <circle cx="80" cy="1334" r="4" fill="#D4A843" />
  
  <!-- Bottom Right -->
  <path d="M 1960,1274 L 1860,1374 M 1960,1234 L 1820,1374 M 1960,1314 L 1900,1374" stroke="#D4A843" stroke-width="3" fill="none" />
  <rect x="1905" y="1319" width="30" height="30" fill="none" stroke="#D4A843" stroke-width="2" />
  <circle cx="1920" cy="1334" r="4" fill="#D4A843" />
  
  <!-- Elegant watermark concentric circles/seal in center background -->
  <circle cx="1000" cy="707" r="320" fill="none" stroke="#D4A843" stroke-width="1.5" stroke-dasharray="24, 12" opacity="0.08" />
  <circle cx="1000" cy="707" r="280" fill="none" stroke="#1A3C6E" stroke-width="1" opacity="0.06" />
  <path d="M 980,480 L 1020,480 M 980,934 L 1020,934" stroke="#D4A843" stroke-width="2" opacity="0.2" />
</svg>
`;

const ELITE_MIDNIGHT_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="1414" viewBox="0 0 2000 1414">
  <!-- Solid Premium Slate Theme -->
  <rect width="2000" height="1414" fill="#0F172A" />
  
  <!-- Left Side Geometric Solid Shapes -->
  <path d="M 0,0 L 250,0 L 0,800 Z" fill="#1E293B" />
  <path d="M 0,0 L 230,0 L 0,730 Z" fill="#D4A843" opacity="0.1" />
  
  <!-- Bottom-Right gold corner triangle -->
  <path d="M 2000,1414 L 1750,1414 L 2000,614 Z" fill="#1E293B" stroke="#D4A843" stroke-width="1" />
  <path d="M 2000,1414 L 1770,1414 L 2000,634 Z" fill="#111827" />
  
  <!-- Sophisticated grid patterns on corners -->
  <g stroke="#334155" stroke-width="1.5" opacity="0.4">
    <line x1="50" y1="200" x2="250" y2="200" />
    <line x1="50" y1="250" x2="250" y2="250" />
    <line x1="50" y1="300" x2="250" y2="300" stroke="#D4A843" opacity="0.3" />
    <line x1="100" y1="150" x2="100" y2="350" />
    <line x1="150" y1="150" x2="150" y2="350" />
    <line x1="200" y1="150" x2="200" y2="350" />
  </g>
  
  <!-- Dual inner framing lines -->
  <rect x="50" y="50" width="1900" height="1314" fill="none" stroke="#1E293B" stroke-width="2" rx="4" />
  <rect x="70" y="70" width="1860" height="1274" fill="none" stroke="#D4A843" stroke-width="2" rx="2" opacity="0.8" />
  
  <!-- Tech stars/nodes watermarks -->
  <g fill="#D4A843" opacity="0.15">
    <circle cx="1000" cy="707" r="4" />
    <circle cx="1000" cy="557" r="2" />
    <circle cx="1000" cy="857" r="2" />
    <circle cx="850" cy="707" r="2" />
    <circle cx="1150" cy="707" r="2" />
    <path d="M 1000,657 L 1000,757 M 950,707 L 1050,707" stroke="#D4A843" stroke-width="0.5" />
    <circle cx="1000" cy="707" r="40" fill="none" stroke="#D4A843" stroke-width="1" stroke-dasharray="5,5" />
  </g>
</svg>
`;

const MODERN_CYAN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="1414" viewBox="0 0 2000 1414">
  <!-- Minimal clinical white -->
  <rect width="2000" height="1414" fill="#FAFAFA" />
  
  <!-- Subtle pattern dots across the body -->
  <pattern id="minimalDots" width="40" height="40" patternUnits="userSpaceOnUse">
    <circle cx="20" cy="20" r="1.5" fill="#E2E8F0" />
  </pattern>
  <rect width="2000" height="1414" fill="url(#minimalDots)" />
  
  <!-- Tech-themed gradient corners -->
  <path d="M 0,0 L 550,0 C 400,220 220,400 0,550 Z" fill="#0891B2" opacity="0.08" />
  <path d="M 2000,0 L 1450,0 C 1600,220 1780,400 2000,550 Z" fill="#4F46E5" opacity="0.06" />
  <path d="M 2000,1414 L 1450,1414 C 1600,1194 1780,1014 2000,864 Z" fill="#0891B2" opacity="0.05" />
  <path d="M 0,1414 L 550,1414 C 400,1194 220,1014 0,864 Z" fill="#4F46E5" opacity="0.07" />
  
  <!-- High contrast framing -->
  <rect x="45" y="45" width="1910" height="1324" fill="none" stroke="#E2E8F0" stroke-width="3" rx="16" />
  <rect x="60" y="60" width="1880" height="1294" fill="none" stroke="#0891B2" stroke-width="1.5" rx="12" stroke-dasharray="16, 8" opacity="0.5" />
  
  <!-- Geometric corner accent blocks -->
  <rect x="35" y="35" width="50" height="8" fill="#0891B2" />
  <rect x="35" y="35" width="8" height="50" fill="#0891B2" />
  
  <rect x="1915" y="35" width="50" height="8" fill="#0891B2" />
  <rect x="1957" y="35" width="8" height="50" fill="#0891B2" />
  
  <rect x="35" y="1371" width="50" height="8" fill="#0891B2" />
  <rect x="35" y="1329" width="8" height="50" fill="#0891B2" />
  
  <rect x="1915" y="1371" width="50" height="8" fill="#0891B2" />
  <rect x="1957" y="1329" width="8" height="50" fill="#0891B2" />
</svg>
`;

const CREATIVE_CORAL_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="1414" viewBox="0 0 2000 1414">
  <!-- Minimal elegant warm background -->
  <rect width="2000" height="1414" fill="#FAF9F6" />
  
  <!-- Floating abstract paint circles -->
  <g filter="blur(40px)" opacity="0.15">
    <circle cx="200" cy="200" r="300" fill="#F43F5E" />
    <circle cx="1800" cy="1200" r="350" fill="#EC4899" />
    <circle cx="1700" cy="200" r="250" fill="#3B82F6" />
    <circle cx="300" cy="1100" r="280" fill="#10B981" />
  </g>
  
  <!-- Sleek contemporary dual outline border -->
  <rect x="55" y="55" width="1890" height="1304" fill="none" stroke="#F43F5E" stroke-width="2.5" rx="24" />
  <rect x="75" y="75" width="1850" height="1264" fill="none" stroke="#1E293B" stroke-width="1" rx="20" stroke-dasharray="10, 10" opacity="0.4" />
  
  <!-- Modern aesthetic gold floral branch stamp bottom left -->
  <g stroke="#EC4899" stroke-width="1.5" fill="none" opacity="0.25">
    <path d="M 70,1200 A 300,300 0 0,1 300,1340" />
    <circle cx="150" cy="1235" r="5" />
    <circle cx="210" cy="1275" r="5" />
    <circle cx="260" cy="1310" r="5" />
  </g>
</svg>
`;

export const PRESET_BACKGROUND_TEMPLATES: PresetBackground[] = [
  {
    id: 'bg_royal_gold',
    name: 'Imperial Royal Gold',
    description: 'An outstanding traditional layout featuring golden double ornaments, ivory background, and elegant navy highlights. Superior choice for diplomas, executive degrees, and formal graduations.',
    dataUri: `data:image/svg+xml;utf8,${encodeURIComponent(ROYAL_GOLD_SVG.trim())}`,
    defaultPrimary: '#1A3C6E',
    defaultAccent: '#D4A843',
    textColor: '#1E293B',
    layoutName: 'Royal Ornate'
  },
  {
    id: 'bg_elite_midnight',
    name: 'Executive Elite Midnight',
    description: 'A striking dark-theme canvas with slate background, strong geometric gold accent blocks, and modern technical matrix markers. Designed for cutting-edge coding programs or technical awards.',
    dataUri: `data:image/svg+xml;utf8,${encodeURIComponent(ELITE_MIDNIGHT_SVG.trim())}`,
    defaultPrimary: '#F8FAFC',
    defaultAccent: '#D4A843',
    textColor: '#F1F5F9',
    layoutName: 'Midnight Dark'
  },
  {
    id: 'bg_modern_cyan',
    name: 'Creative Tech Cyan',
    description: 'A clean, sleek modern template leveraging neon gradient overlays, modern dot matrix grids, and dashes of high-contrast cyber blue. Exceptional for startup workshops and web programs.',
    dataUri: `data:image/svg+xml;utf8,${encodeURIComponent(MODERN_CYAN_SVG.trim())}`,
    defaultPrimary: '#0891B2',
    defaultAccent: '#4F46E5',
    textColor: '#0F172A',
    layoutName: 'Cyber Minimal'
  },
  {
    id: 'bg_creative_coral',
    name: 'Artisan Pastel Bloom',
    description: 'Earthy, organic design with floating soft blobs, contemporary outlines, and subtle artistic flair. Beautiful backdrop for design bootcamps, curation, copy and poetry workshops.',
    dataUri: `data:image/svg+xml;utf8,${encodeURIComponent(CREATIVE_CORAL_SVG.trim())}`,
    defaultPrimary: '#F43F5E',
    defaultAccent: '#1E293B',
    textColor: '#1E293B',
    layoutName: 'Artistic Fluid'
  }
];
