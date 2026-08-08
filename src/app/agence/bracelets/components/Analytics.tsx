'use client';

import { BarChart3, TrendingUp, Clock, MapPin, Activity } from 'lucide-react';
import type { BraceletAnalyticsData } from '../actions';

interface AnalyticsProps {
  data: BraceletAnalyticsData;
}

/**
 * Panneau d'analytics des scans bracelets.
 *
 * Affiche :
 *   - Scans par jour (7 derniers jours) — barres horizontales
 *   - Services les plus consultés — basé sur ScanLog.location réel
 *   - Heures de pic — distribution 24h en barres verticales
 *
 * Contrairement au code fourni qui simulait des données fictives pour
 * topServices, ce composant n'affiche que des données réelles issues
 * de la base. Si pas de scans, affiche un état vide honnête.
 */
export default function Analytics({ data }: AnalyticsProps) {
  // ─── État : aucune donnée ───
  if (data.totalScans === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <BarChart3 className="w-7 h-7 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
          Pas encore de données
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Les statistiques de scan apparaîtront ici dès que vos clients
          commenceront à scanner leurs bracelets.
        </p>
      </div>
    );
  }

  const maxDayCount = Math.max(...data.scansByDay.map((d) => d.count), 1);
  const maxHourCount = Math.max(...data.peakHours.map((p) => p.count), 1);
  const maxServiceCount = Math.max(...data.topServices.map((s) => s.count), 1);

  return (
    <div className="space-y-4">
      {/* ─── Titre ─── */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-[#134288] dark:text-[#32ba5d]" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Analytics Bracelets
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ─── Scans par jour ─── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[#134288] dark:text-[#32ba5d]" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Scans par jour (7 derniers jours)
            </h3>
          </div>
          <div className="space-y-2">
            {data.scansByDay.map((day, idx) => {
              const width = (day.count / maxDayCount) * 100;
              return (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400 w-16 capitalize">
                    {day.date}
                  </span>
                  <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#134288] dark:bg-[#32ba5d] flex items-center justify-end px-2 transition-all duration-500"
                      style={{ width: `${Math.max(width, day.count > 0 ? 8 : 0)}%` }}
                    >
                      {day.count > 0 && (
                        <span className="text-xs font-bold text-white dark:text-black">
                          {day.count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Total semaine</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {data.scansByDay.reduce((s, d) => s + d.count, 0)} scans
            </span>
          </div>
        </div>

        {/* ─── Services les plus consultés ─── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-[#134288] dark:text-[#32ba5d]" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Services les plus consultés
            </h3>
          </div>
          {data.topServices.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 py-8 text-center">
              Données de localisation non disponibles pour ces scans.
            </p>
          ) : (
            <div className="space-y-3">
              {data.topServices.map((service, idx) => {
                const width = (service.count / maxServiceCount) * 100;
                return (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        {service.name}
                      </span>
                      <span className="text-sm font-bold text-[#134288] dark:text-[#32ba5d]">
                        {service.count}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#134288] dark:bg-[#32ba5d] transition-all duration-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Heures de pic ─── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-[#134288] dark:text-[#32ba5d]" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Heures de pic d&apos;utilisation
            </h3>
          </div>
          <div className="grid grid-cols-12 md:grid-cols-24 gap-1 items-end" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
            {data.peakHours.map((p) => {
              const height = (p.count / maxHourCount) * 100;
              return (
                <div key={p.hour} className="flex flex-col items-center group">
                  <div className="w-full h-24 flex items-end">
                    <div
                      className="w-full bg-[#134288]/70 dark:bg-[#32ba5d]/70 hover:bg-[#134288] dark:hover:bg-[#32ba5d] rounded-t transition-all relative"
                      style={{ height: `${Math.max(height, p.count > 0 ? 6 : 2)}%` }}
                      title={`${p.hour}h : ${p.count} scans`}
                    >
                      {p.count > 0 && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-700 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition">
                          {p.count}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    {p.hour}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Pic : {data.peakHours.reduce((max, p) => (p.count > max.count ? p : max), data.peakHours[0]).count} scans
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {data.activeWristbands} bracelets actifs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
