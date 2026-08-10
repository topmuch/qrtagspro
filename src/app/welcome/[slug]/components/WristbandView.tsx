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
import { getPublicHotelServices, type HotelServiceSummary } from '@/app/agence/services/actions';

// ─── Type de l'agence sérialisée (passée du server component) ───────────────
export interface WelcomeAgency {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  contactPhone: string | null;
  logoUrl: string | null;
  address: string | null;
  braceletProfile: string | null;
  latitude: number | null;
  longitude: number | null;
  houseGuide: HouseGuideData | null;
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
    tabHotel: 'Mon Hôtel',
    tabTourism: 'Autour de moi',
    tabHelp: 'Aide',
    reception: 'Réception',
    emergency: 'Urgence / Médecin',
    review: '⭐ Laissez un avis sur votre séjour',
    noServices: 'Aucun service configuré pour le moment.',
  },
  en: {
    morning: 'Good Morning',
    afternoon: 'Good Afternoon',
    evening: 'Good Evening',
    subtitle: 'Your stay companion',
    tabHotel: 'My Hotel',
    tabTourism: 'Around Me',
    tabHelp: 'Help',
    reception: 'Reception',
    emergency: 'Emergency / Doctor',
    review: '⭐ Leave a review about your stay',
    noServices: 'No services configured yet.',
  },
};

