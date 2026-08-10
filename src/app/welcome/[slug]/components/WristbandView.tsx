'use client';

import { useState, useEffect } from 'react';
import HostView, { type HouseGuideData } from './HostView';
import NearbyAttractions from './NearbyAttractions';
import ServiceRequestModal from './ServiceRequestModal';
import { getProfileMeta, type BraceletProfile } from '@/lib/bracelet-profiles';

// ─── Types ──────────────────────────────────────────────────────────────────
interface HotelServiceItem {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  type: string;
  category: string;
  isFree: boolean;
  price: number;
  schedule: string | null;
  assignedTeam: string;
  displayTab: string;
}

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
  reference: string | null;
}

interface StayData {
  id: string;
  roomNumber: string | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  language: string;
  checkInDate: string;
  checkOutDate: string;
  nbPersons: number;
  status: string;
}

interface WristbandViewProps {
  agency: WelcomeAgency;
  lang: string;
}

// ─── Palette Luxe ──────────────────────────────────────────────────────────
// Fond : blanc cassé / crème (#FAF8F5)
// Cartes : blanc pur avec ombre douce
// Accent : or (#C9A961) — élégant, pas tape-à-l'œil
// Texte : gris foncé (#2C2C2C) — pas noir pur
// Headers : gradient or pâle → blanc

const C = {
  bg: '#FAF8F5',
  card: '#FFFFFF',
  ink: '#2C2C2C',
  inkLight: '#6B6B6B',
  gold: '#C9A961',
  goldLight: '#E8D5A3',
  goldDark: '#A8884A',
  border: '#E8E4DD',
  shadow: '0 2px 12px rgba(0,0,0,0.06)',
  shadowHover: '0 4px 20px rgba(201,169,97,0.15)',
};

// ─── Traductions ────────────────────────────────────────────────────────────
const T = {
  fr: {
    morning: 'Bonjour',
    afternoon: 'Bon après-midi',
    evening: 'Bonsoir',
    subtitle: 'Votre compagnon de séjour',
    tabHotel: 'Mon Hôtel',
    tabTourism: 'Autour de moi',
    tabHelp: 'Aide',
    reception: 'Appeler la réception',
    emergency: 'Urgences',
    review: 'Laisser un avis',
    noServices: 'Aucun service configuré pour le moment.',
    noPartners: 'Aucun lieu recommandé pour le moment.',
    backToHotel: 'Retour à l\'hôtel',
    room: 'Ch.',
  },
  en: {
    morning: 'Good Morning',
    afternoon: 'Good Afternoon',
    evening: 'Good Evening',
    subtitle: 'Your stay companion',
    tabHotel: 'My Hotel',
    tabTourism: 'Around Me',
    tabHelp: 'Help',
    reception: 'Call Reception',
    emergency: 'Emergency',
    review: 'Leave a review',
    noServices: 'No services configured yet.',
    noPartners: 'No recommended places yet.',
    backToHotel: 'Back to hotel',
    room: 'Room',
  },
};

