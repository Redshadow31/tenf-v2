"use client";

import React, { useState, useEffect, useMemo } from "react";
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

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";

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
  const staffingStats = useMemo(() => {
    const sessionCount = integrations.length;
    let covered = 0;
    let atRisk = 0;
    let totalAdmins = 0;

    integrations.forEach((integration) => {
      const stats = moderatorStats[integration.id];
      const adminCount = stats?.adminCount || 0;
      totalAdmins += adminCount;
      if (adminCount >= 2) covered += 1;
      else atRisk += 1;
    });

    const avgAdminsPerSession = sessionCount > 0 ? Math.round((totalAdmins / sessionCount) * 10) / 10 : 0;
    return { sessionCount, covered, atRisk, totalAdmins, avgAdminsPerSession };
  }, [integrations, moderatorStats]);

  return (
    <div className="space-y-6 p-8 text-white">
      <section className={`${glassCardClass} p-6`}>
        <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Onboarding · Staff sessions</p>
        <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
          Planification staff onboarding
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          Cette page sert à planifier et sécuriser la couverture staff sur chaque session d'intégration.
          Le staffing est considéré conforme uniquement si la session a au moins 2 modérateurs.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Sessions publiées</p>
          <p className="mt-2 text-3xl font-semibold text-indigo-200">{staffingStats.sessionCount}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Sessions couvertes (>=2)</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-300">{staffingStats.covered}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Sessions à risque (&lt;2)</p>
          <p className="mt-2 text-3xl font-semibold text-rose-300">{staffingStats.atRisk}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Moyenne admins/session</p>
          <p className="mt-2 text-3xl font-semibold text-sky-300">{staffingStats.avgAdminsPerSession}</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Règles de staffing</h2>
          <div className="mt-3 space-y-2 text-sm">
            <p className="rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-3 py-2 text-emerald-100">
              Règle minimale: 2 modérateurs par session (objectif non négociable).
            </p>
            <p className="rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2 text-slate-200">
              Inclure au moins un profil admin/lead pour les sessions sensibles.
            </p>
            <p className="rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2 text-slate-200">
              Prioriser les sessions avec fort volume d'inscrits quand la couverture est incomplète.
            </p>
          </div>
        </article>
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Légende calendrier</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-3 py-2 text-emerald-100">
              Vert: session conforme (2 admins ou plus)
            </div>
            <div className="rounded-lg border border-amber-400/35 bg-amber-500/15 px-3 py-2 text-amber-100">
              Jaune: session partiellement staffée (1 admin)
            </div>
            <div className="rounded-lg border border-rose-400/35 bg-rose-500/15 px-3 py-2 text-rose-100">
              Rouge: session critique (0 admin)
            </div>
          </div>
        </article>
      </section>

      {/* Calendrier */}
      <div className={`${sectionCardClass} p-6`}>
        {/* En-tête du calendrier */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="rounded-lg bg-[#0f1321] border border-[#353a50] p-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="rounded-lg bg-[#0f1321] border border-[#353a50] p-2 text-gray-400 hover:text-white transition-colors"
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
                        ? "cursor-pointer border-green-500/60 bg-[#0f1321] hover:bg-[#182133]"
                        : (stats?.adminCount || 0) === 1
                        ? "cursor-pointer border-amber-500/60 bg-[#0f1321] hover:bg-[#182133]"
                        : "cursor-pointer border-rose-500/60 bg-[#0f1321] hover:bg-[#182133]"
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
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-300"></div>
          <p className="text-gray-400 mt-4">Chargement des intégrations...</p>
        </div>
      )}

      {!loading && integrations.length === 0 && (
        <div className={`${sectionCardClass} text-center py-12`}>
          <p className="text-gray-400">Aucune intégration disponible pour le moment.</p>
        </div>
      )}
    </div>
  );
}

