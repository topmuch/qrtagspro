/**
 * QRTagsPro — Génération d'icônes carrés (favicon + PWA)
 *
 * Le logo source (275×75) est trop large pour un favicon carré.
 * On génère donc un icône carré avec un fond bleu + un QR code stylisé
 * en blanc/vert qui représente bien la marque.
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');

const BG_COLOR = '#134288';
const ACCENT = '#32ba5d';

// SVG d'un QR code stylisé (simplifié, 7×7 modules)
function generateQrSvg(size) {
  const cellSize = size / 9;
  const modules = [
    [1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0],
    [1,0,1,1,1,0,1,0,1],
    [1,0,1,1,1,0,1,0,1],
    [1,0,1,1,1,0,1,0,0],
    [1,0,0,0,0,0,1,0,1],
    [1,1,1,1,1,1,1,0,1],
    [0,0,0,0,0,0,0,0,0],
    [1,0,1,0,1,0,1,0,1],
  ];

  let rects = '';
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      if (modules[y][x]) {
        const isFinder = (x < 3 && y < 3) || (x < 3 && y > 5) || (x > 5 && y < 3);
        const fill = isFinder ? ACCENT : '#FFFFFF';
        rects += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="${fill}" rx="${cellSize * 0.1}"/>`;
      }
    }
  }

  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="${BG_COLOR}" rx="${Math.round(size * 0.12)}"/>
    ${rects}
  </svg>`;
}

const SIZES = [
  { name: 'favicon.png', size: 64 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icons/favicon-16x16.png', size: 16 },
  { name: 'icons/icon-72x72.png', size: 72 },
  { name: 'icons/icon-96x96.png', size: 96 },
  { name: 'icons/icon-128x128.png', size: 128 },
  { name: 'icons/icon-144x144.png', size: 144 },
  { name: 'icons/icon-152x152.png', size: 152 },
  { name: 'icons/icon-192x192.png', size: 192 },
  { name: 'icons/icon-384x384.png', size: 384 },
  { name: 'icons/icon-512x512.png', size: 512 },
  { name: 'icons/maskable-icon-512x512.png', size: 512, maskable: true },
];

async function generateIcons() {
  console.log('══════════════════════════════════════════════════');
  console.log('  QRTagsPro — Génération des icônes (QR stylisé)');
  console.log('══════════════════════════════════════════════════');

  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
  }

  for (const { name, size, maskable } of SIZES) {
    const outputPath = path.join(PUBLIC_DIR, name);
    const actualSize = maskable ? Math.round(size * 0.8) : size; // maskable: 80% du canvas
    const offset = maskable ? Math.round(size * 0.1) : 0;

    try {
      const svg = generateQrSvg(actualSize);

      if (maskable) {
        // Pour maskable: créer un canvas plus grand avec padding
        const fullSvg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${size}" height="${size}" fill="${BG_COLOR}"/>
          <g transform="translate(${offset}, ${offset})">
            ${svg.replace(`<svg width="${actualSize}" height="${actualSize}" xmlns="http://www.w3.org/2000/svg">`, '').replace('</svg>', '')}
          </g>
        </svg>`;
        await sharp(Buffer.from(fullSvg)).png().toFile(outputPath);
      } else {
        await sharp(Buffer.from(svg)).png().toFile(outputPath);
      }

      console.log(`  ✅ ${name} (${size}x${size})`);
    } catch (err) {
      console.error(`  ❌ ${name}:`, err.message);
    }
  }

  console.log('══════════════════════════════════════════════════');
  console.log('  ✅ Terminé');
  console.log('══════════════════════════════════════════════════');
}

generateIcons().catch(console.error);
