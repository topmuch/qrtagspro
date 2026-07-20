'use client';

import { useState, useEffect, useCallback } from 'react';
import QRTagsLogo from "@/components/qrtags/QRTagsLogo";
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from '@/hooks/use-toast';
import { DEFAULT_CHECKLIST_CATEGORIES } from '@/lib/checklist-catalog';
import {
  Lock,
  Loader2,
  Download,
  ArrowLeft,
  Calendar,
  Globe,
  User,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

interface ChecklistView {
  status: 'locked' | 'unlocked' | 'not_found' | 'loading' | 'error';
  code?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  departureDate?: string;
  departureCity?: string | null;
  destinationCountry?: string;
  airline?: string | null;
  flightNumber?: string | null;
  items?: Array<{ category: string; name: string; qty: number; checked: boolean }>;
  itemsCount?: number;
  createdAt?: string;
  viewCount?: number;
  hasPhoto?: boolean;
  error?: string;
}

export default function ChecklistViewPage() {
  const { t, lang, setLang, dir } = useTranslation();
  const params = useParams();
  const code = (params?.code as string || '').toUpperCase();

  const [view, setView] = useState<ChecklistView>({ status: 'loading' });
  const [keyInput, setKeyInput] = useState('');
  const [verifying, setVerifying] = useState(false);

  // ─── Fetch checklist (locked view) on mount ───
  const fetchChecklist = useCallback(async (key?: string) => {
    setView({ status: 'loading' });
    try {
      const url = key ? `/api/checklist/${code}?key=${encodeURIComponent(key)}` : `/api/checklist/${code}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.status === 404) {
        setView({ status: 'not_found' });
        return;
      }
      setView(data);
    } catch {
      setView({ status: 'error', error: t('checklist.error') });
    }
  }, [code, t]);

  useEffect(() => {
    if (code) fetchChecklist();
  }, [code, fetchChecklist]);

  // ─── Verify key ───
  const handleVerify = useCallback(async () => {
    if (!keyInput.trim()) return;
    setVerifying(true);
    try {
      const res = await fetch(`/api/checklist/${code}?key=${encodeURIComponent(keyInput.trim())}`);
      const data = await res.json();
      if (res.status === 403) {
        toast({ title: t('checklist.view_wrong_key'), variant: 'destructive' });
        setVerifying(false);
        return;
      }
      if (res.status === 404) {
        setView({ status: 'not_found' });
        return;
      }
      setView(data);
      if (data.status === 'unlocked') {
        toast({ title: t('checklist.success_title') });
      }
    } catch {
      toast({ title: t('checklist.error'), variant: 'destructive' });
    } finally {
      setVerifying(false);
    }
  }, [code, keyInput, t]);

  // ─── Download PDF ───
  const handleDownloadPdf = useCallback(() => {
    if (!keyInput.trim()) return;
    const url = `/api/checklist/${code}/pdf?key=${encodeURIComponent(keyInput.trim())}`;
    window.open(url, '_blank');
  }, [code, keyInput]);

  // Format date
  const formatDate = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const locale = lang === 'ar' ? 'ar-SA' : lang === 'en' ? 'en-US' : 'fr-FR';
      return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };
  const formatDateOnly = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const locale = lang === 'ar' ? 'ar-SA' : lang === 'en' ? 'en-US' : 'fr-FR';
      return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  // Group items by category
  const groupedItems = (() => {
    if (!view.items) return [];
    const map: Record<string, typeof view.items> = {};
    for (const it of view.items) {
      if (!map[it.category]) map[it.category] = [];
      map[it.category].push(it);
    }
    return DEFAULT_CHECKLIST_CATEGORIES
      .map((cat) => ({ cat, items: map[cat.id] || [] }))
      .filter((g) => g.items.length > 0);
  })();

  // ═══ RENDER ═══
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col" dir={dir}>
      {/* ─── Simple header ─── */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <QRTagsLogo size="sm" variant="light" />
          </Link>
          <LanguageSelector lang={lang} setLang={setLang} variant="blue" />
        </div>
      </header>

      <section className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        {/* Back link */}
        <Link href="/checklist" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4 font-medium">
          <ArrowLeft className="w-4 h-4" />
          {t('checklist.view_back')}
        </Link>

        {/* ─── Loading ─── */}
        {view.status === 'loading' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
            <p className="text-slate-500 text-sm">Chargement...</p>
          </div>
        )}

        {/* ─── Not found ─── */}
        {view.status === 'not_found' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">{t('checklist.view_not_found')}</h1>
            <p className="text-slate-500 text-sm">{t('checklist.view_not_found_desc')}</p>
            <Link
              href="/checklist"
              className="inline-flex items-center gap-2 mt-5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              Créer une checklist
            </Link>
          </div>
        )}

        {/* ─── Locked — simple key input ─── */}
        {view.status === 'locked' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center">
                <Lock className="w-7 h-7 text-white" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-slate-900 text-center mb-2">
              {t('checklist.view_locked')}
            </h1>
            <p className="text-center text-slate-500 text-sm mb-6">
              {t('checklist.view_locked_desc')}
            </p>

            {/* Identity hint */}
            {view.firstName && view.createdAt && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-5 text-center">
                <p className="text-xs text-slate-600">
                  Attestation de <strong className="text-slate-900">{view.firstName}</strong> · Code <strong className="font-mono text-slate-900">{view.code}</strong>
                </p>
                <p className="text-xs text-slate-500 mt-1">Créée le {formatDate(view.createdAt)}</p>
              </div>
            )}

            <label className="text-xs font-bold text-slate-700 mb-2 block">{t('checklist.view_key_input')}</label>
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-base font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[48px] uppercase"
              placeholder={t('checklist.view_key_placeholder')}
              maxLength={8}
              autoFocus
            />

            <button
              onClick={handleVerify}
              disabled={verifying || !keyInput.trim()}
              className="w-full mt-3 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] transition-colors"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> ...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  {t('checklist.view_unlock')}
                </>
              )}
            </button>

            {view.error && (
              <p className="text-xs text-red-600 text-center mt-3 bg-red-50 border border-red-200 rounded p-2">
                {view.error}
              </p>
            )}
          </div>
        )}

        {/* ─── Unlocked — clean attestation ─── */}
        {view.status === 'unlocked' && (
          <div className="space-y-4">
            {/* Header card */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-blue-600 px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-lg">QRTags</div>
                  <div className="text-xs text-blue-100">Checklist de voyage</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest text-blue-200">Code</div>
                  <div className="font-mono font-bold text-white text-sm">{view.code}</div>
                </div>
              </div>

              <div className="p-5">
                {/* Dynamic title: Vol [Compagnie] — [Départ] → [Arrivée] */}
                <div className="flex items-start justify-between mb-4 gap-3">
                  <div className="min-w-0 flex-1">
                    <h1 className="text-base font-bold text-slate-900 mb-1 leading-tight">
                      {view.airline ? `Vol ${view.airline}` : 'Checklist de voyage'}
                      {view.departureCity && view.destinationCountry && (
                        <span className="text-blue-600"> — {view.departureCity} → {view.destinationCountry}</span>
                      )}
                    </h1>
                    <p className="text-xs text-slate-500">
                      {t('checklist.view_created_at')} {formatDate(view.createdAt)}
                    </p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1.5 text-center flex-shrink-0">
                    <div className="text-[9px] uppercase tracking-widest text-slate-700 font-bold">Certifié</div>
                    <div className="text-[9px] text-slate-600">QRTags</div>
                  </div>
                </div>

                {/* Passenger info — simple grid */}
                <div className="grid grid-cols-2 gap-3 text-sm mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-500">Voyageur</div>
                      <div className="font-semibold text-slate-900 truncate">{view.firstName} {view.lastName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-500">Départ</div>
                      <div className="font-semibold text-slate-900 truncate">{formatDateOnly(view.departureDate)}</div>
                    </div>
                  </div>
                  {view.departureCity && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] text-slate-500">Ville de départ</div>
                        <div className="font-semibold text-slate-900 truncate">{view.departureCity}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-500">Ville d'arrivée</div>
                      <div className="font-semibold text-slate-900 truncate">{view.destinationCountry}</div>
                    </div>
                  </div>
                  {view.airline && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] text-slate-500">Compagnie</div>
                        <div className="font-semibold text-slate-900 truncate">{view.airline}</div>
                      </div>
                    </div>
                  )}
                  {view.flightNumber && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] text-slate-500">N° de vol</div>
                        <div className="font-mono font-semibold text-slate-900 truncate">{view.flightNumber}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Items list */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                🧳 {t('checklist.view_items_list')} ({view.itemsCount})
              </h2>
              <div className="space-y-4">
                {groupedItems.map(({ cat, items }) => (
                  <div key={cat.id}>
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      <span>{cat.emoji} {cat.label[lang as keyof typeof cat.label] || cat.label.fr}</span>
                      <span className="text-slate-400 font-normal">· {items.length}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pl-4">
                      {items.map((it) => (
                        <div key={`${it.category}__${it.name}`} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                          <span className="text-slate-900">{it.name}</span>
                          {it.qty > 1 && (
                            <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">×{it.qty}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Single download button */}
            <button
              onClick={handleDownloadPdf}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm min-h-[48px]"
            >
              <Download className="w-4 h-4" />
              {t('checklist.view_download_pdf')}
            </button>

            {/* Footer info */}
            <div className="text-center text-xs text-slate-500 pt-2">
              <p>🔒 Attestation sécurisée QRTags · {view.itemsCount} article{view.itemsCount && view.itemsCount > 1 ? 's' : ''}</p>
            </div>
          </div>
        )}

        {/* ─── Error ─── */}
        {view.status === 'error' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-3" />
            <p className="text-slate-900 mb-4">{view.error || t('checklist.error')}</p>
            <button
              onClick={() => fetchChecklist()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}
      </section>

      <footer className="bg-slate-900 text-slate-400 text-center py-3 mt-auto">
        <p className="text-xs">QRTags — Protection intelligente des bagages • qrtags.com</p>
      </footer>
    </main>
  );
}
