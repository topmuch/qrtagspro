'use client';

/**
 * QRTagsPro — Page "Avantages"
 *
 * Détaille les avantages clés de la solution.
 */

import Link from 'next/link';
import {
  ArrowRight, ArrowLeft, Shield, BarChart3, Zap, Clock,
  Lock, Bell, Users, CheckCircle2, Building2, MessageCircle,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';

const AVANTAGES = [
  {
    icon: <Shield className="w-10 h-10" />,
    title: 'Contrôle total',
    description: 'Votre réception garde le contrôle à 100%. Le trouveur vous contacte, pas le client directement. Vous vérifiez l\'identité du client avant toute restitution.',
    points: [
      'Le trouveur ne voit jamais les coordonnées client',
      'L\'établissement vérifie le client dans son dashboard',
      'Restitution organisée par le staff (pas par le trouveur)',
    ],
  },
  {
    icon: <BarChart3 className="w-10 h-10" />,
    title: 'Dashboard temps réel',
    description: 'Suivez en temps réel les QR actifs, les check-out à venir, les objets perdus. Statistiques complètes par métier avec historique des scans.',
    points: [
      'Stock QR + QR actifs + check-out du jour + perdus',
      'Historique des scans avec position GPS',
      'Bouton "Demander plus de QR" si stock bas',
      'Adapté à chaque métier (labels personnalisés)',
    ],
  },
  {
    icon: <Zap className="w-10 h-10" />,
    title: 'Setup en 5 minutes',
    description: 'Aucune installation, aucune application à télécharger. Créez votre agence, générez vos QR, activez vos clients. Tout se passe dans le navigateur.',
    points: [
      'Aucune installation côté trouveur (juste un scan)',
      'Aucune application à télécharger',
      'WhatsApp WAME = click-to-chat direct',
      'Accessible depuis n\'importe quel appareil',
    ],
  },
  {
    icon: <Clock className="w-10 h-10" />,
    title: 'Auto-expiration',
    description: 'Les QR s\'expirent automatiquement à la date de départ configurée. Plus besoin de gérer manuellement le check-out de chaque client.',
    points: [
      'Cron job toutes les heures',
      'Date de départ = date de check-out du client',
      'Notification à l\'agence à chaque check-out auto',
      'Check-out manuel aussi disponible (bouton)',
    ],
  },
];

const TRUST = [
  {
    icon: <Lock className="w-8 h-8" />,
    title: 'Confidentialité',
    description: 'Le trouveur ne voit jamais les coordonnées du client. Seul le nom de l\'établissement est affiché.',
  },
  {
    icon: <Bell className="w-8 h-8" />,
    title: 'WhatsApp WAME',
    description: 'Click-to-chat direct (wa.me). Aucune API, aucune installation, aucun coût. Le message est pré-rempli avec la position GPS.',
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: 'Multi-utilisateurs',
    description: 'Plusieurs membres du staff peuvent se connecter au dashboard avec le même compte agence. Pas de limite.',
  },
  {
    icon: <Building2 className="w-8 h-8" />,
    title: 'Multi-agences',
    description: 'Le superadmin gère plusieurs agences depuis un seul compte. Chaque agence est indépendante avec son stock et ses clients.',
  },
];

export default function AvantagesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <QRTagsLogo size="sm" href="/" withHover />
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
            <Link href="/comment-ca-marche" className="hover:text-[#134288] transition">Comment ça marche</Link>
            <Link href="/metiers" className="hover:text-[#134288] transition">Métiers</Link>
            <Link href="/avantages" className="text-[#134288]">Avantages</Link>
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
            Pourquoi QRTagsPro ?
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
            Pensé pour les entreprises, simple pour vos équipes,
            sécurisé pour vos clients.
          </p>
        </div>
      </section>

      {/* Avantages détaillés */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-12">
          {AVANTAGES.map((a, i) => (
            <div key={i} className="grid md:grid-cols-2 gap-8 items-start">
              {/* Icône + titre */}
              <div>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#134288] to-[#0d3266] text-white mb-4">
                  {a.icon}
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-3">{a.title}</h2>
                <p className="text-slate-600 leading-relaxed">{a.description}</p>
              </div>

              {/* Points */}
              <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-200">
                <p className="text-xs font-bold text-[#32ba5d] mb-4">EN DÉTAIL</p>
                <ul className="space-y-3">
                  {a.points.map((p, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#32ba5d] flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bandeau trust */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-black text-slate-900 mb-8 text-center">
            Et aussi...
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {TRUST.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border-2 border-slate-200 text-center hover:border-[#32ba5d] transition-colors">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#134288]/10 text-[#134288] mb-3">
                  {t.icon}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{t.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{t.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#134288] text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 text-[#32ba5d]" />
          <h2 className="text-3xl font-black mb-4">Convaincu ?</h2>
          <p className="text-blue-100 mb-8">
            Demandez une démo et découvrez QRTagsPro adapté à votre métier.
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
