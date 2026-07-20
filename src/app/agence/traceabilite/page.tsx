'use client';

/**
 * QRTags — Dashboard Agence > Traçabilité des QR Codes
 *
 * Cette page affiche tous les tags QRTags assignés à l'agence connectée,
 * avec leur statut dans le workflow QRTags :
 *   - in_stock            → En stock (reçu du superadmin, pas encore vendu)
 *   - assigned_to_agency  → Assigné à l'agence (état transitoire)
 *   - sold                → Vendu au client final (pas encore activé)
 *   - activated           → Activé par le client (associé à un objet)
 *   - scanned             → Scanné par un trouveur
 *   - lost                → Déclaré perdu
 *   - found               → Retrouvé
 *   - blocked             → Bloqué
 *
 * L'agence peut depuis cette page :
 *   - Filtrer par statut / recherche par référence
 *   - Marquer un tag comme "vendu" ( bouton "Marquer vendu")
 *   - Voir le détail d'un tag (custom_data, propriétaire, historique scans)
 */

import { useState, useEffect, useMemo } from 'react';
import { useAgency } from '../layout';
import {
  QrCode,
  Search,
  Eye,
  X,
  Package,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  Loader2,
  Tag,
  User,
  Phone,
  Calendar,
  History,
} from 'lucide-react';
import { AGENCY_TYPES, getAgencyTypeDef } from '@/lib/agency-types';

// ─── Types ─────────────────────────────────────────────────────────
interface TagRow {
  id: string;
  reference: string;
  status: string;
  type: string;
  travelerFirstName: string | null;
  travelerLastName: string | null;
  whatsappOwner: string | null;
  lotId: string | null;
  createdAt: string;
  assignedToAgencyAt: string | null;
  soldAt: string | null;
  lastScanDate: string | null;
  lastLocation: string | null;
  agency?: { id: string; name: string; agencyType: string | null } | null;
  lot?: { id: string; lotNumber: string } | null;
}

// ─── Statuts QRTags pour le sélecteur de filtre ────────────────────
const STATUS_FILTERS: { value: string; label: string; color: string }[] = [
  { value: 'all',                  label: 'Tous',                 color: 'bg-slate-100 text-slate-700' },
  { value: 'in_stock',             label: 'En stock',             color: 'bg-slate-200 text-slate-700' },
  { value: 'assigned_to_agency',   label: 'Assigné à agence',     color: 'bg-blue-100 text-blue-700' },
  { value: 'sold',                 label: 'Vendu',                color: 'bg-amber-100 text-amber-700' },
  { value: 'activated',            label: 'Activé',               color: 'bg-emerald-100 text-emerald-700' },
  { value: 'scanned',              label: 'Scanné',               color: 'bg-purple-100 text-purple-700' },
  { value: 'lost',                 label: 'Perdu',                color: 'bg-red-100 text-red-700' },
  { value: 'found',                label: 'Retrouvé',             color: 'bg-green-100 text-green-700' },
  { value: 'blocked',              label: 'Bloqué',               color: 'bg-zinc-200 text-zinc-700' },
];

