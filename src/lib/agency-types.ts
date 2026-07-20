/**
 * QRTags — Agency Type definitions (multi-business)
 *
 * Chaque type d'agence définit :
 *   - label : libellé affiché (FR)
 *   - icon  : nom d'icône lucide-react
 *   - customFields : schéma des champs dynamiques stockés dans Baggage.customData (JSON)
 *
 * Le formulaire d'activation (Page Inscrire + Dashboard Agence) lit ce schéma
 * pour générer dynamiquement les champs à afficher selon agency.agencyType.
 */

export type CustomFieldType = 'text' | 'tel' | 'email' | 'date' | 'time' | 'textarea' | 'number';

export interface CustomField {
  key: string;          // clé JSON (ex: "room_number")
  label: string;        // libellé FR
  type: CustomFieldType;
  required?: boolean;
  placeholder?: string;
  helper?: string;
}

export interface AgencyTypeDef {
  value: string;
  label: string;
  icon: string;         // nom lucide-react
  description: string;
  customFields: CustomField[];
}

export const AGENCY_TYPES: AgencyTypeDef[] = [
  {
    value: 'hotel',
    label: 'Hôtel',
    icon: 'BedDouble',
    description: 'Hôtels, résidences, clubs — étiquettes sur les bagages/effets clients.',
    customFields: [
      { key: 'client_name',     label: 'Nom du client',         type: 'text', required: true,  placeholder: 'Marie Dupont' },
      { key: 'room_number',     label: 'N° chambre',            type: 'text', required: true,  placeholder: '204' },
      { key: 'arrival_date',    label: 'Date d\'arrivée',       type: 'date', required: true },
      { key: 'departure_date',  label: 'Date de départ',        type: 'date', required: true },
      { key: 'phone',           label: 'Téléphone',             type: 'tel',  required: true,  placeholder: '+33 6 12 34 56 78' },
    ],
  },
  {
    value: 'school',
    label: 'Étudiants / École',
    icon: 'GraduationCap',
    description: 'Écoles, collèges, lycées — étiquettes sur cartables, uniformes, instruments.',
    customFields: [
      { key: 'student_name',    label: 'Nom de l\'élève',       type: 'text', required: true,  placeholder: 'Luc Martin' },
      { key: 'class_name',      label: 'Classe',                type: 'text', required: true,  placeholder: '6ème B' },
      { key: 'parent_name',     label: 'Nom du parent',         type: 'text', required: true,  placeholder: 'Sophie Martin' },
      { key: 'parent_phone',    label: 'Téléphone parent',      type: 'tel',  required: true,  placeholder: '+33 6 12 34 56 78' },
    ],
  },
  {
    value: 'luggage_locker',
    label: 'Consigne de bagages',
    icon: 'Luggage',
    description: 'Consignes en gare/aéroport/gare routière — étiquettes sur bagages déposés.',
    customFields: [
      { key: 'locker_number',   label: 'N° casier',             type: 'text', required: true,  placeholder: 'A-042' },
      { key: 'baggage_desc',    label: 'Description bagage',    type: 'textarea', required: true, placeholder: 'Valise noire rigide, roue gauche cassée' },
      { key: 'deposit_time',    label: 'Heure de dépôt',        type: 'time', required: true },
      { key: 'traveler_phone',  label: 'Téléphone voyageur',    type: 'tel',  required: true,  placeholder: '+33 6 12 34 56 78' },
    ],
  },
  {
    value: 'car_rental',
    label: 'Loueurs de voitures',
    icon: 'Car',
    description: 'Loueurs auto — étiquettes sur clés, documents, et équipements (sièges enfant, GPS).',
    customFields: [
      { key: 'tenant_name',     label: 'Nom du locataire',      type: 'text', required: true,  placeholder: 'Karim Benali' },
      { key: 'contract_number', label: 'N° contrat',            type: 'text', required: true,  placeholder: 'C-2026-0142' },
      { key: 'car_model',       label: 'Modèle voiture',        type: 'text', required: true,  placeholder: 'Renault Clio 5' },
      { key: 'license_plate',   label: 'Immatriculation',       type: 'text', required: true,  placeholder: 'AB-123-CD' },
      { key: 'tenant_phone',    label: 'Téléphone',             type: 'tel',  required: true,  placeholder: '+33 6 12 34 56 78' },
    ],
  },
  {
    value: 'medical',
    label: 'Médical / Clinique',
    icon: 'Stethoscope',
    description: 'Cliniques, hôpitaux, EHPAD — étiquettes sur effets personnels patients.',
    customFields: [
      { key: 'patient_name',    label: 'Nom du patient',        type: 'text', required: true,  placeholder: 'Jean Dupont' },
      { key: 'file_number',     label: 'N° dossier',            type: 'text', required: true,  placeholder: 'DOS-2026-0142' },
      { key: 'room_number',     label: 'Chambre',               type: 'text', required: false, placeholder: 'Chambre 312' },
      { key: 'emergency_contact', label: 'Contact d\'urgence',  type: 'tel',  required: true,  placeholder: '+33 6 12 34 56 78' },
    ],
  },
  {
    value: 'generic',
    label: 'Autre / Générique',
    icon: 'Briefcase',
    description: 'Autres métiers — étiquettes génériques sur objets divers.',
    customFields: [
      { key: 'owner_name',      label: 'Nom du propriétaire',   type: 'text', required: true,  placeholder: 'Marie Dupont' },
      { key: 'object_desc',     label: 'Description de l\'objet', type: 'textarea', required: true, placeholder: 'Ordinateur portable Dell, coque bleue' },
      { key: 'owner_phone',     label: 'Téléphone',             type: 'tel',  required: true,  placeholder: '+33 6 12 34 56 78' },
    ],
  },
];

