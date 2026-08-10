// Constantes partagées pour les partenaires POI (séparées des server actions)

export interface PartnerSummary {
  id: string;
  name: string;
  category: string;
  description: string | null;
  latitude: number;
  longitude: number;
  rating: number;
  promoCode: string | null;
  commission: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const VALID_CATEGORIES = [
  'RESTAURANT',
  'ATTRACTION',
  'BEACH',
  'SHOPPING',
  'HEALTH',
  'TRANSPORT',
  'EXCURSION',
] as const;
