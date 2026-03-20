"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { X, Users, Plus, Save } from "lucide-react";

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";
type Integration = {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  isPublished: boolean;
};

type IntegrationRegistration = {
  id: string;
  integrationId: string;
  twitchLogin: string;
  twitchChannelUrl: string;
  displayName: string;
  discordId?: string;
  discordUsername?: string;
  parrain?: string;
  registeredAt: string;
  notes?: string;
  present?: boolean;
};

export default function InscriptionPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<Record<string, IntegrationRegistration[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [selectedRegistrations, setSelectedRegistrations] = useState<IntegrationRegistration[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newMember, setNewMember] = useState({
    discordUsername: "",
    twitchChannelUrl: "",
    parrain: "",
    notes: "",
  });
  const [presences, setPresences] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger toutes les intégrations
      const response = await fetch("/api/integrations?admin=true", {
        cache: 'no-store',
      });
      
      if (response.ok) {
        const data = await response.json();
        const integrationsList = (data.integrations || []).filter((i: Integration) => i.isPublished);
        
        // Séparer les intégrations futures et passées
        const now = new Date();
        const futureIntegrations = integrationsList.filter((i: Integration) => new Date(i.date) >= now);
        const pastIntegrations = integrationsList.filter((i: Integration) => new Date(i.date) < now);
        
        // Trier les futures par date (les plus proches en premier)
        futureIntegrations.sort((a: Integration, b: Integration) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        
        // Trier les passées par date (les plus récentes en premier)
        pastIntegrations.sort((a: Integration, b: Integration) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        
        // Stocker les deux listes séparément dans le state
        setIntegrations([...futureIntegrations, ...pastIntegrations]);
        
        // Charger les inscriptions pour chaque intégration
        const registrationsMap: Record<string, IntegrationRegistration[]> = {};
        for (const integration of integrationsList) {
          const regResponse = await fetch(`/api/admin/integrations/${integration.id}/registrations`, {
            cache: 'no-store',
          });
          if (regResponse.ok) {
            const regData = await regResponse.json();
            registrationsMap[integration.id] = regData.registrations || [];
          }
        }
        setAllRegistrations(registrationsMap);
      }
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (integration: Integration) => {
    setSelectedIntegration(integration);
    const registrations = allRegistrations[integration.id] || [];
    setSelectedRegistrations(registrations);
    
    // Initialiser les présences depuis les données existantes
    const presencesMap: Record<string, boolean> = {};
    registrations.forEach(reg => {
      if (reg.present !== undefined) {
        presencesMap[reg.id] = reg.present;
      }
    });
    setPresences(presencesMap);
    
    setIsModalOpen(true);
    setShowAddForm(false);
  };

  const handlePresenceChange = (registrationId: string, present: boolean) => {
    setPresences(prev => ({
      ...prev,
      [registrationId]: present,
    }));
  };

  const handleAddMember = async () => {
    if (!selectedIntegration) return;
    
    if (!newMember.discordUsername || !newMember.twitchChannelUrl || !newMember.parrain) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/integrations/${selectedIntegration.id}/registrations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newMember }),
      });

      if (response.ok) {
        const data = await response.json();
        alert("✅ Membre ajouté avec succès !");
        setNewMember({ discordUsername: "", twitchChannelUrl: "", parrain: "", notes: "" });
        setShowAddForm(false);
        // Recharger les données
        await loadData();
        // Réouvrir le modal avec les nouvelles données
        if (selectedIntegration) {
          const regResponse = await fetch(`/api/admin/integrations/${selectedIntegration.id}/registrations`, {
            cache: 'no-store',
          });
          if (regResponse.ok) {
            const regData = await regResponse.json();
            const updatedRegistrations = regData.registrations || [];
            setSelectedRegistrations(updatedRegistrations);
            
            // Initialiser les présences (nouveau membre est présent par défaut)
            const updatedPresences: Record<string, boolean> = { ...presences };
            updatedRegistrations.forEach((reg: IntegrationRegistration) => {
              if (reg.present !== undefined) {
                updatedPresences[reg.id] = reg.present;
              } else if (data.registration && reg.id === data.registration.id) {
                // Nouveau membre ajouté = présent par défaut
                updatedPresences[reg.id] = true;
              }
            });
            setPresences(updatedPresences);
          }
        }
      } else {
        const error = await response.json();
        alert(`❌ Erreur: ${error.error || 'Impossible d\'ajouter le membre'}`);
      }
    } catch (error) {
      console.error('Erreur ajout membre:', error);
      alert('❌ Erreur lors de l\'ajout du membre');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePresences = async () => {
    if (!selectedIntegration) return;

    try {
      setSaving(true);
      // Inclure toutes les inscriptions : celles cochées = présent, celles non cochées = absent
      const presencesArray = selectedRegistrations.map(reg => ({
        registrationId: reg.id,
        present: presences[reg.id] === true, // true si explicitement coché, false sinon
      }));

      const response = await fetch(`/api/admin/integrations/${selectedIntegration.id}/registrations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presences: presencesArray }),
      });

      if (response.ok) {
        alert("✅ Présences enregistrées avec succès !");
        // Recharger les données
        await loadData();
        // Réouvrir le modal avec les nouvelles données
        if (selectedIntegration) {
          handleOpenModal(selectedIntegration);
        }
      } else {
        const error = await response.json();
        alert(`❌ Erreur: ${error.error || 'Impossible d\'enregistrer les présences'}`);
      }
    } catch (error) {
      console.error('Erreur sauvegarde présences:', error);
      alert('❌ Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRegistrationCount = (integrationId: string) => {
    return allRegistrations[integrationId]?.length || 0;
  };

  const now = new Date();
  const futureIntegrations = useMemo(
    () => integrations.filter((i) => new Date(i.date) >= now),
    [integrations]
  );
  const pastIntegrations = useMemo(
    () => integrations.filter((i) => new Date(i.date) < now),
    [integrations]
  );
  const stats = useMemo(() => {
    const totalSessions = integrations.length;
    const totalRegistrations = Object.values(allRegistrations).reduce((sum, regs) => sum + regs.length, 0);
    const upcomingSessions = futureIntegrations.length;
    const presentCount = Object.values(allRegistrations)
      .flat()
      .filter((reg) => reg.present === true).length;
    const absentCount = Object.values(allRegistrations)
      .flat()
      .filter((reg) => reg.present === false).length;
    const undefinedPresence = Math.max(0, totalRegistrations - presentCount - absentCount);
    const futureRegistrations = futureIntegrations.reduce((sum, integration) => sum + (allRegistrations[integration.id]?.length || 0), 0);
    const pastRegistrations = totalRegistrations - futureRegistrations;
    const attendanceRate = presentCount + absentCount > 0
      ? Math.round((presentCount / (presentCount + absentCount)) * 100)
      : 0;
    const lowEnrollmentFutureSessions = futureIntegrations.filter(
      (integration) => (allRegistrations[integration.id]?.length || 0) < 3
    ).length;
    return {
      totalSessions,
      totalRegistrations,
      upcomingSessions,
      absentCount,
      presentCount,
      undefinedPresence,
      futureRegistrations,
      pastRegistrations,
      attendanceRate,
      lowEnrollmentFutureSessions,
    };
  }, [integrations, allRegistrations, futureIntegrations.length]);

  return (
    <div className="space-y-6 p-8 text-white">
      <section className={`${glassCardClass} p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <Link
              href="/admin/onboarding"
              className="mb-3 inline-block text-sm text-slate-300 transition hover:text-white"
            >
              ← Retour à l'onboarding
            </Link>
            <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Onboarding · Inscriptions</p>
            <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
              Pilotage des inscriptions aux sessions
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Suis les inscrits, mets à jour les présences et ajoute des membres manuellement pour fiabiliser le suivi onboarding.
            </p>
          </div>
          <button type="button" onClick={() => void loadData()} className={subtleButtonClass}>
            <Save className="h-4 w-4" />
            Rafraîchir
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Sessions publiées</p>
          <p className="mt-2 text-3xl font-semibold text-indigo-200">{stats.totalSessions}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Sessions à venir</p>
          <p className="mt-2 text-3xl font-semibold text-sky-300">{stats.upcomingSessions}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Inscriptions totales</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-300">{stats.totalRegistrations}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Absences marquées</p>
          <p className="mt-2 text-3xl font-semibold text-rose-300">{stats.absentCount}</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Qualité de suivi des présences</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <div className="mb-1 flex items-center justify-between text-slate-300">
                <span>Présents</span>
                <span className="font-semibold text-emerald-200">{stats.presentCount}</span>
              </div>
              <div className="h-2 rounded-full bg-[#1f2434]">
                <div
                  className="h-2 rounded-full bg-emerald-400"
                  style={{
                    width: `${stats.totalRegistrations > 0 ? Math.round((stats.presentCount / stats.totalRegistrations) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-slate-300">
                <span>Absents</span>
                <span className="font-semibold text-rose-200">{stats.absentCount}</span>
              </div>
              <div className="h-2 rounded-full bg-[#1f2434]">
                <div
                  className="h-2 rounded-full bg-rose-400"
                  style={{
                    width: `${stats.totalRegistrations > 0 ? Math.round((stats.absentCount / stats.totalRegistrations) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-slate-300">
                <span>Non renseignés</span>
                <span className="font-semibold text-amber-200">{stats.undefinedPresence}</span>
              </div>
              <div className="h-2 rounded-full bg-[#1f2434]">
                <div
                  className="h-2 rounded-full bg-amber-400"
                  style={{
                    width: `${stats.totalRegistrations > 0 ? Math.round((stats.undefinedPresence / stats.totalRegistrations) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </article>

        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Lecture rapide onboarding</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2">
              <span className="text-slate-200">Inscriptions futures</span>
              <span className="font-semibold text-sky-200">{stats.futureRegistrations}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2">
              <span className="text-slate-200">Inscriptions sessions passées</span>
              <span className="font-semibold text-indigo-200">{stats.pastRegistrations}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2">
              <span className="text-slate-200">Taux présence consolidé</span>
              <span className="font-semibold text-emerald-200">{stats.attendanceRate}%</span>
            </div>
            <div className="rounded-lg border border-amber-400/35 bg-amber-500/15 px-3 py-2 text-amber-100">
              Sessions à venir avec faible volume (&lt;3 inscrits): <span className="font-semibold">{stats.lowEnrollmentFutureSessions}</span>
            </div>
          </div>
        </article>
      </section>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#9146ff]"></div>
          <p className="text-gray-400 mt-4">Chargement des inscriptions...</p>
        </div>
      ) : integrations.length === 0 ? (
        <div className={`${sectionCardClass} p-6`}>
          <p className="text-gray-400 text-center">
            Aucune réunion d'intégration publiée pour le moment.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {(() => {
            const renderTable = (integrationsList: Integration[]) => (
              <div className={`${sectionCardClass} overflow-hidden`}>
                <table className="w-full">
                  <thead className="bg-[#0f1321] border-b border-[#353a50]">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Réunion</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Inscrits</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2f3448]">
                    {integrationsList.map((integration) => (
                      <tr
                        key={integration.id}
                        className="hover:bg-[#1a2132] transition-colors cursor-pointer"
                        onClick={() => handleOpenModal(integration)}
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{integration.title}</div>
                          {integration.category && (
                            <div className="text-sm text-gray-400 mt-1">{integration.category}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {formatDate(integration.date)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2 text-gray-300">
                            <Users className="w-4 h-4" />
                            <span className="font-medium">{getRegistrationCount(integration.id)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenModal(integration);
                            }}
                                  className="rounded-lg border border-indigo-300/35 bg-indigo-500/20 px-3 py-1.5 text-indigo-100 transition hover:bg-indigo-500/30 text-sm font-medium"
                          >
                            Voir les détails
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
            
            return (
              <>
                {futureIntegrations.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Réunions à venir</h2>
                    {renderTable(futureIntegrations)}
                  </div>
                )}
                
                {pastIntegrations.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Réunions passées</h2>
                    <div className="opacity-75">
                      {renderTable(pastIntegrations)}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Modal des détails d'inscription */}
      {isModalOpen && selectedIntegration && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="card relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[#353a50] bg-[#141927]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton fermer */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 z-10 rounded-lg border border-[#353a50] bg-[#0f1321] p-2 text-gray-400 transition-colors hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>

            {/* En-tête */}
              <div className="p-6 border-b border-[#353a50]">
              <h2 className="text-2xl font-bold text-white mb-2">{selectedIntegration.title}</h2>
              <p className="text-gray-400">
                {formatDate(selectedIntegration.date)} • {selectedRegistrations.length} inscription{selectedRegistrations.length > 1 ? 's' : ''}
              </p>
            </div>

            {/* Formulaire d'ajout manuel */}
            {showAddForm && (
              <div className="p-6 border-b border-[#353a50] bg-[#0f1321]">
                <h3 className="text-lg font-semibold text-white mb-4">Ajouter un membre manuellement</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Pseudo Discord *
                    </label>
                    <input
                      type="text"
                      value={newMember.discordUsername}
                      onChange={(e) => setNewMember({ ...newMember, discordUsername: e.target.value })}
                      className="w-full rounded-lg border border-[#353a50] bg-[#121623]/85 px-4 py-2 text-white focus:outline-none focus:border-indigo-300/55"
                      placeholder="Pseudo Discord"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Lien de chaîne Twitch *
                    </label>
                    <input
                      type="text"
                      value={newMember.twitchChannelUrl}
                      onChange={(e) => setNewMember({ ...newMember, twitchChannelUrl: e.target.value })}
                      className="w-full rounded-lg border border-[#353a50] bg-[#121623]/85 px-4 py-2 text-white focus:outline-none focus:border-indigo-300/55"
                      placeholder="https://www.twitch.tv/pseudo ou pseudo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Parrain TENF *
                    </label>
                    <input
                      type="text"
                      value={newMember.parrain}
                      onChange={(e) => setNewMember({ ...newMember, parrain: e.target.value })}
                      className="w-full rounded-lg border border-[#353a50] bg-[#121623]/85 px-4 py-2 text-white focus:outline-none focus:border-indigo-300/55"
                      placeholder="Pseudo Discord du parrain"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Notes (optionnel)
                    </label>
                    <textarea
                      value={newMember.notes}
                      onChange={(e) => setNewMember({ ...newMember, notes: e.target.value })}
                      rows={2}
                      className="w-full rounded-lg border border-[#353a50] bg-[#121623]/85 px-4 py-2 text-white focus:outline-none focus:border-indigo-300/55 resize-none"
                      placeholder="Notes optionnelles"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setNewMember({ discordUsername: "", twitchChannelUrl: "", parrain: "", notes: "" });
                      }}
                      className="flex-1 rounded-lg border border-slate-300/30 bg-slate-500/15 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-500/25"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleAddMember}
                      disabled={saving}
                      className="flex-1 rounded-lg border border-emerald-300/35 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30 disabled:opacity-50"
                    >
                      {saving ? "Ajout..." : "Ajouter"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="p-6 border-b border-[#353a50] flex gap-3">
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 rounded-lg border border-sky-300/35 bg-sky-500/20 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-500/30"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un membre
                </button>
              )}
              {selectedRegistrations.length > 0 && (
                <button
                  onClick={handleSavePresences}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg border border-emerald-300/35 bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/30 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Enregistrement..." : "Enregistrer les présences"}
                </button>
              )}
            </div>

            {/* Liste des inscriptions */}
            <div className="p-6">
              {selectedRegistrations.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  Aucune inscription pour le moment.
                </p>
              ) : (
                <div className="space-y-4">
                  {selectedRegistrations.map((registration) => {
                    const isPresent = presences[registration.id] ?? registration.present;
                    const isAbsent = isPresent === false;
                    
                    return (
                      <div key={registration.id} className={`border rounded-lg p-4 ${
                          isAbsent ? 'border-red-500/50 bg-red-950/20' : 'border-[#353a50] bg-[#0f1321]'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Pseudo Discord</div>
                                <div className={`font-medium ${isAbsent ? 'text-red-400' : 'text-white'}`}>
                                  {registration.displayName || registration.discordUsername || 'N/A'}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Lien de chaîne Twitch</div>
                                <div className="text-white">
                                  {registration.twitchChannelUrl ? (
                                    <a
                                      href={registration.twitchChannelUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-indigo-300 hover:text-indigo-200 underline break-all"
                                    >
                                      {registration.twitchChannelUrl}
                                    </a>
                                  ) : (
                                    <span className="text-gray-400">N/A</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Parrain TENF</div>
                                <div className={`font-medium ${isAbsent ? 'text-red-400' : 'text-white'}`}>
                                  {registration.parrain || <span className="text-gray-400">N/A</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="ml-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isPresent === true}
                                onChange={(e) => handlePresenceChange(registration.id, e.target.checked)}
                                className="w-5 h-5 text-indigo-300 bg-[#121623]/85 border-[#353a50] rounded focus:ring-indigo-300/50"
                              />
                              <span className={`text-sm font-medium ${isAbsent ? 'text-red-400' : 'text-gray-300'}`}>
                                {isAbsent ? 'Absent' : isPresent ? 'Présent' : 'Non défini'}
                              </span>
                            </label>
                          </div>
                        </div>
                        {registration.notes && (
                          <div className="mt-3 pt-3 border-t border-gray-700">
                            <div className="text-xs text-gray-500 mb-1">Notes</div>
                            <div className="text-gray-300 text-sm">{registration.notes}</div>
                          </div>
                        )}
                        <div className="mt-2 text-xs text-gray-500">
                          Inscrit le {new Date(registration.registeredAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
