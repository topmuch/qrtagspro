/**
 * QRTags — Données structurées pour les pages métiers détaillées
 * Chaque métier a sa propre page avec : hero, comment ça marche, exemples, branding, etc.
 */

export interface MetierExample {
  title: string;
  description: string;
  icon: string;
}

export interface MetierData {
  slug: string;
  title: string;
  icon: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string; // emoji ou illustration
  description: string;
  howItWorks: { step: string; title: string; desc: string }[];
  examples: MetierExample[];
  brandingTitle: string;
  brandingDesc: string;
  customFields: { name: string; desc: string }[];
  benefits: { title: string; desc: string; icon: string }[];
  accentColor: string;
}

export const METIERS: Record<string, MetierData> = {
  hotels: {
    slug: 'hotels',
    title: 'Hôtels',
    icon: '🏨',
    tagline: 'Effets personnels clients',
    heroTitle: 'Vos clients récupèrent leurs affaires en moins de 2h',
    heroSubtitle: 'QRTags pour hôtels — étiquetez les valises, électronique et effets personnels de vos clients. Quand un objet est perdu, le trouveur vous contacte via WhatsApp avec sa géolocalisation.',
    heroImage: '🏨',
    description: 'Dans un hôtel, les clients perdent régulièrement des effets personnels : chargeurs, téléphones, lunettes, bijoux, documents. Le personnel de réception passe des heures à gérer les "objets trouvés". QRTags digitalise ce processus : chaque objet étiqueté avec un tag QR devient traçable. Le client reçoit une notification WhatsApp instantanée dès qu\'un trouveur scanne le tag.',
    howItWorks: [
      { step: '01', title: 'Étiquetez les effets clients', desc: 'Collez un tag QRTags sur les valises, sacs, et prêtez des tags temporaires pour l\'électronique (chargeurs, laptops) à la réception.' },
      { step: '02', title: 'Le client active son tag', desc: 'Le client scanne le QR code avec son téléphone, remplit son nom, n° de chambre, dates de séjour et numéro WhatsApp. Le tag est associé à lui.' },
      { step: '03', title: 'En cas de perte', desc: 'Un trouveur (personnel de ménage, autre client, réception) scanne le QR. Une page s\'ouvre avec un bouton WhatsApp pré-rempli contenant sa géolocalisation.' },
      { step: '04', title: 'Le client est notifié', desc: 'Le client reçoit un message WhatsApp du trouveur avec la position exacte de l\'objet. Il peut organiser la récupération directement.' },
    ],
    examples: [
      { title: 'Chargeur iPhone oublié', description: 'Un client oublie son chargeur dans la chambre 304. Le personnel de ménage scanne le tag QRTags → le client reçoit un WhatsApp avec la position "Chambre 304, lit king-size".', icon: '🔌' },
      { title: 'Valise perdue au départ', description: 'Un client laisse sa valise dans le hall. Le bagagiste scanne le tag → le client est notifié avant même d\'avoir quitté l\'hôtel.', icon: '🧳' },
      { title: 'Lunettes dans le restaurant', description: 'Des lunettes oubliées au petit-déjeuner. Le serveur scanne le tag → le client descend les récupérer avant son check-out.', icon: '👓' },
      { title: 'Téléphone dans la salle de sport', description: 'Un téléphone oublié au fitness. Le coach scanne → le client est alerté en direct et évite une heure de panique.', icon: '📱' },
    ],
    brandingTitle: 'Votre page QRTags à votre image',
    brandingDesc: 'Quand un trouveur scanne un tag de votre hôtel, la page affiche votre logo, votre nom et vos coordonnées. Vous pouvez personnaliser les champs (n° chambre, dates de séjour) et le message pré-rempli WhatsApp. Vos clients ne voient jamais la marque QRTags — seulement votre établissement.',
    customFields: [
      { name: 'Nom du client', desc: 'Prénom et nom complet du client' },
      { name: 'N° de chambre', desc: 'Numéro de chambre attribué' },
      { name: 'Date d\'arrivée', desc: 'Date de check-in' },
      { name: 'Date de départ', desc: 'Date de check-out' },
      { name: 'Téléphone', desc: 'Numéro WhatsApp du client' },
    ],
    benefits: [
      { title: 'Réduction du lost & found', desc: 'Moins d\'objets non réclamés stockés en réception', icon: '📦' },
      { title: 'Satisfaction client ++', desc: 'Vos clients sont impressionnés par votre service', icon: '⭐' },
      { title: 'Gain de temps personnel', desc: 'Fini les appels et emails pour retrouver un propriétaire', icon: '⚡' },
      { title: 'Avis 5 étoiles', desc: 'Clients reconnaants → meilleurs avis TripAdvisor/Booking', icon: '🏆' },
    ],
    accentColor: '#FDB900',
  },

  ecoles: {
    slug: 'ecoles',
    title: 'Écoles',
    icon: '🎓',
    tagline: 'Cartables, uniformes, instruments',
    heroTitle: 'Fini les cartables perdus à la rentrée',
    heroSubtitle: 'QRTags pour écoles — étiquetez cartables, trousses, uniformes et instruments de musique. Les parents sont alertés par WhatsApp dès qu\'un objet est retrouvé.',
    heroImage: '🎓',
    description: 'Dans les écoles, collèges et lycées, les élèves perdent régulièrement cartables, trousses, gourdes, instruments de musique, vêtements de sport. L\'administration passe du temps à gérer les objets trouvés et à contacter les parents. QRTags permet à chaque élève d\'avoir ses effets étiquetés. Dès qu\'un objet est retrouvé, le parent reçoit une notification WhatsApp instantanée.',
    howItWorks: [
      { step: '01', title: 'Distribuez les tags aux élèves', desc: 'L\'école commande un lot de tags QRTags et les distribue aux élèves à la rentrée (ou aux parents via l\'APEL).' },
      { step: '02', title: 'Les parents activent les tags', desc: 'Le parent scanne le QR code, remplit le nom de l\'élève, la classe, son nom et numéro WhatsApp. Le tag est associé à l\'enfant.' },
      { step: '03', title: 'Objet perdu à l\'école', desc: 'Un cartable oublié en classe → le professeur ou un élève scanne le tag → le parent reçoit un WhatsApp avec la position (salle de classe).' },
      { step: '04', title: 'Objet retrouvé', desc: 'Le parent sait où récupérer le cartable. Plus besoin d\'appeler le secrétariat ou d\'attendre la fin des cours.' },
    ],
    examples: [
      { title: 'Cartable oublié en classe', description: 'Un élève oublie son cartable en salle 12. Le prof scanne le tag → le parent reçoit "Bonjour, cartable de Lucas retrouvé en salle 12".', icon: '🎒' },
      { title: 'Instrument de musique perdu', description: 'Une flûte oubliée au conservatoire. Le professeur scanne → le parent vient la récupérer avant le cours suivant.', icon: '🎵' },
      { title: 'Trousse après le sport', description: 'Une trousse oubliée au gymnase. Le professeur d\'EPS scanne → le parent est alerté en direct.', icon: '✏️' },
      { title: 'Veste de sport mélangée', description: 'Une veste d\'EPS oubliée dans le vestiaire. Un autre parent scanne → le propriétaire est identifié immédiatement.', icon: '👕' },
    ],
    brandingTitle: 'Page QRTags aux couleurs de l\'école',
    brandingDesc: 'Quand un trouveur scanne un tag QRTags de votre école, la page affiche le logo de l\'école et ses coordonnées. Vous pouvez personnaliser les champs (classe, nom du professeur principal) et configurer un message d\'accueil personnalisé. L\'image de marque de votre établissement est préservée.',
    customFields: [
      { name: 'Nom de l\'élève', desc: 'Prénom et nom de l\'élève' },
      { name: 'Classe', desc: 'Classe ou niveau (6ème B, CE2...)' },
      { name: 'Nom du parent', desc: 'Nom du parent ou tuteur' },
      { name: 'Téléphone parent', desc: 'Numéro WhatsApp du parent' },
    ],
    benefits: [
      { title: 'Moins d\'objets non réclamés', desc: 'Réduction de 90% des objets stockés en vie scolaire', icon: '📦' },
      { title: 'Parents sereins', desc: 'Plus besoin d\'appeler l\'administration', icon: '😌' },
      { title: 'Gain de temps vie scolaire', desc: 'Le personnel n\'appelle plus les parents un par un', icon: '⏰' },
      { title: 'Service à valeur ajoutée', desc: 'L\'école se démarque par son innovation', icon: '🌟' },
    ],
    accentColor: '#E3B23C',
  },

  consignes: {
    slug: 'consignes',
    title: 'Consignes',
    icon: '🛅',
    tagline: 'Bagages en gare, aéroport',
    heroTitle: 'Chaque bagage consigné est traçable',
    heroSubtitle: 'QRTags pour consignes — étiquetez les bagages déposés dans vos casiers. Le voyageur est alerté par WhatsApp dès qu\'un bagage est retrouvé ou mal positionné.',
    heroImage: '🛅',
    description: 'Dans les consignes automatiques de gares, aéroports et gares routières, les voyageurs déposent leurs bagages dans des casiers numérotés. En cas d\'oubli, de vol ou de casier ouvert par erreur, le staff doit identifier le propriétaire — un processus long et souvent infructueux. QRTags résout ce problème : chaque bagage déposé reçoit un tag temporaire lié au numéro de casier et au numéro WhatsApp du voyageur.',
    howItWorks: [
      { step: '01', title: 'Le voyageur dépose son bagage', desc: 'À la consigne, le voyageur reçoit un tag QRTags avec le numéro de casier. Il scanne, remplit son nom, n° de casier, heure de dépôt et numéro WhatsApp.' },
      { step: '02', title: 'Le bagage est tracé', desc: 'Le tag est associé au casier A-042, déposé à 14h30. Le statut est "en consigne".' },
      { step: '03', title: 'Bagage oublié après 24h', desc: 'Le staff ouvre le casier, scanne le tag → le voyageur reçoit un WhatsApp "Votre bagage est toujours au casier A-042. Merci de le récupérer."' },
      { step: '04', title: 'Bagage mal positionné', desc: 'Si un bagage est retrouvé hors de son casier, le scan permet d\'identifier son propriétaire en 10 secondes.' },
    ],
    examples: [
      { title: 'Bagage oublié 48h', description: 'Un voyageur oublie de récupérer sa valise. Le staff ouvre le casier, scanne → le voyageur reçoit un WhatsApp depuis l\'étranger et organise l\'envoi.', icon: '⏰' },
      { title: 'Bagage volé du casier', description: 'Un bagage est retrouvé abandonné hors de la consigne. Le scan du tag identifie immédiatement le propriétaire légitime.', icon: '🔍' },
      { title: 'Erreur de casier', description: 'Un voyageur ouvre le mauvais casier par erreur. Le tag QRTags du bagage confirme l\'identité du propriétaire.', icon: '✅' },
      { title: 'Casier laissé ouvert', description: 'Le staff referme le casier, scanne le tag et prévient le propriétaire que son bagage est sécurisé.', icon: '🔒' },
    ],
    brandingTitle: 'Page QRTags à l\'image de votre consigne',
    brandingDesc: 'Quand un trouveur scanne un tag QRTags, la page affiche le logo de votre consigne (SNCF, Aéroport de Paris, etc.) et vos coordonnées. Vous personnalisez les champs (n° casier, heure de dépôt, type de bagage) et le message WhatsApp pré-rempli.',
    customFields: [
      { name: 'N° casier', desc: 'Numéro du casier (A-042, B-117...)' },
      { name: 'Description bagage', desc: 'Type et couleur du bagage' },
      { name: 'Heure de dépôt', desc: 'Heure à laquelle le bagage a été déposé' },
      { name: 'Téléphone voyageur', desc: 'Numéro WhatsApp du voyageur' },
    ],
    benefits: [
      { title: 'Identification immédiate', desc: 'Plus besoin de fouiller les étiquettes de bagage', icon: '⚡' },
      { title: 'Réduction des litiges', desc: 'Preuve d\'appartenance en 10 secondes', icon: '⚖️' },
      { title: 'Bagages oubliés récupérés', desc: 'Le voyageur est alerté avant que le bagage ne soit détruit', icon: '📦' },
      { title: 'Image modernisée', desc: 'Votre consigne entre dans l\'ère du digital', icon: '🚀' },
    ],
    accentColor: '#FDB900',
  },

  loueurs: {
    slug: 'loueurs',
    title: 'Loueurs auto',
    icon: '🚗',
    tagline: 'Clés, documents, sièges enfant',
    heroTitle: 'Plus jamais de clés perdues ou de contrat égaré',
    heroSubtitle: 'QRTags pour loueurs auto — étiquetez clés, documents de location, sièges enfant et GPS. Le client est alerté par WhatsApp dès qu\'un objet est retrouvé.',
    heroImage: '🚗',
    description: 'Dans une agence de location automobile, les clients perdent régulièrement : clés du véhicule, contrat de location, carte grise, sièges enfant, GPS, chargeurs. Ces objets ont une valeur financière (une clé de voiture coûte 200-400€ à remplacer) et un impact opérationnel (un véhicule sans clé ne peut pas être reloué). QRTags permet d\'étiqueter chaque accessoire et document lié à la location.',
    howItWorks: [
      { step: '01', title: 'Étiquetez les accessoires', desc: 'Collez un tag QRTags sur les clés, porte-documents, sièges enfant et GPS. Chaque tag est associé au contrat de location.' },
      { step: '02', title: 'Activation à la prise en charge', desc: 'Le client scanne le QR code au comptoir, remplit son nom, n° de contrat, modèle et immatriculation du véhicule, et son numéro WhatsApp.' },
      { step: '03', title: 'Objet oublié après restitution', desc: 'Le client oublie ses clés personnelles dans la voiture restituée. Le staff scanne le tag QRTags de l\'étui → le client est alerté.' },
      { step: '04', title: 'Document perdu pendant la location', desc: 'Si le contrat ou la carte grise est égarée pendant la location, un trouveur peut scanner le tag et contacter le client directement.' },
    ],
    examples: [
      { title: 'Clés oubliées dans la voiture', description: 'Un client restitue le véhicule mais oublie ses clés personnelles dans la boîte à gants. Le staff scanne → le client revient les chercher.', icon: '🔑' },
      { title: 'Contrat perdu sur la route', description: 'Un conducteur perd le contrat de location sur une aire d\'autoroute. Un trouveur scanne le tag QRTags → le client est contacté via WhatsApp.', icon: '📄' },
      { title: 'Siège enfant oublié', description: 'Un siège enfant oublié dans le coffre. Le tag QRTags identifie le locataire → l\'agence lui renvoie le siège par colis.', icon: '👶' },
      { title: 'GPS laissé à l\'hôtel', description: 'Un client oublie le GPS de location à l\'hôtel. L\'hôtel scanne le tag → le client est alerté avant restitution.', icon: '📍' },
    ],
    brandingTitle: 'Page QRTags aux couleurs de votre agence',
    brandingDesc: 'Quand un trouveur scanne un tag de votre agence de location, la page affiche votre logo (Europcar, Hertz, Sixt, ou votre marque locale) et vos coordonnées. Vous personnalisez les champs (n° contrat, modèle véhicule, immatriculation) et le message WhatsApp pré-rempli avec votre signature.',
    customFields: [
      { name: 'Nom du locataire', desc: 'Prénom et nom du client' },
      { name: 'N° de contrat', desc: 'Numéro de contrat de location' },
      { name: 'Modèle voiture', desc: 'Marque et modèle du véhicule' },
      { name: 'Immatriculation', desc: 'Plaque d\'immatriculation' },
      { name: 'Téléphone', desc: 'Numéro WhatsApp du locataire' },
    ],
    benefits: [
      { title: 'Économie sur remplacements', desc: 'Une clé retrouvée = 200-400€ économisés', icon: '💰' },
      { title: 'Véhicule relouable immédiatement', desc: 'Pas d\'attente de duplication de clé', icon: '⚡' },
      { title: 'Satisfaction client ++', desc: 'Le client récupère ses affaires personnelles', icon: '⭐' },
      { title: 'Traçabilité des accessoires', desc: 'Vous savez qui a quoi à quel moment', icon: '📊' },
    ],
    accentColor: '#E3B23C',
  },

  cliniques: {
    slug: 'cliniques',
    title: 'Cliniques',
    icon: '🏥',
    tagline: 'Effets personnels patients',
    heroTitle: 'Vos patients récupèrent leurs effets personnels',
    heroSubtitle: 'QRTags pour cliniques — étiquetez lunettes, prothèses auditives, dentiers, vêtements et effets personnels des patients. Les familles sont alertées par WhatsApp.',
    heroImage: '🏥',
    description: 'Dans les cliniques, hôpitaux et EHPAD, les patients (souvent âgés ou désorientés) perdent régulièrement leurs effets personnels : lunettes, prothèses auditives, dentiers, montres, vêtements, bijoux. Le personnel soignant passe du temps à gérer les "objets trouvés" et à contacter les familles. QRTags permet d\'étiqueter les effets personnels dès l\'admission et d\'alerter les familles en cas de perte.',
    howItWorks: [
      { step: '01', title: 'Étiquetez les effets à l\'admission', desc: 'À l\'admission du patient, le personnel étiquette les effets personnels (lunettes, prothèses, montres) avec des tags QRTags.' },
      { step: '02', title: 'La famille active le tag', desc: 'La famille scanne le QR code, remplit le nom du patient, n° de dossier, chambre, et numéro WhatsApp d\'urgence.' },
      { step: '03', title: 'Effet égaré pendant le séjour', desc: 'Le patient perd ses lunettes. Le personnel scanne le tag → la famille reçoit un WhatsApp "Lunettes de M. Dupont retrouvées en salle de soins".' },
      { step: '04', title: 'Sortie du patient', desc: 'À la sortie, tous les tags sont vérifiés. Le personnel sait immédiatement si un effet personnel manque.' },
    ],
    examples: [
      { title: 'Lunettes perdues en radiologie', description: 'Un patient oublie ses lunettes en radiologie. Le personnel scanne → la famille est alertée et vient les récupérer.', icon: '👓' },
      { title: 'Prothèse auditive égarée', description: 'Une prothèse auditive tombée dans le lit. Le personnel scanne le tag → la famille est prévenue immédiatement.', icon: '👂' },
      { title: 'Dentier oublié au restaurant', description: 'Un dentier oublié dans la salle à manger. Le personnel scanne → le patient le récupère avant la nuit.', icon: '🦷' },
      { title: 'Vêtements mélangés', description: 'Des vêtements mélangés avec ceux d\'un autre patient. Le tag QRTags identifie le propriétaire légitime.', icon: '👕' },
    ],
    brandingTitle: 'Page QRTags aux couleurs de votre clinique',
    brandingDesc: 'Quand un trouveur scanne un tag de votre clinique, la page affiche votre logo (clinique, hôpital, EHPAD) et vos coordonnées. Vous personnalisez les champs (n° dossier, chambre, contact d\'urgence) et le message WhatsApp pré-rempli avec respect de la confidentialité.',
    customFields: [
      { name: 'Nom du patient', desc: 'Prénom et nom du patient' },
      { name: 'N° dossier', desc: 'Numéro de dossier médical' },
      { name: 'Chambre', desc: 'Numéro de chambre' },
      { name: 'Contact d\'urgence', desc: 'Numéro WhatsApp de la famille' },
    ],
    benefits: [
      { title: 'Patients sereins', desc: 'Moins d\'anxiété liée à la perte d\'effets personnels', icon: '😌' },
      { title: 'Familles rassurées', desc: 'Notification immédiate en cas de perte', icon: '👨‍👩‍👧' },
      { title: 'Gain de temps personnel', desc: 'Fini les appels aux familles pour les objets trouvés', icon: '⏰' },
      { title: 'Coût prothèses évité', desc: 'Une prothèse auditive retrouvée = 1500€ économisés', icon: '💰' },
    ],
    accentColor: '#FDB900',
  },

  autres: {
    slug: 'autres',
    title: 'Autres métiers',
    icon: '📦',
    tagline: 'Bibliothèques, événementiel, logistique',
    heroTitle: 'QRTags s\'adapte à tous les métiers',
    heroSubtitle: 'QRTags pour autres métiers — bibliothèques, événementiel, logistique, coworking, salles de sport. Tout objet de valeur peut être étiqueté et tracé.',
    heroImage: '📦',
    description: 'QRTags n\'est pas limité à un secteur. Toute entreprise qui gère des objets de valeur (matériel, documents, équipements) peut utiliser QRTags pour les tracer. Bibliothèques (livres empruntés), événementiel (matériel audiovisuel), logistique (colis sensibles), coworking (matériel informatique), salles de sport (objets oubliés dans les vestiaires), musées (audio-guides), etc.',
    howItWorks: [
      { step: '01', title: 'Identifiez vos objets à risque', desc: 'Listez les objets que vos clients ou utilisateurs perdent régulièrement : matériel, documents, équipements.' },
      { step: '02', title: 'Étiquetez avec QRTags', desc: 'Collez un tag QRTags sur chaque objet. Configurez les champs personnalisés selon votre métier.' },
      { step: '03', title: 'Activation par l\'utilisateur', desc: 'L\'utilisateur scanne, remplit ses infos et son numéro WhatsApp. L\'objet est désormais tracé.' },
      { step: '04', title: 'Perte & trouvaille', desc: 'Un trouveur scanne → l\'utilisateur est notifié par WhatsApp avec la géolocalisation.' },
    ],
    examples: [
      { title: 'Bibliothèque — livre oublié', description: 'Un lecteur oublie un livre emprunté dans les transports. Un trouveur scanne le tag QRTags → la bibliothèque et le lecteur sont alertés.', icon: '📚' },
      { title: 'Événementiel — micro perdu', description: 'Un micro oublié après un événement. Le staff scanne le tag QRTags du micro → le prestataire est identifié.', icon: '🎤' },
      { title: 'Coworking — laptop oublié', description: 'Un laptop oublié dans un open space. Le community manager scanne → le propriétaire revient le chercher.', icon: '💻' },
      { title: 'Salle de sport — casque audio', description: 'Un casque oublié dans le vestiaire. Le coach scanne le tag → le membre est alerté en direct.', icon: '🎧' },
    ],
    brandingTitle: 'Page QRTags 100% personnalisable',
    brandingDesc: 'Quel que soit votre métier, QRTags s\'adapte. Vous personnalisez les champs dynamiques, le logo, les couleurs et le message WhatsApp. La page trouveur affiche votre marque, pas QRTags.',
    customFields: [
      { name: 'Nom du propriétaire', desc: 'Prénom et nom' },
      { name: 'Description de l\'objet', desc: 'Type et description de l\'objet' },
      { name: 'Téléphone', desc: 'Numéro WhatsApp du propriétaire' },
      { name: 'Champs personnalisés', desc: 'Ajoutez vos propres champs selon votre métier' },
    ],
    benefits: [
      { title: 'Solution sur-mesure', desc: 'S\'adapte à n\'importe quel métier', icon: '🎯' },
      { title: 'Marque préservée', desc: 'Votre logo, vos couleurs, votre image', icon: '🎨' },
      { title: 'Coût maîtrisé', desc: 'Un tag = quelques centimes, un objet retrouvé = 100€+', icon: '💰' },
      { title: 'Innovation différenciante', desc: 'Vos concurrents n\'ont pas encore QRTags', icon: '🚀' },
    ],
    accentColor: '#E3B23C',
  },
};

