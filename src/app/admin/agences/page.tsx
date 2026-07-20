'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  Building,
  RefreshCw,
  Mail,
  Phone,
  Users,
  Loader2,
} from "lucide-react";

// Types
interface Agency {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  agencyType: string | null;
  active: boolean;
  createdAt: string;
  _count?: {
    baggages: number;
    users: number;
  };
}

export default function AgencesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [agencyCreating, setAgencyCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editAgencyId, setEditAgencyId] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const [editForm, setEditForm] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    active: true,
    newPassword: '',
    confirmPassword: '',
  });

  const [agencyForm, setAgencyForm] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    agencyType: 'generic',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchAgencies(true);
  }, []);

  const fetchAgencies = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      // QRTags : no-store pour toujours voir les nouvelles agences créées
      const res = await fetch('/api/admin/agencies', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const data = await res.json();
      setAgencies(data.agencies || []);
    } catch (error) {
      console.error('Error fetching agencies:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleCreateAgency = async () => {
    if (!agencyForm.email) {
      setErrorMessage("L'email est obligatoire");
      return;
    }
    if (!agencyForm.password || agencyForm.password.length < 8) {
      setErrorMessage('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (!/[A-Z]/.test(agencyForm.password)) {
      setErrorMessage('Le mot de passe doit contenir au moins une majuscule');
      return;
    }
    if (!/\d/.test(agencyForm.password)) {
      setErrorMessage('Le mot de passe doit contenir au moins un chiffre');
      return;
    }
    if (agencyForm.password !== agencyForm.confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas');
      return;
    }

    setAgencyCreating(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // ─── 1. Créer l'agence ──────────────────────────────────
      const agencyResponse = await fetch('/api/admin/agencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agencyForm.name,
          slug: agencyForm.slug || undefined, // API auto-génère si vide
          email: agencyForm.email,
          phone: agencyForm.phone,
          agencyType: agencyForm.agencyType,
        }),
      });

      const agencyData = await agencyResponse.json();

      if (!agencyResponse.ok) {
        setErrorMessage(agencyData.error || 'Erreur lors de la création de l\'agence');
        return;
      }

      // ─── 2. Créer l'utilisateur lié (avec gestion d'erreur) ──
      const userResponse = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: agencyForm.email,
          name: agencyForm.name,
          password: agencyForm.password,
          role: 'agency',
          agencyId: agencyData.agency.id,
        }),
      });

      if (!userResponse.ok) {
        const userErr = await userResponse.json();
        const errMsg = userErr.error || 'erreur inconnue';
        if (errMsg.includes('email') || errMsg.includes('déjà utilisé')) {
          // Cas courant : l'utilisateur a re-cliqué, l'agence ET l'utilisateur existent déjà
          setSuccessMessage(`Agence "${agencyForm.name}" déjà créée. L'utilisateur "${agencyForm.email}" existe déjà.`);
        } else {
          setSuccessMessage(`Agence créée. ⚠️ Utilisateur non créé : ${errMsg}. Créez-le manuellement dans l'onglet Utilisateurs.`);
        }
      } else {
        setSuccessMessage(`✅ Agence "${agencyForm.name}" créée avec succès ! Utilisateur "${agencyForm.email}" associé.`);
      }

      // QRTags : refresh liste EN PREMIER, avant de fermer le dialog/reset form
      await fetchAgencies(true);
      setDialogOpen(false);
      setAgencyForm({ name: '', slug: '', email: '', phone: '', agencyType: 'generic', password: '', confirmPassword: '' });
      setTimeout(() => setSuccessMessage(''), 6000);
    } catch (error) {
      console.error('Error creating agency:', error);
      setErrorMessage("Erreur lors de la création de l'agence");
    } finally {
      setAgencyCreating(false);
    }
  };

  const handleDeleteAgency = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette agence ?')) return;

    try {
      const response = await fetch(`/api/admin/agencies?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccessMessage('Agence supprimée avec succès');
        fetchAgencies();
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error deleting agency:', error);
    }
  };

  // Open edit dialog with agency data
  const handleOpenEdit = (agency: Agency) => {
    setEditAgencyId(agency.id);
    setEditForm({
      name: agency.name,
      slug: agency.slug,
      email: agency.email || '',
      phone: agency.phone || '',
      active: agency.active,
      newPassword: '',
      confirmPassword: '',
    });
    setEditError('');
    setEditSuccess('');
    setEditDialogOpen(true);
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editAgencyId) return;
    if (!editForm.name.trim()) {
      setEditError('Le nom est obligatoire');
      return;
    }
    if (!editForm.slug.trim()) {
      setEditError('Le slug est obligatoire');
      return;
    }
    // Validate new password if provided
    if (editForm.newPassword) {
      if (editForm.newPassword.length < 8) {
        setEditError('Le mot de passe doit contenir au moins 8 caractères');
        return;
      }
      if (!/[A-Z]/.test(editForm.newPassword)) {
        setEditError('Le mot de passe doit contenir au moins une majuscule');
        return;
      }
      if (!/\d/.test(editForm.newPassword)) {
        setEditError('Le mot de passe doit contenir au moins un chiffre');
        return;
      }
      if (editForm.newPassword !== editForm.confirmPassword) {
        setEditError('Les mots de passe ne correspondent pas');
        return;
      }
    }

    setEditSaving(true);
    setEditError('');
    setEditSuccess('');

    try {
      // Update agency info
      const response = await fetch('/api/admin/agencies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editAgencyId,
          name: editForm.name,
          slug: editForm.slug,
          email: editForm.email,
          phone: editForm.phone,
          active: editForm.active,
        }),
      });

      if (response.ok) {
        // Update password if a new one was provided
        if (editForm.newPassword) {
          try {
            // Find the agency user to get their user ID
            const usersRes = await fetch('/api/admin/users');
            if (usersRes.ok) {
              const usersData = await usersRes.json();
              const agencyUser = (usersData.users || []).find(
                (u: { agencyId: string | null; role: string }) => u.agencyId === editAgencyId && u.role === 'agency'
              );
              if (agencyUser) {
                await fetch('/api/admin/users', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: agencyUser.id,
                    password: editForm.newPassword,
                  }),
                });
              }
            }
          } catch (pwdErr) {
            console.error('Error updating password:', pwdErr);
          }
        }

        setEditSuccess('Agence modifiée avec succès !');
        fetchAgencies();
        setTimeout(() => {
          setEditDialogOpen(false);
          setEditSuccess('');
        }, 1500);
      } else {
        const data = await response.json();
        setEditError(data.error || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Error updating agency:', error);
      setEditError('Erreur lors de la modification');
    } finally {
      setEditSaving(false);
    }
  };

  // Toggle agency active status
  const handleToggleActive = async (agency: Agency) => {
    try {
      const response = await fetch('/api/admin/agencies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: agency.id,
          name: agency.name,
          slug: agency.slug,
          email: agency.email || '',
          phone: agency.phone || '',
          active: !agency.active,
        }),
      });

      if (response.ok) {
        setSuccessMessage(`Agence ${!agency.active ? 'activée' : 'désactivée'} avec succès`);
        fetchAgencies();
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error toggling agency status:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Agences Partenaires</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez les agences de voyage partenaires</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => fetchAgencies(true)}
            variant="outline"
            className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle agence
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">
              <DialogHeader>
                <DialogTitle>Créer une agence</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {errorMessage && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                    {errorMessage}
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Nom de l&apos;agence *</Label>
                  <Input
                    placeholder="Ashraf Voyages"
                    value={agencyForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setAgencyForm({
                        ...agencyForm,
                        name,
                        slug: name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
                      });
                    }}
                    className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Slug *</Label>
                  <Input
                    placeholder="ashraf_voyages"
                    value={agencyForm.slug}
                    onChange={(e) => setAgencyForm({ ...agencyForm, slug: e.target.value })}
                    className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Email *</Label>
                    <Input
                      type="email"
                      placeholder="contact@agence.com"
                      value={agencyForm.email}
                      onChange={(e) => setAgencyForm({ ...agencyForm, email: e.target.value })}
                      className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Téléphone</Label>
                    <Input
                      placeholder="+33 6 00 00 00 00"
                      value={agencyForm.phone}
                      onChange={(e) => setAgencyForm({ ...agencyForm, phone: e.target.value })}
                      className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* QRTags : Sélecteur de type d'agence (multi-métiers) */}
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Type d&apos;activité *</Label>
                  <select
                    value={agencyForm.agencyType}
                    onChange={(e) => setAgencyForm({ ...agencyForm, agencyType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white"
                  >
                    <option value="hotel">🏨 Hôtel — Champs : nom client, N° chambre, dates séjour</option>
                    <option value="school">🎓 École — Champs : nom élève, classe, parent</option>
                    <option value="luggage_locker">🛅 Consigne — Champs : N° casier, description bagage</option>
                    <option value="car_rental">🚗 Loueur auto — Champs : N° contrat, modèle, immatriculation</option>
                    <option value="medical">🏥 Clinique — Champs : nom patient, N° dossier, chambre</option>
                    <option value="generic">📦 Autre / Générique</option>
                  </select>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Détermine les champs dynamiques affichés lors de l&apos;activation d&apos;un tag par le client final.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Mot de passe *</Label>
                    <Input
                      type="password"
                      placeholder="Min 8 car., 1 maj, 1 chiffre"
                      value={agencyForm.password}
                      onChange={(e) => setAgencyForm({ ...agencyForm, password: e.target.value })}
                      className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Confirmer *</Label>
                    <Input
                      type="password"
                      placeholder="Confirmer le mot de passe"
                      value={agencyForm.confirmPassword}
                      onChange={(e) => setAgencyForm({ ...agencyForm, confirmPassword: e.target.value })}
                      className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                  onClick={handleCreateAgency}
                  disabled={agencyCreating}
                >
                  {agencyCreating ? 'Création en cours...' : "Créer l'agence"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">
          <DialogHeader>
            <DialogTitle>Modifier l&apos;agence</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {editError && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                {editError}
              </div>
            )}
            {editSuccess && (
              <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {editSuccess}
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Nom de l&apos;agence *</Label>
              <Input
                placeholder="Ashraf Voyages"
                value={editForm.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setEditForm({
                    ...editForm,
                    name,
                    slug: name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
                  });
                }}
                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Slug *</Label>
              <Input
                placeholder="ashraf_voyages"
                value={editForm.slug}
                onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Email</Label>
                <Input
                  type="email"
                  placeholder="contact@agence.com"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Téléphone</Label>
                <Input
                  placeholder="+33 6 00 00 00 00"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Label className="text-slate-700 dark:text-slate-300">Statut :</Label>
              <button
                onClick={() => setEditForm({ ...editForm, active: !editForm.active })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${editForm.active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${editForm.active ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className={`text-sm font-medium ${editForm.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                {editForm.active ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Password section */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Changer le mot de passe</h4>
              </div>
              <p className="text-xs text-slate-400 mb-3">Laissez vide pour ne pas modifier le mot de passe actuel.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Nouveau mot de passe</Label>
                  <Input
                    type="password"
                    placeholder="Min 8 car., 1 maj, 1 chiffre"
                    value={editForm.newPassword}
                    onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                    className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Confirmer le mot de passe</Label>
                  <Input
                    type="password"
                    placeholder="Confirmer le nouveau mot de passe"
                    value={editForm.confirmPassword}
                    onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                    className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white"
                  />
                </div>
              </div>
              {editForm.newPassword && editForm.newPassword.length > 0 && (
                <div className="mt-3 space-y-1">
                  <div className={`flex items-center gap-1.5 text-xs ${editForm.newPassword.length >= 8 ? 'text-emerald-500' : 'text-red-400'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${editForm.newPassword.length >= 8 ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    Au moins 8 caractères
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs ${/[A-Z]/.test(editForm.newPassword) ? 'text-emerald-500' : 'text-red-400'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(editForm.newPassword) ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    Au moins une majuscule
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs ${/\d/.test(editForm.newPassword) ? 'text-emerald-500' : 'text-red-400'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${/\d/.test(editForm.newPassword) ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    Au moins un chiffre
                  </div>
                  {editForm.confirmPassword && (
                    <div className={`flex items-center gap-1.5 text-xs ${editForm.newPassword === editForm.confirmPassword ? 'text-emerald-500' : 'text-red-400'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${editForm.newPassword === editForm.confirmPassword ? 'bg-emerald-500' : 'bg-red-400'}`} />
                      Les mots de passe correspondent
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              onClick={handleSaveEdit}
              disabled={editSaving}
            >
              {editSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer les modifications'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-blue-500 px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Total agences</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{agencies.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#2563EB]/10 dark:bg-[#2563EB]/20 rounded-xl flex items-center justify-center">
                <Building className="w-6 h-6 text-[#2563EB]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Agences actives</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{agencies.filter(a => a.active).length}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-700 dark:text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agencies Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
        </div>
      ) : agencies.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">Aucune agence</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agencies.map((agency) => (
            <div key={agency.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <Building className="w-6 h-6 text-blue-700 dark:text-blue-500" />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(agency)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 ${agency.active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                    title={agency.active ? 'Désactiver' : 'Activer'}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-300 ${agency.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                  <Badge className={agency.active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-blue-500' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}>
                    {agency.active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </div>

              {/* Name + Slug + Type */}
              <h3 className="font-semibold text-slate-800 dark:text-white text-lg">{agency.name}</h3>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm text-slate-400 font-mono">@{agency.slug}</p>
                {agency.agencyType && agency.agencyType !== 'generic' && (
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                    {agency.agencyType === 'hotel' ? '🏨 Hôtel' :
                     agency.agencyType === 'school' ? '🎓 École' :
                     agency.agencyType === 'luggage_locker' ? '🛅 Consigne' :
                     agency.agencyType === 'car_rental' ? '🚗 Loueur' :
                     agency.agencyType === 'medical' ? '🏥 Clinique' :
                     agency.agencyType}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-400 mb-4">
                {agency.agencyType === 'hotel' ? 'Champs : nom client, N° chambre, dates séjour, téléphone' :
                 agency.agencyType === 'school' ? 'Champs : nom élève, classe, parent, téléphone' :
                 agency.agencyType === 'luggage_locker' ? 'Champs : N° casier, description, heure, téléphone' :
                 agency.agencyType === 'car_rental' ? 'Champs : nom locataire, N° contrat, modèle, immat.' :
                 agency.agencyType === 'medical' ? 'Champs : nom patient, N° dossier, chambre, urgence' :
                 'Champs génériques : nom, description, téléphone'}
              </p>

              {/* Contact */}
              <div className="space-y-2 mb-4">
                {agency.email && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {agency.email}
                  </div>
                )}
                {agency.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {agency.phone}
                  </div>
                )}
              </div>

              {/* Baggage count */}
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
                <Users className="w-4 h-4" />
                {agency._count?.baggages || 0} baggages · {agency._count?.users || 0} utilisateur(s)
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl flex-1"
                  onClick={() => handleOpenEdit(agency)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl flex-1"
                  onClick={() => handleDeleteAgency(agency.id)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
