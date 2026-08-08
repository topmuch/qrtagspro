'use client';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ResortZonesProps {
  /** Heure actuelle (0-23). Si null (avant hydratation), on affiche les heures sans statut. */
  currentHour: number | null;
}

interface ResortZone {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  openHour: number; // 0-23
  closeHour: number; // 0-23 (24 = minuit)
}

// ─── Zones du resort (MVP — données statiques) ──────────────────────────────
// À terme, ces zones seront configurables par l'hôtel depuis son dashboard
// (nom, horaires, icône, position sur la carte interactive).
const ZONES: ResortZone[] = [
  { id: 'pool', name: 'Piscine Principale', nameEn: 'Main Pool', icon: '🏊', openHour: 8, closeHour: 20 },
  { id: 'beach', name: 'Plage Privée', nameEn: 'Private Beach', icon: '🏖️', openHour: 7, closeHour: 19 },
  { id: 'restaurant', name: 'Restaurant Buffet', nameEn: 'Buffet Restaurant', icon: '🍴', openHour: 7, closeHour: 22 },
  { id: 'bar', name: 'Bar Lobby', nameEn: 'Lobby Bar', icon: '🍸', openHour: 10, closeHour: 24 },
  { id: 'gym', name: 'Salle de Sport', nameEn: 'Gym', icon: '🏋️', openHour: 6, closeHour: 22 },
  { id: 'spa', name: 'Spa & Hammam', nameEn: 'Spa & Hammam', icon: '🧖', openHour: 9, closeHour: 21 },
];

// ─── Helper : détermine si une zone est ouverte ─────────────────────────────
function isZoneOpen(zone: ResortZone, hour: number): boolean {
  // Gère le cas minuit (closeHour=24 → equivalent à 0 le lendemain)
  const close = zone.closeHour === 24 ? 0 : zone.closeHour;
  if (zone.openHour === close) return false; // jamais ouvert
  if (zone.openHour < close) {
    // Plage normale (ex: 9h-21h)
    return hour >= zone.openHour && hour < close;
  }
  // Plage chevauchant minuit (ex: 22h-2h)
  return hour >= zone.openHour || hour < close;
}

// ─── Helper : formate les horaires ──────────────────────────────────────────
function formatHours(zone: ResortZone): string {
  const fmt = (h: number) => (h === 24 ? '00:00' : `${h.toString().padStart(2, '0')}:00`);
  return `${fmt(zone.openHour)} - ${fmt(zone.closeHour)}`;
}

// ─── Composant ──────────────────────────────────────────────────────────────

export default function ResortZones({ currentHour }: ResortZonesProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {ZONES.map((zone) => {
        const isOpen = currentHour !== null ? isZoneOpen(zone, currentHour) : null;
        const dimmed = isOpen === false;

        return (
          <div
            key={zone.id}
            className={`relative p-4 rounded-xl border transition-all ${
              dimmed
                ? 'bg-gray-900 border-gray-800 opacity-50'
                : 'bg-black border-gray-700 hover:border-[#E3B23C]'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-3xl">{zone.icon}</span>
              {isOpen !== null && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isOpen
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-red-500/20 text-red-500'
                  }`}
                >
                  {isOpen ? 'OUVERT' : 'FERMÉ'}
                </span>
              )}
            </div>
            <h3 className="font-bold text-white text-sm leading-tight mb-1">
              {zone.name}
            </h3>
            <p className="text-xs text-gray-400">{formatHours(zone)}</p>
          </div>
        );
      })}
    </div>
  );
}
