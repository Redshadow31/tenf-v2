"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import {
  X,
  UserPlus,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Activity,
  UserMinus,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  HeartHandshake,
  CalendarDays,
  ExternalLink,
  ClipboardCheck,
  Search,
  LayoutList,
  Users,
  MapPin,
} from "lucide-react";

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

type MemberForIntegrate = {
  id: string;
  twitchLogin: string;
  twitchChannelUrl: string;
  displayName: string;
  discordId?: string;
  discordUsername?: string;
  parrain?: string;
  notes?: string;
};

type EditableMember = {
  member: MemberForIntegrate;
  role: "Affilié" | "Développement";
  included: boolean;
};

type ApiMember = {
  twitchLogin?: string;
  twitchUrl?: string;
  displayName?: string;
  discordId?: string;
  discordUsername?: string;
  role?: string;
  parrain?: string;
};

const heroShellClass =
  "relative overflow-hidden rounded-3xl border border-indigo-400/25 bg-[linear-gradient(155deg,rgba(99,102,241,0.14),rgba(14,15,23,0.92)_38%,rgba(11,13,20,0.97))] shadow-[0_24px_70px_rgba(2,6,23,0.55)] backdrop-blur-xl";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0b10]";
const modalShellClass =
  "relative max-h-[min(92vh,920px)] w-full max-w-5xl overflow-hidden rounded-3xl border border-indigo-400/20 bg-[linear-gradient(180deg,rgba(18,22,36,0.98),rgba(10,12,18,0.99))] shadow-[0_32px_90px_rgba(0,0,0,0.65)]";

function toMemberForIntegrate(reg: IntegrationRegistration): MemberForIntegrate {
  return {
    id: reg.id,
    twitchLogin: reg.twitchLogin,
    twitchChannelUrl: reg.twitchChannelUrl,
    displayName: reg.displayName || reg.discordUsername || "",
    discordId: reg.discordId,
    discordUsername: reg.discordUsername,
    parrain: reg.parrain,
    notes: reg.notes,
  };
}

