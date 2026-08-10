'use client';

import { useState } from 'react';
import { Loader2, Eye, EyeOff, Trash2, Pencil } from 'lucide-react';
import { toggleServiceStatus, deleteService } from '../actions';
import { SERVICE_CATEGORIES, SERVICE_TYPES, TEAMS, type HotelServiceSummary } from '../constants';

interface Props {
  service: HotelServiceSummary;
  onEdit: () => void;
  onRefresh: () => void;
}

export default function ServiceCard({ service, onEdit, onRefresh }: Props) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cat = SERVICE_CATEGORIES.find((c) => c.value === service.category);
  const type = SERVICE_TYPES.find((t) => t.value === service.type);
  const team = TEAMS.find((t) => t.value === service.assignedTeam);

  const handleToggle = async () => {
    setToggling(true);
    const r = await toggleServiceStatus(service.id);
    setToggling(false);
    if (!r.success) setError(r.error || 'Erreur');
    else onRefresh();
  };

  const handleDelete = async () => {
    if (!confirm(`Supprimer "${service.name}" ?`)) return;
    setDeleting(true);
    const r = await deleteService(service.id);
    setDeleting(false);
    if (!r.success) setError(r.error || 'Erreur');
    else onRefresh();
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border rounded-xl p-4 transition-all ${service.isActive ? 'border-slate-200 dark:border-slate-800' : 'border-slate-200 dark:border-slate-800 opacity-60'}`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl bg-slate-100 dark:bg-slate-800 p-2 rounded-lg shrink-0">{service.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">{service.name}</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${service.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500'}`}>
              {service.isActive ? 'ACTIF' : 'INACTIF'}
            </span>
          </div>
          {service.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{service.description}</p>}
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-slate-500">
            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{cat?.icon} {cat?.label}</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{type?.icon} {type?.label}</span>
            <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">→ {team?.label}</span>
            {!service.isFree && <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">{service.price} FCFA</span>}
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mt-2">⚠️ {error}</p>}

      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button onClick={onEdit} className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg hover:bg-slate-200 flex items-center justify-center gap-1.5">
          <Pencil className="w-3.5 h-3.5" /> Modifier
        </button>
        <button onClick={handleToggle} disabled={toggling} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg hover:bg-slate-200 flex items-center justify-center">
          {toggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : service.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
        <button onClick={handleDelete} disabled={deleting} className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg hover:bg-red-100">
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
