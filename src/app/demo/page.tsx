'use client';

/**
 * QRTagsPro V4 — Page Démo interactive (bac à sable)
 *
 * Le client potentiel scanne un vrai QR code, remplit un vrai formulaire,
 * voit sa géolocalisation détectée, et reçoit un vrai message WhatsApp.
 *
 * Les données sont automatiquement supprimées après 2 heures.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight, ArrowLeft, QrCode, Clock, AlertTriangle,
  Smartphone, MapPin, MessageCircle, CheckCircle2, RefreshCw,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';

const DEMO_PHONE = '33600000000'; // Numéro fictif pour la démo

export default function DemoPage() {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');

  // Générer le QR code dynamiquement (côté client pour éviter SSR issues)
  useEffect(() => {
    (async () => {
      try {
        const QRCode = (await import('qrcode')).default;
        const demoUrl = `${window.location.origin}/demo/finder?t=DEMO-TEST`;
        const dataUrl = await QRCode.toDataURL(demoUrl, {
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 400,
          color: {
            dark: '#134288',
            light: '#FFFFFF',
          },
        });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error('QR generation error:', err);
      }
    })();
  }, []);

  // Compteur visuel avant le prochain reset (toutes les 2 heures)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextReset = new Date(now);
      // Prochain reset à l'heure paire suivante
      const hoursToAdd = now.getMinutes() > 0 || now.getSeconds() > 0 ? 1 : 0;
      nextReset.setHours(now.getHours() + hoursToAdd + (now.getHours() % 2 === 0 ? 0 : 1), 0, 0, 0);

      const diff = nextReset.getTime() - now.getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeUntilReset(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <QRTagsLogo size="sm" href="/" withHover />
          <Link
            href="/demande-demo"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-[#32ba5d] text-white rounded-lg hover:bg-[#28a54f] transition"
          >
            Demander une démo pro
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#134288] to-[#0d3266] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#32ba5d]/20 border border-[#32ba5d]/40 mb-4">
            <Smartphone className="w-3.5 h-3.5 text-[#32ba5d]" />
            <span className="text-xs font-semibold text-[#32ba5d]">Démo interactive — Bac à sable</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            🎯 Testez QRTagsPro<br />
            <span className="text-[#32ba5d]">en temps réel</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
            Scannez ce QR code avec votre téléphone pour vivre l'expérience complète :
            formulaire, géolocalisation, et message WhatsApp pré-rempli.
          </p>
        </div>
      </section>

      {/* QR Code + Instructions */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* QR Code */}
            <div className="text-center">
              <div className="inline-block bg-white p-6 rounded-2xl shadow-xl border-2 border-[#134288]">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR code de démo"
                    className="w-64 h-64 mx-auto"
                  />
                ) : (
                  <div className="w-64 h-64 mx-auto bg-slate-100 rounded-lg flex items-center justify-center">
                    <RefreshCw className="w-12 h-12 text-slate-300 animate-spin" />
                  </div>
                )}
              </div>
              <p className="mt-4 text-sm text-slate-600">
                📸 Ouvrez l'appareil photo de votre téléphone et scannez ce QR code
              </p>
            </div>

            {/* Instructions + Avertissement */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 mb-3">
                  Comment ça marche ?
                </h2>
                <ol className="space-y-3">
                  {[
                    { icon: <QrCode className="w-5 h-5" />, text: 'Scannez le QR code avec votre téléphone' },
                    { icon: <MapPin className="w-5 h-5" />, text: 'Autorisez la géolocalisation (GPS)' },
                    { icon: <MessageCircle className="w-5 h-5" />, text: 'Remplissez le formulaire et cliquez sur WhatsApp' },
                    { icon: <CheckCircle2 className="w-5 h-5" />, text: "WhatsApp s'ouvre avec un message pré-rempli !" },
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#134288] text-white flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-700 pt-1">
                        <span className="text-[#32ba5d]">{step.icon}</span>
                        <span>{step.text}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Avertissement */}
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">⚠️ Ceci est une démo</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Les données que vous saisissez sont automatiquement supprimées
                      après 2 heures pour garantir la confidentialité.
                    </p>
                  </div>
                </div>
              </div>

              {/* Compteur reset */}
              <div className="bg-[#134288] rounded-xl p-4 text-white">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[#32ba5d]" />
                  <div>
                    <p className="text-xs text-blue-200">🔄 Prochain reset automatique dans :</p>
                    <p className="text-2xl font-mono font-bold text-[#32ba5d]">
                      {timeUntilReset || '...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lien direct (fallback si pas de caméra) */}
      <section className="py-8 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-600 mb-3">
            Pas de caméra ? Vous pouvez tester directement sur cet appareil :
          </p>
          <Link
            href="/demo/finder?t=DEMO-TEST"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#32ba5d] text-white font-bold rounded-lg hover:bg-[#28a54f] hover:-translate-y-0.5 transition-all shadow-lg"
          >
            Ouvrir le formulaire de démo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d3266] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-blue-200 hover:text-[#32ba5d]">
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
          <p className="mt-4 text-xs text-blue-300">© {new Date().getFullYear()} QRTagsPro — Démo interactive</p>
        </div>
      </footer>
    </div>
  );
}
