"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

export default function AdminEventProposalsPage() {
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<AdminProposal[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  return (
    <div className="text-white space-y-6">
      <div>
        <Link href="/admin/events" className="text-gray-400 hover:text-white transition-colors inline-block mb-3">
          ← Retour au hub événements
        </Link>
        <h1 className="text-3xl font-bold">Événements proposés</h1>
        <p className="text-gray-400 mt-1">Modération des propositions soumises depuis `events2`.</p>
      </div>

      {message && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-900/20 text-blue-200 px-4 py-3 text-sm">{message}</div>
      )}

      {loading ? (
        <div className="text-gray-400">Chargement des propositions...</div>
      ) : proposals.length === 0 ? (
        <div className="text-gray-400">Aucune proposition pour le moment.</div>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <div key={proposal.id} className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-5 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-xl font-semibold">{proposal.title}</h2>
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
                <span>Votes: {proposal.votesCount}</span>
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

