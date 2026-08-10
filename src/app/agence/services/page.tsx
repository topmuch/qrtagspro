'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Loader2, AlertCircle, Plus, RefreshCw, Sparkles, Check } from 'lucide-react';
import {
  getHotelServices,
  createOrUpdateService,
} from './actions';
import { type HotelServiceSummary } from './constants';
import ServiceForm from './components/ServiceForm';
import ServiceCard from './components/ServiceCard';

interface ServiceTemplate {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  type: string;
  category: string;
  displayTab: string;
  assignedTeam: string;
  isFree: boolean;
  defaultPrice: number;
  pack: string | null;
}

export default function HotelServicesPage() {
  const [services, setServices] = useState<HotelServiceSummary[]>([]);
  const [stats, setStats] = useState<{ total: number; active: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<HotelServiceSummary | null>(null);
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [activeTemplateIds, setActiveTemplateIds] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getHotelServices();
      if (!result.success) {
        setError(result.error || 'Erreur de chargement');
        return;
      }
      setServices(result.services || []);
      setStats(result.stats || null);

      // Récupérer le catalogue de templates + marquer les actifs
      const res = await fetch('/api/service-templates');
      if (res.ok) {
        const data = await res.json();
        const allTemplates: ServiceTemplate[] = data.templates || [];
        setTemplates(allTemplates);

        // Marquer les templates déjà activés (par nom)
        const activeNames = new Set((result.services || []).map((s) => s.name));
        const activeIds = new Set(
          allTemplates.filter((t) => activeNames.has(t.name)).map((t) => t.id)
        );
        setActiveTemplateIds(activeIds);
      }
    } catch (err) {
      console.error('Erreur dashboard services:', err);
      setError(null);
      setServices([]);
      setStats({ total: 0, active: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Activer un service depuis le template
  const activateTemplate = async (template: ServiceTemplate) => {
    setActivatingId(template.id);
    try {
      const result = await createOrUpdateService({
        name: template.name,
        description: template.description || undefined,
        icon: template.icon,
        type: template.type,
        category: template.category,
        isFree: template.isFree,
        price: template.defaultPrice,
        schedule: undefined,
        assignedTeam: template.assignedTeam,
        displayTab: template.displayTab,
      });
      if (result.success) {
        setActiveTemplateIds(prev => new Set(prev).add(template.id));
        loadData();
      }
    } catch (err) {
      console.error('Erreur activation template:', err);
    }
    setActivatingId(null);
  };

  // Activer un pack complet
  const activatePack = async (pack: string) => {
    const packTemplates = templates.filter((t) => t.pack === pack);
    for (const t of packTemplates) {
      if (!activeTemplateIds.has(t.id)) {
        await activateTemplate(t);
      }
    }
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#134288] dark:text-[#32ba5d]" />
        <span className="ml-3 text-slate-600 dark:text-slate-300">Chargement des services…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Erreur</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
        <button onClick={loadData} className="px-6 py-3 bg-[#134288] text-white font-bold rounded-xl hover:bg-[#0f3670] transition">Réessayer</button>
      </div>
    );
  }

  // Grouper par displayTab
  const hotelServices = services.filter((s) => s.displayTab === 'hotel');
  const tourismServices = services.filter((s) => s.displayTab === 'tourism');
  const helpServices = services.filter((s) => s.displayTab === 'help');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Services Hôtel</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Configurez les services que vos clients verront en scannant leur bracelet
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition" title="Rafraîchir">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowCatalog(!showCatalog)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 font-bold rounded-xl transition text-sm ${showCatalog ? 'bg-[#134288] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'}`}
          >
            <Sparkles className="w-4 h-4" /> Catalogue
          </button>
          <button
            onClick={() => { setEditingService(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#32ba5d] text-black font-bold rounded-xl hover:bg-[#2ba14f] transition text-sm"
          >
            <Plus className="w-4 h-4" /> Service personnalisé
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <StatBox label="Total" value={stats.total} color="text-slate-900 dark:text-white" />
          <StatBox label="Actifs" value={stats.active} color="text-green-600 dark:text-green-400" />
          <StatBox label="Inactifs" value={stats.total - stats.active} color="text-slate-400" />
        </div>
      )}

      {/* Catalogue de services prédéfinis */}
      {showCatalog && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Catalogue de services</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Cliquez sur un service pour l'activer en 1 clic (pré-rempli). Activez un pack complet ci-dessous.</p>

          {/* Packs 1 clic */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => activatePack('urban')} className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold rounded-lg text-sm hover:bg-blue-200">🏙️ Pack Urbain ({templates.filter(t => t.pack === 'urban').length})</button>
            <button onClick={() => activatePack('resort')} className="px-4 py-2 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-bold rounded-lg text-sm hover:bg-teal-200">🏖️ Pack Resort ({templates.filter(t => t.pack === 'resort').length})</button>
          </div>

          {/* Liste des templates */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
            {templates.map((t) => {
              const isActive = activeTemplateIds.has(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => !isActive && activateTemplate(t)}
                  disabled={isActive || activatingId === t.id}
                  className={`text-left p-3 rounded-lg border-2 transition ${isActive ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-[#134288]'}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xl">{t.icon}</span>
                    {isActive && <Check className="w-4 h-4 text-green-500" />}
                  </div>
                  <p className="font-bold text-xs text-slate-900 dark:text-white mt-1">{t.name}</p>
                  {t.description && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{t.description}</p>}
                  {!t.isFree && <p className="text-[10px] text-amber-600 font-bold mt-0.5">{t.defaultPrice} FCFA</p>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sections par onglet */}
      <ServiceSection title="🏨 Mon Hôtel" subtitle="Services disponibles dans l'établissement" services={hotelServices} onEdit={(s) => { setEditingService(s); setShowForm(true); }} onRefresh={loadData} />
      <ServiceSection title="🗺️ Autour de moi" subtitle="Partenaires et lieux recommandés" services={tourismServices} onEdit={(s) => { setEditingService(s); setShowForm(true); }} onRefresh={loadData} />
      <ServiceSection title="🛟 Aide" subtitle="Assistance et urgences" services={helpServices} onEdit={(s) => { setEditingService(s); setShowForm(true); }} onRefresh={loadData} />

      {/* État vide */}
      {services.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Plus className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Aucun service configuré</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
            Ajoutez vos services (WiFi, room service, spa, ménage…) pour qu&apos;ils apparaissent sur le bracelet de vos clients.
          </p>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#32ba5d] text-black font-bold rounded-xl hover:bg-[#2ba14f] transition text-sm">
            <Plus className="w-4 h-4" /> Ajouter mon premier service
          </button>
        </div>
      )}

      {/* Modal formulaire */}
      {showForm && (
        <ServiceForm
          service={editingService}
          onClose={() => { setShowForm(false); setEditingService(null); }}
          onSaved={() => { setShowForm(false); setEditingService(null); loadData(); }}
        />
      )}
    </div>
  );
}

function ServiceSection({ title, subtitle, services, onEdit, onRefresh }: {
  title: string;
  subtitle: string;
  services: HotelServiceSummary[];
  onEdit: (s: HotelServiceSummary) => void;
  onRefresh: () => void;
}) {
  if (services.length === 0) return null;
  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{title}</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{subtitle}</p>
      <div className="space-y-2">
        {services.map((s) => (
          <ServiceCard key={s.id} service={s} onEdit={() => onEdit(s)} onRefresh={onRefresh} />
        ))}
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
      <p className={`text-xl font-black ${color}`}>{value}</p>
      <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}
