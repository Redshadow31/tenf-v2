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
    pseudo_twitch?: string;
    age?: number;
    pays_fuseau?: string;
    disponibilites?: string;
    micro_ok?: boolean;
    vocal_reunion?: "oui" | "non" | "parfois";
    role_postule: "moderateur" | "soutien" | "les_deux";
    experience_modo?: boolean;
    experience_details?: string;
    experience_similaire?: string;
    pourquoi_tenf?: string;
    pourquoi_role?: string;
    motivation_560: string;
    niveau_discord?: 1 | 2 | 3 | 4 | 5;
    principes_proportionnalite?: boolean;
    principes_proportionnalite_explication?: string;
    difference_sanctions?: boolean;
    difference_sanctions_exemple?: string;
    redaction_cr?: boolean;
    scenario_critique_staff?: string;
    scenario_clash_vocal?: string;
    scenario_dm_grave?: string;
    scenario_spam_promo?: string;
    scenario_modo_sec?: string;
    scenario_manipulation?: string;
    scenario_intrusif_vocal?: string;
    style_communication?: "direct" | "empathique" | "structure" | "mixte" | "autre";
    style_communication_autre?: string;
    contradiction?: string;
    quand_jai_tort?: string;
    limites_declencheurs?: string;
    prise_de_recul?: string;
    energie_mentale?: 1 | 2 | 3 | 4 | 5;
    periode_impact?: "non" | "oui_legere" | "oui_importante";
    periode_gestion?: string;
    reaction_stress?: string[];
    reaction_stress_autre?: string;
    preference_cadre?: "cadre" | "humain" | "mix";
    preference_cadre_detail?: string;
    passer_relais?: boolean;
    passer_relais_exemple?: string;
    desaccord_staff?: string;
    accepte_pause_retrait?: boolean;
    accepte_pause_retrait_pourquoi?: string;
    accepte_confidentialite?: boolean;
    ami_demande_infos?: string;
    accepte_documenter?: boolean;
    engagement_hebdo?: "2h" | "4h" | "6h" | "variable";
    engagement_hebdo_variable?: string;
    poles_interet?: string[];
    objectif_apprentissage: string;
    consentement_traitement?: boolean;
    comprend_entretien?: boolean;
    commentaire_libre?: string;
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

  function formatBool(value?: boolean): string {
    if (value === true) return "Oui";
    if (value === false) return "Non";
    return "-";
  }

  function formatText(value?: string): string {
    if (!value || !value.trim()) return "-";
    return value;
  }

  function formatList(values?: string[]): string {
    if (!values || values.length === 0) return "-";
    return values.join(", ");
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

  function sanitizeFileName(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();
  }

  function exportFullApplication(application: StaffApplication) {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      application: {
        id: application.id,
        created_at: application.created_at,
        updated_at: application.updated_at,
        applicant_discord_id: application.applicant_discord_id,
        applicant_username: application.applicant_username,
        applicant_avatar: application.applicant_avatar || null,
        role_postule_label: formatRole(application.answers.role_postule),
        admin_status: application.admin_status,
        admin_status_label: formatStatus(application.admin_status),
        has_red_flag: application.has_red_flag,
        red_flags: application.red_flags || [],
        assigned_to: application.assigned_to || null,
        last_contacted_at: application.last_contacted_at || null,
        score: application.score ?? null,
        admin_notes: application.admin_notes || [],
        answers: application.answers,
      },
    };

    const json = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const pseudo = sanitizeFileName(application.answers.pseudo_discord || application.applicant_username || "candidature");
    a.href = url;
    a.download = `fiche-postulation-${pseudo}-${application.id}.json`;
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
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-gray-700">{formatStatus(selected.admin_status)}</span>
                  <button
                    onClick={() => exportFullApplication(selected)}
                    className="text-xs px-3 py-1 rounded bg-indigo-700 hover:bg-indigo-800 font-semibold"
                  >
                    Exporter fiche complète
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <details open className="bg-[#0e0e10] border border-gray-700 rounded-lg p-3">
                  <summary className="cursor-pointer font-semibold text-sm">A) Infos de base</summary>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <p><strong>Pseudo Discord:</strong> {formatText(selected.answers.pseudo_discord)}</p>
                    <p><strong>Pseudo Twitch:</strong> {formatText(selected.answers.pseudo_twitch)}</p>
                    <p><strong>Âge:</strong> {selected.answers.age ?? "-"}</p>
                    <p><strong>Pays/fuseau:</strong> {formatText(selected.answers.pays_fuseau)}</p>
                    <p><strong>Micro OK:</strong> {formatBool(selected.answers.micro_ok)}</p>
                    <p><strong>Vocal réunion:</strong> {selected.answers.vocal_reunion || "-"}</p>
                  </div>
                  <p className="text-sm mt-3 whitespace-pre-wrap"><strong>Disponibilités:</strong> {formatText(selected.answers.disponibilites)}</p>
                </details>

                <details open className="bg-[#0e0e10] border border-gray-700 rounded-lg p-3">
                  <summary className="cursor-pointer font-semibold text-sm">B-C) Rôle demandé et expérience</summary>
                  <div className="mt-3 space-y-2 text-sm">
                    <p><strong>Rôle postulé:</strong> {formatRole(selected.answers.role_postule)}</p>
                    <p><strong>Expérience modération:</strong> {formatBool(selected.answers.experience_modo)}</p>
                    <p className="whitespace-pre-wrap"><strong>Détails expérience:</strong> {formatText(selected.answers.experience_details)}</p>
                    <p className="whitespace-pre-wrap"><strong>Expérience similaire:</strong> {formatText(selected.answers.experience_similaire)}</p>
                    <p className="whitespace-pre-wrap"><strong>Pourquoi TENF:</strong> {formatText(selected.answers.pourquoi_tenf)}</p>
                    <p className="whitespace-pre-wrap"><strong>Pourquoi ce rôle:</strong> {formatText(selected.answers.pourquoi_role)}</p>
                    <p className="whitespace-pre-wrap"><strong>Motivation:</strong> {formatText(selected.answers.motivation_560)}</p>
                  </div>
                </details>

                <details open className="bg-[#0e0e10] border border-gray-700 rounded-lg p-3">
                  <summary className="cursor-pointer font-semibold text-sm">D-E) Compétences et scénarios</summary>
                  <div className="mt-3 space-y-2 text-sm">
                    <p><strong>Niveau Discord:</strong> {selected.answers.niveau_discord ?? "-"}/5</p>
                    <p><strong>Proportionnalité:</strong> {formatBool(selected.answers.principes_proportionnalite)}</p>
                    <p className="whitespace-pre-wrap"><strong>Explication proportionnalité:</strong> {formatText(selected.answers.principes_proportionnalite_explication)}</p>
                    <p><strong>Différence sanctions:</strong> {formatBool(selected.answers.difference_sanctions)}</p>
                    <p className="whitespace-pre-wrap"><strong>Exemple sanctions:</strong> {formatText(selected.answers.difference_sanctions_exemple)}</p>
                    <p><strong>Rédaction CR:</strong> {formatBool(selected.answers.redaction_cr)}</p>
                    <p className="whitespace-pre-wrap"><strong>Scénario critique staff:</strong> {formatText(selected.answers.scenario_critique_staff)}</p>
                    <p className="whitespace-pre-wrap"><strong>Scénario clash vocal:</strong> {formatText(selected.answers.scenario_clash_vocal)}</p>
                    <p className="whitespace-pre-wrap"><strong>Scénario DM grave:</strong> {formatText(selected.answers.scenario_dm_grave)}</p>
                    <p className="whitespace-pre-wrap"><strong>Scénario spam promo:</strong> {formatText(selected.answers.scenario_spam_promo)}</p>
                    <p className="whitespace-pre-wrap"><strong>Scénario modération seul:</strong> {formatText(selected.answers.scenario_modo_sec)}</p>
                    <p className="whitespace-pre-wrap"><strong>Scénario manipulation:</strong> {formatText(selected.answers.scenario_manipulation)}</p>
                    <p className="whitespace-pre-wrap"><strong>Scénario intrusif vocal:</strong> {formatText(selected.answers.scenario_intrusif_vocal)}</p>
                  </div>
                </details>

                <details open className="bg-[#0e0e10] border border-gray-700 rounded-lg p-3">
                  <summary className="cursor-pointer font-semibold text-sm">F-G) Communication et stabilité</summary>
                  <div className="mt-3 space-y-2 text-sm">
                    <p><strong>Style communication:</strong> {selected.answers.style_communication || "-"}</p>
                    <p className="whitespace-pre-wrap"><strong>Style (autre):</strong> {formatText(selected.answers.style_communication_autre)}</p>
                    <p className="whitespace-pre-wrap"><strong>Contradiction:</strong> {formatText(selected.answers.contradiction)}</p>
                    <p className="whitespace-pre-wrap"><strong>Quand j'ai tort:</strong> {formatText(selected.answers.quand_jai_tort)}</p>
                    <p className="whitespace-pre-wrap"><strong>Limites/déclencheurs:</strong> {formatText(selected.answers.limites_declencheurs)}</p>
                    <p className="whitespace-pre-wrap"><strong>Prise de recul:</strong> {formatText(selected.answers.prise_de_recul)}</p>
                    <p><strong>Énergie mentale:</strong> {selected.answers.energie_mentale ?? "-"}/5</p>
                    <p><strong>Période impact:</strong> {selected.answers.periode_impact || "-"}</p>
                    <p className="whitespace-pre-wrap"><strong>Gestion période:</strong> {formatText(selected.answers.periode_gestion)}</p>
                    <p><strong>Réaction stress:</strong> {formatList(selected.answers.reaction_stress)}</p>
                    <p className="whitespace-pre-wrap"><strong>Réaction stress (autre):</strong> {formatText(selected.answers.reaction_stress_autre)}</p>
                    <p><strong>Préférence cadre:</strong> {selected.answers.preference_cadre || "-"}</p>
                    <p className="whitespace-pre-wrap"><strong>Détail cadre:</strong> {formatText(selected.answers.preference_cadre_detail)}</p>
                    <p><strong>Passer relais:</strong> {formatBool(selected.answers.passer_relais)}</p>
                    <p className="whitespace-pre-wrap"><strong>Exemple relais:</strong> {formatText(selected.answers.passer_relais_exemple)}</p>
                    <p className="whitespace-pre-wrap"><strong>Désaccord staff:</strong> {formatText(selected.answers.desaccord_staff)}</p>
                    <p><strong>Accepte pause/retrait:</strong> {formatBool(selected.answers.accepte_pause_retrait)}</p>
                    <p className="whitespace-pre-wrap"><strong>Pourquoi:</strong> {formatText(selected.answers.accepte_pause_retrait_pourquoi)}</p>
                  </div>
                </details>

                <details open className="bg-[#0e0e10] border border-gray-700 rounded-lg p-3">
                  <summary className="cursor-pointer font-semibold text-sm">H-I-J) Confidentialité, engagement, consentements</summary>
                  <div className="mt-3 space-y-2 text-sm">
                    <p><strong>Accepte confidentialité:</strong> {formatBool(selected.answers.accepte_confidentialite)}</p>
                    <p className="whitespace-pre-wrap"><strong>Ami demande infos:</strong> {formatText(selected.answers.ami_demande_infos)}</p>
                    <p><strong>Accepte documenter:</strong> {formatBool(selected.answers.accepte_documenter)}</p>
                    <p><strong>Engagement hebdo:</strong> {selected.answers.engagement_hebdo || "-"}</p>
                    <p className="whitespace-pre-wrap"><strong>Engagement variable:</strong> {formatText(selected.answers.engagement_hebdo_variable)}</p>
                    <p><strong>Pôles intérêt:</strong> {formatList(selected.answers.poles_interet)}</p>
                    <p className="whitespace-pre-wrap"><strong>Objectif apprentissage:</strong> {formatText(selected.answers.objectif_apprentissage)}</p>
                    <p><strong>Consentement traitement:</strong> {formatBool(selected.answers.consentement_traitement)}</p>
                    <p><strong>Comprend entretien:</strong> {formatBool(selected.answers.comprend_entretien)}</p>
                    <p className="whitespace-pre-wrap"><strong>Commentaire libre:</strong> {formatText(selected.answers.commentaire_libre)}</p>
                  </div>
                </details>
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
