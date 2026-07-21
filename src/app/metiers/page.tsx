'use client';

/**
 * QRTagsPro — Page "Métiers"
 *
 * Détaille chaque métier supporté avec ses champs spécifiques.
 */

import Link from 'next/link';
import {
  ArrowRight, ArrowLeft, Hotel, GraduationCap, Stethoscope,
  Car, Luggage, Briefcase, Sparkles, CheckCircle2,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';

const METIERS = [
  {
    icon: <Hotel className="w-8 h-8" />,
    title: 'Hôtels',
    color: '#134288',
    badge: 'Disponible',
    description: 'Étiquetez les bagages de vos clients dès le check-in. Le trouveur contacte votre réception directement via WhatsApp.',
    fields: [
      'Nom complet du client',
      'N° de chambre',
      'Date d\'arrivée',
      'Date de départ',
      'Téléphone client (optionnel)',
      'Email client (optionnel)',
      'Notes / description de l\'objet',
    ],
    workflow: 'Le trouveur contacte la RÉCEPTION de l\'hôtel (pas le client). L\'hôtel vérifie le client et organise la restitution.',
    autoExpire: 'À la date de départ du client',
  },
  {
    icon: <GraduationCap className="w-8 h-8" />,
    title: 'Écoles',
    color: '#32ba5d',
    badge: 'Disponible',
    description: 'Identifiez cartables et uniformes des élèves. Contact automatique de l\'école qui appelle le parent.',
    fields: [
      'Prénom de l\'élève',
      'Nom de l\'élève',
      'Classe (ex: 6ème B)',
      'Nom du parent',
      'Téléphone du parent',
      'Email parent (optionnel)',
      'Année scolaire (auto)',
    ],
    workflow: 'Le trouveur contacte l\'ÉCOLE. L\'école appelle le parent pour restitution.',
    autoExpire: 'Au 30 juin de l\'année scolaire',
  },
  {
    icon: <Stethoscope className="w-8 h-8" />,
    title: 'Cliniques',
    color: '#134288',
    badge: 'Disponible',
    description: 'Étiquetez les effets personnels des patients (lunettes, prothèses, cannes). Contact d\'urgence prévené.',
    fields: [
      'Nom du patient',
      'N° de dossier médical',
      'Service (ex: Cardiologie)',
      'N° de chambre (optionnel)',
      'Nom du contact d\'urgence',
      'Téléphone du contact d\'urgence',
      'Date d\'admission',
      'Date de sortie prévue (optionnel)',
    ],
    workflow: 'Le trouveur contacte la CLINIQUE. La clinique appelle le contact d\'urgence (famille).',
    autoExpire: 'À la date de sortie (+30 jours par défaut)',
  },
  {
    icon: <Car className="w-8 h-8" />,
    title: 'Loueurs auto',
    color: '#32ba5d',
    badge: 'Disponible',
    description: 'Traçabilité des clés, documents et équipements. Le trouveur contacte le loueur qui appelle le locataire.',
    fields: [
      'Nom du locataire',
      'N° de contrat',
      'Modèle du véhicule',
      'Immatriculation',
      'Date de début de location',
      'Date de fin de location',
      'Téléphone du locataire',
      'Type d\'objet (clés, documents, GPS...)',
    ],
    workflow: 'Le trouveur contacte le LOUEUR. Le loueur vérifie le contrat et appelle le locataire.',
    autoExpire: 'À la date de fin de location',
  },
  {
    icon: <Luggage className="w-8 h-8" />,
    title: 'Consignes',
    color: '#134288',
    badge: 'Disponible',
    description: 'Étiquetage des bagages en consigne (gare, aéroport). Suivi par casier avec retrait programmé.',
    fields: [
      'N° de casier',
      'Description du bagage',
      'Heure de dépôt',
      'Date/heure de retrait prévu',
      'Nom du voyageur',
      'Téléphone du voyageur',
      'Type de consigne (24h, 48h, 7j)',
    ],
    workflow: 'Le trouveur contacte la CONSIGNE. La consigne appelle le voyageur.',
    autoExpire: 'À la date/heure de retrait prévu (précis à l\'heure)',
  },
  {
    icon: <Briefcase className="w-8 h-8" />,
    title: 'Autres métiers',
    color: '#32ba5d',
    badge: 'Sur devis',
    description: 'Spa, gym, entreprise, camping, événements, festivals... Créez votre métier sur-mesure sans coder via le builder.',
    fields: [
      'Champs personnalisables (texte, date, téléphone, select...)',
      'Définissez vos propres labels de dashboard',
      'Message WhatsApp personnalisé',
      'Auto-expiration configurable',
    ],
    workflow: 'Le trouveur contacte votre établissement. Vous gérez la restitution.',
    autoExpire: 'Configurable (champ date de départ optionnel)',
  },
];

export default function MetiersPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <QRTagsLogo size="xs" href="/" withHover />
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
            <Link href="/comment-ca-marche" className="hover:text-[#134288] transition">Comment ça marche</Link>
            <Link href="/metiers" className="text-[#134288]">Métiers</Link>
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
            Une solution par métier
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
            Chaque métier a son propre workflow, ses propres champs
            et son propre dashboard. Et vous pouvez créer le vôtre sans coder.
          </p>
        </div>
      </section>

      {/* Cards métiers détaillées */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-8">
          {METIERS.map((m, i) => (
            <div key={i} className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden hover:shadow-xl transition-shadow">
              <div className="grid md:grid-cols-3 gap-0">
                {/* Left: titre + description */}
                <div
                  className="p-6 md:p-8 text-white flex flex-col justify-between"
                  style={{ backgroundColor: m.color }}
                >
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                        {m.icon}
                      </div>
                      <div>
                        <h2 className="text-2xl font-black">{m.title}</h2>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-semibold">
                          {m.badge}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-white/90 leading-relaxed">{m.description}</p>
                  </div>
                  <div className="mt-6 pt-6 border-t border-white/20">
                    <p className="text-xs font-bold text-white/70 mb-1">EXPIRATION AUTO</p>
                    <p className="text-sm">{m.autoExpire}</p>
                  </div>
                </div>

                {/* Middle: champs */}
                <div className="p-6 md:p-8 border-t md:border-t-0 md:border-l border-slate-200">
                  <p className="text-xs font-bold text-[#32ba5d] mb-3">CHAMPS DE CHECK-IN</p>
                  <ul className="space-y-2">
                    {m.fields.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#32ba5d] flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Right: workflow */}
                <div className="p-6 md:p-8 border-t md:border-t-0 md:border-l border-slate-200 bg-slate-50">
                  <p className="text-xs font-bold text-[#134288] mb-3">WORKFLOW TROUVEUR</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{m.workflow}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Builder section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#134288] to-[#0d3266] text-white mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-3">
            Votre métier n\'est pas dans la liste ?
          </h2>
          <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
            Créez-le sans coder via notre builder de métiers personnalisés.
            Définissez vos champs, votre message WhatsApp, vos labels de dashboard.
          </p>
          <Link
            href="/demande-demo"
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
