"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import {
  X,
  Users,
  Plus,
  Save,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  HeartHandshake,
  CalendarDays,
  UserPlus,
  ClipboardCheck,
  ExternalLink,
  Gauge,
  Search,
  LayoutList,
} from "lucide-react";

const heroShellClass =
  "relative overflow-hidden rounded-3xl border border-indigo-400/25 bg-[linear-gradient(155deg,rgba(99,102,241,0.14),rgba(14,15,23,0.92)_38%,rgba(11,13,20,0.97))] shadow-[0_24px_70px_rgba(2,6,23,0.55)] backdrop-blur-xl";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0b10]";
const modalShellClass =
  "relative max-h-[min(92vh,900px)] w-full max-w-5xl overflow-hidden rounded-3xl border border-indigo-400/20 bg-[linear-gradient(180deg,rgba(18,22,36,0.98),rgba(10,12,18,0.99))] shadow-[0_32px_90px_rgba(0,0,0,0.65)]";
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
  const [sessionSearch, setSessionSearch] = useState("");
  const [kpiPulse, setKpiPulse] = useState(false);
  const sessionsListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/integrations/inscriptions-overview", {
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        const integrationsList: Integration[] = data.integrations || [];

        const now = new Date();
        const futureIntegrations = integrationsList.filter((i: Integration) => new Date(i.date) >= now);
        const pastIntegrations = integrationsList.filter((i: Integration) => new Date(i.date) < now);

        futureIntegrations.sort((a: Integration, b: Integration) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

        pastIntegrations.sort((a: Integration, b: Integration) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        setIntegrations([...futureIntegrations, ...pastIntegrations]);
        setAllRegistrations(data.registrationsByIntegrationId || {});
      }
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      setKpiPulse(true);
      const t = window.setTimeout(() => setKpiPulse(false), 650);
      return () => window.clearTimeout(t);
    }
  }, [loading, integrations.length]);

  const scrollToSessions = useCallback(() => {
    sessionsListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const filterSessions = useCallback(
    (list: Integration[]) => {
      const q = sessionSearch.trim().toLowerCase();
      if (!q) return list;
      return list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.category || "").toLowerCase().includes(q)
      );
    },
    [sessionSearch]
  );

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

  const handlePresenceClear = (registrationId: string) => {
    setPresences((prev) => {
      const next = { ...prev };
      delete next[registrationId];
      return next;
    });
  };

  useEffect(() => {
    if (!isModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isModalOpen]);

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
      const presencesArray = selectedRegistrations.map((reg) => ({
        registrationId: reg.id,
        present:
          presences[reg.id] !== undefined ? presences[reg.id] === true : Boolean(reg.present),
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
  }, [integrations, allRegistrations, futureIntegrations]);

  const filteredFuture = useMemo(
    () => filterSessions(futureIntegrations),
    [futureIntegrations, filterSessions]
  );
  const filteredPast = useMemo(
    () => filterSessions(pastIntegrations),
    [pastIntegrations, filterSessions]
  );

  return (
    <div className="space-y-8 text-white">
      <section className={`${heroShellClass} p-6 md:p-8`}>
        <div className="pointer-events-none absolute -right-24 top-0 h-56 w-56 rounded-full bg-violet-600/18 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-cyan-500/12 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <Link
              href="/admin/onboarding"
              className={`inline-flex items-center gap-1 text-sm text-indigo-200/90 transition hover:text-white ${focusRingClass} rounded-lg`}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Retour au hub onboarding
            </Link>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-100/90">
                Liste d&apos;attente vivante
              </span>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-100/90">
                Membres TENF
              </span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/85">Onboarding · Inscriptions</p>
              <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-white to-cyan-100 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
                Qui vient à la prochaine réunion ?
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-300 md:text-[15px]">
                Les membres s&apos;inscrivent depuis le parcours public ; ici tu sécurises la liste, tu complètes à la main si
                besoin et tu coches les <strong className="font-semibold text-slate-100">présences</strong> pour que personne
                ne soit perdu entre Discord et Twitch.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void loadData()}
                className={`${subtleButtonClass} ${focusRingClass}`}
              >
                <RefreshCw className={`h-4 w-4 shrink-0 ${loading ? "animate-spin" : ""}`} aria-hidden />
                Synchroniser
              </button>
              <button
                type="button"
                onClick={scrollToSessions}
                className={`${subtleButtonClass} ${focusRingClass} border-emerald-400/25 bg-emerald-500/10 text-emerald-100 hover:border-emerald-300/45`}
              >
                <LayoutList className="h-4 w-4 shrink-0" aria-hidden />
                Voir les sessions
              </button>
              <Link
                href="/integration"
                target="_blank"
                rel="noopener noreferrer"
                className={`${subtleButtonClass} ${focusRingClass} border-sky-400/25 bg-sky-500/10 text-sky-100 hover:border-sky-300/45`}
              >
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                Parcours public intégration
              </Link>
            </div>
          </div>
          <div className="w-full max-w-sm shrink-0 space-y-4 rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
              <Gauge className="h-4 w-4 text-violet-300" aria-hidden />
              Point de vigilance
            </div>
            <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-400">
              <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300/80" aria-hidden />
              {stats.lowEnrollmentFutureSessions > 0 ? (
                <>
                  <strong className="font-semibold text-amber-100">{stats.lowEnrollmentFutureSessions}</strong> session(s) à
                  venir avec moins de 3 inscrits — un petit rappel Discord peut débloquer la dynamique.
                </>
              ) : (
                <>Les sessions à venir ont un volume raisonnable sur les seuils suivis (&lt; 3 inscrits).</>
              )}
            </p>
            <Link
              href="/admin/onboarding/sessions"
              className={`flex items-center justify-center gap-2 rounded-xl border border-indigo-400/30 bg-indigo-500/15 py-2.5 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/25 ${focusRingClass}`}
            >
              Ajuster les créneaux
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={scrollToSessions}
          className={`${sectionCardClass} w-full p-5 text-left transition hover:-translate-y-0.5 hover:border-indigo-400/35 hover:shadow-[0_12px_36px_rgba(79,70,229,0.18)] ${focusRingClass}`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Sessions listées</p>
          <p className={`mt-2 text-3xl font-bold tabular-nums text-white ${kpiPulse ? "scale-[1.02] transition-transform" : ""}`}>
            {stats.totalSessions}
          </p>
          <p className="mt-2 text-xs text-slate-500">Publiées dans le système</p>
        </button>
        <button
          type="button"
          onClick={scrollToSessions}
          className={`${sectionCardClass} w-full border-sky-500/15 p-5 text-left transition hover:-translate-y-0.5 hover:border-sky-400/35 ${focusRingClass}`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-200/70">À venir</p>
          <p className={`mt-2 text-3xl font-bold tabular-nums text-sky-300 ${kpiPulse ? "scale-[1.02] transition-transform" : ""}`}>
            {stats.upcomingSessions}
          </p>
          <p className="mt-2 text-xs text-slate-500">Prochains créneaux</p>
        </button>
        <button
          type="button"
          onClick={scrollToSessions}
          className={`${sectionCardClass} w-full border-emerald-500/15 p-5 text-left transition hover:-translate-y-0.5 hover:border-emerald-400/35 ${focusRingClass}`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-200/70">Inscriptions</p>
          <p className={`mt-2 text-3xl font-bold tabular-nums text-emerald-300 ${kpiPulse ? "scale-[1.02] transition-transform" : ""}`}>
            {stats.totalRegistrations}
          </p>
          <p className="mt-2 text-xs text-slate-500">Toutes sessions confondues</p>
        </button>
        <button
          type="button"
          onClick={scrollToSessions}
          className={`${sectionCardClass} w-full border-rose-500/15 p-5 text-left transition hover:-translate-y-0.5 hover:border-rose-400/35 ${focusRingClass}`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-200/70">Absents marqués</p>
          <p className={`mt-2 text-3xl font-bold tabular-nums text-rose-300 ${kpiPulse ? "scale-[1.02] transition-transform" : ""}`}>
            {stats.absentCount}
          </p>
          <p className="mt-2 text-xs text-slate-500">À traiter avec bienveillance</p>
        </button>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        <article className={`${sectionCardClass} p-5 md:p-6`}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-500/15">
              <ClipboardCheck className="h-5 w-5 text-emerald-200" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Présences renseignées</h2>
              <p className="mt-1 text-sm text-slate-400">
                Répartition globale — ouvre une session pour ajuster membre par membre dans le panneau latéral.
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-4 text-sm">
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

        <article className={`${sectionCardClass} p-5 md:p-6`}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-500/15">
              <Sparkles className="h-5 w-5 text-sky-200" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Synthèse rapide</h2>
              <p className="mt-1 text-sm text-slate-400">Volumes avant / après pour prioriser ton temps staff.</p>
            </div>
          </div>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-[#353a50] bg-[#121623]/80 px-4 py-3 transition hover:border-sky-400/25">
              <span className="text-slate-200">Inscriptions sur sessions futures</span>
              <span className="font-bold tabular-nums text-sky-200">{stats.futureRegistrations}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[#353a50] bg-[#121623]/80 px-4 py-3 transition hover:border-indigo-400/25">
              <span className="text-slate-200">Inscriptions sur sessions passées</span>
              <span className="font-bold tabular-nums text-indigo-200">{stats.pastRegistrations}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] px-4 py-3">
              <span className="text-slate-200">Taux présence (présents / présents+absents)</span>
              <span className="font-bold tabular-nums text-emerald-200">{stats.attendanceRate}%</span>
            </div>
            <div className="rounded-xl border border-amber-400/35 bg-amber-500/12 px-4 py-3 text-sm text-amber-100">
              Sessions à venir avec &lt; 3 inscrits :{" "}
              <span className="font-bold">{stats.lowEnrollmentFutureSessions}</span>
            </div>
          </div>
        </article>
      </section>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`${sectionCardClass} animate-pulse p-6`}>
              <div className="h-5 w-3/4 rounded bg-white/10" />
              <div className="mt-4 h-4 w-1/2 rounded bg-white/5" />
              <div className="mt-6 flex justify-between">
                <div className="h-10 w-24 rounded-lg bg-white/10" />
                <div className="h-10 w-32 rounded-lg bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      ) : integrations.length === 0 ? (
        <div className={`${sectionCardClass} flex flex-col items-center gap-4 py-16 text-center`}>
          <CalendarDays className="h-12 w-12 text-indigo-400/40" aria-hidden />
          <div>
            <p className="text-lg font-semibold text-white">Aucune session pour recevoir des inscriptions</p>
            <p className="mt-2 max-w-md text-sm text-slate-400">
              Publie d&apos;abord une réunion depuis les sessions onboarding ; elle apparaîtra ici automatiquement.
            </p>
          </div>
          <Link
            href="/admin/onboarding/sessions"
            className={`${subtleButtonClass} ${focusRingClass}`}
          >
            Ouvrir la planification des sessions
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      ) : (
        <div ref={sessionsListRef} className="scroll-mt-24 space-y-8">
          <div className={`${sectionCardClass} flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between`}>
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
              <input
                type="search"
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                placeholder="Filtrer par titre ou catégorie…"
                className={`w-full rounded-xl border border-[#353a50] bg-[#0f1321] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 ${focusRingClass}`}
                aria-label="Filtrer les sessions"
              />
            </div>
            <p className="shrink-0 text-xs text-slate-500">
              {filteredFuture.length + filteredPast.length} session(s) affichée(s)
            </p>
          </div>

          {(() => {
            const renderCards = (integrationsList: Integration[], variant: "future" | "past") => (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {integrationsList.map((integration) => {
                  const count = getRegistrationCount(integration.id);
                  const isLow = variant === "future" && count < 3;
                  return (
                    <button
                      key={integration.id}
                      type="button"
                      onClick={() => handleOpenModal(integration)}
                      className={`group ${sectionCardClass} w-full p-5 text-left transition hover:-translate-y-1 hover:border-indigo-400/40 hover:shadow-[0_16px_44px_rgba(79,70,229,0.2)] ${focusRingClass} ${
                        variant === "past" ? "opacity-90 saturate-75" : ""
                      } ${isLow ? "ring-1 ring-amber-400/25" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-base font-bold leading-snug text-white group-hover:text-indigo-100">
                            {integration.title}
                          </p>
                          {integration.category ? (
                            <p className="mt-2 inline-block rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                              {integration.category}
                            </p>
                          ) : null}
                        </div>
                        <span
                          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold tabular-nums ${
                            count === 0
                              ? "border-slate-600/50 bg-slate-800/80 text-slate-400"
                              : "border-emerald-400/35 bg-emerald-500/15 text-emerald-100"
                          }`}
                        >
                          <Users className="h-4 w-4" aria-hidden />
                          {count}
                        </span>
                      </div>
                      <p className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-sky-400/90" aria-hidden />
                        {formatDate(integration.date)}
                      </p>
                      {isLow ? (
                        <p className="mt-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-2 py-1.5 text-[11px] font-medium text-amber-100">
                          Faible affluence — relance possible
                        </p>
                      ) : null}
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-300 transition group-hover:gap-2">
                        Ouvrir le dossier inscriptions
                        <ChevronRight className="h-4 w-4" aria-hidden />
                      </span>
                    </button>
                  );
                })}
              </div>
            );

            return (
              <>
                {filteredFuture.length > 0 && (
                  <div>
                    <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white md:text-2xl">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20 text-sky-200">
                        <CalendarDays className="h-5 w-5" aria-hidden />
                      </span>
                      Réunions à venir
                    </h2>
                    {renderCards(filteredFuture, "future")}
                  </div>
                )}

                {filteredPast.length > 0 && (
                  <div>
                    <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white md:text-2xl">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-600/40 text-slate-200">
                        <ClipboardCheck className="h-5 w-5" aria-hidden />
                      </span>
                      Réunions passées
                    </h2>
                    {renderCards(filteredPast, "past")}
                  </div>
                )}

                {filteredFuture.length === 0 && filteredPast.length === 0 && sessionSearch.trim() ? (
                  <div className={`${sectionCardClass} py-12 text-center text-slate-400`}>
                    Aucune session ne correspond à « {sessionSearch} ».
                  </div>
                ) : null}
              </>
            );
          })()}
        </div>
      )}

      {/* Modal des détails d'inscription */}
      {isModalOpen && selectedIntegration && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          role="presentation"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="inscriptions-modal-title"
            className={`${modalShellClass} flex max-h-[min(92vh,900px)] flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.12),transparent_50%)]" aria-hidden />

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className={`absolute right-4 top-4 z-20 rounded-xl border border-white/10 bg-black/40 p-2 text-slate-300 backdrop-blur-sm transition hover:border-rose-400/35 hover:bg-rose-500/15 hover:text-rose-100 ${focusRingClass}`}
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative shrink-0 border-b border-white/[0.08] bg-gradient-to-br from-indigo-500/15 via-transparent to-cyan-500/10 px-6 pb-6 pt-8 md:px-8">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-100/90">
                  Dossier session
                </span>
                {selectedIntegration.isPublished ? (
                  <span className="rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-100">
                    Publiée
                  </span>
                ) : (
                  <span className="rounded-full border border-amber-400/35 bg-amber-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-100">
                    Interne
                  </span>
                )}
                <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold text-sky-100">
                  <Users className="mr-1 inline h-3 w-3 -translate-y-px" aria-hidden />
                  {selectedRegistrations.length} inscrit
                  {selectedRegistrations.length > 1 ? "s" : ""}
                </span>
              </div>
              <h2 id="inscriptions-modal-title" className="mt-4 text-2xl font-bold leading-tight text-white md:text-3xl">
                {selectedIntegration.title}
              </h2>
              {selectedIntegration.category ? (
                <p className="mt-2 text-sm font-medium text-indigo-200/80">{selectedIntegration.category}</p>
              ) : null}
              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-sky-400/90" aria-hidden />
                  {formatDate(selectedIntegration.date)}
                </span>
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400">
                Cocher les présences reflète l&apos;accueil réel des membres TENF. Tu peux aussi inscrire quelqu&apos;un à la
                main si le formulaire public a sauté.
              </p>
            </div>

            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
              {showAddForm && (
                <div className="shrink-0 border-b border-white/[0.06] bg-[#0c0f18]/95 px-6 py-6 md:px-8">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-500/15">
                      <UserPlus className="h-5 w-5 text-sky-200" aria-hidden />
                    </div>
                    <h3 className="text-lg font-bold text-white">Ajout manuel d&apos;un membre</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Pseudo Discord *
                      </label>
                      <input
                        type="text"
                        value={newMember.discordUsername}
                        onChange={(e) => setNewMember({ ...newMember, discordUsername: e.target.value })}
                        className={`w-full rounded-xl border border-[#353a50] bg-[#121623]/90 px-4 py-2.5 text-white placeholder:text-slate-600 ${focusRingClass}`}
                        placeholder="Comme sur le serveur TENF"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Lien chaîne Twitch *
                      </label>
                      <input
                        type="text"
                        value={newMember.twitchChannelUrl}
                        onChange={(e) => setNewMember({ ...newMember, twitchChannelUrl: e.target.value })}
                        className={`w-full rounded-xl border border-[#353a50] bg-[#121623]/90 px-4 py-2.5 text-white placeholder:text-slate-600 ${focusRingClass}`}
                        placeholder="https://www.twitch.tv/… ou pseudo"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Parrain TENF *
                      </label>
                      <input
                        type="text"
                        value={newMember.parrain}
                        onChange={(e) => setNewMember({ ...newMember, parrain: e.target.value })}
                        className={`w-full rounded-xl border border-[#353a50] bg-[#121623]/90 px-4 py-2.5 text-white placeholder:text-slate-600 ${focusRingClass}`}
                        placeholder="Discord du parrain"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Notes (optionnel)
                      </label>
                      <textarea
                        value={newMember.notes}
                        onChange={(e) => setNewMember({ ...newMember, notes: e.target.value })}
                        rows={2}
                        className={`w-full resize-none rounded-xl border border-[#353a50] bg-[#121623]/90 px-4 py-2.5 text-white placeholder:text-slate-600 ${focusRingClass}`}
                        placeholder="Référence interne staff — visible dans la liste"
                      />
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewMember({ discordUsername: "", twitchChannelUrl: "", parrain: "", notes: "" });
                      }}
                      className={`flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 md:flex-none md:px-6 ${focusRingClass}`}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleAddMember}
                      disabled={saving}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-400/35 bg-gradient-to-r from-emerald-500/25 to-teal-500/20 px-4 py-2.5 text-sm font-bold text-emerald-50 shadow-[0_8px_28px_rgba(16,185,129,0.15)] transition hover:from-emerald-500/35 disabled:opacity-50 md:flex-none md:px-8 ${focusRingClass}`}
                    >
                      {saving ? (
                        <RefreshCw className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <Plus className="h-4 w-4" aria-hidden />
                      )}
                      {saving ? "Ajout…" : "Ajouter à la liste"}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex shrink-0 flex-wrap gap-2 border-b border-white/[0.06] bg-black/20 px-6 py-4 md:px-8">
                {!showAddForm && (
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className={`inline-flex items-center gap-2 rounded-xl border border-sky-400/35 bg-sky-500/15 px-4 py-2.5 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/25 ${focusRingClass}`}
                  >
                    <UserPlus className="h-4 w-4" aria-hidden />
                    Inscrire à la main
                  </button>
                )}
                {selectedRegistrations.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSavePresences}
                    disabled={saving}
                    className={`inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-4 py-2.5 text-sm font-bold text-emerald-50 transition hover:bg-emerald-500/30 disabled:opacity-50 ${focusRingClass}`}
                  >
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
                    {saving ? "Enregistrement…" : "Enregistrer les présences"}
                  </button>
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 md:px-8 [scrollbar-color:rgba(99,102,241,0.35)_transparent] [scrollbar-width:thin]">
                {selectedRegistrations.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 py-14 text-center">
                    <Users className="h-12 w-12 text-slate-600" aria-hidden />
                    <p className="text-slate-400">Pas encore d&apos;inscrits sur ce créneau.</p>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(true)}
                      className={`${subtleButtonClass} ${focusRingClass}`}
                    >
                      <UserPlus className="h-4 w-4" aria-hidden />
                      Ajouter le premier membre
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedRegistrations.map((registration) => {
                      const raw = presences[registration.id];
                      const hasLocalOverride = raw !== undefined;
                      const isPresent = raw ?? registration.present;
                      const isAbsent = isPresent === false;
                      const isUnset = isPresent !== true && isPresent !== false;

                      return (
                        <div
                          key={registration.id}
                          className={`rounded-2xl border p-4 transition ${
                            isAbsent
                              ? "border-rose-500/40 bg-rose-950/25"
                              : isPresent === true
                                ? "border-emerald-500/25 bg-emerald-950/15"
                                : "border-[#353a50] bg-[#0f1321]/90"
                          }`}
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1 space-y-3">
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Discord
                                  </div>
                                  <div className={`mt-1 font-semibold ${isAbsent ? "text-rose-200" : "text-white"}`}>
                                    {registration.displayName || registration.discordUsername || "—"}
                                  </div>
                                </div>
                                <div className="min-w-0 sm:col-span-2">
                                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Twitch
                                  </div>
                                  <div className="mt-1 truncate text-sm">
                                    {registration.twitchChannelUrl ? (
                                      <a
                                        href={registration.twitchChannelUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-indigo-300 underline-offset-2 hover:text-indigo-200 hover:underline"
                                      >
                                        {registration.twitchChannelUrl}
                                        <ExternalLink className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                                      </a>
                                    ) : (
                                      <span className="text-slate-500">—</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                  Parrain TENF
                                </div>
                                <div className={`mt-1 text-sm font-medium ${isAbsent ? "text-rose-200/90" : "text-slate-200"}`}>
                                  {registration.parrain || <span className="text-slate-500">—</span>}
                                </div>
                              </div>
                              {registration.notes ? (
                                <div className="rounded-xl border border-white/[0.06] bg-black/25 px-3 py-2 text-sm text-slate-300">
                                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Notes staff{" "}
                                  </span>
                                  {registration.notes}
                                </div>
                              ) : null}
                              <p className="text-[11px] text-slate-500">
                                Inscrit le{" "}
                                {new Date(registration.registeredAt).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                                {!hasLocalOverride && registration.present !== undefined ? (
                                  <span className="text-slate-600"> · valeur en base</span>
                                ) : null}
                              </p>
                            </div>

                            <div className="shrink-0 lg:pl-2">
                              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Présence
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => handlePresenceChange(registration.id, true)}
                                  className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${focusRingClass} ${
                                    isPresent === true
                                      ? "border-emerald-400/50 bg-emerald-500/25 text-emerald-50"
                                      : "border-white/10 bg-black/30 text-slate-400 hover:border-emerald-400/30"
                                  }`}
                                >
                                  Présent
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePresenceChange(registration.id, false)}
                                  className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${focusRingClass} ${
                                    isAbsent
                                      ? "border-rose-400/50 bg-rose-500/25 text-rose-50"
                                      : "border-white/10 bg-black/30 text-slate-400 hover:border-rose-400/30"
                                  }`}
                                >
                                  Absent
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePresenceClear(registration.id)}
                                  className={`rounded-xl border border-slate-600/50 bg-slate-800/60 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-slate-800 ${focusRingClass}`}
                                >
                                  Réinitialiser
                                </button>
                              </div>
                              <p className="mt-2 text-[10px] leading-snug text-slate-500">
                                {isUnset ? (
                                  <>
                                    <strong className="text-slate-400">Non défini</strong> — Réinitialiser réapplique la valeur
                                    enregistrée sur le serveur.
                                  </>
                                ) : isAbsent ? (
                                  <span className="text-rose-300/90">Marqué absent</span>
                                ) : (
                                  <span className="text-emerald-300/90">Marqué présent</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