// ─── Page ──────────────────────────────────────────────────────────
export default function TraceabilitePage() {
  const { agencyId, agencyName } = useAgency();
  const [tags, setTags] = useState<TagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTag, setSelectedTag] = useState<TagRow | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchTags();
  }, [agencyId]);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ agencyId });
      // On réutilise l'API agency/baggages existante (qui renvoie tous les tags de l'agence)
      const res = await fetch(`/api/agency/baggages?${params}`);
      const data = await res.json();
      setTags(data.baggages || []);
    } catch (e) {
      console.error('Erreur fetch tags:', e);
    } finally {
      setLoading(false);
    }
  };

  // ─── Marquer un tag comme "vendu" (étape 2 du workflow) ───────
  const markAsSold = async (tag: TagRow) => {
    const buyerName = prompt(`Nom du client qui a acheté le tag ${tag.reference} ?`, '');
    if (!buyerName || !buyerName.trim()) return;
    const buyerPhone = prompt(`Téléphone du client (optionnel) ?`, '') || '';

    try {
      setActionLoading(tag.id);
      // On POST sur l'API tags/sell (à créer côté backend si nécessaire).
      // En attendant, on appelle directement update-status.
      const res = await fetch(`/api/baggage/${tag.reference}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'sold',
          buyerName: buyerName.trim(),
          buyerPhone: buyerPhone.trim(),
        }),
      });
      if (!res.ok) throw new Error('Erreur API');
      await fetchTags();
    } catch (e) {
      console.error(e);
      alert('Erreur lors du marquage "vendu"');
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Filtrage local ──────────────────────────────────────────
  const filteredTags = useMemo(() => {
    return tags
      .filter((t) => statusFilter === 'all' || t.status === statusFilter)
      .filter((t) => {
        if (!search.trim()) return true;
        const s = search.toLowerCase();
        return (
          t.reference.toLowerCase().includes(s) ||
          `${t.travelerFirstName || ''} ${t.travelerLastName || ''}`.toLowerCase().includes(s)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tags, search, statusFilter]);

  // ─── KPIs par statut ─────────────────────────────────────────
  const stats = useMemo(() => {
    const s: Record<string, number> = {
      in_stock: 0,
      assigned_to_agency: 0,
      sold: 0,
      activated: 0,
      scanned: 0,
      lost: 0,
      found: 0,
      blocked: 0,
      pending_activation: 0, // rétrocompat
      active: 0,             // rétrocompat
    };
    for (const t of tags) {
      // Mapping rétrocompat
      const st = t.status === 'pending_activation' ? 'in_stock'
              : t.status === 'active' ? 'activated'
              : t.status;
      s[st] = (s[st] || 0) + 1;
    }
    return s;
  }, [tags]);

  return (
    <div className="p-6 space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <QrCode className="w-6 h-6" style={{ color: 'var(--primary)' }} />
            Traçabilité des QR Codes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Suivez le statut de vos tags QRTags : en stock, vendus, activés, perdus, retrouvés.
          </p>
        </div>
      </div>

      {/* ─── KPIs ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <KpiCard label="En stock"     value={stats.in_stock}            icon={<Package className="w-4 h-4" />}      color="bg-slate-100 text-slate-700" />
        <KpiCard label="Vendus"       value={stats.sold}                icon={<ShoppingCart className="w-4 h-4" />} color="bg-amber-100 text-amber-700" />
        <KpiCard label="Activés"      value={stats.activated}           icon={<CheckCircle2 className="w-4 h-4" />} color="bg-emerald-100 text-emerald-700" />
        <KpiCard label="Scannés"      value={stats.scanned}             icon={<Eye className="w-4 h-4" />}          color="bg-purple-100 text-purple-700" />
        <KpiCard label="Perdus"       value={stats.lost}                icon={<AlertTriangle className="w-4 h-4" />} color="bg-red-100 text-red-700" />
        <KpiCard label="Retrouvés"    value={stats.found}               icon={<CheckCircle2 className="w-4 h-4" />} color="bg-green-100 text-green-700" />
        <KpiCard label="Bloqués"      value={stats.blocked}             icon={<X className="w-4 h-4" />}           color="bg-zinc-200 text-zinc-700" />
        <KpiCard label="Total"        value={tags.length}               icon={<QrCode className="w-4 h-4" />}       color="bg-blue-100 text-blue-700" />
      </div>

      {/* ─── Filtres ─── */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par référence ou propriétaire..."
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-input bg-background text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-[#111111] text-[#E3B23C]'
                  : f.color + ' hover:opacity-80'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Tableau ─── */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 mx-auto animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Chargement des tags...</p>
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <QrCode className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun tag trouvé pour ce filtre.</p>
            <p className="text-xs mt-1">
              Les tags assignés à votre agence par le Superadmin apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Référence</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Propriétaire</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Lot</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Reçu le</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vendu le</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Activé le</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTags.map((tag) => (
                  <tr key={tag.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono font-semibold">
                      {tag.reference}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={tag.status} />
                    </td>
                    <td className="px-4 py-3">
                      {tag.travelerFirstName || tag.travelerLastName ? (
                        <span>
                          {tag.travelerFirstName} {tag.travelerLastName}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {tag.lot?.lotNumber || '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(tag.assignedToAgencyAt || tag.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(tag.soldAt)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Bouton "Marquer vendu" si statut in_stock ou assigned_to_agency */}
                        {(tag.status === 'in_stock' ||
                          tag.status === 'assigned_to_agency' ||
                          tag.status === 'pending_activation') && (
                          <button
                            onClick={() => markAsSold(tag)}
                            disabled={actionLoading === tag.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#E3B23C] text-[#111111] text-xs font-semibold hover:bg-[#FFDB58] disabled:opacity-50 transition-colors"
                          >
                            {actionLoading === tag.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <ShoppingCart className="w-3 h-3" />
                            )}
                            Vendre
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedTag(tag);
                            setShowDetailModal(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-input text-xs hover:bg-muted transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          Détail
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Modal détail ─── */}
      {showDetailModal && selectedTag && (
        <DetailModal
          tag={selectedTag}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTag(null);
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SOUS-COMPOSANTS
// ═══════════════════════════════════════════════════════════════════

function KpiCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${color} text-xs font-medium mb-2`}>
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    in_stock:            { label: 'En stock',          className: 'bg-slate-200 text-slate-700' },
    assigned_to_agency:  { label: 'Assigné à agence',  className: 'bg-blue-100 text-blue-700' },
    sold:                { label: 'Vendu',             className: 'bg-amber-100 text-amber-700' },
    activated:           { label: 'Activé',            className: 'bg-emerald-100 text-emerald-700' },
    pending_activation:  { label: 'En attente',        className: 'bg-slate-200 text-slate-700' },
    active:              { label: 'Activé',            className: 'bg-emerald-100 text-emerald-700' },
    scanned:             { label: 'Scanné',            className: 'bg-purple-100 text-purple-700' },
    lost:                { label: 'Perdu',             className: 'bg-red-100 text-red-700' },
    found:               { label: 'Retrouvé',          className: 'bg-green-100 text-green-700' },
    blocked:             { label: 'Bloqué',            className: 'bg-zinc-200 text-zinc-700' },
  };
  const cfg = map[status] || { label: status, className: 'bg-slate-100 text-slate-700' };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function DetailModal({ tag, onClose }: { tag: TagRow; onClose: () => void }) {
  try {
  } catch { /* ignore */ }

  const agencyType = tag.agency?.agencyType || 'generic';
  const typeDef = getAgencyTypeDef(agencyType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-card rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-card">
          <div>
            <h2 className="text-xl font-bold font-mono">{tag.reference}</h2>
            <div className="mt-1">
              <StatusBadge status={tag.status} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Métadonnées du tag */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1">
              <Tag className="w-4 h-4" />
              Métadonnées
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Lot"           value={tag.lot?.lotNumber || '—'} />
              <Field label="Type métier"   value={typeDef?.label || agencyType} />
              <Field label="Reçu le"       value={formatDate(tag.assignedToAgencyAt)} />
              <Field label="Vendu le"      value={formatDate(tag.soldAt)} />
              <Field label="Dernier scan"  value={formatDate(tag.lastScanDate)} />
            </div>
          </section>

          {/* Propriétaire */}
          {(tag.travelerFirstName || tag.travelerLastName || tag.whatsappOwner) && (
            <section>
              <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1">
                <User className="w-4 h-4" />
                Propriétaire
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Nom"          value={`${tag.travelerFirstName || ''} ${tag.travelerLastName || ''}`.trim() || '—'} />
                <Field label="WhatsApp"     value={tag.whatsappOwner || '—'} />
              </div>
            </section>
          )}

          {/* Champs dynamiques (custom_data) */}
          {/* Champs dynamiques supprimés (customData non disponible) */}

          {/* Dernière position connue */}
          {tag.lastLocation && (
            <section>
              <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Dernière position connue
              </h3>
              <p className="text-sm bg-muted/50 rounded p-3">{tag.lastLocation}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-sm font-medium mt-0.5">{value}</div>
    </div>
  );
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}