export default function WristbandView({ agency, lang }: WristbandViewProps) {
  const [greeting, setGreeting] = useState(T.fr.morning);
  const [activeTab, setActiveTab] = useState<'hotel' | 'tourism' | 'help'>('hotel');
  const [hotelServices, setHotelServices] = useState<HotelServiceItem[]>([]);
  const [stay, setStay] = useState<StayData | null>(null);
  const [selectedService, setSelectedService] = useState<HotelServiceItem | null>(null);
  const [isAtHotel, setIsAtHotel] = useState<boolean | null>(null); // null = inconnu

  // Geofencing GPS — détecte si le client est dans l'hôtel
  useEffect(() => {
    if (!agency.latitude || !agency.longitude) return;
    if (!('geolocation' in navigator)) return;
    let cancelled = false;
    const checkPosition = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          const R = 6371; // km
          const dLat = (pos.coords.latitude - agency.latitude!) * Math.PI / 180;
          const dLng = (pos.coords.longitude - agency.longitude!) * Math.PI / 180;
          const a = Math.sin(dLat/2)**2 + Math.cos(agency.latitude!*Math.PI/180) * Math.cos(pos.coords.latitude*Math.PI/180) * Math.sin(dLng/2)**2;
          const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          setIsAtHotel(dist < 0.2); // 200m = périmètre hôtel
        },
        () => { /* GPS refusé — on reste sur l'onglet manuel */ },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    };
    checkPosition();
    const interval = setInterval(checkPosition, 30000); // refresh 30s
    return () => { cancelled = true; clearInterval(interval); };
  }, [agency.latitude, agency.longitude]);

  // Auto-bascule d'onglet selon le geofencing
  useEffect(() => {
    if (isAtHotel === null) return;
    if (isAtHotel) setActiveTab('hotel');
    else setActiveTab('tourism');
  }, [isAtHotel]);

  const effectiveLang = stay?.language || lang;
  const t = effectiveLang === 'en' ? T.en : T.fr;
  const profile = (agency.braceletProfile || 'STANDARD') as BraceletProfile;
  const profileMeta = getProfileMeta(profile);
  const isHost = profile === 'HOST';

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting(t.morning);
      else if (hour < 18) setGreeting(t.afternoon);
      else setGreeting(t.evening);
    };
    updateGreeting();
    const timer = setInterval(updateGreeting, 60_000);
    return () => clearInterval(timer);
  }, [t.morning, t.afternoon, t.evening]);

  useEffect(() => {
    if (!agency.reference) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/stay?reference=${agency.reference}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.found && data.stay) setStay(data.stay);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [agency.reference]);

  useEffect(() => {
    if (isHost) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/hotel-services?agencyId=${agency.id}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.success) setHotelServices(data.services || []);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [agency.id, isHost]);

  const receptionPhone = agency.contactPhone || agency.phone;
  const cleanPhone = (p: string | null) => (p ? p.replace(/[\s\-().]/g, '') : null);
  const receptionTel = cleanPhone(receptionPhone);

  const servicesHotel = hotelServices.filter((s) => s.displayTab === 'hotel');
  const servicesTourism = hotelServices.filter((s) => s.displayTab === 'tourism');
  const servicesHelp = hotelServices.filter((s) => s.displayTab === 'help');

  // ─── Carte de service (réutilisable) ───
  const ServiceCard = ({ s }: { s: HotelServiceItem }) => (
    <button
      onClick={() => setSelectedService(s)}
      className="text-left p-5 bg-white rounded-2xl border transition-all hover:shadow-lg w-full"
      style={{ borderColor: C.border, boxShadow: C.shadow }}
    >
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-3xl sm:text-2xl shrink-0" style={{ backgroundColor: `${C.gold}15` }}>
          {s.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base sm:text-sm leading-tight" style={{ color: C.ink }}>{s.name}</h3>
          {s.description && <p className="text-sm sm:text-xs mt-1 line-clamp-2" style={{ color: C.inkLight }}>{s.description}</p>}
          {!s.isFree && <p className="text-sm font-bold mt-1" style={{ color: C.goldDark }}>{s.price.toLocaleString('fr-FR')} FCFA</p>}
        </div>
      </div>
    </button>
  );

  // ─── Onglet MON HÔTEL ───
  const renderHotelTab = () => {
    if (isHost && agency.houseGuide) {
      return <HostView guide={agency.houseGuide} agencyName={agency.name} agencyAddress={agency.address} lang={lang} />;
    }
    return (
      <div className="space-y-5">
        {/* Services */}
        {servicesHotel.length > 0 && (
          <div className="space-y-3">
            {servicesHotel.map((s) => <ServiceCard key={s.id} s={s} />)}
          </div>
        )}

        {/* WiFi & Infos */}
        {agency.houseGuide && (
          <div className="bg-white rounded-2xl p-6 sm:p-5 border" style={{ borderColor: C.border, boxShadow: C.shadow }}>
            <h2 className="text-lg sm:text-base font-bold mb-4 flex items-center gap-3" style={{ color: C.ink }}>
              <span className="w-12 h-12 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-2xl sm:text-xl" style={{ backgroundColor: `${C.gold}15` }}>📶</span>
              WiFi & Informations
            </h2>
            {agency.houseGuide.wifiNetwork && (
              <div className="bg-gray-50 rounded-xl p-4 sm:p-3 mb-2">
                <p className="text-xs uppercase tracking-wide mb-1" style={{ color: C.inkLight }}>Réseau</p>
                <p className="font-mono font-bold text-lg sm:text-sm" style={{ color: C.ink }}>{agency.houseGuide.wifiNetwork}</p>
                {agency.houseGuide.wifiPassword && <p className="font-mono text-lg sm:text-sm mt-2" style={{ color: C.ink }}>🔑 {agency.houseGuide.wifiPassword}</p>}
              </div>
            )}
            {agency.houseGuide.houseRules && (
              <div className="bg-gray-50 rounded-xl p-4 sm:p-3">
                <p className="text-xs uppercase tracking-wide mb-1" style={{ color: C.inkLight }}>Règlement</p>
                <p className="text-sm sm:text-xs whitespace-pre-line" style={{ color: C.ink }}>{agency.houseGuide.houseRules}</p>
              </div>
            )}
          </div>
        )}

        {servicesHotel.length === 0 && !agency.houseGuide && (
          <div className="bg-white rounded-2xl p-10 text-center border" style={{ borderColor: C.border }}>
            <p className="text-base" style={{ color: C.inkLight }}>{t.noServices}</p>
          </div>
        )}
      </div>
    );
  };

  // ─── Onglet AUTOUR DE MOI ───
  const renderTourismTab = () => (
    <div className="space-y-5">
      {servicesTourism.length > 0 && (
        <div className="space-y-3">
          {servicesTourism.map((s) => <ServiceCard key={s.id} s={s} />)}
        </div>
      )}
      {agency.latitude !== null && agency.longitude !== null && !isHost && (
        <NearbyAttractions hotelLat={agency.latitude} hotelLng={agency.longitude} agencySlug={agency.slug} agencyId={agency.id} />
      )}
      {servicesTourism.length === 0 && (agency.latitude === null || agency.longitude === null) && (
        <div className="bg-white rounded-2xl p-10 text-center border" style={{ borderColor: C.border }}>
          <p className="text-base" style={{ color: C.inkLight }}>{t.noPartners}</p>
        </div>
      )}
    </div>
  );

  // ─── Onglet AIDE ───
  const renderHelpTab = () => (
    <div className="space-y-5">
      {servicesHelp.length > 0 && (
        <div className="space-y-3">
          {servicesHelp.map((s) => <ServiceCard key={s.id} s={s} />)}
        </div>
      )}
      <div className="bg-white rounded-2xl p-6 sm:p-5 border" style={{ borderColor: C.border, boxShadow: C.shadow }}>
        <div className="grid grid-cols-2 gap-4 sm:gap-3">
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${agency.latitude || ''},${agency.longitude || ''}`} target="_blank" rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-5 sm:p-4 rounded-xl border transition-all hover:shadow-md" style={{ borderColor: C.border }}>
            <span className="text-4xl sm:text-2xl mb-2">📍</span>
            <span className="text-sm sm:text-xs font-semibold text-center" style={{ color: C.ink }}>{t.backToHotel}</span>
          </a>
          {receptionTel && (
            <a href={`tel:${receptionTel}`} className="flex flex-col items-center justify-center p-5 sm:p-4 rounded-xl border transition-all hover:shadow-md" style={{ borderColor: C.border }}>
              <span className="text-4xl sm:text-2xl mb-2">🛎️</span>
              <span className="text-sm sm:text-xs font-semibold text-center" style={{ color: C.ink }}>{t.reception}</span>
            </a>
          )}
          <a href="tel:1515" className="flex flex-col items-center justify-center p-5 sm:p-4 rounded-xl border transition-all hover:shadow-md" style={{ borderColor: C.border }}>
            <span className="text-4xl sm:text-2xl mb-2">🚑</span>
            <span className="text-sm sm:text-xs font-semibold text-center" style={{ color: C.ink }}>{t.emergency}</span>
          </a>
          {receptionTel && (
            <a href={`https://wa.me/${receptionTel}?text=${encodeURIComponent(effectiveLang === 'en' ? 'Hello, I need assistance.' : 'Bonjour, j\'ai besoin d\'aide.')}`} target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-5 sm:p-4 rounded-xl border transition-all hover:shadow-md" style={{ borderColor: C.border }}>
              <span className="text-4xl sm:text-2xl mb-2">💬</span>
              <span className="text-sm sm:text-xs font-semibold text-center" style={{ color: C.ink }}>WhatsApp</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-32 sm:pb-28" style={{ backgroundColor: C.bg }}>
      {/* ─── HEADER LUXE ─── */}
      <header className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${C.goldLight} 0%, #FFFFFF 60%, ${C.bg} 100%)` }}>
        {/* Ligne dorée en haut */}
        <div className="h-1" style={{ background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)` }} />

        <div className="pt-12 pb-10 sm:pt-10 sm:pb-8 px-6 text-center relative z-10">
          {agency.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={agency.logoUrl} alt={agency.name} className="h-28 w-28 sm:h-20 sm:w-20 object-contain mx-auto mb-5 rounded-3xl shadow-lg" style={{ boxShadow: C.shadowHover }} />
          )}
          {/* Badge profil */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm sm:text-xs font-semibold mb-5" style={{ backgroundColor: `${C.gold}20`, color: C.goldDark }}>
            <span className="text-base">{profileMeta.emoji}</span>
            <span>{effectiveLang === 'en' ? profileMeta.labelEn : profileMeta.label}</span>
          </div>
          <p className="text-xl sm:text-lg font-light tracking-wide mb-2" style={{ color: C.inkLight }}>{greeting}</p>
          <h1 className="text-4xl sm:text-3xl font-bold mb-3 leading-tight" style={{ color: C.ink }}>{agency.name}</h1>
          {/* Stay info */}
          {stay && stay.guestName ? (
            <div className="inline-block px-5 py-2 rounded-full mb-3" style={{ backgroundColor: `${C.gold}15` }}>
              <p className="text-base sm:text-sm font-medium" style={{ color: C.goldDark }}>
                {stay.guestName}{stay.roomNumber && ` · ${t.room} ${stay.roomNumber}`}
              </p>
            </div>
          ) : null}
          <p className="text-base sm:text-sm" style={{ color: C.inkLight }}>{t.subtitle}</p>
        </div>

        {/* Décor : lignes dorées */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20" style={{ background: `radial-gradient(circle, ${C.gold}, transparent)` }} />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10" style={{ background: `radial-gradient(circle, ${C.gold}, transparent)` }} />
      </header>

      {/* ─── ONGLETS ─── */}
      <div className="sticky top-0 z-30 backdrop-blur-md border-b" style={{ backgroundColor: `${C.bg}F0`, borderColor: C.border }}>
        <div className="max-w-2xl mx-auto flex">
          {([
            { key: 'hotel', label: t.tabHotel, icon: '🏨' },
            { key: 'tourism', label: t.tabTourism, icon: '🗺️' },
            { key: 'help', label: t.tabHelp, icon: '🛟' },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-5 sm:py-3.5 px-3 sm:px-2 text-base sm:text-sm font-semibold transition-all relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-0"
              style={{
                color: activeTab === tab.key ? C.goldDark : C.inkLight,
              }}
            >
              <span className="text-2xl sm:text-base sm:mr-1">{tab.icon}</span>
              <span>{tab.label}</span>
              {/* Soulignement doré */}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-1/4 right-1/4 h-1 sm:h-0.5 rounded-full" style={{ backgroundColor: C.gold }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─── CONTENU ─── */}
      <main className="px-4 py-8 sm:py-6 max-w-2xl mx-auto">
        {activeTab === 'hotel' && renderHotelTab()}
        {activeTab === 'tourism' && renderTourismTab()}
        {activeTab === 'help' && renderHelpTab()}
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="fixed bottom-0 left-0 w-full backdrop-blur-md border-t p-3 z-50" style={{ backgroundColor: `${C.bg}F0`, borderColor: C.border }}>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(agency.name + ' ' + (agency.address || ''))}`}
          target="_blank" rel="noopener noreferrer"
          className="block w-full py-4 sm:py-3 rounded-xl font-bold text-base sm:text-sm text-center transition-all hover:shadow-lg"
          style={{ backgroundColor: C.gold, color: '#FFFFFF' }}
        >
          ⭐ {t.review}
        </a>
      </footer>

      {/* ─── MODAL ─── */}
      {selectedService && (
        <ServiceRequestModal
          service={selectedService}
          agencyId={agency.id}
          reference={agency.reference}
          roomNumber={stay?.roomNumber}
          guestName={stay?.guestName}
          onClose={() => setSelectedService(null)}
        />
      )}
    </div>
  );
}
