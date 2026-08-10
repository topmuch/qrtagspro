/**
 * Seed catalogue de services — version CJS (exécutable avec node dans Docker)
 * Lance: node scripts/seed-services.cjs
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SERVICES = [
  // MÉNAGE
  { name: 'Serviettes supplémentaires', icon: '🧖', category: 'housekeeping', type: 'request', tab: 'hotel', team: 'housekeeping', free: true, price: 0, desc: 'Demandez des serviettes supplémentaires', pack: 'resort' },
  { name: 'Ménage chambre', icon: '🧹', category: 'housekeeping', type: 'request', tab: 'hotel', team: 'housekeeping', free: true, price: 0, desc: 'Service de ménage programmé', pack: 'urban' },
  { name: 'Blanchisserie', icon: '👔', category: 'housekeeping', type: 'request', tab: 'hotel', team: 'housekeeping', free: false, price: 5000, desc: 'Lavage et repassage (24h)', pack: 'resort' },
  { name: 'Pressing express', icon: '👗', category: 'housekeeping', type: 'request', tab: 'hotel', team: 'housekeeping', free: false, price: 8000, desc: 'Pressing en 4h', pack: 'urban' },
  // MAINTENANCE
  { name: 'Réparation / Maintenance', icon: '🔧', category: 'maintenance', type: 'request', tab: 'hotel', team: 'maintenance', free: true, price: 0, desc: 'Signalez une panne (clim, TV, plomberie)', pack: 'resort' },
  { name: 'Climatisation', icon: '❄️', category: 'maintenance', type: 'request', tab: 'hotel', team: 'maintenance', free: true, price: 0, desc: 'Réglage ou panne climatisation', pack: 'urban' },
  { name: 'Wi-Fi assistance', icon: '📶', category: 'maintenance', type: 'info', tab: 'hotel', team: 'maintenance', free: true, price: 0, desc: 'Code Wi-Fi et assistance connexion', pack: 'urban' },
  // RESTAURATION
  { name: 'Room Service', icon: '🍽️', category: 'food', type: 'order', tab: 'hotel', team: 'kitchen', free: false, price: 0, desc: 'Commandez en chambre (menu disponible)', pack: 'resort' },
  { name: 'Petit-déjeuner en chambre', icon: '🥐', category: 'food', type: 'order', tab: 'hotel', team: 'kitchen', free: false, price: 7500, desc: 'Petit-déj livré en chambre (6h30-10h)', pack: 'resort' },
  { name: 'Réservation restaurant', icon: '🍴', category: 'food', type: 'booking', tab: 'hotel', team: 'reception', free: true, price: 0, desc: 'Réservez une table au restaurant de l\'hôtel', pack: 'urban' },
  { name: 'Minibar', icon: '🥤', category: 'food', type: 'order', tab: 'hotel', team: 'kitchen', free: false, price: 0, desc: 'Consommations minibar (voir prix)', pack: 'resort' },
  { name: 'Bar / Lounge', icon: '🍸', category: 'food', type: 'info', tab: 'hotel', team: 'reception', free: true, price: 0, desc: 'Horaires et menu du bar', pack: 'resort' },
  // SPA
  { name: 'Réservation Spa', icon: '💆', category: 'spa', type: 'booking', tab: 'hotel', team: 'spa', free: false, price: 25000, desc: 'Soins et massages (sur réservation)', pack: 'resort' },
  { name: 'Massage en chambre', icon: '🧘', category: 'spa', type: 'booking', tab: 'hotel', team: 'spa', free: false, price: 35000, desc: 'Massage dans votre chambre', pack: 'resort' },
  { name: 'Salle de sport', icon: '🏋️', category: 'spa', type: 'info', tab: 'hotel', team: 'reception', free: true, price: 0, desc: 'Horaires gym (6h-22h)', pack: 'urban' },
  { name: 'Piscine', icon: '🏊', category: 'spa', type: 'info', tab: 'hotel', team: 'reception', free: true, price: 0, desc: 'Horaires piscine (8h-20h)', pack: 'resort' },
  // RÉCEPTION
  { name: 'Réveil', icon: '⏰', category: 'reception', type: 'request', tab: 'hotel', team: 'reception', free: true, price: 0, desc: 'Demandez un réveil téléphonique', pack: 'urban' },
  { name: 'Navette aéroport', icon: '🚐', category: 'transport', type: 'booking', tab: 'hotel', team: 'reception', free: false, price: 15000, desc: 'Navette vers l\'aéroport (sur réservation)', pack: 'urban' },
  { name: 'Taxi', icon: '🚖', category: 'transport', type: 'booking', tab: 'hotel', team: 'reception', free: true, price: 0, desc: 'Appelez un taxi', pack: 'urban' },
  { name: 'Change / Bureau de change', icon: '💱', category: 'reception', type: 'info', tab: 'hotel', team: 'reception', free: true, price: 0, desc: 'Taux de change et horaires', pack: 'urban' },
  { name: 'Conciergerie', icon: '🛎️', category: 'reception', type: 'info', tab: 'hotel', team: 'reception', free: true, price: 0, desc: 'Conseils, réservations, infos pratiques', pack: 'resort' },
  { name: 'Check-out express', icon: '🏃', category: 'reception', type: 'request', tab: 'hotel', team: 'reception', free: true, price: 0, desc: 'Départ rapide sans file d\'attente', pack: 'urban' },
  { name: 'Bagagerie', icon: '🧳', category: 'reception', type: 'request', tab: 'hotel', team: 'reception', free: true, price: 0, desc: 'Déposez vos bagages à la réception', pack: 'urban' },
  // TRANSPORT
  { name: 'Location voiture', icon: '🚗', category: 'transport', type: 'booking', tab: 'hotel', team: 'reception', free: false, price: 25000, desc: 'Location voiture (partenaire)', pack: 'resort' },
  { name: 'Excursions', icon: '🚌', category: 'transport', type: 'booking', tab: 'tourism', team: 'reception', free: false, price: 20000, desc: 'Excursions et visites guidées', pack: 'resort' },
  // INFOS
  { name: 'Horaires petit-déjeuner', icon: '🥣', category: 'reception', type: 'info', tab: 'hotel', team: 'reception', free: true, price: 0, desc: '7h00 - 10h00', pack: 'urban' },
  { name: 'Horaires réception', icon: '🕒', category: 'reception', type: 'info', tab: 'hotel', team: 'reception', free: true, price: 0, desc: '24h/24', pack: 'urban' },
  { name: 'Règlement intérieur', icon: '📋', category: 'reception', type: 'info', tab: 'hotel', team: 'reception', free: true, price: 0, desc: 'Règles de l\'établissement', pack: 'urban' },
  // AIDE
  { name: 'Retour à l\'hôtel', icon: '📍', category: 'reception', type: 'info', tab: 'help', team: 'reception', free: true, price: 0, desc: 'Itinéraire Google Maps vers l\'hôtel', pack: 'urban' },
  { name: 'Urgences', icon: '🚑', category: 'reception', type: 'info', tab: 'help', team: 'reception', free: true, price: 0, desc: 'Numéros d\'urgence locaux', pack: 'urban' },
  { name: 'Je suis perdu', icon: '🆘', category: 'reception', type: 'request', tab: 'help', team: 'reception', free: true, price: 0, desc: 'Envoyez votre position à la réception', pack: 'urban' },
];

async function main() {
  console.log('🌱 Seeding ' + SERVICES.length + ' service templates...');
  await prisma.serviceTemplate.deleteMany({ where: { agencyId: null } });
  for (const s of SERVICES) {
    await prisma.serviceTemplate.create({
      data: {
        name: s.name, nameEn: s.name, nameEs: s.name,
        description: s.desc, descriptionEn: s.desc, descriptionEs: s.desc,
        icon: s.icon, type: s.type, category: s.category,
        displayTab: s.tab, assignedTeam: s.team,
        isFree: s.free, defaultPrice: s.price,
        defaultSchedule: s.free ? null : '{"days":"mon-sun","open":"07:00","close":"21:00"}',
        pack: s.pack, isActive: true,
      },
    });
  }
  console.log('✅ ' + SERVICES.length + ' services créés');
}

main().catch((e) => { console.error('❌', e); }).finally(() => prisma.$disconnect());
