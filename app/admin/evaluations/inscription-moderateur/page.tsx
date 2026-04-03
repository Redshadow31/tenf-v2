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
        return "from-violet-600 to-fuchsia-600";
      case "Intégration rapide":
        return "from-sky-500 to-blue-600";
      case "Intégration spéciale":
        return "from-emerald-500 to-teal-600";
      default:
        return "from-zinc-600 to-zinc-800";
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

  const isSameCalendarDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const goToToday = () => setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
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
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Sessions couvertes (&gt;=2)</p>
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
      <div
        className={`${sectionCardClass} relative overflow-hidden p-6 sm:p-8`}
        style={{
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.04) inset, 0 24px 64px rgba(2,6,23,0.5), 0 0 80px rgba(99,102,241,0.06)",
        }}
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-cyan-500/5 blur-3xl" />

        <div className="relative mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-200/60">Calendrier</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">Sessions & staffing</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center rounded-full border border-white/[0.08] bg-black/35 p-1 shadow-inner shadow-black/40 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
                aria-label="Mois précédent"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
                aria-label="Mois suivant"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="min-w-0 flex-1 rounded-2xl border border-white/[0.07] bg-[linear-gradient(160deg,rgba(99,102,241,0.12),rgba(15,17,28,0.92))] px-4 py-2.5 sm:min-w-[220px] sm:flex-initial">
              <p className="truncate text-center text-base font-semibold tracking-tight text-white sm:text-lg">
                {monthNames[currentMonth.getMonth()]}{" "}
                <span className="text-indigo-200/90">{currentMonth.getFullYear()}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={goToToday}
              className="rounded-full border border-indigo-400/25 bg-indigo-500/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-indigo-100/90 shadow-[0_0_24px_rgba(99,102,241,0.15)] transition hover:border-indigo-400/40 hover:bg-indigo-500/20"
            >
              Aujourd&apos;hui
            </button>
          </div>
        </div>

        <div className="relative mb-3 grid grid-cols-7 gap-1.5 sm:gap-2">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
            <div
              key={day}
              className="py-2 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 sm:text-xs sm:tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="relative grid grid-cols-7 gap-1.5 sm:gap-2">
          {calendarDays.map((date, index) => {
            const integration = getIntegrationForDate(date);
            const stats = integration ? moderatorStats[integration.id] : null;
            const regStats = integration ? registrationStats[integration.id] : null;
            const hasEnoughAdmins = stats ? stats.adminCount >= 2 : false;
            const normalCount = regStats ? regStats.normalCount : 0;
            const today = new Date();
            const isToday = date ? isSameCalendarDay(date, today) : false;

            const sessionTone = integration
              ? hasEnoughAdmins
                ? "border-emerald-500/45 bg-[linear-gradient(165deg,rgba(16,185,129,0.14),rgba(11,13,20,0.92))] shadow-[0_0_0_1px_rgba(52,211,153,0.12)] hover:border-emerald-400/55 hover:shadow-[0_12px_40px_rgba(16,185,129,0.12)]"
                : (stats?.adminCount || 0) === 1
                  ? "border-amber-500/45 bg-[linear-gradient(165deg,rgba(245,158,11,0.12),rgba(11,13,20,0.92))] shadow-[0_0_0_1px_rgba(251,191,36,0.1)] hover:border-amber-400/55 hover:shadow-[0_12px_40px_rgba(245,158,11,0.1)]"
                  : "border-rose-500/45 bg-[linear-gradient(165deg,rgba(244,63,94,0.12),rgba(11,13,20,0.92))] shadow-[0_0_0_1px_rgba(251,113,133,0.1)] hover:border-rose-400/55 hover:shadow-[0_12px_40px_rgba(244,63,94,0.1)]"
              : "";

            return (
              <div
                key={index}
                className={`min-h-[88px] rounded-xl border p-2 transition-all duration-200 sm:min-h-[104px] sm:rounded-2xl sm:p-2.5 ${
                  date
                    ? integration
                      ? `cursor-pointer ${sessionTone}`
                      : "border-white/[0.05] bg-black/25 shadow-inner shadow-black/20 hover:border-white/[0.08] hover:bg-white/[0.02]"
                    : "pointer-events-none border-transparent bg-transparent"
                } ${isToday && date ? "ring-2 ring-indigo-400/35 ring-offset-2 ring-offset-[#0b0d14]" : ""}`}
                onClick={() => integration && handleIntegrationClick(integration)}
              >
                {date && (
                  <>
                    <div
                      className={`mb-1 flex items-center justify-between gap-1 ${isToday ? "font-semibold text-indigo-200" : "text-zinc-500"}`}
                    >
                      <span className="text-xs tabular-nums sm:text-sm">{date.getDate()}</span>
                      {isToday && (
                        <span className="hidden rounded-full bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-indigo-200/90 sm:inline">
                          Now
                        </span>
                      )}
                    </div>
                    {integration && (
                      <>
                        <div
                          className={`mb-1 truncate rounded-md bg-gradient-to-r px-2 py-1 text-[10px] font-semibold leading-tight text-white shadow-md sm:text-xs ${getCategoryColor(
                            integration.category
                          )}`}
                        >
                          {integration.title}
                        </div>
                        <div className="text-[10px] text-zinc-500 sm:text-xs">
                          <span className="text-zinc-400">Inscrits</span>{" "}
                          <span className="font-medium text-zinc-300">{normalCount}</span>
                        </div>
                        {stats && (
                          <div
                            className={`mt-1 text-[10px] font-medium sm:text-xs ${hasEnoughAdmins ? "text-emerald-300/95" : "text-zinc-500"}`}
                          >
                            Staff {stats.adminCount}/2
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

