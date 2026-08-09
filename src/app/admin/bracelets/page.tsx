'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Package,
  ShoppingBag,
  Loader2,
  AlertCircle,
  Factory,
  Truck,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  getAllBraceletOrders,
  validateAndGenerateQr,
  markAsShipped,
  markAsDelivered,
  type AdminBraceletOrder,
} from './actions';

// ─── Types ──────────────────────────────────────────────────────────────────

interface AdminStats {
  total: number;
  pending: number;
  producing: number;
  shipped: number;
  delivered: number;
  totalRevenue: number;
}

// ─── Statut config ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: {
    label: 'En attente',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    icon: <Clock className="w-3 h-3" />,
  },
  PRODUCING: {
    label: 'En production',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    icon: <Factory className="w-3 h-3" />,
  },
  SHIPPED: {
    label: 'Expédié',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    icon: <Truck className="w-3 h-3" />,
  },
  DELIVERED: {
    label: 'Livré',
    color: 'bg-green-100 text-green-700 border-green-300',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
};

// ─── Composant principal ────────────────────────────────────────────────────

export default function AdminBraceletsPage() {
  const [orders, setOrders] = useState<AdminBraceletOrder[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [shipModalOrder, setShipModalOrder] = useState<AdminBraceletOrder | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllBraceletOrders();
      if (!result.success) {
        setError(result.error || 'Erreur de chargement');
        return;
      }
      setOrders(result.orders || []);
      setStats(result.stats || null);
    } catch (err) {
      console.error('Erreur admin bracelets:', err);
      setError('Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAction = async (
    orderId: string,
    action: 'validate' | 'ship' | 'deliver',
    trackingNumber?: string
  ) => {
    setActionLoading(`${action}-${orderId}`);
    setActionError(null);
    try {
      let result: { success: boolean; error?: string };
      if (action === 'validate') {
        result = await validateAndGenerateQr(orderId);
      } else if (action === 'ship') {
        result = await markAsShipped(orderId, trackingNumber);
      } else {
        result = await markAsDelivered(orderId);
      }

      if (!result.success) {
        setActionError(result.error || 'Échec de l\'action.');
      } else {
        setShipModalOrder(null);
        loadData();
      }
    } catch {
      setActionError('Une erreur est survenue.');
    } finally {
      setActionLoading(null);
    }
  };

  // ─── États ───
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-3 text-slate-600">Chargement des commandes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Erreur</h2>
        <p className="text-slate-600 mb-6">{error}</p>
        <button
          onClick={loadData}
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestion des Bracelets</h1>
          <p className="text-slate-500 text-sm mt-1">
            Pilotez la production et l'expédition des commandes
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          title="Rafraîchir"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* ─── Stats ─── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatBox label="Total" value={stats.total} color="text-slate-900" />
          <StatBox label="En attente" value={stats.pending} color="text-yellow-600" />
          <StatBox label="Production" value={stats.producing} color="text-blue-600" />
          <StatBox label="Expédiés" value={stats.shipped} color="text-purple-600" />
          <StatBox
            label="Revenus (payés)"
            value={`${stats.totalRevenue.toLocaleString('fr-FR')} F`}
            color="text-green-600"
            small
          />
        </div>
      )}

      {/* ─── Erreur d'action ─── */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {actionError}
        </div>
      )}

      {/* ─── Tableau des commandes ─── */}
      {orders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">Aucune commande</h3>
          <p className="text-sm text-slate-500">
            Les commandes passées sur la boutique apparaîtront ici.
          </p>
          <Link
            href="/shop/bracelets"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            Voir la boutique
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Commande</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Client / Agence</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Pack</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Paiement</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Statut</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">QR</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => {
                const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                const isActionLoading =
                  actionLoading === `validate-${order.id}` ||
                  actionLoading === `ship-${order.id}` ||
                  actionLoading === `deliver-${order.id}`;

                return (
                  <tr key={order.id} className="hover:bg-slate-50">
                    {/* Commande */}
                    <td className="p-4">
                      <p className="font-mono text-xs text-slate-500">
                        #{order.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </td>

                    {/* Client / Agence */}
                    <td className="p-4">
                      <p className="font-semibold text-slate-900 text-sm">{order.customerName}</p>
                      <p className="text-xs text-slate-500">{order.customerPhone}</p>
                      {order.agency ? (
                        <Link
                          href={`/welcome/${order.agency.slug}?context=WRISTBAND`}
                          target="_blank"
                          className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 mt-0.5"
                        >
                          {order.agency.name}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <p className="text-xs text-slate-400 mt-0.5">Particulier (walk-in)</p>
                      )}
                    </td>

                    {/* Pack */}
                    <td className="p-4">
                      <p className="text-sm font-medium text-slate-900">
                        {order.quantity} bracelets
                      </p>
                      <p className="text-xs text-slate-500">
                        {order.isBranded ? '🎨 Brandé' : '⚪ Standard'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {order.totalPrice.toLocaleString('fr-FR')} FCFA
                      </p>
                    </td>

                    {/* Paiement */}
                    <td className="p-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          order.paymentStatus === 'PAID'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {order.paymentStatus === 'PAID' ? 'Payé' : 'En attente'}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">{order.paymentMethod || '-'}</p>
                    </td>

                    {/* Statut */}
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${statusConfig.color}`}
                      >
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                      {order.trackingNumber && (
                        <p className="text-xs text-slate-400 mt-1 font-mono">
                          {order.trackingNumber}
                        </p>
                      )}
                    </td>

                    {/* QR codes */}
                    <td className="p-4">
                      <p className="text-sm font-medium text-slate-900">
                        {order.activatedCount}/{order.quantity}
                      </p>
                      {order.activatedCount > 0 && (
                        <Link
                          href={`/api/admin/bracelets/${order.id}/export`}
                          className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 mt-0.5"
                          title="Télécharger CSV pour l'imprimeur"
                        >
                          <Download className="w-3 h-3" />
                          Export CSV
                        </Link>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        {order.status === 'PENDING' && (
                          <button
                            onClick={() => handleAction(order.id, 'validate')}
                            disabled={isActionLoading}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {isActionLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Factory className="w-3 h-3" />
                            )}
                            Valider & Générer QR
                          </button>
                        )}

                        {order.status === 'PRODUCING' && (
                          <button
                            onClick={() => setShipModalOrder(order)}
                            disabled={isActionLoading}
                            className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <Truck className="w-3 h-3" />
                            Marquer expédié
                          </button>
                        )}

                        {order.status === 'SHIPPED' && (
                          <button
                            onClick={() => handleAction(order.id, 'deliver')}
                            disabled={isActionLoading}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {isActionLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                            Marquer livré
                          </button>
                        )}

                        {order.status === 'DELIVERED' && (
                          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Terminé
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Modal : saisie numéro de suivi ─── */}
      {shipModalOrder && (
        <ShipModal
          order={shipModalOrder}
          onClose={() => setShipModalOrder(null)}
          onConfirm={(tracking) => handleAction(shipModalOrder.id, 'ship', tracking)}
          isLoading={actionLoading === `ship-${shipModalOrder.id}`}
        />
      )}
    </div>
  );
}

// ─── Sous-composants ────────────────────────────────────────────────────────

function StatBox({
  label,
  value,
  color,
  small,
}: {
  label: string;
  value: string | number;
  color: string;
  small?: boolean;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`${small ? 'text-base' : 'text-xl'} font-bold ${color}`}>{value}</p>
    </div>
  );
}

function ShipModal({
  order,
  onClose,
  onConfirm,
  isLoading,
}: {
  order: AdminBraceletOrder;
  onClose: () => void;
  onConfirm: (trackingNumber: string) => void;
  isLoading: boolean;
}) {
  const [tracking, setTracking] = useState(order.trackingNumber || '');

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Marquer comme expédié</h2>
            <p className="text-sm text-slate-500">
              Commande #{order.id.slice(-8).toUpperCase()} — {order.quantity} bracelets
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Numéro de suivi <span className="text-slate-400 font-normal">(optionnel)</span>
            </label>
            <input
              type="text"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="Ex: SD-TRACK-12345"
              disabled={isLoading}
              className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-slate-900 focus:border-blue-500 outline-none transition disabled:opacity-50"
            />
            <p className="text-xs text-slate-500 mt-1">
              Ce numéro sera communiqué au client par email.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            📧 Un email sera envoyé à {order.customerEmail || 'la réception'} pour informer le client de l&apos;expédition.
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={() => onConfirm(tracking)}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Expédition...
              </>
            ) : (
              <>
                <Truck className="w-4 h-4" />
                Confirmer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
