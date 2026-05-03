"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowRight,
  Ban,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Clock3,
  Flame,
  MessageSquare,
  PartyPopper,
  RotateCcw,
  Sparkles,
  Users,
} from "lucide-react";
import { useCommunauteEventsHub } from "@/lib/admin/CommunauteEventsHubContext";

type AdminProposal = {
  id: string;
  title: string;
  description: string;
  category: string;
  proposedDate?: string | null;
  status: "pending" | "approved" | "rejected" | "archived";
  votesCount: number;
  proposer: {
    discordId?: string;
    twitchLogin?: string;
    displayName?: string;
  };
  createdAt: string;
};

const statusLabel: Record<AdminProposal["status"], string> = {
  pending: "En attente",
  approved: "Approuvée",
  rejected: "Refusée",
  archived: "Archivée",
};

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";
const hubHeroClass =
  "relative overflow-hidden rounded-3xl border border-indigo-400/25 bg-[linear-gradient(155deg,rgba(99,102,241,0.14),rgba(14,15,23,0.92)_38%,rgba(11,13,20,0.97))] shadow-[0_24px_70px_rgba(2,6,23,0.55)] backdrop-blur-xl";

const FILTER_KEYS = ["all", "pending", "approved", "rejected", "archived"] as const;

export default function AdminEventProposalsPage() {
  const hubLayout = useCommunauteEventsHub();
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<AdminProposal[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | AdminProposal["status"]>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pulseId, setPulseId] = useState<string | null>(null);

  async function loadProposals() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/events/proposals", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Erreur de chargement");
      setProposals(data.proposals || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur serveur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProposals();
  }, []);

  const scrollToProposal = useCallback((id: string) => {
    setStatusFilter("all");
    setExpandedId(id);
    requestAnimationFrame(() => {
      const el = document.getElementById(`proposal-card-${id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      setPulseId(id);
      window.setTimeout(() => setPulseId(null), 2200);
    });
  }, []);

  async function updateStatus(proposalId: string, status: AdminProposal["status"], createEvent = false) {
    try {
      setUpdatingId(proposalId);
      setMessage(null);
      const response = await fetch(`/api/admin/events/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, createEvent }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Mise à jour impossible");

      await loadProposals();
      setMessage(
        createEvent && data.createdEventId
          ? `✅ Proposition approuvée et événement créé (${data.createdEventId})`
          : "✅ Statut mis à jour",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur serveur");
    } finally {
      setUpdatingId(null);
    }
  }

  const stats = useMemo(() => {
    const pending = proposals.filter((proposal) => proposal.status === "pending").length;
    const approved = proposals.filter((proposal) => proposal.status === "approved").length;
    const rejected = proposals.filter((proposal) => proposal.status === "rejected").length;
    const archived = proposals.filter((proposal) => proposal.status === "archived").length;
    const totalVotes = proposals.reduce((acc, proposal) => acc + proposal.votesCount, 0);
    return { pending, approved, rejected, archived, totalVotes };
  }, [proposals]);

  const filteredProposals = useMemo(() => {
    if (statusFilter === "all") return proposals;
    return proposals.filter((proposal) => proposal.status === statusFilter);
  }, [proposals, statusFilter]);

  const prioritizedQueue = useMemo(() => {
    return proposals
      .filter((proposal) => proposal.status === "pending")
      .sort((a, b) => {
        if (b.votesCount !== a.votesCount) return b.votesCount - a.votesCount;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      })
      .slice(0, 5);
  }, [proposals]);

  const pendingRatio = proposals.length > 0 ? Math.round((stats.pending / proposals.length) * 100) : 0;
  const messageTone = message?.startsWith("✅") ? "success" : "error";
  const hubBackHref = "/admin/communaute/evenements";
  const classicBackHref = "/admin/events";

  const statTiles: {
    key: "all" | AdminProposal["status"];
    label: string;
    value: number;
    accent: string;
  }[] = [
    { key: "all", label: "Total", value: proposals.length, accent: "text-slate-100" },
    { key: "pending", label: "En attente", value: stats.pending, accent: "text-amber-300" },
    { key: "approved", label: "Approuvées", value: stats.approved, accent: "text-emerald-300" },
    { key: "rejected", label: "Refusées", value: stats.rejected, accent: "text-rose-300" },
    { key: "archived", label: "Archivées", value: stats.archived, accent: "text-slate-400" },
  ];

  const filterChipBase =
    "rounded-xl border px-3 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60";
  const filterChipInactive = "border-[#3b4157] bg-[#13192b] text-slate-300 hover:border-indigo-300/35 hover:text-slate-100";
  const filterChipActive = "border-indigo-300/50 bg-indigo-400/20 text-indigo-50 shadow-[0_0_0_1px_rgba(129,140,248,0.25)]";

  return (
    <div className={`text-white space-y-6 ${hubLayout ? "mx-auto max-w-6xl pb-10" : ""}`}>
      {hubLayout ? (
        <section className={`${hubHeroClass} p-6 md:p-8`}>
          <div className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="relative">
            <Link
              href={hubBackHref}
              className="inline-flex items-center gap-2 text-sm text-indigo-100/90 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Retour au hub événements communauté
            </Link>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                <PartyPopper className="h-3.5 w-3.5" />
                Idées membres TENF
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/35 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-100">
                <Sparkles className="h-3.5 w-3.5" />
                Modération staff
              </span>
            </div>
            <h1 className="mt-4 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
              Boîte à idées — traitement visuel
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
              Les membres proposent des formats et des sujets : cette vue met en avant les votes, la file prioritaire et les
              actions rapides pour répondre vite, tout en gardant une trace claire des décisions.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/admin/communaute/evenements/calendrier" className={subtleButtonClass}>
                Calendrier
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/admin/communaute/evenements/participation" className={subtleButtonClass}>
                Participation
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className={`${glassCardClass} p-5 md:p-6`}>
          <Link href={classicBackHref} className="text-gray-300 hover:text-white transition-colors inline-block mb-3">
            ← Retour au hub événements
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Evenements communautaires</p>
              <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
                Centre de moderation des propositions
              </h1>
              <p className="mt-3 text-sm text-slate-300">
                Cette page centralise la revue des idees soumises par la communaute. Objectif: prioriser les meilleures propositions,
                valider rapidement ce qui est actionnable et garder une trace claire des refus/archives.
              </p>
            </div>
            <Link href="/admin/communaute/evenements/calendrier" className={subtleButtonClass}>
              Ouvrir calendrier
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {message && (
        <div
          role="status"
          className={`animate-in fade-in duration-200 rounded-2xl border px-4 py-3 text-sm ${
            messageTone === "success"
              ? "border-emerald-500/35 bg-emerald-950/35 text-emerald-100"
              : "border-rose-500/35 bg-rose-950/30 text-rose-100"
          }`}
        >
          {message}
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        {statTiles.map((tile) => (
          <button
            key={tile.key}
            type="button"
            onClick={() => setStatusFilter(tile.key)}
            className={`${sectionCardClass} p-4 text-left transition hover:border-indigo-400/35 hover:shadow-[0_12px_36px_rgba(2,6,23,0.5)] ${
              statusFilter === tile.key ? "ring-2 ring-indigo-400/45 ring-offset-2 ring-offset-[#0a0b10]" : ""
            }`}
          >
            <p className="text-xs uppercase tracking-[0.1em] text-slate-400">{tile.label}</p>
            <p className={`mt-2 text-3xl font-semibold ${tile.accent}`}>{tile.value}</p>
            {hubLayout && tile.key !== "all" ? (
              <p className="mt-2 text-[11px] text-slate-500">Cliquer pour filtrer</p>
            ) : null}
          </button>
        ))}
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Votes cumulés</p>
          <p className="mt-2 text-3xl font-semibold text-sky-300">{stats.totalVotes}</p>
          {hubLayout ? <p className="mt-2 text-[11px] text-slate-500">Engagement sur les fiches</p> : null}
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
        <article className={`${sectionCardClass} p-5`}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
                <Flame className="h-5 w-5 text-amber-400" />
                File priorisée
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {hubLayout
                  ? "Top des idées en attente : cliquez une ligne pour ouvrir la fiche et agir."
                  : "Classement par votes puis anciennete pour traiter les plus strategiques."}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {prioritizedQueue.length === 0 ? (
              <p className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-3 text-sm text-slate-300">
                Aucune proposition en attente.
              </p>
            ) : (
              prioritizedQueue.map((proposal, index) => (
                <button
                  key={proposal.id}
                  type="button"
                  onClick={() => scrollToProposal(proposal.id)}
                  className={`group w-full rounded-xl border border-[#353a50] bg-[#121623]/80 p-3 text-left transition hover:border-indigo-400/40 hover:bg-[#151a2e]/90 ${
                    hubLayout ? "hover:-translate-y-0.5" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs font-bold text-amber-200">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-100 group-hover:text-white">{proposal.title}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {proposal.votesCount} vote{proposal.votesCount > 1 ? "s" : ""} · {new Date(proposal.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    {hubLayout ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 opacity-0 transition group-hover:opacity-100" />
                    ) : null}
                  </div>
                </button>
              ))
            )}
          </div>
        </article>
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Lecture rapide moderation</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p className="rounded-lg border border-indigo-300/30 bg-indigo-300/10 px-3 py-2 text-indigo-100">
              <Clock3 className="mr-1 inline h-4 w-4" />
              {pendingRatio}% des propositions sont encore en attente.
            </p>
            <p className="rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-emerald-100">
              <CheckCircle2 className="mr-1 inline h-4 w-4" />
              Valider avec creation directe pour accelerer la programmation.
            </p>
            <p className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-cyan-100">
              <Users className="mr-1 inline h-4 w-4" />
              Favoriser les sujets a fort vote pour maximiser l&apos;engagement.
            </p>
            <p className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-amber-100">
              <MessageSquare className="mr-1 inline h-4 w-4" />
              Archiver les doublons pour garder une file propre.
            </p>
          </div>
        </article>
      </section>

      <section className={`${sectionCardClass} p-4`}>
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-[0.1em] text-slate-400">Filtrer par statut</span>
        </div>
        <div className={`flex flex-wrap gap-2 ${hubLayout ? "mt-3" : ""}`}>
          {FILTER_KEYS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`${filterChipBase} ${statusFilter === status ? filterChipActive : filterChipInactive} ${
                hubLayout ? "px-4 py-2.5 text-sm" : ""
              }`}
            >
              {status === "all" ? "Tous" : statusLabel[status]}
              {hubLayout && status !== "all" ? (
                <span className="ml-2 rounded-md bg-black/25 px-1.5 py-0.5 text-[10px] text-slate-300">
                  {status === "pending"
                    ? stats.pending
                    : status === "approved"
                      ? stats.approved
                      : status === "rejected"
                        ? stats.rejected
                        : stats.archived}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        hubLayout ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-[#2f3244] bg-[#101522]/80 p-6 shadow-[0_10px_30px_rgba(2,6,23,0.35)]"
              >
                <div className="h-5 w-2/3 rounded bg-slate-700/60" />
                <div className="mt-4 h-3 w-full rounded bg-slate-800/50" />
                <div className="mt-2 h-3 w-5/6 rounded bg-slate-800/50" />
                <div className="mt-6 flex gap-2">
                  <div className="h-10 w-40 rounded-xl bg-slate-700/40" />
                  <div className="h-10 w-32 rounded-xl bg-slate-700/40" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#2f3244] bg-[#101522]/70 p-4 text-gray-400">Chargement des propositions...</div>
        )
      ) : filteredProposals.length === 0 ? (
        <div className="rounded-2xl border border-[#2f3244] bg-[#101522]/70 p-4 text-gray-400">Aucune proposition pour ce filtre.</div>
      ) : (
        <div className="space-y-4">
          {filteredProposals.map((proposal) => {
            const isExpanded = expandedId === proposal.id;
            const descLong = proposal.description.length > 220;
            const proposerLabel =
              proposal.proposer.displayName || proposal.proposer.twitchLogin || proposal.proposer.discordId || "Inconnu";
            const busy = updatingId === proposal.id;

            return (
              <div
                key={proposal.id}
                id={`proposal-card-${proposal.id}`}
                className={`rounded-2xl border bg-[#121623]/85 p-5 shadow-[0_10px_30px_rgba(2,6,23,0.35)] transition-[box-shadow,border-color] ${
                  pulseId === proposal.id
                    ? "border-indigo-400/55 shadow-[0_0_0_1px_rgba(129,140,248,0.35),0_16px_40px_rgba(2,6,23,0.45)]"
                    : "border-[#353a50]"
                } space-y-3`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold text-slate-100">{proposal.title}</h2>
                    <p className="text-sm text-gray-400">
                      {proposal.category} · {proposal.proposedDate ? new Date(proposal.proposedDate).toLocaleString("fr-FR") : "Date non renseignée"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs px-2 py-1 rounded-full border ${
                      proposal.status === "approved"
                        ? "bg-green-600/20 text-green-300 border-green-500/30"
                        : proposal.status === "rejected"
                          ? "bg-red-600/20 text-red-300 border-red-500/30"
                          : proposal.status === "archived"
                            ? "bg-gray-600/20 text-gray-300 border-gray-500/30"
                            : "bg-yellow-600/20 text-yellow-300 border-yellow-500/30"
                    }`}
                  >
                    {statusLabel[proposal.status]}
                  </span>
                </div>

                <div>
                  <p
                    className={`text-sm text-gray-200 whitespace-pre-wrap ${
                      hubLayout && !isExpanded && descLong ? "line-clamp-4" : ""
                    }`}
                  >
                    {proposal.description}
                  </p>
                  {hubLayout && descLong ? (
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : proposal.id)}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-300 hover:text-indigo-200"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-3.5 w-3.5" /> Réduire
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3.5 w-3.5" /> Voir tout le texte
                        </>
                      )}
                    </button>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                  <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/25 bg-amber-500/5 px-2 py-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    {proposal.votesCount} vote{proposal.votesCount > 1 ? "s" : ""}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg border border-slate-600/40 px-2 py-1">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    {proposerLabel}
                  </span>
                  <span className="rounded-lg border border-slate-600/40 px-2 py-1">Discord: {proposal.proposer.discordId || "n/a"}</span>
                  <span className="rounded-lg border border-slate-600/40 px-2 py-1">
                    Créé {new Date(proposal.createdAt).toLocaleString("fr-FR")}
                  </span>
                </div>

                <div className={`space-y-4 border-t border-white/5 pt-4 ${hubLayout ? "sm:flex sm:items-start sm:justify-between sm:gap-6 sm:space-y-0" : ""}`}>
                  <div className="min-w-0 flex-1">
                    <p className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">Décision</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => updateStatus(proposal.id, "approved", true)}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                      >
                        <CalendarPlus className="h-4 w-4 shrink-0" />
                        Approuver + événement
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(proposal.id, "approved", false)}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/35 bg-emerald-600/15 px-3 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-600/25 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        Approuver seul
                      </button>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 sm:text-right">
                    <p className="mb-2 text-[10px] uppercase tracking-wider text-slate-500 sm:text-right">Statut</p>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => updateStatus(proposal.id, "rejected")}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/35 bg-rose-600/15 px-3 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-600/25 disabled:opacity-50"
                      >
                        <Ban className="h-4 w-4 shrink-0" />
                        Refuser
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(proposal.id, "archived")}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-500/40 bg-slate-700/40 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-600/50 disabled:opacity-50"
                      >
                        <Archive className="h-4 w-4 shrink-0" />
                        Archiver
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(proposal.id, "pending")}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/35 bg-amber-600/15 px-3 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-600/25 disabled:opacity-50"
                      >
                        <RotateCcw className="h-4 w-4 shrink-0" />
                        En attente
                      </button>
                    </div>
                  </div>
                </div>
                {busy ? <p className="text-xs text-indigo-200/90">Mise à jour en cours…</p> : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
