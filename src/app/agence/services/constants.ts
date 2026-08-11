// Constantes partagées pour les services hôtel (séparées des server actions)

export const SERVICE_CATEGORIES = [
  { value: 'housekeeping', label: 'Ménage', icon: '🧹' },
  { value: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { value: 'food', label: 'Restauration', icon: '🍽️' },
  { value: 'spa', label: 'Spa & Bien-être', icon: '💆' },
  { value: 'reception', label: 'Réception', icon: '🛎️' },
  { value: 'transport', label: 'Transport', icon: '🚖' },
  { value: 'guide', label: 'Mode d’emploi appareil', icon: '📖' },
  { value: 'other', label: 'Autre', icon: '📋' },
];

export const SERVICE_TYPES = [
  { value: 'request', label: 'Demande', icon: '📨' },
  { value: 'order', label: 'Commande', icon: '🛒' },
  { value: 'booking', label: 'Réservation', icon: '📅' },
  { value: 'info', label: 'Information', icon: 'ℹ️' },
];

export const TEAMS = [
  { value: 'housekeeping', label: 'Équipe Ménage' },
  { value: 'maintenance', label: 'Équipe Maintenance' },
  { value: 'kitchen', label: 'Cuisine / Room Service' },
  { value: 'spa', label: 'Équipe Spa' },
  { value: 'reception', label: 'Réception' },
];

export const DISPLAY_TABS = [
  { value: 'hotel', label: 'Mon Hôtel' },
  { value: 'tourism', label: 'Autour de moi' },
  { value: 'help', label: 'Aide' },
];

export interface HotelServiceSummary {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  type: string;
  category: string;
  isActive: boolean;
  isFree: boolean;
  price: number;
  schedule: string | null;
  slots: string | null;
  menu: string | null;
  assignedTeam: string;
  displayTab: string;
  modeleId: string | null;
  photoCustom: string | null;
  videoUrl: string | null;
  etapes: string | null;
  depannage: string | null;
  createdAt: Date;
  updatedAt: Date;
}
