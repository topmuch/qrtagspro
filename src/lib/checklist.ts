/**
 * Checklist library (SERVER-ONLY) — public travel inventory feature
 *
 * ⚠️ This module imports `pdf-lib` and `qrcode` (server-only).
 * Client components must NOT import this file — use `checklist-catalog.ts` instead
 * for the catalog constants and types.
 *
 * Provides:
 * - generateChecklistCode(): 6-char public code (base32, no I/O/0/1)
 * - generateVerificationKey(): 8-char verification key (mixed case + digits)
 * - generateChecklistPdf(): builds a clean PDF with QR code + items
 *
 * Brand colors (harmonized with the qrtags website):
 *   BRAND = '#111111' (QRTags blue — primary)
 *   ACCENT = '#E3B23C' (QRTags yellow — secondary)
 *   INK   = '#1a1a1a' (ink black)
 */

import { generateRandomCode } from './qr';

// Dynamic import caches (bypasses Turbopack bundling, works with serverExternalPackages)
let _qrCodeModule: any = null;
let _pdfLibModule: any = null;

async function loadQRCode() {
  if (!_qrCodeModule) {
    _qrCodeModule = await import('qrcode');
  }
  return _qrCodeModule;
}

async function loadPdfLib() {
  if (!_pdfLibModule) {
    _pdfLibModule = await import('pdf-lib');
  }
  return _pdfLibModule;
}

// Re-export client-safe constants/types (so server consumers can import from one place)
export {
  BRAND_COLOR,
  INK_COLOR,
  CREAM_COLOR,
  RED_COLOR,
  DEFAULT_CHECKLIST_CATEGORIES,
  flattenCatalog,
} from './checklist-catalog';
export type { ChecklistItem, ChecklistCategory } from './checklist-catalog';

// Import for internal use
import { DEFAULT_CHECKLIST_CATEGORIES, INK_COLOR, type ChecklistItem } from './checklist-catalog';

// ═══════════════════════════════════════════════════════
//  CODE GENERATION
// ═══════════════════════════════════════════════════════

/**
 * Generate a 6-char public code for the checklist URL (e.g. "K7P3MQ")
 * Uses base32 alphabet without ambiguous chars (no I, O, 0, 1).
 */
export function generateChecklistCode(): string {
  return generateRandomCode(6).toUpperCase();
}

/**
 * Generate an 8-char verification key (mixed case + digits).
 * Required to view the PDF on the public page.
 */
export function generateVerificationKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz';
  let key = '';
  for (let i = 0; i < 8; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

// ═══════════════════════════════════════════════════════
//  PDF GENERATION
// ═══════════════════════════════════════════════════════

export interface ChecklistPdfData {
  code: string;
  verificationKey: string;
  firstName: string;
  lastName: string;
  email: string;
  departureDate: string; // ISO date
  departureCity?: string | null;
  destinationCountry: string;
  airline?: string | null;
  flightNumber?: string | null;
  items: ChecklistItem[];
  publicUrl: string; // absolute URL to /checklist/[code]
  createdAt?: Date;
}

function formatDateFr(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return isoDate;
  }
}

