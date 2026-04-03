"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Sparkles, ArrowUpRight } from "lucide-react";
import IntegrationModal from "@/components/IntegrationModal";
import IntegrationWelcomeNote from "@/components/IntegrationWelcomeNote";

type Integration = {
  id: string;
  title: string;
  description: string;
  image?: string;
  date: string;
  category: string;
  location?: string;
  locationName?: string;
  locationUrl?: string;
};

function isSameCalendarDay(a: Date, b: Date) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

export default function Page() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isRegistering, setIsRegistering] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isDiscordConnected, setIsDiscordConnected] = useState(false);

  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    async function loadIntegrations() {
      try {
        setLoading(true);
        const response = await fetch("/api/integrations", {
          cache: "no-store",
        });
        if (response.ok) {
          const data = await response.json();
          setIntegrations(data.integrations || []);
        }
      } catch (error) {
        console.error("Erreur chargement intégrations:", error);
      } finally {
        setLoading(false);
      }
    }
    loadIntegrations();
  }, []);

  useEffect(() => {
    async function checkDiscordAuth() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (response.ok) {
          const session = await response.json();
          if (session?.user?.discordId) {
            setIsDiscordConnected(true);
            return;
          }
        }
        setIsDiscordConnected(false);
      } catch (error) {
        console.error("Erreur vérification session:", error);
        setIsDiscordConnected(false);
      } finally {
        setAuthChecked(true);
      }
    }
    checkDiscordAuth();
  }, []);

  const getCategoryAccent = (category: string) => {
    switch (category) {
      case "Intégration standard":
        return { border: "rgba(145, 70, 255, 0.5)", bg: "color-mix(in srgb, #9146ff 16%, var(--color-card))", dot: "#a78bfa" };
      case "Intégration rapide":
        return { border: "rgba(59, 130, 246, 0.5)", bg: "color-mix(in srgb, #3b82f6 14%, var(--color-card))", dot: "#60a5fa" };
      case "Intégration spéciale":
        return { border: "rgba(34, 197, 94, 0.5)", bg: "color-mix(in srgb, #22c55e 14%, var(--color-card))", dot: "#4ade80" };
      default:
        return { border: "var(--color-border)", bg: "var(--color-card-hover)", dot: "var(--color-text-secondary)" };
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
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData || {}),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.message || "Inscription réussie !"}`);
        setIsModalOpen(false);
      } else {
        const error = await response.json();
        if (response.status === 409) {
          alert(`ℹ️ ${error.error || "Tu es déjà inscrit à cette intégration"}`);
        } else {
          alert(`❌ ${error.error || "Erreur lors de l'inscription"}`);
        }
      }
    } catch (error) {
      console.error("Erreur inscription:", error);
      alert("❌ Erreur lors de l'inscription");
    } finally {
      setIsRegistering(false);
    }
  };

  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const getIntegrationForDate = (date: Date | null) => {
    if (!date) return null;
    return integrations.find((integration) => {
      const integrationDate = new Date(integration.date);
      return isSameCalendarDay(integrationDate, date);
    });
  };

  const calendarDays = generateCalendar();
  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];

  const cardStyle = {
    borderColor: "var(--color-border)",
    backgroundColor: "var(--color-card)",
  } as const;

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:space-y-10 sm:py-12">
        <section
          className="relative overflow-hidden rounded-3xl border p-6 sm:p-8 md:p-10"
          style={{
            borderColor: "rgba(145, 70, 255, 0.35)",
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 18%, var(--color-card)) 0%, var(--color-card) 45%, color-mix(in srgb, #06b6d4 12%, var(--color-card)) 100%)",
            boxShadow: "0 18px 36px rgba(0,0,0,0.25)",
          }}
        >
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full blur-3xl"
            style={{ background: "rgba(145, 70, 255, 0.25)" }}
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full blur-3xl"
            style={{ background: "rgba(6, 182, 212, 0.2)" }}
          />
          <div className="relative">
            <p
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em]"
              style={{ borderColor: "rgba(255,255,255,0.2)", color: "var(--color-text)" }}
            >
              <Sparkles size={14} style={{ color: "var(--color-primary)" }} /> Rejoindre TENF
            </p>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>
              Choisir une réunion d&apos;intégration
            </h1>
            <p className="mt-3 max-w-3xl text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
              Choisis une date dans le calendrier pour afficher les détails et réserver ton créneau. Cette réunion est
              la dernière étape avant ton intégration officielle au sein de la communauté.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/rejoindre/guide-integration" className="integration-premium-btn-primary">
                Comprendre le fonctionnement <ArrowUpRight size={14} strokeWidth={2.25} />
              </Link>
              <span className="integration-premium-chip">
                <CalendarDays className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-primary)" }} />
                Ouvre une date avec session pour t&apos;inscrire
              </span>
            </div>
          </div>
        </section>

        <IntegrationWelcomeNote />

        <section className="grid gap-3 sm:grid-cols-3">
          {[
            {
              step: "1",
              kicker: "Choix du créneau",
              body: "Sélectionne un jour avec session dans le calendrier ci-dessous.",
            },
            {
              step: "2",
              kicker: "Vérification",
              body: "Ouvre la fiche : date, lieu Discord et consignes de la session.",
            },
            {
              step: "3",
              kicker: "Confirmation",
              body: "Inscris-toi pour finaliser ton intégration (Discord connecté si possible).",
            },
          ].map((item) => (
            <article
              key={item.step}
              className="group relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                ...cardStyle,
                boxShadow: "0 10px 28px rgba(0,0,0,0.12)",
              }}
            >
              <div className="integration-premium-step-badge mb-3">{item.step}</div>
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                {item.kicker}
              </p>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {item.body}
              </p>
            </article>
          ))}
        </section>

        <section
          className="grid gap-4 rounded-3xl border p-5 sm:grid-cols-2 sm:p-6"
          style={{
            borderColor: "rgba(145, 70, 255, 0.22)",
            background:
              "linear-gradient(160deg, color-mix(in srgb, var(--color-primary) 8%, var(--color-card)) 0%, var(--color-card) 55%)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
          }}
        >
          <div className="rounded-2xl border p-4 sm:p-5" style={cardStyle}>
            <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--color-primary)" }}>
              Avant inscription
            </p>
            <h2 className="mt-2 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              Connexion Discord
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              Connecte ton compte Discord avant de t&apos;inscrire pour éviter tout blocage au moment de la réservation.
            </p>
            <Link href="/api/auth/signin/discord" className="integration-premium-btn-primary mt-4">
              Connecter Discord
            </Link>
          </div>

          <div className="rounded-2xl border p-4 sm:p-5" style={cardStyle}>
            <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--color-primary)" }}>
              Préparation
            </p>
            <h2 className="mt-2 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              Espace membre
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              Crée ton espace membre et complète ta première connexion pour aller plus vite après l&apos;intégration.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/rejoindre/guide-public/creer-un-compte" className="integration-premium-btn-secondary">
                Créer un compte
              </Link>
              <Link href="/rejoindre/guide-espace-membre/premiere-connexion" className="integration-premium-btn-secondary">
                Première connexion
              </Link>
            </div>
          </div>
        </section>

        <section
          className="overflow-hidden rounded-3xl border p-5 sm:p-8"
          style={{
            borderColor: "rgba(145, 70, 255, 0.28)",
            backgroundColor: "var(--color-card)",
            boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
          }}
        >
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--color-primary) 20%, transparent)",
                  color: "var(--color-primary)",
                }}
              >
                <CalendarDays className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-lg font-bold sm:text-xl" style={{ color: "var(--color-text)" }}>
                  Calendrier des sessions
                </h2>
                <p className="text-xs sm:text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Les jours avec session sont mis en avant — clique pour ouvrir la fiche.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="integration-premium-btn-icon"
                aria-label="Mois précédent"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2} />
              </button>
              <span className="min-w-[10.5rem] text-center text-base font-semibold sm:text-lg" style={{ color: "var(--color-text)" }}>
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="integration-premium-btn-icon"
                aria-label="Mois suivant"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
          </div>

          <div className="integration-premium-chip mb-5 text-xs">
            <span className="h-2 w-2 shrink-0 rounded-full shadow-[0_0_10px_color-mix(in_srgb,var(--color-primary)_70%,transparent)]" style={{ backgroundColor: "var(--color-primary)" }} />
            Légende : point violet = jour avec réunion d&apos;intégration
          </div>

          <div className="w-full">
            <div className="mb-2 grid grid-cols-7 gap-1 sm:gap-2">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-[10px] font-semibold uppercase tracking-wide sm:text-xs"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarDays.map((date, index) => {
                const integration = getIntegrationForDate(date);
                const isTodayCell = date ? isSameCalendarDay(date, today) : false;
                const accent = integration ? getCategoryAccent(integration.category) : null;

                return (
                  <div
                    key={index}
                    role={integration ? "button" : undefined}
                    tabIndex={integration ? 0 : undefined}
                    onClick={() => integration && handleIntegrationClick(integration)}
                    onKeyDown={(e) => {
                      if (integration && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        handleIntegrationClick(integration);
                      }
                    }}
                    className={`min-h-[4.5rem] rounded-xl border p-1.5 transition-all sm:min-h-[5.5rem] sm:p-2 ${
                      date
                        ? integration
                          ? "cursor-pointer hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-card)]"
                          : "focus:outline-none"
                        : "border-transparent bg-transparent"
                    }`}
                    style={
                      date
                        ? integration
                          ? {
                              borderColor: accent!.border,
                              background: accent!.bg,
                              boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
                              ...(isTodayCell ? { boxShadow: "0 0 0 2px var(--color-primary), 0 4px 14px rgba(0,0,0,0.12)" } : {}),
                            }
                          : {
                              borderColor: "var(--color-border)",
                              backgroundColor: "color-mix(in srgb, var(--color-bg) 55%, var(--color-card))",
                              ...(isTodayCell
                                ? { boxShadow: "0 0 0 2px color-mix(in srgb, var(--color-primary) 65%, transparent)" }
                                : {}),
                            }
                        : undefined
                    }
                  >
                    {date && (
                      <>
                        <div className="mb-1 flex items-center justify-between gap-1">
                          <span
                            className="text-xs font-semibold tabular-nums sm:text-sm"
                            style={{ color: "var(--color-text)" }}
                          >
                            {date.getDate()}
                          </span>
                          {integration ? (
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full sm:h-2 sm:w-2"
                              style={{ backgroundColor: accent!.dot }}
                              aria-hidden
                            />
                          ) : null}
                        </div>
                        {integration ? (
                          <p
                            className="line-clamp-2 text-[10px] font-semibold leading-tight sm:text-xs"
                            style={{ color: "var(--color-text)" }}
                          >
                            {integration.title}
                          </p>
                        ) : null}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

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
          <div className="py-16 text-center">
            <div
              className="mx-auto h-10 w-10 animate-spin rounded-full"
              style={{
                borderWidth: 2,
                borderStyle: "solid",
                borderColor: "var(--color-primary)",
                borderTopColor: "transparent",
              }}
            />
            <p className="mt-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Chargement des intégrations…
            </p>
          </div>
        )}

        {!loading && integrations.length === 0 && (
          <div
            className="rounded-2xl border py-14 text-center"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
          >
            <p style={{ color: "var(--color-text-secondary)" }}>Aucune intégration disponible pour le moment.</p>
          </div>
        )}
      </div>
    </main>
  );
}
