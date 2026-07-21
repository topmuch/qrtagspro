'use client';

/**
 * QRTagsPro V4 — Page Intégration PMS (Dashboard Agence)
 *
 * Permet à l'agence de configurer son PMS (Cloudbeds, Mews, Sirvoy).
 * - Choix du provider (dropdown)
 * - Saisie de l'API Key + Property ID
 * - Bouton "Tester la connexion"
 * - Bouton "Supprimer la configuration"
 *
 * URL: /agence/pms
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Save, Trash2, Loader2, CheckCircle2, AlertCircle,
  Plug, Building2, Key, Server, Zap,
} from 'lucide-react';
import { useAgency } from '../layout';
import { useToast } from '@/hooks/use-toast';

const INPUT =
  'w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-[#134288] text-black placeholder-gray-400 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d] transition';

const PROVIDERS = [
  { value: 'NONE', label: '— Aucun PMS —', icon: '🚫' },
  { value: 'CLOUDBEDS', label: 'Cloudbeds', icon: '🏨' },
  { value: 'MEWS', label: 'Mews (bientôt)', icon: '🤖', disabled: true },
  { value: 'SIRVOY', label: 'Sirvoy (bientôt)', icon: '📞', disabled: true },
];

export default function PMSIntegrationPage() {
  const { agencyId, agencyName } = useAgency();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [form, setForm] = useState({
    provider: 'NONE',
    apiKey: '',
    propertyId: '',
    baseUrl: '',
  });

  const [existingConfig, setExistingConfig] = useState<{
    provider: string | null;
    propertyId: string | null;
    hasApiKey: boolean;
    baseUrl?: string | null;
  } | null>(null);

  // ─── Charger la config existante ────────────────────────────────
  useEffect(() => {
    if (!agencyId) return;
    (async () => {
      try {
        const res = await fetch(`/api/agency/pms?agencyId=${agencyId}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.config) {
          setExistingConfig(data.config);
          setForm({
            provider: data.config.provider || 'NONE',
            apiKey: '', // toujours vide pour sécurité
            propertyId: data.config.propertyId || '',
            baseUrl: data.config.baseUrl || '',
          });
        }
      } catch (err) {
        console.error('Fetch PMS config error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [agencyId]);

  // ─── Sauvegarder ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (form.provider === 'NONE') {
      toast({ title: 'Sélectionnez un provider', variant: 'destructive' });
      return;
    }
    if (!form.apiKey.trim() && !existingConfig?.hasApiKey) {
      toast({ title: 'Clé API requise', variant: 'destructive' });
      return;
    }
    if (!form.propertyId.trim()) {
      toast({ title: 'Property ID requis', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string> = {
        agencyId,
        provider: form.provider,
        propertyId: form.propertyId,
      };
      // Si l'utilisateur a saisi une nouvelle clé, on l'envoie
      // Sinon on garde l'existante (envoyer une string vide = effacer)
      if (form.apiKey.trim()) {
        body.apiKey = form.apiKey.trim();
      } else if (existingConfig?.hasApiKey) {
        // Récupérer la clé existante — on ne peut pas, elle est masquée
        // Donc si l'utilisateur ne saisit rien, on demande de re-saisir
        toast({
          title: 'Clé API requise',
          description: 'Pour des raisons de sécurité, veuillez re-saisir votre clé API.',
          variant: 'destructive',
        });
        setSaving(false);
        return;
      }
      if (form.baseUrl.trim()) body.baseUrl = form.baseUrl.trim();

      const res = await fetch('/api/agency/pms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Échec sauvegarde');

      toast({ title: 'Configuration sauvegardée ✅' });
      setForm({ ...form, apiKey: '' }); // Vider le champ clé après save
      setTestResult(null);
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // ─── Tester la connexion ─────────────────────────────────────────
  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/agency/pms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyId }),
      });
      const data = await res.json();
      setTestResult(data);
      toast({
        title: data.success ? 'Connexion réussie ✅' : 'Échec connexion ❌',
        description: data.message,
        variant: data.success ? 'default' : 'destructive',
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Erreur réseau',
      });
    } finally {
      setTesting(false);
    }
  };

  // ─── Supprimer la config ─────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirm('Supprimer la configuration PMS ? Les webhooks ne fonctionneront plus.')) return;
    try {
      await fetch(`/api/agency/pms?agencyId=${agencyId}`, { method: 'DELETE' });
      toast({ title: 'Configuration supprimée' });
      setForm({ provider: 'NONE', apiKey: '', propertyId: '', baseUrl: '' });
      setExistingConfig(null);
      setTestResult(null);
    } catch {
      toast({ title: 'Erreur suppression', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#134288]" />
      </div>
    );
  }

  const isConfigured = existingConfig?.provider && existingConfig.provider !== 'NONE';

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <Link
          href="/agence/tableau-de-bord"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#134288] mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au tableau de bord
        </Link>
        <h1 className="text-2xl font-bold text-black flex items-center gap-2">
          <Plug className="w-6 h-6 text-[#134288]" />
          Intégration PMS
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {agencyName} — Connectez votre logiciel de gestion hôtelière pour automatiser
          l'activation et la désactivation des QR codes.
        </p>
      </div>

      {/* Statut actuel */}
      {isConfigured ? (
        <div className="bg-[#32ba5d]/10 border-2 border-[#32ba5d]/30 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-[#32ba5d] flex-shrink-0" />
          <div>
            <p className="font-bold text-[#134288]">
              PMS connecté : {existingConfig?.provider}
            </p>
            <p className="text-xs text-slate-600">
              Property ID: {existingConfig?.propertyId}
              {existingConfig?.baseUrl ? ` • URL: ${existingConfig.baseUrl}` : ''}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            Aucun PMS configuré. Configurez-le ci-dessous pour automatiser les check-in/check-out.
          </p>
        </div>
      )}

      {/* Formulaire */}
      <div className="bg-white rounded-2xl p-6 border-2 border-[#134288] shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-black mb-2">Configuration</h2>

        {/* Provider */}
        <div>
          <label className="block text-sm font-semibold text-black mb-1.5">
            <Building2 className="w-3.5 h-3.5 inline mr-1" />
            Provider PMS
          </label>
          <select
            value={form.provider}
            onChange={(e) => setForm({ ...form, provider: e.target.value })}
            className={INPUT}
          >
            {PROVIDERS.map(p => (
              <option key={p.value} value={p.value} disabled={p.disabled}>
                {p.icon} {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-semibold text-black mb-1.5">
            <Key className="w-3.5 h-3.5 inline mr-1" />
            Clé API {existingConfig?.hasApiKey && <span className="text-xs text-[#32ba5d]">(définie — re-saisir pour modifier)</span>}
          </label>
          <input
            type="password"
            value={form.apiKey}
            onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
            placeholder={existingConfig?.hasApiKey ? '••••••••••••' : 'Votre clé API Cloudbeds'}
            className={INPUT}
          />
        </div>

        {/* Property ID */}
        <div>
          <label className="block text-sm font-semibold text-black mb-1.5">
            <Server className="w-3.5 h-3.5 inline mr-1" />
            Property ID
          </label>
          <input
            type="text"
            value={form.propertyId}
            onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
            placeholder="Ex: hotel-12345"
            className={INPUT}
          />
        </div>

        {/* Base URL (optionnel) */}
        <div>
          <label className="block text-sm font-semibold text-black mb-1.5">
            URL de base API (optionnel)
          </label>
          <input
            type="text"
            value={form.baseUrl}
            onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
            placeholder="https://api.cloudbeds.com/pms/1.3/"
            className={INPUT}
          />
          <p className="text-xs text-slate-500 mt-1">
            Laisser vide pour utiliser l'URL par défaut (Sandbox Cloudbeds).
          </p>
        </div>

        {/* Résultat test */}
        {testResult && (
          <div
            className={`p-3 rounded-xl border-2 text-sm ${
              testResult.success
                ? 'bg-[#32ba5d]/10 border-[#32ba5d]/30 text-[#134288]'
                : 'bg-red-50 border-red-300 text-red-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {testResult.success
                ? <CheckCircle2 className="w-4 h-4 text-[#32ba5d]" />
                : <AlertCircle className="w-4 h-4 text-red-500" />}
              <span>{testResult.message}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || form.provider === 'NONE'}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#134288] text-white font-bold border-2 border-[#134288] hover:bg-[#0d3266] hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Sauvegarder
          </button>

          <button
            type="button"
            onClick={handleTest}
            disabled={testing || !isConfigured}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#32ba5d] text-white font-bold border-2 border-[#32ba5d] hover:bg-[#28a54f] hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Tester la connexion
          </button>

          {isConfigured && (
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-red-600 font-bold border-2 border-red-200 hover:bg-red-50 transition-all text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          )}
        </div>
      </div>

      {/* Webhook info */}
      {isConfigured && (
        <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Plug className="w-4 h-4 text-[#134288]" />
            URL Webhook à configurer dans votre PMS
          </h3>
          <div className="bg-white rounded-lg p-3 border border-slate-300 font-mono text-xs text-slate-700 break-all">
            {typeof window !== 'undefined' ? window.location.origin : 'https://votre-domaine.com'}/api/webhooks/pms
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Configurez cette URL dans Cloudbeds → Settings → Webhooks.
            Headers à envoyer: X-PMS-Provider, X-PMS-Agency-Id ({agencyId}), X-PMS-Event.
          </p>
        </div>
      )}
    </div>
  );
}
