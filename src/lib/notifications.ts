/**
 * QRTags — Politique de notification CENTRALISÉE
 *
 * ════════════════════════════════════════════════════════════════
 * RÈGLE STRICTE (QRTags v1) :
 * ════════════════════════════════════════════════════════════════
 *   ❌ Email        — INTERDIT (nodemailer désactivé)
 *   ❌ SMS          — INTERDIT (pas de provider)
 *   ❌ Wakit / WhatsApp Business API — INTERDIT (payant)
 *
 *   ✅ SEUL WhatsApp WAME (Click-to-Chat) est autorisé :
 *      https://wa.me/[number]?text=[url_encoded_message]
 * ════════════════════════════════════════════════════════════════
 *
 * Ce module :
 *   1. Expose `buildWameUrl()` — la SEULE fonction de contact autorisée
 *   2. Expose `notifyOwner()` — stub no-op pour les anciens appels
 *      (route API scan/notify, loss-alerts, etc. qui importaient email/wakit)
 *
 * Les modules `src/lib/email.ts` et `src/lib/wakit.ts` sont conservés
 * (leurs imports sont trop répandus pour être supprimés proprement),
 * mais leur comportement est neutralisé via ce module :
 *   - `email.ts` continue de logger en console (provider = "console")
 *   - `wakit.ts` retourne toujours `{ fallback: true }` (clé API absente)
 */

export interface WameMessageParams {
  ownerPhone: string;        // numéro WhatsApp du propriétaire (format international, chiffres uniquement)
  ownerName?: string;        // prénom du propriétaire (pour personnaliser le message)
  objectReference: string;   // référence du tag (ex: QRT26-XXXXXX)
  objectType?: string;       // "objet" générique, ou description courte
  finderName?: string;       // nom du trouveur
  finderPhone?: string;      // téléphone du trouveur
  gps?: { lat: number; lng: number } | null;  // géoloc du trouveur
  manualLocation?: string;   // lieu saisi manuellement si GPS refusé
}

/**
 * Construit l'URL WhatsApp WAME pré-remplie selon le format QRTags.
 *
 * Format du message (strictement conforme au brief) :
 *   "Bonjour [Prénom], j'ai trouvé votre [Objet] (réf. [REF]).
 *    Je suis actuellement à cette position : [Lien Google Maps lat/long].
 *    — Message envoyé via QRTags. Trouveur : [Name]. Contact : [Phone]."
 */
export function buildWameUrl(params: WameMessageParams): string {
  const {
    ownerPhone,
    ownerName,
    objectReference,
    objectType = 'objet',
    finderName,
    finderPhone,
    gps,
    manualLocation,
  } = params;

  // Lien Google Maps prioritaire (GPS), sinon texte manuel, sinon fallback.
  let locationLine: string;
  if (gps) {
    locationLine = `https://www.google.com/maps?q=${gps.lat},${gps.lng}`;
  } else if (manualLocation && manualLocation.trim()) {
    locationLine = manualLocation.trim();
  } else {
    locationLine = 'Position non partagée';
  }

  const firstName = ownerName ? ownerName.split(' ')[0] : '';

  const parts: string[] = [];
  parts.push(`Bonjour${firstName ? ` ${firstName}` : ''}, j'ai trouvé votre ${objectType} (réf. ${objectReference}).`);
  parts.push(`Je suis actuellement à cette position : ${locationLine}.`);
  parts.push('— Message envoyé via QRTags.');
  if (finderName && finderName.trim()) parts.push(`Trouveur : ${finderName.trim()}.`);
  if (finderPhone && finderPhone.trim()) parts.push(`Contact : ${finderPhone.trim()}.`);

  const message = parts.join(' ');
  const cleanPhone = (ownerPhone || '').replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Stub no-op — remplace les anciens appels à `sendEmail` / `sendWakitMessage`.
 *
 * QRTags n'envoie JAMAIS de notification proactive au propriétaire.
 * C'est le TROUVEUR qui initie le contact via WAME (buildWameUrl ci-dessus).
 *
 * On log seulement l'événement pour audit (SystemLog), sans rien envoyer.
 */
export async function notifyOwner(opts: {
  type: 'scan_alert' | 'loss_alert' | 'found_alert' | 'connection_alert';
  baggageId?: string;
  reference?: string;
  message: string;
}): Promise<{ skipped: true; reason: 'wame_only_policy' }> {
  // Log discret — ne lève jamais d'erreur.
  try {
    console.log(
      `[QRTags/notifyOwner] SKIPPED (${opts.type}) — wame_only_policy. ` +
      `ref=${opts.reference || '-'} msg="${opts.message.slice(0, 80)}..."`,
    );
  } catch {
    // silent
  }
  return { skipped: true, reason: 'wame_only_policy' };
}

/**
 * Wrapper pour signaler que les notifications email/SMS/Wakit sont désactivées.
 * Utilisé par les routes API qui essayent encore d'appeler ces fonctions.
 */
export const NOTIFICATIONS_DISABLED = {
  email: true,
  sms: true,
  wakit: true,
  wame: false, // ← seul canal autorisé
} as const;
