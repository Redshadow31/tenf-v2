"use client";

import React, { useState, useEffect } from "react";
import ModeratorRegistrationModal from "@/components/admin/ModeratorRegistrationModal";

type Integration = {
  id: string;
  title: string;
  description: string;
  image?: string;
  date: string; // ISO date string
  category: string;
  location?: string;
};

type ModeratorStats = {
  total: number;
  adminCount: number;
};

type RegistrationStats = {
  normalCount: number; // Nombre d'inscrits normaux (hors modérateurs)
};

export default function InscriptionModerateurPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isRegistering, setIsRegistering] = useState(false);
  const [moderatorStats, setModeratorStats] = useState<Record<string, ModeratorStats>>({});
  const [registrationStats, setRegistrationStats] = useState<Record<string, RegistrationStats>>({});

  // Charger les intégrations depuis l'API (admin=true pour toutes)
  useEffect(() => {
    async function loadIntegrations() {
      try {
        setLoading(true);
        const response = await fetch('/api/integrations?admin=true', {
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          const integrationsList = data.integrations || [];
          setIntegrations(integrationsList);
          
          // Charger les stats de modérateurs et inscriptions normales pour chaque intégration
          const stats: Record<string, ModeratorStats> = {};
          const regStats: Record<string, RegistrationStats> = {};
          await Promise.all(
            integrationsList.map(async (integration: Integration) => {
              try {
                // Charger les modérateurs
                const modResponse = await fetch(`/api/integrations/${integration.id}/moderators`, {
                  cache: 'no-store',
                });
                if (modResponse.ok) {
                  const modData = await modResponse.json();
                  const registrations = modData.registrations || [];
                  const adminCount = registrations.filter((r: any) => 
                    r.role && r.role.toLowerCase().includes('admin')
                  ).length;
                  stats[integration.id] = {
                    total: registrations.length,
                    adminCount,
                  };
                } else {
                  stats[integration.id] = { total: 0, adminCount: 0 };
                }
                
                // Charger les inscriptions normales
                const regResponse = await fetch(`/api/admin/integrations/${integration.id}/registrations`, {
                  cache: 'no-store',
                });
                if (regResponse.ok) {
                  const regData = await regResponse.json();
                  const normalRegistrations = regData.registrations || [];
                  regStats[integration.id] = {
                    normalCount: normalRegistrations.length,
                  };
                } else {
                  regStats[integration.id] = { normalCount: 0 };
                }
              } catch (error) {
                console.error(`Erreur chargement données pour ${integration.id}:`, error);
                stats[integration.id] = { total: 0, adminCount: 0 };
                regStats[integration.id] = { normalCount: 0 };
              }
            })
          );
          setModeratorStats(stats);
          setRegistrationStats(regStats);
        }
      } catch (error) {
        console.error('Erreur chargement intégrations:', error);
      } finally {
        setLoading(false);
      }
    }
    loadIntegrations();
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Intégration standard":
        return "bg-[#9146ff]";
      case "Intégration rapide":
        return "bg-blue-500";
      case "Intégration spéciale":
        return "bg-green-500";
      default:
        return "bg-gray-700";
    }
  };

  const handleIntegrationClick = (integration: Integration) => {
    setSelectedIntegration(integration);
    setIsModalOpen(true);
  };

  const handleRegister = async (formData: {
    pseudo: string;
    role: string;
    placement: "Animateur" | "Co-animateur" | "Observateur";
  }) => {
    if (!selectedIntegration) return;
    
    try {
      setIsRegistering(true);
      const response = await fetch(`/api/integrations/${selectedIntegration.id}/moderators/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.message || 'Inscription réussie !'}`);
        setIsModalOpen(false);
        
        // Recharger les stats de modérateurs pour cette intégration
        try {
          const modResponse = await fetch(`/api/integrations/${selectedIntegration.id}/moderators`, {
            cache: 'no-store',
          });
          if (modResponse.ok) {
            const modData = await modResponse.json();
            const registrations = modData.registrations || [];
            const adminCount = registrations.filter((r: any) => 
              r.role && r.role.toLowerCase().includes('admin')
            ).length;
            setModeratorStats(prev => ({
              ...prev,
              [selectedIntegration.id]: {
                total: registrations.length,
                adminCount,
              },
            }));
          }
        } catch (error) {
          console.error('Erreur rechargement stats:', error);
        }
      } else {
        const error = await response.json();
        if (response.status === 409) {
          alert(`ℹ️ ${error.error || 'Vous êtes déjà inscrit à cette intégration'}`);
        } else {
          alert(`❌ ${error.error || 'Erreur lors de l\'inscription'}`);
        }
      }
    } catch (error) {
      console.error('Erreur inscription:', error);
      alert('❌ Erreur lors de l\'inscription');
    } finally {
      setIsRegistering(false);
    }
  };

  // Fonction pour générer le calendrier
  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Lundi = 0

    const days: (Date | null)[] = [];
    
    // Ajouter les jours vides du début
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Ajouter les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getIntegrationForDate = (date: Date | null) => {
    if (!date) return null;
    return integrations.find((integration) => {
      const integrationDate = new Date(integration.date);
      return (
        integrationDate.getDate() === date.getDate() &&
        integrationDate.getMonth() === date.getMonth() &&
        integrationDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Mettre à jour le mois actuel en fonction des intégrations
  useEffect(() => {
    if (integrations.length > 0) {
      const firstIntegrationDate = new Date(integrations[0].date);
      setCurrentMonth(new Date(firstIntegrationDate.getFullYear(), firstIntegrationDate.getMonth(), 1));
    }
  }, [integrations]);

  const calendarDays = generateCalendar();
  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  return (
    <div className="space-y-8">
      {/* Titre */}
      <h1 className="text-3xl font-bold text-white">Inscription modérateur</h1>

      {/* Calendrier */}
      <div className="card bg-[#1a1a1d] border border-gray-700 p-6">
        {/* En-tête du calendrier */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="rounded-lg bg-[#0e0e10] p-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="rounded-lg bg-[#0e0e10] p-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <span className="text-lg font-semibold text-white">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
          </div>
        </div>

        {/* Jours de la semaine */}
        <div className="mb-4 grid grid-cols-7 gap-2">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((date, index) => {
            const integration = getIntegrationForDate(date);
            const stats = integration ? moderatorStats[integration.id] : null;
            const regStats = integration ? registrationStats[integration.id] : null;
            const hasEnoughAdmins = stats ? stats.adminCount >= 2 : false;
            const moderatorCount = stats ? stats.total : 0;
            const normalCount = regStats ? regStats.normalCount : 0;
            
            return (
              <div
                key={index}
                className={`min-h-[80px] rounded-lg border p-2 transition-colors ${
                  date
                    ? integration
                      ? hasEnoughAdmins
                        ? "cursor-pointer border-green-500 bg-[#0e0e10] hover:bg-[#1a1a1d]"
                        : "cursor-pointer border-gray-600 bg-[#0e0e10] hover:bg-[#1a1a1d]"
                      : "border-gray-800 bg-[#0e0e10]"
                    : "border-transparent"
                }`}
                onClick={() => integration && handleIntegrationClick(integration)}
              >
                {date && (
                  <>
                    <div className="mb-1 text-sm text-gray-400">{date.getDate()}</div>
                    {integration && (
                      <>
                        <div
                          className={`rounded px-2 py-1 text-xs font-bold text-white mb-1 ${getCategoryColor(
                            integration.category
                          )}`}
                        >
                          {integration.title}
                        </div>
                        {/* Badge nombre d'inscrits normaux */}
                        <div className="text-xs text-gray-400">
                          Inscrits: {normalCount}
                        </div>
                        {/* Badge admins */}
                        {stats && (
                          <div className={`text-xs mt-1 ${hasEnoughAdmins ? 'text-green-400 font-semibold' : 'text-gray-400'}`}>
                            Admins: {stats.adminCount}/2
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal inscription modérateur */}
      {selectedIntegration && (
        <ModeratorRegistrationModal
          integration={{
            ...selectedIntegration,
            date: new Date(selectedIntegration.date),
          }}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedIntegration(null);
          }}
          onRegister={handleRegister}
          isLoading={isRegistering}
        />
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#9146ff]"></div>
          <p className="text-gray-400 mt-4">Chargement des intégrations...</p>
        </div>
      )}

      {!loading && integrations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">Aucune intégration disponible pour le moment.</p>
        </div>
      )}
    </div>
  );
}

