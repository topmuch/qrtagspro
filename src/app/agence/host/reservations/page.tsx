'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Loader2,
  AlertCircle,
  Plus,
  ArrowLeft,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Bell,
  MessageCircle,
  XCircle,
  Trash2,
  X,
  ExternalLink,
  Info,
  Users,
} from 'lucide-react';
import {
  getHostReservations,
  createReservation,
  cancelReservation,
  deleteReservation,
  getWhatsAppUrl,
  type HostReservationSummary,
} from './actions';

// ─── Composant principal ─────────────────────────────────────────────────────

export default function HostReservationsDashboardPage() {
  const [reservations, setReservations] = useState<HostReservationSummary[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    upcoming: number;
    completed: number;
    remindersSent: number;
    checkoutsSent: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ─── Chargement ───
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getHostReservations();
      if (!result.success) {
        setError(result.error || 'Erreur de chargement');
        return;
      }
      setReservations(result.reservations || []);
      setStats(result.stats || null);
    } catch (err) {
      console.error('[host-reservations] load error:', err);
      setError('Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Actions ───
  const handleWhatsApp = async (id: string, type: 'checkin' | 'checkout') => {
    setActionLoading(`${id}-${type}`);
    setActionError(null);
    try {
      const result = await getWhatsAppUrl(id, type);
      if (!result.success || !result.whatsappUrl) {
        setActionError(result.error || 'Impossible de générer le lien WhatsApp.');
        return;
      }
      window.open(result.whatsappUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('[host-reservations] whatsapp error:', err);
      setActionError('Erreur lors de la génération du lien.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Annuler cette réservation ? Le statut passera en CANCELLED.')) return;
    setActionLoading(`${id}-cancel`);
    setActionError(null);
    try {
      const result = await cancelReservation(id);
      if (!result.success) {
        setActionError(result.error || 'Erreur lors de l\'annulation.');
        return;
      }
      await loadData();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer définitivement cette réservation ? Cette action est irréversible.')) return;
    setActionLoading(`${id}-delete`);
    setActionError(null);
    try {
      const result = await deleteReservation(id);
      if (!result.success) {
        setActionError(result.error || 'Erreur lors de la suppression.');
        return;
      }
      await loadData();
    } finally {
      setActionLoading(null);
    }
  };

  // ─── États ───
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#134288] dark:text-[#32ba5d]" />
        <span className="ml-3 text-slate-600 dark:text-slate-300">
          Chargement des réservations…
        </span>
      </div>
    );
  }

  if (error) {
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link
            href="/agence/host"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-[#134288] dark:hover:text-[#32ba5d] mb-2 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Guide de la maison
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Calendar className="w-7 h-7 text-[#134288] dark:text-[#32ba5d]" />
            Réservations & WhatsApp
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Planifiez les séjours de vos voyageurs et envoyez les messages WhatsApp automatiquement.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#32ba5d] text-black font-bold rounded-xl hover:bg-[#2ba14f] transition text-sm shadow-lg shadow-[#32ba5d]/20"
        >
          <Plus className="w-4 h-4" />
          Nouvelle réservation
        </button>
      </div>

      {/* ─── Stats grid ─── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox
            icon={<Users className="w-4 h-4" />}
            label="Total"
            value={stats.total}
            color="text-slate-900 dark:text-white"
          />
          <StatBox
            icon={<CalendarClock className="w-4 h-4" />}
            label="À venir"
            value={stats.upcoming}
            color="text-[#134288] dark:text-[#32ba5d]"
          />
          <StatBox
            icon={<Bell className="w-4 h-4" />}
            label="Rappels envoyés"
            value={stats.remindersSent}
            color="text-amber-600 dark:text-amber-400"
          />
          <StatBox
            icon={<CheckCircle2 className="w-4 h-4" />}
            label="Terminés"
            value={stats.completed}
            color="text-green-600 dark:text-green-400"
          />
        </div>
      )}

      {/* ─── Banner cron automation ─── */}
      <div className="bg-[#134288]/5 dark:bg-[#32ba5d]/5 border border-[#134288]/15 dark:border-[#32ba5d]/20 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-[#134288] dark:text-[#32ba5d] shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <p className="font-bold text-slate-800 dark:text-white">
            🤖 Automation WhatsApp active
          </p>
          <p className="text-slate-600 dark:text-slate-400 mt-0.5">
            Un cron job envoie automatiquement le message <strong>J-1</strong> (veille du check-in)
            et le message de <strong>départ</strong> (jour du check-out). Vous pouvez aussi
            les envoyer manuellement via les boutons ci-dessous.
          </p>
        </div>
      </div>

      {/* ─── Action error ─── */}
      {actionError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400 flex-1">{actionError}</p>
          <button
            onClick={() => setActionError(null)}
            className="text-red-400 hover:text-red-600"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Liste des réservations ─── */}
      {reservations.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
            Aucune réservation
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
            Ajoutez vos voyageurs Airbnb pour leur envoyer automatiquement le guide
            de la maison la veille de leur arrivée.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#32ba5d] text-black font-bold rounded-xl hover:bg-[#2ba14f] transition text-sm"
          >
            <Plus className="w-4 h-4" />
            Créer ma première réservation
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => (
            <ReservationCard
              key={r.id}
              reservation={r}
              onWhatsApp={handleWhatsApp}
              onCancel={handleCancel}
              onDelete={handleDelete}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}

      {/* ─── Modal formulaire ─── */}
      {showForm && (
        <ReservationForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// ─── Sous-composant : StatBox ────────────────────────────────────────────────

function StatBox({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-slate-400 dark:text-slate-500">{icon}</span>
      </div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-0.5">
        {label}
      </p>
    </div>
  );
}

// ─── Sous-composant : ReservationCard ────────────────────────────────────────

function ReservationCard({
  reservation,
  onWhatsApp,
  onCancel,
  onDelete,
  actionLoading,
}: {
  reservation: HostReservationSummary;
  onWhatsApp: (id: string, type: 'checkin' | 'checkout') => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  actionLoading: string | null;
}) {
  const isCancelled = reservation.status === 'CANCELLED';
  const isCompleted = reservation.status === 'COMPLETED';

  const checkIn = new Date(reservation.checkInDate);
  const checkOut = new Date(reservation.checkOutDate);
  const dateOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };

  return (
    <div
      className={`bg-white dark:bg-slate-900 border rounded-xl p-4 transition ${
        isCancelled
          ? 'border-slate-200 dark:border-slate-800 opacity-60'
          : isCompleted
          ? 'border-green-200 dark:border-green-800/40'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        {/* ─── Infos voyageur ─── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900 dark:text-white">
              {reservation.guestName}
            </h3>
            <StatusBadge status={reservation.status} />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
            {reservation.guestPhone}
          </p>

          <div className="flex items-center gap-3 mt-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#134288] dark:text-[#32ba5d]" />
              {checkIn.toLocaleDateString('fr-FR', dateOpts)}
            </span>
            <span className="text-slate-300 dark:text-slate-600">→</span>
            <span className="flex items-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5 text-[#134288] dark:text-[#32ba5d]" />
              {checkOut.toLocaleDateString('fr-FR', dateOpts)}
            </span>
          </div>

          {reservation.notes && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 italic bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
              &ldquo;{reservation.notes}&rdquo;
            </p>
          )}

          {/* ─── Badges messages ─── */}
          <div className="flex flex-wrap gap-2 mt-3">
            {reservation.reminderSentAt ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[11px] font-semibold rounded-full">
                <Bell className="w-3 h-3" />
                Rappel J-1 envoyé
              </span>
            ) : (
              !isCancelled && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-semibold rounded-full">
                  Rappel J-1 en attente
                </span>
              )
            )}
            {reservation.checkoutSentAt && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[11px] font-semibold rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                Msg départ envoyé
              </span>
            )}
          </div>
        </div>

        {/* ─── Actions ─── */}
        {!isCancelled && (
          <div className="flex flex-wrap gap-2 md:flex-col md:w-44">
            <button
              onClick={() => onWhatsApp(reservation.id, 'checkin')}
              disabled={actionLoading === `${reservation.id}-checkin`}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#134288] hover:bg-[#0f3670] text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
              title="Message J-1 (rappel check-in)"
            >
              {actionLoading === `${reservation.id}-checkin` ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <MessageCircle className="w-3.5 h-3.5" />
              )}
              Msg J-1
            </button>
            <button
              onClick={() => onWhatsApp(reservation.id, 'checkout')}
              disabled={actionLoading === `${reservation.id}-checkout`}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#32ba5d] hover:bg-[#2ba14f] text-black text-xs font-bold rounded-lg transition disabled:opacity-50"
              title="Message de départ (merci + avis)"
            >
              {actionLoading === `${reservation.id}-checkout` ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ExternalLink className="w-3.5 h-3.5" />
              )}
              Msg départ
            </button>
            {!isCompleted && (
              <button
                onClick={() => onCancel(reservation.id)}
                disabled={actionLoading === `${reservation.id}-cancel`}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-lg transition border border-amber-200 dark:border-amber-800 disabled:opacity-50"
              >
                {actionLoading === `${reservation.id}-cancel` ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                Annuler
              </button>
            )}
            <button
              onClick={() => onDelete(reservation.id)}
              disabled={actionLoading === `${reservation.id}-delete`}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-bold rounded-lg transition border border-red-200 dark:border-red-800 disabled:opacity-50"
            >
              {actionLoading === `${reservation.id}-delete` ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Supprimer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    ACTIVE: {
      label: 'Active',
      cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    },
    COMPLETED: {
      label: 'Terminée',
      cls: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    },
    CANCELLED: {
      label: 'Annulée',
      cls: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    },
  };
  const s = map[status] || { label: status, cls: 'bg-slate-100 dark:bg-slate-800 text-slate-500' };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

// ─── Sous-composant : ReservationForm (modal) ────────────────────────────────

function ReservationForm({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    guestName: '',
    guestPhone: '',
    checkInDate: '',
    checkOutDate: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await createReservation({
      guestName: form.guestName,
      guestPhone: form.guestPhone,
      checkInDate: form.checkInDate,
      checkOutDate: form.checkOutDate,
      notes: form.notes || undefined,
    });

    setSubmitting(false);

    if (result.success) {
      onSaved();
    } else {
      setError(result.error || 'Une erreur est survenue.');
    }
  };

  const inputCls =
    'w-full px-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:border-[#134288] dark:focus:border-[#32ba5d] outline-none transition text-sm';

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md my-8 shadow-2xl">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            ✨ Nouvelle réservation
          </h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition disabled:opacity-50"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom du voyageur */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Nom du voyageur <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.guestName}
              onChange={(e) => update('guestName', e.target.value)}
              required
              placeholder="Ex: Marie Dupont"
              className={inputCls}
            />
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Téléphone WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={form.guestPhone}
              onChange={(e) => update('guestPhone', e.target.value)}
              required
              placeholder="Ex: +221 77 555 12 34"
              className={`${inputCls} font-mono`}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Format international avec indicatif pays.
            </p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Arrivée <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.checkInDate}
                onChange={(e) => update('checkInDate', e.target.value)}
                required
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Départ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.checkOutDate}
                onChange={(e) => update('checkOutDate', e.target.value)}
                required
                min={form.checkInDate || undefined}
                className={inputCls}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Notes (optionnel)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={2}
              placeholder="Ex: 2 adultes, arrivée tardive, code boîte à clés 4592"
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg p-3 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-50 text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-[#32ba5d] text-black font-bold rounded-lg hover:bg-[#2ba14f] transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Création…
                </>
              ) : (
                'Créer la réservation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
