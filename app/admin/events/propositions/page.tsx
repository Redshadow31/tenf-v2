"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, MessageSquare, Sparkles, Users } from "lucide-react";

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

export default function AdminEventProposalsPage() {
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<AdminProposal[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | AdminProposal["status"]>("all");

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
      setMessage(createEvent && data.createdEventId ? `✅ Proposition approuvée et événement créé (${data.createdEventId})` : "✅ Statut mis à jour");
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

  return (
    <div className="text-white space-y-6">
      <section className={`${glassCardClass} p-5 md:p-6`}>
        <Link href="/admin/events" className="text-gray-300 hover:text-white transition-colors inline-block mb-3">
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

      {message && (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-900/20 text-blue-200 px-4 py-3 text-sm">{message}</div>
      )}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Total propositions</p>
          <p className="mt-2 text-3xl font-semibold">{proposals.length}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">En attente</p>
          <p className="mt-2 text-3xl font-semibold text-amber-300">{stats.pending}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Approuvees</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-300">{stats.approved}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Refusees</p>
          <p className="mt-2 text-3xl font-semibold text-rose-300">{stats.rejected}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Votes cumules</p>
          <p className="mt-2 text-3xl font-semibold text-sky-300">{stats.totalVotes}</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">File priorisee (en attente)</h2>
          <p className="mt-1 text-sm text-slate-400">Classement par votes puis anciennete pour traiter les plus strategiques.</p>
          <div className="mt-4 space-y-2">
            {prioritizedQueue.length === 0 ? (
              <p className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-3 text-sm text-slate-300">
                Aucune proposition en attente.
              </p>
            ) : (
              prioritizedQueue.map((proposal) => (
                <div key={proposal.id} className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-3">
                  <p className="text-sm font-semibold text-slate-100">{proposal.title}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Votes: {proposal.votesCount} · Cree le {new Date(proposal.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
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
              Favoriser les sujets a fort vote pour maximiser l'engagement.
            </p>
            <p className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-amber-100">
              <MessageSquare className="mr-1 inline h-4 w-4" />
              Archiver les doublons pour garder une file propre.
            </p>
          </div>
        </article>
      </section>

      <section className={`${sectionCardClass} p-4`}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-[0.1em] text-slate-400">Filtrer par statut</span>
          {(["all", "pending", "approved", "rejected", "archived"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                statusFilter === status
                  ? "border-indigo-300/40 bg-indigo-300/15 text-indigo-100"
                  : "border-[#3b4157] bg-[#13192b] text-slate-300 hover:border-indigo-300/30 hover:text-slate-100"
              }`}
            >
              {status === "all" ? "Tous" : statusLabel[status]}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="rounded-2xl border border-[#2f3244] bg-[#101522]/70 p-4 text-gray-400">Chargement des propositions...</div>
      ) : filteredProposals.length === 0 ? (
        <div className="rounded-2xl border border-[#2f3244] bg-[#101522]/70 p-4 text-gray-400">Aucune proposition pour ce filtre.</div>
      ) : (
        <div className="space-y-4">
          {filteredProposals.map((proposal) => (
            <div key={proposal.id} className="rounded-2xl border border-[#353a50] bg-[#121623]/85 p-5 space-y-3 shadow-[0_10px_30px_rgba(2,6,23,0.35)]">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">{proposal.title}</h2>
                  <p className="text-sm text-gray-400">
                    {proposal.category} · {proposal.proposedDate ? new Date(proposal.proposedDate).toLocaleString("fr-FR") : "Date non renseignée"}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full border ${
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

              <p className="text-sm text-gray-200 whitespace-pre-wrap">{proposal.description}</p>

              <div className="text-xs text-gray-400 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  Votes: {proposal.votesCount}
                </span>
                <span>Proposé par: {proposal.proposer.displayName || proposal.proposer.twitchLogin || proposal.proposer.discordId || "Inconnu"}</span>
                <span>Discord ID: {proposal.proposer.discordId || "n/a"}</span>
                <span>Créé le: {new Date(proposal.createdAt).toLocaleString("fr-FR")}</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap pt-1">
                <button
                  onClick={() => updateStatus(proposal.id, "approved", true)}
                  disabled={updatingId === proposal.id}
                  className="px-3 py-2 rounded-lg text-sm font-semibold bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  Approuver + créer événement
                </button>
                <button
                  onClick={() => updateStatus(proposal.id, "approved", false)}
                  disabled={updatingId === proposal.id}
                  className="px-3 py-2 rounded-lg text-sm font-semibold bg-green-600/20 border border-green-500/30 text-green-300 hover:bg-green-600/30 disabled:opacity-50"
                >
                  Approuver sans création
                </button>
                <button
                  onClick={() => updateStatus(proposal.id, "rejected")}
                  disabled={updatingId === proposal.id}
                  className="px-3 py-2 rounded-lg text-sm font-semibold bg-red-600/20 border border-red-500/30 text-red-300 hover:bg-red-600/30 disabled:opacity-50"
                >
                  Refuser
                </button>
                <button
                  onClick={() => updateStatus(proposal.id, "archived")}
                  disabled={updatingId === proposal.id}
                  className="px-3 py-2 rounded-lg text-sm font-semibold bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
                >
                  Archiver
                </button>
                <button
                  onClick={() => updateStatus(proposal.id, "pending")}
                  disabled={updatingId === proposal.id}
                  className="px-3 py-2 rounded-lg text-sm font-semibold bg-yellow-600/20 border border-yellow-500/30 text-yellow-300 hover:bg-yellow-600/30 disabled:opacity-50"
                >
                  Remettre en attente
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

