'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Save,
  CheckCircle,
  Key,
  Briefcase,
  Camera,
  Loader2,
  Copy,
  X,
} from "lucide-react";
import { useAgency } from '../layout';
import { useToast } from '@/hooks/use-toast';
import { AGENCY_TYPES, getAgencyTypeDef } from '@/lib/agency-types';

const BRAND = '#134288';
const ACCENT = '#32ba5d';
const INK = '#134288';

export default function ProfilPage() {
  const { agencyId, agencyData, userName, userEmail } = useAgency();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: agencyData?.name || '',
    email: agencyData?.email || userEmail || '',
    phone: agencyData?.phone || '',
    contactPhone: (agencyData as any)?.contactPhone || '',
    address: agencyData?.address || '',
    agencyType: (agencyData as any)?.agencyType || 'generic',
    logoUrl: (agencyData as any)?.logoUrl || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // ─── Duplication logement ───
  const [showDuplicateForm, setShowDuplicateForm] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [dupResult, setDupResult] = useState<{ newSlug: string; copied: { services: number; teams: number; templates: number; partners: number; hasGuide: boolean } } | null>(null);
  const [dupForm, setDupForm] = useState({ name: '', slug: '', address: '' });

  const handleDuplicate = async () => {
    if (!dupForm.name || !dupForm.slug) return;
    setDuplicating(true);
    setDupResult(null);
    try {
      const res = await fetch('/api/agency/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newName: dupForm.name,
          newSlug: dupForm.slug,
          newAddress: dupForm.address || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDupResult(data);
        setShowDuplicateForm(false);
        setDupForm({ name: '', slug: '', address: '' });
        toast({ title: 'Logement dupliqué', description: 'Configuration copiée avec succès.' });
      } else {
        toast({ title: 'Erreur', description: data.error || 'Échec de la duplication', variant: 'destructive' });
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Erreur réseau', description: 'Impossible de dupliquer.', variant: 'destructive' });
    } finally {
      setDuplicating(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Sauvegarder via l'API admin/agencies PUT
      const res = await fetch('/api/admin/agencies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: agencyId,
          name: form.name,
          email: form.email,
          phone: form.phone,
          contactPhone: form.contactPhone,
          address: form.address,
          logoUrl: form.logoUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur sauvegarde');
      setSuccess(true);
      toast({ title: 'Profil mis à jour ✅' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500000) {
      toast({ title: 'Logo trop volumineux', description: 'Max 500KB', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm({ ...form, logoUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Profil de l&apos;agence</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez les informations de votre agence</p>
      </div>

      {success && (
        <div className="mb-6 p-4 rounded-xl flex items-center gap-3 border-2 bg-[#32ba5d]/10 border-[#32ba5d]">
          <CheckCircle className="w-5 h-5 text-[#32ba5d]" />
          <span className="font-medium text-[#134288]">Modifications enregistrées avec succès !</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Logo + Infos agence */}
        <div className="bg-white rounded-2xl p-6 border-2 border-[#134288] shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#134288] flex items-center justify-center">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Informations de l&apos;agence</h2>
              <p className="text-sm text-slate-500">Ces informations apparaîtront sur la page trouveur et le dashboard</p>
            </div>
          </div>

          {/* Logo upload */}
          <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              <Camera className="w-4 h-4 inline mr-1" />
              Logo de l&apos;établissement
            </label>
            <div className="flex items-center gap-4">
              {form.logoUrl ? (
                <img
                  src={form.logoUrl}
                  alt="Logo"
                  className="h-20 w-20 object-contain border-2 border-slate-300 rounded-xl bg-white p-1"
                />
              ) : (
                <div className="h-20 w-20 border-2 border-dashed border-slate-300 rounded-xl bg-white flex items-center justify-center">
                  <Building className="w-8 h-8 text-slate-300" />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#32ba5d] file:text-white hover:file:bg-[#28a54f] cursor-pointer"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Affiché sur la page trouveur quand un QR est scanné. Max 500KB, PNG/JPG.
                </p>
                {form.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, logoUrl: '' })}
                    className="text-xs text-red-600 hover:underline mt-1"
                  >
                    Supprimer le logo
                  </button>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700">
                  <User className="w-4 h-4 inline mr-2" />
                  Nom de l&apos;agence
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d]/30 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d]/30 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d]/30 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Téléphone réception (WhatsApp) *
                </label>
                <input
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  placeholder="+33 1 23 45 67 89"
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d]/30 transition"
                />
                <p className="text-xs text-slate-500 mt-1">Numéro contacté par le trouveur via WhatsApp</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-slate-700">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Adresse
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d]/30 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="text-white py-3 px-6 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50 hover:opacity-90 bg-[#134288]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </form>
        </div>

        {/* Password Change */}
        <div className="bg-white rounded-2xl p-6 border-2 border-slate-300 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Sécurité</h2>
              <p className="text-sm text-slate-500">Changez votre mot de passe</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">Mot de passe actuel</label>
              <input
                type="password"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d]/30 transition"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d]/30 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700">Confirmer</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:border-[#32ba5d] focus:ring-2 focus:ring-[#32ba5d]/30 transition"
                />
              </div>
            </div>
            <button
              type="button"
              className="text-white py-3 px-6 rounded-xl font-medium bg-slate-800 hover:bg-slate-900 transition-colors flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              Changer le mot de passe
            </button>
          </div>
        </div>

        {/* ─── DUPLICATION LOGEMENT ─── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <Copy className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Dupliquer ce logement</h2>
              <p className="text-sm text-slate-500">Conciergerie : créez un nouveau logement avec la même config en 1 clic</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
            📋 Copie : services (avec modes d'emploi appareils), équipes & emails, partenaires POI, guide maison, type d'agence, profil bracelet.
            <br />❌ Ne copie pas : bracelets activés, séjours, demandes, objets trouvés (données opérationnelles).
          </p>

          {!showDuplicateForm ? (
            <button
              type="button"
              onClick={() => setShowDuplicateForm(true)}
              className="w-full py-3 px-6 rounded-xl font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Dupliquer ce logement
            </button>
          ) : (
            <div className="space-y-3 bg-violet-50/50 p-4 rounded-xl border border-violet-100">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Nom du nouveau logement *</label>
                <input
                  type="text"
                  value={dupForm.name}
                  onChange={(e) => setDupForm({ ...dupForm, name: e.target.value })}
                  placeholder="Ex: Villa plage - Saly"
                  className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-slate-900 outline-none focus:border-violet-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Slug (URL) *</label>
                <input
                  type="text"
                  value={dupForm.slug}
                  onChange={(e) => setDupForm({ ...dupForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  placeholder="villa-plage-saly"
                  className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-slate-900 outline-none focus:border-violet-400 text-sm font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">URL : /welcome/{dupForm.slug || '...'}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Adresse (optionnel)</label>
                <input
                  type="text"
                  value={dupForm.address}
                  onChange={(e) => setDupForm({ ...dupForm, address: e.target.value })}
                  placeholder="Laisser vide pour reprendre l'adresse source"
                  className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-slate-900 outline-none focus:border-violet-400 text-sm"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDuplicateForm(false)}
                  disabled={duplicating}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition text-sm flex items-center justify-center gap-1.5"
                >
                  <X className="w-4 h-4" /> Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDuplicate}
                  disabled={duplicating || !dupForm.name || !dupForm.slug}
                  className="flex-1 py-2.5 bg-violet-600 text-white font-bold rounded-lg hover:bg-violet-700 transition text-sm flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {duplicating ? <><Loader2 className="w-4 h-4 animate-spin" /> Création…</> : <><Copy className="w-4 h-4" /> Dupliquer</>}
                </button>
              </div>
            </div>
          )}
          {dupResult && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
              ✅ Logement créé avec succès ! Copié : {dupResult.copied?.services || 0} services, {dupResult.copied?.teams || 0} équipes, {dupResult.copied?.partners || 0} partenaires.
              <div className="mt-2">
                <a href={`/welcome/${dupResult.newSlug}`} target="_blank" rel="noopener noreferrer" className="text-violet-700 font-semibold underline">
                  Voir le nouveau logement →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// end
