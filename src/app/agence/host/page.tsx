'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Loader2,
  AlertCircle,
  Save,
  Eye,
  Wifi,
  KeyRound,
  Home,
  BookOpen,
  MapPin,
  MessageCircle,
  Calendar,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import {
  getHouseGuide,
  saveHouseGuide,
  type HouseGuideData,
  type AgencyInfo,
} from './actions';

// ─── Types locaux ────────────────────────────────────────────────────────────

interface FormState {
  wifiNetwork: string;
  wifiPassword: string;
  checkInInstructions: string;
  checkOutInstructions: string;
  checkInTime: string;
  checkOutTime: string;
  houseRules: string;
  homeTutorials: string;
  hostRecommendations: string;
  hostName: string;
  hostPhone: string;
  hostWelcomeMessage: string;
}

const EMPTY_FORM: FormState = {
  wifiNetwork: '',
  wifiPassword: '',
  checkInInstructions: '',
  checkOutInstructions: '',
  checkInTime: '15:00',
  checkOutTime: '11:00',
  houseRules: '',
  homeTutorials: '',
  hostRecommendations: '',
  hostName: '',
  hostPhone: '',
  hostWelcomeMessage: '',
};

// ─── Composant principal ─────────────────────────────────────────────────────

export default function HostGuideDashboardPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [agency, setAgency] = useState<AgencyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [profileWasSwitched, setProfileWasSwitched] = useState(false);

  // ─── Chargement initial ───
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getHouseGuide();
      if (!result.success) {
        setError(result.error || 'Erreur de chargement');
        return;
      }
      setAgency(result.agency || null);

      if (result.guide) {
        setForm({
          wifiNetwork: result.guide.wifiNetwork || '',
          wifiPassword: result.guide.wifiPassword || '',
          checkInInstructions: result.guide.checkInInstructions || '',
          checkOutInstructions: result.guide.checkOutInstructions || '',
          checkInTime: result.guide.checkInTime || '15:00',
          checkOutTime: result.guide.checkOutTime || '11:00',
          houseRules: result.guide.houseRules || '',
          homeTutorials: result.guide.homeTutorials || '',
          hostRecommendations: result.guide.hostRecommendations || '',
          hostName: result.guide.hostName || '',
          hostPhone: result.guide.hostPhone || '',
          hostWelcomeMessage: result.guide.hostWelcomeMessage || '',
        });
      }
    } catch (err) {
      console.error('[host-guide] load error:', err);
      setError('Une erreur est survenue lors du chargement.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Update helper ───
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ─── Save ───
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    setProfileWasSwitched(false);

    try {
      const result = await saveHouseGuide({
        ...form,
        isActive: true,
      });

      if (!result.success) {
        setError(result.error || 'Erreur lors de la sauvegarde.');
        return;
      }

      if (result.profileSwitched) {
        setProfileWasSwitched(true);
        // Refresh agency state to reflect the switch
        await loadData();
      }

      setSuccess('Guide enregistré ✓');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      console.error('[host-guide] save error:', err);
      setError('Une erreur est survenue lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  // ─── États ───
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#134288] dark:text-[#32ba5d]" />
        <span className="ml-3 text-slate-600 dark:text-slate-300">
          Chargement du guide de la maison…
        </span>
      </div>
    );
  }

  if (error && !agency) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Erreur</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
        <button
          onClick={loadData}
          className="px-6 py-3 bg-[#134288] text-white font-bold rounded-xl hover:bg-[#0f3670] dark:bg-[#32ba5d] dark:text-black dark:hover:bg-[#2ba14f] transition"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const welcomeUrl = agency
    ? `/welcome/${agency.slug}?context=WRISTBAND`
    : '#';
  const needsProfileSwitch = agency && agency.braceletProfile !== 'HOST';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Home className="w-7 h-7 text-[#134288] dark:text-[#32ba5d]" />
            Guide de la maison
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Ce guide s&apos;affiche sur le QR code du chevalet, accessible par vos voyageurs Airbnb.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/agence/host/reservations"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition text-sm"
          >
            <Calendar className="w-4 h-4" />
            Réservations
          </Link>
          <Link
            href={welcomeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#134288]/10 hover:bg-[#134288]/20 text-[#134288] dark:text-[#32ba5d] font-semibold rounded-xl border border-[#134288]/20 dark:border-[#32ba5d]/30 transition text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Voir la page
          </Link>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 font-bold rounded-xl transition text-sm ${
              showPreview
                ? 'bg-[#32ba5d] text-black hover:bg-[#2ba14f]'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Masquer preview' : 'Preview'}
          </button>
        </div>
      </div>

      {/* ─── Banner : profile pas HOST ─── */}
      {needsProfileSwitch && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-bold text-amber-800 dark:text-amber-300">
              Profil bracelet : {agency?.braceletProfile || 'STANDARD'}
            </p>
            <p className="text-amber-700 dark:text-amber-400 mt-0.5">
              Votre page voyageur n&apos;utilisera pas la vue &quot;Guide de la maison&quot; tant que
              le profil bracelet n&apos;est pas <strong>HOST</strong>. En sauvegardant ce guide,
              le profil sera automatiquement basculé en <strong>HOST</strong>.
            </p>
          </div>
        </div>
      )}

      {/* ─── Success / Error ─── */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-bold text-green-800 dark:text-green-300">{success}</p>
            {profileWasSwitched && (
              <p className="text-green-700 dark:text-green-400 mt-0.5">
                ✓ Profil bracelet basculé en <strong>HOST</strong>. La page voyageur affiche
                désormais le guide de la maison.
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400 flex-1">{error}</p>
        </div>
      )}

      <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-[1fr_400px]' : 'grid-cols-1'}`}>
        {/* ─── Form ─── */}
        <form onSubmit={handleSave} className="space-y-5">
          {/* ─── Section : WiFi ─── */}
          <Section icon={<Wifi className="w-4 h-4" />} title="WiFi">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nom du réseau (SSID)">
                <input
                  type="text"
                  value={form.wifiNetwork}
                  onChange={(e) => update('wifiNetwork', e.target.value)}
                  placeholder="Ex: Almadies-Wifi-5G"
                  className={inputCls}
                />
              </Field>
              <Field label="Mot de passe">
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={form.wifiPassword}
                    onChange={(e) => update('wifiPassword', e.target.value)}
                    placeholder="Ex: Bienvenue2026"
                    className={`${inputCls} pl-9 font-mono`}
                  />
                </div>
              </Field>
            </div>
          </Section>

          {/* ─── Section : Check-in / Check-out ─── */}
          <Section icon={<Calendar className="w-4 h-4" />} title="Check-in / Check-out">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Heure d'arrivée">
                <input
                  type="time"
                  value={form.checkInTime}
                  onChange={(e) => update('checkInTime', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Heure de départ">
                <input
                  type="time"
                  value={form.checkOutTime}
                  onChange={(e) => update('checkOutTime', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Instructions d'arrivée (Markdown)" className="mt-4">
              <textarea
                value={form.checkInInstructions}
                onChange={(e) => update('checkInInstructions', e.target.value)}
                rows={4}
                placeholder={'## Arrivée\n1. Boîte à clés : code **4592**\n2. 3ème étage, porte gauche'}
                className={`${textareaCls} font-mono text-xs`}
              />
              <MarkdownHint />
            </Field>
            <Field label="Instructions de départ (Markdown)" className="mt-4">
              <textarea
                value={form.checkOutInstructions}
                onChange={(e) => update('checkOutInstructions', e.target.value)}
                rows={4}
                placeholder={'## Départ\n1. Déposez les clés dans la boîte\n2. Fermez les fenêtres'}
                className={`${textareaCls} font-mono text-xs`}
              />
              <MarkdownHint />
            </Field>
          </Section>

          {/* ─── Section : Règles ─── */}
          <Section icon={<BookOpen className="w-4 h-4" />} title="Règles de la maison">
            <Field label="Règles (Markdown)">
              <textarea
                value={form.houseRules}
                onChange={(e) => update('houseRules', e.target.value)}
                rows={5}
                placeholder={'## Règles\n✅ Fumeurs sur le balcon\n❌ Fêtes après 22h'}
                className={`${textareaCls} font-mono text-xs`}
              />
              <MarkdownHint />
            </Field>
          </Section>

          {/* ─── Section : Recommandations ─── */}
          <Section icon={<MapPin className="w-4 h-4" />} title="Recommandations de l'hôte">
            <Field label="Vos bonnes adresses (Markdown)">
              <textarea
                value={form.hostRecommendations}
                onChange={(e) => update('hostRecommendations', e.target.value)}
                rows={6}
                placeholder={'## Mes adresses\n### Restaurants\n- **Le Khaymandar** (50m) — gastronomique'}
                className={`${textareaCls} font-mono text-xs`}
              />
              <MarkdownHint />
            </Field>
          </Section>

          {/* ─── Section : Contact hôte ─── */}
          <Section icon={<MessageCircle className="w-4 h-4" />} title="Contact hôte">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nom de l'hôte">
                <input
                  type="text"
                  value={form.hostName}
                  onChange={(e) => update('hostName', e.target.value)}
                  placeholder="Ex: Awa Diop"
                  className={inputCls}
                />
              </Field>
              <Field label="Téléphone WhatsApp">
                <input
                  type="tel"
                  value={form.hostPhone}
                  onChange={(e) => update('hostPhone', e.target.value)}
                  placeholder="Ex: +221 77 555 12 34"
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Message de bienvenue" className="mt-4">
              <textarea
                value={form.hostWelcomeMessage}
                onChange={(e) => update('hostWelcomeMessage', e.target.value)}
                rows={3}
                placeholder="Bienvenue chez moi ! N'hésitez pas à me contacter pour quoi que ce soit."
                className={textareaCls}
              />
            </Field>
          </Section>

          {/* ─── Submit ─── */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => loadData()}
              disabled={saving}
              className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-50 text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#32ba5d] text-black font-bold rounded-xl hover:bg-[#2ba14f] transition disabled:opacity-50 text-sm shadow-lg shadow-[#32ba5d]/20"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Enregistrer le guide
                </>
              )}
            </button>
          </div>
        </form>

        {/* ─── Preview panel ─── */}
        {showPreview && <PreviewPanel form={form} agencyName={agency?.name || 'Mon logement'} />}
      </div>
    </div>
  );
}

// ─── Sous-composants ─────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:border-[#134288] dark:focus:border-[#32ba5d] outline-none transition text-sm';

const textareaCls =
  'w-full px-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:border-[#134288] dark:focus:border-[#32ba5d] outline-none transition text-sm resize-y';

function MarkdownHint() {
  return (
    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
      💡 Markdown supporté : <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">#</code> titre,{' '}
      <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">**gras**</code>,{' '}
      <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">- liste</code>
    </p>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
      <h2 className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 uppercase tracking-wide">
        <span className="w-7 h-7 rounded-lg bg-[#134288]/10 dark:bg-[#32ba5d]/10 flex items-center justify-center text-[#134288] dark:text-[#32ba5d]">
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Preview : mobile mockup ─────────────────────────────────────────────────

function PreviewPanel({ form, agencyName }: { form: FormState; agencyName: string }) {
  return (
    <div className="lg:sticky lg:top-6 self-start">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Eye className="w-3.5 h-3.5" />
          Aperçu mobile
        </p>

        {/* ─── Phone frame ─── */}
        <div className="mx-auto w-full max-w-[300px] bg-slate-900 dark:bg-black rounded-[2rem] p-2 shadow-2xl">
          <div className="bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 rounded-[1.6rem] overflow-hidden h-[560px] overflow-y-auto">
            {/* ─── Status bar ─── */}
            <div className="bg-[#134288] text-white text-center py-2 text-[10px] font-medium">
              {agencyName}
            </div>

            {/* ─── Welcome ─── */}
            {form.hostWelcomeMessage && (
              <div className="bg-[#134288]/5 dark:bg-[#32ba5d]/5 border-b border-[#134288]/10 dark:border-[#32ba5d]/10 p-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Votre hôte</p>
                <p className="font-bold text-slate-800 dark:text-white text-sm">
                  {form.hostName || 'Hôte'}
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 italic mt-1 leading-snug">
                  &ldquo;{form.hostWelcomeMessage}&rdquo;
                </p>
              </div>
            )}

            {/* ─── WiFi ─── */}
            <PreviewBlock icon="📶" title="WiFi">
              {form.wifiNetwork && (
                <div className="text-[11px]">
                  <span className="text-slate-400">Réseau : </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-white">
                    {form.wifiNetwork}
                  </span>
                </div>
              )}
              {form.wifiPassword && (
                <div className="text-[11px] mt-1">
                  <span className="text-slate-400">Mot de passe : </span>
                  <span className="font-mono font-bold text-[#134288] dark:text-[#32ba5d]">
                    {form.wifiPassword}
                  </span>
                </div>
              )}
              {!form.wifiNetwork && !form.wifiPassword && (
                <p className="text-[11px] text-slate-400 italic">Non configuré</p>
              )}
            </PreviewBlock>

            {/* ─── Check-in / Check-out ─── */}
            <PreviewBlock icon="🔑" title="Check-in / Check-out">
              <div className="flex gap-3 text-[11px]">
                <div>
                  <span className="text-slate-400">Arrivée : </span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {form.checkInTime || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Départ : </span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {form.checkOutTime || '—'}
                  </span>
                </div>
              </div>
              {form.checkInInstructions && (
                <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                  {form.checkInInstructions}
                </div>
              )}
            </PreviewBlock>

            {/* ─── Règles ─── */}
            {form.houseRules && (
              <PreviewBlock icon="📋" title="Règles de la maison">
                <p className="text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                  {form.houseRules}
                </p>
              </PreviewBlock>
            )}

            {/* ─── Recommandations ─── */}
            {form.hostRecommendations && (
              <PreviewBlock icon="📍" title="Bonnes adresses">
                <p className="text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                  {form.hostRecommendations}
                </p>
              </PreviewBlock>
            )}

            {/* ─── Contact ─── */}
            {form.hostPhone && (
              <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="block w-full py-2 bg-[#32ba5d] text-black text-center text-xs font-bold rounded-lg"
                >
                  💬 Contacter {form.hostName || 'l\'hôte'}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewBlock({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-3 border-b border-slate-200 dark:border-slate-800">
      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
        <span>{icon}</span>
        {title}
      </p>
      {children}
    </div>
  );
}
