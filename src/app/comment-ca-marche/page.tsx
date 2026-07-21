'use client';

/**
 * QRTagsPro — Page "Comment ça marche"
 *
 * Détaille le workflow complet en 4 étapes + FAQ.
 */

import Link from 'next/link';
import {
  ArrowRight, ArrowLeft, QrCode, Users, Bell, CheckCircle2,
  Building2, ScanLine, MessageCircle, Package,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';

const STEPS = [
  {
    num: 1,
    icon: <QrCode className="w-10 h-10" />,
    title: 'Génération des QR codes',
    short: 'Le superadmin crée les lots',
    description: 'Le superadmin se connecte à son espace et génère un lot de QR codes. Il sélectionne l\'agence destinataire (hôtel, école, clinique, etc.) et la quantité souhaitée (10 à 5000 QR par lot). Les QR sont immédiatement créés en base avec le statut "en stock" et assignés à l\'agence.',
    details: [
      'Choix de l\'agence destinataire',
      'Quantité personnalisable (jusqu\'à 5000)',
      'Téléchargement immédiat en PNG',
      'Couleurs QRTagsPro (bleu + vert)',
    ],
  },
  {
    num: 2,
    icon: <Users className="w-10 h-10" />,
    title: 'Check-in du client',
    short: 'Le staff active le QR',
    description: 'Au check-in du client (arrivée à l\'hôtel, admission à la clinique, inscription à l\'école...), le staff scanne le QR code physique avec la webcam du PC ou saisit la référence manuellement. Un formulaire adapté au métier s\'affiche : nom du client, n° de chambre, dates, contact d\'urgence, etc.',
    details: [
      'Scan webcam via navigateur (html5-qrcode)',
      'Saisie manuelle de la référence',
      'Formulaire adapté au métier (hôtel, école, clinique...)',
      'Départ automatique calculé selon le métier',
    ],
  },
  {
    num: 3,
    icon: <Bell className="w-10 h-10" />,
    title: 'Le trouveur scanne',
    short: 'Perte → contact WhatsApp',
    description: 'En cas de perte, la personne qui trouve l\'objet scanne le QR code avec son téléphone. La page trouveur s\'affiche avec le nom de l\'établissement (pas le nom du client — confidentialité totale). Le trouveur saisit son nom, son téléphone et sa position GPS. Un clic ouvre WhatsApp avec un message pré-rempli vers la réception de l\'établissement.',
    details: [
      'Page trouveur personnalisée par métier',
      'Géolocalisation automatique (GPS + Nominatim)',
      'WhatsApp WAME (click-to-chat, aucune installation)',
      'Confidentialité : le trouveur ne voit jamais les infos client',
    ],
  },
  {
    num: 4,
    icon: <CheckCircle2 className="w-10 h-10" />,
    title: 'Restitution',
    short: 'L\'établissement gère',
    description: 'La réception de l\'établissement reçoit le message WhatsApp avec la position du trouveur. Elle vérifie dans son dashboard que c\'est bien un client actif, contacte le client pour l\'informer, et organise la restitution. Une fois l\'objet rendu, le staff fait le check-out (manuel ou automatique à la date de départ).',
    details: [
      'Dashboard temps réel avec liste des QR actifs',
      'Vérification du client dans le customData',
      'Check-out manuel (bouton) ou automatique (cron)',
      'Statistiques : scans, objets perdus, taux de restitution',
    ],
  },
];

const FAQ = [
  {
    q: 'Le trouveur a-t-il besoin d\'une application ?',
    a: 'Non. Le trouveur scanne le QR avec l\'appareil photo de son téléphone. La page s\'ouvre dans le navigateur, et le bouton WhatsApp utilise le click-to-chat (wa.me) — aucune installation requise.',
  },
  {
    q: 'Le trouveur voit-il les informations du client ?',
    a: 'Non, jamais. Le trouveur ne voit que le nom de l\'établissement et le téléphone de la réception. Les coordonnées du client (nom, chambre, téléphone) restent privées et ne sont accessibles qu\'au staff via le dashboard.',
  },
  {
    q: 'Que se passe-t-il si le client quitte l\'établissement ?',
    a: 'Le QR est automatiquement expiré (check-out) à la date de départ configurée lors du check-in. Le cron job tourne toutes les heures. Le staff peut aussi faire le check-out manuellement via le bouton dans le dashboard.',
  },
  {
    q: 'Puis-je créer mon propre métier sans coder ?',
    a: 'Oui ! Le superadmin peut créer un métier personnalisé via /admin/metiers. Il définit les champs du formulaire de check-in (nom, type, obligatoire), le message WhatsApp personnalisé, et les labels du dashboard. Aucune ligne de code.',
  },
  {
    q: 'Combien de QR puis-je générer ?',
    a: 'Jusqu\'à 5000 QR par lot. Au-delà, générez plusieurs lots. Chaque QR est unique et assigné à une agence spécifique.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <QRTagsLogo size="xs" href="/" withHover />
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
            <Link href="/comment-ca-marche" className="text-[#134288]">Comment ça marche</Link>
            <Link href="/metiers" className="hover:text-[#134288] transition">Métiers</Link>
            <Link href="/avantages" className="hover:text-[#134288] transition">Avantages</Link>
            <Link href="/demo" className="hover:text-[#134288] transition">Démo</Link>
          </nav>
          <Link
            href="/agence/connexion"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-[#32ba5d] text-white rounded-lg hover:bg-[#28a54f] transition"
          >
            Espace agence
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#134288] to-[#0d3266] text-white py-20">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Comment ça marche ?
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
            De la génération des QR codes à la restitution de l\'objet,
            découvrez le workflow complet en 4 étapes simples.
          </p>
        </div>
      </section>

      {/* Steps détaillées */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 md:px-6 space-y-16">
          {STEPS.map((step, i) => (
            <div key={i} className="grid md:grid-cols-2 gap-8 items-start">
              {/* Numéro + icône */}
              <div className="flex flex-col items-center md:items-start">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#134288] flex items-center justify-center text-white">
                    {step.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#32ba5d]">ÉTAPE {step.num}</p>
                    <h2 className="text-xl font-bold text-slate-900">{step.short}</h2>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed mb-4">{step.description}</p>
                <ul className="space-y-2">
                  {step.details.map((d, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-[#32ba5d] flex-shrink-0 mt-0.5" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-black text-slate-900 mb-8 text-center">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <details key={i} className="bg-white rounded-xl p-5 border-2 border-slate-200 group">
                <summary className="cursor-pointer font-semibold text-slate-900 flex items-center justify-between">
                  {item.q}
                  <ArrowRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
                </summary>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#134288] text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-4">Prêt à essayer ?</h2>
          <p className="text-blue-100 mb-8">
            Demandez une démo gratuite et découvrez QRTagsPro adapté à votre métier.
          </p>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#32ba5d] text-white font-bold rounded-lg hover:bg-[#28a54f] hover:-translate-y-0.5 transition-all shadow-lg"
          >
            Demander une démo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d3266] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-blue-200 hover:text-[#32ba5d]">
            <ArrowLeft className="w-4 h-4" />
            Retour à l\'accueil
          </Link>
          <p className="mt-4 text-xs text-blue-300">© {new Date().getFullYear()} QRTagsPro</p>
        </div>
      </footer>
    </div>
  );
}