export const WORKFLOW_STEPS_DATA: Record<string, {
  step: string;
  title: string;
  icon: string;
  heroTitle: string;
  heroSubtitle: string;
  description: string;
  details: { title: string; desc: string; icon: string }[];
  examples: { title: string; desc: string }[];
  nextStep?: { slug: string; title: string };
  prevStep?: { slug: string; title: string };
}> = {
  '1-generation': {
    step: '01',
    title: 'Génération QR',
    icon: '🔢',
    heroTitle: 'Le Superadmin génère des lots de QR codes',
    heroSubtitle: 'Étape 1 du workflow QRTags — Le Superadmin crée des lots de QR codes uniques et les assigne aux entreprises partenaires.',
    description: 'Tout commence ici. Le Superadmin (l\'équipe QRTags ou votre administrateur interne) génère des lots de QR codes via le dashboard admin. Chaque lot contient N tags (10, 100, 1000...) avec des références uniques au format QRT26-XXXXXX. Une fois le lot généré, il peut être assigné à une entreprise partenaire (hôtel, école, etc.) qui recevra les tags physiques.',
    details: [
      { title: 'Création du lot', desc: 'Le Superadmin saisit le nombre de tags souhaité, sélectionne l\'entreprise destinataire (optionnel) et valide.', icon: '📦' },
      { title: 'Génération automatique', desc: 'Le système crée N références uniques au format QRT26-XXXXXX + N QR codes PNG haute résolution.', icon: '⚡' },
      { title: 'Assignation entreprise', desc: 'Si une entreprise est sélectionnée, le lot est directement assigné. Sinon, il reste en stock central.', icon: '🏢' },
      { title: 'Export ZIP', desc: 'Le Superadmin peut télécharger un ZIP contenant tous les QR codes PNG + un PDF A4 pour impression d\'étiquettes.', icon: '📥' },
    ],
    examples: [
      { title: 'Hôtel Le Royal — 200 tags', desc: 'Le Superadmin génère un lot de 200 tags QRTags assignés à l\'hôtel Le Royal. L\'hôtel reçoit les QR codes par email + colis physique.' },
      { title: 'Stock central — 1000 tags', desc: 'Le Superadmin génère 1000 tags en stock central. Ils seront assignés au fur et à mesure aux nouvelles entreprises.' },
    ],
    nextStep: { slug: '2-vente', title: 'Vente au client' },
  },
  '2-vente': {
    step: '02',
    title: 'Vente au client',
    icon: '💰',
    heroTitle: 'L\'entreprise vend les tags à ses clients',
    heroSubtitle: 'Étape 2 du workflow QRTags — L\'entreprise revend les tags QRTags à ses clients finaux et trace chaque vente dans son dashboard.',
    description: 'L\'entreprise partenaire (hôtel, école, loueur, etc.) reçoit son lot de tags QRTags. Elle les revend (ou les prête) à ses clients. Chaque vente est enregistrée dans le dashboard agence : on sait quel tag a été vendu, à qui, et quand. Le statut du tag passe de "En stock" à "Vendu".',
    details: [
      { title: 'Réception du lot', desc: 'L\'entreprise reçoit ses tags physiques (étiquettes autocollantes ou cartes PVC) + accès au dashboard.', icon: '📦' },
      { title: 'Vente au client', desc: 'L\'entreprise vend un tag à un client. Le vendeur scanne le tag ou saisit sa référence pour le marquer comme "Vendu".', icon: '💳' },
      { title: 'Traçabilité', desc: 'Le dashboard agence montre : tags en stock, vendus, activés, perdus, retrouvés. Statistiques en temps réel.', icon: '📊' },
      { title: 'Facturation', desc: 'Chaque vente peut être facturée. TagSale enregistre le prix, le client et la date.', icon: '🧾' },
    ],
    examples: [
      { title: 'Hôtel — vente à la réception', desc: 'Le client achète un tag QRTags à 5€ à la réception pour étiqueter sa valise. Le réceptionniste le marque comme "Vendu" dans le dashboard.' },
      { title: 'École — inclusion frais de scolarité', desc: 'L\'école inclut 3 tags QRTags dans les frais de rentrée. Chaque élève reçoit ses tags en début d\'année.' },
    ],
    prevStep: { slug: '1-generation', title: 'Génération QR' },
    nextStep: { slug: '3-activation', title: 'Activation' },
  },
  '3-activation': {
    step: '03',
    title: 'Activation',
    icon: '✅',
    heroTitle: 'Le client active son tag QRTags',
    heroSubtitle: 'Étape 3 du workflow QRTags — Le client scanne son QR code, remplit ses infos et l\'associe à son objet. Le tag est désormais protégé.',
    description: 'Le client final (le voyageur, l\'élève, le patient) reçoit son tag QRTags. Il scanne le QR code avec son smartphone, arrive sur une page d\'activation, remplit ses informations (nom, prénom, numéro WhatsApp, champs spécifiques au métier) et associe le tag à son objet. À partir de ce moment, le tag est "Actif" et protégé.',
    details: [
      { title: 'Scan du QR code', desc: 'Le client utilise l\'appareil photo de son smartphone pour scanner le QR code du tag.', icon: '📱' },
      { title: 'Page d\'activation', desc: 'Une page s\'ouvre avec le logo de l\'entreprise, les champs à remplir (nom, téléphone, champs métier) et un bouton "Activer".', icon: '📝' },
      { title: 'Validation', desc: 'Le client valide. Le tag passe de "Vendu" à "Actif". Le client reçoit un code PIN pour éditer ses infos plus tard.', icon: '🔐' },
      { title: 'Tag protégé', desc: 'Dès maintenant, si quelqu\'un scanne ce tag, la page trouveur s\'ouvrira avec un bouton WhatsApp pour contacter le propriétaire.', icon: '🛡️' },
    ],
    examples: [
      { title: 'Voyageur active sa valise', desc: 'Marie achète un tag à l\'hôtel, scanne, remplit "Marie Dupont, chambre 304, du 15 au 18 août, +33 6 12 34 56 78". Sa valise est protégée.' },
      { title: 'Parent active le cartable', desc: 'Le parent de Lucas scanne le tag, remplit "Lucas Martin, 6ème B, Sophie Martin parent, +33 6 98 76 54 32". Le cartable est protégé.' },
    ],
    prevStep: { slug: '2-vente', title: 'Vente au client' },
    nextStep: { slug: '4-perte-trouvaille', title: 'Perte & trouvaille' },
  },
  '4-perte-trouvaille': {
    step: '04',
    title: 'Perte & trouvaille',
    icon: '🎯',
    heroTitle: 'Le trouveur contacte le propriétaire via WhatsApp',
    heroSubtitle: 'Étape 4 du workflow QRTags — Un trouveur scanne le QR, la page WAME s\'ouvre avec sa géolocalisation, le propriétaire est contacté instantanément.',
    description: 'L\'objet est perdu. Un trouveur (passant, personnel, autre client) le découvre et scanne le tag QRTags. La page trouveur s\'ouvre automatiquement : elle affiche le prénom du propriétaire et la référence du tag. Le trouveur clique sur "Contacter le propriétaire via WhatsApp". Un message pré-rempli s\'ouvre dans WhatsApp avec sa géolocalisation GPS. Le propriétaire reçoit la notification en direct.',
    details: [
      { title: 'Le trouveur scanne', desc: 'Le trouveur utilise l\'appareil photo de son smartphone pour scanner le QR code sur l\'objet trouvé.', icon: '📱' },
      { title: 'Page trouveur', desc: 'Une page s\'ouvre avec le prénom du propriétaire, la référence et un grand bouton jaune "Contacter via WhatsApp".', icon: '🌐' },
      { title: 'Géolocalisation', desc: 'Le navigateur demande l\'autorisation de géolocalisation. Si acceptée, la position GPS est incluse dans le message WhatsApp.', icon: '📍' },
      { title: 'WhatsApp WAME', desc: 'Le trouveur clique → WhatsApp s\'ouvre avec un message pré-rempli. Le propriétaire reçoit le message instantanément.', icon: '💬' },
      { title: 'Récupération', desc: 'Le propriétaire et le trouveur conviennent d\'un point de rendez-vous. L\'objet est récupéré.', icon: '🤝' },
    ],
    examples: [
      { title: 'Valise à l\'aéroport', desc: 'Un trouveur scanne la valise de Marie. WhatsApp s\'ouvre : "Bonjour Marie, j\'ai trouvé votre objet (réf. QRT26-MLQGY7). Je suis à la position : https://maps.google.com/?q=48.85,2.35". Marie récupère sa valise en 30 minutes.' },
      { title: 'Cartable en classe', desc: 'Le professeur scanne le cartable de Lucas. Le parent reçoit : "Bonjour Sophie, cartable de Lucas retrouvé en salle 12". Sophie vient le récupérer à 16h.' },
    ],
    prevStep: { slug: '3-activation', title: 'Activation' },
  },
};

