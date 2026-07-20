'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Power,
  Edit3,
  FileText,
  Share2,
  Camera,
  KeyRound,
  AlertTriangle,
  HelpCircle,
  X,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import type { BaggageInfo, SuiviData } from './types';

const BRAND = '#111111';
const ACCENT = '#E3B23C';
const INK = '#1a1a1a';

export function TabActions({
  reference,
  baggage,
  data,
  isDeclaredLost,
  isTogglingStatus,
  onStatusToggle,
  lang,
  t,
}: {
  reference: string;
  baggage: BaggageInfo;
  data: SuiviData;
  isDeclaredLost: boolean;
  isTogglingStatus: boolean;
  onStatusToggle: (action: 'mark-lost' | 'mark-found') => void;
  lang: string;
  t: (key: string, params?: Record<string, string>) => string;
}) {
  // ─── Transit mode ───
  const [transitMode, setTransitMode] = useState<'active' | 'inactive'>('active');
  const [showTransitModal, setShowTransitModal] = useState(false);
  const [transitPin, setTransitPin] = useState('');
  const [transitLoading, setTransitLoading] = useState(false);
  const [transitError, setTransitError] = useState('');
  const [hasOwnerPin, setHasOwnerPin] = useState(false);

  useEffect(() => {
    fetch(`/api/baggage/${reference}/transit-mode`)
      .then(r => r.json())
      .then(d => {
        if (d.transitMode) setTransitMode(d.transitMode);
        if (d.hasPin !== undefined) setHasOwnerPin(d.hasPin);
      })
      .catch(() => {});
  }, [reference]);

  const handleTransitToggle = useCallback(async () => {
    if (!transitPin || transitPin.length < 4) {
      setTransitError('Veuillez saisir votre PIN.');
      return;
    }
    setTransitLoading(true);
    setTransitError('');
    try {
      const newMode = transitMode === 'active' ? 'inactive' : 'active';
      const res = await fetch(`/api/baggage/${reference}/transit-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: transitPin, mode: newMode }),
      });
      const result = await res.json();
      if (res.ok) {
        setTransitMode(newMode);
        setShowTransitModal(false);
        setTransitPin('');
      } else {
        setTransitError(result.error || 'Erreur');
      }
    } catch {
      setTransitError('Erreur réseau');
    } finally {
      setTransitLoading(false);
    }
  }, [reference, transitMode, transitPin]);

  // ─── PDF export ───
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfPin, setPdfPin] = useState('');
  const [pdfError, setPdfError] = useState('');

  const handleDownloadPdf = useCallback(() => {
    if (!pdfPin || pdfPin.length < 4) {
      setPdfError('Veuillez saisir votre PIN.');
      return;
    }
    const url = `/api/baggage/${reference}/export-pdf?pin=${encodeURIComponent(pdfPin)}`;
    window.open(url, '_blank');
    setShowPdfModal(false);
    setPdfPin('');
    setPdfError('');
  }, [reference, pdfPin]);

  // ─── Share ───
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePin, setSharePin] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState('');
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/baggage/${reference}/share`)
      .then(r => r.json())
      .then(d => { if (d.hasShare && d.shareUrl) setShareUrl(d.shareUrl); })
      .catch(() => {});
  }, [reference]);

  const handleShareGenerate = useCallback(async () => {
    if (!sharePin || sharePin.length < 4) { setShareError('PIN requis.'); return; }
    setShareLoading(true); setShareError('');
    try {
      const res = await fetch(`/api/baggage/${reference}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: sharePin, action: 'generate' }),
      });
      const d = await res.json();
      if (res.ok) { setShareUrl(d.shareUrl); setSharePin(''); }
      else setShareError(d.error || 'Erreur');
    } catch { setShareError('Erreur réseau'); }
    finally { setShareLoading(false); }
  }, [reference, sharePin]);

  const handleShareRevoke = useCallback(async () => {
    if (!sharePin) { setShareError('PIN requis pour révoquer.'); return; }
    setShareLoading(true); setShareError('');
    try {
      const res = await fetch(`/api/baggage/${reference}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: sharePin, action: 'revoke' }),
      });
      const d = await res.json();
      if (res.ok) { setShareUrl(null); setSharePin(''); }
      else setShareError(d.error || 'Erreur');
    } catch { setShareError('Erreur réseau'); }
    finally { setShareLoading(false); }
  }, [reference, sharePin]);

  // ─── PIN recovery ───
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinRecoveryInput, setPinRecoveryInput] = useState('');
  const [pinRecoveryLoading, setPinRecoveryLoading] = useState(false);
  const [pinRecoveryError, setPinRecoveryError] = useState('');
  const [pinRecoveryResult, setPinRecoveryResult] = useState<string | null>(null);

  const handlePinRecovery = useCallback(async () => {
    if (!pinRecoveryInput || pinRecoveryInput.length < 4) { setPinRecoveryError('PIN actuel requis.'); return; }
    setPinRecoveryLoading(true); setPinRecoveryError(''); setPinRecoveryResult(null);
    try {
      const res = await fetch(`/api/baggage/${reference}/regenerate-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinRecoveryInput }),
      });
      const d = await res.json();
      if (res.ok) { setPinRecoveryResult(""); setPinRecoveryInput(''); }
      else setPinRecoveryError(d.error || 'Erreur');
    } catch { setPinRecoveryError('Erreur réseau'); }
    finally { setPinRecoveryLoading(false); }
  }, [reference, pinRecoveryInput]);

  // ─── Damage reports ───
  const [damageReports, setDamageReports] = useState<{ hasBefore: boolean; hasAfter: boolean; reports: Array<{ id: string; type: string; photos: string[]; description: string | null; createdAt: string }> } | null>(null);
  const [showDamage, setShowDamage] = useState(false);

  useEffect(() => {
    fetch(`/api/baggage/${reference}/damage`)
      .then(r => r.json())
      .then(d => { if (d.reports) setDamageReports(d); })
      .catch(() => {});
  }, [reference]);

  // ─── Damage photos inline upload (sans aller sur /edit) ───
  const [showDamageUpload, setShowDamageUpload] = useState(false);
  const [damageType, setDamageType] = useState<'before' | 'after'>('before');
  const [damagePhotos, setDamagePhotos] = useState<string[]>([]);
  const [damageDescription, setDamageDescription] = useState('');
  const [damageLoading, setDamageLoading] = useState(false);
  const [damageError, setDamageError] = useState('');
  const [damageSuccess, setDamageSuccess] = useState('');

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPhotos: string[] = [];
    const maxPhotos = 3;
    Array.from(files).slice(0, maxPhotos - damagePhotos.length).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        newPhotos.push(reader.result as string);
        if (newPhotos.length === Math.min(files.length, maxPhotos - damagePhotos.length)) {
          setDamagePhotos([...damagePhotos, ...newPhotos]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDamageSave = useCallback(async () => {
    if (damagePhotos.length === 0) {
      setDamageError('Veuillez ajouter au moins une photo.');
      return;
    }
    setDamageLoading(true);
    setDamageError('');
    setDamageSuccess('');
    try {
      const res = await fetch(`/api/baggage/${reference}/damage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: damageType,
          description: damageDescription,
          photos: damagePhotos,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDamageSuccess(data.message || 'Photos enregistrées !');
        setDamagePhotos([]);
        setDamageDescription('');
        const refreshRes = await fetch(`/api/baggage/${reference}/damage`);
        const refreshData = await refreshRes.json();
        if (refreshData.reports) setDamageReports(refreshData);
        setTimeout(() => { setShowDamageUpload(false); setDamageSuccess(''); }, 2000);
      } else {
        setDamageError(data.error || 'Erreur serveur');
      }
    } catch {
      setDamageError('Erreur réseau');
    } finally {
      setDamageLoading(false);
    }
  }, [reference, damagePhotos, damageType, damageDescription]);

  return (
    <div className="space-y-3">
      {/* Mode En transit */}
      <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Power className={`w-5 h-5 flex-shrink-0 ${transitMode === 'active' ? 'text-green-600' : 'text-slate-400'}`} />
            <div>
              <h3 className="text-sm font-bold text-[#1a1a1a]">Mode En transit</h3>
              <p className="text-xs text-slate-500">
                {transitMode === 'active' ? 'QR actif' : 'QR désactivé'}
              </p>
            </div>
          </div>
          <button
            onClick={() => { setTransitError(''); setShowTransitModal(true); }}
            className={`relative inline-flex h-7 w-12 rounded-full transition-colors ${transitMode === 'active' ? 'bg-green-500' : 'bg-slate-300'}`}
          >
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${transitMode === 'active' ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* Modifier profil */}
      <a href={`/suivi/${reference}/edit`} className="block bg-[#111111] text-white text-center py-3 px-4 rounded-xl font-bold text-sm">
        <Edit3 className="w-4 h-4 inline mr-2" />Modifier mon profil de voyage
      </a>

      {/* Mon code PIN */}
      <button
        onClick={() => { setShowPinModal(true); setPinRecoveryError(''); setPinRecoveryInput(''); setPinRecoveryResult(null); }}
        className="w-full bg-white text-slate-600 border-2 border-slate-300 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
      >
        <KeyRound className="w-4 h-4" />🔐 Mon code PIN
      </button>

      {/* PDF */}
      <button
        onClick={() => { setShowPdfModal(true); setPdfError(''); setPdfPin(''); }}
        className="w-full bg-[#E3B23C] text-[#1a1a1a] border-2 border-[#1a1a1a] py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
      >
        <FileText className="w-4 h-4" />📄 Télécharger le parcours (PDF)
      </button>

      {/* Partage */}
      <button
        onClick={() => { setShowShareModal(true); setShareError(''); setSharePin(''); }}
        className={`w-full border-2 border-[#1a1a1a] py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${shareUrl ? 'bg-green-50 text-green-700' : 'bg-white text-[#111111]'}`}
      >
        <Share2 className="w-4 h-4" />{shareUrl ? '✅ Partage actif — Gérer' : '🔗 Partager le suivi (famille)'}
      </button>

      {/* Photos de protection */}
      {damageReports && damageReports.reports.length > 0 ? (
        <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-4">
          <button onClick={() => setShowDamage(!showDamage)} className="w-full flex items-center justify-between text-left">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#111111]" />
              <div>
                <h3 className="text-sm font-bold text-[#1a1a1a]">📷 Photos de protection</h3>
                <p className="text-xs text-slate-500">
                  {damageReports.hasBefore && damageReports.hasAfter ? '✅ AVANT + APRÈS — protégé' : `${damageReports.reports.length} photo(s)`}
                </p>
              </div>
            </div>
            <span className="text-sm text-slate-400">{showDamage ? '▲' : '▼'}</span>
          </button>
          {showDamage && (
            <div className="mt-3 space-y-2">
              {damageReports.reports.map(r => (
                <div key={r.id} className="border-l-4 border-[#111111] pl-3">
                  <p className="text-xs font-bold">{r.type === 'before' ? '📦 Avant' : '📦 Après'} — {new Date(r.createdAt).toLocaleDateString('fr-FR')}</p>
                  <div className="flex gap-2 mt-1">
                    {r.photos.map((p, i) => <img key={i} src={p} alt="" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#E3B23C] border-2 border-dashed border-[#1a1a1a] rounded-2xl p-4">
          {!showDamageUpload ? (
            <button onClick={() => setShowDamageUpload(true)} className="w-full text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center"><Camera className="w-5 h-5 text-[#E3B23C]" /></div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[#1a1a1a]">📷 Protégez votre bagage</h3>
                  <p className="text-xs text-slate-700">Photo avant le vol = dédommagement garanti en cas de casse</p>
                </div>
                <span className="text-xs font-bold text-[#1a1a1a]">→</span>
              </div>
            </button>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#1a1a1a]">📸 Photos de protection</h3>

              {/* Type selector */}
              <div className="flex gap-2">
                <button onClick={() => setDamageType('before')} className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border-2 ${damageType === 'before' ? 'bg-[#1a1a1a] text-[#E3B23C] border-[#1a1a1a]' : 'bg-white/50 text-[#1a1a1a] border-[#1a1a1a]/30'}`}>📦 Avant</button>
                <button onClick={() => setDamageType('after')} className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border-2 ${damageType === 'after' ? 'bg-[#1a1a1a] text-[#E3B23C] border-[#1a1a1a]' : 'bg-white/50 text-[#1a1a1a] border-[#1a1a1a]/30'}`}>📦 Après</button>
              </div>

              {/* Photo upload */}
              <div className="flex gap-2 flex-wrap">
                {damagePhotos.map((photo, idx) => (
                  <div key={idx} className="relative w-20 h-20">
                    <img src={photo} alt="" className="w-full h-full object-cover rounded-lg border-2 border-[#1a1a1a]" />
                    <button onClick={() => setDamagePhotos(damagePhotos.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white rounded-full text-xs">✕</button>
                  </div>
                ))}
                {damagePhotos.length < 3 && (
                  <label className="w-20 h-20 border-2 border-dashed border-[#1a1a1a]/40 rounded-lg flex items-center justify-center cursor-pointer">
                    <Camera className="w-5 h-5 text-[#1a1a1a]/50" />
                    <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handlePhotoSelect} className="hidden" />
                  </label>
                )}
              </div>

              {/* Description */}
              <textarea placeholder={damageType === 'before' ? 'ex: Bagage en bon état...' : 'ex: Poignée cassée...'} value={damageDescription} onChange={(e) => setDamageDescription(e.target.value)} maxLength={1000} rows={2} className="w-full bg-white border-2 border-[#1a1a1a] rounded-lg px-3 py-2 text-sm text-[#1a1a1a]" />

              {damageError && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{damageError}</p>}
              {damageSuccess && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-2">{damageSuccess}</p>}

              <div className="flex gap-2">
                <button onClick={() => { setShowDamageUpload(false); setDamagePhotos([]); setDamageError(''); }} className="flex-1 py-2 bg-slate-200 rounded-xl font-bold text-slate-700 text-sm">Annuler</button>
                <button onClick={handleDamageSave} disabled={damageLoading || damagePhotos.length === 0} className="flex-1 py-2 bg-[#1a1a1a] text-[#E3B23C] rounded-xl font-bold text-sm disabled:opacity-50">{damageLoading ? '...' : 'Enregistrer'}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alerte retard vol */}
      {baggage.transportMode === 'flight' && baggage.flightNumber && (
        <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-[#1a1a1a]">Mon vol a du retard</h3>
          </div>
          <p className="text-xs text-slate-500 mb-2">Vérifiez si votre correspondance est encore faisable.</p>
          <a href={`/suivi/${reference}/edit`} className="text-xs font-bold text-[#111111]">Signaler un retard →</a>
        </div>
      )}

      {/* Assistance */}
      <a href="/assistance" className="block text-center bg-white border-2 border-[#111111] text-[#111111] py-3 px-4 rounded-xl font-bold text-sm">
        <HelpCircle className="w-4 h-4 inline mr-2" />Besoin d&apos;aide ? Centre d&apos;assistance
      </a>

      {/* Déclarer perdu */}
      {!isDeclaredLost && (
        <button
          onClick={() => onStatusToggle('mark-lost')}
          disabled={isTogglingStatus}
          className="w-full bg-[#EF4444] text-white py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isTogglingStatus ? <RefreshCw className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
          Déclarer mon bagage perdu
        </button>
      )}
      {isDeclaredLost && (
        <button
          onClick={() => onStatusToggle('mark-found')}
          disabled={isTogglingStatus}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isTogglingStatus ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          J&apos;ai retrouvé mon bagage
        </button>
      )}

      {/* ═══ Modals ═══ */}
      {/* Transit modal */}
      {showTransitModal && (
        <Modal title={transitMode === 'active' ? 'Désactiver le QR' : 'Réactiver le QR'} onClose={() => { setShowTransitModal(false); setTransitPin(''); setTransitError(''); }}>
          <p className="text-sm text-slate-600 mb-3">Saisissez votre PIN pour confirmer.</p>
          <input type="password" inputMode="numeric" maxLength={6} placeholder="••••" value={transitPin}
            onChange={(e) => setTransitPin(e.target.value.replace(/\D/g, ''))}
            className="w-full text-center text-2xl tracking-[0.5em] bg-slate-50 border-2 border-slate-200 rounded-xl py-3 px-4 mb-3" autoFocus />
          {transitError && <p className="text-sm text-red-600 mb-3">{transitError}</p>}
          <div className="flex gap-2">
            <button onClick={() => { setShowTransitModal(false); setTransitPin(''); }} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-700">Annuler</button>
            <button onClick={handleTransitToggle} disabled={transitLoading} className="flex-1 py-3 bg-[#111111] text-white rounded-xl font-bold disabled:opacity-50">{transitLoading ? '...' : 'Confirmer'}</button>
          </div>
        </Modal>
      )}

      {/* PDF modal */}
      {showPdfModal && (
        <Modal title="📄 Télécharger le parcours PDF" onClose={() => { setShowPdfModal(false); setPdfPin(''); setPdfError(''); }}>
          <p className="text-sm text-slate-600 mb-3">Le PDF contient l&apos;historique complet. Saisissez votre PIN.</p>
          <input type="password" inputMode="numeric" maxLength={6} placeholder="••••" value={pdfPin}
            onChange={(e) => setPdfPin(e.target.value.replace(/\D/g, ''))}
            className="w-full text-center text-2xl tracking-[0.5em] bg-slate-50 border-2 border-slate-200 rounded-xl py-3 px-4 mb-3" autoFocus />
          {pdfError && <p className="text-sm text-red-600 mb-3">{pdfError}</p>}
          <div className="flex gap-2">
            <button onClick={() => { setShowPdfModal(false); setPdfPin(''); }} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-700">Annuler</button>
            <button onClick={handleDownloadPdf} className="flex-1 py-3 bg-[#111111] text-white rounded-xl font-bold">Télécharger</button>
          </div>
        </Modal>
      )}

      {/* Share modal */}
      {showShareModal && (
        <Modal title="🔗 Partage familial" onClose={() => { setShowShareModal(false); setSharePin(''); setShareError(''); }}>
          {shareUrl ? (
            <div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3">
                <p className="text-sm font-bold text-green-700 mb-1">✅ Lien actif</p>
                <div className="bg-white border rounded-lg p-2 flex items-center gap-2">
                  <input readOnly value={shareUrl} className="flex-1 text-xs font-mono outline-none" />
                  <button onClick={() => { navigator.clipboard.writeText(shareUrl); setShareCopied(true); setTimeout(() => setShareCopied(false), 3000); }} className="text-xs font-bold text-[#111111]">{shareCopied ? '✅' : 'Copier'}</button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-3">Saisissez votre PIN pour révoquer :</p>
              <input type="password" inputMode="numeric" maxLength={6} placeholder="PIN" value={sharePin}
                onChange={(e) => setSharePin(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-xl tracking-[0.5em] bg-slate-50 border-2 border-slate-200 rounded-xl py-3 px-4 mb-3" />
              {shareError && <p className="text-sm text-red-600 mb-3">{shareError}</p>}
              <div className="flex gap-2">
                <button onClick={() => setShowShareModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-700">Fermer</button>
                <button onClick={handleShareRevoke} disabled={shareLoading || !sharePin} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold disabled:opacity-50">Révoquer</button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-slate-600 mb-3">Générez un lien à partager avec un proche (lecture seule).</p>
              <input type="password" inputMode="numeric" maxLength={6} placeholder="••••" value={sharePin}
                onChange={(e) => setSharePin(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-2xl tracking-[0.5em] bg-slate-50 border-2 border-slate-200 rounded-xl py-3 px-4 mb-3" autoFocus />
              {shareError && <p className="text-sm text-red-600 mb-3">{shareError}</p>}
              <div className="flex gap-2">
                <button onClick={() => setShowShareModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-700">Annuler</button>
                <button onClick={handleShareGenerate} disabled={shareLoading || !sharePin} className="flex-1 py-3 bg-[#111111] text-white rounded-xl font-bold disabled:opacity-50">{shareLoading ? '...' : 'Générer'}</button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* PIN recovery modal */}
      {showPinModal && (
        <Modal title="🔐 Mon code PIN" onClose={() => { setShowPinModal(false); setPinRecoveryInput(''); setPinRecoveryError(''); setPinRecoveryResult(null); }}>
          {pinRecoveryResult ? (
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-3">Voici votre nouveau PIN. <strong>Notez-le !</strong></p>
              <div className="bg-[#E3B23C] border-2 border-dashed border-[#1a1a1a] rounded-xl py-6 mb-4">
                <p className="text-5xl font-mono font-bold tracking-[0.5em]" style={{ color: INK }}>{pinRecoveryResult}</p>
              </div>
              <button onClick={() => { setShowPinModal(false); setPinRecoveryResult(null); }} className="w-full py-3 bg-[#111111] text-white rounded-xl font-bold">J&apos;ai noté mon PIN</button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-slate-600 mb-2">Votre PIN est hashé (non réversible). Générez-en un nouveau en saisissant votre PIN actuel.</p>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">
                PIN oublié ? <a href="mailto:contact@qrtags.com" className="underline font-bold">contact@qrtags.com</a>
              </p>
              <input type="password" inputMode="numeric" maxLength={6} placeholder="PIN actuel" value={pinRecoveryInput}
                onChange={(e) => setPinRecoveryInput(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-2xl tracking-[0.5em] bg-slate-50 border-2 border-slate-200 rounded-xl py-3 px-4 mb-3" autoFocus />
              {pinRecoveryError && <p className="text-sm text-red-600 mb-3">{pinRecoveryError}</p>}
              <div className="flex gap-2">
                <button onClick={() => setShowPinModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-700">Annuler</button>
                <button onClick={handlePinRecovery} disabled={pinRecoveryLoading || !pinRecoveryInput} className="flex-1 py-3 bg-[#111111] text-white rounded-xl font-bold disabled:opacity-50">{pinRecoveryLoading ? '...' : 'Régénérer'}</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ─── Reusable Modal ───
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-bold text-[#1a1a1a]">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
