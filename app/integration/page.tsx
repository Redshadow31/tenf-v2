"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  LayoutGrid,
  List,
  Clock,
  CheckCircle2,
  PartyPopper,
  X,
  MapPin,
  Info,
  AlertTriangle,
} from "lucide-react";
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

type Feedback = { kind: "success" | "error" | "info"; message: string };

function isSameCalendarDay(a: Date, b: Date) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function Page() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [isRegistering, setIsRegistering] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isDiscordConnected, setIsDiscordConnected] = useState(false);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const today = useMemo(() => new Date(), []);

  const startToday = useMemo(() => startOfToday(), []);

  const upcomingSorted = useMemo(() => {
    return [...integrations]
      .filter((i) => new Date(i.date) >= startToday)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [integrations, startToday]);

  const sessionsThisMonth = useMemo(() => {
    return integrations.filter((i) => {
      const d = new Date(i.date);
      return sameMonth(d, currentMonth);
    }).length;
  }, [integrations, currentMonth]);

  const nextSessionShort = useMemo(() => {
    const first = upcomingSorted[0];
    if (!first) return null;
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(first.date));
  }, [upcomingSorted]);

  const sortedForList = useMemo(() => {
    return [...integrations].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [integrations]);

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

  useEffect(() => {
    if (!feedback) return;
    const t = window.setTimeout(() => setFeedback(null), 9000);
    return () => window.clearTimeout(t);
  }, [feedback]);

  const getCategoryAccent = (category: string) => {
    switch (category) {
      case "Intégration standard":
        return { border: "rgba(145, 70, 255, 0.5)", bg: "color-mix(in srgb, #9146ff 16%, var(--color-card))", dot: "#a78bfa", label: "Standard" };
      case "Intégration rapide":
        return { border: "rgba(59, 130, 246, 0.5)", bg: "color-mix(in srgb, #3b82f6 14%, var(--color-card))", dot: "#60a5fa", label: "Rapide" };
      case "Intégration spéciale":
        return { border: "rgba(34, 197, 94, 0.5)", bg: "color-mix(in srgb, #22c55e 14%, var(--color-card))", dot: "#4ade80", label: "Spéciale" };
      default:
        return { border: "var(--color-border)", bg: "var(--color-card-hover)", dot: "var(--color-text-secondary)", label: category };
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
        setFeedback({ kind: "success", message: data.message || "Inscription enregistrée. À très vite en réunion !" });
        setIsModalOpen(false);
        setSelectedIntegration(null);
      } else {
        const error = await response.json().catch(() => ({}));
        if (response.status === 409) {
          setFeedback({
            kind: "info",
            message: error.error || "Tu es déjà inscrit·e à cette session.",
          });
        } else {
          setFeedback({
            kind: "error",
            message: error.error || "Impossible de finaliser l’inscription pour le moment.",
          });
        }
      }
    } catch (error) {
      console.error("Erreur inscription:", error);
      setFeedback({ kind: "error", message: "Erreur réseau. Réessaie dans un instant." });
    } finally {
      setIsRegistering(false);
    }
  };

  const goToTodayMonth = useCallback(() => {
    setCurrentMonth(new Date());
  }, []);

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

  const showMonthReset = !sameMonth(currentMonth, today);

  return (
    <main className="relative min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      {feedback ? (
        <div
          className="fixed bottom-4 left-4 right-4 z-[60] flex justify-center px-2 sm:left-auto sm:right-6 sm:max-w-md"
          role="status"
        >
          <div
            className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md sm:w-auto ${
              feedback.kind === "success"
                ? "border-emerald-500/40 bg-emerald-950/90 text-emerald-50"
                : feedback.kind === "info"
                  ? "border-sky-500/40 bg-sky-950/90 text-sky-50"
                  : "border-rose-500/45 bg-rose-950/90 text-rose-50"
            }`}
          >
            {feedback.kind === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
            ) : feedback.kind === "info" ? (
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
            ) : (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
            )}
            <p className="min-w-0 flex-1 text-sm leading-snug">{feedback.message}</p>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="shrink-0 rounded-lg p-1 opacity-80 hover:opacity-100"
              aria-label="Fermer le message"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:space-y-10 sm:py-12">
        <section
          className="relative overflow-hidden rounded-3xl border p-6 sm:p-8 md:p-10"
          style={{
            borderColor: "rgba(145, 70, 255, 0.35)",
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 18%, var(--color-card)) 0%, var(--color-card) 42%, color-mix(in srgb, #06b6d4 14%, var(--color-card)) 100%)",
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
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em]"
                style={{ borderColor: "rgba(255,255,255,0.2)", color: "var(--color-text)" }}
              >
                <Sparkles size={14} style={{ color: "var(--color-primary)" }} /> Parcours membre TENF
              </p>
              <h1 className="mt-4 text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>
                Réserver ta réunion d&apos;intégration
              </h1>
              <p className="mt-3 max-w-3xl text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                Dernière étape officielle avant de rejoindre la communauté : choisis une date, lis le programme dans la
                fiche, puis confirme ta place. Tout est pensé pour que tu arrives serein·e.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/rejoindre/guide-integration" className="integration-premium-btn-primary">
                  Guide du parcours <ArrowUpRight size={14} strokeWidth={2.25} />
                </Link>
                <span className="integration-premium-chip">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-primary)" }} />
                  Calendrier ou liste : ouvre une session pour t&apos;inscrire
                </span>
              </div>
            </div>

            {!loading && integrations.length > 0 ? (
              <div
                className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:w-[min(100%,20rem)] lg:grid-cols-1 xl:grid-cols-3"
                style={{ color: "var(--color-text)" }}
              >
                <div
                  className="rounded-2xl border px-3 py-3 text-center shadow-lg sm:px-4"
                  style={{
                    borderColor: "rgba(145, 70, 255, 0.35)",
                    backgroundColor: "color-mix(in srgb, var(--color-bg) 55%, transparent)",
                  }}
                >
                  <Clock className="mx-auto mb-1 h-5 w-5" style={{ color: "var(--color-primary)" }} />
                  <p className="text-2xl font-bold tabular-nums">{upcomingSorted.length}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wide opacity-80">Sessions à venir</p>
                </div>
                <div
                  className="rounded-2xl border px-3 py-3 text-center shadow-lg sm:px-4"
                  style={{
                    borderColor: "rgba(6, 182, 212, 0.35)",
                    backgroundColor: "color-mix(in srgb, var(--color-bg) 55%, transparent)",
                  }}
                >
                  <CalendarDays className="mx-auto mb-1 h-5 w-5 text-cyan-400" />
                  <p className="text-2xl font-bold tabular-nums">{sessionsThisMonth}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wide opacity-80">Ce mois affiché</p>
                </div>
                <div
                  className="col-span-2 rounded-2xl border px-3 py-3 text-center shadow-lg sm:col-span-1 lg:col-span-1 xl:col-span-1"
                  style={{
                    borderColor: "rgba(34, 197, 94, 0.35)",
                    backgroundColor: "color-mix(in srgb, var(--color-bg) 55%, transparent)",
                  }}
                >
                  <PartyPopper className="mx-auto mb-1 h-5 w-5 text-emerald-400" />
                  <p className="line-clamp-2 text-xs font-semibold leading-tight">{nextSessionShort ?? "—"}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wide opacity-80">Prochain créneau</p>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <IntegrationWelcomeNote />

        <section className="grid gap-3 sm:grid-cols-3">
          {[
            {
              step: "1",
              kicker: "Explorer",
              body: "Parcours le calendrier ou la liste : chaque carte résume une vraie réunion TENF.",
            },
            {
              step: "2",
              kicker: "Lire la fiche",
              body: "Date, lieu Discord, programme : tout est dans le panneau latéral (mobile : plein écran).",
            },
            {
              step: "3",
              kicker: "Réserver",
              body: "Connecte Discord si possible, puis confirme — le staff te guidera le jour J.",
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
              Fluidité
            </p>
            <h2 className="mt-2 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              Discord connecté
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              Si ton compte Discord est lié, l&apos;inscription se fait en un clic depuis la fiche session — idéal pour
              éviter les erreurs de pseudo.
            </p>
            <Link href="/api/auth/signin/discord" className="integration-premium-btn-primary mt-4">
              Connecter Discord
            </Link>
          </div>

          <div className="rounded-2xl border p-4 sm:p-5" style={cardStyle}>
            <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--color-primary)" }}>
              Avant la réunion
            </p>
            <h2 className="mt-2 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              Espace membre
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              Crée ton compte et fais ta première connexion : après l&apos;intégration, tu auras déjà l&apos;habitude du
              tableau de bord.
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
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
                  Sessions programmées
                </h2>
                <p className="text-xs sm:text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Vue calendrier classique ou liste chronologique — même contenu, ton confort.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <div
                className="flex rounded-xl border p-1"
                style={{ borderColor: "rgba(145, 70, 255, 0.25)", backgroundColor: "color-mix(in srgb, var(--color-bg) 40%, var(--color-card))" }}
              >
                <button
                  type="button"
                  onClick={() => setViewMode("calendar")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition sm:flex-none sm:px-4 ${
                    viewMode === "calendar" ? "shadow-md" : "opacity-70 hover:opacity-100"
                  }`}
                  style={
                    viewMode === "calendar"
                      ? {
                          backgroundColor: "color-mix(in srgb, var(--color-primary) 22%, var(--color-card))",
                          color: "var(--color-text)",
                        }
                      : { color: "var(--color-text-secondary)" }
                  }
                >
                  <LayoutGrid className="h-4 w-4" />
                  Calendrier
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition sm:flex-none sm:px-4 ${
                    viewMode === "list" ? "shadow-md" : "opacity-70 hover:opacity-100"
                  }`}
                  style={
                    viewMode === "list"
                      ? {
                          backgroundColor: "color-mix(in srgb, var(--color-primary) 22%, var(--color-card))",
                          color: "var(--color-text)",
                        }
                      : { color: "var(--color-text-secondary)" }
                  }
                >
                  <List className="h-4 w-4" />
                  Liste
                </button>
              </div>

              {viewMode === "calendar" ? (
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
                  {showMonthReset ? (
                    <button
                      type="button"
                      onClick={goToTodayMonth}
                      className="ml-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition hover:brightness-110"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                    >
                      Aujourd&apos;hui
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="integration-premium-chip mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <span className="inline-flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full shadow-[0_0_10px_color-mix(in_srgb,var(--color-primary)_70%,transparent)]"
                style={{ backgroundColor: "var(--color-primary)" }}
              />
              Jour avec session
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#a78bfa" }} />
              {getCategoryAccent("Intégration standard").label}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#60a5fa" }} />
              {getCategoryAccent("Intégration rapide").label}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#4ade80" }} />
              {getCategoryAccent("Intégration spéciale").label}
            </span>
          </div>

          {loading ? (
            <div className="space-y-4 py-6">
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="h-8 animate-pulse rounded-lg bg-white/5" />
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 28 }).map((_, i) => (
                  <div key={i} className="min-h-[4.5rem] animate-pulse rounded-xl bg-white/5 sm:min-h-[5.5rem]" />
                ))}
              </div>
            </div>
          ) : viewMode === "calendar" ? (
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
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {sortedForList.map((integration) => {
                const accent = getCategoryAccent(integration.category);
                const d = new Date(integration.date);
                return (
                  <li key={integration.id}>
                    <button
                      type="button"
                      onClick={() => handleIntegrationClick(integration)}
                      className="group flex w-full flex-col overflow-hidden rounded-2xl border text-left transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      style={{
                        borderColor: accent.border,
                        background: accent.bg,
                        boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                      }}
                    >
                      {integration.image ? (
                        <div className="relative aspect-[21/9] w-full overflow-hidden border-b border-white/10">
                          <img src={integration.image} alt="" className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.02]" />
                        </div>
                      ) : null}
                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                            style={{ backgroundColor: "rgba(0,0,0,0.2)", color: accent.dot }}
                          >
                            {accent.label}
                          </span>
                          <span className="text-xs font-medium tabular-nums opacity-90" style={{ color: "var(--color-text-secondary)" }}>
                            {d.toLocaleDateString("fr-FR", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="font-semibold leading-snug" style={{ color: "var(--color-text)" }}>
                          {integration.title}
                        </p>
                        {integration.locationName ? (
                          <p className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            {integration.locationName}
                          </p>
                        ) : null}
                        <span className="mt-auto text-xs font-semibold" style={{ color: "var(--color-primary)" }}>
                          Ouvrir la fiche →
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
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

        {!loading && integrations.length === 0 && (
          <div
            className="relative overflow-hidden rounded-3xl border py-16 text-center"
            style={{
              borderColor: "rgba(145, 70, 255, 0.25)",
              background:
                "linear-gradient(165deg, color-mix(in srgb, var(--color-primary) 10%, var(--color-card)) 0%, var(--color-card) 60%)",
            }}
          >
            <div
              className="pointer-events-none absolute left-1/2 top-0 h-32 w-64 -translate-x-1/2 rounded-full blur-3xl"
              style={{ background: "rgba(145, 70, 255, 0.15)" }}
            />
            <div className="relative px-4">
              <CalendarDays className="mx-auto mb-4 h-12 w-12 opacity-40" style={{ color: "var(--color-primary)" }} />
              <p className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                Aucune session publiée pour l&apos;instant
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Le planning des intégrations arrive bientôt. En attendant, tu peux suivre le guide ou rejoindre le Discord
                pour ne rien manquer.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Link href="/rejoindre/guide-integration" className="integration-premium-btn-primary">
                  Guide intégration
                </Link>
                <Link href="/api/auth/signin/discord" className="integration-premium-btn-secondary">
                  Discord TENF
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
