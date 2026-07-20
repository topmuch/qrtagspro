'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Plane,
  Home,
  QrCode,
  Luggage,
  AlertTriangle,
  Shield,
  Phone,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  Search,
} from 'lucide-react';

// ─── Brand constants ───
const BRAND = '#111111';
const ACCENT = '#E3B23C';
const INK = '#1a1a1a';

// ─── Types ───
interface Scenario {
  id: string;
  question: string;
  icon: typeof Plane;
  // Soit des sous-scénarios, soit des étapes finales
  children?: Scenario[];
  steps?: {
    title: string;
    description: string;
    icon?: unknown; // icône lucide optionnelle pour certaines étapes
    action?: { label: string; href: string; external?: boolean };
  }[];
}

// ─── Arbre de scénarios ───
const SCENARIOS: Scenario[] = [
  {
    id: 'airport',
    question: 'Je suis à l\'aéroport',
    icon: Plane,
    children: [
      {
        id: 'airport-lost',
        question: 'Je ne trouve pas mon bagage sur le tapis',
        icon: Luggage,
        steps: [
          {
            title: '1. Restez calme',
            description: 'Ne quittez pas la zone de livraison bagages. Les bagages arrivent parfois par lots.',
          },
          {
            title: '2. Vérifiez les tapis voisins',
            description: 'Votre bagage peut avoir été mis sur un autre tapis par erreur.',
          },
          {
            title: '3. Allez au comptoir "Bagages" de votre compagnie',
            description: 'Déclarez votre bagage manquant. Demandez un numéro de réclamation (PIR).',
          },
          {
            title: '4. Déclarez votre bagage perdu sur QRTags',
            description: 'Cela notifie votre agence et active le suivi renforcé.',
            action: { label: 'Déclarer mon bagage perdu', href: '/suivi/' },
          },
          {
            title: '5. Activez les alertes',
            description: 'Sur votre page de suivi, activez le mode audio pour être notifié dès qu\'un scan est détecté.',
            action: { label: 'Voir mon suivi', href: '/suivi/' },
          },
        ],
      },
      {
        id: 'airport-damaged',
        question: 'Mon bagage est arrivé abîmé',
        icon: AlertTriangle,
        steps: [
          {
            title: '1. Ne quittez pas la zone bagages',
            description: 'Les réclamations pour dommage doivent être faites AVANT de quitter l\'aéroport.',
          },
          {
            title: '2. Photographiez les dommages',
            description: 'Prenez plusieurs photos sous différents angles, y compris l\'étiquette bagage.',
          },
          {
            title: '3. Allez au comptoir "Bagages" de la compagnie',
            description: 'Déclarez le dommage. Demandez un constat de dégâts écrit.',
          },
          {
            title: '4. Téléchargez votre parcours QRTags',
            description: 'Le PDF officiel avec l\'historique complet servira de preuve pour l\'assurance.',
            action: { label: 'Télécharger mon parcours PDF', href: '/suivi/' },
          },
          {
            title: '5. Contactez votre assurance',
            description: 'Transmettez : le PIR compagnie, le constat de dégâts, le parcours QRTags, vos photos.',
          },
        ],
      },
      {
        id: 'airport-stolen',
        question: 'On a volé mon bagage',
        icon: Shield,
        steps: [
          {
            title: '1. Alertez immédiatement la sécurité de l\'aéroport',
            description: 'Ne poursuivez pas le voleur vous-même. Donnez une description précise.',
          },
          {
            title: '2. Déposez plainte au commissariat de l\'aéroport',
            description: 'Demandez un récépissé de dépôt de plainte. Indispensable pour l\'assurance.',
          },
          {
            title: '3. Déclarez le vol à votre compagnie aérienne',
            description: 'Si le vol a eu lieu pendant le transport, la compagnie est responsable.',
          },
          {
            title: '4. Déclarez votre bagage perdu sur QRTags',
            description: 'Active le suivi et notifie votre agence.',
            action: { label: 'Déclarer mon bagage perdu', href: '/suivi/' },
          },
          {
            title: '5. Contactez votre assurance voyage',
            description: 'Fournissez : plainte, récépissé compagnie, parcours QRTags.',
          },
        ],
      },
    ],
  },
  {
    id: 'home',
    question: 'Je suis chez moi (avant ou après le voyage)',
    icon: Home,
    children: [
      {
        id: 'home-activate',
        question: 'Je n\'ai pas encore activé mon QR code',
        icon: QrCode,
        steps: [
          {
            title: '1. Vérifiez votre QR code',
            description: 'L\'autocollant QRTags doit être collé sur votre bagage. Repérez la référence (ex: VOL26-ABC123).',
          },
          {
            title: '2. Scannez le QR code',
            description: 'Utilisez l\'appareil photo de votre téléphone. Vous serez redirigé vers la page d\'activation.',
            action: { label: 'Ou activez-le manuellement', href: '/inscrire' },
          },
          {
            title: '3. Remplissez le formulaire d\'activation',
            description: 'Nom, prénom, numéro WhatsApp, informations de vol. Durée : 2 minutes.',
          },
          {
            title: '4. Notez votre PIN propriétaire',
            description: 'Il s\'affiche à la fin de l\'activation. Gardez-le précieusement, il ne sera plus jamais affiché.',
          },
          {
            title: '5. Activez le mode "En transit"',
            description: 'Sur votre page de suivi, basculez le toggle. Le QR devient fonctionnel pendant votre voyage.',
          },
        ],
      },
      {
        id: 'home-forgot-pin',
        question: 'J\'ai oublié mon PIN propriétaire',
        icon: HelpCircle,
        steps: [
          {
            title: '1. Contactez le support QRTags',
            description: 'Envoyez un email à contact@qrtags.com avec votre référence bagage et une pièce d\'identité.',
            action: { label: 'Contacter le support', href: 'mailto:contact@qrtags.com', external: true },
          },
          {
            title: '2. Vérification d\'identité',
            description: 'Le support vérifiera que vous êtes bien le propriétaire du bagage (nom + référence).',
          },
          {
            title: '3. Réinitialisation du PIN',
            description: 'Un nouveau PIN vous sera communiqué. Notez-le cette fois !',
          },
          {
            title: '4. Changez votre PIN',
            description: 'Une fois connecté, changez votre PIN via "Modifier mon profil" sur votre page de suivi.',
            action: { label: 'Modifier mon profil', href: '/suivi/' },
          },
        ],
      },
      {
        id: 'home-qr-not-scanning',
        question: 'Mon QR code ne scanne pas',
        icon: QrCode,
        steps: [
          {
            title: '1. Nettoyez le QR code',
            description: 'Un autocollant sale ou rayé peut empêcher la lecture. Essuyez délicatement.',
          },
          {
            title: '2. Vérifiez l\'éclairage',
            description: 'Évitez les reflets. Tournez le bagage pour trouver le bon angle.',
          },
          {
            title: '3. Utilisez une autre app de scan',
            description: 'L\'app appareil photo de votre téléphone devrait suffire, sinon téléchargez une app QR gratuite.',
          },
          {
            title: '4. Saisissez la référence manuellement',
            description: 'Si le QR est illisible, allez sur qrtags.com/inscrire et tapez votre référence (ex: VOL26-ABC123).',
            action: { label: 'Saisir ma référence', href: '/inscrire' },
          },
          {
            title: '5. Commandez un nouvel autocollant',
            description: 'Si le QR est endommagé définitivement, contactez QRTags pour un remplacement.',
            action: { label: 'Commander un nouvel autocollant', href: '/#pricing' },
          },
        ],
      },
    ],
  },
  {
    id: 'finder',
    question: 'Je viens de trouver un bagage QRTags',
    icon: Luggage,
    children: [
      {
        id: 'finder-contact',
        question: 'Comment contacter le propriétaire ?',
        icon: Phone,
        steps: [
          {
            title: '1. Restez sur la page de scan',
            description: 'Vous êtes déjà au bon endroit. La page affiche le statut du bagage.',
          },
          {
            title: '2. Cliquez sur "Contacter le propriétaire"',
            icon: MessageCircle as never,
            description: 'Vous verrez un bouton jaune avec cette mention. Cliquez dessus.',
          },
          {
            title: '3. Remplissez le formulaire',
            description: 'Votre prénom, numéro WhatsApp, et lieu où vous avez trouvé le bagage.',
          },
          {
            title: '4. Choisissez WhatsApp ou appel',
            description: 'WhatsApp envoie un message pré-rempli au propriétaire. L\'appel le contacte directement.',
          },
          {
            title: '5. Vérifiez l\'identité (recommandé)',
            description: 'Avant de rendre le bagage, demandez le PIN propriétaire à la personne et vérifiez-le sur la page de scan.',
          },
        ],
      },
      {
        id: 'finder-suspicious',
        question: 'La personne qui réclame le bagage semble suspecte',
        icon: Shield,
        steps: [
          {
            title: '1. Demandez le PIN propriétaire',
            description: 'Le propriétaire légitime connaît son PIN (4 chiffres). C\'est la meilleure vérification.',
          },
          {
            title: '2. Vérifiez le PIN sur la page de scan',
            description: 'Sur la page de scan, dépliez "Vérifier l\'identité du propriétaire" et saisissez le PIN annoncé.',
            action: { label: 'Vérifier le PIN', href: '/scan/' },
          },
          {
            title: '3. Si le PIN est invalide',
            description: 'La personne n\'est probablement pas le propriétaire. Ne lui remettez PAS le bagage.',
          },
          {
            title: '4. Contactez QRTags',
            description: 'Signalez la tentative. Le propriétaire sera alerté.',
            action: { label: 'Contacter le support', href: 'mailto:contact@qrtags.com', external: true },
          },
          {
            title: '5. Déposez le bagage en lieu sûr',
            description: 'Commissariat, comptoir d\'aéroport, ou agence QRTags partenaire.',
          },
        ],
      },
    ],
  },
];

