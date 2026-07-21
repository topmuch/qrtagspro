'use client';

/**
 * QRTagsPro V2 — Dashboard multi-métiers (école + hôtel)
 *
 * Le dashboard s'adapte selon `agencyType` (depuis useAgency()) :
 *   - 'hotel'  : 'QR actifs', 'Clients actuels', 'Check-out aujourd'hui',
 *                colonnes Client / Chambre / Arrivée / Départ
 *   - 'school' : 'Cartables actifs', 'Élèves enregistrés', 'Fin d'année scolaire proche',
 *                colonnes Élève / Classe / Enregistré le / Fin année
 *   - autres métiers (luggage_locker, car_rental, medical, generic) : fallback hôtel.
 *
 * Affiche :
 *   - 4 cartes de stats : QR en stock, [items actifs], [check-out aujourd'hui / fin année], Perdus cette semaine
 *   - Section "Demander plus de QR" : carte jaune avec stock + bouton demande
 *   - Section "[check-out aujourd'hui / fin d'année scolaire proche]" : liste contextuelle
 *   - Section "[clients actuels / élèves enregistrés]" (table) : nom / sub-info / arrivée / départ / statut / actions
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

interface CustomData {
  // Common
  agencyType?: string;
  notes?: string | null;
  checked_in_at?: string;
  // Hotel
  client_name?: string;
  client_first_name?: string;
  client_last_name?: string;
  room_number?: string;
  arrival_date?: string; // ISO yyyy-mm-dd
  departure_date?: string; // ISO yyyy-mm-dd
  phone?: string;
  email?: string;
  // School
  student_first_name?: string;
  student_last_name?: string;
  student_name?: string;
  class_name?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  school_year?: string;
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

function parseCustomData(b: Baggage): CustomData | null {
  if (!b.customData) return null;
  try {
    return JSON.parse(b.customData) as CustomData;
  } catch {
    return null;
  }
}

/**
 * Retourne le nom affichable selon le métier :
 *   - École : student_name (ou student_first/last_name combinés)
 *   - Hôtel : client_name
 *   - Fallback : travelerFirstName/travelerLastName, puis référence.
 */
function getDisplayName(b: Baggage, cd: CustomData | null): string {
  if (cd?.student_name) return cd.student_name;
  if (cd?.client_name) return cd.client_name;
  if (cd?.student_first_name || cd?.student_last_name) {
    return `${cd.student_first_name || ''} ${cd.student_last_name || ''}`.trim();
  }
  return [b.travelerFirstName, b.travelerLastName].filter(Boolean).join(' ') || b.reference;
}

/**
 * Retourne l'info secondaire selon le métier :
 *   - Hôtel : "Chambre X"
 *   - École : classe (ex. "6ème B")
 *   - Sinon : chaîne vide.
 */
function getSubInfo(cd: CustomData | null): string {
  if (cd?.room_number) return `Chambre ${cd.room_number}`;
  if (cd?.class_name) return cd.class_name;
  return '';
}

/** Récupère la date de départ (préfère customData.departure_date, sinon b.departureDate). */
function getDepartureISO(b: Baggage, cd: CustomData | null): string | null {
  if (cd?.departure_date) return cd.departure_date;
  if (b.departureDate) return b.departureDate.slice(0, 10);
  return null;
}

