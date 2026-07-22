'use client';

/**
 * QRTagsPro — Politique de confidentialité (RGPD)
 */

import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, Trash2, Mail } from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';

export default function ConfidentialitePage() {
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
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900">Politique de confidentialité</h1>
            <p className="text-sm text-slate-500">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none space-y-8">
          <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#134288]" /> 1. Données collectées
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed mb-3">
              QRTagsPro collecte les données suivantes dans le cadre de son service de gestion d'objets perdus :
            </p>
            <ul className="text-sm text-slate-700 space-y-2 list-disc list-inside">
              <li><strong>Données établissement</strong> : nom, adresse, téléphone, email, logo</li>
              <li><strong>Données client</strong> : nom, prénom, n° de chambre, dates de séjour, téléphone (si opt-in)</li>
              <li><strong>Données trouveur</strong> : nom, téléphone, position GPS (volontairement partagées)</li>
              <li><strong>Données de connexion</strong> : email, mot de passe (chiffré bcrypt), logs de session</li>
              <li><strong>Données de scan</strong> : position GPS, date/heure, adresse IP (anonymisée)</li>
            </ul>
          </section>

          <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#134288]" /> 2. Protection des données
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed mb-3">
              QRTagsPro met en œuvre les mesures techniques suivantes pour protéger vos données :
            </p>
            <ul className="text-sm text-slate-700 space-y-2 list-disc list-inside">
              <li>Mots de passe chiffrés avec bcrypt (hash irréversible)</li>
              <li>Clés API chiffrées en base de données</li>
              <li>Communications HTTPS/TLS sur tout le site</li>
              <li>Le trouveur ne voit <strong>JAMAIS</strong> les coordonnées du client</li>
              <li>Le contact direct client après séjour nécessite un <strong>opt-in explicite</strong></li>
              <li>Les données de démo sont supprimées automatiquement après 2 heures</li>
            </ul>
          </section>

          <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#134288]" /> 3. Utilisation des données
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed mb-3">
              Les données sont utilisées exclusivement pour :
            </p>
            <ul className="text-sm text-slate-700 space-y-2 list-disc list-inside">
              <li>Permettre le contact entre le trouveur et l'établissement via WhatsApp</li>
              <li>Afficher le statut des objets dans le dashboard de l'établissement</li>
              <li>Générer des statistiques agrégées (anonymisées)</li>
              <li>Assurer le support technique</li>
            </ul>
            <p className="text-sm text-slate-700 leading-relaxed mt-3">
              <strong>QRTagsPro ne vend jamais vos données</strong> à des tiers.
            </p>
          </section>

          <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-[#134288]" /> 4. Durée de conservation
            </h2>
            <ul className="text-sm text-slate-700 space-y-2 list-disc list-inside">
              <li><strong>Données de démo</strong> : supprimées après 2 heures</li>
              <li><strong>QR codes actifs</strong> : conservés pendant la durée du séjour + 1 an après expiration</li>
              <li><strong>Logs de scan</strong> : conservés 90 jours puis supprimés</li>
              <li><strong>Comptes utilisateurs</strong> : conservés tant que l'établissement est client</li>
            </ul>
          </section>

          <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#134288]" /> 5. Vos droits (RGPD)
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed mb-3">
              Conformément au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="text-sm text-slate-700 space-y-2 list-disc list-inside">
              <li><strong>Droit d'accès</strong> : consulter les données que nous détenons sur vous</li>
              <li><strong>Droit de rectification</strong> : corriger des données inexactes</li>
              <li><strong>Droit à l'effacement</strong> : demander la suppression de vos données</li>
              <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
              <li><strong>Droit d'opposition</strong> : refuser le traitement de vos données</li>
            </ul>
            <p className="text-sm text-slate-700 leading-relaxed mt-3">
              Pour exercer ces droits, contactez-nous à :
              <a href="mailto:rgpd@qrtagspro.com" className="font-semibold text-[#134288] underline ml-1">
                rgpd@qrtagspro.com
              </a>
            </p>
          </section>

          <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#134288]" /> 6. Contact
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              Pour toute question relative à la protection des données :<br />
              <strong>Email DPO</strong> : rgpd@qrtagspro.com<br />
              <strong>Adresse</strong> : QRTagsPro, Paris, France
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
