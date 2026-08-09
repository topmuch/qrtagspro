/**
 * Templates d'emails transactionnels — Module Bracelets de Séjour Universel
 * ====================================================================
 *
 * 4 templates pour le workflow de production :
 *   1. Confirmation de commande (création)
 *   2. Production démarrée (QR codes générés pour impression)
 *   3. Expédition (commande envoyée)
 *   4. Livraison (pack reçu, prête pour activation)
 *
 * Charte graphique : Noir (#111111) + Or (#E3B23C) — alignée avec la boutique.
 *
 * Utilise le système sendEmail existant (src/lib/email.ts) qui gère :
 *   - Mode console (dev) / SMTP (prod)
 *   - Logging automatique en DB (EmailLog)
 *   - Configuration via EmailSettings (admin dashboard)
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BraceletOrderEmailData {
  customerName: string;
  orderId: string;
  quantity: number;
  isBranded: boolean;
  totalPrice: number;
  agencyName?: string | null;
  trackingNumber?: string | null;
  activationUrl?: string | null;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const COLORS = {
  bg: '#111111',
  card: '#1a1a1a',
  gold: '#E3B23C',
  black: '#000000',
  white: '#ffffff',
  gray: '#9ca3af',
  grayDark: '#4b5563',
  green: '#10B981',
  blue: '#3B82F6',
  purple: '#8B5CF6',
};

function formatFCFA(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}

function getBrandLabel(isBranded: boolean): string {
  return isBranded ? 'Brandé (avec votre logo)' : 'Standard';
}

// En-tête commun avec logo QRTags + bandeau or
function emailHeader(title: string, accentColor: string = COLORS.gold): string {
  return `
    <div style="background-color: ${accentColor}; padding: 24px 20px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="color: ${COLORS.black}; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">
        ${title}
      </h1>
    </div>
  `;
}

// Pied de page commun
function emailFooter(): string {
  return `
    <div style="background-color: ${COLORS.bg}; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
      <p style="color: ${COLORS.gold}; margin: 0 0 8px 0; font-weight: bold; font-size: 16px;">QRTags Pro</p>
      <p style="color: ${COLORS.gray}; margin: 0; font-size: 12px;">
        Bracelets QR — Votre compagnon de séjour digital
      </p>
      <p style="color: ${COLORS.grayDark}; margin: 8px 0 0 0; font-size: 11px;">
        © ${new Date().getFullYear()} QRTags Pro. Tous droits réservés.
      </p>
    </div>
  `;
}

// ─── 1. Confirmation de commande ────────────────────────────────────────────

export function getOrderConfirmationEmail(data: BraceletOrderEmailData): EmailTemplate {
  const subject = `QRTags Pro — Confirmation de votre commande #${data.orderId.slice(-8).toUpperCase()}`;
  const dashboardUrl = data.activationUrl || 'https://qrtags.pro/agence/bracelets';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: ${COLORS.bg};">
      ${emailHeader('Merci pour votre commande !')}
      <div style="background-color: ${COLORS.card}; padding: 24px; border-left: 1px solid #333; border-right: 1px solid #333;">
        <p style="color: ${COLORS.white}; font-size: 16px;">Bonjour <strong>${data.customerName}</strong>,</p>
        <p style="color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
          Nous avons bien reçu votre commande de bracelets QR de séjour.
          Notre équipe va traiter votre demande dans les plus brefs délais.
        </p>

        <div style="background-color: ${COLORS.bg}; border: 1px solid #333; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h3 style="color: ${COLORS.gold}; margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Récapitulatif</h3>
          <table style="width: 100%; color: ${COLORS.white}; font-size: 14px;">
            <tr>
              <td style="padding: 4px 0; color: ${COLORS.gray};">N° de commande</td>
              <td style="padding: 4px 0; text-align: right; font-family: monospace; font-weight: bold;">#${data.orderId.slice(-8).toUpperCase()}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: ${COLORS.gray};">Pack</td>
              <td style="padding: 4px 0; text-align: right;">${data.quantity} bracelets</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: ${COLORS.gray};">Type</td>
              <td style="padding: 4px 0; text-align: right;">${getBrandLabel(data.isBranded)}</td>
            </tr>
            ${data.agencyName ? `
            <tr>
              <td style="padding: 4px 0; color: ${COLORS.gray};">Hôtel</td>
              <td style="padding: 4px 0; text-align: right;">${data.agencyName}</td>
            </tr>
            ` : ''}
            <tr style="border-top: 1px solid #333;">
              <td style="padding: 12px 0 4px 0; color: ${COLORS.gold}; font-weight: bold;">Total</td>
              <td style="padding: 12px 0 4px 0; text-align: right; color: ${COLORS.gold}; font-weight: bold; font-size: 18px;">${formatFCFA(data.totalPrice)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: ${COLORS.gray};">Statut</td>
              <td style="padding: 4px 0; text-align: right;">
                <span style="background-color: rgba(245, 158, 11, 0.2); color: #f59e0b; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">En attente</span>
              </td>
            </tr>
          </table>
        </div>

        <p style="color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
          Notre équipe va bientôt générer vos QR codes uniques pour l'impression.
          Vous recevrez un email dès que la production commencera.
        </p>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${dashboardUrl}" style="background-color: ${COLORS.gold}; color: ${COLORS.black}; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 14px;">
            Suivre ma commande
          </a>
        </div>
      </div>
      ${emailFooter()}
    </div>
  `;

  const text = `QRTags Pro — Confirmation de commande

Bonjour ${data.customerName},

Nous avons bien reçu votre commande de bracelets QR de séjour.

Récapitulatif :
- N° de commande : #${data.orderId.slice(-8).toUpperCase()}
- Pack : ${data.quantity} bracelets
- Type : ${getBrandLabel(data.isBranded)}
${data.agencyName ? `- Hôtel : ${data.agencyName}\n` : ''}- Total : ${formatFCFA(data.totalPrice)}
- Statut : En attente de validation

Notre équipe va bientôt générer vos QR codes uniques pour l'impression.
Vous recevrez un email dès que la production commencera.

Suivez votre commande : ${dashboardUrl}

© QRTags Pro`;

  return { subject, html, text };
}

// ─── 2. Production démarrée ─────────────────────────────────────────────────

export function getProductionStartedEmail(data: BraceletOrderEmailData): EmailTemplate {
  const subject = `QRTags Pro — Production en cours #${data.orderId.slice(-8).toUpperCase()}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: ${COLORS.bg};">
      <div style="background-color: ${COLORS.blue}; padding: 24px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: ${COLORS.white}; margin: 0; font-size: 22px; font-weight: 900;">
          ⚙️ Production en cours
        </h1>
      </div>
      <div style="background-color: ${COLORS.card}; padding: 24px; border-left: 1px solid #333; border-right: 1px solid #333;">
        <p style="color: ${COLORS.white}; font-size: 16px;">Bonjour <strong>${data.customerName}</strong>,</p>
        <p style="color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
          Bonne nouvelle ! Vos <strong style="color: ${COLORS.gold};">${data.quantity} bracelets QR</strong>
          (Commande #${data.orderId.slice(-8).toUpperCase()}) sont actuellement en cours de production.
        </p>
        <div style="background-color: ${COLORS.bg}; border-left: 3px solid ${COLORS.blue}; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
          <p style="color: ${COLORS.white}; margin: 0; font-size: 14px;">
            ✅ Les QR codes uniques ont été générés<br/>
            ✅ L'impression sur bracelets Tyvek a débuté<br/>
            ✅ ${data.isBranded ? 'Votre logo a été intégré au design' : 'Design QRTags standard appliqué'}
          </p>
        </div>
        <p style="color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
          Nous vous tiendrons informé dès l'expédition de votre commande.
        </p>
      </div>
      ${emailFooter()}
    </div>
  `;

  const text = `QRTags Pro — Production en cours

Bonjour ${data.customerName},

Bonne nouvelle ! Vos ${data.quantity} bracelets QR (Commande #${data.orderId.slice(-8).toUpperCase()}) sont en cours de production.

✅ Les QR codes uniques ont été générés
✅ L'impression sur bracelets Tyvek a débuté
${data.isBranded ? '✅ Votre logo a été intégré au design' : '✅ Design QRTags standard appliqué'}

Nous vous tiendrons informé dès l'expédition.

© QRTags Pro`;

  return { subject, html, text };
}

// ─── 3. Expédition ──────────────────────────────────────────────────────────

export function getShippedEmail(data: BraceletOrderEmailData): EmailTemplate {
  const subject = `QRTags Pro — Votre commande est expédiée #${data.orderId.slice(-8).toUpperCase()}`;
  const trackingLine = data.trackingNumber
    ? `Numéro de suivi : ${data.trackingNumber}\n`
    : '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: ${COLORS.bg};">
      <div style="background-color: ${COLORS.purple}; padding: 24px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: ${COLORS.white}; margin: 0; font-size: 22px; font-weight: 900;">
          📦 Votre commande est en route !
        </h1>
      </div>
      <div style="background-color: ${COLORS.card}; padding: 24px; border-left: 1px solid #333; border-right: 1px solid #333;">
        <p style="color: ${COLORS.white}; font-size: 16px;">Bonjour <strong>${data.customerName}</strong>,</p>
        <p style="color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
          Vos <strong style="color: ${COLORS.gold};">${data.quantity} bracelets QR</strong>
          (Commande #${data.orderId.slice(-8).toUpperCase()}) ont été expédiés.
        </p>
        <div style="background-color: ${COLORS.bg}; border: 1px solid #333; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="color: ${COLORS.gray}; margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Délai estimé</p>
          <p style="color: ${COLORS.white}; margin: 0; font-size: 16px; font-weight: bold;">24h à 48h</p>
          ${data.trackingNumber ? `
            <p style="color: ${COLORS.gray}; margin: 12px 0 4px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Numéro de suivi</p>
            <p style="color: ${COLORS.gold}; margin: 0; font-family: monospace; font-weight: bold;">${data.trackingNumber}</p>
          ` : ''}
        </div>
        <p style="color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
          Préparez-vous à activer vos bracelets dès leur réception via votre dashboard !
        </p>
      </div>
      ${emailFooter()}
    </div>
  `;

  const text = `QRTags Pro — Commande expédiée

Bonjour ${data.customerName},

Vos ${data.quantity} bracelets QR (Commande #${data.orderId.slice(-8).toUpperCase()}) ont été expédiés.

Délai estimé : 24h à 48h
${trackingLine}
Préparez-vous à activer vos bracelets dès leur réception via votre dashboard !

© QRTags Pro`;

  return { subject, html, text };
}

// ─── 4. Livraison (prêt pour activation) ────────────────────────────────────

export function getDeliveredEmail(data: BraceletOrderEmailData): EmailTemplate {
  const subject = `QRTags Pro — Commande livrée, activez vos bracelets ! #${data.orderId.slice(-8).toUpperCase()}`;
  const activationUrl = data.activationUrl || 'https://qrtags.pro/agence/bracelets';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: ${COLORS.bg};">
      <div style="background-color: ${COLORS.green}; padding: 24px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: ${COLORS.white}; margin: 0; font-size: 22px; font-weight: 900;">
          ✅ Commande livrée !
        </h1>
      </div>
      <div style="background-color: ${COLORS.card}; padding: 24px; border-left: 1px solid #333; border-right: 1px solid #333;">
        <p style="color: ${COLORS.white}; font-size: 16px;">Bonjour <strong>${data.customerName}</strong>,</p>
        <p style="color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
          Votre pack de <strong style="color: ${COLORS.gold};">${data.quantity} bracelets QR</strong>
          (Commande #${data.orderId.slice(-8).toUpperCase()}) a été livré. 🎉
        </p>
        <div style="background-color: ${COLORS.bg}; border: 2px solid ${COLORS.gold}; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="color: ${COLORS.gold}; margin: 0 0 8px 0; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
            Prochaine étape
          </p>
          <p style="color: ${COLORS.white}; margin: 0 0 16px 0; font-size: 14px; line-height: 1.6;">
            Activez vos QR codes pour les rendre scannables par vos clients.
            Chaque bracelet donnera accès au compagnon de séjour adapté à votre hôtel.
          </p>
          <a href="${activationUrl}" style="background-color: ${COLORS.gold}; color: ${COLORS.black}; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 14px;">
            🔧 Activer mes bracelets
          </a>
        </div>
        <p style="color: ${COLORS.gray}; font-size: 12px; line-height: 1.6; margin-top: 20px;">
          Une fois activés, distribuez les bracelets à vos clients à l'arrivée.
          Ils pourront scanner le QR code pour accéder aux services, animations
          et conciergerie digitale de votre établissement.
        </p>
      </div>
      ${emailFooter()}
    </div>
  `;

  const text = `QRTags Pro — Commande livrée !

Bonjour ${data.customerName},

Votre pack de ${data.quantity} bracelets QR (Commande #${data.orderId.slice(-8).toUpperCase()}) a été livré. 🎉

Prochaine étape : activez vos QR codes pour les rendre scannables.
Chaque bracelet donnera accès au compagnon de séjour adapté à votre hôtel.

Activez vos bracelets : ${activationUrl}

Une fois activés, distribuez les bracelets à vos clients à l'arrivée.
Ils pourront scanner le QR code pour accéder aux services, animations
et conciergerie digitale de votre établissement.

© QRTags Pro`;

  return { subject, html, text };
}

// ─── Helper : résout l'email destinataire d'une commande ────────────────────

/**
 * Retourne l'email du client pour une commande, ou null si non disponible.
 * On ne dégrade PAS vers une passerelle SMS fictive (le code fourni faisait
 * `order.customerPhone + '@sms-gateway.com'` — c'est une passerelle SMS-to-email
 * qui n'existe pas et qui causerait des bounces SMTP).
 *
 * Si pas d'email : l'email n'est pas envoyé, et l'action logge un avertissement.
 * Le client sera notifié via le dashboard / WhatsApp à la place.
 */
export function getCustomerEmail(order: {
  customerEmail: string | null;
  customerPhone: string;
}): string | null {
  return order.customerEmail?.trim() || null;
}
