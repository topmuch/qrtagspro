/**
 * QRTagsPro — Génération de tous les icônes du site
 * 
 * Génère: favicon, apple-touch-icon, PWA icons (72→512px), maskable icon
 * à partir du logo QRTagsPro (public/logo-qrtagspro.png)
 * 
 * Usage: node scripts/generate-icons.cjs
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const LOGO_PATH = path.join(__dirname, '..', 'public', 'logo-qrtagspro.png');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');

// Couleurs QRTagsPro
const BG_COLOR = '#134288';  // Bleu corporate
const ACCENT = '#32ba5d';    // Vert

// Tailles à générer
const SIZES = [
  { name: 'favicon.png', size: 32, padding: 0.1 },
  { name: 'apple-touch-icon.png', size: 180, padding: 0.15 },
  { name: 'icons/favicon-16x16.png', size: 16, padding: 0.1 },
  { name: 'icons/icon-72x72.png', size: 72, padding: 0.15 },
  { name: 'icons/icon-96x96.png', size: 96, padding: 0.15 },
  { name: 'icons/icon-128x128.png', size: 128, padding: 0.15 },
  { name: 'icons/icon-144x144.png', size: 144, padding: 0.15 },
  { name: 'icons/icon-152x152.png', size: 152, padding: 0.15 },
  { name: 'icons/icon-192x192.png', size: 192, padding: 0.15 },
  { name: 'icons/icon-384x384.png', size: 384, padding: 0.15 },
  { name: 'icons/icon-512x512.png', size: 512, padding: 0.15 },
  { name: 'icons/maskable-icon-512x512.png', size: 512, padding: 0.25 }, // Plus de padding pour maskable
];

async function generateIcons() {
  console.log('══════════════════════════════════════════════════');
  console.log('  QRTagsPro — Génération des icônes');
  console.log('══════════════════════════════════════════════════');

  // Vérifier que le logo existe
  if (!fs.existsSync(LOGO_PATH)) {
    console.error('❌ Logo non trouvé:', LOGO_PATH);
    process.exit(1);
  }

  // Créer le dossier icons s'il n'existe pas
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
  }

  for (const { name, size, padding } of SIZES) {
    const outputPath = path.join(PUBLIC_DIR, name);
    const paddingPx = Math.round(size * padding);
    const logoSize = size - (paddingPx * 2);

    try {
      // Créer un fond carré avec la couleur QRTagsPro
      const background = Buffer.from(
        `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${size}" height="${size}" fill="${BG_COLOR}" rx="${Math.round(size * 0.1)}"/>
        </svg>`
      );

      // Redimensionner le logo
      const resizedLogo = await sharp(LOGO_PATH)
        .resize(logoSize, logoSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toBuffer();

      // Composer: fond + logo centré
      await sharp(background)
        .composite([{
          input: resizedLogo,
          gravity: 'center',
        }])
        .png()
        .toFile(outputPath);

      console.log(`  ✅ ${name} (${size}x${size})`);
    } catch (err) {
      console.error(`  ❌ ${name}:`, err.message);
    }
  }

  // Générer aussi un favicon.ico (32x32 suffit pour la plupart des navigateurs)
  // On utilise directement favicon.png comme favicon

  console.log('══════════════════════════════════════════════════');
  console.log('  ✅ Tous les icônes ont été générés');
  console.log('══════════════════════════════════════════════════');
}

generateIcons().catch(console.error);
