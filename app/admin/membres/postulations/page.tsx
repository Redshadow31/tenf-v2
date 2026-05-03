"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";
import { discordAvatarUrl } from "@/lib/discordAvatarUrl";
import AdminToastStack, { type AdminToastItem } from "@/components/admin/ui/AdminToastStack";
import AdminTableShell from "@/components/admin/ui/AdminTableShell";
import { isFounder } from "@/lib/adminRoles";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Flag,
  Gauge,
  HeartHandshake,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

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
const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0b10]";
const heroShellClass =
  "relative overflow-hidden rounded-3xl border border-indigo-400/25 bg-[linear-gradient(155deg,rgba(99,102,241,0.14),rgba(14,15,23,0.92)_38%,rgba(11,13,20,0.97))] shadow-[0_24px_70px_rgba(2,6,23,0.55)] backdrop-blur-xl";

const PIPELINE_LABELS = ["Réception", "Contact", "Entretien", "Décision"] as const;

function statusBadgeStyles(status: StaffApplication["admin_status"]): string {
  switch (status) {
    case "nouveau":
      return "border-sky-400/45 bg-sky-500/15 text-sky-100";
    case "a_contacter":
      return "border-amber-400/45 bg-amber-500/12 text-amber-100";
    case "entretien_prevu":
      return "border-violet-400/45 bg-violet-500/15 text-violet-100";
    case "accepte":
      return "border-emerald-400/45 bg-emerald-500/15 text-emerald-100";
    case "refuse":
      return "border-rose-400/45 bg-rose-500/12 text-rose-100";
    case "archive":
      return "border-slate-500/40 bg-slate-600/15 text-slate-200";
    default:
      return "border-white/15 bg-white/5 text-slate-200";
  }
}

function pipelineStepIndex(status: StaffApplication["admin_status"]): number {
  if (status === "refuse" || status === "archive") return 3;
  const order = ["nouveau", "a_contacter", "entretien_prevu", "accepte"] as const;
  const i = order.indexOf(status as (typeof order)[number]);
  return i >= 0 ? i : 0;
}

function pipelineDecisionTone(
  status: StaffApplication["admin_status"]
): "progress" | "ok" | "ko" | "archived" {
  if (status === "accepte") return "ok";
  if (status === "refuse") return "ko";
  if (status === "archive") return "archived";
  return "progress";
}

