'use client';

import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';

export default function CguPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <QRTagsLogo size="sm" href="/" withHover />
          <Link href="/" className="text-sm text-slate-500 hover:text-[#134288]">
            <ArrowLeft className="w-4 h-4 inline mr-1" /> Accueil
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#134288] flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900">Conditions d'utilisation</h1>
        </div>

        <div className="prose prose-slate max-w-none space-y-6">
          <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Objet</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              Les présentes conditions d'utilisation régissent l'utilisation de la plateforme QRTagsPro,
              service de gestion d'objets perdus via QR codes pour les entreprises. En utilisant le service,
              vous acceptez sans réserve les présentes conditions.
            </p>
          </section>

          <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Définitions</h2>
            <ul className="text-sm text-slate-700 space-y-2 list-disc list-inside">
              <li><strong>QRTagsPro</strong> : la plateforme SaaS éditée par QRTagsPro</li>
              <li><strong>Établissement</strong> : l'entreprise cliente (hôtel, école, clinique, etc.)</li>
              <li><strong>Client final</strong> : le client de l'établissement (voyageur, élève, patient)</li>
              <li><strong>Trouveur</strong> : la personne qui trouve un objet étiqueté</li>
              <li><strong>QR code</strong> : l'étiquette physique liée à la plateforme</li>
            </ul>
          </section>

          <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Services proposés</h2>
            <ul className="text-sm text-slate-700 space-y-2 list-disc list-inside">
              <li>Génération de QR codes assignés à un établissement</li>
              <li>Check-in des clients avec informations personnalisées par métier</li>
              <li>Page trouveur avec contact WhatsApp WAME (click-to-chat)</li>
              <li>Dashboard de suivi temps réel</li>
              <li>Check-out automatique à la date de départ</li>
              <li>Mode fidélisation (contact direct client après séjour avec opt-in)</li>
              <li>Intégration PMS (Cloudbeds, Mews, Sirvoy)</li>
            </ul>
          </section>

          <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Responsabilités</h2>
            <p className="text-sm text-slate-700 leading-relaxed mb-3">
              QRTagsPro est un outil de traçabilité et de contact. QRTagsPro ne garantit pas la restitution
              effective des objets perdus. La responsabilité de QRTagsPro ne peut être engagée en cas de :
            </p>
            <ul className="text-sm text-slate-700 space-y-2 list-disc list-inside">
              <li>Perte ou vol d'un objet malgré l'étiquette QR</li>
              <li>Non-respect du trouveur des consignes affichées</li>
              <li>Indisponibilité temporaire du service (maintenance, panne)</li>
              <li>Données inexactes saisies par l'établissement</li>
            </ul>
          </section>

          <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Tarifs</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              Les tarifs sont disponibles sur la page <Link href="/tarifs" className="text-[#134288] underline">Tarifs</Link>.
              Les QR codes achetés sont valides 1 an à compter de la date de génération.
              Le mode fidélisation (contact direct après séjour) est inclus dans toutes les formules.
            </p>
          </section>

          <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Résiliation</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              L'établissement peut résilier son compte à tout moment. Les QR codes déjà activés restent
              fonctionnels jusqu'à leur expiration. Aucun remboursement n'est dû pour les QR codes
              non utilisés.
            </p>
          </section>

          <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-3">7. Contact</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              Email : contact@qrtagspro.com<br />
              Voir aussi : <Link href="/contact" className="text-[#134288] underline">Page contact</Link>
            </p>
          </section>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#134288]">
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
