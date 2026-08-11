/**
 * Seed catalogue de services AIRBNB dédié — version CJS
 * Lance: node scripts/seed-airbnb-services.cjs
 *
 * 7 catégories : livret/modes d'emploi, ménage & linge, signalement panne,
 *                arrivée/départ, extras payants
 * Packs : airbnb_ville, airbnb_villa, airbnb_mer, airbnb_montagne
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const AIRBNB_SERVICES = [
  // ─── LIVRET / MODES D'EMPLOI (catégorie: guide) ───
  { name: 'Wi-Fi', nameEn: 'Wi-Fi', nameEs: 'Wi-Fi', icon: '📶', category: 'guide', type: 'info', tab: 'hotel', team: 'reception', free: true, price: 0, desc: 'Code Wi-Fi du logement', descEn: 'Property Wi-Fi code', descEs: 'Código Wi-Fi del alojamiento', pack: 'airbnb_ville' },
  { name: 'Machine à café', nameEn: 'Coffee machine', nameEs: 'Cafetera', icon: '☕', category: 'guide', type: 'info', tab: 'hotel', team: 'maintenance', free: true, price: 0, desc: 'Mode d\'emploi machine à café', descEn: 'Coffee machine instructions', descEs: 'Instrucciones cafetera', pack: 'airbnb_ville' },
  { name: 'Télévision', nameEn: 'Television', nameEs: 'Televisión', icon: '📺', category: 'guide', type: 'info', tab: 'hotel', team: 'maintenance', free: true, price: 0, desc: 'Allumage TV + apps Netflix/YouTube', descEn: 'TV setup + Netflix/YouTube apps', descEs: 'Encendido TV + apps Netflix/YouTube', pack: 'airbnb_ville' },
  { name: 'Chauffage & Climatisation', nameEn: 'Heating & AC', nameEs: 'Calefacción y aire', icon: '🌡️', category: 'guide', type: 'info', tab: 'hotel', team: 'maintenance', free: true, price: 0, desc: 'Réglage thermostat et clim', descEn: 'Thermostat and AC setup', descEs: 'Termostato y aire acondicionado', pack: 'airbnb_ville' },
  { name: 'Lave-linge', nameEn: 'Washing machine', nameEs: 'Lavadora', icon: '👔', category: 'guide', type: 'info', tab: 'hotel', team: 'maintenance', free: true, price: 0, desc: 'Mode d\'emploi lave-linge', descEn: 'Washing machine instructions', descEs: 'Instrucciones lavadora', pack: 'airbnb_ville' },
  { name: 'Jacuzzi', nameEn: 'Hot tub', nameEs: 'Jacuzzi', icon: '🛁', category: 'guide', type: 'info', tab: 'hotel', team: 'maintenance', free: true, price: 0, desc: 'Mode d\'emploi et entretien jacuzzi', descEn: 'Hot tub instructions and care', descEs: 'Instrucciones jacuzzi', pack: 'airbnb_villa' },
  { name: 'Piscine', nameEn: 'Swimming pool', nameEs: 'Piscina', icon: '🏊', category: 'guide', type: 'info', tab: 'hotel', team: 'maintenance', free: true, price: 0, desc: 'Règles et horaires piscine', descEn: 'Pool rules and hours', descEs: 'Reglas y horarios piscina', pack: 'airbnb_villa' },
  { name: 'Barbecue', nameEn: 'Barbecue', nameEs: 'Barbacoa', icon: '🔥', category: 'guide', type: 'info', tab: 'hotel', team: 'maintenance', free: true, price: 0, desc: 'Allumage et sécurité BBQ', descEn: 'BBQ lighting and safety', descEs: 'Encendido y seguridad BBQ', pack: 'airbnb_mer' },

  // ─── MÉNAGE & LINGE ───
  { name: 'Serviettes supplémentaires', nameEn: 'Extra towels', nameEs: 'Toallas extra', icon: '🧖', category: 'housekeeping', type: 'request', tab: 'hotel', team: 'housekeeping', free: true, price: 0, desc: 'Demande de serviettes propres', descEn: 'Request clean towels', descEs: 'Pedir toallas limpias', pack: 'airbnb_ville' },
  { name: 'Ménage milieu de séjour', nameEn: 'Mid-stay cleaning', nameEs: 'Limpieza mid-stay', icon: '🧹', category: 'housekeeping', type: 'request', tab: 'hotel', team: 'housekeeping', free: false, price: 5000, desc: 'Service ménage (3h, en milieu de séjour)', descEn: 'Cleaning service (mid-stay)', descEs: 'Servicio limpieza mid-stay', pack: 'airbnb_villa' },
  { name: 'Draps propres', nameEn: 'Fresh sheets', nameEs: 'Sábanas limpias', icon: '🛏️', category: 'housekeeping', type: 'request', tab: 'hotel', team: 'housekeeping', free: false, price: 3000, desc: 'Changement de draps', descEn: 'Sheet change', descEs: 'Cambio de sábanas', pack: 'airbnb_villa' },

  // ─── SIGNALEMENT PANNE ───
  { name: 'Signaler une panne', nameEn: 'Report a breakdown', nameEs: 'Reportar avería', icon: '🔧', category: 'maintenance', type: 'request', tab: 'hotel', team: 'maintenance', free: true, price: 0, desc: 'Photo + description panne (24/7)', descEn: 'Photo + breakdown description (24/7)', descEs: 'Foto + descripción avería (24/7)', pack: 'airbnb_ville' },

  // ─── ARRIVÉE / DÉPART ───
  { name: 'Self check-in (boîte à clés)', nameEn: 'Self check-in (key box)', nameEs: 'Self check-in (caja llaves)', icon: '🔑', category: 'reception', type: 'info', tab: 'hotel', team: 'reception', free: true, price: 0, desc: 'Code boîte à clés + adresse', descEn: 'Key box code + address', descEs: 'Código caja llaves + dirección', pack: 'airbnb_ville' },
  { name: 'Late check-out', nameEn: 'Late check-out', nameEs: 'Late check-out', icon: '🕙', category: 'reception', type: 'request', tab: 'hotel', team: 'reception', free: false, price: 2500, desc: 'Départ tardif (jusqu\'à 14h)', descEn: 'Late departure (until 2pm)', descEs: 'Salida tardía (hasta 14h)', pack: 'airbnb_ville' },
  { name: 'Early check-in', nameEn: 'Early check-in', nameEs: 'Early check-in', icon: '🏃', category: 'reception', type: 'request', tab: 'hotel', team: 'reception', free: false, price: 2500, desc: 'Arrivée anticipée (dès 11h)', descEn: 'Early arrival (from 11am)', descEs: 'Llegada anticipada (desde 11h)', pack: 'airbnb_ville' },
  { name: 'Consigne bagages', nameEn: 'Luggage storage', nameEs: 'Consigna equipaje', icon: '🧳', category: 'reception', type: 'request', tab: 'hotel', team: 'reception', free: true, price: 0, desc: 'Déposez vos bagages avant/après', descEn: 'Drop luggage before/after', descEs: 'Dejar equipaje antes/después', pack: 'airbnb_ville' },

  // ─── EXTRAS PAYANTS ───
  { name: 'Panier petit-déjeuner', nameEn: 'Breakfast basket', nameEs: 'Cesta desayuno', icon: '🥐', category: 'food', type: 'order', tab: 'hotel', team: 'reception', free: false, price: 7500, desc: 'Panier livré le matin (viennoiseries, fruits, jus)', descEn: 'Basket delivered in morning', descEs: 'Cesta entregada por la mañana', pack: 'airbnb_villa' },
  { name: 'Location vélos', nameEn: 'Bike rental', nameEs: 'Alquiler bicis', icon: '🚲', category: 'transport', type: 'booking', tab: 'tourism', team: 'reception', free: false, price: 5000, desc: 'Vélos adultes et enfants (à la journée)', descEn: 'Adult and kids bikes (per day)', descEs: 'Bicis adultos y niños (por día)', pack: 'airbnb_mer' },
  { name: 'Location kayaks', nameEn: 'Kayak rental', nameEs: 'Alquiler kayaks', icon: '🛶', category: 'transport', type: 'booking', tab: 'tourism', team: 'reception', free: false, price: 10000, desc: 'Kayaks doubles (demi-journée)', descEn: 'Double kayaks (half day)', descEs: 'Kayaks dobles (medio día)', pack: 'airbnb_mer' },
  { name: 'Kit bébé', nameEn: 'Baby kit', nameEs: 'Kit bebé', icon: '🍼', category: 'housekeeping', type: 'request', tab: 'hotel', team: 'housekeeping', free: false, price: 5000, desc: 'Lit parapluie + chaise haute + baignoire', descEn: 'Travel cot + high chair + bath', descEs: 'Cuna + trona + bañera', pack: 'airbnb_villa' },
  { name: 'Transfert aéroport', nameEn: 'Airport transfer', nameEs: 'Traslado aeropuerto', icon: '🚐', category: 'transport', type: 'booking', tab: 'hotel', team: 'reception', free: false, price: 20000, desc: 'Transfert privé aéroport → logement', descEn: 'Private airport transfer', descEs: 'Traslado privado aeropuerto', pack: 'airbnb_ville' },

  // ─── AIDE ───
  { name: 'Retour au logement', nameEn: 'Back to property', nameEs: 'Volver al alojamiento', icon: '📍', category: 'reception', type: 'info', tab: 'help', team: 'reception', free: true, price: 0, desc: 'Itinéraire Google Maps', descEn: 'Google Maps directions', descEs: 'Indicaciones Google Maps', pack: 'airbnb_ville' },
  { name: 'Appeler l\'hôte', nameEn: 'Call host', nameEs: 'Llamar al anfitrión', icon: '📞', category: 'reception', type: 'info', tab: 'help', team: 'reception', free: true, price: 0, desc: 'Appel direct hôte/concierge', descEn: 'Direct host/concierge call', descEs: 'Llamada directa anfitrión', pack: 'airbnb_ville' },
  { name: 'Je suis perdu', nameEn: 'I am lost', nameEs: 'Estoy perdido', icon: '🆘', category: 'reception', type: 'request', tab: 'help', team: 'reception', free: true, price: 0, desc: 'Envoyer ma position à l\'hôte', descEn: 'Send my location to host', descEs: 'Enviar mi ubicación al anfitrión', pack: 'airbnb_ville' },
  { name: 'Urgences locales', nameEn: 'Local emergency', nameEs: 'Emergencias locales', icon: '🚑', category: 'reception', type: 'info', tab: 'help', team: 'reception', free: true, price: 0, desc: 'Numéros d\'urgence du pays', descEn: 'Country emergency numbers', descEs: 'Números de emergencia del país', pack: 'airbnb_ville' },
];

async function main() {
  console.log('🌱 Seeding ' + AIRBNB_SERVICES.length + ' service templates Airbnb...');
  // On ne supprime pas les services existants (hôtel) — on ajoute juste les Airbnb
  for (const s of AIRBNB_SERVICES) {
    await prisma.serviceTemplate.create({
      data: {
        name: s.name,
        nameEn: s.nameEn || s.name,
        nameEs: s.nameEs || s.name,
        description: s.desc,
        descriptionEn: s.descEn || s.desc,
        descriptionEs: s.descEs || s.desc,
        icon: s.icon,
        type: s.type,
        category: s.category,
        displayTab: s.tab,
        assignedTeam: s.team,
        isFree: s.free,
        defaultPrice: s.price,
        defaultSchedule: null,
        pack: s.pack,
        isActive: true,
      },
    });
  }
  console.log('✅ ' + AIRBNB_SERVICES.length + ' services Airbnb créés');
}

main().catch((e) => { console.error('❌', e); }).finally(() => prisma.$disconnect());
