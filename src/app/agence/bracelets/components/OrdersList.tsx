'use client';

import { useState } from 'react';
import {
  Package,
  QrCode,
  TrendingUp,
  Calendar,
  Truck,
  CheckCircle2,
  Clock,
  Factory,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { AgencyOrderSummary } from '../actions';
import { updateOrderStatus } from '../actions';
import ActivationModal from './ActivationModal';

interface OrdersListProps {
  orders: AgencyOrderSummary[];
  onRefresh: () => void;
}

// ─── Helpers statut ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: 'En attente',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  PRODUCING: {
    label: 'En production',
    color: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
    icon: <Factory className="w-3.5 h-3.5" />,
  },
  SHIPPED: {
    label: 'Expédié',
    color: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700',
    icon: <Truck className="w-3.5 h-3.5" />,
  },
  DELIVERED: {
    label: 'Livré',
    color: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
};

function getStatusConfig(status: string) {
  return (
    STATUS_CONFIG[status] || {
      label: status,
      color: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
      icon: <AlertCircle className="w-3.5 h-3.5" />,
    }
  );
}

// ─── Composant principal ────────────────────────────────────────────────────

export default function OrdersList({ orders, onRefresh }: OrdersListProps) {
  const [activatingOrder, setActivatingOrder] = useState<AgencyOrderSummary | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    setActionError(null);
    try {
      const result = await updateOrderStatus(orderId, newStatus);
      if (!result.success) {
        setActionError(result.error || 'Erreur lors de la mise à jour.');
      } else {
        onRefresh();
      }
    } catch {
      setActionError('Une erreur est survenue.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Mes commandes
        </h2>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {orders.length} commande{orders.length > 1 ? 's' : ''}
        </span>
      </div>

      {actionError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-3 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {actionError}
        </div>
      )}

      {orders.map((order) => {
        const statusConfig = getStatusConfig(order.status);
        const activatedCount = order.activatedCount;
        const progress = order.quantity > 0 ? (activatedCount / order.quantity) * 100 : 0;
        const isUpdating = updatingId === order.id;

        return (
          <div
            key={order.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-[#134288] dark:hover:border-[#32ba5d] transition-colors"
          >
            {/* ─── En-tête ─── */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Pack {order.quantity} bracelets
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${statusConfig.color}`}
                  >
                    {statusConfig.icon}
                    {statusConfig.label}
                  </span>
                  {order.isBranded && (
                    <span className="px-2.5 py-1 bg-[#134288] text-white dark:bg-[#32ba5d] dark:text-black rounded-full text-xs font-bold">
                      BRANDÉ
                    </span>
                  )}
                  {order.paymentStatus === 'PAID' && (
                    <span className="px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">
                      Payé
                    </span>
                  )}
                </div>

                {/* ─── Grille d'infos ─── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Date
                    </p>
                    <p className="text-slate-700 dark:text-slate-200 font-medium">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                      Total
                    </p>
                    <p className="text-[#134288] dark:text-[#32ba5d] font-bold">
                      {order.totalPrice.toLocaleString('fr-FR')} FCFA
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <QrCode className="w-3 h-3" /> Activés
                    </p>
                    <p className="text-slate-700 dark:text-slate-200 font-medium">
                      {activatedCount} / {order.quantity}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Scans
                    </p>
                    <p className="text-slate-700 dark:text-slate-200 font-medium">
                      {order.totalScans}
                    </p>
                  </div>
                </div>

                {/* ─── Numéro de suivi (si expédié) ─── */}
                {order.trackingNumber && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                    Suivi : <span className="font-mono">{order.trackingNumber}</span>
                  </p>
                )}

                {/* ─── Barre de progression activation ─── */}
                {order.status === 'DELIVERED' && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <span>Activation des QR codes</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#32ba5d] transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Actions ─── */}
              <div className="flex flex-row lg:flex-col gap-2 lg:w-48 shrink-0">
                {/* Activation QR codes */}
                {order.status === 'DELIVERED' && activatedCount === 0 && (
                  <button
                    onClick={() => setActivatingOrder(order)}
                    className="flex-1 px-4 py-2.5 bg-[#32ba5d] text-black font-bold rounded-lg hover:bg-[#2ba14f] transition flex items-center justify-center gap-2 text-sm"
                  >
                    <QrCode className="w-4 h-4" />
                    Activer les QR
                  </button>
                )}

                {/* Transitions de statut */}
                {order.status === 'PENDING' && (
                  <button
                    onClick={() => handleStatusUpdate(order.id, 'PRODUCING')}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Factory className="w-4 h-4" />}
                    Marquer en production
                  </button>
                )}

                {order.status === 'PRODUCING' && (
                  <button
                    onClick={() => handleStatusUpdate(order.id, 'SHIPPED')}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2.5 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                    Marquer expédié
                  </button>
                )}

                {order.status === 'SHIPPED' && (
                  <button
                    onClick={() => handleStatusUpdate(order.id, 'DELIVERED')}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2.5 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Marquer livré
                  </button>
                )}

                {/* Si déjà activé, badge */}
                {order.status === 'DELIVERED' && activatedCount > 0 && (
                  <div className="flex-1 px-4 py-2.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-semibold rounded-lg flex items-center justify-center gap-2 text-sm border border-green-200 dark:border-green-800">
                    <CheckCircle2 className="w-4 h-4" />
                    {activatedCount} QR actifs
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* ─── Modal d'activation ─── */}
      {activatingOrder && (
        <ActivationModal
          order={activatingOrder}
          onClose={() => setActivatingOrder(null)}
          onActivated={() => {
            setActivatingOrder(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
