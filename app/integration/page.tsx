"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import IntegrationModal from "@/components/IntegrationModal";
import IntegrationWelcomeNote from "@/components/IntegrationWelcomeNote";

type Integration = {
  id: string;
  title: string;
  description: string;
  image?: string;
  date: string; // ISO date string
  category: string;
  location?: string; // DÉPRÉCIÉ: pour compatibilité
  locationName?: string;
  locationUrl?: string;
};

export default function Page() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isRegistering, setIsRegistering] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isDiscordConnected, setIsDiscordConnected] = useState(false);

  // Charger les intégrations depuis l'API
  useEffect(() => {
    async function loadIntegrations() {
      try {
        setLoading(true);
        // TODO: Créer l'API /api/integrations
        const response = await fetch('/api/integrations', {
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          setIntegrations(data.integrations || []);
        }
      } catch (error) {
        console.error('Erreur chargement intégrations:', error);
      } finally {
        setLoading(false);
      }
    }
    loadIntegrations();
  }, []);

  // Vérifier l'authentification Discord (NextAuth)
  useEffect(() => {
    async function checkDiscordAuth() {
      try {
        // 1) Vérification NextAuth
        const response = await fetch('/api/auth/session', { cache: 'no-store' });
        if (response.ok) {
          const session = await response.json();
          if (session?.user?.discordId) {
            setIsDiscordConnected(true);
            return;
          }
        }

        setIsDiscordConnected(false);
      } catch (error) {
        console.error('Erreur vérification session:', error);
        setIsDiscordConnected(false);
      } finally {
        setAuthChecked(true);
      }
    }
    checkDiscordAuth();
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

  const handleRegister = async (formData?: {
    discordUsername: string;
    twitchChannelUrl: string;
    parrain: string;
    notes?: string;
  }) => {
    if (!selectedIntegration) return;
    
    try {
      setIsRegistering(true);
      const response = await fetch(`/api/integrations/${selectedIntegration.id}/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData || {}),
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.message || 'Inscription réussie !'}`);
        setIsModalOpen(false);
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

  // Rester sur le mois en cours à l'arrivée sur la page (ne pas basculer sur le mois du premier/dernier événement)
  const calendarDays = generateCalendar();
  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  return (
    <div className="relative space-y-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(145,70,255,0.22) 0%, rgba(145,70,255,0) 72%)" }}
      />
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-gray-700 bg-[#1a1a1d] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(145,70,255,0.28) 0%, rgba(145,70,255,0) 75%)" }}
        />
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9146ff]">Rejoindre TENF</p>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Choisir une reunion d integration</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-300 sm:text-base">
          Choisis une date dans le calendrier pour afficher les details et reserver ton creneau.
          Cette reunion est la derniere etape avant ton integration officielle.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/rejoindre/guide-integration"
            className="inline-flex rounded-lg border border-gray-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-[#9146ff]/60"
          >
            Comprendre le fonctionnement
          </Link>
          <span className="inline-flex items-center rounded-full border border-gray-700 px-3 py-1 text-xs text-gray-300">
            Ouvre une date pour voir les details et t inscrire
          </span>
        </div>
      </section>

      {/* Encart rassurant */}
      <IntegrationWelcomeNote />

      {/* Etapes rapides */}
      <section className="grid gap-3 sm:grid-cols-3">
        <article className="group relative overflow-hidden rounded-xl border border-gray-700 bg-gradient-to-b from-[#1b1b20] to-[#131318] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#9146ff]/55">
          <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#9146ff]/20 text-sm font-bold text-[#d7c6ff]">
            1
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#b794ff]">Choix du creneau</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-300">Choisis un creneau disponible dans le calendrier.</p>
        </article>

        <article className="group relative overflow-hidden rounded-xl border border-gray-700 bg-gradient-to-b from-[#1b1b20] to-[#131318] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#9146ff]/55">
          <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#9146ff]/20 text-sm font-bold text-[#d7c6ff]">
            2
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#b794ff]">Verification</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-300">Ouvre la fiche et verifie les informations de la session.</p>
        </article>

        <article className="group relative overflow-hidden rounded-xl border border-gray-700 bg-gradient-to-b from-[#1b1b20] to-[#131318] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#9146ff]/55">
          <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#9146ff]/20 text-sm font-bold text-[#d7c6ff]">
            3
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#b794ff]">Confirmation</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-300">Confirme ton inscription pour finaliser ton integration.</p>
        </article>
      </section>

      {/* Conseils avant inscription */}
      <section className="grid gap-4 rounded-2xl border border-gray-700 bg-[#15151a] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.25)] sm:grid-cols-2 sm:p-6">
        <div className="rounded-xl border border-gray-700 bg-[#1a1a1f] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#b794ff]">A faire avant inscription</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Connexion Discord</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-300">
            Connecte ton compte Discord avant de t inscrire pour eviter tout blocage au moment de la reservation.
          </p>
          <Link
            href="/api/auth/signin/discord"
            className="mt-4 inline-flex rounded-lg bg-[#9146ff] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Connecter Discord
          </Link>
        </div>

        <div className="rounded-xl border border-gray-700 bg-[#1a1a1f] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#b794ff]">Preparation du profil</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Creation de l espace membre</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-300">
            Cree ton espace membre et complete ta premiere connexion avant inscription pour integrer plus vite.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/rejoindre/guide-public/creer-un-compte"
              className="inline-flex rounded-lg border border-gray-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:border-[#9146ff]/60"
            >
              Creer un compte
            </Link>
            <Link
              href="/rejoindre/guide-espace-membre/premiere-connexion"
              className="inline-flex rounded-lg border border-gray-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:border-[#9146ff]/60"
            >
              Premiere connexion
            </Link>
          </div>
        </div>
      </section>

      {/* Calendrier */}
      <div className="card rounded-2xl border border-gray-700 bg-[#1a1a1d] p-6 shadow-[0_10px_35px_rgba(0,0,0,0.35)]">
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

        <div className="mb-4 flex items-center gap-2 text-xs text-gray-400">
          <span className="inline-block h-2 w-2 rounded-full bg-[#9146ff]" />
          Clique sur une case marquee pour ouvrir la reunion
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
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
                return (
                  <div
                    key={index}
                    className={`min-h-[80px] rounded-lg border p-2 transition-colors ${
                      date
                        ? integration
                          ? "cursor-pointer border-gray-600 bg-[#0e0e10] hover:bg-[#1f1f23]"
                          : "border-gray-800 bg-[#0e0e10]"
                        : "border-transparent"
                    }`}
                    onClick={() => integration && handleIntegrationClick(integration)}
                  >
                    {date && (
                      <>
                        <div className="mb-1 text-sm text-gray-400">{date.getDate()}</div>
                        {integration && (
                          <div
                            className={`rounded px-2 py-1 text-xs font-bold text-white ${getCategoryColor(
                              integration.category
                            )}`}
                          >
                            {integration.title}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal intégration */}
      {selectedIntegration && (
        <IntegrationModal
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
          requiresProfileForm={authChecked ? !isDiscordConnected : true}
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

