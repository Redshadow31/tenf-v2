"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";
import { discordAvatarUrl } from "@/lib/discordAvatarUrl";
import AdminToastStack, { type AdminToastItem } from "@/components/admin/ui/AdminToastStack";
import AdminTableShell from "@/components/admin/ui/AdminTableShell";
import CandidateAnswersFiche from "@/components/admin/postulations/CandidateAnswersFiche";
import { isFounder } from "@/lib/adminRoles";
import type { StaffApplicationAnswers } from "@/lib/staffApplicationsStorage";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Copy,
  Flag,
  Gauge,
  HeartHandshake,
  MapPin,
  MessageSquare,
  RefreshCw,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  UserCog,
  Users,
  X,
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

function formatRelativeReceived(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return "Reçu aujourd’hui";
  if (days === 1) return "Reçu hier";
  if (days < 7) return `Reçu il y a ${days} j.`;
  if (days < 30) return `Reçu il y a ${Math.floor(days / 7)} sem.`;
  return `Reçu le ${new Date(iso).toLocaleDateString("fr-FR")}`;
}

function pipelineDotsClass(status: StaffApplication["admin_status"], index: number): string {
  const pi = pipelineStepIndex(status);
  const tone = pipelineDecisionTone(status);
  const base = "h-1.5 w-7 shrink-0 rounded-full transition";
  if (index < pi) return `${base} bg-emerald-500/70`;
  if (index > pi) return `${base} bg-slate-700/90`;
  if (index === 3 && pi === 3) {
    if (tone === "ok") return `${base} bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.45)]`;
    if (tone === "ko") return `${base} bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.4)]`;
    if (tone === "archived") return `${base} bg-slate-400`;
  }
  return `${base} bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.35)]`;
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
  const [detailModalOpen, setDetailModalOpen] = useState(false);

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

  function copyTextWithToast(label: string, text: string) {
    const t = text.trim();
    if (!t) return;
    void navigator.clipboard.writeText(t);
    pushToast("success", "Copié", label);
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
      const list = (data.applications || []) as StaffApplication[];
      setApplications(list);
      setSelectedId((prev) => {
        if (list.length === 0) return null;
        if (prev && list.some((a) => a.id === prev)) return prev;
        return list[0].id;
      });
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
      const twitch = (item.answers.pseudo_twitch || "").toLowerCase();
      if (
        !item.answers.pseudo_discord.toLowerCase().includes(q) &&
        !item.applicant_username.toLowerCase().includes(q) &&
        !twitch.includes(q)
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

  const listPipelineStats = useMemo(() => {
    const out = {
      total: filtered.length,
      nouveau: 0,
      a_contacter: 0,
      entretien_prevu: 0,
      accepte: 0,
      refuse: 0,
      archive: 0,
      flagged: 0,
    };
    for (const a of filtered) {
      out[a.admin_status]++;
      if (a.has_red_flag) out.flagged++;
    }
    return out;
  }, [filtered]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return applications.find((item) => item.id === selectedId) ?? null;
  }, [applications, selectedId]);

  const selectedHiddenByFilters = useMemo(() => {
    if (!selected) return false;
    return !filtered.some((item) => item.id === selected.id);
  }, [selected, filtered]);

  function resetListFilters() {
    setSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
    setDateFilter("");
    setFlagsOnly(false);
    setOpenPipelineOnly(false);
    setCurrentPage(1);
  }
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
    if (!selected) setDetailModalOpen(false);
  }, [selected]);

  useEffect(() => {
    if (!detailModalOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setDetailModalOpen(false);
        return;
      }
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable=true]")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "1") {
        e.preventDefault();
        setWorkspaceTab("candidat");
      } else if (e.key === "2") {
        e.preventDefault();
        setWorkspaceTab("equipe");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [detailModalOpen]);

  useEffect(() => {
    if (!detailModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [detailModalOpen]);

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

      <div className={`${sectionCardClass} overflow-hidden p-0`}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-5 px-6 py-20 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-violet-400/30 bg-gradient-to-br from-violet-600/25 to-indigo-900/20 shadow-[0_0_40px_rgba(139,92,246,0.2)]">
                <Users className="h-11 w-11 text-violet-200/90" aria-hidden />
              </div>
              <div className="max-w-md">
                <p className="text-lg font-semibold text-white">Aucun dossier ne correspond aux filtres</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Élargis la recherche (Discord, Twitch ou nom affiché), change le rôle ou le statut, ou repars sur une
                  vue complète.
                </p>
              </div>
              <button
                type="button"
                onClick={resetListFilters}
                className={`rounded-xl border border-violet-400/40 bg-violet-500/15 px-5 py-2.5 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/25 ${focusRingClass}`}
              >
                Réinitialiser recherche et filtres liste
              </button>
            </div>
          ) : (
            <AdminTableShell
              variant="elevated"
              title="Dossiers candidats"
              subtitle="Chaque ligne résume l’identité, le rôle visé et l’avancement. Ouvre une fiche pour lire l’intégralité des réponses, les scénarios et les outils d’équipe (statuts, notes, décision)."
              searchValue={search}
              onSearchChange={setSearch}
              page={currentPage}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => setPageSize(size)}
              searchPlaceholder="Discord, Twitch, nom affiché…"
              statsSlot={
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/35 px-3 py-1.5 text-xs text-slate-300">
                    <Users className="h-3.5 w-3.5 shrink-0 text-violet-300" aria-hidden />
                    <span>
                      <strong className="font-semibold text-white">{listPipelineStats.total}</strong>{" "}
                      {listPipelineStats.total > 1 ? "dossiers affichés" : "dossier affiché"}
                      {applications.length !== listPipelineStats.total ? (
                        <span className="text-slate-500"> sur {applications.length} au total</span>
                      ) : null}
                    </span>
                  </span>
                  {listPipelineStats.flagged > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/40 bg-rose-500/12 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-rose-100">
                      <Flag className="h-3 w-3" aria-hidden />
                      {listPipelineStats.flagged} signalé{listPipelineStats.flagged > 1 ? "s" : ""}
                    </span>
                  ) : null}
                  {listPipelineStats.nouveau > 0 ? (
                    <span className="rounded-full border border-sky-400/35 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-100">
                      Nouveau · {listPipelineStats.nouveau}
                    </span>
                  ) : null}
                  {listPipelineStats.a_contacter > 0 ? (
                    <span className="rounded-full border border-amber-400/35 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-100">
                      À contacter · {listPipelineStats.a_contacter}
                    </span>
                  ) : null}
                  {listPipelineStats.entretien_prevu > 0 ? (
                    <span className="rounded-full border border-violet-400/35 bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-violet-100">
                      Entretien · {listPipelineStats.entretien_prevu}
                    </span>
                  ) : null}
                  {listPipelineStats.accepte > 0 ? (
                    <span className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-100">
                      Accepté · {listPipelineStats.accepte}
                    </span>
                  ) : null}
                  {listPipelineStats.refuse > 0 ? (
                    <span className="rounded-full border border-rose-400/35 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-100">
                      Refusé · {listPipelineStats.refuse}
                    </span>
                  ) : null}
                  {listPipelineStats.archive > 0 ? (
                    <span className="rounded-full border border-slate-500/35 bg-slate-600/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-200">
                      Archivé · {listPipelineStats.archive}
                    </span>
                  ) : null}
                </div>
              }
            >
              <div className="divide-y divide-white/[0.06]">
                {paginated.map((application) => {
                  const rowAvatarSrc = discordAvatarUrl(
                    application.applicant_discord_id,
                    application.applicant_avatar
                  );
                  const RoleIcon =
                    application.answers.role_postule === "moderateur"
                      ? Shield
                      : application.answers.role_postule === "soutien"
                        ? HeartHandshake
                        : Users;
                  const pays = application.answers.pays_fuseau?.trim();
                  const engagement = application.answers.engagement_hebdo;
                  const twitch = application.answers.pseudo_twitch?.trim();
                  const assignee = application.assigned_to?.trim();
                  return (
                    <button
                      key={application.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(application.id);
                        setDetailModalOpen(true);
                      }}
                      className={`group relative w-full text-left transition-all ${
                        selected?.id === application.id
                          ? "bg-gradient-to-r from-violet-950/60 via-violet-900/20 to-transparent ring-1 ring-inset ring-violet-500/45"
                          : "hover:bg-white/[0.045]"
                      }`}
                    >
                      <div className="flex items-stretch gap-4 px-4 py-4 md:gap-5 md:px-6 md:py-5">
                        <div className="relative shrink-0">
                          <div
                            className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-br from-violet-500/50 to-cyan-400/25 opacity-0 blur-md transition duration-300 group-hover:opacity-80"
                            aria-hidden
                          />
                          {rowAvatarSrc ? (
                            <Image
                              src={rowAvatarSrc}
                              alt=""
                              width={56}
                              height={56}
                              className="relative h-14 w-14 rounded-2xl border-2 border-white/15 object-cover shadow-lg shadow-black/40 ring-1 ring-white/10"
                              sizes="56px"
                            />
                          ) : (
                            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-violet-400/35 bg-gradient-to-br from-violet-600/40 to-indigo-900/50 text-base font-bold text-violet-50 shadow-lg">
                              {application.answers.pseudo_discord.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 pr-2 md:pr-4">
                          <div className="flex flex-wrap items-center gap-2 gap-y-1.5">
                            <p className="text-base font-bold tracking-tight text-white md:text-lg">
                              {application.answers.pseudo_discord}
                            </p>
                            {application.applicant_username &&
                            application.applicant_username !== application.answers.pseudo_discord ? (
                              <span className="max-w-[10rem] truncate rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-slate-400 md:max-w-xs">
                                @{application.applicant_username}
                              </span>
                            ) : null}
                            {application.has_red_flag ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/40 bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-100">
                                <Flag className="h-3 w-3" aria-hidden />
                                Signalé
                              </span>
                            ) : null}
                            {typeof application.score === "number" ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold text-emerald-100">
                                <Gauge className="h-3 w-3 opacity-80" aria-hidden />
                                Score auto {application.score}/5
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                            <span className="inline-flex items-center gap-1.5 font-medium text-violet-200/95">
                              <RoleIcon className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                              {formatRole(application.answers.role_postule)}
                            </span>
                            <span className="text-slate-600" aria-hidden>
                              ·
                            </span>
                            <span className="inline-flex items-center gap-1 text-slate-500">
                              <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                              {formatRelativeReceived(application.created_at)}
                            </span>
                            <span className="text-slate-600" aria-hidden>
                              ·
                            </span>
                            <span className="text-slate-500">
                              {new Date(application.created_at).toLocaleDateString("fr-FR", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {twitch ? (
                              <span className="inline-flex max-w-full items-center gap-1 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-2 py-1 text-[11px] font-medium text-cyan-100/95">
                                <span className="text-cyan-300/80">Twitch</span>
                                <span className="truncate">{twitch}</span>
                              </span>
                            ) : null}
                            {pays ? (
                              <span className="inline-flex max-w-full items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-slate-300">
                                <MapPin className="h-3 w-3 shrink-0 text-slate-500" aria-hidden />
                                <span className="truncate">{pays}</span>
                              </span>
                            ) : null}
                            {engagement ? (
                              <span className="inline-flex items-center gap-1 rounded-lg border border-indigo-400/25 bg-indigo-500/10 px-2 py-1 text-[11px] font-medium text-indigo-100/90">
                                Engagement ~{engagement}
                              </span>
                            ) : null}
                            {assignee ? (
                              <span className="inline-flex max-w-full items-center gap-1 truncate rounded-lg border border-amber-400/25 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-100/90">
                                Suivi · {assignee}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-end justify-between gap-3 pl-1">
                          <div className="flex flex-col items-end gap-2">
                            <span
                              className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide shadow-sm ${statusBadgeStyles(application.admin_status)}`}
                            >
                              {formatStatus(application.admin_status)}
                            </span>
                            <div
                              className="flex items-center gap-1"
                              title={`Étape : ${PIPELINE_LABELS[pipelineStepIndex(application.admin_status)]}`}
                            >
                              {PIPELINE_LABELS.map((_, i) => (
                                <span
                                  key={`${application.id}-dot-${i}`}
                                  className={pipelineDotsClass(application.admin_status, i)}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-violet-400/60 transition group-hover:text-violet-200">
                            Ouvrir la fiche
                            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </AdminTableShell>
          )}
          {filtered.length > 0 ? (
            <div className="border-t border-violet-500/20 bg-gradient-to-r from-violet-950/25 via-transparent to-cyan-950/10 px-4 py-4 md:px-6">
              <p className="flex flex-wrap items-start gap-2 text-sm leading-relaxed text-slate-300 md:items-center">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-300 md:mt-0" aria-hidden />
                <span>
                  <span className="font-medium text-slate-200">Navigation fiche</span> — toutes les réponses du
                  formulaire, les scénarios et la zone staff sont dans la modale. Fermeture :{" "}
                  <kbd className="rounded border border-white/15 bg-black/40 px-1.5 py-0.5 font-mono text-[11px] text-slate-200">
                    Échap
                  </kbd>
                  , bouton fermer ou clic sur le fond assombri.
                </span>
              </p>
            </div>
          ) : null}
        </div>

      {detailModalOpen && selected ? (
        <div
          className="fixed inset-0 z-[100] flex items-stretch justify-center p-0 sm:p-4 md:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="postulation-modal-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
            aria-label="Fermer la fiche"
            onClick={() => setDetailModalOpen(false)}
          />
          <div className="relative z-10 flex h-[100dvh] max-h-[100dvh] w-full max-w-[min(100%,96rem)] flex-col overflow-hidden rounded-none border border-violet-500/30 bg-[#06060c] shadow-[0_32px_120px_rgba(0,0,0,0.75),0_0_0_1px_rgba(139,92,246,0.12)] sm:max-h-[calc(100dvh-3rem)] sm:rounded-2xl">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-violet-600/30 via-indigo-900/10 to-transparent"
              aria-hidden
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" aria-hidden />

            <header className="relative shrink-0 border-b border-white/[0.09] bg-[#080a11]/90 px-4 py-4 backdrop-blur-xl md:px-6 md:py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 flex-1 gap-4">
                  {selectedAvatarSrc ? (
                    <Image
                      src={selectedAvatarSrc}
                      alt=""
                      width={56}
                      height={56}
                      className="h-14 w-14 shrink-0 rounded-2xl border-2 border-white/15 object-cover shadow-lg shadow-violet-950/40 ring-1 ring-violet-500/20"
                      sizes="56px"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-violet-400/40 bg-gradient-to-br from-violet-600/50 to-indigo-950/60 text-lg font-bold text-violet-50 shadow-lg">
                      {selected.answers.pseudo_discord.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-300/85">
                      Fiche postulation
                    </p>
                    <h2
                      id="postulation-modal-title"
                      className="mt-1 truncate text-xl font-bold tracking-tight text-white md:text-2xl"
                    >
                      {selected.answers.pseudo_discord}
                    </h2>
                    <p className="mt-1 truncate text-sm text-slate-400">
                      {formatRole(selected.answers.role_postule)} · reçu le{" "}
                      {new Date(selected.created_at).toLocaleString("fr-FR")}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusBadgeStyles(selected.admin_status)}`}
                      >
                        {formatStatus(selected.admin_status)}
                      </span>
                      {typeof selected.score === "number" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-500/12 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-100">
                          <Gauge className="h-3 w-3 opacity-80" aria-hidden />
                          Score {selected.score}/5
                        </span>
                      ) : null}
                      {selected.answers.pseudo_twitch?.trim() ? (
                        <span className="rounded-md border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-100/90">
                          Twitch {selected.answers.pseudo_twitch.trim()}
                        </span>
                      ) : null}
                      {selected.answers.pays_fuseau?.trim() ? (
                        <span className="inline-flex max-w-[12rem] items-center gap-1 truncate rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] text-slate-300">
                          <MapPin className="h-3 w-3 shrink-0 text-slate-500" aria-hidden />
                          {selected.answers.pays_fuseau.trim()}
                        </span>
                      ) : null}
                      {selected.answers.engagement_hebdo ? (
                        <span className="rounded-md border border-indigo-400/25 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-100/90">
                          ~{selected.answers.engagement_hebdo}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => copyTextWithToast("Identifiant dossier", selected.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/25 hover:bg-white/10 ${focusRingClass}`}
                    title={selected.id}
                  >
                    <Copy className="h-3.5 w-3.5 opacity-80" aria-hidden />
                    ID dossier
                  </button>
                  <button
                    type="button"
                    onClick={() => copyTextWithToast("ID Discord", selected.applicant_discord_id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/25 hover:bg-white/10 ${focusRingClass}`}
                  >
                    <Copy className="h-3.5 w-3.5 opacity-80" aria-hidden />
                    ID Discord
                  </button>
                  <button
                    type="button"
                    onClick={() => exportFullApplication(selected)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border border-indigo-400/40 bg-indigo-500/20 px-3 py-2 text-xs font-semibold text-indigo-50 transition hover:bg-indigo-500/30 ${focusRingClass}`}
                  >
                    Exporter JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailModalOpen(false)}
                    className={`inline-flex items-center justify-center rounded-xl border border-rose-400/30 bg-rose-500/15 p-2.5 text-rose-100 transition hover:bg-rose-500/25 ${focusRingClass}`}
                    aria-label="Fermer"
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </button>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 gap-1 rounded-2xl border border-white/10 bg-black/45 p-1 shadow-inner shadow-black/40">
                  <button
                    type="button"
                    onClick={() => setWorkspaceTab("candidat")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${focusRingClass} ${
                      workspaceTab === "candidat"
                        ? "bg-gradient-to-r from-violet-600/50 to-violet-800/40 text-white shadow-md shadow-violet-950/50"
                        : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <ClipboardList className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    Lecture candidat
                    <kbd className="hidden rounded border border-white/15 bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:inline">1</kbd>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkspaceTab("equipe")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${focusRingClass} ${
                      workspaceTab === "equipe"
                        ? "bg-gradient-to-r from-indigo-600/50 to-indigo-900/40 text-white shadow-md shadow-indigo-950/50"
                        : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <UserCog className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    Outils équipe
                    <kbd className="hidden rounded border border-white/15 bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:inline">2</kbd>
                  </button>
                </div>
                <p className="text-center text-[11px] leading-relaxed text-slate-500 sm:max-w-[14rem] sm:text-right">
                  <kbd className="rounded border border-white/12 bg-black/40 px-1 font-mono text-slate-300">1</kbd>{" "}
                  fiche ·{" "}
                  <kbd className="rounded border border-white/12 bg-black/40 px-1 font-mono text-slate-300">2</kbd>{" "}
                  staff · <kbd className="rounded border border-white/12 bg-black/40 px-1 font-mono text-slate-300">Échap</kbd>{" "}
                  fermer
                </p>
              </div>
            </header>

            <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[radial-gradient(ellipse_90%_40%_at_50%_-10%,rgba(99,102,241,0.14),transparent_55%),linear-gradient(180deg,#0a0b12,#06060a)] px-4 py-5 md:px-8 md:py-6">
            <div className="mx-auto max-w-5xl space-y-5">

              {workspaceTab === "candidat" && (
              <>
              <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/30 via-black/40 to-black/60 p-4 shadow-lg shadow-violet-950/20 md:p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300/80">
                  Progression dossier
                </p>
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

              {selectedHiddenByFilters ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-amber-50/95">
                    <span className="font-semibold text-amber-100">Hors liste filtrée.</span>{" "}
                    La fiche affichée correspond bien à ce candidat, mais il n’apparaît pas dans le tableau avec les
                    filtres actuels.
                  </p>
                  <button
                    type="button"
                    onClick={resetListFilters}
                    className={`shrink-0 rounded-xl border border-amber-300/40 bg-amber-400/15 px-4 py-2 text-xs font-semibold text-amber-50 transition hover:bg-amber-400/25 ${focusRingClass}`}
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              ) : null}

              <div className="rounded-2xl border border-white/[0.1] bg-[#080910]/95 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:p-5">
                <div className="mb-4 flex flex-col gap-2 border-b border-white/[0.07] pb-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300/90">
                      Réponses formulaire — {roleTrackTitle(selected.answers.role_postule)}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">
                      Sommaire cliquable, replis par bloc, recherche globale et copie champ par champ. Fais défiler ou
                      saute à une section depuis la barre violette en haut de la fiche.
                    </p>
                  </div>
                </div>
                <CandidateAnswersFiche variant="modal" answers={selected.answers as StaffApplicationAnswers} />
              </div>
              </>
              )}

              {workspaceTab === "equipe" && (
              <div className="rounded-2xl border border-indigo-400/30 bg-gradient-to-b from-indigo-950/45 via-[#0a0c18] to-black/55 p-5 shadow-[inset_0_1px_0_rgba(129,140,248,0.15)] md:p-6">
                <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-indigo-400/20 pb-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-indigo-400/35 bg-indigo-500/20 text-indigo-100">
                    <UserCog className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-indigo-100">Espace staff</p>
                    <p className="mt-0.5 text-xs text-indigo-200/75">
                      Statut, assignation, relecture croisée, avis et décision — réservé au staff TENF.
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
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
              </div>
              )}
            </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