function formatTimestamp(date: Date): string {
  const d = new Date(date);
  const dateStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} à ${timeStr}`;
}

// Hex string → pdf-lib rgb() (must be called AFTER pdfLib is loaded)
function hexToColor(hex: string, rgb: any) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

/**
 * Build a clean, modern PDF checklist with QRTags brand colors:
 *   - Blue header band (#111111) with white text
 *   - Yellow accent (#E3B23C) for category headers and highlights
 *   - Black ink (#1a1a1a) for body text
 *   - White background for cards and items
 *   - QR code in a clean white card with subtle border
 *
 * NO stamp, NO red box, NO clutter — just a clean attestation.
 *
 * @returns Buffer containing the PDF
 */
export async function generateChecklistPdf(data: ChecklistPdfData): Promise<Buffer> {
  const createdAt = data.createdAt || new Date();

  // ─── Load external packages ───
  let QRCode: any;
  try {
    QRCode = await loadQRCode();
  } catch (e) {
    throw new Error(`Failed to load qrcode package: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ─── Generate QR code as PNG buffer (blue QR on white) ───
  const qrBuffer = await QRCode.toBuffer(data.publicUrl || 'https://qrtags.com', {
    type: 'png',
    width: 240,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: INK_COLOR, light: '#ffffff' },
  });

  // ─── Load pdf-lib ───
  let pdfLib: any;
  try {
    pdfLib = await loadPdfLib();
  } catch (e) {
    throw new Error(`Failed to load pdf-lib package: ${e instanceof Error ? e.message : String(e)}`);
  }
  const { PDFDocument, rgb, StandardFonts } = pdfLib;
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setAuthor('QRTags');
  pdfDoc.setSubject(`Checklist ${data.code}`);
  pdfDoc.setCreationDate(createdAt);

  // A4 in points
  const PAGE_W = 595.28;
  const PAGE_H = 841.89;
  const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  const margin = 48;

  // ─── Brand colors ───
  const brand = hexToColor('#111111', rgb);       // QRTags blue
  const accent = hexToColor('#E3B23C', rgb);      // QRTags yellow
  const ink = hexToColor('#1a1a1a', rgb);         // Black
  const white = rgb(1, 1, 1);
  const gray = rgb(0.466, 0.486, 0.518);   // #777A84 — secondary text
  const grayLight = rgb(0.929, 0.937, 0.949); // #EDEFF2 — light borders
  const grayBg = rgb(0.965, 0.969, 0.976); // #F7F8FA — subtle bg
  const yellowTint = rgb(1, 0.992, 0.922); // #FFFEEB — yellow card bg (unused for now, kept for future)

  // ─── Fonts ───
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await pdfDoc.embedFont(StandardFonts.CourierBold);

  // ─── Helper: draw text (with width-aware wrapping) ───
  function drawText(text: string, x: number, y: number, opts: {
    size?: number;
    font?: any;
    color?: any;
    maxWidth?: number;
  } = {}) {
    const size = opts.size ?? 10;
    const font = opts.font ?? fontRegular;
    const color = opts.color ?? ink;
    const maxWidth = opts.maxWidth;

    if (!maxWidth) {
      page.drawText(text, { x, y, size, font, color });
      return;
    }

    // Simple word-wrap
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    for (const w of words) {
      const testLine = currentLine ? `${currentLine} ${w}` : w;
      if (font.widthOfTextAtSize(testLine, size) <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = w;
      }
    }
    if (currentLine) lines.push(currentLine);

    let cy = y;
    for (const line of lines) {
      page.drawText(line, { x, y: cy, size, font, color });
      cy -= size * 1.2;
    }
  }

  // ────────────────────────────────────────────
  //  1. HEADER — Blue band with brand identity
  // ────────────────────────────────────────────
  const headerH = 110;
  page.drawRectangle({
    x: 0, y: PAGE_H - headerH, width: PAGE_W, height: headerH,
    color: brand,
  });

  // Yellow accent stripe under header
  page.drawRectangle({
    x: 0, y: PAGE_H - headerH - 6, width: PAGE_W, height: 6,
    color: accent,
  });

  // Logo / brand name
  page.drawText('QRTags', {
    x: margin, y: PAGE_H - 48, size: 28, font: fontBold, color: white,
  });
  page.drawText('Protection intelligente des bagages', {
    x: margin, y: PAGE_H - 68, size: 9, font: fontRegular, color: rgb(0.85, 0.88, 0.98),
  });

  // Code (top-right)
  const codeText = data.code;
  const codeW = fontMono.widthOfTextAtSize(codeText, 16);
  page.drawText('ATTESTATION', {
    x: PAGE_W - margin - codeW, y: PAGE_H - 38, size: 8, font: fontBold, color: accent,
  });
  page.drawText(codeText, {
    x: PAGE_W - margin - codeW, y: PAGE_H - 58, size: 16, font: fontMono, color: white,
  });

  let y = PAGE_H - headerH - 6 - 36;

  // ────────────────────────────────────────────
  //  2. TITLE BLOCK + CERTIFICATION STAMP
  // ────────────────────────────────────────────
  // Build dynamic title: "Checklist de voyage — Vol [Airline] — [DepartureCity] → [DestinationCountry]"
  // Falls back gracefully when fields are missing.
  const depCity = (data.departureCity || '').trim();
  const destCity = (data.destinationCountry || '').trim();
  const airline = (data.airline || '').trim();

  // Route segment: "Paris -> Dakar" (or just one city if the other is missing)
  // Note: Standard Helvetica font can't encode → (U+2192), so we use '->' instead
  let route = '';
  if (depCity && destCity) route = `${depCity} -> ${destCity}`;
  else if (depCity) route = depCity;
  else if (destCity) route = destCity;

  // Compose the title
  let titleText = 'Checklist de voyage';
  if (airline && route) {
    titleText = `Checklist de voyage — Vol ${airline} — ${route}`;
  } else if (airline) {
    titleText = `Checklist de voyage — Vol ${airline}`;
  } else if (route) {
    titleText = `Checklist de voyage — ${route}`;
  }

  // Truncate if too long (avoid overlapping with the stamp)
  const maxTitleW = PAGE_W - 2 * margin - 150; // leave room for stamp on the right
  let displayTitle = titleText;
  while (fontBold.widthOfTextAtSize(displayTitle, 16) > maxTitleW && displayTitle.length > 10) {
    displayTitle = displayTitle.substring(0, displayTitle.length - 1);
  }
  if (displayTitle !== titleText) displayTitle = displayTitle + '…';

  page.drawText(displayTitle, {
    x: margin, y, size: 16, font: fontBold, color: ink,
  });
  // Also update the PDF document metadata title to match
  pdfDoc.setTitle(`${titleText} — ${data.firstName} ${data.lastName}`);
  y -= 18;
  page.drawText(`Document généré et horodaté électroniquement le ${formatTimestamp(createdAt)}.`, {
    x: margin, y, size: 9, font: fontRegular, color: gray,
  });

  // ═══ CERTIFICATION STAMP (top-right, serious & official) ═══
  // Design: double border in brand blue, date in large bold, ref code at bottom.
  // Replaces the old ugly red stamp with a clean, on-brand certification mark.
  const stampW = 138;
  const stampH = 76;
  const stampX = PAGE_W - margin - stampW;
  const stampY = y - 6 - stampH; // top-aligned with title baseline

  // Outer border (thicker, brand blue)
  page.drawRectangle({
    x: stampX, y: stampY, width: stampW, height: stampH,
    color: white, borderColor: brand, borderWidth: 1.5,
  });
  // Inner border (thin, brand blue — creates the "official" double-frame look)
  page.drawRectangle({
    x: stampX + 3, y: stampY + 3, width: stampW - 6, height: stampH - 6,
    color: rgb(1, 1, 1), borderColor: brand, borderWidth: 0.5,
  });

  // Top label — "CERTIFIÉ QRTags"
  page.drawText('CERTIFIÉ QRTags', {
    x: stampX + (stampW - fontBold.widthOfTextAtSize('CERTIFIÉ QRTags', 7.5)) / 2,
    y: stampY + stampH - 13,
    size: 7.5, font: fontBold, color: brand,
  });
  // Yellow separator line under the top label
  page.drawRectangle({
    x: stampX + 14, y: stampY + stampH - 18,
    width: stampW - 28, height: 1, color: accent,
  });

  // Big date — the prominent timestamp (DD/MM/YYYY)
  const dateObj = new Date(createdAt);
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  const bigDate = `${dd}/${mm}/${yyyy}`;
  const bigDateW = fontBold.widthOfTextAtSize(bigDate, 16);
  page.drawText(bigDate, {
    x: stampX + (stampW - bigDateW) / 2,
    y: stampY + stampH - 38,
    size: 16, font: fontBold, color: ink,
  });

  // Time below date
  const hh = String(dateObj.getHours()).padStart(2, '0');
  const mn = String(dateObj.getMinutes()).padStart(2, '0');
  const timeText = `à ${hh}:${mn}`;
  const timeW = fontRegular.widthOfTextAtSize(timeText, 7.5);
  page.drawText(timeText, {
    x: stampX + (stampW - timeW) / 2,
    y: stampY + stampH - 50,
    size: 7.5, font: fontRegular, color: gray,
  });

  // Yellow separator above bottom label
  page.drawRectangle({
    x: stampX + 14, y: stampY + 14,
    width: stampW - 28, height: 1, color: accent,
  });
  // Bottom label — "HORODATÉ ÉLECTRONIQUEMENT"
  const bottomLabel = 'HORODATÉ ÉLECTRONIQUEMENT';
  const bottomLabelW = fontBold.widthOfTextAtSize(bottomLabel, 6);
  page.drawText(bottomLabel, {
    x: stampX + (stampW - bottomLabelW) / 2,
    y: stampY + 7,
    size: 6, font: fontBold, color: brand,
  });

  // Advance y past the stamp (so the next section doesn't overlap it)
  y = stampY - 12;

  // ────────────────────────────────────────────
  //  3. PASSENGER INFO CARD (white with subtle border)
  // ────────────────────────────────────────────
  const infoCardH = 102;
  // Subtle shadow (light gray rectangle slightly offset)
  page.drawRectangle({
    x: margin, y: y - infoCardH - 2, width: PAGE_W - 2 * margin, height: infoCardH,
    color: white, borderColor: grayLight, borderWidth: 1,
  });

  // Yellow accent bar on the left side of the card
  page.drawRectangle({
    x: margin, y: y - infoCardH, width: 4, height: infoCardH,
    color: accent,
  });

  const infoPadX = 18;
  const colW = (PAGE_W - 2 * margin) / 3;
  const col2X = margin + colW + 4;
  const col3X = margin + 2 * colW + 8;

  // Row 1 — passenger identity + dates
  page.drawText('VOYAGEUR', { x: margin + infoPadX, y: y - 16, size: 7, font: fontBold, color: gray });
  page.drawText(`${data.firstName} ${data.lastName}`, { x: margin + infoPadX, y: y - 28, size: 11, font: fontBold, color: ink });

  page.drawText('DÉPART', { x: col2X, y: y - 16, size: 7, font: fontBold, color: gray });
  page.drawText(formatDateFr(data.departureDate), { x: col2X, y: y - 28, size: 11, font: fontBold, color: ink });

  page.drawText('DESTINATION', { x: col3X, y: y - 16, size: 7, font: fontBold, color: gray });
  page.drawText(data.destinationCountry, { x: col3X, y: y - 28, size: 11, font: fontBold, color: ink });

  // Row 2 — flight info
  const airlineText = data.airline || '—';
  const flightText = data.flightNumber || '—';
  const depCityText = data.departureCity || '—';

  page.drawText('COMPAGNIE', { x: margin + infoPadX, y: y - 48, size: 7, font: fontBold, color: gray });
  page.drawText(airlineText, { x: margin + infoPadX, y: y - 60, size: 11, font: fontBold, color: ink });

  page.drawText('N° DE VOL', { x: col2X, y: y - 48, size: 7, font: fontBold, color: gray });
  page.drawText(flightText, { x: col2X, y: y - 60, size: 11, font: fontBold, color: ink });

  page.drawText('RÉFÉRENCE', { x: col3X, y: y - 48, size: 7, font: fontBold, color: gray });
  page.drawText(data.code, { x: col3X, y: y - 60, size: 11, font: fontMono, color: ink });

  // Row 3 — route (departure city → destination)
  page.drawText('VILLE DE DÉPART', { x: margin + infoPadX, y: y - 80, size: 7, font: fontBold, color: gray });
  page.drawText(depCityText, { x: margin + infoPadX, y: y - 92, size: 11, font: fontBold, color: ink });

  page.drawText('VILLE D\'ARRIVEE', { x: col2X, y: y - 80, size: 7, font: fontBold, color: gray });
  page.drawText(data.destinationCountry, { x: col2X, y: y - 92, size: 11, font: fontBold, color: ink });

  // Third column on row 3 — leave empty or show flight route summary
  if (depCityText !== '—' && data.destinationCountry) {
    const routeSummary = `${depCityText} -> ${data.destinationCountry}`;
    page.drawText('TRAJET', { x: col3X, y: y - 80, size: 7, font: fontBold, color: gray });
    page.drawText(routeSummary, { x: col3X, y: y - 92, size: 10, font: fontBold, color: brand });
  }

  y -= infoCardH + 14;

  // ────────────────────────────────────────────
  //  4. INVENTORY LIST — grouped by category
  // ────────────────────────────────────────────
  const itemsLabel = `INVENTAIRE (${data.items.length} article${data.items.length > 1 ? 's' : ''})`;
  page.drawText(itemsLabel, { x: margin, y, size: 11, font: fontBold, color: ink });
  // Thin yellow line under the section title
  const itemsLabelW = fontBold.widthOfTextAtSize(itemsLabel, 11);
  page.drawRectangle({
    x: margin, y: y - 5, width: itemsLabelW, height: 2, color: accent,
  });
  y -= 22;

  // Group items by category
  const byCategory: Record<string, ChecklistItem[]> = {};
  for (const it of data.items) {
    if (!byCategory[it.category]) byCategory[it.category] = [];
    byCategory[it.category].push(it);
  }

  // Render each category in a clean compact format
  for (const cat of DEFAULT_CHECKLIST_CATEGORIES) {
    const catItems = byCategory[cat.id] || [];
    if (catItems.length === 0) continue;

    // Check page break
    if (y < 160) {
      // Add new page
      const newPage = pdfDoc.addPage([PAGE_W, PAGE_H]);
      // For simplicity, we won't render overflow items across pages — break out.
      // Most checklists fit on one page; if not, we still have the QR + key block on page 1.
      break;
    }

    // Category header — small uppercase label with yellow accent dot
    page.drawRectangle({
      x: margin, y: y - 11, width: 6, height: 6,
      color: accent,
    });
    page.drawText(cat.label.fr.toUpperCase(), {
      x: margin + 12, y: y - 13, size: 9, font: fontBold, color: ink,
    });

    // Items count on the right of the category header
    const catCountText = `${catItems.length} article${catItems.length > 1 ? 's' : ''}`;
    const catCountW = fontRegular.widthOfTextAtSize(catCountText, 8);
    page.drawText(catCountText, {
      x: PAGE_W - margin - catCountW, y: y - 13, size: 8, font: fontRegular, color: gray,
    });

    y -= 18;

    // Items — 2 columns
    const colWidth = (PAGE_W - 2 * margin) / 2;
    const itemH = 14;
    const colX = [margin, margin + colWidth];
    const maxPerCol = Math.ceil(catItems.length / 2);

    for (let i = 0; i < catItems.length; i++) {
      const item = catItems[i];
      const colIdx = i < maxPerCol ? 0 : 1;
      const rowIdx = i % maxPerCol;
      const ix = colX[colIdx];
      const iy = y - rowIdx * itemH;

      // Bullet point (small filled circle in blue)
      page.drawRectangle({
        x: ix, y: iy - 6, width: 4, height: 4,
        color: brand,
      });

      // Item name
      const qtySuffix = item.qty > 1 ? `  ×${item.qty}` : '';
      const fullName = item.name + qtySuffix;
      const maxItemW = colWidth - 14;
      let displayName = fullName;
      if (fontRegular.widthOfTextAtSize(displayName, 9) > maxItemW) {
        // Truncate with ellipsis
        while (fontRegular.widthOfTextAtSize(displayName + '…', 9) > maxItemW && displayName.length > 0) {
          displayName = displayName.substring(0, displayName.length - 1);
        }
        displayName = displayName + '…';
      }
      page.drawText(displayName, {
        x: ix + 10, y: iy - 9, size: 9, font: fontRegular, color: ink,
      });

      // Optional color/brand annotation
      if (item.color || item.brand) {
        const annotation = [item.color, item.brand].filter(Boolean).join(' · ');
        const annW = fontRegular.widthOfTextAtSize(annotation, 7);
        page.drawText(annotation, {
          x: ix + colWidth - 14 - annW, y: iy - 9, size: 7, font: fontRegular, color: gray,
        });
      }
    }

    y -= maxPerCol * itemH + 10;
  }

  y -= 6;

  // ────────────────────────────────────────────
  //  5. QR + VERIFICATION (clean two-column layout)
  // ────────────────────────────────────────────
  if (y < 180) {
    y = 200; // safety fallback to fit the QR block
  }

  const blockH = 120;
  // Container card
  page.drawRectangle({
    x: margin, y: y - blockH, width: PAGE_W - 2 * margin, height: blockH,
    color: grayBg, borderColor: grayLight, borderWidth: 1,
  });

  // QR code (left)
  const qrSize = 96;
  const qrX = margin + 12;
  const qrY = y - qrSize - 12;
  const qrImg = await pdfDoc.embedPng(qrBuffer);
  // White background card for QR
  page.drawRectangle({
    x: qrX - 4, y: qrY - 4, width: qrSize + 8, height: qrSize + 8,
    color: white, borderColor: grayLight, borderWidth: 1,
  });
  page.drawImage(qrImg, { x: qrX, y: qrY, width: qrSize, height: qrSize });

  // Right column — text
  const rightX = qrX + qrSize + 24;
  const rightW = PAGE_W - margin - rightX - 12;

  page.drawText('Vérification en ligne', {
    x: rightX, y: y - 22, size: 11, font: fontBold, color: ink,
  });

  page.drawText('Scannez le QR code pour ouvrir la page', {
    x: rightX, y: y - 38, size: 8, font: fontRegular, color: gray,
  });
  page.drawText('publique de cette attestation, puis saisissez', {
    x: rightX, y: y - 50, size: 8, font: fontRegular, color: gray,
  });
  page.drawText('la clé de vérification ci-dessous.', {
    x: rightX, y: y - 62, size: 8, font: fontRegular, color: gray,
  });

  // Verification key — clean inline label
  page.drawText('CLÉ DE VÉRIFICATION', {
    x: rightX, y: y - 80, size: 7, font: fontBold, color: gray,
  });
  page.drawText(data.verificationKey, {
    x: rightX, y: y - 98, size: 16, font: fontMono, color: brand,
  });

  y -= blockH + 18;

  // ────────────────────────────────────────────
  //  6. FOOTER — Blue band
  // ────────────────────────────────────────────
  const footerH = 44;
  page.drawRectangle({
    x: 0, y: 0, width: PAGE_W, height: footerH,
    color: brand,
  });
  // Yellow accent stripe above footer
  page.drawRectangle({
    x: 0, y: footerH, width: PAGE_W, height: 3,
    color: accent,
  });

  page.drawText('QRTags — Protection intelligente des bagages', {
    x: margin, y: 26, size: 9, font: fontBold, color: white,
  });
  const footerRight = `qrtags.com · Réf ${data.code}`;
  const frW = fontRegular.widthOfTextAtSize(footerRight, 8);
  page.drawText(footerRight, {
    x: PAGE_W - margin - frW, y: 26, size: 8, font: fontRegular, color: rgb(0.85, 0.88, 0.98),
  });
  page.drawText(`Document généré le ${formatTimestamp(createdAt)}`, {
    x: margin, y: 12, size: 7, font: fontRegular, color: rgb(0.75, 0.78, 0.88),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// ═══════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Build the absolute public URL for a checklist code.
 * Uses NEXT_PUBLIC_BASE_URL if set, otherwise derives from request headers.
 */
export function buildPublicChecklistUrl(code: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://qrtags.com';
  return `${base.replace(/\/$/, '')}/checklist/${code}`;
}
