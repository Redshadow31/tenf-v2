"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";
import { isFounder } from "@/lib/admin";

type StaffApplication = {
  id: string;
  created_at: string;
  updated_at: string;
  applicant_discord_id: string;
  applicant_username: string;
  applicant_avatar?: string | null;
  answers: {
    pseudo_discord: string;
    role_postule: "moderateur" | "soutien" | "les_deux";
    motivation_560: string;
    disponibilites: string;
    pseudo_twitch?: string;
    pays_fuseau: string;
    objectif_apprentissage: string;
  };
  admin_status: "nouveau" | "a_contacter" | "entretien_prevu" | "accepte" | "refuse" | "archive";
  admin_notes: string[];
  red_flags: string[];
  has_red_flag: boolean;
  assigned_to?: string;
  last_contacted_at?: string;
  score?: number;
};

export default function PostulationsStaffPage() {
  const [applications, setApplications] = useState<StaffApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; username: string; isFounder: boolean } | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "moderateur" | "soutien" | "les_deux">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | StaffApplication["admin_status"]>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [assignedToInput, setAssignedToInput] = useState("");
  const [lastContactedInput, setLastContactedInput] = useState("");

  useEffect(() => {
    async function loadAdmin() {
      const user = await getDiscordUser();
      if (!user) {
        window.location.href = "/auth/login?redirect=/admin/membres/postulations";
        return;
      }

      try {
        const roleResponse = await fetch("/api/user/role");
        const roleData = await roleResponse.json();
        if (!roleData.hasAdminAccess) {
          window.location.href = "/unauthorized";
          return;
        }

        const isAdminRole = roleData.role === "Admin";
        const isAdminAdjoint = roleData.role === "Admin Adjoint";
        const founderStatus = isFounder(user.id);
        setCurrentAdmin({
          id: user.id,
          username: user.username,
          isFounder: founderStatus || isAdminRole || isAdminAdjoint,
        });
      } catch {
        window.location.href = "/unauthorized";
      }
    }

    loadAdmin();
  }, []);

  useEffect(() => {
    if (!currentAdmin) return;
    void loadApplications();
  }, [currentAdmin?.id]);

  async function loadApplications() {
    try {
      setLoading(true);
      const response = await fetch("/api/staff-applications", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!response.ok) {
        throw new Error("Erreur chargement");
      }
      const data = await response.json();
      setApplications(data.applications || []);
      if (!selectedId && (data.applications || []).length > 0) {
        setSelectedId(data.applications[0].id);
      }
    } catch (error) {
      console.error("Erreur chargement postulations:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateApplication(
    id: string,
    payload: {
      adminStatus?: StaffApplication["admin_status"];
      adminNote?: string;
      hasRedFlag?: boolean;
      redFlagLabel?: string;
      assignedTo?: string;
      lastContactedAt?: string;
    }
  ) {
    try {
      setSavingId(id);
      const response = await fetch("/api/staff-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          ...payload,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erreur review");
      }
      await loadApplications();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setSavingId(null);
    }
  }

  function formatRole(role: StaffApplication["answers"]["role_postule"]): string {
    if (role === "moderateur") return "Modérateur";
    if (role === "soutien") return "Soutien TENF";
    return "Les deux";
  }

  function formatStatus(status: StaffApplication["admin_status"]): string {
    const map: Record<StaffApplication["admin_status"], string> = {
      nouveau: "Nouveau",
      a_contacter: "À contacter",
      entretien_prevu: "Entretien prévu",
      accepte: "Accepté",
      refuse: "Refusé",
      archive: "Archivé",
    };
    return map[status];
  }

  const filtered = applications.filter((item) => {
    if (roleFilter !== "all" && item.answers.role_postule !== roleFilter) return false;
    if (statusFilter !== "all" && item.admin_status !== statusFilter) return false;
    if (dateFilter && item.created_at.slice(0, 10) !== dateFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (
        !item.answers.pseudo_discord.toLowerCase().includes(q) &&
        !item.applicant_username.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const selected = filtered.find((item) => item.id === selectedId) || filtered[0] || null;

  function exportCsv() {
    const headers = ["date", "pseudo_discord", "role", "statut", "score"];
    const lines = filtered.map((item) =>
      [
        item.created_at,
        item.answers.pseudo_discord,
        formatRole(item.answers.role_postule),
        formatStatus(item.admin_status),
        item.score ?? "",
      ]
        .map((v) => `"${String(v).replaceAll('"', '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `postulations-tenf-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white p-8">
      <Link href="/admin/membres/gestion" className="text-gray-400 hover:text-white inline-block mb-4">
        ← Retour gestion membres
      </Link>
      <h1 className="text-3xl font-bold mb-6">Postulations Modérateur / Soutien TENF</h1>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Recherche pseudo..."
          className="bg-[#1a1a1d] border border-gray-700 rounded-lg px-3 py-2 text-white"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
          className="bg-[#1a1a1d] border border-gray-700 rounded-lg px-3 py-2 text-white"
        >
          <option value="all">Tous rôles</option>
          <option value="moderateur">Modérateur</option>
          <option value="soutien">Soutien TENF</option>
          <option value="les_deux">Les deux</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="bg-[#1a1a1d] border border-gray-700 rounded-lg px-3 py-2 text-white"
        >
          <option value="all">Tous statuts</option>
          <option value="nouveau">Nouveau</option>
          <option value="a_contacter">À contacter</option>
          <option value="entretien_prevu">Entretien prévu</option>
          <option value="accepte">Accepté</option>
          <option value="refuse">Refusé</option>
          <option value="archive">Archivé</option>
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="bg-[#1a1a1d] border border-gray-700 rounded-lg px-3 py-2 text-white"
        />
        <button
          onClick={exportCsv}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-2 font-semibold"
        >
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-6 text-gray-400">Aucune postulation pour ces filtres.</div>
          ) : (
            <div className="divide-y divide-gray-700">
              {filtered.map((application) => (
                <button
                  key={application.id}
                  onClick={() => setSelectedId(application.id)}
                  className={`w-full text-left p-4 transition-colors ${
                    selected?.id === application.id ? "bg-[#2a1740]" : "hover:bg-[#222225]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{application.answers.pseudo_discord}</p>
                      <p className="text-xs text-gray-400">
                        {formatRole(application.answers.role_postule)} · {new Date(application.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-gray-700">{formatStatus(application.admin_status)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-5">
          {!selected ? (
            <p className="text-gray-400">Sélectionne une postulation pour voir le détail.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{selected.answers.pseudo_discord}</h2>
                  <p className="text-xs text-gray-400">
                    {formatRole(selected.answers.role_postule)} · {new Date(selected.created_at).toLocaleString("fr-FR")}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-gray-700">{formatStatus(selected.admin_status)}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <p><strong>Pseudo Twitch:</strong> {selected.answers.pseudo_twitch || "-"}</p>
                <p><strong>Pays/fuseau:</strong> {selected.answers.pays_fuseau}</p>
                <p><strong>Disponibilités:</strong> {selected.answers.disponibilites}</p>
                <p><strong>Objectif:</strong> {selected.answers.objectif_apprentissage}</p>
              </div>

              <div>
                <p className="text-sm font-semibold mb-1">Motivation</p>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{selected.answers.motivation_560}</p>
              </div>

              <div className="border-t border-gray-700 pt-4 space-y-3">
                <label className="block text-sm text-gray-300">Statut</label>
                <select
                  value={selected.admin_status}
                  onChange={(e) =>
                    void updateApplication(selected.id, {
                      adminStatus: e.target.value as StaffApplication["admin_status"],
                    })
                  }
                  disabled={savingId === selected.id}
                  className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="nouveau">Nouveau</option>
                  <option value="a_contacter">À contacter</option>
                  <option value="entretien_prevu">Entretien prévu</option>
                  <option value="accepte">Accepté</option>
                  <option value="refuse">Refusé</option>
                  <option value="archive">Archivé</option>
                </select>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={assignedToInput}
                    onChange={(e) => setAssignedToInput(e.target.value)}
                    placeholder="Assigné à (optionnel)"
                    className="bg-[#0e0e10] border border-gray-700 rounded-lg px-3 py-2 text-white"
                  />
                  <input
                    type="date"
                    value={lastContactedInput}
                    onChange={(e) => setLastContactedInput(e.target.value)}
                    className="bg-[#0e0e10] border border-gray-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <button
                  onClick={() =>
                    void updateApplication(selected.id, {
                      assignedTo: assignedToInput,
                      lastContactedAt: lastContactedInput ? new Date(lastContactedInput).toISOString() : "",
                    })
                  }
                  disabled={savingId === selected.id}
                  className="bg-gray-700 hover:bg-gray-600 disabled:opacity-60 px-4 py-2 rounded-lg text-sm"
                >
                  Mettre à jour suivi
                </button>

                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={selected.has_red_flag}
                    onChange={(e) =>
                      void updateApplication(selected.id, {
                        hasRedFlag: e.target.checked,
                        redFlagLabel: "Red flag manuel",
                      })
                    }
                  />
                  Tag red flag
                </label>
                {selected.has_red_flag && (
                  <p className="text-xs text-red-300">⚠️ Candidature marquée red flag</p>
                )}

                <textarea
                  rows={3}
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Ajouter une note interne admin..."
                  className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
                <button
                  onClick={async () => {
                    await updateApplication(selected.id, { adminNote: noteInput });
                    setNoteInput("");
                  }}
                  disabled={savingId === selected.id || !noteInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  Ajouter note
                </button>

                {selected.admin_notes.length > 0 && (
                  <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <p className="text-xs text-gray-400 mb-2">Notes internes</p>
                    <div className="space-y-2">
                      {selected.admin_notes.map((note, i) => (
                        <p key={`${selected.id}-note-${i}`} className="text-sm text-gray-200 whitespace-pre-wrap">
                          - {note}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => void updateApplication(selected.id, { adminStatus: "archive" })}
                  disabled={savingId === selected.id}
                  className="bg-yellow-700 hover:bg-yellow-800 disabled:opacity-60 px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  Archiver
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
