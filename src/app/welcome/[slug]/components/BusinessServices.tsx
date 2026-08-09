'use client';

import { useState } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface BusinessServicesProps {
  agencyPhone: string | null;
  lang: string;
}

interface Service {
  id: string;
  icon: string;
  label: string;
  labelEn: string;
  value: string;
  action?: {
    type: 'copy' | 'whatsapp' | 'tel' | 'link';
    payload: string;
  };
}

// ─── Services Business (MVP — données statiques configurables à terme) ───────
// À terme: configurables par l'hôtel via son dashboard (WiFi password, étage
// business center, numéro pressing, etc.)
const SERVICES: Service[] = [
  {
    id: 'wifi',
    icon: '📶',
    label: 'WiFi Business',
    labelEn: 'Business WiFi',
    value: 'QRTags-Business-2026',
    action: { type: 'copy', payload: 'QRTags-Business-2026' },
  },
  {
    id: 'business-center',
    icon: '🖥️',
    label: 'Business Center',
    labelEn: 'Business Center',
    value: 'Étage 3 · 06h - 23h',
  },
  {
    id: 'pressing',
    icon: '👔',
    label: 'Pressing Express',
    labelEn: 'Express Laundry',
    value: 'Collecte avant 9h → retour 18h',
    action: { type: 'whatsapp', payload: "Bonjour, je souhaite déposer du linge au pressing. " },
  },
  {
    id: 'transport',
    icon: '🚖',
    label: 'Transport Aéroport',
    labelEn: 'Airport Transport',
    value: 'Réservation 24h à l\'avance',
    action: { type: 'whatsapp', payload: "Bonjour, je souhaite réserver un transport vers l'aéroport. " },
  },
];

// ─── Restaurants proches (top 5 à 500m — MVP statique) ──────────────────────
const NEARBY_RESTAURANTS = [
  { name: 'Le Khaymandar', type: 'Restaurant gastronomique', distance: '120m', price: '$$$' },
  { name: 'Café de Rome', type: 'Cuisine méditerranéenne', distance: '200m', price: '$$' },
  { name: 'Sushi Time Dakar', type: 'Japonais', distance: '280m', price: '$$' },
  { name: 'Le Point d\'Orgue', type: 'Bar à tapas', distance: '350m', price: '$$' },
  { name: 'Pharmacie 24h Plateau', type: 'Pharmacie de garde', distance: '450m', price: '—' },
];

// ─── Helper : nettoyage numéro WhatsApp ─────────────────────────────────────
function cleanPhoneForWhatsApp(phone: string | null): string | null {
  if (!phone) return null;
  return phone.replace(/[\s\-().+]/g, '').replace(/^00/, '');
}

// ─── Composant ──────────────────────────────────────────────────────────────

export default function BusinessServices({ agencyPhone, lang }: BusinessServicesProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const isEn = lang === 'en';
  const whatsappNumber = cleanPhoneForWhatsApp(agencyPhone);

  const handleAction = (service: Service) => {
    if (!service.action) return;

    if (service.action.type === 'copy') {
      navigator.clipboard?.writeText(service.action.payload).then(() => {
        setCopiedId(service.id);
        setTimeout(() => setCopiedId(null), 2000);
      });
    } else if (service.action.type === 'whatsapp' && whatsappNumber) {
      window.open(
        `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(service.action.payload)}`,
        '_blank',
        'noopener,noreferrer'
      );
    } else if (service.action.type === 'tel') {
      window.location.href = `tel:${service.action.payload}`;
    } else if (service.action.type === 'link') {
      window.open(service.action.payload, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Services prioritaires ─── */}
      <section className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800">
        <h2 className="text-xl font-bold text-[#E3B23C] mb-4 flex items-center gap-2">
          💼 {isEn ? 'Business Services' : 'Services Business'}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {SERVICES.map((service) => {
            const label = isEn ? service.labelEn : service.label;
            const isCopied = copiedId === service.id;

            return (
              <button
                key={service.id}
                type="button"
                onClick={() => handleAction(service)}
                disabled={!service.action || (service.action.type === 'whatsapp' && !whatsappNumber)}
                className="text-left p-3 bg-black rounded-xl border border-gray-700 hover:border-[#E3B23C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-2xl">{service.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-sm leading-tight">{label}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{service.value}</p>
                  </div>
                </div>
                {service.action && (
                  <span className="inline-block mt-1 text-[10px] font-bold text-[#E3B23C]">
                    {service.action.type === 'copy' && (isCopied ? '✓ Copié !' : '📋 Copier')}
                    {service.action.type === 'whatsapp' && '💬 WhatsApp'}
                    {service.action.type === 'tel' && '📞 Appeler'}
                    {service.action.type === 'link' && '🔗 Ouvrir'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── Restaurants proches ─── */}
      <section className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800">
        <h2 className="text-xl font-bold text-[#E3B23C] mb-4 flex items-center gap-2">
          🍽️ {isEn ? 'Nearby (500m)' : 'À proximité (500m)'}
        </h2>
        <div className="space-y-2">
          {NEARBY_RESTAURANTS.map((place, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-black/50 rounded-lg border border-gray-800"
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white text-sm truncate">{place.name}</h4>
                <p className="text-xs text-gray-400">{place.type}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-gray-500">{place.price}</span>
                <span className="text-xs text-[#E3B23C] font-mono">{place.distance}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
