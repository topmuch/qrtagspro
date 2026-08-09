'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  Check,
  AlertCircle,
  Eye,
} from 'lucide-react';
import {
  BRACELET_PROFILES,
  SPECIALIZED_PROFILES,
  getProfileMeta,
  type BraceletProfile,
} from '@/lib/bracelet-profiles';
import {
  getAgencyBraceletProfile,
  updateBraceletProfile,
} from '../actions';

/**
 * Sélecteur de braceletProfile pour le dashboard agence.
 *
 * Permet à l'hôtel de choisir le type d'expérience affichée sur
 * /welcome/[slug]?context=WRISTBAND quand un client scanne son bracelet.
 *
 * Le changement est immédiat : la prochaine fois qu'un client scanne,
 * il voit le nouveau contenu.
 */
export default function BraceletProfileSelector() {
  const [currentProfile, setCurrentProfile] = useState<string>('STANDARD');
  const [selectedProfile, setSelectedProfile] = useState<string>('STANDARD');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ─── Chargement du profil courant ───
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getAgencyBraceletProfile();
        if (cancelled) return;
        if (result.success && result.profile) {
          setCurrentProfile(result.profile);
          setSelectedProfile(result.profile);
        }
      } catch (err) {
        console.error('Erreur chargement profil:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    if (selectedProfile === currentProfile) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await updateBraceletProfile(selectedProfile);
      if (!result.success) {
        setError(result.error || 'Échec de la mise à jour.');
      } else {
        setCurrentProfile(selectedProfile);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError('Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-[#134288] dark:text-[#32ba5d]" />
        <span className="text-sm text-slate-500">Chargement de votre profil hôtel…</span>
      </div>
    );
  }

  const currentMeta = getProfileMeta(currentProfile);
  const hasChange = selectedProfile !== currentProfile;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
      {/* ─── Header ─── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Type d&apos;expérience bracelet
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Le contenu du QR code s&apos;adapte automatiquement à votre type d&apos;hôtel
          </p>
        </div>
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
          style={{
            backgroundColor: `${currentMeta.accentColor}20`,
            color: currentMeta.accentColor,
          }}
        >
          <span>{currentMeta.emoji}</span>
          <span>{currentMeta.label}</span>
        </div>
      </div>

      {/* ─── Grille des profils ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        {BRACELET_PROFILES.map((profile) => {
          const isSelected = selectedProfile === profile.value;
          const isCurrent = currentProfile === profile.value;

          return (
            <button
              key={profile.value}
              type="button"
              onClick={() => setSelectedProfile(profile.value)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-[#134288] dark:border-[#32ba5d] bg-[#134288]/5 dark:bg-[#32ba5d]/5'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3 mb-2">
                <span
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: `${profile.accentColor}20` }}
                >
                  {profile.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {profile.label}
                    </h3>
                    {isCurrent && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        ACTUEL
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {profile.marketShare !== '—' ? `${profile.marketShare} du marché` : 'Par défaut'}
                  </p>
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-[#134288] dark:text-[#32ba5d] shrink-0" />
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
                {profile.tagline}
              </p>
              {/* Preview des services */}
              <div className="space-y-1">
                {profile.services.slice(0, 3).map((service, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="text-[#134288] dark:text-[#32ba5d]">✓</span>
                    <span>{service}</span>
                  </div>
                ))}
                {profile.services.length > 3 && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                    +{profile.services.length - 3} autres
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── Preview détaillée du profil sélectionné ─── */}
      {selectedProfile !== currentProfile && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400">
              Aperçu — ce que verront vos clients
            </h4>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
            {getProfileMeta(selectedProfile).tagline}
          </p>
          <ul className="grid grid-cols-2 gap-1">
            {getProfileMeta(selectedProfile).services.map((service, i) => (
              <li key={i} className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-1">
                <span className="shrink-0">✓</span>
                <span>{service}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ─── Erreur ─── */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-3 text-sm flex items-center gap-2 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ─── Succès ─── */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg p-3 text-sm flex items-center gap-2 mb-4">
          <Check className="w-4 h-4 shrink-0" />
          Profil mis à jour. Le changement est immédiat pour vos clients.
        </div>
      )}

      {/* ─── Action ─── */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChange || saving}
          className="px-5 py-2.5 bg-[#134288] text-white font-semibold rounded-lg hover:bg-[#0f3670] dark:bg-[#32ba5d] dark:text-black dark:hover:bg-[#2ba14f] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enregistrement…
            </>
          ) : success ? (
            <>
              <Check className="w-4 h-4" />
              Enregistré
            </>
          ) : (
            'Enregistrer le profil'
          )}
        </button>
      </div>
    </div>
  );
}
