'use client';

import { useState, useEffect } from 'react';
import ResortZones from './ResortZones';
import DailySchedule from './DailySchedule';
import QuickActions from './QuickActions';
import BusinessServices from './BusinessServices';
import TransitInfo from './TransitInfo';
import LocalRecommendations from './LocalRecommendations';
import NearbyAttractions from './NearbyAttractions';
import HostView, { type HouseGuideData } from './HostView';
import { getProfileMeta, type BraceletProfile } from '@/lib/bracelet-profiles';

// ─── Type de l'agence sérialisée (passée du server component) ───────────────
export interface WelcomeAgency {
  id: string;
  name: string;
  slug: string; // requis pour NearbyAttractions (API /api/pois filtre par slug)
  phone: string | null;
  contactPhone: string | null;
  logoUrl: string | null;
  address: string | null;
  braceletProfile: string | null; // BUSINESS | TRANSIT | RESORT | BOUTIQUE | HOST | STANDARD
  latitude: number | null;
  longitude: number | null;
  houseGuide: HouseGuideData | null; // Guide maison (profil HOST uniquement)
}

interface WristbandViewProps {
  agency: WelcomeAgency;
  lang: string;
}

// ─── Traductions FR/EN ──────────────────────────────────────────────────────
const T = {
  fr: {
    morning: 'Bonjour',
    afternoon: 'Bon après-midi',
    evening: 'Bonsoir',
    subtitle: 'Votre compagnon de séjour',
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
    subtitle: 'Your stay companion',
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
  const profile = (agency.braceletProfile || 'STANDARD') as BraceletProfile;
  const profileMeta = getProfileMeta(profile);

  // Détection de l'heure pour le message d'accueil (côté client uniquement
  // pour éviter l'hydration mismatch)
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      setCurrentHour(hour);
      if (hour < 12) setGreeting(t.morning);
      else if (hour < 18) setGreeting(t.afternoon);
      else setGreeting(t.evening);
    };
    updateGreeting();
    const timer = setInterval(updateGreeting, 60_000);
    return () => clearInterval(timer);
  }, [t.morning, t.afternoon, t.evening]);

  const receptionPhone = agency.contactPhone || agency.phone;
  const cleanPhone = (p: string | null) => (p ? p.replace(/[\s\-().]/g, '') : null);
  const receptionTel = cleanPhone(receptionPhone);

  // ─── Rendu conditionnel selon le braceletProfile ───
  // Un seul produit, 4 expériences personnalisées selon le type d'hôtel.
  const renderProfileContent = () => {
    switch (profile) {
      case 'BUSINESS':
        return <BusinessServices agencyPhone={receptionPhone} lang={lang} />;

      case 'TRANSIT':
        return <TransitInfo agencyPhone={receptionPhone} lang={lang} />;

      case 'RESORT':
        return (
          <>
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
          </>
        );

      case 'BOUTIQUE':
        return <LocalRecommendations agencyName={agency.name} lang={lang} />;

      case 'HOST':
        if (agency.houseGuide) {
          return <HostView guide={agency.houseGuide} agencyName={agency.name} agencyAddress={agency.address} lang={lang} />;
        }
        return (
          <section className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800">
            <h2 className="text-xl font-bold text-[#E3B23C] mb-3">🏠 {lang === 'en' ? 'Home Guide' : 'Guide de la maison'}</h2>
            <p className="text-sm text-gray-400">{lang === 'en' ? 'Your host has not yet configured the home guide.' : 'Votre hôte n\'a pas encore configuré le guide de la maison.'}</p>
          </section>
        );

      case 'STANDARD':
      default:
        // Contenu générique : services essentiels + attractions à proximité
        return (
          <section className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800">
            <h2 className="text-xl font-bold text-[#E3B23C] mb-4 flex items-center gap-2">
              🏨 {lang === 'en' ? 'Hotel Services' : 'Services de l\'hôtel'}
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              {lang === 'en'
                ? 'Your hotel has not yet configured a specialized profile. Essential services are shown below. Ask reception to activate a personalized experience.'
                : 'Votre hôtel n\'a pas encore configuré de profil spécialisé. Les services essentiels sont affichés ci-dessous. Demandez à la réception d\'activer une expérience personnalisée.'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-black rounded-xl border border-gray-700">
                <span className="text-2xl mb-1 block">🛎️</span>
                <span className="text-xs font-bold">{t.reception}</span>
              </div>
              <div className="p-4 bg-black rounded-xl border border-gray-700">
                <span className="text-2xl mb-1 block">🚑</span>
                <span className="text-xs font-bold">{t.emergency}</span>
              </div>
              <div className="p-4 bg-black rounded-xl border border-gray-700">
                <span className="text-2xl mb-1 block">🗺️</span>
                <span className="text-xs font-bold">{lang === 'en' ? 'Nearby' : 'À proximité'}</span>
              </div>
              <div className="p-4 bg-black rounded-xl border border-gray-700">
                <span className="text-2xl mb-1 block">📞</span>
                <span className="text-xs font-bold">{lang === 'en' ? 'Contact' : 'Contact'}</span>
              </div>
            </div>
          </section>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white pb-28">
      {/* ─── HEADER IMMERSIF ─── */}
      {/* Le gradient utilise la couleur d'accent du profil pour personnaliser l'expérience */}
      <header
        className="pt-8 pb-14 px-6 text-center relative overflow-hidden"
        style={{
          background: `linear-gradient(to bottom, ${profileMeta.accentColor}, #111111)`,
        }}
      >
        <div className="relative z-10">
          {agency.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={agency.logoUrl}
              alt={agency.name}
              className="h-14 w-14 object-contain mx-auto mb-4 bg-white p-2 rounded-xl shadow-lg"
            />
          )}
          {/* Badge profil (montre le type d'expérience) */}
          <div className="inline-flex items-center gap-1.5 bg-black/30 text-white px-3 py-1 rounded-full text-xs font-bold mb-3">
            <span>{profileMeta.emoji}</span>
            <span>{lang === 'en' ? profileMeta.labelEn : profileMeta.label}</span>
          </div>
          <p className="text-white font-bold text-lg uppercase tracking-wider mb-1">
            {greeting}
          </p>
          <h1 className="text-3xl font-black text-white mb-2 leading-tight">
            {agency.name}
          </h1>
          <p className="text-white/80 text-sm font-medium">{t.subtitle}</p>
        </div>
        {/* Décor : cercles flous en arrière-plan */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-black/10 blur-2xl" />
      </header>

      {/* ─── CONTENU PRINCIPAL ─── */}
      <main className="px-4 -mt-8 relative z-20 space-y-6">
        {/* Boutons d'action rapide (communs à tous les profils) */}
        <QuickActions agencyPhone={receptionPhone} lang={lang} />

        {/* Contenu spécifique au profil */}
        {renderProfileContent()}

        {/* Volet Touristique Géolocalisé — affiché si l'hôtel a des coordonnées GPS */}
        {agency.latitude !== null && agency.longitude !== null && profile !== 'HOST' && (
          <NearbyAttractions
            hotelLat={agency.latitude}
            hotelLng={agency.longitude}
            agencySlug={agency.slug}
            agencyId={agency.id}
          />
        )}

        {/* Besoin d'aide (commun à tous les profils) */}
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
