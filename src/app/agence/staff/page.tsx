'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, RefreshCw, CheckCircle2, Clock, Package } from 'lucide-react';

interface StaffRequest {
  id: string;
  status: string;
  roomNumber: string | null;
  guestName: string | null;
  notes: string | null;
  totalAmount: number;
  createdAt: string;
  handledBy: string | null;
  handledAt: string | null;
  service: {
    id: string;
    name: string;
    icon: string;
    category: string;
    type: string;
    assignedTeam: string;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: 'Nouvelle', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: <Clock className="w-3.5 h-3.5" /> },
  in_progress: { label: 'En cours', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: <Loader2 className="w-3.5 h-3.5" /> },
  done: { label: 'Traitée', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <Package className="w-3.5 h-3.5" /> },
};

export default function StaffDashboardPage() {
  const [requests, setRequests] = useState<StaffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'new' | 'in_progress' | 'done' | 'all'>('new');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Récupère l'agencyId depuis le contexte d'auth (via cookie)
      const res = await fetch(`/api/service-request?status=${filter}&agencyId=auto`, {
        headers: { 'X-Source': 'staff-dashboard' },
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      } else {
        setError('Erreur de chargement');
      }
    } catch {
      setError('Erreur réseau');
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  // Polling toutes les 15 secondes
  useEffect(() => {
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    await fetch(`/api/service-request?id=${id}&status=${status}&handledBy=Réception`, { method: 'PATCH' });
    setUpdatingId(null);
    loadData();
  };

  const filteredRequests = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#134288] dark:text-[#32ba5d]" />
        <span className="ml-3 text-slate-600 dark:text-slate-300">Chargement des demandes…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
        <button onClick={loadData} className="px-6 py-3 bg-[#134288] text-white rounded-xl">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">📨 Demandes clients</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">File de demandes en temps réel (refresh auto 15s)</p>
        </div>
        <button onClick={loadData} className="p-2.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        {([
          { key: 'new', label: 'Nouvelles' },
          { key: 'in_progress', label: 'En cours' },
          { key: 'done', label: 'Traitées' },
          { key: 'all', label: 'Toutes' },
        ] as const).map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${filter === f.key ? 'bg-[#134288] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
            {f.label} ({f.key === 'all' ? requests.length : requests.filter((r) => r.status === f.key).length})
          </button>
        ))}
      </div>

      {/* Liste */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
          <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Aucune demande dans cette catégorie</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.new;
            const time = new Date(req.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            return (
              <div key={req.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{req.service.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">{req.service.name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${cfg.color}`}>{cfg.icon} {cfg.label}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                      {req.guestName && <span>👤 {req.guestName}</span>}
                      {req.roomNumber && <span>🚪 Ch. {req.roomNumber}</span>}
                      <span>🕒 {time}</span>
                      {!req.service.icon.includes('free') && req.totalAmount > 0 && <span>💰 {req.totalAmount} FCFA</span>}
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">→ {req.service.assignedTeam}</span>
                    </div>
                    {req.notes && <p className="text-xs text-slate-500 mt-2 italic">"{req.notes}"</p>}
                    {req.handledBy && <p className="text-[10px] text-slate-400 mt-1">Traité par {req.handledBy}</p>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {req.status === 'new' && (
                    <button onClick={() => updateStatus(req.id, 'in_progress')} disabled={updatingId === req.id}
                      className="flex-1 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-lg hover:bg-amber-200">
                      {updatingId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Accepter'}
                    </button>
                  )}
                  {req.status === 'in_progress' && (
                    <button onClick={() => updateStatus(req.id, 'done')} disabled={updatingId === req.id}
                      className="flex-1 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-lg hover:bg-green-200">
                      {updatingId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : '✓ Livrée / Traitée'}
                    </button>
                  )}
                  {(req.status === 'new' || req.status === 'in_progress') && (
                    <button onClick={() => updateStatus(req.id, 'cancelled')} disabled={updatingId === req.id}
                      className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100">
                      Annuler
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
