/**
 * Seed du référentiel ModeleAppareil — version CJS (exécutable avec node dans Docker)
 * Lance: node scripts/seed-modeles-appareils.cjs
 *
 * Catalogue : Nespresso, Dolce Gusto, Bosch, Indesit, Whirlpool, Samsung, LG, Philips,
 *             Daikin, Mitsubishi, Nest, Netatmo, Intex, Bestway, Weber, Campingaz
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── Helpers JSON i18n ───
const etapes = (fr, en, es) => JSON.stringify({ fr, en, es });
const depannage = (items) => JSON.stringify({
  fr: items.map(i => ({ problem: i[0].fr, solution: i[1].fr })),
  en: items.map(i => ({ problem: i[0].en, solution: i[1].en })),
  es: items.map(i => ({ problem: i[0].es, solution: i[1].es })),
});

const MODELES = [
  // ─── CAFETIÈRES ───
  {
    category: 'coffee', brand: 'Nespresso', model: 'Essenza Mini',
    photoUrl: 'https://m.media-amazon.com/images/I/61y6u0z3URL._AC_SX679_.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=ZbVQy1r5bLw',
    searchKey: 'nespresso essenza mini krups delonghi',
    etapes: etapes(
      ['Placez une capsule dans le compartiment', 'Refermez le levier', 'Positionnez une tasse', 'Appuyez sur Espresso (40ml) ou Lungo (110ml)'],
      ['Place a capsule in the compartment', 'Close the lever', 'Position a cup', 'Press Espresso (40ml) or Lungo (110ml)'],
      ['Coloque una cápsula en el compartimento', 'Cierre la palanca', 'Coloque una taza', 'Pulse Espresso (40ml) o Lungo (110ml)']
    ),
    depannage: depannage([
      [{ fr: 'Pas de café qui coule', en: 'No coffee flowing', es: 'No sale café' }, { fr: 'Vérifiez le réservoir d\'eau', en: 'Check water tank', es: 'Verifique el depósito de agua' }],
      [{ fr: ' Voyant rouge', en: ' Red light', es: ' Luz roja' }, { fr: 'Descalcafiez avec du citrique', en: 'Descale with citric acid', es: 'Desescalar con ácido cítrico' }],
    ]),
  },
  {
    category: 'coffee', brand: 'Nespresso', model: 'Vertuo Next',
    photoUrl: 'https://m.media-amazon.com/images/I/712+1TxWqQL._AC_SX679_.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=kf9SQ4T3JL8',
    searchKey: 'nespresso vertuo next plus',
    etapes: etapes(
      ['Ouvrez le levier', 'Insérez la capsule (centrage laser)', 'Refermez le levier', 'Appuyez sur le bouton — détection automatique de la taille'],
      ['Open the lever', 'Insert the capsule (laser centering)', 'Close the lever', 'Press the button — automatic size detection'],
      ['Abra la palanca', 'Inserte la cápsula (centrado láser)', 'Cierre la palanca', 'Pulse el botón — detección automática de tamaño']
    ),
    depannage: depannage([
      [{ fr: 'Machine bloquée', en: 'Machine locked', es: 'Máquina bloqueada' }, { fr: 'Éteignez 30s puis rallumez', en: 'Turn off 30s then back on', es: 'Apague 30s y encienda' }],
    ]),
  },
  {
    category: 'coffee', brand: 'Dolce Gusto', model: 'Genio S',
    photoUrl: 'https://m.media-amazon.com/images/I/61r6y4qXURL._AC_SX679_.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=fCp2o2y4kfE',
    searchKey: 'dolce gusto genio s krups',
    etapes: etapes(
      ['Remplissez le réservoir d\'eau', 'Allumez (interrupteur arrière)', 'Placez la capsule café', 'Choisissez la taille (7 niveaux)', 'Appuyez sur eau chaude ou froide'],
      ['Fill the water tank', 'Turn on (rear switch)', 'Place the coffee capsule', 'Choose the size (7 levels)', 'Press hot or cold water'],
      ['Llene el depósito de agua', 'Encienda (interruptor trasero)', 'Coloque la cápsula de café', 'Elija el tamaño (7 niveles)', 'Pulse agua caliente o fría']
    ),
    depannage: depannage([
      [{ fr: ' Voyant orange', en: ' Orange light', es: ' Luz naranja' }, { fr: 'Décalcafiez la machine', en: 'Descale the machine', es: 'Desescalar la máquina' }],
    ]),
  },
  // ─── LAVE-LINGE ───
  {
    category: 'washing', brand: 'Bosch', model: 'Serie 4 WGG04409FF',
    photoUrl: 'https://m.media-amazon.com/images/I/61w9d3N9bKL._AC_SX679_.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=5yWOQydy7YI',
    searchKey: 'bosch serie 4 6 8 kg lave linge',
    etapes: etapes(
      ['Ouvrez le hublot', 'Chargez le linge (max 9kg)', 'Versez le détergent dans le tiroir (compartiment II)', 'Sélectionnez le programme (Coton 40°C recommandé)', 'Appuyez sur Start'],
      ['Open the door', 'Load laundry (max 9kg)', 'Pour detergent in drawer (compartment II)', 'Select program (Cotton 40°C recommended)', 'Press Start'],
      ['Abra la puerta', 'Cargue la ropa (máx 9kg)', 'Vierta detergente en el cajón (compartimento II)', 'Seleccione programa (Algodón 40°C recomendado)', 'Pulse Start']
    ),
    depannage: depannage([
      [{ fr: 'Porte bloquée en fin de cycle', en: 'Door locked at end of cycle', es: 'Puerta bloqueada al final del ciclo' }, { fr: 'Attendez 2 min (sécurité)', en: 'Wait 2 min (safety)', es: 'Espere 2 min (seguridad)' }],
      [{ fr: 'Fuite sous la machine', en: 'Leak under machine', es: 'Fuga bajo la máquina' }, { fr: 'Vérifiez le filtre de pompe', en: 'Check pump filter', es: 'Verifique el filtro de la bomba' }],
    ]),
  },
  {
    category: 'washing', brand: 'Bosch', model: 'Serie 6 WGG24409FF',
    photoUrl: 'https://m.media-amazon.com/images/I/71k9VQ0pURL._AC_SX679_.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=5yWOQydy7YI',
    searchKey: 'bosch serie 6 i-dos lave linge 9kg',
    etapes: etapes(
      ['Remplissez le tiroir i-Dos (détergent auto-dosé)', 'Chargez le linge', 'Sélectionnez le programme', 'Appuyez sur Start'],
      ['Fill i-Dos drawer (auto-dosed detergent)', 'Load laundry', 'Select program', 'Press Start'],
      ['Llene el cajón i-Dos (detergente auto-dosificado)', 'Cargue la ropa', 'Seleccione programa', 'Pulse Start']
    ),
    depannage: depannage([
      [{ fr: 'i-Dos vide', en: 'i-Dos empty', es: 'i-Dos vacío' }, { fr: 'Remplissez le compartiment bleu', en: 'Fill the blue compartment', es: 'Llene el compartimento azul' }],
    ]),
  },
  {
    category: 'washing', brand: 'Indesit', model: 'MyTime MTWC91495W',
    photoUrl: 'https://m.media-amazon.com/images/I/61IzRl4uMgL._AC_SX679_.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=3u0m4o9q2uM',
    searchKey: 'indesit mytime lave linge 9kg',
    etapes: etapes(
      ['Chargez le linge', 'Versez détergent', 'Tournez le bouton pour choisir le cycle', 'Appuyez sur Start/Pause'],
      ['Load laundry', 'Pour detergent', 'Turn the knob to choose cycle', 'Press Start/Pause'],
      ['Cargue la ropa', 'Vierta detergente', 'Gire el dial para elegir ciclo', 'Pulse Start/Pause']
    ),
    depannage: depannage([
      [{ fr: 'Ne démarre pas', en: 'Does not start', es: 'No arranca' }, { fr: 'Vérifiez porte fermée', en: 'Check door is closed', es: 'Verifique puerta cerrada' }],
    ]),
  },
  {
    category: 'washing', brand: 'Whirlpool', model: 'FreshCare FWG71483W',
    photoUrl: 'https://m.media-amazon.com/images/I/61Z3v1d3URL._AC_SX679_.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=z5t0q4l4r2M',
    searchKey: 'whirlpool freshcare lave linge 7kg',
    etapes: etapes(
      ['Chargez le linge', 'Versez détergent', 'Sélectionnez programme + température', 'Start'],
      ['Load laundry', 'Pour detergent', 'Select program + temperature', 'Start'],
      ['Cargue la ropa', 'Vierta detergente', 'Seleccione programa + temperatura', 'Start']
    ),
    depannage: [],
  },
  // ─── TV ───
  {
    category: 'tv', brand: 'Samsung', model: 'Smart TV Tizen 50"',
    photoUrl: 'https://m.media-amazon.com/images/I/81Zj5ZQqURL._AC_SX679_.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=aJx3TQ-7fPE',
    searchKey: 'samsung smart tv tizen 50 55 65',
    etapes: etapes(
      ['Allumez avec télécommande (bouton rouge)', 'Sélectionnez la source (HDMI 1 pour box)', 'Utilisez Home pour Netflix/YouTube', 'Réglages → Réseau pour Wi-Fi'],
      ['Turn on with remote (red button)', 'Select source (HDMI 1 for box)', 'Use Home for Netflix/YouTube', 'Settings → Network for Wi-Fi'],
      ['Encienda con control remoto (botón rojo)', 'Seleccione fuente (HDMI 1 para box)', 'Use Home para Netflix/YouTube', 'Ajustes → Red para Wi-Fi']
    ),
    depannage: depannage([
      [{ fr: 'Pas d\'image', en: 'No picture', es: 'Sin imagen' }, { fr: 'Vérifiez câble HDMI', en: 'Check HDMI cable', es: 'Verifique cable HDMI' }],
      [{ fr: 'Wi-Fi ne fonctionne pas', en: 'Wi-Fi not working', es: 'Wi-Fi no funciona' }, { fr: 'Réglages → Réseau → Mot de passe', en: 'Settings → Network → Password', es: 'Ajustes → Red → Contraseña' }],
    ]),
  },
  {
    category: 'tv', brand: 'LG', model: 'Smart TV webOS 55"',
    photoUrl: 'https://m.media-amazon.com/images/I/71oR6p7yURL._AC_SX679_.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=4m4OZ5r0y5s',
    searchKey: 'lg smart tv webos 55 65 oled',
    etapes: etapes(
      ['Allumez avec télécommande Magic Remote', 'Bouton Home pour les apps', 'Netflix/Prime/YouTube sur la barre inférieure', 'Réglages → Réseau pour Wi-Fi'],
      ['Turn on with Magic Remote', 'Home button for apps', 'Netflix/Prime/YouTube on bottom bar', 'Settings → Network for Wi-Fi'],
      ['Encienda con Magic Remote', 'Botón Home para apps', 'Netflix/Prime/YouTube en barra inferior', 'Ajustes → Red para Wi-Fi']
    ),
    depannage: depannage([
      [{ fr: 'Magic Remote ne répond pas', en: 'Magic Remote not responding', es: 'Magic Remote no responde' }, { fr: 'Appuyez sur Home + Retour 5s', en: 'Press Home + Back for 5s', es: 'Pulse Home + Atrás 5s' }],
    ]),
  },
  {
    category: 'tv', brand: 'Philips', model: 'Ambilight 50"',
    photoUrl: 'https://m.media-amazon.com/images/I/81z4l1m8URL._AC_SX679_.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=O5e6tZ5r8vU',
    searchKey: 'philips ambilight smart tv 50 55',
    etapes: etapes(
      ['Allumez avec télécommande', 'Home pour les apps', 'Netflix/YouTube', 'Ambilight → Réglages effets'],
      ['Turn on with remote', 'Home for apps', 'Netflix/YouTube', 'Ambilight → Effects settings'],
      ['Encienda con control remoto', 'Home para apps', 'Netflix/YouTube', 'Ambilight → Ajustes efectos']
    ),
    depannage: [],
  },
  // ─── CLIMATISATION ───
  {
    category: 'climate', brand: 'Daikin', model: 'Perfera FTXF35A',
    photoUrl: 'https://m.media-amazon.com/images/I/61w8Kq4LURL._AC_SX679_.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=i0T2t3r5g8U',
    searchKey: 'daikin perfera ftxf climatisation split',
    etapes: etapes(
      ['Allumez avec télécommande', 'Mode Cool (flocon) pour froid', 'Mode Heat (soleil) pour chaud', 'Réglez température 22-24°C', 'Mode Fan (ventilateur) pour aérer'],
      ['Turn on with remote', 'Cool mode (snowflake) for cold', 'Heat mode (sun) for warm', 'Set temperature 22-24°C', 'Fan mode to ventilate'],
      ['Encienda con control remoto', 'Modo Cool (copo) para frío', 'Modo Heat (sol) para calor', 'Ajuste temperatura 22-24°C', 'Modo Fan para ventilar']
    ),
    depannage: depannage([
      [{ fr: 'Clim ne fait pas froid', en: 'AC not cooling', es: 'Aire no enfría' }, { fr: 'Nettoyez filtres (avant de la machine)', en: 'Clean filters (front of unit)', es: 'Limpie filtros (frontal)' }],
      [{ fr: ' Voyant clignotant', en: ' Blinking light', es: ' Luz parpadeante' }, { fr: 'Notez le code erreur (ex: E7)', en: 'Note error code (e.g. E7)', es: 'Anote código de error' }],
    ]),
  },
  {
    category: 'climate', brand: 'Mitsubishi', model: 'MSZ-HR35VF',
    photoUrl: 'https://m.media-amazon.com/images/I/71uV5z7VURL._AC_SX679_.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=5KJ8T3v0z9Q',
    searchKey: 'mitsubishi msz hr35vf climatisation split',
    etapes: etapes(
      ['Allumez télécommande', 'Mode Cool/Heat/Dry', 'Réglez température', 'Vitesse ventilateur (Auto recommandé)'],
      ['Turn on remote', 'Cool/Heat/Dry mode', 'Set temperature', 'Fan speed (Auto recommended)'],
      ['Encienda control remoto', 'Modo Cool/Heat/Dry', 'Ajuste temperatura', 'Velocidad ventilador (Auto recomendado)']
    ),
    depannage: [],
  },
  // ─── THERMOSTATS ───
  {
    category: 'heating', brand: 'Nest', model: 'Learning Thermostat 3rd Gen',
    photoUrl: 'https://m.media-amazon.com/images/I/51J3N4L4URL._AC_SX679_.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=7J5y6N8t3mE',
    searchKey: 'nest learning thermostat 3rd generation',
    etapes: etapes(
      ['Tournez l\'anneau pour régler température', 'Appuyez pour valider', 'Mode Éco (feuille) pour économies', 'Programmation auto après 1 semaine d\'usage'],
      ['Turn the ring to set temperature', 'Press to confirm', 'Eco mode (leaf) for savings', 'Auto programming after 1 week of use'],
      ['Gire el anillo para ajustar temperatura', 'Pulse para confirmar', 'Modo Eco (hoja) para ahorro', 'Programación automática tras 1 semana de uso']
    ),
    depannage: depannage([
      [{ fr: 'Pas de chauffage', en: 'No heating', es: 'Sin calefacción' }, { fr: 'Vérifiez chaudière + fusibles', en: 'Check boiler + fuses', es: 'Verifique caldera + fusibles' }],
    ]),
  },
  {
    category: 'heating', brand: 'Netatmo', model: 'Smart Thermostat',
    photoUrl: 'https://m.media-amazon.com/images/I/61r8Y8l3URL._AC_SX679_.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=8K9t3v2z5mQ',
    searchKey: 'netatmo smart thermostat modulating',
    etapes: etapes(
      ['Réglez via app Netatmo', 'Mode Manuel → + ou - température', 'Mode Programme auto', 'Mode Hors-gel (15°C) si absent'],
      ['Set via Netatmo app', 'Manual mode → + or - temperature', 'Auto Program mode', 'Away mode (15°C) if absent'],
      ['Ajuste vía app Netatmo', 'Modo Manual → + o - temperatura', 'Modo Programa auto', 'Modo Ausente (15°C) si no hay']
    ),
    depannage: [],
  },
  // ─── JACUZZI ───
  {
    category: 'jacuzzi', brand: 'Intex', model: 'PureSpa 28443NP',
    photoUrl: 'https://m.media-amazon.com/images/I/61x4y8V0URL._AC_SX679_.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=H8u7q3z5r9U',
    searchKey: 'intex purespa 4 6 places spa gonflable',
    etapes: etapes(
      ['Remplissez avec tuyau jusqu\'à buse de jets', 'Branchez (220V RCD)', 'Chauffage : +1°C/h (max 40°C)', 'Ajoutez chlore (pastille/sem)', 'Activez jets/bulles bouton panneau'],
      ['Fill with hose up to jet nozzle', 'Plug in (220V RCD)', 'Heating: +1°C/h (max 40°C)', 'Add chlorine (tablet/week)', 'Activate jets/bubbles panel button'],
      ['Llene con manguera hasta boquilla', 'Enchufe (220V RCD)', 'Calentamiento: +1°C/h (máx 40°C)', 'Añada cloro (pastilla/sem)', 'Active jets/burbujas panel']
    ),
    depannage: depannage([
      [{ fr: 'Eau verte', en: 'Green water', es: 'Agua verde' }, { fr: 'Chlore + filtre 24h', en: 'Chlorine + filter 24h', es: 'Cloro + filtro 24h' }],
      [{ fr: 'Chauffe lent', en: 'Slow heating', es: 'Calentamiento lento' }, { fr: 'Couvercle fermé obligatoire', en: 'Cover closed mandatory', es: 'Tapa cerrada obligatoria' }],
    ]),
  },
  {
    category: 'jacuzzi', brand: 'Bestway', model: 'Lay-Z-Spa 60032',
    photoUrl: 'https://m.media-amazon.com/images/I/71p5Q8m2URL._AC_SX679_.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=Y5s8t4v7u2A',
    searchKey: 'bestway lay-z-spa miami vancouver 60032',
    etapes: etapes(
      ['Gonflez avec buse', 'Remplissez eau', 'Filtre en place', 'Branchez et chauffez', 'Chlore + pH équilibré'],
      ['Inflate with nozzle', 'Fill water', 'Filter in place', 'Plug and heat', 'Chlorine + balanced pH'],
      ['Infle con boquilla', 'Llene agua', 'Filtro en su lugar', 'Enchufe y caliente', 'Cloro + pH equilibrado']
    ),
    depannage: [],
  },
  // ─── BARBECUE ───
  {
    category: 'bbq', brand: 'Weber', model: 'Genesis II E-310',
    photoUrl: 'https://m.media-amazon.com/images/I/71l3N3Z8URL._AC_SX679_.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=P3n4r9o2r8U',
    searchKey: 'weber genesis ii e-310 e-330 gaz 3 bruleurs',
    etapes: etapes(
      ['Ouvrez bouteille gaz', 'Ouvrez robinet brûleurs', 'Allumez bouton (gauche→droite)', 'Préchauffez 10 min', 'Cuisson : direct haut, indirect bas'],
      ['Open gas bottle', 'Open burner knob', 'Light button (left→right)', 'Preheat 10 min', 'Cooking: direct high, indirect low'],
      ['Abra botella de gas', 'Abra perilla quemadores', 'Encienda botón (izq→der)', 'Precaliente 10 min', 'Cocción: directo alto, indirecto bajo']
    ),
    depannage: depannage([
      [{ fr: 'Brûleur ne s\'allume pas', en: 'Burner won\'t light', es: 'Quemador no enciende' }, { fr: 'Vérifiez bouteille + électrode', en: 'Check bottle + electrode', es: 'Verifique botella + electrodo' }],
    ]),
  },
  {
    category: 'bbq', brand: 'Campingaz', model: 'Gas 2Go CV',
    photoUrl: 'https://m.media-amazon.com/images/I/61z7N3L2URL._AC_SX679_.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=T5o4n3v8r2U',
    searchKey: 'campingaz gas 2go cv portable compact',
    etapes: etapes(
      ['Branche cartouche CV (vis)', 'Ouvre le brûleur', 'Allume avec bouton piezo', 'Réglage puissance'],
      ['Connect CV cartridge (screw)', 'Open burner', 'Light with piezo button', 'Power adjustment'],
      ['Conecte cartucho CV (rosca)', 'Abra quemador', 'Encienda con piezo', 'Ajuste potencia']
    ),
    depannage: [],
  },
];

async function main() {
  console.log('🌱 Seeding ' + MODELES.length + ' modèles d\'appareils...');
  await prisma.modeleAppareil.deleteMany({});
  for (const m of MODELES) {
    await prisma.modeleAppareil.create({ data: m });
  }
  console.log('✅ ' + MODELES.length + ' modèles créés');
}

main().catch((e) => { console.error('❌', e); }).finally(() => prisma.$disconnect());