export const AGENCY_TYPE_VALUES = AGENCY_TYPES.map((t) => t.value);

export function getAgencyTypeDef(type?: string | null): AgencyTypeDef | undefined {
  if (!type) return undefined;
  return AGENCY_TYPES.find((t) => t.value === type);
}

export function getCustomFieldsForAgencyType(type?: string | null): CustomField[] {
  return getAgencyTypeDef(type)?.customFields ?? [];
}

/**
 * Valide un objet customData contre le schéma du type d'agence.
 * Retourne { valid: boolean, errors: Record<key, message> }.
 */
export function validateCustomData(
  type: string | null | undefined,
  data: Record<string, unknown>,
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const fields = getCustomFieldsForAgencyType(type);
  for (const f of fields) {
    const v = data[f.key];
    if (f.required && (v === undefined || v === null || String(v).trim() === '')) {
      errors[f.key] = `${f.label} est requis`;
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

// ═══════════════════════════════════════════════════════════════════
// QRTags — Liste des produits/objets à protéger
// Utilisé dans le sélecteur de la page /admin/generer
// ═══════════════════════════════════════════════════════════════════

export interface ProductType {
  value: string;
  label: string;
  icon?: string;
}

export const PRODUCT_TYPES: ProductType[] = [
  { value: 'laptop',         label: 'Ordinateur portable',  icon: '💻' },
  { value: 'phone',          label: 'Téléphone',            icon: '📱' },
  { value: 'tablet',         label: 'Tablette',             icon: '📲' },
  { value: 'luggage',        label: 'Bagage / Valise',      icon: '🧳' },
  { value: 'keys',           label: 'Clés',                 icon: '🔑' },
  { value: 'wallet',         label: 'Portefeuille',         icon: '👛' },
  { value: 'watch',          label: 'Montre',               icon: '⌚' },
  { value: 'camera',         label: 'Appareil photo',       icon: '📷' },
  { value: 'headphones',     label: 'Écouteurs / Casque',   icon: '🎧' },
  { value: 'documents',      label: 'Documents',            icon: '📄' },
  { value: 'medication',     label: 'Médicaments',          icon: '💊' },
  { value: 'glasses',        label: 'Lunettes',             icon: '👓' },
  { value: 'jewelry',        label: 'Bijoux',               icon: '💍' },
  { value: 'tool',           label: 'Outil',                icon: '🔧' },
  { value: 'clothing',       label: 'Vêtement',             icon: '👕' },
  { value: 'other',          label: 'Autre objet',          icon: '📦' },
];

export function getProductLabel(value: string): string {
  return PRODUCT_TYPES.find((p) => p.value === value)?.label || value;
}

// ═══════════════════════════════════════════════════════════════════
// QRTags — 8 Catégories d'objets (page d'inscription)
// ═══════════════════════════════════════════════════════════════════

export interface ObjectCategory {
  value: string;
  label: string;
  icon: string;
  examples: string;
  fields: { key: string; label: string; type: 'text' | 'tel' | 'textarea' | 'number'; required?: boolean; placeholder?: string }[];
}

export const OBJECT_CATEGORIES: ObjectCategory[] = [
  {
    value: 'electronics',
    label: 'Électronique',
    icon: '📱',
    examples: 'Téléphone, ordinateur, tablette, écouteurs, montre connectée',
    fields: [
      { key: 'brand', label: 'Marque', type: 'text', placeholder: 'Ex: Apple, Samsung...' },
      { key: 'model', label: 'Modèle', type: 'text', placeholder: 'Ex: iPhone 14 Pro' },
      { key: 'color', label: 'Couleur', type: 'text', placeholder: 'Ex: Noir' },
      { key: 'imei', label: 'IMEI (optionnel)', type: 'text', placeholder: 'Ex: 35391810...' },
    ],
  },
  {
    value: 'travel',
    label: 'Voyage',
    icon: '🧳',
    examples: 'Valise, sac à dos, passeport, portefeuille, sac à main',
    fields: [
      { key: 'type', label: 'Type', type: 'text', placeholder: 'Ex: Valise, sac à dos...' },
      { key: 'brand', label: 'Marque', type: 'text', placeholder: 'Ex: Samsonite' },
      { key: 'color', label: 'Couleur', type: 'text', placeholder: 'Ex: Rouge' },
      { key: 'size', label: 'Taille', type: 'text', placeholder: 'Ex: Grand, cabine...' },
    ],
  },
  {
    value: 'keys',
    label: 'Clés',
    icon: '🔑',
    examples: 'Clés maison, clés voiture, clés bureau, badge',
    fields: [
      { key: 'type', label: 'Type', type: 'text', placeholder: 'Ex: Maison, voiture...' },
      { key: 'count', label: 'Nombre de clés', type: 'number', placeholder: 'Ex: 3' },
      { key: 'keychain', label: 'Porte-clés distinctif', type: 'text', placeholder: 'Ex: Porte-clés en cuir marron' },
    ],
  },
  {
    value: 'vehicles',
    label: 'Véhicules',
    icon: '🚗',
    examples: 'Vélo, scooter, trottinette, casque',
    fields: [
      { key: 'type', label: 'Type', type: 'text', placeholder: 'Ex: Vélo, scooter...' },
      { key: 'brand', label: 'Marque', type: 'text', placeholder: 'Ex: Trek' },
      { key: 'model', label: 'Modèle', type: 'text', placeholder: 'Ex: VTT 500' },
      { key: 'color', label: 'Couleur', type: 'text', placeholder: 'Ex: Bleu' },
      { key: 'plate', label: 'Immatriculation', type: 'text', placeholder: 'Ex: AB-123-CD' },
    ],
  },
  {
    value: 'pets',
    label: 'Animaux',
    icon: '🐾',
    examples: 'Médaille chien, médaille chat, laisse',
    fields: [
      { key: 'pet_name', label: 'Nom de l\'animal', type: 'text', placeholder: 'Ex: Rex' },
      { key: 'breed', label: 'Race', type: 'text', placeholder: 'Ex: Labrador' },
      { key: 'color', label: 'Couleur', type: 'text', placeholder: 'Ex: Doré' },
      { key: 'medal', label: 'Type de médaille', type: 'text', placeholder: 'Ex: Médaille métallique ronde' },
    ],
  },
  {
    value: 'kids',
    label: 'Enfants',
    icon: '🎒',
    examples: 'Cartable, gourde, doudou, jouet',
    fields: [
      { key: 'child_name', label: 'Nom de l\'enfant', type: 'text', placeholder: 'Ex: Lucas' },
      { key: 'school', label: 'École', type: 'text', placeholder: 'Ex: École Jules Ferry' },
      { key: 'class', label: 'Classe', type: 'text', placeholder: 'Ex: CE2' },
      { key: 'color', label: 'Couleur', type: 'text', placeholder: 'Ex: Bleu' },
    ],
  },
  {
    value: 'sport',
    label: 'Sport',
    icon: '⚽',
    examples: 'Sac de sport, raquette, équipement, gourde',
    fields: [
      { key: 'sport_type', label: 'Type de sport', type: 'text', placeholder: 'Ex: Tennis, foot...' },
      { key: 'brand', label: 'Marque', type: 'text', placeholder: 'Ex: Nike' },
      { key: 'color', label: 'Couleur', type: 'text', placeholder: 'Ex: Noir' },
    ],
  },
  {
    value: 'other',
    label: 'Autre',
    icon: '📦',
    examples: 'Objet personnalisé (champ libre)',
    fields: [],
  },
];

export function getObjectCategory(value: string): ObjectCategory | undefined {
  return OBJECT_CATEGORIES.find((c) => c.value === value);
}

