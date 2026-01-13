"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { X, Users, UserPlus, CheckCircle2 } from "lucide-react";

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

export default function PresenceRetourPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<Record<string, IntegrationRegistration[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [presentMembers, setPresentMembers] = useState<IntegrationRegistration[]>([]);
  const [selectedModerators, setSelectedModerators] = useState<ModeratorRegistration[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [integrating, setIntegrating] = useState(false);

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
        
        // Filtrer uniquement les réunions où les présences ont été validées (au moins une présence enregistrée)
        const validatedIntegrations = integrationsList.filter((integration: Integration) => {
          const registrations = registrationsMap[integration.id] || [];
          // Une réunion est validée si au moins une présence a été enregistrée (present === true ou false)
          return registrations.some(reg => reg.present !== undefined);
        });
        
        // Trier par date (les plus proches en premier)
        validatedIntegrations.sort((a: Integration, b: Integration) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        
        setIntegrations(validatedIntegrations);
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
    // Filtrer uniquement les personnes présentes
    const presentOnly = registrations.filter(reg => reg.present === true);
    setPresentMembers(presentOnly);
    
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
    
    setIsModalOpen(true);
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

  const getPresentCount = (integrationId: string) => {
    const registrations = allRegistrations[integrationId] || [];
    return registrations.filter(reg => reg.present === true).length;
  };

  const getTotalCount = (integrationId: string) => {
    return allRegistrations[integrationId]?.length || 0;
  };

  const handleIntegrateMembers = async () => {
    if (!selectedIntegration || presentMembers.length === 0) return;

    if (!confirm(`Êtes-vous sûr de vouloir intégrer ${presentMembers.length} membre(s) au site et Discord ?`)) {
      return;
    }

    try {
      setIntegrating(true);
      const response = await fetch('/api/admin/integrations/integrate-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integrationId: selectedIntegration.id,
          members: presentMembers.map(m => ({
            id: m.id,
            discordUsername: m.displayName || m.discordUsername,
            discordId: m.discordId,
            twitchLogin: m.twitchLogin,
            twitchChannelUrl: m.twitchChannelUrl,
            parrain: m.parrain,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.message || `${data.integrated || 0} membre(s) intégré(s) avec succès !`}`);
        await loadData();
        setIsModalOpen(false);
      } else {
        const error = await response.json();
        alert(`❌ Erreur: ${error.error || 'Impossible d\'intégrer les membres'}`);
      }
    } catch (error) {
      console.error('Erreur intégration membres:', error);
      alert('❌ Erreur lors de l\'intégration');
    } finally {
      setIntegrating(false);
    }
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
        <h1 className="text-4xl font-bold text-white mb-2">Présence et retour</h1>
        <p className="text-gray-400">
          Réunions validées - Intégration des membres présents au site et Discord
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#9146ff]"></div>
          <p className="text-gray-400 mt-4">Chargement des réunions validées...</p>
        </div>
      ) : integrations.length === 0 ? (
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 text-center">
            Aucune réunion avec présences validées pour le moment.
          </p>
        </div>
      ) : (
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0e0e10] border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Réunion</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Inscrits</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Présents</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {integrations.map((integration) => {
                const presentCount = getPresentCount(integration.id);
                const totalCount = getTotalCount(integration.id);
                
                return (
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
                    <td className="px-6 py-4 text-center text-gray-300">
                      {totalCount}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-green-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-medium">{presentCount}</span>
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
                        Voir les présents
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal des membres présents */}
      {isModalOpen && selectedIntegration && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="card relative max-h-[90vh] w-full max-w-5xl overflow-y-auto bg-[#1a1a1d] border border-gray-700"
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
                {formatDate(selectedIntegration.date)} • {presentMembers.length} membre{presentMembers.length > 1 ? 's' : ''} présent{presentMembers.length > 1 ? 's' : ''}
              </p>
            </div>

            {/* Bouton d'intégration */}
            {presentMembers.length > 0 && (
              <div className="p-6 border-b border-gray-700 bg-green-950/20">
                <button
                  onClick={handleIntegrateMembers}
                  disabled={integrating}
                  className="flex items-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 px-6 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50"
                >
                  <UserPlus className="w-5 h-5" />
                  {integrating ? "Intégration..." : `Intégrer ${presentMembers.length} membre(s) au site et Discord`}
                </button>
                <p className="text-sm text-gray-400 mt-2">
                  Les membres présents seront ajoutés au site et auront accès aux channels Discord appropriés
                </p>
              </div>
            )}

            {/* Liste des membres présents */}
            <div className="p-6">
              {/* Modérateurs inscrits */}
              {selectedModerators.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4">Modérateurs inscrits</h3>
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

              {/* Membres présents */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Membres présents</h3>
                {presentMembers.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    Aucun membre présent pour cette réunion.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {presentMembers.map((member) => (
                    <div
                      key={member.id}
                      className="bg-[#0e0e10] border border-green-500/30 rounded-lg p-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Pseudo Discord</div>
                          <div className="text-white font-medium">
                            {member.displayName || member.discordUsername || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Lien de chaîne Twitch</div>
                          <div className="text-white">
                            {member.twitchChannelUrl ? (
                              <a
                                href={member.twitchChannelUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#9146ff] hover:text-[#7c3aed] underline break-all"
                              >
                                {member.twitchChannelUrl}
                              </a>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Parrain TENF</div>
                          <div className="text-white font-medium">
                            {member.parrain || <span className="text-gray-400">N/A</span>}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Pseudo Twitch</div>
                          <div className="text-white font-medium">
                            {member.twitchLogin || <span className="text-gray-400">N/A</span>}
                          </div>
                        </div>
                      </div>
                      {member.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <div className="text-xs text-gray-500 mb-1">Notes</div>
                          <div className="text-gray-300 text-sm">{member.notes}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
