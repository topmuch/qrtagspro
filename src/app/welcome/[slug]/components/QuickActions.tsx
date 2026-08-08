'use client';

// ─── Types ──────────────────────────────────────────────────────────────────

interface QuickActionsProps {
  /** Numéro de téléphone de la réception (format international, ex: +221 77 123 45 67) */
  agencyPhone: string | null;
  lang: string;
}

interface QuickAction {
  id: string;
  label: string;
  labelEn: string;
  icon: string;
  color: string;
  message: string;
  messageEn: string;
}

// ─── Actions rapides (MVP — données statiques) ──────────────────────────────
// À terme, ces actions seront configurables par l'hôtel depuis son dashboard
// (numéro WhatsApp par service, libellés, ordre, activation/désactivation).
const ACTIONS: QuickAction[] = [
  {
    id: 'bar',
    label: 'Bar Piscine',
    labelEn: 'Pool Bar',
    icon: '🍹',
    color: 'bg-blue-600',
    message: "Bonjour, je suis au bord de la piscine. Je voudrais commander : ",
    messageEn: "Hello, I'm by the pool. I'd like to order: ",
  },
  {
    id: 'room-service',
    label: 'Room Service',
    labelEn: 'Room Service',
    icon: '🛎️',
    color: 'bg-orange-600',
    message: "Bonjour, je suis dans ma chambre. Je voudrais commander : ",
    messageEn: "Hello, I'm in my room. I'd like to order: ",
  },
  {
    id: 'spa',
    label: 'Réserver Spa',
    labelEn: 'Book Spa',
    icon: '💆',
    color: 'bg-purple-600',
    message: "Bonjour, je souhaite réserver un soin au spa. Quelles sont les disponibilités ? ",
    messageEn: "Hello, I'd like to book a spa treatment. What are the availabilities? ",
  },
  {
    id: 'taxi',
    label: 'Appeler Taxi',
    labelEn: 'Call Taxi',
    icon: '🚖',
    color: 'bg-green-600',
    message: "Bonjour, j'ai besoin d'un taxi pour [Destination]. ",
    messageEn: "Hello, I need a taxi to [Destination]. ",
  },
];

// ─── Helper : nettoie un numéro de téléphone pour wa.me ─────────────────────
// wa.me attend un numéro au format international SANS +, espaces, tirets, parenthèses.
// Ex: "+221 77 123 45 67" → "221771234567"
function cleanPhoneForWhatsApp(phone: string | null): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[\s\-().+]/g, '');
  // Si le numéro commence par 00, on retire les 00 (format international court)
  return cleaned.replace(/^00/, '');
}

// ─── Composant ──────────────────────────────────────────────────────────────

export default function QuickActions({ agencyPhone, lang }: QuickActionsProps) {
  const whatsappNumber = cleanPhoneForWhatsApp(agencyPhone);
  const isEn = lang === 'en';

  // Si aucun numéro configuré, on affiche un message d'avertissement
  if (!whatsappNumber) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
        <p className="text-yellow-400 text-xs">
          {isEn
            ? '⚠️ No WhatsApp number configured. Please contact reception.'
            : '⚠️ Aucun numéro WhatsApp configuré. Veuillez contacter la réception.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {ACTIONS.map((action) => {
        const label = isEn ? action.labelEn : action.label;
        const message = isEn ? action.messageEn : action.message;
        const href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

        return (
          <a
            key={action.id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${action.color} flex flex-col items-center justify-center p-3 rounded-xl shadow-lg active:scale-95 transition-transform`}
            aria-label={label}
          >
            <span className="text-2xl mb-1">{action.icon}</span>
            <span className="text-[10px] font-bold text-center leading-tight text-white">
              {label}
            </span>
          </a>
        );
      })}
    </div>
  );
}
