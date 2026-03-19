"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";
import AdminToastStack, { type AdminToastItem } from "@/components/admin/ui/AdminToastStack";
import AdminTableShell from "@/components/admin/ui/AdminTableShell";
import { isFounder } from "@/lib/adminRoles";
import { CheckCircle2, MessageSquare, ShieldCheck, Star } from "lucide-react";

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

type AdminReviewComment = {
  at: string;
  author: string;
  authorId?: string;
  message: string;
};

type AdminReviewOpinion = {
  at: string;
  author: string;
  authorId?: string;
  roleTarget: "moderateur" | "soutien" | "les_deux" | "reserve";
  answerRating: 1 | 2 | 3 | 4 | 5;
  message: string;
};

type FounderFinalDecision = {
  at: string;
  author: string;
  authorId?: string;
  outcome: "soutien_tenf" | "moderateur_formation" | "candidature_refusee";
  memberMessage: string;
  summary?: string;
};

const COMMENT_PREFIX = "__TENF_REVIEW_COMMENT__";
const OPINION_PREFIX = "__TENF_REVIEW_OPINION__";
const FINAL_DECISION_PREFIX = "__TENF_FINAL_DECISION__";

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
  const [toasts, setToasts] = useState<AdminToastItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [savedViews, setSavedViews] = useState<Array<{
    id: string;
    name: string;
    search: string;
    roleFilter: "all" | "moderateur" | "soutien" | "les_deux";
    statusFilter: "all" | StaffApplication["admin_status"];
  }>>([]);
  const [selectedSavedViewId, setSelectedSavedViewId] = useState("");
  const [newSavedViewName, setNewSavedViewName] = useState("");
  const [commentInput, setCommentInput] = useState("");
  const [opinionInput, setOpinionInput] = useState("");
  const [opinionRoleTarget, setOpinionRoleTarget] = useState<AdminReviewOpinion["roleTarget"]>("reserve");
  const [opinionAnswerRating, setOpinionAnswerRating] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [finalDecisionInput, setFinalDecisionInput] = useState("");
  const [finalDecisionOutcome, setFinalDecisionOutcome] = useState<FounderFinalDecision["outcome"]>("soutien_tenf");
  const [finalDecisionMemberMessage, setFinalDecisionMemberMessage] = useState("");

  const SAVED_VIEWS_KEY = "tenf-admin-postulations-saved-views";

  function pushToast(type: "success" | "warning" | "info", title: string, description?: string) {
    const toast: AdminToastItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      title,
      description,
    };
    setToasts((prev) => [...prev, toast]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== toast.id));
    }, 3500);
  }

  function parseStructuredAdminNotes(notes: string[] | undefined): {
    plainNotes: string[];
    comments: AdminReviewComment[];
    opinions: AdminReviewOpinion[];
    finalDecisions: FounderFinalDecision[];
  } {
    const plainNotes: string[] = [];
    const comments: AdminReviewComment[] = [];
    const opinions: AdminReviewOpinion[] = [];
    const finalDecisions: FounderFinalDecision[] = [];

    for (const raw of notes || []) {
      if (raw.startsWith(COMMENT_PREFIX)) {
        try {
          const parsed = JSON.parse(raw.slice(COMMENT_PREFIX.length)) as AdminReviewComment;
          if (parsed?.message) comments.push(parsed);
          continue;
        } catch {
          plainNotes.push(raw);
          continue;
        }
      }
      if (raw.startsWith(OPINION_PREFIX)) {
        try {
          const parsed = JSON.parse(raw.slice(OPINION_PREFIX.length)) as AdminReviewOpinion;
          if (parsed?.message) opinions.push(parsed);
          continue;
        } catch {
          plainNotes.push(raw);
          continue;
        }
      }
      if (raw.startsWith(FINAL_DECISION_PREFIX)) {
        try {
          const parsed = JSON.parse(raw.slice(FINAL_DECISION_PREFIX.length)) as FounderFinalDecision;
          if (parsed?.memberMessage) finalDecisions.push(parsed);
          continue;
        } catch {
          plainNotes.push(raw);
          continue;
        }
      }
      plainNotes.push(raw);
    }

    comments.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
    opinions.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
    finalDecisions.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

    return { plainNotes, comments, opinions, finalDecisions };
  }

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
        if (!roleData.hasAdminAccess || !roleData.hasAdvancedAccess) {
          window.location.href = "/unauthorized?reason=advanced-admin";
          return;
        }

        setCurrentAdmin({
          id: user.id,
          username: user.username,
          isFounder: isFounder(user.id),
        });
      } catch {
        window.location.href = "/unauthorized?reason=advanced-admin";
      }
    }

    loadAdmin();
  }, []);

  useEffect(() => {
    if (!currentAdmin) return;
    void loadApplications();
  }, [currentAdmin?.id]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_VIEWS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setSavedViews(parsed);
    } catch {
      // Ignore malformed localStorage values.
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, statusFilter, dateFilter]);

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
      pushToast("warning", "Mise à jour impossible", error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setSavingId(null);
    }
  }

  function saveViewsToStorage(nextViews: typeof savedViews) {
    setSavedViews(nextViews);
    localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(nextViews));
  }

  function saveCurrentView() {
    if (!newSavedViewName.trim()) {
      pushToast("warning", "Nom requis", "Ajoute un nom avant d'enregistrer la vue.");
      return;
    }
    const next = [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: newSavedViewName.trim(),
        search,
        roleFilter,
        statusFilter,
      },
      ...savedViews,
    ].slice(0, 20);
    saveViewsToStorage(next);
    setSelectedSavedViewId(next[0].id);
    setNewSavedViewName("");
    pushToast("success", "Vue sauvegardée");
  }

  function applySavedView(viewId: string) {
    setSelectedSavedViewId(viewId);
    const found = savedViews.find((v) => v.id === viewId);
    if (!found) return;
    setSearch(found.search);
    setRoleFilter(found.roleFilter);
    setStatusFilter(found.statusFilter);
    pushToast("info", "Vue appliquée", found.name);
  }

  function deleteSavedView(viewId: string) {
    const next = savedViews.filter((v) => v.id !== viewId);
    saveViewsToStorage(next);
    if (selectedSavedViewId === viewId) setSelectedSavedViewId("");
    pushToast("info", "Vue supprimée");
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

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const selected = filtered.find((item) => item.id === selectedId) || filtered[0] || null;
  const dashboardStats = useMemo(() => {
    const total = applications.length;
    const open = applications.filter((a) => ["nouveau", "a_contacter", "entretien_prevu"].includes(a.admin_status)).length;
    const accepted = applications.filter((a) => a.admin_status === "accepte").length;
    const flagged = applications.filter((a) => a.has_red_flag).length;
    return { total, open, accepted, flagged };
  }, [applications]);
  const selectedNotes = useMemo(
    () => parseStructuredAdminNotes(selected?.admin_notes || []),
    [selected?.id, selected?.admin_notes]
  );

  useEffect(() => {
    if (!selected) return;
    setAssignedToInput(selected.assigned_to || "");
    setLastContactedInput(selected.last_contacted_at ? selected.last_contacted_at.slice(0, 10) : "");
    setNoteInput("");
    setCommentInput("");
    setOpinionInput("");
    setFinalDecisionInput("");
    setFinalDecisionMemberMessage("");
    setFinalDecisionOutcome("soutien_tenf");
  }, [selected?.id]);

  function roleTrackTitle(role: StaffApplication["answers"]["role_postule"]): string {
    if (role === "moderateur") return "Parcours Modérateur";
    if (role === "soutien") return "Parcours Soutien TENF";
    return "Parcours Mixte (Modération + Soutien)";
  }

  function opinionRoleLabel(value: AdminReviewOpinion["roleTarget"]): string {
    if (value === "moderateur") return "Oriented Modérateur";
    if (value === "soutien") return "Oriented Soutien";
    if (value === "les_deux") return "Oriented Les deux";
    return "Réserve / à revalider";
  }

  function finalOutcomeLabel(value: FounderFinalDecision["outcome"]): string {
    if (value === "soutien_tenf") return "Soutien TENF";
    if (value === "moderateur_formation") return "Moderateur en formation";
    return "Candidature refusee";
  }

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
      <AdminToastStack
        toasts={toasts}
        onClose={(id) => setToasts((prev) => prev.filter((item) => item.id !== id))}
      />
      <Link href="/admin/membres/gestion" className="text-gray-400 hover:text-white inline-block mb-4">
        ← Retour gestion membres
      </Link>
      <section className="mb-6 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-[#20132e] to-[#121318] p-5">
        <h1 className="text-2xl md:text-3xl font-bold">Postulations Modérateur / Soutien TENF</h1>
        <p className="mt-1 text-sm text-gray-300">
          Relecture ciblee par poste, discussion interne admin avance, puis decision finale fondateurs.
        </p>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="rounded-lg border border-gray-700 bg-[#0e0e10] px-3 py-2">
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-lg font-bold">{dashboardStats.total}</p>
          </div>
          <div className="rounded-lg border border-blue-700/40 bg-[#0d1220] px-3 py-2">
            <p className="text-xs text-blue-300">En cours</p>
            <p className="text-lg font-bold text-blue-200">{dashboardStats.open}</p>
          </div>
          <div className="rounded-lg border border-green-700/40 bg-[#0d1b15] px-3 py-2">
            <p className="text-xs text-green-300">Acceptes</p>
            <p className="text-lg font-bold text-green-200">{dashboardStats.accepted}</p>
          </div>
          <div className="rounded-lg border border-red-700/40 bg-[#1b0f12] px-3 py-2">
            <p className="text-xs text-red-300">Red flags</p>
            <p className="text-lg font-bold text-red-200">{dashboardStats.flagged}</p>
          </div>
        </div>
      </section>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
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

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={selectedSavedViewId}
          onChange={(e) => applySavedView(e.target.value)}
          className="bg-[#1a1a1d] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="">Vues sauvegardées</option>
          {savedViews.map((view) => (
            <option key={view.id} value={view.id}>
              {view.name}
            </option>
          ))}
        </select>
        <input
          value={newSavedViewName}
          onChange={(e) => setNewSavedViewName(e.target.value)}
          placeholder="Nom de vue"
          className="bg-[#1a1a1d] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
        />
        <button onClick={saveCurrentView} className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-lg text-sm font-semibold">
          Sauver vue
        </button>
        {selectedSavedViewId && (
          <button
            onClick={() => deleteSavedView(selectedSavedViewId)}
            className="bg-red-600/20 hover:bg-red-600/30 text-red-300 px-3 py-2 rounded-lg text-sm font-semibold"
          >
            Suppr vue
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-6 text-gray-400">Aucune postulation pour ces filtres.</div>
          ) : (
            <AdminTableShell
              title="Liste des postulations"
              subtitle="Table standardisée avec pagination"
              searchValue={search}
              onSearchChange={setSearch}
              page={currentPage}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => setPageSize(size)}
              searchPlaceholder="Filtrer pseudo..."
            >
              <div className="divide-y divide-gray-700">
              {paginated.map((application) => (
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
            </AdminTableShell>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <article className="rounded-lg border border-gray-700 bg-[#101116] p-3">
                  <p className="text-xs uppercase tracking-wide text-purple-300 mb-2">{roleTrackTitle(selected.answers.role_postule)}</p>
                  <p className="text-sm text-gray-300"><strong>Pourquoi TENF:</strong> {formatText(selected.answers.pourquoi_tenf)}</p>
                  <p className="text-sm text-gray-300 mt-2"><strong>Pourquoi ce poste:</strong> {formatText(selected.answers.pourquoi_role)}</p>
                  <p className="text-sm text-gray-300 mt-2"><strong>Motivation:</strong> {formatText(selected.answers.motivation_560)}</p>
                </article>
                <article className="rounded-lg border border-gray-700 bg-[#101116] p-3">
                  <p className="text-xs uppercase tracking-wide text-blue-300 mb-2">Profil candidat</p>
                  <div className="space-y-1 text-sm text-gray-300">
                    <p><strong>Pseudo Twitch:</strong> {formatText(selected.answers.pseudo_twitch)}</p>
                    <p><strong>Age:</strong> {selected.answers.age ?? "-"}</p>
                    <p><strong>Pays/fuseau:</strong> {formatText(selected.answers.pays_fuseau)}</p>
                    <p><strong>Disponibilites:</strong> {formatText(selected.answers.disponibilites)}</p>
                    <p><strong>Engagement hebdo:</strong> {selected.answers.engagement_hebdo || "-"}</p>
                  </div>
                </article>
              </div>

              {(selected.answers.role_postule === "moderateur" || selected.answers.role_postule === "les_deux") ? (
                <article className="rounded-lg border border-indigo-700/50 bg-[#0f1020] p-3">
                  <p className="text-xs uppercase tracking-wide text-indigo-300 mb-2">Lecture ciblee moderation</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-300">
                    <p><strong>Niveau Discord:</strong> {selected.answers.niveau_discord ?? "-"}/5</p>
                    <p><strong>Proportionnalite:</strong> {formatBool(selected.answers.principes_proportionnalite)}</p>
                    <p><strong>Difference sanctions:</strong> {formatBool(selected.answers.difference_sanctions)}</p>
                    <p><strong>Redaction CR:</strong> {formatBool(selected.answers.redaction_cr)}</p>
                    <p className="md:col-span-2"><strong>Scenario clash vocal:</strong> {formatText(selected.answers.scenario_clash_vocal)}</p>
                    <p className="md:col-span-2"><strong>Scenario DM grave:</strong> {formatText(selected.answers.scenario_dm_grave)}</p>
                    <p className="md:col-span-2"><strong>Scenario manipulation:</strong> {formatText(selected.answers.scenario_manipulation)}</p>
                  </div>
                </article>
              ) : (
                <article className="rounded-lg border border-emerald-700/50 bg-[#0c1715] p-3">
                  <p className="text-xs uppercase tracking-wide text-emerald-300 mb-2">Lecture ciblee soutien</p>
                  <div className="space-y-1 text-sm text-gray-300">
                    <p><strong>Pôles d'interet:</strong> {formatList(selected.answers.poles_interet)}</p>
                    <p><strong>Objectif apprentissage:</strong> {formatText(selected.answers.objectif_apprentissage)}</p>
                    <p><strong>Style communication:</strong> {selected.answers.style_communication || "-"}</p>
                    <p><strong>Commentaire libre:</strong> {formatText(selected.answers.commentaire_libre)}</p>
                  </div>
                </article>
              )}

              <div className="border-t border-gray-700 pt-4 space-y-4">
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
                  placeholder={
                    selected.answers.role_postule === "soutien"
                      ? "Note interne orientee Soutien (qualite relationnelle, disponibilite, engagement communautaire)..."
                      : selected.answers.role_postule === "moderateur"
                      ? "Note interne orientee Moderation (gestion de conflit, discernement, rigueur de cadre)..."
                      : "Note interne orientee Mixte (moderation + soutien, points forts/faibles)..."
                  }
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

                <section className="rounded-lg border border-sky-700/40 bg-[#0c131a] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-sky-300" />
                    <p className="text-sm font-semibold text-sky-200">Commentaires admins avances (interne)</p>
                  </div>
                  <textarea
                    rows={3}
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Ton commentaire visible uniquement par les admins avances..."
                    className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-3 py-2 text-white"
                  />
                  <button
                    onClick={async () => {
                      const payload: AdminReviewComment = {
                        at: new Date().toISOString(),
                        author: currentAdmin?.username || "Admin",
                        authorId: currentAdmin?.id,
                        message: commentInput.trim(),
                      };
                      await updateApplication(selected.id, { adminNote: `${COMMENT_PREFIX}${JSON.stringify(payload)}` });
                      setCommentInput("");
                    }}
                    disabled={savingId === selected.id || !commentInput.trim()}
                    className="mt-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    Publier commentaire
                  </button>
                  <div className="mt-3 space-y-2 max-h-44 overflow-y-auto">
                    {selectedNotes.comments.length === 0 ? (
                      <p className="text-xs text-gray-400">Aucun commentaire avance pour le moment.</p>
                    ) : (
                      selectedNotes.comments.map((entry, index) => (
                        <div key={`comment-${index}-${entry.at}`} className="rounded border border-gray-700 bg-[#0d1015] p-2">
                          <p className="text-xs text-sky-300 font-semibold">{entry.author} · {new Date(entry.at).toLocaleString("fr-FR")}</p>
                          <p className="text-sm text-gray-200 whitespace-pre-wrap mt-1">{entry.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="rounded-lg border border-violet-700/40 bg-[#130d1a] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-violet-300" />
                    <p className="text-sm font-semibold text-violet-200">Avis individuel sur reponse et role envisage</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <select
                      value={opinionRoleTarget}
                      onChange={(e) => setOpinionRoleTarget(e.target.value as AdminReviewOpinion["roleTarget"])}
                      className="bg-[#0e0e10] border border-gray-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="reserve">Reserve / a revalider</option>
                      <option value="moderateur">Orientation moderateur</option>
                      <option value="soutien">Orientation soutien</option>
                      <option value="les_deux">Orientation les deux</option>
                    </select>
                    <select
                      value={opinionAnswerRating}
                      onChange={(e) => setOpinionAnswerRating(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                      className="bg-[#0e0e10] border border-gray-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value={1}>Qualite reponses: 1/5</option>
                      <option value={2}>Qualite reponses: 2/5</option>
                      <option value={3}>Qualite reponses: 3/5</option>
                      <option value={4}>Qualite reponses: 4/5</option>
                      <option value={5}>Qualite reponses: 5/5</option>
                    </select>
                  </div>
                  <textarea
                    rows={3}
                    value={opinionInput}
                    onChange={(e) => setOpinionInput(e.target.value)}
                    placeholder="Explique ton avis sur la candidature et le role conseille..."
                    className="w-full mt-2 bg-[#0e0e10] border border-gray-700 rounded-lg px-3 py-2 text-white"
                  />
                  <button
                    onClick={async () => {
                      const payload: AdminReviewOpinion = {
                        at: new Date().toISOString(),
                        author: currentAdmin?.username || "Admin",
                        authorId: currentAdmin?.id,
                        roleTarget: opinionRoleTarget,
                        answerRating: opinionAnswerRating,
                        message: opinionInput.trim(),
                      };
                      await updateApplication(selected.id, { adminNote: `${OPINION_PREFIX}${JSON.stringify(payload)}` });
                      setOpinionInput("");
                    }}
                    disabled={savingId === selected.id || !opinionInput.trim()}
                    className="mt-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    Publier avis
                  </button>
                  <div className="mt-3 space-y-2 max-h-44 overflow-y-auto">
                    {selectedNotes.opinions.length === 0 ? (
                      <p className="text-xs text-gray-400">Aucun avis poste.</p>
                    ) : (
                      selectedNotes.opinions.map((entry, index) => (
                        <div key={`opinion-${index}-${entry.at}`} className="rounded border border-gray-700 bg-[#0f0e14] p-2">
                          <p className="text-xs text-violet-300 font-semibold">
                            {entry.author} · {new Date(entry.at).toLocaleString("fr-FR")}
                          </p>
                          <p className="text-xs text-gray-300 mt-0.5">
                            {opinionRoleLabel(entry.roleTarget)} · Qualite reponses: {entry.answerRating}/5
                          </p>
                          <p className="text-sm text-gray-200 whitespace-pre-wrap mt-1">{entry.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="rounded-lg border border-amber-700/40 bg-[#191209] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                    <p className="text-sm font-semibold text-amber-200">Bloc solution finale (decision fondateurs)</p>
                  </div>
                  {currentAdmin?.isFounder ? (
                    <>
                      <select
                        value={finalDecisionOutcome}
                        onChange={(e) => setFinalDecisionOutcome(e.target.value as FounderFinalDecision["outcome"])}
                        className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="soutien_tenf">Decision: Soutien TENF</option>
                        <option value="moderateur_formation">Decision: Moderateur en formation</option>
                        <option value="candidature_refusee">Decision: Candidature refusee</option>
                      </select>
                      <textarea
                        rows={3}
                        value={finalDecisionMemberMessage}
                        onChange={(e) => setFinalDecisionMemberMessage(e.target.value)}
                        placeholder="Message visible par le membre dans son espace postulation..."
                        className="mt-2 w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      />
                      <textarea
                        rows={3}
                        value={finalDecisionInput}
                        onChange={(e) => setFinalDecisionInput(e.target.value)}
                        placeholder="Note interne fondateur (optionnel, non visible membre)..."
                        className="mt-2 w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      />
                      <button
                        onClick={async () => {
                          const payload: FounderFinalDecision = {
                            at: new Date().toISOString(),
                            author: currentAdmin?.username || "Fondateur",
                            authorId: currentAdmin?.id,
                            outcome: finalDecisionOutcome,
                            memberMessage: finalDecisionMemberMessage.trim(),
                            summary: finalDecisionInput.trim() || undefined,
                          };
                          await updateApplication(selected.id, {
                            adminStatus:
                              finalDecisionOutcome === "candidature_refusee" ? "refuse" : "accepte",
                            adminNote: `${FINAL_DECISION_PREFIX}${JSON.stringify(payload)}`,
                          });
                          setFinalDecisionInput("");
                          setFinalDecisionMemberMessage("");
                        }}
                        disabled={savingId === selected.id || !finalDecisionMemberMessage.trim()}
                        className="mt-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 px-4 py-2 rounded-lg text-sm font-semibold"
                      >
                        Valider decision finale
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-amber-300/80">Edition reservee aux fondateurs.</p>
                  )}
                  <div className="mt-3 space-y-2 max-h-44 overflow-y-auto">
                    {selectedNotes.finalDecisions.length === 0 ? (
                      <p className="text-xs text-gray-400">Aucune decision finale enregistree.</p>
                    ) : (
                      selectedNotes.finalDecisions.map((entry, index) => (
                        <div key={`final-${index}-${entry.at}`} className="rounded border border-amber-800/60 bg-[#1a140d] p-2">
                          <p className="text-xs text-amber-300 font-semibold">
                            <CheckCircle2 className="w-3 h-3 inline mr-1" />
                            {entry.author} · {new Date(entry.at).toLocaleString("fr-FR")}
                          </p>
                          <p className="text-xs text-amber-200 mt-1">Choix: {finalOutcomeLabel(entry.outcome)}</p>
                          <p className="text-sm text-gray-100 whitespace-pre-wrap mt-1">{entry.memberMessage}</p>
                          {entry.summary ? (
                            <p className="text-xs text-gray-300 whitespace-pre-wrap mt-1">
                              Note interne: {entry.summary}
                            </p>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {selectedNotes.plainNotes.length > 0 && (
                  <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <p className="text-xs text-gray-400 mb-2">Notes internes legacy</p>
                    <div className="space-y-2">
                      {selectedNotes.plainNotes.map((note, i) => (
                        <p key={`${selected.id}-note-plain-${i}`} className="text-sm text-gray-200 whitespace-pre-wrap">
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