export default function WristbandView({ agency, lang }: WristbandViewProps) {
  const [greeting, setGreeting] = useState(T.fr.morning);
  const [currentHour, setCurrentHour] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'hotel' | 'tourism' | 'help'>('hotel');
  const [hotelServices, setHotelServices] = useState<HotelServiceSummary[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  const t = lang === 'en' ? T.en : T.fr;
  const profile = (agency.braceletProfile || 'STANDARD') as BraceletProfile;
  const profileMeta = getProfileMeta(profile);
  const isHost = profile === 'HOST';

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

  // Charger les services hôtel
  useEffect(() => {
    if (isHost) { setServicesLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const result = await getPublicHotelServices(agency.id);
        if (!cancelled && result.success) {
          setHotelServices(result.services || []);
        }
      } catch { /* silent */ }
      if (!cancelled) setServicesLoading(false);
    })();
    return () => { cancelled = true; };
  }, [agency.id, isHost]);

  const receptionPhone = agency.contactPhone || agency.phone;
  const cleanPhone = (p: string | null) => (p ? p.replace(/[\s\-().]/g, '') : null);
  const receptionTel = cleanPhone(receptionPhone);

  // Services groupés par onglet
  const servicesHotel = hotelServices.filter((s) => s.displayTab === 'hotel');
  const servicesTourism = hotelServices.filter((s) => s.displayTab === 'tourism');
  const servicesHelp = hotelServices.filter((s) => s.displayTab === 'help');

  // ─── Rendu du contenu "Mon Hôtel" ───
  const renderHotelTab = () => {
    if (isHost && agency.houseGuide) {
      return <HostView guide={agency.houseGuide} agencyName={agency.name} agencyAddress={agency.address} lang={lang} />;
    }

    return (
      <div className="space-y-6">
        {/* Services configurés par l'hôtel */}
        {servicesHotel.length > 0 && (
          <section className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800">
            <h2 className="text-xl font-bold text-[#E3B23C] mb-4 flex items-center gap-2">🏨 {t.tabHotel}</h2>
            <div className="grid grid-cols-2 gap-3">
              {servicesHotel.map((s) => (
                <div key={s.id} className="p-4 bg-black rounded-xl border border-gray-700 hover:border-[#E3B23C] transition-colors">
                  <span className="text-3xl mb-2 block">{s.icon}</span>
                  <h3 className="font-bold text-white text-sm leading-tight">{s.name}</h3>
                  {s.description && <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{s.description}</p>}
                  {!s.isFree && <p className="text-[10px] text-[#E3B23C] font-bold mt-1">{s.price} FCFA</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* HouseGuide : WiFi + infos hôtel */}
        {agency.houseGuide && (
          <section className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800">
            <h2 className="text-xl font-bold text-[#E3B23C] mb-4 flex items-center gap-2">📶 WiFi & Infos</h2>
            {agency.houseGuide.wifiNetwork && (
              <div className="bg-black rounded-xl p-3 border border-gray-700 mb-2">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">WiFi</p>
                <p className="text-white font-mono font-bold text-sm">{agency.houseGuide.wifiNetwork}</p>
                {agency.houseGuide.wifiPassword && <p className="text-white font-mono text-sm">🔑 {agency.houseGuide.wifiPassword}</p>}
              </div>
            )}
            {agency.houseGuide.houseRules && (
              <div className="bg-black/50 rounded-xl p-3 border border-gray-800">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Règlement</p>
                <p className="text-xs text-gray-300 whitespace-pre-line">{agency.houseGuide.houseRules}</p>
              </div>
            )}
          </section>
        )}

        {/* Contenu spécifique au profil (RESORT zones/animations, BUSINESS services, etc.) */}
        {!isHost && renderProfileContent()}

        {/* État vide si ni services ni profil spécifique */}
        {servicesHotel.length === 0 && !agency.houseGuide && (profile === 'STANDARD') && (
          <section className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800 text-center">
            <p className="text-sm text-gray-400">{t.noServices}</p>
          </section>
        )}
      </div>
    );
  };

  // ─── Rendu du contenu "Autour de moi" ───
  const renderTourismTab = () => {
    return (
      <div className="space-y-6">
        {servicesTourism.length > 0 && (
          <section className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800">
            <h2 className="text-xl font-bold text-[#E3B23C] mb-4 flex items-center gap-2">📍 Recommandations</h2>
            <div className="grid grid-cols-2 gap-3">
              {servicesTourism.map((s) => (
                <div key={s.id} className="p-4 bg-black rounded-xl border border-gray-700">
                  <span className="text-3xl mb-2 block">{s.icon}</span>
                  <h3 className="font-bold text-white text-sm">{s.name}</h3>
                  {s.description && <p className="text-[10px] text-gray-400 mt-0.5">{s.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* NearbyAttractions (API POI géolocalisés) */}
        {agency.latitude !== null && agency.longitude !== null && !isHost && (
          <NearbyAttractions
            hotelLat={agency.latitude}
            hotelLng={agency.longitude}
            agencySlug={agency.slug}
            agencyId={agency.id}
          />
        )}

        {/* Profil BOUTIQUE : recommandations hôte */}
        {profile === 'BOUTIQUE' && <LocalRecommendations agencyName={agency.name} lang={lang} />}
      </div>
    );
  };

  // ─── Rendu du contenu "Aide" ───
  const renderHelpTab = () => {
    return (
      <div className="space-y-6">
        {servicesHelp.length > 0 && (
          <section className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800">
            <h2 className="text-xl font-bold text-[#E3B23C] mb-4 flex items-center gap-2">🛟 {t.tabHelp}</h2>
            <div className="grid grid-cols-2 gap-3">
              {servicesHelp.map((s) => (
                <div key={s.id} className="p-4 bg-black rounded-xl border border-gray-700 hover:border-red-500 transition-colors">
                  <span className="text-3xl mb-2 block">{s.icon}</span>
                  <h3 className="font-bold text-white text-sm">{s.name}</h3>
                  {s.description && <p className="text-[10px] text-gray-400 mt-0.5">{s.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Boutons d'aide standards */}
        <section className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800">
          <h2 className="text-lg font-bold text-white mb-3">{t.reception}</h2>
          <div className="grid grid-cols-2 gap-3">
            {receptionTel && (
              <a href={`tel:${receptionTel}`} className="flex flex-col items-center justify-center p-4 bg-black rounded-xl border border-gray-700 hover:border-[#E3B23C] transition-colors">
                <span className="text-2xl mb-1">🛎️</span>
                <span className="text-xs font-bold text-center">{t.reception}</span>
              </a>
            )}
            <a href="tel:1515" className="flex flex-col items-center justify-center p-4 bg-black rounded-xl border border-gray-700 hover:border-red-500 transition-colors">
              <span className="text-2xl mb-1">🚑</span>
              <span className="text-xs font-bold text-center">{t.emergency}</span>
            </a>
          </div>
        </section>
      </div>
    );
  };

  // ─── Rendu conditionnel selon le braceletProfile (pour "Mon Hôtel") ───
  const renderProfileContent = () => {
    switch (profile) {
      case 'BUSINESS':
        return <BusinessServices agencyPhone={receptionPhone} lang={lang} />;
      case 'TRANSIT':
        return <TransitInfo agencyPhone={receptionPhone} lang={lang} />;
      case 'RESORT':
        return (
          <>
            <section className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800">
              <h2 className="text-xl font-bold text-[#E3B23C] mb-4 flex items-center gap-2">🗺️ {t.tabHotel}</h2>
              <ResortZones currentHour={currentHour} />
            </section>
            <section className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800">
              <h2 className="text-xl font-bold text-[#E3B23C] mb-4 flex items-center gap-2">🎉 {lang === 'en' ? "Today's Activities" : 'Animations du Jour'}</h2>
              <DailySchedule lang={lang} />
            </section>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white pb-28">
      {/* ─── HEADER IMMERSIF ─── */}
      <header
        className="pt-8 pb-14 px-6 text-center relative overflow-hidden"
        style={{ background: `linear-gradient(to bottom, ${profileMeta.accentColor}, #111111)` }}
      >
        <div className="relative z-10">
          {agency.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={agency.logoUrl} alt={agency.name} className="h-14 w-14 object-contain mx-auto mb-4 bg-white p-2 rounded-xl shadow-lg" />
          )}
          <div className="inline-flex items-center gap-1.5 bg-black/30 text-white px-3 py-1 rounded-full text-xs font-bold mb-3">
            <span>{profileMeta.emoji}</span>
            <span>{lang === 'en' ? profileMeta.labelEn : profileMeta.label}</span>
          </div>
          <p className="text-white font-bold text-lg uppercase tracking-wider mb-1">{greeting}</p>
          <h1 className="text-3xl font-black text-white mb-2 leading-tight">{agency.name}</h1>
          <p className="text-white/80 text-sm font-medium">{t.subtitle}</p>
        </div>
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-black/10 blur-2xl" />
      </header>

      {/* ─── ONGLETS 3 COUCHES ─── */}
      <div className="sticky top-0 z-30 bg-[#111111]/90 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-2xl mx-auto flex">
          {([
            { key: 'hotel', label: t.tabHotel, icon: '🏨' },
            { key: 'tourism', label: t.tabTourism, icon: '🗺️' },
            { key: 'help', label: t.tabHelp, icon: '🛟' },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 px-2 text-sm font-bold transition-all border-b-2 ${
                activeTab === tab.key
                  ? 'border-[#E3B23C] text-[#E3B23C]'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── CONTENU PRINCIPAL ─── */}
      <main className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Boutons d'action rapide (communs à tous les profils, sauf HOST) */}
        {!isHost && <QuickActions agencyPhone={receptionPhone} lang={lang} />}

        {/* Contenu selon l'onglet actif */}
        {activeTab === 'hotel' && renderHotelTab()}
        {activeTab === 'tourism' && renderTourismTab()}
        {activeTab === 'help' && renderHelpTab()}
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