/** Récupère la date d'arrivée (hôtel) ou la date de check-in (école). */
function getArrivalISO(b: Baggage, cd: CustomData | null): string | null {
  if (cd?.arrival_date) return cd.arrival_date;
  if (cd?.checked_in_at) return cd.checked_in_at;
  return b.createdAt || null;
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

// ─── Labels object (multi-métier) ───

interface DashboardLabels {
  itemsActive: string;
  itemsActiveDesc: string;
  clientsTitle: string;
  clientsSubtitle: string;
  checkOutToday: string;
  checkOutTodaySubtitle: string;
  checkOutTodayEmpty: string;
  emptyClients: string;
  checkOutButton: string;
  colClient: string;
  colSub: string;
  colArrival: string;
  colDeparture: string;
  headerTag: string; // "Hôtel" ou "École"
}

function buildLabels(agencyType: string | null): DashboardLabels {
  if (agencyType === 'school') {
    return {
      itemsActive: 'Cartables actifs',
      itemsActiveDesc: 'Élèves enregistrés cette année',
      clientsTitle: 'Élèves enregistrés',
      clientsSubtitle: 'Élèves actifs (QR activés).',
      checkOutToday: 'Fin d\'année scolaire',
      checkOutTodaySubtitle: 'Élèves dont l\'année scolaire se termine dans les 30 prochains jours.',
      checkOutTodayEmpty: 'Aucune fin d\'année scolaire imminente.',
      emptyClients: 'Aucun élève enregistré. Faites un check-in pour commencer.',
      checkOutButton: 'Check-out',
      colClient: 'Élève',
      colSub: 'Classe',
      colArrival: 'Enregistré le',
      colDeparture: 'Fin année',
      headerTag: 'École',
    };
  }
  // Hôtel (par défaut — couvre aussi luggage_locker, car_rental, medical, generic)
  return {
    itemsActive: 'QR actifs',
    itemsActiveDesc: 'Clients actuellement à l\'hôtel',
    clientsTitle: 'Clients actuels',
    clientsSubtitle: 'Séjours en cours (QR actifs).',
    checkOutToday: 'Check-out aujourd\'hui',
    checkOutTodaySubtitle: 'Clients dont le départ est prévu le',
    checkOutTodayEmpty: 'Aucun check-out prévu aujourd\'hui.',
    emptyClients: 'Aucun client actif. Faites un check-in pour commencer.',
    checkOutButton: 'Check-out',
    colClient: 'Client',
    colSub: 'Chambre',
    colArrival: 'Arrivée',
    colDeparture: 'Départ',
    headerTag: 'Hôtel',
  };
}

// ════════════════════════════════════════════════════════════════
//  Page
// ════════════════════════════════════════════════════════════════

export default function AgencyDashboardPage() {
  const { agencyId, agencyName, agencyType } = useAgency();
  const { toast } = useToast();
  const LABELS = useMemo(() => buildLabels(agencyType), [agencyType]);
  const isSchool = agencyType === 'school';

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

  // Section "Check-out aujourd'hui" (hôtel) ou "Fin d'année scolaire proche" (école)
  const todayCheckouts = useMemo(() => {
    if (isSchool) {
      // École : departureDate dans les 30 prochains jours (à partir de maintenant)
      const now = Date.now();
      const d30 = 30 * 24 * 60 * 60 * 1000;
      return activeBaggages.filter(b => {
        const cd = parseCustomData(b);
        const dep = getDepartureISO(b, cd);
        if (!dep) return false;
        const t = new Date(dep).getTime();
        if (isNaN(t)) return false;
        return t >= now && (t - now) <= d30;
      });
    }
    // Hôtel : departure_date === today
    return activeBaggages.filter(b => {
      const cd = parseCustomData(b);
      const dep = getDepartureISO(b, cd);
      return dep === today;
    });
  }, [activeBaggages, today, isSchool]);

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
      const res = await fetch('/api/agency/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: b.reference, agencyId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Échec du check-out');
      }
      toast({
        title: 'Check-out effectué',
        description: data.message || `${b.reference} — check-out effectué.`,
      });
      await fetchBaggages();
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : 'Erreur inconnue';
      toast({
        title: 'Erreur de check-out',
        description: message,
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
            {agencyName} — {LABELS.headerTag}
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
          title={LABELS.itemsActive}
          value={activeBaggages.length}
          subtitle={LABELS.itemsActiveDesc}
          icon={<CheckCircle2 className="w-5 h-5" />}
          accent="green"
        />
        <StatCard
          title={LABELS.checkOutToday}
          value={todayCheckouts.length}
          subtitle={isSchool ? '30 prochains jours' : formatDateFR(today)}
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

      {/* ─── Check-out aujourd'hui / Fin d'année scolaire proche ─── */}
      <section className="bg-white rounded-2xl p-6 border-2 border-black shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-black">{LABELS.checkOutToday}</h2>
            <p className="text-sm text-slate-500">
              {isSchool
                ? LABELS.checkOutTodaySubtitle
                : `${LABELS.checkOutTodaySubtitle} ${formatDateFR(today)}.`}
            </p>
          </div>
          <CalendarClock className="w-6 h-6 text-orange-600" />
        </div>
        {todayCheckouts.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
            {LABELS.checkOutTodayEmpty}
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {todayCheckouts.map((b) => {
              const cd = parseCustomData(b);
              const sub = getSubInfo(cd);
              return (
                <li key={b.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-black truncate">
                      {getDisplayName(b, cd)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {sub ? `${sub} · ` : ''}Réf. {b.reference}
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
                    {LABELS.checkOutButton}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ─── Clients actuels / Élèves enregistrés ─── */}
      <section className="bg-white rounded-2xl p-6 border-2 border-black shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-black">{LABELS.clientsTitle}</h2>
            <p className="text-sm text-slate-500">{LABELS.clientsSubtitle}</p>
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
            <p className="text-sm text-slate-600 mb-3">{LABELS.emptyClients}</p>
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
                  <th className="py-2 pr-4">{LABELS.colClient}</th>
                  <th className="py-2 pr-4">{LABELS.colSub}</th>
                  <th className="py-2 pr-4">{LABELS.colArrival}</th>
                  <th className="py-2 pr-4">{LABELS.colDeparture}</th>
                  <th className="py-2 pr-4">Statut</th>
                  <th className="py-2 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeBaggages.slice(0, 20).map((b) => {
                  const cd = parseCustomData(b);
                  const dep = getDepartureISO(b, cd);
                  const arrival = getArrivalISO(b, cd);
                  const sub = getSubInfo(cd);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-3 pr-4">
                        <div className="font-medium text-black">
                          {getDisplayName(b, cd)}
                        </div>
                        <div className="text-xs text-slate-400">{b.reference}</div>
                      </td>
                      <td className="py-3 pr-4 text-slate-700">{sub || '—'}</td>
                      <td className="py-3 pr-4 text-slate-700">{formatDateFR(arrival)}</td>
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
                          {LABELS.checkOutButton}
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
                      {getDisplayName(b, cd)}
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
          {isSchool
            ? " Le check-out auto s'effectue à la fin de l'année scolaire (30 juin — cron job)."
            : " Le check-out auto s'effectue à la date de départ (cron job)."}
        </p>
      </div>
    </div>
  );
}
