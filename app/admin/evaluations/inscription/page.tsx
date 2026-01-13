"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { X, Users, Plus, Save } from "lucide-react";
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

type ModeratorRegistration = {
  id: string;
  integrationId: string;
  pseudo: string;
  role: string;
  placement: "Animateur" | "Co-animateur" | "Observateur";
  registeredAt: string;
};

export default function InscriptionPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<Record<string, IntegrationRegistration[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [selectedRegistrations, setSelectedRegistrations] = useState<IntegrationRegistration[]>([]);
  const [selectedModerators, setSelectedModerators] = useState<ModeratorRegistration[]>([]);
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

  const handleOpenModal = async (integration: Integration) => {
    setSelectedIntegration(integration);
    const registrations = allRegistrations[integration.id] || [];
    setSelectedRegistrations(registrations);
    
    // Charger les inscriptions modérateur
    try {
      const modResponse = await fetch(`/api/integrations/${integration.id}/moderators`, {
        cache: 'no-store',
      });
      if (modResponse.ok) {
        const modData = await modResponse.json();
        setSelectedModerators(modData.registrations || []);
      } else {
        setSelectedModerators([]);
      }
    } catch (error) {
      console.error('Erreur chargement modérateurs:', error);
      setSelectedModerators([]);
    }
    
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

  return (
    <div className="text-white">
      <div className="mb-8">
        <Link
          href="/admin/evaluations"
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour à l'intégration
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">Inscriptions</h1>
        <p className="text-gray-400">
          Gérer les inscriptions aux réunions d'intégration
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#9146ff]"></div>
          <p className="text-gray-400 mt-4">Chargement des inscriptions...</p>
        </div>
      ) : integrations.length === 0 ? (
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 text-center">
            Aucune réunion d'intégration publiée pour le moment.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {(() => {
            const now = new Date();
            const futureIntegrations = integrations.filter((i: Integration) => new Date(i.date) >= now);
            const pastIntegrations = integrations.filter((i: Integration) => new Date(i.date) < now);
            
            const renderTable = (integrationsList: Integration[]) => (
              <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[#0e0e10] border-b border-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Réunion</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Inscrits</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {integrationsList.map((integration) => (
                      <tr
                        key={integration.id}
                        className="hover:bg-[#252529] transition-colors cursor-pointer"
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
                            className="text-[#9146ff] hover:text-[#7c3aed] transition-colors text-sm font-medium"
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
            className="card relative max-h-[90vh] w-full max-w-4xl overflow-y-auto bg-[#1a1a1d] border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton fermer */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 z-10 rounded-lg bg-[#0e0e10] p-2 text-gray-400 transition-colors hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>

            {/* En-tête */}
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-2">{selectedIntegration.title}</h2>
              <p className="text-gray-400">
                {formatDate(selectedIntegration.date)} • {selectedRegistrations.length} inscription{selectedRegistrations.length > 1 ? 's' : ''}
              </p>
            </div>

            {/* Formulaire d'ajout manuel */}
            {showAddForm && (
              <div className="p-6 border-b border-gray-700 bg-[#0e0e10]">
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
                      className="w-full bg-[#1a1a1d] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
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
                      className="w-full bg-[#1a1a1d] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
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
                      className="w-full bg-[#1a1a1d] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
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
                      className="w-full bg-[#1a1a1d] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff] resize-none"
                      placeholder="Notes optionnelles"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setNewMember({ discordUsername: "", twitchChannelUrl: "", parrain: "", notes: "" });
                      }}
                      className="flex-1 rounded-lg bg-[#1a1a1d] border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-[#252529]"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleAddMember}
                      disabled={saving}
                      className="flex-1 rounded-lg bg-[#9146ff] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#7c3aed] disabled:opacity-50"
                    >
                      {saving ? "Ajout..." : "Ajouter"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="p-6 border-b border-gray-700 flex gap-3">
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un membre
                </button>
              )}
              {selectedRegistrations.length > 0 && (
                <button
                  onClick={handleSavePresences}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Enregistrement..." : "Enregistrer les présences"}
                </button>
              )}
            </div>

            {/* Liste des inscriptions */}
            <div className="p-6">
              {/* Admins inscrits (modérateurs) */}
              {selectedModerators.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4">Admins inscrits</h3>
                  <div className="space-y-3">
                    {selectedModerators.map((moderator) => (
                      <div
                        key={moderator.id}
                        className="bg-[#0e0e10] border border-green-500/30 rounded-lg p-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Pseudo</div>
                            <div className="font-medium text-white">{moderator.pseudo}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Rôle</div>
                            <div className="font-medium text-white">{moderator.role}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Placement</div>
                            <div className="font-medium text-green-400">{moderator.placement}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Membres normaux */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Membres inscrits</h3>
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
                      <div
                        key={registration.id}
                        className={`bg-[#0e0e10] border rounded-lg p-4 ${
                          isAbsent ? 'border-red-500/50 bg-red-950/20' : 'border-gray-700'
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
                                      className="text-[#9146ff] hover:text-[#7c3aed] underline break-all"
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
                                className="w-5 h-5 text-[#9146ff] bg-[#1a1a1d] border-gray-700 rounded focus:ring-[#9146ff]"
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