export default function AssistancePage() {
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Récupérer le scénario courant
  const getCurrentScenarios = (): Scenario[] => {
    if (selectedPath.length === 0) return SCENARIOS;
    let current = SCENARIOS;
    for (const id of selectedPath) {
      const found = current.find((s) => s.id === id);
      if (!found || !found.children) return [];
      current = found.children;
    }
    return current;
  };

  const getCurrentScenario = (): Scenario | null => {
    if (selectedPath.length === 0) return null;
    let current = SCENARIOS;
    let found: Scenario | null = null;
    for (const id of selectedPath) {
      found = current.find((s) => s.id === id) || null;
      if (!found) return null;
      current = found.children || [];
    }
    return found;
  };

  // Filtrer par recherche
  const filteredScenarios = searchQuery
    ? getCurrentScenarios().filter((s) =>
        s.question.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : getCurrentScenarios();

  const currentScenario = getCurrentScenario();
  const hasSteps = currentScenario?.steps && currentScenario.steps.length > 0;

  return (
    <main className="min-h-screen bg-[#111111] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#111111] border-b border-[#E3B23C]/30 py-4 px-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1 text-white hover:text-[#E3B23C] transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Accueil
          </Link>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Assistance QRTags
          </h1>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-3xl mx-auto w-full px-4 py-6 pb-20">
        {/* Breadcrumb */}
        {selectedPath.length > 0 && (
          <button
            onClick={() => setSelectedPath(selectedPath.slice(0, -1))}
            className="flex items-center gap-1 text-white/80 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        )}

        {/* Hero */}
        {selectedPath.length === 0 && (
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-[#E3B23C] rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-[#1a1a1a]">
              <HelpCircle className="w-10 h-10" style={{ color: INK }} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Que pouvez-vous faire ?</h2>
            <p className="text-white/80 max-w-md mx-auto">
              Sélectionnez votre situation pour obtenir la marche à suivre étape par étape.
            </p>
          </div>
        )}

        {/* Search */}
        {selectedPath.length === 0 && (
          <div className="mb-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher (ex: perdu, retard, PIN...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border-2 border-[#1a1a1a] text-[#1a1a1a] focus:ring-2 focus:ring-[#E3B23C]"
            />
          </div>
        )}

        {/* Steps (final view) */}
        {hasSteps && currentScenario && (
          <div className="space-y-4">
            <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#111111] flex items-center justify-center">
                  <currentScenario.icon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-[#1a1a1a]">{currentScenario.question}</h2>
              </div>
              <p className="text-sm text-slate-600 mb-2">Voici la marche à suivre :</p>
            </div>

            {currentScenario.steps!.map((step, idx) => (
              <div
                key={idx}
                className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-5"
              >
                <h3 className="font-bold text-[#1a1a1a] mb-1">{step.title}</h3>
                <p className="text-sm text-slate-600 mb-3">{step.description}</p>
                {step.action && (
                  <a
                    href={step.action.href}
                    target={step.action.external ? '_blank' : undefined}
                    rel={step.action.external ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center gap-2 bg-[#111111] hover:bg-[#0033a8] text-white py-2 px-4 rounded-xl font-bold transition-colors text-sm"
                  >
                    {step.action.label}
                    <ArrowRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}

            {/* Contact support card */}
            <div className="bg-[#E3B23C] border-2 border-dashed border-[#1a1a1a] rounded-2xl p-5 text-center">
              <p className="text-sm font-bold mb-2" style={{ color: INK }}>
                Besoin d&apos;aide supplémentaire ?
              </p>
              <a
                href="mailto:contact@qrtags.com"
                className="inline-flex items-center gap-2 bg-[#1a1a1a] hover:bg-black text-[#E3B23C] py-2 px-4 rounded-xl font-bold transition-colors text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Contacter le support QRTags
              </a>
            </div>
          </div>
        )}

        {/* Scenario list (when not on final steps) */}
        {!hasSteps && (
          <div className="grid grid-cols-1 gap-3">
            {filteredScenarios.length === 0 && (
              <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-6 text-center">
                <p className="text-slate-500">Aucun résultat pour &quot;{searchQuery}&quot;</p>
              </div>
            )}
            {filteredScenarios.map((scenario) => {
              const Icon = scenario.icon;
              return (
                <button
                  key={scenario.id}
                  onClick={() => setSelectedPath([...selectedPath, scenario.id])}
                  className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-5 text-left hover:bg-[#E3B23C] transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#111111] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-[#1a1a1a]">{scenario.question}</h3>
                      <p className="text-sm text-slate-600 group-hover:text-[#1a1a1a]/70">
                        {scenario.children
                          ? `${scenario.children.length} situation(s) →`
                          : scenario.steps
                          ? `${scenario.steps.length} étapes →`
                          : '→'}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#1a1a1a] flex-shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Quick links */}
        {selectedPath.length === 0 && (
          <div className="mt-8 grid grid-cols-2 gap-3">
            <Link
              href="/"
              className="bg-[#E3B23C] border-2 border-[#1a1a1a] rounded-2xl p-4 text-center hover:bg-[#1a1a1a] hover:text-[#E3B23C] transition-colors"
            >
              <Home className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-bold" style={{ color: INK }}>Accueil</p>
            </Link>
            <a
              href="mailto:contact@qrtags.com"
              className="bg-[#E3B23C] border-2 border-[#1a1a1a] rounded-2xl p-4 text-center hover:bg-[#1a1a1a] hover:text-[#E3B23C] transition-colors"
            >
              <MessageCircle className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-bold" style={{ color: INK }}>Support</p>
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