export const FEATURES_DATA: Record<string, {
  slug: string;
  icon: string;
  title: string;
  heroTitle: string;
  heroSubtitle: string;
  description: string;
  benefits: { title: string; desc: string }[];
  howItWorks: string[];
  examples: { title: string; desc: string }[];
}> = {
  contact: {
    slug: 'contact',
    icon: '⚡',
    title: 'Contact instantané',
    heroTitle: 'Le propriétaire est contacté en 1 clic',
    heroSubtitle: 'WhatsApp WAME (click-to-chat) pré-rempli avec la géolocalisation du trouveur. Aucune app à installer.',
    description: 'Quand un trouveur scanne un tag QRTags, il n\'a rien à installer. La page trouveur s\'ouvre dans son navigateur, il clique sur un bouton et WhatsApp s\'ouvre avec un message déjà rédigé. Le propriétaire reçoit le message instantanément. C\'est la méthode la plus simple et la plus rapide — basée sur WhatsApp WAME (wa.me), gratuite et sans API payante.',
    benefits: [
      { title: 'Zéro friction', desc: 'Le trouveur n\'installe rien, ne crée pas de compte. Il scanne, clique, c\'est fait.' },
      { title: 'Gratuit', desc: 'Pas de WhatsApp Business API payante. WAME est 100% gratuit.' },
      { title: 'Universel', desc: 'WhatsApp est installé sur 2 milliards de téléphones dans le monde.' },
      { title: 'Instantané', desc: 'Le propriétaire reçoit la notification en quelques secondes.' },
    ],
    howItWorks: [
      'Le trouveur scanne le QR code avec son smartphone',
      'La page trouveur s\'ouvre dans son navigateur (pas d\'app)',
      'Il remplit son prénom et son téléphone (optionnel)',
      'Il clique sur "Contacter le propriétaire via WhatsApp"',
      'WhatsApp s\'ouvre avec un message pré-rempli',
      'Le propriétaire reçoit le message instantanément',
    ],
    examples: [
      { title: 'Aéroport', desc: 'Un voyageur retrouve une valise. Il scanne, clique, envoie. Le propriétaire reçoit le message avant même d\'avoir signalé la perte.' },
      { title: 'Hôtel', desc: 'Le personnel de ménage trouve un chargeur. Il scanne, clique, le client est alerté avant son check-out.' },
    ],
  },
  geoloc: {
    slug: 'geoloc',
    icon: '📍',
    title: 'Géolocalisation GPS',
    heroTitle: 'Position précise envoyée automatiquement',
    heroSubtitle: 'Position précise du trouveur envoyée automatiquement au propriétaire via Google Maps.',
    description: 'Quand le trouveur clique sur "Contacter via WhatsApp", le navigateur demande l\'autorisation d\'accéder à sa position GPS. Si acceptée, un lien Google Maps avec ses coordonnées exactes est inclus dans le message WhatsApp. Le propriétaire voit exactement où se trouve son objet sur une carte.',
    benefits: [
      { title: 'Position exacte', desc: 'GPS précis à 5 mètres près, pas juste une adresse approximative.' },
      { title: 'Lien Google Maps', desc: 'Clic sur le lien → Google Maps s\'ouvre avec itinéraire.' },
      { title: 'Optionnel', desc: 'Si le trouveur refuse la géoloc, il peut saisir un lieu manuellement.' },
      { title: 'Respectueux RGPD', desc: 'La position n\'est partagée qu\'avec le propriétaire, jamais stockée.' },
    ],
    howItWorks: [
      'Le trouveur clique sur le bouton WhatsApp',
      'Le navigateur demande : "Autoriser l\'accès à votre position ?"',
      'Si accepté : GPS récupéré (lat, long)',
      'Un lien https://maps.google.com/?q=lat,long est généré',
      'Ce lien est inclus dans le message WhatsApp pré-rempli',
      'Le propriétaire clique sur le lien dans WhatsApp → Google Maps s\'ouvre',
    ],
    examples: [
      { title: 'Valise en gare', desc: 'Le trouveur partage sa position : "Gare de Lyon, quai 12". Le propriétaire vient directement.' },
      { title: 'Cartable en classe', desc: 'Le prof partage la position de l\'école. Le parent sait que le cartable est en sécurité.' },
    ],
  },
  rgpd: {
    slug: 'rgpd',
    icon: '🔒',
    title: 'Aucune donnée sensible',
    heroTitle: 'Le trouveur ne voit que le prénom et la référence',
    heroSubtitle: 'Le trouveur ne voit que le prénom du propriétaire et la référence. Le numéro WhatsApp n\'est révélé qu\'au clic.',
    description: 'QRTags respecte le RGPD. Le trouveur ne voit JAMAIS le numéro de téléphone du propriétaire. Il voit seulement : le prénom, la référence du tag, et le type d\'objet. Le numéro WhatsApp n\'est révélé qu\'au moment où le trouveur clique sur le bouton — et même là, c\'est WhatsApp qui gère la communication, pas QRTags.',
    benefits: [
      { title: 'Numéro caché', desc: 'Le trouveur ne voit jamais le numéro WhatsApp du propriétaire.' },
      { title: 'Données minimales', desc: 'Seuls le prénom et la référence sont affichés.' },
      { title: 'RGPD compliant', desc: 'Conforme au RGPD européen. Droit à l\'oubli, export des données.' },
      { title: 'PIN propriétaire', desc: 'Le propriétaire a un PIN pour éditer ses infos ou désactiver son tag.' },
    ],
    howItWorks: [
      'Le trouveur scanne le tag',
      'La page affiche : "Objet de Marie (réf. QRT26-MLQGY7)" — c\'est tout',
      'Pas de nom de famille, pas de téléphone, pas d\'email',
      'Le trouveur clique sur "Contacter via WhatsApp"',
      'WhatsApp s\'ouvre avec le numéro du propriétaire — mais le trouveur ne le voit pas dans QRTags',
      'Le propriétaire peut éditer ses infos avec son PIN ou désactiver le tag à tout moment',
    ],
    examples: [
      { title: 'Anonymat préservé', desc: 'Un trouveur scanne : il voit juste "Objet de Marie". Il ne sait pas qui est Marie, où elle habite, ni son numéro.' },
      { title: 'Désactivation', desc: 'Le propriétaire peut désactiver son tag (QR inactif) s\'il ne veut plus être contacté. La page trouveur affiche alors "QR désactivé par le propriétaire".' },
    ],
  },
  multilingue: {
    slug: 'multilingue',
    icon: '🌍',
    title: 'Multilingue',
    heroTitle: 'La page trouveur s\'adapte automatiquement',
    heroSubtitle: 'La page trouveur s\'adapte automatiquement en FR / EN / AR selon la langue du navigateur.',
    description: 'QRTags est multilingue. La page trouveur détecte automatiquement la langue du navigateur du trouveur et affiche l\'interface dans sa langue. Actuellement supporté : Français, Anglais, Arabe (avec support RTL). Le message WhatsApp pré-rempli est aussi traduit. Si un voyageur français perd sa valise à Tokyo, le trouveur japonais aura l\'interface en anglais (langue de fallback) — mais le propriétaire recevra le message dans sa langue.',
    benefits: [
      { title: 'Auto-détection', desc: 'La langue est détectée automatiquement selon le navigateur.' },
      { title: '3 langues', desc: 'Français, Anglais, Arabe (RTL). Extension possible à d\'autres langues.' },
      { title: 'Fallback intelligent', desc: 'Si la langue n\'est pas supportée, fallback sur l\'anglais.' },
      { title: 'Message WhatsApp traduit', desc: 'Le message pré-rempli est dans la langue du trouveur.' },
    ],
    howItWorks: [
      'Le trouveur scanne le tag depuis son smartphone',
      'QRTags détecte la langue de son navigateur (Accept-Language header)',
      'L\'interface s\'affiche dans sa langue (FR, EN ou AR)',
      'Le message WhatsApp pré-rempli est traduit dans sa langue',
      'Le propriétaire reçoit le message — il peut le faire traduire dans son app',
    ],
    examples: [
      { title: 'Voyageur français à Tokyo', desc: 'Marie perd sa valise à Tokyo. Le trouveur japonais a son navigateur en JA. QRTags fallback en anglais. Le message WhatsApp est en anglais, Marie le comprend.' },
      { title: 'Voyageur marocain à Dubai', desc: 'Karim perd son sac à Dubai. Le trouveur émirati a son navigateur en AR. L\'interface s\'affiche en arabe (RTL).' },
    ],
  },
  tracabilite: {
    slug: 'tracabilite',
    icon: '📊',
    title: 'Traçabilité complète',
    heroTitle: 'Chaque scan est journalisé',
    heroSubtitle: 'Chaque scan est journalisé (position, heure, contexte). L\'entreprise voit tout depuis son dashboard.',
    description: 'QRTags journalise chaque scan de tag. L\'entreprise voit depuis son dashboard : combien de scans par tag, à quelle heure, depuis quelle position, par qui. Cela permet de détecter les scans suspects (multiples scans depuis des pays différents), de mesurer l\'efficacité des tags, et d\'avoir un audit trail complet.',
    benefits: [
      { title: 'Audit trail', desc: 'Chaque scan est enregistré avec timestamp, position et finder.' },
      { title: 'Détection de fraude', desc: 'Scans suspects détectés (pays différents, IPs multiples).' },
      { title: 'Statistiques', desc: 'KPIs : tags activés, scans/mois, taux de récupération.' },
      { title: 'Export', desc: 'Export CSV/JSON des données pour analyse externe.' },
    ],
    howItWorks: [
      'Chaque scan du tag crée une entrée ScanLog en base',
      'Enregistré : référence du tag, timestamp, position GPS, IP, finder name/phone',
      'Le dashboard agence affiche la liste des scans par tag',
      'Les scans suspects (multiples IPs, pays différents) sont signalés',
      'L\'entreprise peut exporter les données en CSV',
    ],
    examples: [
      { title: 'Hôtel — 5 scans en 2h', desc: 'Le dashboard montre qu\'un tag a été scanné 5 fois en 2h depuis 3 pays différents. Alerte fraude envoyée.' },
      { title: 'École — stats mensuelles', desc: 'L\'école voit : 50 tags activés, 3 scans ce mois-ci, 2 objets retrouvés. ROI mesurable.' },
    ],
  },
  'multi-metiers': {
    slug: 'multi-metiers',
    icon: '🏢',
    title: 'Multi-métiers',
    heroTitle: 'Champs dynamiques selon votre activité',
    heroSubtitle: 'Hôtels, écoles, consignes, loueurs, cliniques — champs dynamiques selon votre activité.',
    description: 'QRTags est multi-métiers. Chaque type d\'entreprise a ses propres champs dynamiques. Un hôtel demandera "N° de chambre, dates de séjour", une école "Classe, nom du parent", un loueur "N° de contrat, immatriculation". Ces champs sont stockés en JSON dans le tag (custom_data) — pas besoin de créer 50 tables différentes. Le formulaire d\'activation s\'adapte automatiquement au type d\'agence.',
    benefits: [
      { title: 'Champs sur-mesure', desc: 'Chaque métier a ses propres champs (N° chambre, N° casier, N° contrat...)' },
      { title: 'Stockage JSON', desc: 'Pas de table SQL par métier — un seul champ custom_data JSON.' },
      { title: 'Formulaire dynamique', desc: 'Le formulaire d\'activation affiche les bons champs selon l\'agence.' },
      { title: '6 métiers prédéfinis', desc: 'Hôtels, écoles, consignes, loueurs, cliniques, autres.' },
    ],
    howItWorks: [
      'L\'agence sélectionne son type à l\'inscription (hôtel, école...)',
      'QRTags configure automatiquement les champs dynamiques correspondants',
      'Quand le client active son tag, le formulaire affiche les bons champs',
      'Les données sont stockées en JSON dans le tag (custom_data)',
      'Le dashboard agence et la page trouveur affichent ces données contextualisées',
    ],
    examples: [
      { title: 'Hôtel', desc: 'Champs : nom client, N° chambre, date arrivée, date départ, téléphone.' },
      { title: 'École', desc: 'Champs : nom élève, classe, nom parent, téléphone parent.' },
      { title: 'Consigne', desc: 'Champs : N° casier, description bagage, heure dépôt, téléphone voyageur.' },
    ],
  },
};
