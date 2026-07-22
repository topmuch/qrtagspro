'use client';

/**
 * QRTagsPro — Bannière RGPD (cookie consent)
 *
 * S'affiche en bas de page au premier visite.
 * Stocke le consentement dans localStorage (qrtags_rgpd_consent).
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, X, Check } from 'lucide-react';

export default function RgpdBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà donné son consentement
    const consent = localStorage.getItem('qrtags_rgpd_consent');
    if (!consent) {
      // Délai de 1.5s pour ne pas perturber le chargement
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('qrtags_rgpd_consent', 'accepted');
    localStorage.setItem('qrtags_rgpd_date', new Date().toISOString());
    setVisible(false);
  };

  const handleRefuse = () => {
    localStorage.setItem('qrtags_rgpd_consent', 'refused');
    localStorage.setItem('qrtags_rgpd_date', new Date().toISOString());
    setVisible(false);
  };

  const handleClose = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-[1600px] mx-auto">
        <div className="bg-[#134288] text-white rounded-2xl shadow-2xl border-2 border-[#32ba5d] p-5 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Icône */}
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#32ba5d] flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>

            {/* Texte */}
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">🔒 Confidentialité & Cookies</h3>
              <p className="text-sm text-blue-100 leading-relaxed">
                QRTagsPro utilise des cookies techniques pour assurer le bon fonctionnement du site.
                Nous ne collectons aucune donnée à des fins publicitaires.
                Vos données sont protégées conformément au{' '}
                <Link href="/confidentialite" className="text-[#32ba5d] underline font-semibold">
                  RGPD
                </Link>
                . Voulez-vous accepter l'utilisation de cookies ?
              </p>
            </div>

            {/* Boutons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={handleAccept}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#32ba5d] text-white font-bold text-sm rounded-lg hover:bg-[#28a54f] transition shadow-lg"
              >
                <Check className="w-4 h-4" />
                Accepter
              </button>
              <button
                type="button"
                onClick={handleRefuse}
                className="px-4 py-2.5 bg-white/10 text-white font-medium text-sm rounded-lg border border-white/30 hover:bg-white/20 transition"
              >
                Refuser
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 text-white/50 hover:text-white transition"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
