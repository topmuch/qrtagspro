/**
 * Seed script — Module QRTags Host (Conciergerie digitale Airbnb)
 * Crée un appartement de test à Dakar (Almadies) avec un HouseGuide complet.
 * Run: npm run db:seed:host
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding QRTags Host module...\n');

  const apartment = await prisma.agency.upsert({
    where: { slug: 'appartement-almadies' },
    update: {
      name: 'Appartement Almadies',
      email: 'awa.diop@qrtags-host.example',
      phone: '+221 77 555 12 34',
      contactPhone: '+221 77 555 12 34',
      address: 'Route des Almadies, Dakar',
      agencyType: 'airbnb',
      braceletProfile: 'HOST',
      latitude: 14.7497,
      longitude: -17.5169,
      logoUrl: 'https://placehold.co/200x200/B45309/FFFFFF/png?text=AWA',
    },
    create: {
      id: 'demo-host-almadies',
      name: 'Appartement Almadies',
      slug: 'appartement-almadies',
      email: 'awa.diop@qrtags-host.example',
      phone: '+221 77 555 12 34',
      contactPhone: '+221 77 555 12 34',
      address: 'Route des Almadies, Dakar',
      agencyType: 'airbnb',
      braceletProfile: 'HOST',
      latitude: 14.7497,
      longitude: -17.5169,
      logoUrl: 'https://placehold.co/200x200/B45309/FFFFFF/png?text=AWA',
    },
  });
  console.log(`   ✓ Agency: ${apartment.name} (slug: ${apartment.slug}, type: ${apartment.agencyType})`);

  const tutorials = JSON.stringify([
    { title: 'Comment allumer la climatisation', description: 'Télécommande sur la table de nuit. Mode Cool, 22°C.' },
    { title: 'Ouvrir la porte du parking', description: 'Code : 4592. Tapez le code sur le clavier à droite du portail.' },
    { title: 'Utiliser la machine à café', description: 'Dosettes dans le tiroir. Bouton rouge pour allumer.' },
    { title: 'WiFi — se connecter', description: 'Réseau : Almadies-Wifi-5G · Mot de passe : Bienvenue2026' },
  ]);

  const photos = JSON.stringify([
    { type: 'cover', url: 'https://placehold.co/600x400/B45309/FFFFFF/png?text=Appartement+Almadies' },
    { type: 'wifi', url: 'https://placehold.co/400x300/1E40AF/FFFFFF/png?text=WiFi+Info' },
  ]);

  const existingGuide = await prisma.houseGuide.findUnique({ where: { agencyId: apartment.id } });

  await prisma.houseGuide.upsert({
    where: { id: existingGuide?.id || 'nonexistent' },
    update: {
      wifiNetwork: 'Almadies-Wifi-5G',
      wifiPassword: 'Bienvenue2026',
      checkInInstructions: '## Arrivée\n1. Boîte à clés : code **4592**\n2. 3ème étage, porte gauche\n3. Ascenseur → 3B',
      checkOutInstructions: '## Départ\n1. Déposez les clés dans la boîte\n2. Fermez les fenêtres\n3. Éteignez la clim\n4. Check-out avant 11h',
      checkInTime: '15:00',
      checkOutTime: '11:00',
      houseRules: '## Règles\n✅ Fumeurs sur le balcon\n✅ Animaux (sur demande)\n❌ Fêtes après 22h\n❌ Bougies',
      homeTutorials: tutorials,
      hostRecommendations: '## Mes adresses\n### Restaurants\n- **Le Khaymandar** (50m) — gastronomique\n- **Chez Loutcha** (200m) — cap-vergien\n### Plages\n- **Plage de N\'Gor** (10 min à pied)\n💡 Mentionnez "Awa" au Khaymandar pour -10%',
      hostName: 'Awa Diop',
      hostPhone: '+221 77 555 12 34',
      hostWelcomeMessage: 'Bienvenue chez moi ! Je suis Awa, votre hôte. N\'hésitez pas à me contacter pour quoi que ce soit. Bon séjour à Dakar ! 🌴',
      photos,
      isActive: true,
    },
    create: {
      agencyId: apartment.id,
      wifiNetwork: 'Almadies-Wifi-5G',
      wifiPassword: 'Bienvenue2026',
      checkInTime: '15:00',
      checkOutTime: '11:00',
      homeTutorials: tutorials,
      photos,
      hostName: 'Awa Diop',
      hostPhone: '+221 77 555 12 34',
      hostWelcomeMessage: 'Bienvenue !',
      isActive: true,
    },
  });

  console.log(`   ✓ HouseGuide créé (WiFi: Almadies-Wifi-5G, Hôte: Awa Diop)`);
  console.log(`\n🧪 Test: /welcome/appartement-almadies?context=WRISTBAND`);
}

main().catch((e) => { console.error('❌ Failed:', e); process.exit(1); }).finally(() => prisma.$disconnect());
