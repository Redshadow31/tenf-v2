"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { X, Users } from "lucide-react";
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
};

export default function InscriptionPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<Record<string, IntegrationRegistration[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [selectedRegistrations, setSelectedRegistrations] = useState<IntegrationRegistration[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        
        // Trier par date (les plus proches en premier)
        integrationsList.sort((a: Integration, b: Integration) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        
        setIntegrations(integrationsList);
        
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
    setSelectedRegistrations(allRegistrations[integration.id] || []);
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
              {integrations.map((integration) => (
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

            {/* Liste des inscriptions */}
            <div className="p-6">
              {selectedRegistrations.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  Aucune inscription pour le moment.
                </p>
              ) : (
                <div className="space-y-4">
                  {selectedRegistrations.map((registration) => (
                    <div
                      key={registration.id}
                      className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Pseudo Discord</div>
                          <div className="text-white font-medium">
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
                          <div className="text-white font-medium">
                            {registration.parrain || <span className="text-gray-400">N/A</span>}
                          </div>
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
