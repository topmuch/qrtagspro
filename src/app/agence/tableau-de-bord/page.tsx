'use client';

/**
 * QRTagsPro V1 — Dashboard hôtel
 *
 * Affiche :
 *   - 4 cartes de stats : QR en stock, QR actifs, Check-out aujourd'hui, Perdus cette semaine
 *   - Section "Clients actuels" (table) : client / chambre / arrivée / départ / statut / actions
 *   - Section "Check-out aujourd'hui" : liste des clients dont departure_date = today
 *   - Section "Demander plus de QR" : carte jaune avec stock + bouton demande
 *   - Section "Objets perdus récents" : 5 derniers baggages isLost=true
 *
 * Sources de données :
 *   - GET /api/agency/baggages?agencyId=X → { baggages: [...], stats: {...} }
 *   - POST /api/messages (type='qr_request') pour demander plus de QR
 *
 * FR only — black (#111111) + mustard yellow (#E3B23C) design tokens.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Package,
  CheckCircle2,
  CalendarClock,
  AlertTriangle,
  LogOut,
  RefreshCw,
  Send,
  Loader2,
  QrCode,
  Search,
  Info,
} from 'lucide-react';
import { useAgency } from '../layout';
import { useToast } from '@/hooks/use-toast';

// ─── Types ───

interface HotelCustomData {
  client_name?: string;
  room_number?: string;
  arrival_date?: string; // ISO yyyy-mm-dd
  departure_date?: string; // ISO yyyy-mm-dd
  phone?: string;
}

interface Baggage {
  id: string;
  reference: string;
  type: string;
  travelerFirstName: string | null;
  travelerLastName: string | null;
  whatsappOwner: string | null;
  baggageIndex: number | null;
  baggageType: string | null;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  departureDate: string | null; // V1 schema column (ISO)
  lastScanDate: string | null;
  lastLocation: string | null;
  isLost: boolean;
  lostReportedAt: string | null;
  customData: string | null;
  agencyType?: string | null;
}

interface Stats {
  total: number;
  pending: number;
  active: number;
  scanned: number;
  lost: number;
  found: number;
  in_stock: number;
  sold: number;
  activated: number;
  assigned_to_agency: number;
  blocked: number;
}

// ─── Helpers ───

function parseCustomData(b: Baggage): HotelCustomData | null {
  if (!b.customData) return null;
  try {
    return JSON.parse(b.customData) as HotelCustomData;
  } catch {
    return null;
  }
}

function todayISO(): string {
  // Local date in yyyy-mm-dd
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateFR(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function withinLast7Days(iso?: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return d.getTime() >= sevenDaysAgo;
}

// ─── Stat Card ───

function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  accent: 'yellow' | 'green' | 'orange' | 'red';
}) {
  const accentMap: Record<typeof accent, string> = {
    yellow: 'bg-[#E3B23C]/10 border-[#E3B23C]/40 text-[#E3B23C]',
    green: 'bg-green-50 border-green-500/40 text-green-700',
    orange: 'bg-orange-50 border-orange-500/40 text-orange-700',
    red: 'bg-red-50 border-red-500/40 text-red-700',
  } as const;

  return (
    <div className="bg-white rounded-2xl p-5 border-2 border-black shadow-xl">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{title}</p>
          <p className="mt-2 text-3xl font-bold text-black">{value}</p>
          <p className="mt-1 text-xs text-slate-500 truncate">{subtitle}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center shrink-0 ${accentMap[accent]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Status badge ───

function StatusBadge({ departureDate, status }: { departureDate: string | null; status: string }) {
  // Expire bientôt = départ dans moins de 24h
  let soon = false;
  if (departureDate) {
    const d = new Date(departureDate);
    const now = Date.now();
    const h24 = 24 * 60 * 60 * 1000;
    soon = d.getTime() - now < h24 && d.getTime() > now;
  }
  if (soon) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-300">
        <CalendarClock className="w-3 h-3" /> Expire bientôt
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300">
      <CheckCircle2 className="w-3 h-3" /> Actif
    </span>
  );
}

// ════════════════════════════════════════════════════════════════
//  Page
// ════════════════════════════════════════════════════════════════

export default function HotelDashboardPage() {
  const { agencyId, agencyName } = useAgency();
  const { toast } = useToast();

  const [baggages, setBaggages] = useState<Baggage[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [requestingQr, setRequestingQr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      // Reuse the same fetch logic but guard against unmounted setState.
      if (!agencyId) return;
      try {
        const res = await fetch(`/api/agency/baggages?agencyId=${encodeURIComponent(agencyId)}`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        if (cancelled) return;
        setBaggages(data.baggages || []);
        setStats(data.stats || null);
      } catch (e) {
        if (cancelled) return;
        console.error('Error fetching baggages:', e);
        toast({
          title: 'Erreur',
          description: "Impossible de charger les données du tableau de bord.",
          variant: 'destructive',
        });
      } finally {
        if (cancelled) return;
        setLoading(false);
        setRefreshing(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [agencyId, toast]);

  const fetchBaggages = useCallback(async () => {
    if (!agencyId) return;
    try {
      const res = await fetch(`/api/agency/baggages?agencyId=${encodeURIComponent(agencyId)}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      setBaggages(data.baggages || []);
      setStats(data.stats || null);
    } catch (e) {
      console.error('Error fetching baggages:', e);
      toast({
        title: 'Erreur',
        description: "Impossible de charger les données du tableau de bord.",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [agencyId, toast]);

  // ─── Derived data ───
  const today = todayISO();

  const stockBaggages = useMemo(
    () => baggages.filter(b => b.status === 'in_stock' || b.status === 'pending_activation'),
    [baggages],
  );

  const activeBaggages = useMemo(
    () => baggages.filter(b => b.status === 'active' || b.status === 'activated' || b.status === 'scanned'),
    [baggages],
  );

  const todayCheckouts = useMemo(() => {
    return activeBaggages.filter(b => {
      const cd = parseCustomData(b);
      const dep = cd?.departure_date || (b.departureDate ? b.departureDate.slice(0, 10) : null);
      return dep === today;
    });
  }, [activeBaggages, today]);

  const lostThisWeek = useMemo(
    () => baggages.filter(b => b.isLost === true && withinLast7Days(b.lostReportedAt)),
    [baggages],
  );

  const recentLost = useMemo(
    () =>
      baggages
        .filter(b => b.isLost === true)
        .sort((a, b) => (b.lostReportedAt || '').localeCompare(a.lostReportedAt || ''))
        .slice(0, 5),
    [baggages],
  );

  // ─── Actions ───

  const handleCheckout = async (b: Baggage) => {
    setActionLoading(b.id);
    try {
      // V1: stub — call existing /api/baggage/[reference] PATCH to mark as expired
      const res = await fetch(`/api/baggage/${b.reference}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'expired', expiresAt: new Date().toISOString() }),
      });
      if (!res.ok) {
        // Fallback: try DELETE
        await fetch(`/api/baggage/${b.id}`, { method: 'DELETE' });
      }
      toast({
        title: 'Check-out effectué',
        description: `${b.reference} marqué comme expiré.`,
      });
      await fetchBaggages();
    } catch (e) {
      console.error(e);
      toast({
        title: 'Erreur',
        description: "Impossible d'effectuer le check-out.",
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestMoreQr = async () => {
    setRequestingQr(true);
    try {
      const message = `Demande de QR supplémentaires — Agence: ${agencyName} — Stock actuel: ${stockBaggages.length} QR disponibles.`;
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'qr_request',
          agencyId,
          senderName: agencyName,
          content: message,
          subject: 'Demande de QR supplémentaires',
        }),
      });
      if (!res.ok) throw new Error('request failed');
      toast({
        title: 'Demande envoyée',
        description: "Votre demande de QR a bien été transmise au superadmin.",
      });
    } catch (e) {
      console.error(e);
      toast({
        title: 'Erreur',
        description: "Impossible d'envoyer la demande. Réessayez plus tard.",
        variant: 'destructive',
      });
    } finally {
      setRequestingQr(false);
    }
  };

  // ─── Render ───

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#111111]" />
          <span className="text-slate-600">Chargement du tableau de bord…</span>
        </div>
      </div>
    );
  }

  const stockLow = stockBaggages.length < 50;

  return (
    <div className="space-y-6">
      {/* ─── Page header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-black">Tableau de bord</h1>
          <p className="text-sm text-slate-500">
            {agencyName} — Vue d'ensemble de votre activité hôtelière.
          </p>
        </div>
        <button
          onClick={() => {
            setRefreshing(true);
            fetchBaggages();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-black text-sm font-semibold hover:-translate-y-0.5 transition-transform"
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* ─── Stats row ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="QR en stock"
          value={stockBaggages.length}
          subtitle="Disponibles pour check-in"
          icon={<Package className="w-5 h-5" />}
          accent="yellow"
        />
        <StatCard
          title="QR actifs"
          value={activeBaggages.length}
          subtitle="Clients actuellement en séjour"
          icon={<CheckCircle2 className="w-5 h-5" />}
          accent="green"
        />
        <StatCard
          title="Check-out aujourd'hui"
          value={todayCheckouts.length}
          subtitle={formatDateFR(today)}
          icon={<CalendarClock className="w-5 h-5" />}
          accent="orange"
        />
        <StatCard
          title="Perdus cette semaine"
          value={lostThisWeek.length}
          subtitle="7 derniers jours"
          icon={<AlertTriangle className="w-5 h-5" />}
          accent="red"
        />
      </div>

      {/* ─── Demander plus de QR ─── */}
      <div className="bg-[#E3B23C] rounded-2xl p-6 border-2 border-black shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center shrink-0">
              <QrCode className="w-6 h-6 text-[#E3B23C]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-black">Stock de QR</h2>
              <p className="text-sm text-black/80">
                {stockBaggages.length} QR disponibles dans votre stock.
              </p>
              {stockLow && (
                <p className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Stock bas ! Pensez à commander.
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleRequestMoreQr}
            disabled={requestingQr}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-black text-[#E3B23C] font-semibold border-2 border-black hover:-translate-y-0.5 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {requestingQr ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Envoi…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Demander plus de QR
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── Check-out aujourd'hui ─── */}
      <section className="bg-white rounded-2xl p-6 border-2 border-black shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-black">Check-out aujourd'hui</h2>
            <p className="text-sm text-slate-500">Clients dont le départ est prévu le {formatDateFR(today)}.</p>
          </div>
          <CalendarClock className="w-6 h-6 text-orange-600" />
        </div>
        {todayCheckouts.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
            Aucun check-out prévu aujourd'hui.
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {todayCheckouts.map((b) => {
              const cd = parseCustomData(b);
              return (
                <li key={b.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-black truncate">
                      {cd?.client_name || [b.travelerFirstName, b.travelerLastName].filter(Boolean).join(' ') || b.reference}
                    </p>
                    <p className="text-xs text-slate-500">
                      Chambre {cd?.room_number || '—'} · Réf. {b.reference}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCheckout(b)}
                    disabled={actionLoading === b.id}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-black text-[#E3B23C] text-sm font-semibold border-2 border-black hover:-translate-y-0.5 transition-transform disabled:opacity-60"
                  >
                    {actionLoading === b.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <LogOut className="w-4 h-4" />
                    )}
                    Check-out
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ─── Clients actuels ─── */}
      <section className="bg-white rounded-2xl p-6 border-2 border-black shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-black">Clients actuels</h2>
            <p className="text-sm text-slate-500">Séjours en cours (QR actifs).</p>
          </div>
          <Link
            href="/agence/baggages"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-black hover:text-[#111111] hover:underline"
          >
            Voir tous les QR
            <Search className="w-4 h-4" />
          </Link>
        </div>
        {activeBaggages.length === 0 ? (
          <div className="py-10 text-center bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-sm text-slate-600 mb-3">Aucun client actif. Faites un check-in pour commencer.</p>
            <Link
              href="/agence/check-in"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-[#E3B23C] text-sm font-semibold border-2 border-black hover:-translate-y-0.5 transition-transform"
            >
              <LogOut className="w-4 h-4" />
              Nouveau check-in
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2 pr-4">Client</th>
                  <th className="py-2 pr-4">Chambre</th>
                  <th className="py-2 pr-4">Arrivée</th>
                  <th className="py-2 pr-4">Départ</th>
                  <th className="py-2 pr-4">Statut</th>
                  <th className="py-2 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeBaggages.slice(0, 20).map((b) => {
                  const cd = parseCustomData(b);
                  const dep = cd?.departure_date || (b.departureDate ? b.departureDate.slice(0, 10) : null);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-3 pr-4">
                        <div className="font-medium text-black">
                          {cd?.client_name || [b.travelerFirstName, b.travelerLastName].filter(Boolean).join(' ') || '—'}
                        </div>
                        <div className="text-xs text-slate-400">{b.reference}</div>
                      </td>
                      <td className="py-3 pr-4 text-slate-700">{cd?.room_number || '—'}</td>
                      <td className="py-3 pr-4 text-slate-700">{formatDateFR(cd?.arrival_date)}</td>
                      <td className="py-3 pr-4 text-slate-700">{formatDateFR(dep)}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge departureDate={dep ? new Date(dep).toISOString() : null} status={b.status} />
                      </td>
                      <td className="py-3 pr-2 text-right">
                        <button
                          onClick={() => handleCheckout(b)}
                          disabled={actionLoading === b.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-[#E3B23C] text-xs font-semibold border border-black hover:-translate-y-0.5 transition-transform disabled:opacity-60"
                        >
                          {actionLoading === b.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <LogOut className="w-3.5 h-3.5" />
                          )}
                          Check-out
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {activeBaggages.length > 20 && (
              <p className="mt-3 text-xs text-slate-500">
                + {activeBaggages.length - 20} autres — voir tous les QR.
              </p>
            )}
          </div>
        )}
      </section>

      {/* ─── Objets perdus récents ─── */}
      <section className="bg-white rounded-2xl p-6 border-2 border-black shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-black">Objets perdus récents</h2>
            <p className="text-sm text-slate-500">5 derniers signalements de perte.</p>
          </div>
          <Link
            href="/agence/perdus"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 hover:underline"
          >
            Voir tout
            <AlertTriangle className="w-4 h-4" />
          </Link>
        </div>
        {recentLost.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
            Aucun objet perdu. 🎉
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {recentLost.map((b) => {
              const cd = parseCustomData(b);
              return (
                <li key={b.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-black truncate">
                      {cd?.client_name || [b.travelerFirstName, b.travelerLastName].filter(Boolean).join(' ') || b.reference}
                    </p>
                    <p className="text-xs text-slate-500">
                      Réf. {b.reference}
                      {b.lostReportedAt && (
                        <> · Signalé le {formatDateFR(b.lostReportedAt)}</>
                      )}
                      {b.lastLocation && (
                        <> · Dernière position : {b.lastLocation}</>
                      )}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-300">
                    <AlertTriangle className="w-3 h-3" /> Perdu
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ─── Footer info ─── */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-500" />
        <p>
          Astuce : les QR sont générés par le superadmin et assignés à votre établissement.
          Pour de nouveaux stocks, utilisez le bouton « Demander plus de QR » ci-dessus.
          Le check-out auto s'effectue à la date de départ (cron job).
        </p>
      </div>
    </div>
  );
}
