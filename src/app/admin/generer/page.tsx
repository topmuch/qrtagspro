'use client';

/**
 * QRTagsPro V1 — Page Génération de QR codes (Superadmin)
 *
 * Workflow:
 *   1. Sélectionner une agence (dropdown avec toutes les agences existantes)
 *   2. Saisir la quantité (1 à 5000)
 *   3. Générer → crée les QR en DB (status: 'in_stock')
 *   4. Télécharger les QR en PNG (un par un ou en ZIP)
 *
 * Design: noir/jaune moutarde, cartes blanches, bordures noires 2px.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  QrCode, Building2, Package, Loader2, CheckCircle2, AlertCircle,
  ArrowLeft, Download, RefreshCw, Sparkles,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ─── Design tokens ──────────────────────────────────────────────────
const INPUT_CLASS =
  'w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-[#134288] text-black placeholder-gray-400 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d] transition';

interface Agency {
  id: string;
  name: string;
  slug: string;
  agencyType: string | null;
  email: string | null;
  phone: string | null;
  contactPhone: string | null;
  active: boolean;
  _count?: { baggages: number; users: number };
}

interface GenerateResult {
  success: boolean;
  generated: number;
  references: string[];
  agency?: { id: string; name: string; agencyType: string | null };
  error?: string;
}

// Libellés des types d'agence
const AGENCY_TYPE_LABELS: Record<string, string> = {
  hotel: '🏨 Hôtel',
  school: '🎓 École',
  luggage_locker: '🧳 Consigne',
  car_rental: '🚗 Loueur auto',
  medical: '🏥 Clinique',
  generic: '💼 Autre',
};

export default function GenererQRPage() {
  const { toast } = useToast();

  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loadingAgencies, setLoadingAgencies] = useState(true);

  const [selectedAgencyId, setSelectedAgencyId] = useState('');
  const [quantity, setQuantity] = useState(50);

  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [lastResult, setLastResult] = useState<GenerateResult | null>(null);

  // ─── Fetch agencies ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/agencies', { cache: 'no-store' });
        const data = await res.json();
        const list: Agency[] = data.agencies || [];
        // Filtrer uniquement les agences actives
        setAgencies(list.filter(a => a.active));
      } catch (err) {
        console.error('Fetch agencies error:', err);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les agences',
          variant: 'destructive',
        });
      } finally {
        setLoadingAgencies(false);
      }
    })();
  }, [toast]);

  const selectedAgency = agencies.find(a => a.id === selectedAgencyId);

  // ─── Generate ─────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedAgencyId) {
      toast({
        title: 'Agence requise',
        description: 'Veuillez sélectionner une agence destinataire',
        variant: 'destructive',
      });
      return;
    }

    if (quantity < 1 || quantity > 5000) {
      toast({
        title: 'Quantité invalide',
        description: 'Entre 1 et 5000 QR par lot',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    setLastResult(null);

    try {
      const res = await fetch('/api/admin/baggages/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId: selectedAgencyId,
          quantity,
        }),
      });

      const data: GenerateResult = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Échec de la génération');
      }

      setLastResult(data);
      toast({
        title: 'Génération réussie 🎉',
        description: `${data.generated} QR code(s) créés pour ${data.agency?.name}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      toast({
        title: 'Erreur de génération',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  // ─── Export PNG (un par un) ───────────────────────────────────────
  const handleExportPng = async () => {
    if (!lastResult || lastResult.references.length === 0) return;

    setExporting(true);
    try {
      const QRCode = (await import('qrcode')).default;
      const baseUrl = window.location.origin;

      for (const ref of lastResult.references) {
        const targetUrl = `${baseUrl}/scan/${ref}`;

        const dataUrl = await QRCode.toDataURL(targetUrl, {
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 512,
          color: {
            dark: '#111111', // QR en noir
            light: '#32ba5d', // fond jaune moutarde
          },
        });

        // Télécharger le PNG
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `QRTagsPro-${ref}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Petite pause entre chaque téléchargement
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      toast({
        title: 'Export terminé',
        description: `${lastResult.references.length} QR codes téléchargés en PNG`,
      });
    } catch (err) {
      console.error('Export error:', err);
      toast({
        title: 'Erreur d\'export',
        description: 'Impossible de générer les PNG',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/tableau-de-bord"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-black mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au tableau de bord
        </Link>
        <h1 className="text-2xl font-bold text-black flex items-center gap-2">
          <QrCode className="w-6 h-6" />
          Générer des QR codes
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Créez un lot de QR codes et assignez-le à une agence. L&apos;agence
          pourra ensuite faire le check-in de ses clients.
        </p>
      </div>

      {/* ─── Carte: Formulaire de génération ─── */}
      <div className="bg-white rounded-2xl p-6 border-2 border-[#134288] shadow-xl space-y-5">
        <h2 className="text-lg font-bold text-black flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Nouveau lot de QR codes
        </h2>

        {/* Sélection agence */}
        <div>
          <label htmlFor="agency" className="block text-sm font-semibold text-black mb-1.5">
            <Building2 className="w-3.5 h-3.5 inline mr-1" />
            Agence destinataire <span className="text-red-600">*</span>
          </label>
          {loadingAgencies ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Chargement des agences...
            </div>
          ) : agencies.length === 0 ? (
            <div className="p-3 rounded-xl bg-red-50 border-2 border-red-200 text-sm text-red-700">
              Aucune agence active.{' '}
              <Link href="/admin/agences" className="underline font-semibold">
                Créer une agence d&apos;abord
              </Link>
              .
            </div>
          ) : (
            <select
              id="agency"
              value={selectedAgencyId}
              onChange={(e) => setSelectedAgencyId(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">— Sélectionner une agence —</option>
              {agencies.map(a => (
                <option key={a.id} value={a.id}>
                  {AGENCY_TYPE_LABELS[a.agencyType || 'generic'] || '💼'} {a.name}
                  {a._count ? ` (${a._count.baggages} QR)` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Infos agence sélectionnée */}
        {selectedAgency && (
          <div className="p-4 rounded-xl bg-[#32ba5d]/15 border-2 border-[#32ba5d]/40 text-sm">
            <p className="font-bold text-black mb-2">
              {AGENCY_TYPE_LABELS[selectedAgency.agencyType || 'generic'] || '💼'} {selectedAgency.name}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-black/70">
              <div>
                <span className="font-semibold">Email:</span> {selectedAgency.email || '—'}
              </div>
              <div>
                <span className="font-semibold">Téléphone:</span> {selectedAgency.contactPhone || selectedAgency.phone || '—'}
              </div>
              <div className="col-span-2">
                <span className="font-semibold">Slug:</span> {selectedAgency.slug}
              </div>
            </div>
            {!selectedAgency.contactPhone && (
              <p className="mt-2 text-xs text-red-600 font-semibold">
                ⚠️ Pas de téléphone de réception configuré. Le trouveur ne pourra pas contacter l&apos;agence via WhatsApp.
              </p>
            )}
          </div>
        )}

        {/* Quantité */}
        <div>
          <label htmlFor="quantity" className="block text-sm font-semibold text-black mb-1.5">
            <Package className="w-3.5 h-3.5 inline mr-1" />
            Quantité de QR codes <span className="text-red-600">*</span>
          </label>
          <input
            id="quantity"
            type="number"
            min={1}
            max={5000}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            className={INPUT_CLASS}
          />
          <p className="mt-1 text-xs text-slate-500">
            Entre 1 et 5000 QR par lot. Au-delà, génère plusieurs lots.
          </p>
        </div>

        {/* Raccourcis quantité */}
        <div className="flex gap-2 flex-wrap">
          {[10, 50, 100, 500, 1000].map(q => (
            <button
              key={q}
              type="button"
              onClick={() => setQuantity(q)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border-2 transition ${
                quantity === q
                  ? 'bg-[#134288] text-white border-[#134288]'
                  : 'bg-white text-black border-[#134288]/20 hover:bg-black/5'
              }`}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Bouton générer */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || !selectedAgencyId || quantity < 1}
          className="w-full py-4 rounded-xl bg-[#134288] text-white font-bold border-2 border-[#134288] hover:-translate-y-0.5 transition-transform disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <QrCode className="w-5 h-5" />
              Générer {quantity} QR code{quantity > 1 ? 's' : ''}
            </>
          )}
        </button>
      </div>

      {/* ─── Résultat de la génération ─── */}
      {lastResult && lastResult.success && (
        <div className="bg-white rounded-2xl p-6 border-2 border-[#134288] shadow-xl space-y-4">
          <div className="flex items-start gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 flex-shrink-0">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-black">
                {lastResult.generated} QR code{lastResult.generated > 1 ? 's' : ''} généré{lastResult.generated > 1 ? 's' : ''} 🎉
              </h2>
              <p className="text-sm text-slate-600">
                Assignés à <strong className="text-black">{lastResult.agency?.name}</strong>.
                Ces QR sont maintenant en stock et prêts pour le check-in.
              </p>
            </div>
          </div>

          {/* Liste des références (limité à 50 pour la lisibilité) */}
          {lastResult.references.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-black/70 mb-2">
                RÉFÉRENCES GÉNÉRÉES ({lastResult.references.length})
              </p>
              <div className="max-h-48 overflow-y-auto bg-gray-50 rounded-xl p-3 border-2 border-[#134288]/10">
                <div className="flex flex-wrap gap-1.5">
                  {lastResult.references.slice(0, 200).map(ref => (
                    <span
                      key={ref}
                      className="px-2 py-1 bg-white border border-[#134288]/20 rounded font-mono text-xs text-black"
                    >
                      {ref}
                    </span>
                  ))}
                  {lastResult.references.length > 200 && (
                    <span className="px-2 py-1 text-xs text-slate-500 italic">
                      + {lastResult.references.length - 200} autres...
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="button"
              onClick={handleExportPng}
              disabled={exporting}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#32ba5d] text-white font-bold border-2 border-[#134288] hover:-translate-y-0.5 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Télécharger en PNG
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setLastResult(null)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-black font-bold border-2 border-[#134288] hover:-translate-y-0.5 transition-transform"
            >
              <RefreshCw className="w-4 h-4" />
              Nouveau lot
            </button>
          </div>

          {exporting && (
            <p className="text-xs text-slate-500 text-center">
              Téléchargement de {lastResult.references.length} fichiers PNG en cours...
              Merci d&apos;autoriser les téléchargements multiples.
            </p>
          )}
        </div>
      )}

      {/* ─── Info: comment ça marche ─── */}
      <div className="bg-white rounded-2xl p-6 border-2 border-[#134288]/20 shadow-md">
        <h3 className="text-base font-bold text-black mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Comment ça marche ?
        </h3>
        <ol className="space-y-2 text-sm text-black/80">
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#134288] text-white flex items-center justify-center text-xs font-bold">1</span>
            <span>Le superadmin sélectionne une agence et génère un lot de QR (ex: 500 QR pour un hôtel).</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#134288] text-white flex items-center justify-center text-xs font-bold">2</span>
            <span>Les QR sont créés en statut « en stock » et assignés à l&apos;agence.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#134288] text-white flex items-center justify-center text-xs font-bold">3</span>
            <span>Téléchargez les PNG et imprimez-les sur des stickers à poser sur les bagages/effets des clients.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#134288] text-white flex items-center justify-center text-xs font-bold">4</span>
            <span>L&apos;agence voit le stock dans son dashboard et fait le check-in client par client via <code className="bg-gray-100 px-1 rounded">/agence/check-in</code>.</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
