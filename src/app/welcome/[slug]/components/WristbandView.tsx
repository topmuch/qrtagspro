'use client';

import { useState, useEffect } from 'react';
import ResortZones from './ResortZones';
import DailySchedule from './DailySchedule';
import QuickActions from './QuickActions';

// ─── Type de l'agence sérialisée (passée du server component) ───────────────
export interface WelcomeAgency {
  id: string;
  name: string;
  phone: string | null;
  contactPhone: string | null;
  logoUrl: string | null;
  address: string | null;
}

interface WristbandViewProps {
  agency: WelcomeAgency;
  lang: string;
}

// ─── Traductions FR/EN (MVP — extensible à ES/AR) ──────────────────────────
const T = {
  fr: {
    morning: 'Bonjour',
    afternoon: 'Bon après-midi',
    evening: 'Bonsoir',
    subtitle: 'Votre Séjour All-Inclusive',
    resort: 'Le Resort',
    animations: 'Animations du Jour',
    help: 'Besoin d\'aide ?',
    reception: 'Réception',
    emergency: 'Urgence / Médecin',
    review: '⭐ Laissez un avis sur votre séjour',
  },
  en: {
    morning: 'Good Morning',
    afternoon: 'Good Afternoon',
    evening: 'Good Evening',
    subtitle: 'Your All-Inclusive Stay',
    resort: 'The Resort',
    animations: 'Today\'s Activities',
    help: 'Need help?',
    reception: 'Reception',
    emergency: 'Emergency / Doctor',
    review: '⭐ Leave a review about your stay',
  },
};

export default function WristbandView({ agency, lang }: WristbandViewProps) {
  const [greeting, setGreeting] = useState(T.fr.morning);
  const [currentHour, setCurrentHour] = useState<number | null>(null);

  const t = lang === 'en' ? T.en : T.fr;

  // Détection de l'heure pour le message d'accueil (côté client uniquement
  // pour éviter l'hydration mismatch — on part d'un état neutre puis on met à jour)
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      setCurrentHour(hour);
      if (hour < 12) setGreeting(t.morning);
      else if (hour < 18) setGreeting(t.afternoon);
      else setGreeting(t.evening);
    };
    updateGreeting();
    const timer = setInterval(updateGreeting, 60_000); // refresh every minute
    return () => clearInterval(timer);
  }, [t.morning, t.afternoon, t.evening]);

  // Téléphone principal : contactPhone (réception) ou fallback phone
  const receptionPhone = agency.contactPhone || agency.phone;

  // Nettoie le numéro pour les liens tel: (supprime espaces, tirets, etc.)
  const cleanPhone = (p: string | null) => (p ? p.replace(/[\s\-().]/g, '') : null);
  const receptionTel = cleanPhone(receptionPhone);

  return (
    <div className="min-h-screen bg-[#111111] text-white pb-28">
      {/* ─── HEADER IMMERSIF ─── */}
      <header className="bg-gradient-to-b from-[#E3B23C] via-[#E3B23C] to-[#111111] pt-8 pb-14 px-6 text-center relative overflow-hidden">
        <div className="relative z-10">
          {agency.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={agency.logoUrl}
              alt={agency.name}
              className="h-14 w-14 object-contain mx-auto mb-4 bg-white p-2 rounded-xl shadow-lg"
            />
          )}
          <p className="text-black font-bold text-lg uppercase tracking-wider mb-1">
            {greeting}
          </p>
          <h1 className="text-3xl font-black text-black mb-2 leading-tight">
            {agency.name}
          </h1>
          <p className="text-black/80 text-sm font-medium">{t.subtitle}</p>
        </div>
        {/* Décor : cercles flous en arrière-plan */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-black/10 blur-2xl" />
      </header>

      {/* ─── CONTENU PRINCIPAL ─── */}
      <main className="px-4 -mt-8 relative z-20 space-y-6">
        {/* Boutons d'action rapide */}
        <QuickActions agencyPhone={receptionPhone} lang={lang} />

        {/* Carte des zones du resort */}
        <section className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800">
          <h2 className="text-xl font-bold text-[#E3B23C] mb-4 flex items-center gap-2">
            🗺️ {t.resort}
          </h2>
          <ResortZones currentHour={currentHour} />
        </section>

        {/* Animations du jour */}
        <section className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800">
          <h2 className="text-xl font-bold text-[#E3B23C] mb-4 flex items-center gap-2">
            🎉 {t.animations}
          </h2>
          <DailySchedule lang={lang} />
        </section>

        {/* Besoin d'aide */}
        <section className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800">
          <h2 className="text-lg font-bold text-white mb-3">{t.help}</h2>
          <div className="grid grid-cols-2 gap-3">
            {receptionTel && (
              <a
                href={`tel:${receptionTel}`}
                className="flex flex-col items-center justify-center p-4 bg-black rounded-xl border border-gray-700 hover:border-[#E3B23C] transition-colors"
              >
                <span className="text-2xl mb-1">🛎️</span>
                <span className="text-xs font-bold text-center">{t.reception}</span>
              </a>
            )}
            {/* Urgence : numéro d'urgence local (configurable via env à terme) */}
            <a
              href="tel:1515"
              className="flex flex-col items-center justify-center p-4 bg-black rounded-xl border border-gray-700 hover:border-red-500 transition-colors"
            >
              <span className="text-2xl mb-1">🚑</span>
              <span className="text-xs font-bold text-center">{t.emergency}</span>
            </a>
          </div>
        </section>
      </main>

      {/* ─── FOOTER STICKY (Avis) ─── */}
      <footer className="fixed bottom-0 left-0 w-full bg-[#1a1a1a] border-t border-gray-800 p-3 z-50">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(agency.name + ' ' + (agency.address || ''))}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-3 bg-[#E3B23C] text-black font-bold text-center rounded-xl hover:bg-yellow-500 transition-colors"
        >
          {t.review}
        </a>
      </footer>
    </div>
  );
}
