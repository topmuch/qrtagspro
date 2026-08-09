'use client';

import { useState, useEffect } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface TransitInfoProps {
  agencyPhone: string | null;
  lang: string;
}

interface Shuttle {
  id: string;
  destination: string;
  destinationEn: string;
  times: string[]; // Prochains départs
  icon: string;
}

interface Service24h {
  id: string;
  icon: string;
  label: string;
  labelEn: string;
  value: string;
  isOpen: boolean;
}

// ─── Navettes (MVP statique — configurables à terme) ────────────────────────
const SHUTTLES: Shuttle[] = [
  {
    id: 'airport',
    destination: 'Aéroport Blaise Diagne',
    destinationEn: 'Blaise Diagne Airport',
    times: ['05:30', '07:00', '09:30', '12:00', '15:00', '18:30', '21:00'],
    icon: '✈️',
  },
  {
    id: 'station',
    destination: 'Gare de Dakar',
    destinationEn: 'Dakar Train Station',
    times: ['06:00', '08:00', '10:30', '13:00', '16:00', '19:00'],
    icon: '🚉',
  },
];

// ─── Services 24h / ouverts tard ────────────────────────────────────────────
const SERVICES_24H: Service24h[] = [
  { id: 'resto', icon: '🍽️', label: 'Restaurant 24h', labelEn: '24h Restaurant', value: 'Lobby · ouvert 24h/24', isOpen: true },
  { id: 'change', icon: '💱', label: 'Bureau de change', labelEn: 'Currency exchange', value: 'Réception · 06h-23h', isOpen: true },
  { id: 'pharma', icon: '💊', label: 'Pharmacie de garde', labelEn: 'On-duty pharmacy', value: 'Pharmacie Diass · 5min en taxi', isOpen: true },
  { id: 'checkout', icon: '🏃', label: 'Check-out express', labelEn: 'Express check-out', value: 'Déposez votre clé, facture par email', isOpen: true },
];

// ─── Helper ─────────────────────────────────────────────────────────────────
function cleanPhoneForWhatsApp(phone: string | null): string | null {
  if (!phone) return null;
  return phone.replace(/[\s\-().+]/g, '').replace(/^00/, '');
}

// ─── Composant ──────────────────────────────────────────────────────────────

export default function TransitInfo({ agencyPhone, lang }: TransitInfoProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const isEn = lang === 'en';
  const whatsappNumber = cleanPhoneForWhatsApp(agencyPhone);

  // Heure côté client (pour calculer les prochains départs)
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // Convertit "HH:MM" en minutes pour comparaison
  const timeToMinutes = (t: string): number => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const currentMinutes = currentTime ? currentTime.getHours() * 60 + currentTime.getMinutes() : null;

  // Calcule les 3 prochains départs d'une navette
  const getNextDepartures = (times: string[]): { time: string; isNext: boolean }[] => {
    if (currentMinutes === null) return times.slice(0, 3).map((time) => ({ time, isNext: false }));
    const upcoming = times.filter((t) => timeToMinutes(t) > currentMinutes);
    const next3 = upcoming.slice(0, 3);
    // Si moins de 3 à venir, on complète avec les premiers du lendemain
    if (next3.length < 3) {
      const tomorrow = times.slice(0, 3 - next3.length);
      return [...next3, ...tomorrow].map((time, idx) => ({ time, isNext: idx === 0 }));
    }
    return next3.map((time, idx) => ({ time, isNext: idx === 0 }));
  };

  const handleCheckoutExpress = () => {
    if (!whatsappNumber) return;
    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Bonjour, je souhaite un check-out express. ")}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="space-y-6">
      {/* ─── Navettes ─── */}
      <section className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800">
        <h2 className="text-xl font-bold text-[#E3B23C] mb-4 flex items-center gap-2">
          🚌 {isEn ? 'Shuttle Schedule' : 'Horaires Navettes'}
        </h2>
        <div className="space-y-4">
          {SHUTTLES.map((shuttle) => {
            const departures = getNextDepartures(shuttle.times);
            return (
              <div key={shuttle.id} className="bg-black/50 rounded-xl p-4 border border-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{shuttle.icon}</span>
                  <h3 className="font-bold text-white text-sm">
                    {isEn ? shuttle.destinationEn : shuttle.destination}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {departures.map((dep, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                        dep.isNext
                          ? 'bg-[#E3B23C] text-black animate-pulse'
                          : 'bg-gray-800 text-gray-300'
                      }`}
                    >
                      {dep.time}
                      {dep.isNext && (
                        <span className="block text-[9px] font-medium uppercase tracking-wide">
                          {isEn ? 'Next' : 'Prochain'}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
                {currentMinutes !== null && departures[0]?.isNext && (
                  <p className="text-xs text-gray-500 mt-2">
                    {isEn ? 'Next departure highlighted' : 'Prochain départ mis en évidence'}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Services pratiques ─── */}
      <section className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800">
        <h2 className="text-xl font-bold text-[#E3B23C] mb-4 flex items-center gap-2">
          🛎️ {isEn ? 'Practical Services' : 'Services Pratiques'}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {SERVICES_24H.map((service) => (
            <div
              key={service.id}
              className="p-3 bg-black rounded-xl border border-gray-700"
            >
              <div className="flex items-start justify-between mb-1">
                <span className="text-2xl">{service.icon}</span>
                {service.isOpen && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-500">
                    {isEn ? 'OPEN' : 'OUVERT'}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-white text-sm leading-tight">
                {isEn ? service.labelEn : service.label}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">{service.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Check-out express CTA ─── */}
      <section className="bg-gradient-to-r from-[#E3B23C]/20 to-transparent border border-[#E3B23C]/30 rounded-2xl p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-white mb-1">
              🏃 {isEn ? 'Leaving early?' : 'Départ matinal ?'}
            </h3>
            <p className="text-xs text-gray-400">
              {isEn
                ? 'Express check-out via WhatsApp — drop your key, get your invoice by email.'
                : 'Check-out express via WhatsApp — déposez votre clé, facture par email.'}
            </p>
          </div>
          {whatsappNumber && (
            <button
              type="button"
              onClick={handleCheckoutExpress}
              className="shrink-0 px-4 py-2.5 bg-[#E3B23C] text-black font-bold rounded-lg hover:bg-yellow-500 transition text-sm"
            >
              {isEn ? 'Check-out' : 'Check-out'}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
