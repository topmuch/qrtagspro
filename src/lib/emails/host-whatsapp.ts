/**
 * Templates WhatsApp — Module QRTags Host
 * 2 messages automatisés : J-1 (veille check-in) + check-out (merci + avis 5★)
 */

export interface WhatsAppMessage {
  text: string;
  waMeUrl: string;
}

interface MessageContext {
  guestName: string;
  guestPhone: string;
  hostName: string;
  apartmentName: string;
  welcomeUrl: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  reviewUrl?: string;
}

function cleanPhoneForWhatsApp(phone: string): string {
  return phone.replace(/[\s\-().+]/g, '').replace(/^00/, '');
}

export function getCheckInReminderMessage(ctx: MessageContext): WhatsAppMessage {
  const checkInTimeStr = ctx.checkInTime ? ` dès ${ctx.checkInTime}` : '';
  const text = `🏨 *${ctx.apartmentName}* — Bienvenue demain !

Bonjour ${ctx.guestName} 👋

${ctx.hostName} se réjouit de vous accueillir${checkInTimeStr}.

📋 Votre guide digital est prêt ! Retrouvez-y :
• Le code WiFi
• Les instructions d'arrivée (boîte à clés, étage)
• Les règles de la maison
• Les bonnes adresses du quartier

👉 Cliquez ici : ${ctx.welcomeUrl}

À demain ! 🌴

— ${ctx.hostName}`;
  return { text, waMeUrl: `https://wa.me/${cleanPhoneForWhatsApp(ctx.guestPhone)}?text=${encodeURIComponent(text)}` };
}

export function getCheckOutMessage(ctx: MessageContext): WhatsAppMessage {
  const reviewLine = ctx.reviewUrl ? `\n\n⭐ *Laissez un avis 5★*\n${ctx.reviewUrl}` : '';
  const text = `🧳 *${ctx.apartmentName}* — Merci pour votre séjour !

Bonjour ${ctx.guestName} 👋

J'espère que vous avez passé un excellent séjour !

📋 Avant de partir :
• Déposez les clés dans la boîte à clés
• Fermez les fenêtres
• Éteignez la climatisation${ctx.checkOutTime ? `\n• Check-out avant ${ctx.checkOutTime}` : ''}${reviewLine}

Merci et bon voyage ! 🌊

— ${ctx.hostName}`;
  return { text, waMeUrl: `https://wa.me/${cleanPhoneForWhatsApp(ctx.guestPhone)}?text=${encodeURIComponent(text)}` };
}

export function getReviewUrl(apartmentName: string, address?: string | null): string {
  const query = encodeURIComponent(`${apartmentName} ${address || ''}`.trim());
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