export default function PostulationsStaffPage() {
  const [applications, setApplications] = useState<StaffApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; username: string; isFounder: boolean } | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "moderateur" | "soutien" | "les_deux">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | StaffApplication["admin_status"]>("all");
  const [flagsOnly, setFlagsOnly] = useState(false);
  const [openPipelineOnly, setOpenPipelineOnly] = useState(false);
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
  const [workspaceTab, setWorkspaceTab] = useState<"candidat" | "equipe">("candidat");

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
  }, [search, roleFilter, statusFilter, dateFilter, flagsOnly, openPipelineOnly]);

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
    if (flagsOnly && !item.has_red_flag) return false;
    if (
      openPipelineOnly &&
      !["nouveau", "a_contacter", "entretien_prevu"].includes(item.admin_status)
    ) {
      return false;
    }
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
  const selectedAvatarSrc = selected
    ? discordAvatarUrl(selected.applicant_discord_id, selected.applicant_avatar)
    : null;
  const dashboardStats = useMemo(() => {
    const total = applications.length;
    const open = applications.filter((a) => ["nouveau", "a_contacter", "entretien_prevu"].includes(a.admin_status)).length;
    const accepted = applications.filter((a) => a.admin_status === "accepte").length;
    const flagged = applications.filter((a) => a.has_red_flag).length;
    return { total, open, accepted, flagged };
  }, [applications]);
  const operationalStats = useMemo(() => {
    const now = Date.now();
    const last7Days = now - 7 * 24 * 60 * 60 * 1000;
    const recent = applications.filter((a) => new Date(a.created_at).getTime() >= last7Days).length;
    const toContact = applications.filter((a) => a.admin_status === "nouveau" || a.admin_status === "a_contacter").length;
    const interviews = applications.filter((a) => a.admin_status === "entretien_prevu").length;
    const scored = applications.filter((a) => typeof a.score === "number");
    const avgScore = scored.length > 0 ? Math.round((scored.reduce((sum, a) => sum + (a.score || 0), 0) / scored.length) * 10) / 10 : 0;
    const roleModerateur = applications.filter((a) => a.answers.role_postule === "moderateur").length;
    const roleSoutien = applications.filter((a) => a.answers.role_postule === "soutien").length;
    const roleBoth = applications.filter((a) => a.answers.role_postule === "les_deux").length;
    return { recent, toContact, interviews, avgScore, roleModerateur, roleSoutien, roleBoth };
  }, [applications]);
  const selectedNotes = useMemo(
    () => parseStructuredAdminNotes(selected?.admin_notes || []),
    [selected?.id, selected?.admin_notes]
  );

  useEffect(() => {
    setWorkspaceTab("candidat");
  }, [selected?.id]);

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

  const roleSum = Math.max(
    1,
    operationalStats.roleModerateur + operationalStats.roleSoutien + operationalStats.roleBoth
  );

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#06060a] text-white">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-2 border-violet-500/25" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-violet-400" />
        </div>
        <p className="text-sm text-violet-200/85">Chargement des candidatures…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(79,70,229,0.12),_transparent_50%),#06060a] p-4 text-white md:p-8 space-y-6">
      <AdminToastStack
        toasts={toasts}
        onClose={(id) => setToasts((prev) => prev.filter((item) => item.id !== id))}
      />
      <section className={`${heroShellClass} p-6 md:p-8`}>
        <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <Link
              href="/admin/membres/gestion"
              className={`mb-3 inline-flex items-center gap-1 text-sm text-violet-200/85 transition hover:text-white ${focusRingClass} rounded-lg`}
            >
              <ChevronRight className="h-4 w-4 rotate-180" aria-hidden />
              Retour gestion membres
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/35 bg-violet-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-100">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Recrutement staff TENF
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-100">
                <HeartHandshake className="h-3.5 w-3.5" aria-hidden />
                Expérience candidats & équipe
              </span>
            </div>
            <h1 className="mt-4 bg-gradient-to-r from-white via-indigo-100 to-cyan-200 bg-clip-text text-2xl font-bold text-transparent md:text-4xl md:leading-tight">
              Postulations modération &amp; soutien
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-400 md:text-base">
              Ici, le staff fait vivre un parcours clair pour les personnes qui veulent rejoindre TENF : lecture humaine des
              réponses, relecture croisée, entretien, puis décision transparente. Chaque dossier est une promesse de sérieux
              vis-à-vis des membres de la communauté.
            </p>
            <div className="mt-6 hidden gap-2 md:flex md:flex-wrap">
              {PIPELINE_LABELS.map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-slate-300">
                    {i + 1}. {label}
                  </span>
                  {i < PIPELINE_LABELS.length - 1 ? (
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" aria-hidden />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadApplications()}
            disabled={loading}
            className={`${subtleButtonClass} shrink-0 disabled:opacity-60`}
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </button>
        </div>

        <div className="relative mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            {
              label: "Total dossiers",
              value: dashboardStats.total,
              sub: "Historique complet",
              icon: ClipboardList,
              border: "border-slate-500/35",
              onClick: () => {
                setStatusFilter("all");
                setRoleFilter("all");
                setDateFilter("");
                setFlagsOnly(false);
                setOpenPipelineOnly(false);
                pushToast("info", "Filtres réinitialisés");
              },
            },
            {
              label: "En traitement",
              value: dashboardStats.open,
              sub: "Réception → entretien",
              icon: Activity,
              border: "border-sky-400/40",
              onClick: () => {
                setStatusFilter("all");
                setOpenPipelineOnly(true);
                setFlagsOnly(false);
                pushToast("info", "Pipeline actif", "Dossiers non clos uniquement.");
              },
            },
            {
              label: "Acceptés",
              value: dashboardStats.accepted,
              sub: "Intégration à suivre",
              icon: CheckCircle2,
              border: "border-emerald-400/40",
              onClick: () => {
                setOpenPipelineOnly(false);
                setFlagsOnly(false);
                setStatusFilter("accepte");
              },
            },
            {
              label: "Red flags",
              value: dashboardStats.flagged,
              sub: "À examiner",
              icon: Flag,
              border: "border-rose-400/40",
              onClick: () => {
                setOpenPipelineOnly(false);
                setFlagsOnly(true);
                pushToast("info", "Red flags", "Seuls les dossiers signalés sont affichés.");
              },
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.label}
                type="button"
                onClick={card.onClick}
                className={`rounded-2xl border ${card.border} bg-black/30 p-4 text-left transition hover:-translate-y-0.5 hover:bg-black/45 hover:shadow-lg hover:shadow-black/30 ${focusRingClass}`}
              >
                <Icon className="h-5 w-5 text-indigo-200/90" aria-hidden />
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">{card.label}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-white">{card.value}</p>
                <p className="mt-1 text-[11px] text-slate-500">{card.sub}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
        <article className={`${sectionCardClass} p-5 md:p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-sky-300" aria-hidden />
              <h2 className="text-lg font-semibold text-slate-100">Rythme sur 7 jours</h2>
            </div>
            <p className="text-xs text-slate-500">Arrivées récentes et files actives</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-sky-400/35 bg-sky-500/10 p-4 transition hover:border-sky-400/55">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">Nouvelles 7j</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-white">{operationalStats.recent}</p>
            </div>
            <div className="rounded-2xl border border-amber-400/35 bg-amber-500/10 p-4 transition hover:border-amber-400/55">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">À contacter</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-white">{operationalStats.toContact}</p>
            </div>
            <div className="rounded-2xl border border-violet-400/35 bg-violet-500/10 p-4 transition hover:border-violet-400/55">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">Entretiens</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-white">{operationalStats.interviews}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/35 bg-emerald-500/10 p-4 transition hover:border-emerald-400/55">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">Score moyen</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-white">
                {operationalStats.avgScore}
                <span className="text-lg font-semibold text-slate-500">/5</span>
              </p>
            </div>
          </div>
        </article>
        <article className={`${sectionCardClass} p-5 md:p-6`}>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-300" aria-hidden />
            <h2 className="text-lg font-semibold text-slate-100">Parcours choisi par les candidats</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">Répartition visuelle — utile pour anticiper les entretiens</p>
          <div className="mt-4 flex h-4 w-full overflow-hidden rounded-full border border-white/10 bg-black/40">
            <div
              className="bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
              style={{ width: `${(operationalStats.roleModerateur / roleSum) * 100}%` }}
              title={`Modération: ${operationalStats.roleModerateur}`}
            />
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
              style={{ width: `${(operationalStats.roleSoutien / roleSum) * 100}%` }}
              title={`Soutien: ${operationalStats.roleSoutien}`}
            />
            <div
              className="bg-gradient-to-r from-amber-500 to-orange-400 transition-all"
              style={{ width: `${(operationalStats.roleBoth / roleSum) * 100}%` }}
              title={`Mixte: ${operationalStats.roleBoth}`}
            />
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-indigo-400/25 bg-indigo-500/5 px-3 py-2.5">
              <span className="flex items-center gap-2 text-slate-200">
                <span className="h-2 w-2 rounded-full bg-indigo-400" />
                Modération
              </span>
              <span className="font-semibold text-indigo-200">{operationalStats.roleModerateur}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-emerald-400/25 bg-emerald-500/5 px-3 py-2.5">
              <span className="flex items-center gap-2 text-slate-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Soutien TENF
              </span>
              <span className="font-semibold text-emerald-200">{operationalStats.roleSoutien}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-amber-400/25 bg-amber-500/5 px-3 py-2.5">
              <span className="flex items-center gap-2 text-slate-200">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Les deux
              </span>
              <span className="font-semibold text-amber-200">{operationalStats.roleBoth}</span>
            </div>
          </div>
          <Link
            href="/admin/membres/gestion"
            className={`mt-4 inline-flex w-full items-center justify-between rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-indigo-400/40 hover:bg-white/[0.07] ${focusRingClass}`}
          >
            Passer à la gestion des membres actifs
            <ArrowRight className="h-4 w-4 text-indigo-300" aria-hidden />
          </Link>
        </article>
      </section>

      <section className={`${sectionCardClass} p-4 md:p-5`}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Raccourcis filtres</p>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setStatusFilter("nouveau");
            setOpenPipelineOnly(false);
            setFlagsOnly(false);
          }}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${focusRingClass} ${
            statusFilter === "nouveau" && !openPipelineOnly && !flagsOnly
              ? "border-sky-400/50 bg-sky-500/20 text-sky-100"
              : "border-white/12 bg-black/25 text-slate-300 hover:border-white/25"
          }`}
        >
          Boîte nouveaux
        </button>
        <button
          type="button"
          onClick={() => {
            setOpenPipelineOnly(true);
            setStatusFilter("all");
            setFlagsOnly(false);
          }}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${focusRingClass} ${
            openPipelineOnly && !flagsOnly
              ? "border-violet-400/50 bg-violet-500/20 text-violet-100"
              : "border-white/12 bg-black/25 text-slate-300 hover:border-white/25"
          }`}
        >
          Dossiers ouverts
        </button>
        <button
          type="button"
          onClick={() => {
            setStatusFilter("entretien_prevu");
            setOpenPipelineOnly(false);
            setFlagsOnly(false);
          }}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${focusRingClass} ${
            statusFilter === "entretien_prevu"
              ? "border-indigo-400/50 bg-indigo-500/20 text-indigo-100"
              : "border-white/12 bg-black/25 text-slate-300 hover:border-white/25"
          }`}
        >
          Entretiens prévus
        </button>
        <button
          type="button"
          onClick={() => {
            setFlagsOnly(true);
            setOpenPipelineOnly(false);
          }}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${focusRingClass} ${
            flagsOnly ? "border-rose-400/50 bg-rose-500/15 text-rose-100" : "border-white/12 bg-black/25 text-slate-300 hover:border-white/25"
          }`}
        >
          Red flags
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
          className={`rounded-xl border border-[#353a50] bg-[#121623]/85 px-3 py-2.5 text-white ${focusRingClass}`}
        >
          <option value="all">Tous rôles</option>
          <option value="moderateur">Modérateur</option>
          <option value="soutien">Soutien TENF</option>
          <option value="les_deux">Les deux</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as typeof statusFilter);
            setOpenPipelineOnly(false);
          }}
          className={`rounded-xl border border-[#353a50] bg-[#121623]/85 px-3 py-2.5 text-white ${focusRingClass}`}
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
          className={`rounded-xl border border-[#353a50] bg-[#121623]/85 px-3 py-2.5 text-white ${focusRingClass}`}
        />
        <button
          type="button"
          onClick={exportCsv}
          className={`rounded-xl border border-indigo-300/35 bg-indigo-500/20 px-3 py-2.5 font-semibold text-indigo-100 transition hover:bg-indigo-500/30 ${focusRingClass}`}
        >
          Export CSV
        </button>
      </div>
      </section>

      <section className={`${sectionCardClass} p-4`}>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedSavedViewId}
          onChange={(e) => applySavedView(e.target.value)}
          className="rounded-lg border border-[#353a50] bg-[#121623]/85 px-3 py-2 text-sm text-white"
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
          className="rounded-lg border border-[#353a50] bg-[#121623]/85 px-3 py-2 text-sm text-white"
        />
        <button onClick={saveCurrentView} className="rounded-lg border border-indigo-300/35 bg-indigo-500/20 px-3 py-2 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/30">
          Sauver vue
        </button>
        {selectedSavedViewId && (
          <button
            onClick={() => deleteSavedView(selectedSavedViewId)}
            className="rounded-lg border border-rose-300/35 bg-rose-500/15 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/25"
          >
            Suppr vue
          </button>
        )}
      </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className={`${sectionCardClass} overflow-hidden`}>
          {filtered.length === 0 ? (
            <div className="p-6 text-gray-400">Aucune postulation pour ces filtres.</div>
          ) : (
            <AdminTableShell
              title="Dossiers candidats"
              subtitle="Clique pour ouvrir la fiche — vue lecteur ou outils équipe"
              searchValue={search}
              onSearchChange={setSearch}
              page={currentPage}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => setPageSize(size)}
              searchPlaceholder="Pseudo Discord, nom…"
            >
              <div className="divide-y divide-white/[0.06]">
              {paginated.map((application) => {
                const rowAvatarSrc = discordAvatarUrl(
                  application.applicant_discord_id,
                  application.applicant_avatar
                );
                return (
                <button
                  key={application.id}
                  type="button"
                  onClick={() => setSelectedId(application.id)}
                  className={`w-full text-left p-4 transition-all ${
                        selected?.id === application.id
                          ? "bg-gradient-to-r from-violet-950/50 to-indigo-950/30 ring-1 ring-inset ring-violet-500/35"
                          : "hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {rowAvatarSrc ? (
                      <Image
                        src={rowAvatarSrc}
                        alt=""
                        width={48}
                        height={48}
                        className="h-12 w-12 shrink-0 rounded-2xl border border-white/10 object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-500/15 text-sm font-bold text-violet-100">
                        {application.answers.pseudo_discord.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">{application.answers.pseudo_discord}</p>
                        {application.has_red_flag ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/35 bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-200">
                            <Flag className="h-3 w-3" aria-hidden />
                            Signalé
                          </span>
                        ) : null}
                        {typeof application.score === "number" ? (
                          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                            Score {application.score}/5
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatRole(application.answers.role_postule)} ·{" "}
                        {new Date(application.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusBadgeStyles(application.admin_status)}`}
                    >
                      {formatStatus(application.admin_status)}
                    </span>
                  </div>
                </button>
                );
              })}
              </div>
            </AdminTableShell>
          )}
        </div>

        <div className={`${sectionCardClass} p-5 md:p-6`}>
          {!selected ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-violet-400/25 bg-violet-500/10">
                <ClipboardList className="h-8 w-8 text-violet-200/80" aria-hidden />
              </div>
              <p className="max-w-sm text-sm text-slate-400">
                Choisis un dossier dans la liste pour lire les réponses comme un candidat les a écrites, puis passe à
                l&apos;onglet <span className="text-indigo-200">Outils équipe</span> pour statuts, notes et décision.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-start gap-3">
                  {selectedAvatarSrc ? (
                    <Image
                      src={selectedAvatarSrc}
                      alt=""
                      width={64}
                      height={64}
                      className="h-16 w-16 shrink-0 rounded-2xl border border-white/10 object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-500/15 text-xl font-bold text-violet-100">
                      {selected.answers.pseudo_discord.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-white">{selected.answers.pseudo_discord}</h2>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatRole(selected.answers.role_postule)} · reçu le{" "}
                      {new Date(selected.created_at).toLocaleString("fr-FR")}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusBadgeStyles(selected.admin_status)}`}
                      >
                        {formatStatus(selected.admin_status)}
                      </span>
                      {typeof selected.score === "number" ? (
                        <span className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-200">
                          Score auto {selected.score}/5
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => exportFullApplication(selected)}
                  className={`rounded-xl border border-indigo-400/35 bg-indigo-500/15 px-4 py-2 text-xs font-semibold text-indigo-100 transition hover:bg-indigo-500/25 ${focusRingClass}`}
                >
                  Exporter JSON complet
                </button>
              </div>

              <div className="flex gap-2 rounded-2xl border border-white/10 bg-black/30 p-1">
                <button
                  type="button"
                  onClick={() => setWorkspaceTab("candidat")}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${focusRingClass} ${
                    workspaceTab === "candidat"
                      ? "bg-violet-600/35 text-white shadow-inner shadow-violet-900/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Lecture candidat
                </button>
                <button
                  type="button"
                  onClick={() => setWorkspaceTab("equipe")}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${focusRingClass} ${
                    workspaceTab === "equipe"
                      ? "bg-indigo-600/35 text-white shadow-inner shadow-indigo-900/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Outils équipe
                </button>
              </div>

              {workspaceTab === "candidat" && (
              <>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Progression dossier</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {PIPELINE_LABELS.map((label, i) => {
                    const pi = pipelineStepIndex(selected.admin_status);
                    const done = i < pi;
                    const current = i === pi;
                    const pending = i > pi;
                    const tone = pipelineDecisionTone(selected.admin_status);
                    let card =
                      "rounded-xl border px-3 py-2 text-[11px] font-semibold transition ";
                    if (pending) card += "border-white/10 bg-white/[0.03] text-slate-500";
                    else if (done) card += "border-emerald-400/35 bg-emerald-500/10 text-emerald-100";
                    else if (current && i === 3) {
                      if (tone === "ok") card += "border-emerald-400/55 bg-emerald-500/20 text-emerald-50 ring-2 ring-emerald-400/25";
                      else if (tone === "ko") card += "border-rose-400/55 bg-rose-500/20 text-rose-50 ring-2 ring-rose-400/25";
                      else if (tone === "archived") card += "border-slate-400/45 bg-slate-600/20 text-slate-100 ring-2 ring-slate-400/20";
                      else card += "border-amber-400/50 bg-amber-500/15 text-amber-50 ring-2 ring-amber-400/25";
                    } else card += "border-violet-400/50 bg-violet-500/20 text-white ring-2 ring-violet-400/30";
                    return (
                      <div key={label} className="flex items-center gap-2">
                        <span className={card}>{label}</span>
                        {i < PIPELINE_LABELS.length - 1 ? (
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" aria-hidden />
                        ) : null}
                      </div>
                    );
                  })}
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
              </>
              )}

              {workspaceTab === "equipe" && (
              <div className="border-t border-white/10 pt-4 space-y-4">
                <p className="text-xs font-medium text-indigo-200/90">
                  Statut admin, assignation, relecture croisée et décision — réservé au staff TENF.
                </p>
                <label className="block text-sm text-gray-300">Statut</label>
                <select
                  value={selected.admin_status}
                  onChange={(e) =>
                    void updateApplication(selected.id, {
                      adminStatus: e.target.value as StaffApplication["admin_status"],
                    })
                  }
                  disabled={savingId === selected.id}
                  className="w-full rounded-lg border border-[#353a50] bg-[#0f1321] px-3 py-2 text-white"
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
                    className="rounded-lg border border-[#353a50] bg-[#0f1321] px-3 py-2 text-white"
                  />
                  <input
                    type="date"
                    value={lastContactedInput}
                    onChange={(e) => setLastContactedInput(e.target.value)}
                    className="rounded-lg border border-[#353a50] bg-[#0f1321] px-3 py-2 text-white"
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
                  className="rounded-lg border border-slate-300/30 bg-slate-500/15 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-500/25 disabled:opacity-60"
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
                  <p className="flex items-center gap-1.5 text-xs text-red-300">
                    <Flag className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Candidature marquée red flag
                  </p>
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
                  className="w-full rounded-lg border border-[#353a50] bg-[#0f1321] px-3 py-2 text-white"
                />
                <button
                  onClick={async () => {
                    await updateApplication(selected.id, { adminNote: noteInput });
                    setNoteInput("");
                  }}
                  disabled={savingId === selected.id || !noteInput.trim()}
                  className="rounded-lg border border-indigo-300/35 bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/30 disabled:opacity-60"
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
                    className="w-full rounded-lg border border-[#353a50] bg-[#0f1321] px-3 py-2 text-white"
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
                    className="mt-2 rounded-lg border border-sky-300/35 bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/30 disabled:opacity-60"
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
                      className="rounded-lg border border-[#353a50] bg-[#0f1321] px-3 py-2 text-white"
                    >
                      <option value="reserve">Reserve / a revalider</option>
                      <option value="moderateur">Orientation moderateur</option>
                      <option value="soutien">Orientation soutien</option>
                      <option value="les_deux">Orientation les deux</option>
                    </select>
                    <select
                      value={opinionAnswerRating}
                      onChange={(e) => setOpinionAnswerRating(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                      className="rounded-lg border border-[#353a50] bg-[#0f1321] px-3 py-2 text-white"
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
                    className="w-full mt-2 rounded-lg border border-[#353a50] bg-[#0f1321] px-3 py-2 text-white"
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
                    className="mt-2 rounded-lg border border-violet-300/35 bg-violet-500/20 px-4 py-2 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/30 disabled:opacity-60"
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
                        className="w-full rounded-lg border border-[#353a50] bg-[#0f1321] px-3 py-2 text-white"
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
                        className="mt-2 w-full rounded-lg border border-[#353a50] bg-[#0f1321] px-3 py-2 text-white"
                      />
                      <textarea
                        rows={3}
                        value={finalDecisionInput}
                        onChange={(e) => setFinalDecisionInput(e.target.value)}
                        placeholder="Note interne fondateur (optionnel, non visible membre)..."
                        className="mt-2 w-full rounded-lg border border-[#353a50] bg-[#0f1321] px-3 py-2 text-white"
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
                        className="mt-2 rounded-lg border border-amber-300/35 bg-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/30 disabled:opacity-60"
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
                  type="button"
                  onClick={() => void updateApplication(selected.id, { adminStatus: "archive" })}
                  disabled={savingId === selected.id}
                  className="rounded-lg border border-yellow-300/35 bg-yellow-500/20 px-4 py-2 text-sm font-semibold text-yellow-100 transition hover:bg-yellow-500/30 disabled:opacity-60"
                >
                  Archiver
                </button>
              </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