export default function PresenceRetourPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<Record<string, IntegrationRegistration[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [editableMembers, setEditableMembers] = useState<EditableMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [integrating, setIntegrating] = useState(false);
  const [nouveauxMembers, setNouveauxMembers] = useState<ApiMember[]>([]);
  const [loadingNouveaux, setLoadingNouveaux] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [addMode, setAddMode] = useState<"manual" | "nouveau">("nouveau");
  const [manualForm, setManualForm] = useState({
    displayName: "",
    twitchLogin: "",
    twitchChannelUrl: "",
    parrain: "",
  });
  const [sessionSearch, setSessionSearch] = useState("");
  const [kpiPulse, setKpiPulse] = useState(false);
  const sessionsListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      setKpiPulse(true);
      const t = window.setTimeout(() => setKpiPulse(false), 650);
      return () => window.clearTimeout(t);
    }
  }, [loading, integrations.length]);

  useEffect(() => {
    if (!isModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isModalOpen]);

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

  const loadData = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/integrations/inscriptions-overview", {
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        const integrationsList: Integration[] = data.integrations || [];
        const registrationsMap: Record<string, IntegrationRegistration[]> =
          data.registrationsByIntegrationId || {};

        setAllRegistrations(registrationsMap);

        const validatedIntegrations = integrationsList.filter((integration: Integration) => {
          const registrations = registrationsMap[integration.id] || [];
          return registrations.some((reg) => reg.present !== undefined);
        });

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

  const handleOpenModal = (integration: Integration) => {
    setSelectedIntegration(integration);
    const registrations = allRegistrations[integration.id] || [];
    const presentOnly = registrations.filter((reg) => reg.present === true);
    setEditableMembers(
      presentOnly.map((reg) => ({
        member: toMemberForIntegrate(reg),
        role: "Affilié" as const,
        included: true,
      }))
    );
    setShowAddSection(false);
    setManualForm({ displayName: "", twitchLogin: "", twitchChannelUrl: "", parrain: "" });
    setIsModalOpen(true);
  };

  const includedCount = editableMembers.filter((e) => e.included).length;

  const updateMember = (idx: number, updates: Partial<EditableMember>) => {
    setEditableMembers((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ...updates } : item))
    );
  };

  const removeMember = (idx: number) => {
    setEditableMembers((prev) => prev.filter((_, i) => i !== idx));
  };

  const loadNouveauxMembers = async () => {
    setLoadingNouveaux(true);
    try {
      const res = await fetch("/api/admin/members", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const members: ApiMember[] = data.members || [];
        const nouveaux = members.filter((m) => String(m.role || "").toLowerCase() === "nouveau");
        setNouveauxMembers(nouveaux);
      }
    } catch {
      setNouveauxMembers([]);
    } finally {
      setLoadingNouveaux(false);
    }
  };

  const addFromNouveau = (m: ApiMember) => {
    const login = (m.twitchLogin || "").toLowerCase();
    const displayName = m.displayName || m.discordUsername || login;
    if (!login || !displayName) return;
    if (editableMembers.some((e) => e.member.twitchLogin.toLowerCase() === login)) return;
    const newMember: MemberForIntegrate = {
      id: `nouveau_${login}_${Date.now()}`,
      twitchLogin: login,
      twitchChannelUrl: m.twitchUrl || `https://www.twitch.tv/${login}`,
      displayName,
      discordId: m.discordId,
      discordUsername: m.discordUsername,
      parrain: m.parrain,
    };
    setEditableMembers((prev) => [
      ...prev,
      { member: newMember, role: "Affilié" as const, included: true },
    ]);
  };

  const addManual = () => {
    const displayName = manualForm.displayName.trim();
    const twitchLogin = manualForm.twitchLogin.trim().toLowerCase();
    if (!displayName || !twitchLogin) return;
    if (editableMembers.some((e) => e.member.twitchLogin.toLowerCase() === twitchLogin)) return;
    const url = manualForm.twitchChannelUrl.trim() || `https://www.twitch.tv/${twitchLogin}`;
    const newMember: MemberForIntegrate = {
      id: `manual_${twitchLogin}_${Date.now()}`,
      twitchLogin,
      twitchChannelUrl: url.startsWith("http") ? url : `https://www.twitch.tv/${twitchLogin}`,
      displayName,
      parrain: manualForm.parrain.trim() || undefined,
    };
    setEditableMembers((prev) => [
      ...prev,
      { member: newMember, role: "Affilié" as const, included: true },
    ]);
    setManualForm({ displayName: "", twitchLogin: "", twitchChannelUrl: "", parrain: "" });
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

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
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

  const filteredIntegrations = useMemo(
    () => filterSessions(integrations),
    [integrations, filterSessions]
  );

  const futureIntegrations = useMemo(() => {
    const now = Date.now();
    return filteredIntegrations.filter((i) => new Date(i.date).getTime() >= now);
  }, [filteredIntegrations]);

  const pastIntegrations = useMemo(() => {
    const now = Date.now();
    return filteredIntegrations.filter((i) => new Date(i.date).getTime() < now);
  }, [filteredIntegrations]);

  const stats = useMemo(() => {
    const totalSessions = integrations.length;
    const totalRegistrations = Object.values(allRegistrations).reduce((sum, regs) => sum + regs.length, 0);
    const totalPresent = Object.values(allRegistrations)
      .flat()
      .filter((reg) => reg.present === true).length;
    const totalAbsent = Object.values(allRegistrations)
      .flat()
      .filter((reg) => reg.present === false).length;
    const attendanceRate = totalPresent + totalAbsent > 0
      ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100)
      : 0;
    return { totalSessions, totalRegistrations, totalPresent, totalAbsent, attendanceRate };
  }, [integrations, allRegistrations]);

  const handleIntegrateMembers = async () => {
    const toIntegrate = editableMembers.filter((e) => e.included);
    if (!selectedIntegration || toIntegrate.length === 0) return;

    if (
      !confirm(
        `Êtes-vous sûr de vouloir intégrer ${toIntegrate.length} membre(s) au site et Discord ? Rôle et date d'intégration seront appliqués.`
      )
    ) {
      return;
    }

    const integrationDate = selectedIntegration.date
      ? new Date(selectedIntegration.date).toISOString().slice(0, 10)
      : undefined;

    try {
      setIntegrating(true);
      const response = await fetch("/api/admin/integrations/integrate-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrationId: selectedIntegration.id,
          members: toIntegrate.map(({ member, role }) => ({
            discordUsername: member.displayName || member.discordUsername,
            discordId: member.discordId,
            twitchLogin: member.twitchLogin,
            twitchChannelUrl: member.twitchChannelUrl,
            parrain: member.parrain,
            role,
            integrationDate,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(
          `✅ ${data.message || `${data.integrated || 0} membre(s) intégré(s) avec succès !`}`
        );
        await loadData();
        setIsModalOpen(false);
      } else {
        const error = await response.json();
        alert(`❌ Erreur: ${error.error || "Impossible d'intégrer les membres"}`);
      }
    } catch (error) {
      console.error("Erreur intégration membres:", error);
      alert("❌ Erreur lors de l'intégration");
    } finally {
      setIntegrating(false);
    }
  };

  const renderSessionCards = (list: Integration[], variant: "future" | "past") => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {list.map((integration) => {
        const presentCount = getPresentCount(integration.id);
        const totalCount = getTotalCount(integration.id);
        const share = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
        const highlightGap = variant === "future" && totalCount > 0 && presentCount < totalCount;
        return (
          <button
            key={integration.id}
            type="button"
            onClick={() => handleOpenModal(integration)}
            className={`group ${sectionCardClass} w-full p-5 text-left transition hover:-translate-y-1 hover:border-indigo-400/40 hover:shadow-[0_16px_44px_rgba(79,70,229,0.2)] ${focusRingClass} ${
              variant === "past" ? "opacity-90 saturate-75" : ""
            } ${highlightGap ? "ring-1 ring-amber-400/30" : ""}`}
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
                <p className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 text-sky-300/70" aria-hidden />
                  {formatDateShort(integration.date)}
                </p>
              </div>
              <span
                className={`flex shrink-0 flex-col items-end gap-1 rounded-2xl border px-3 py-2 text-right ${
                  presentCount > 0
                    ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-100"
                    : "border-slate-600/50 bg-slate-800/80 text-slate-400"
                }`}
              >
                <span className="flex items-center gap-1 text-lg font-bold tabular-nums leading-none">
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  {presentCount}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  / {totalCount} inscrits
                </span>
              </span>
            </div>
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-500">
                <span>Présents sur liste</span>
                <span className="tabular-nums text-slate-300">{share}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#1f2434]">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all"
                  style={{ width: `${Math.min(100, share)}%` }}
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm font-semibold text-indigo-200">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" aria-hidden />
                Gérer les présents
              </span>
              <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-8 p-4 text-white sm:p-6 md:p-8">
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
                Passage membre actif
              </span>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-100/90">
                Public &amp; TENF
              </span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/85">Onboarding · Présences</p>
              <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-white to-cyan-100 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
                De la salle virtuelle au statut membre
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-300 md:text-[15px]">
                Ici tu relies le <strong className="font-semibold text-slate-100">parcours public</strong> (inscription,
                réunion) à l&apos;accueil TENF : vérifie qui était vraiment là, complète la liste si besoin, puis lance
                l&apos;intégration Discord et site en une action — pour que chaque nouvelle personne sente le fil rouge.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void loadData()}
                className={`${subtleButtonClass} ${focusRingClass}`}
              >
                <RefreshCw className={`h-4 w-4 shrink-0 ${loading ? "animate-spin" : ""}`} aria-hidden />
                Actualiser les données
              </button>
              <button
                type="button"
                onClick={scrollToSessions}
                className={`${subtleButtonClass} ${focusRingClass} border-emerald-400/25 bg-emerald-500/10 text-emerald-100 hover:border-emerald-300/45`}
              >
                <LayoutList className="h-4 w-4 shrink-0" aria-hidden />
                Voir les sessions prêtes
              </button>
              <Link
                href="/admin/onboarding/inscriptions"
                className={`${subtleButtonClass} ${focusRingClass} border-sky-400/25 bg-sky-500/10 text-sky-100 hover:border-sky-300/45`}
              >
                <ClipboardCheck className="h-4 w-4 shrink-0" aria-hidden />
                Renseigner les présences
              </Link>
            </div>
          </div>
          <div className="w-full max-w-sm shrink-0 space-y-4 rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
              <MapPin className="h-4 w-4 text-violet-300" aria-hidden />
              Pourquoi cette page
            </div>
            <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-400">
              <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300/80" aria-hidden />
              Seules les réunions où au moins une présence a été saisie apparaissent ici — c&apos;est le signal que la
              session est prête pour la suite d&apos;intégration.
            </p>
            <Link
              href="/integration"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 rounded-xl border border-indigo-400/30 bg-indigo-500/15 py-2.5 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/25 ${focusRingClass}`}
            >
              Voir le parcours public
              <ExternalLink className="h-4 w-4" aria-hidden />
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Sessions prêtes</p>
          <p
            className={`mt-2 text-3xl font-bold tabular-nums text-white ${kpiPulse ? "scale-[1.02] transition-transform" : ""}`}
          >
            {stats.totalSessions}
          </p>
          <p className="mt-2 text-xs text-slate-500">Avec présences renseignées</p>
        </button>
        <button
          type="button"
          onClick={scrollToSessions}
          className={`${sectionCardClass} w-full border-emerald-500/15 p-5 text-left transition hover:-translate-y-0.5 hover:border-emerald-400/35 ${focusRingClass}`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-200/70">Présents (cumul)</p>
          <p
            className={`mt-2 text-3xl font-bold tabular-nums text-emerald-300 ${kpiPulse ? "scale-[1.02] transition-transform" : ""}`}
          >
            {stats.totalPresent}
          </p>
          <p className="mt-2 text-xs text-slate-500">Toutes sessions confondues</p>
        </button>
        <button
          type="button"
          onClick={scrollToSessions}
          className={`${sectionCardClass} w-full border-rose-500/15 p-5 text-left transition hover:-translate-y-0.5 hover:border-rose-400/35 ${focusRingClass}`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-200/70">Absents (cumul)</p>
          <p
            className={`mt-2 text-3xl font-bold tabular-nums text-rose-300 ${kpiPulse ? "scale-[1.02] transition-transform" : ""}`}
          >
            {stats.totalAbsent}
          </p>
          <p className="mt-2 text-xs text-slate-500">Marqués comme non venus</p>
        </button>
        <button
          type="button"
          onClick={scrollToSessions}
          className={`${sectionCardClass} w-full border-sky-500/15 p-5 text-left transition hover:-translate-y-0.5 hover:border-sky-400/35 ${focusRingClass}`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-200/70">Taux de présence</p>
          <p
            className={`mt-2 text-3xl font-bold tabular-nums text-sky-300 ${kpiPulse ? "scale-[1.02] transition-transform" : ""}`}
          >
            {stats.attendanceRate}%
          </p>
          <p className="mt-2 text-xs text-slate-500">Présents / (présents + absents)</p>
        </button>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        <article className={`${sectionCardClass} p-5 md:p-6`}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-500/15">
              <Activity className="h-5 w-5 text-sky-200" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Répartition à venir / passé</h2>
              <p className="mt-1 text-sm text-slate-400">
                Les cartes ci-dessous respectent ton filtre de recherche ; les chiffres globaux restent inchangés.
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-[#353a50] bg-[#121623]/80 px-4 py-3 transition hover:border-sky-400/25">
              <span className="text-slate-200">Sessions à venir (filtrées)</span>
              <span className="font-bold tabular-nums text-sky-200">{futureIntegrations.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[#353a50] bg-[#121623]/80 px-4 py-3 transition hover:border-indigo-400/25">
              <span className="text-slate-200">Sessions passées (filtrées)</span>
              <span className="font-bold tabular-nums text-indigo-200">{pastIntegrations.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] px-4 py-3">
              <span className="text-slate-200">Inscriptions suivies (toutes intégrations)</span>
              <span className="font-bold tabular-nums text-emerald-200">{stats.totalRegistrations}</span>
            </div>
          </div>
        </article>

        <article className={`${sectionCardClass} p-5 md:p-6`}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/15">
              <Sparkles className="h-5 w-5 text-violet-200" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Enchaînement conseillé</h2>
              <p className="mt-1 text-sm text-slate-400">Garde le même rythme pour chaque vague de nouveaux.</p>
            </div>
          </div>
          <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm text-slate-300">
            <li>
              <Link href="/admin/onboarding/inscriptions" className="font-medium text-indigo-200 underline-offset-2 hover:underline">
                Inscriptions
              </Link>{" "}
              : liste complète et présences.
            </li>
            <li>
              <strong className="text-white">Cette page</strong> : ouvrir la session, vérifier les présents, ajuster.
            </li>
            <li>
              Bouton <strong className="text-emerald-200">Intégrer</strong> : rôle, statut actif, date d&apos;intégration.
            </li>
          </ol>
          <Link
            href="/admin/onboarding/sessions"
            className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 ${focusRingClass}`}
          >
            Planification des sessions
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
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
            <p className="text-lg font-semibold text-white">Aucune session prête pour l&apos;intégration</p>
            <p className="mt-2 max-w-lg text-sm text-slate-400">
              Tant qu&apos;aucune présence n&apos;a été renseignée sur une réunion, elle n&apos;apparaît pas ici. Va sur les
              inscriptions, coche les présences après le live, puis reviens pour intégrer les membres.
            </p>
          </div>
          <Link href="/admin/onboarding/inscriptions" className={`${subtleButtonClass} ${focusRingClass}`}>
            Ouvrir la page inscriptions
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      ) : filteredIntegrations.length === 0 ? (
        <div className={`${sectionCardClass} flex flex-col items-center gap-4 py-14 text-center`}>
          <Search className="h-10 w-10 text-slate-500" aria-hidden />
          <p className="text-sm text-slate-300">
            Aucune session ne correspond à « <span className="font-mono text-indigo-200">{sessionSearch}</span> ».
          </p>
          <button type="button" onClick={() => setSessionSearch("")} className={`${subtleButtonClass} ${focusRingClass}`}>
            Réinitialiser le filtre
          </button>
        </div>
      ) : (
        <div ref={sessionsListRef} className="scroll-mt-24 space-y-10">
          <div className={`${sectionCardClass} flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between`}>
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                aria-hidden
              />
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
              {futureIntegrations.length + pastIntegrations.length} session(s) affichée(s)
            </p>
          </div>

          {futureIntegrations.length > 0 ? (
            <div>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-200/80">À venir</p>
                  <h2 className="text-xl font-bold text-white">Sessions encore devant nous</h2>
                </div>
              </div>
              {renderSessionCards(futureIntegrations, "future")}
            </div>
          ) : null}

          {pastIntegrations.length > 0 ? (
            <div>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-200/80">Passées</p>
                  <h2 className="text-xl font-bold text-white">Historique des réunions validées</h2>
                </div>
              </div>
              {renderSessionCards(pastIntegrations, "past")}
            </div>
          ) : null}
        </div>
      )}

      {isModalOpen && selectedIntegration && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-md sm:items-center sm:p-6"
          role="presentation"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="presence-modal-title"
            className={`${modalShellClass} flex max-h-[min(92vh,920px)] w-full flex-col sm:max-w-5xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative shrink-0 border-b border-white/10 bg-gradient-to-r from-indigo-600/25 via-[#141a2e] to-cyan-600/20 px-5 pb-5 pt-6 pr-14 sm:px-8">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className={`absolute right-3 top-3 rounded-xl border border-white/15 bg-black/30 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white ${focusRingClass}`}
                aria-label="Fermer"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-100/80">Session sélectionnée</p>
              <h2 id="presence-modal-title" className="mt-1 text-2xl font-bold leading-tight text-white md:text-3xl">
                {selectedIntegration.title}
              </h2>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-sky-300" aria-hidden />
                  {formatDate(selectedIntegration.date)}
                </span>
                <span className="hidden h-1 w-1 rounded-full bg-slate-500 sm:inline" aria-hidden />
                <span className="inline-flex items-center gap-1.5 text-slate-400">
                  <Users className="h-4 w-4 text-indigo-300" aria-hidden />
                  {editableMembers.length} dans la liste ·{" "}
                  <strong className="text-emerald-200">{includedCount}</strong> inclus pour intégration
                </span>
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {includedCount > 0 ? (
                <div className="border-b border-emerald-500/20 bg-emerald-950/25 px-5 py-5 sm:px-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-emerald-100">Prêt à passer sur Discord et le site</p>
                      <p className="mt-1 max-w-2xl text-xs text-emerald-200/80">
                        Rôle choisi, statut actif et date d&apos;intégration seront appliqués pour chaque personne cochée
                        « incluse ».
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleIntegrateMembers}
                      disabled={integrating}
                      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-emerald-300/40 bg-gradient-to-br from-emerald-500/30 to-teal-600/25 px-6 py-3 text-sm font-bold text-emerald-50 shadow-[0_12px_40px_rgba(16,185,129,0.25)] transition hover:brightness-110 disabled:opacity-50 ${focusRingClass}`}
                    >
                      <UserPlus className="h-5 w-5" aria-hidden />
                      {integrating ? "Intégration en cours…" : `Intégrer ${includedCount} membre(s)`}
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="border-b border-white/10 px-5 py-5 sm:px-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSection((s) => !s);
                    if (!showAddSection && addMode === "nouveau") void loadNouveauxMembers();
                  }}
                  className={`inline-flex w-full items-center justify-between gap-3 rounded-2xl border border-indigo-400/30 bg-indigo-500/10 px-4 py-3 text-left text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/20 sm:w-auto sm:justify-start ${focusRingClass}`}
                >
                  <span className="flex items-center gap-2">
                    <Plus className="h-4 w-4" aria-hidden />
                    {showAddSection ? "Masquer l’ajout de membres" : "Ajouter un membre à cette session"}
                  </span>
                  <ChevronRight
                    className={`h-4 w-4 shrink-0 transition ${showAddSection ? "rotate-90" : ""}`}
                    aria-hidden
                  />
                </button>
                {showAddSection ? (
                  <div className="mt-4 space-y-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAddMode("nouveau");
                          void loadNouveauxMembers();
                        }}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${focusRingClass} ${
                          addMode === "nouveau"
                            ? "border border-indigo-400/40 bg-indigo-500/25 text-indigo-50"
                            : "border border-transparent bg-[#0f1321] text-slate-400 hover:text-white"
                        }`}
                      >
                        Depuis le rôle Nouveau
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddMode("manual")}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${focusRingClass} ${
                          addMode === "manual"
                            ? "border border-indigo-400/40 bg-indigo-500/25 text-indigo-50"
                            : "border border-transparent bg-[#0f1321] text-slate-400 hover:text-white"
                        }`}
                      >
                        Saisie manuelle
                      </button>
                    </div>
                    {addMode === "nouveau" ? (
                      <div>
                        {loadingNouveaux ? (
                          <p className="text-sm text-slate-400">Chargement des membres Nouveau…</p>
                        ) : nouveauxMembers.length === 0 ? (
                          <p className="text-sm text-slate-400">Aucun membre avec le rôle Nouveau.</p>
                        ) : (
                          <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto pr-1">
                            {nouveauxMembers.map((m) => {
                              const login = (m.twitchLogin || "").toLowerCase();
                              const label = m.displayName || m.discordUsername || login;
                              const already = editableMembers.some(
                                (e) => e.member.twitchLogin.toLowerCase() === login
                              );
                              return (
                                <button
                                  key={login}
                                  type="button"
                                  onClick={() => addFromNouveau(m)}
                                  disabled={already}
                                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${focusRingClass} ${
                                    already
                                      ? "cursor-not-allowed border-slate-600 bg-slate-800/50 text-slate-500"
                                      : "border-indigo-400/40 bg-indigo-500/15 text-indigo-100 hover:bg-indigo-500/25"
                                  }`}
                                >
                                  {label}
                                  {already ? " · déjà listé" : ""}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <input
                          type="text"
                          placeholder="Pseudo Discord *"
                          value={manualForm.displayName}
                          onChange={(e) =>
                            setManualForm((f) => ({ ...f, displayName: e.target.value }))
                          }
                          className={`rounded-xl border border-[#353a50] bg-[#0f1321] px-3 py-2.5 text-white placeholder:text-slate-500 ${focusRingClass}`}
                        />
                        <input
                          type="text"
                          placeholder="Pseudo Twitch *"
                          value={manualForm.twitchLogin}
                          onChange={(e) =>
                            setManualForm((f) => ({ ...f, twitchLogin: e.target.value }))
                          }
                          className={`rounded-xl border border-[#353a50] bg-[#0f1321] px-3 py-2.5 text-white placeholder:text-slate-500 ${focusRingClass}`}
                        />
                        <input
                          type="text"
                          placeholder="Lien chaîne Twitch"
                          value={manualForm.twitchChannelUrl}
                          onChange={(e) =>
                            setManualForm((f) => ({ ...f, twitchChannelUrl: e.target.value }))
                          }
                          className={`rounded-xl border border-[#353a50] bg-[#0f1321] px-3 py-2.5 text-white placeholder:text-slate-500 md:col-span-2 ${focusRingClass}`}
                        />
                        <input
                          type="text"
                          placeholder="Parrain TENF"
                          value={manualForm.parrain}
                          onChange={(e) =>
                            setManualForm((f) => ({ ...f, parrain: e.target.value }))
                          }
                          className={`rounded-xl border border-[#353a50] bg-[#0f1321] px-3 py-2.5 text-white placeholder:text-slate-500 md:col-span-2 ${focusRingClass}`}
                        />
                        <button
                          type="button"
                          onClick={addManual}
                          disabled={!manualForm.displayName.trim() || !manualForm.twitchLogin.trim()}
                          className={`rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50 ${focusRingClass}`}
                        >
                          Ajouter à la liste
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="px-5 py-6 sm:px-8">
                {editableMembers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] py-12 text-center">
                    <Users className="mx-auto h-10 w-10 text-slate-600" aria-hidden />
                    <p className="mt-3 text-sm text-slate-400">
                      Aucun présent listé pour cette session. Utilise le panneau ci-dessus pour compléter.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {editableMembers.map((item, idx) => (
                      <div
                        key={item.member.id}
                        className={`rounded-2xl border p-4 transition sm:p-5 ${
                          item.included
                            ? "border-emerald-500/35 bg-[#0f1321]/90 shadow-[0_0_0_1px_rgba(16,185,129,0.12)]"
                            : "border-white/10 bg-[#0b0d14]/80 opacity-80"
                        }`}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Discord
                              </div>
                              <div className="mt-1 font-semibold text-white">
                                {item.member.displayName || item.member.discordUsername || "—"}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Twitch
                              </div>
                              <div className="mt-1 text-sm text-slate-200">
                                {item.member.twitchChannelUrl ? (
                                  <a
                                    href={item.member.twitchChannelUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`inline-flex max-w-full items-center gap-1 break-all text-indigo-300 underline-offset-2 hover:text-indigo-200 hover:underline ${focusRingClass} rounded`}
                                  >
                                    {item.member.twitchChannelUrl}
                                    <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                  </a>
                                ) : (
                                  <span className="text-slate-500">—</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Parrain
                              </div>
                              <div className="mt-1 font-medium text-slate-100">
                                {item.member.parrain || <span className="text-slate-500">—</span>}
                              </div>
                            </div>
                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Rôle après intégration
                              </div>
                              <select
                                value={item.role}
                                onChange={(e) =>
                                  updateMember(idx, {
                                    role: e.target.value as "Affilié" | "Développement",
                                  })
                                }
                                className={`mt-1 w-full rounded-xl border border-[#353a50] bg-[#0f1321] px-3 py-2 text-sm text-white ${focusRingClass}`}
                              >
                                <option value="Affilié">Affilié</option>
                                <option value="Développement">Développement</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:flex-col lg:items-stretch">
                            <button
                              type="button"
                              onClick={() => updateMember(idx, { included: !item.included })}
                              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${focusRingClass} ${
                                item.included
                                  ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-50"
                                  : "border-slate-600 bg-slate-800/80 text-slate-300 hover:border-slate-500"
                              }`}
                            >
                              {item.included ? "Inclus · intégration" : "Exclu pour l’instant"}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeMember(idx)}
                              className={`inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20 ${focusRingClass}`}
                              title="Retirer de la liste"
                            >
                              <UserMinus className="h-4 w-4" aria-hidden />
                              Retirer
                            </button>
                          </div>
                        </div>
                        {item.member.notes ? (
                          <div className="mt-4 border-t border-white/10 pt-3">
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Notes</div>
                            <p className="mt-1 text-sm text-slate-300">{item.member.notes}</p>
                          </div>
                        ) : null}
                      </div>
                    ))}
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
