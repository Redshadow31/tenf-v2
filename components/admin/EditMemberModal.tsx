"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  CalendarDays,
  ExternalLink,
  FileText,
  History,
  Keyboard,
  RotateCcw,
  Save,
  Shield,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { toCanonicalMemberRole } from "@/lib/memberRoles";
import { getRoleBadgeClassName, getRoleBadgeLabel } from "@/lib/roleBadgeSystem";

/** Bloc section formulaire (cohérent dans tout le modal). */
const EDIT_MODAL_SECTION =
  "rounded-2xl border border-white/[0.08] bg-[linear-gradient(160deg,rgba(26,28,40,0.92),rgba(14,15,22,0.98))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";

type MemberRole =
  | "Nouveau"
  | "Affilié"
  | "Développement"
  | "Admin"
  | "Admin Coordinateur"
  | "Modérateur"
  | "Modérateur en formation"
  | "Modérateur en activité réduite"
  | "Modérateur en pause"
  | "Soutien TENF"
  | "Contributeur TENF du Mois"
  | "Créateur Junior"
  | "Les P'tits Jeunes"
  | "Communauté"
  | "Admin Adjoint" // legacy
  | "Mentor" // legacy
  | "Modérateur Junior"; // legacy

interface Member {
  id: number;
  avatar: string;
  nom: string;
  role: MemberRole;
  statut: "Actif" | "Inactif";
  discord: string;
  discordId?: string;
  twitch: string;
  twitchId?: string; // ID Twitch numérique
  notesInternes?: string;
  description?: string;
  badges?: string[];
  isVip?: boolean;
  shadowbanLives?: boolean;
  createdAt?: string; // Date ISO de création (membre depuis)
  integrationDate?: string; // Date ISO d'intégration
  birthday?: string; // Date ISO anniversaire
  twitchAffiliateDate?: string; // Date ISO affiliation Twitch
  onboardingStatus?: "a_faire" | "en_cours" | "termine";
  mentorTwitchLogin?: string;
  primaryLanguage?: string;
  timezone?: string;
  countryCode?: string;
  lastReviewAt?: string;
  nextReviewAt?: string;
  roleHistory?: Array<{
    fromRole: string;
    toRole: string;
    changedAt: string;
    changedBy: string;
    reason?: string;
  }>;
  parrain?: string; // Pseudo/nom du membre parrain
}

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  onSave: (member: Member) => void;
}

export default function EditMemberModal({
  isOpen,
  onClose,
  member,
  onSave,
}: EditMemberModalProps) {
  type EditTab = "comptes" | "role" | "suivi" | "badges" | "notes";
  const tabOrder: EditTab[] = ["comptes", "role", "suivi", "badges", "notes"];
  const tabMeta: Record<EditTab, { label: string; Icon: LucideIcon; hint: string }> = {
    comptes: {
      label: "Identité & comptes",
      Icon: User,
      hint: "Liens utilisés par Twitch, Discord et le site pour reconnaître ce membre.",
    },
    role: {
      label: "Rôle & statut",
      Icon: Shield,
      hint: "Ce que l’équipe voit dans l’admin ; impact sur les accès et le cycle de vie.",
    },
    suivi: {
      label: "Parcours & dates",
      Icon: CalendarDays,
      hint: "Intégration, mentor, revues : la timeline TENF du créateur.",
    },
    badges: {
      label: "Badges",
      Icon: Award,
      hint: "Pastilles affichées sur le profil public et l’espace membre.",
    },
    notes: {
      label: "Textes",
      Icon: FileText,
      hint: "Bio visible par la communauté vs notes réservées au staff.",
    },
  };
  const [formData, setFormData] = useState<Member>(member);
  const [badgeInput, setBadgeInput] = useState("");
  const [showRoleHistory, setShowRoleHistory] = useState(false);
  const [roleChangeReason, setRoleChangeReason] = useState("");
  const [activeTab, setActiveTab] = useState<EditTab>("comptes");
  const [availableMembers, setAvailableMembers] = useState<Array<{ nom: string; twitch: string }>>([]);
  const [existingMembers, setExistingMembers] = useState<Array<{ twitchLogin: string; discordId?: string; displayName?: string }>>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [parrainSuggestions, setParrainSuggestions] = useState<string[]>([]);
  const [showParrainSuggestions, setShowParrainSuggestions] = useState(false);
  const [discordConflictMember, setDiscordConflictMember] = useState<{ twitchLogin: string; discordId?: string; displayName?: string } | null>(null);
  const [quickMergeLoading, setQuickMergeLoading] = useState(false);
  const tabButtonRefs = useRef<Partial<Record<EditTab, HTMLButtonElement | null>>>({});
  const originalRole = member.role;

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...member, role: toCanonicalMemberRole(member.role) });
      setBadgeInput("");
      setRoleChangeReason("");
      setActiveTab("comptes");
      // Charger la liste des membres actifs pour l'autocomplétion
      loadAvailableMembers();
      loadExistingMembersForValidation();
    }
  }, [isOpen, member]);

  useEffect(() => {
    const errors: Record<string, string> = {};
    const currentTwitch = (formData.twitch || "").trim().toLowerCase();
    const currentDiscordId = (formData.discordId || "").trim();

    if (!currentTwitch) {
      errors.twitch = "Le pseudo Twitch est requis";
    } else {
      const duplicateTwitch = existingMembers.find(
        (m) => m.twitchLogin?.toLowerCase() === currentTwitch && m.twitchLogin?.toLowerCase() !== member.twitch.toLowerCase()
      );
      if (duplicateTwitch) {
        errors.twitch = "Ce pseudo Twitch est déjà utilisé par un autre membre";
      }
    }

    if (currentDiscordId) {
      const duplicateDiscord = existingMembers.find(
        (m) =>
          m.discordId === currentDiscordId &&
          (member.discordId ? m.discordId !== member.discordId : true)
      );
      if (duplicateDiscord) {
        errors.discordId = "Cet ID Discord est déjà lié à un autre membre";
        setDiscordConflictMember(duplicateDiscord);
      } else {
        setDiscordConflictMember(null);
      }
    } else {
      setDiscordConflictMember(null);
    }

    const createdAt = formData.createdAt ? new Date(formData.createdAt) : null;
    const integrationDate = formData.integrationDate ? new Date(formData.integrationDate) : null;
    if (createdAt && integrationDate && integrationDate.getTime() < createdAt.getTime()) {
      errors.integrationDate = "La date d'intégration ne peut pas être antérieure à la date de création";
    }

    const lastReviewAt = formData.lastReviewAt ? new Date(formData.lastReviewAt) : null;
    const nextReviewAt = formData.nextReviewAt ? new Date(formData.nextReviewAt) : null;
    if (lastReviewAt && nextReviewAt && nextReviewAt.getTime() < lastReviewAt.getTime()) {
      errors.nextReviewAt = "La prochaine revue doit être postérieure à la dernière revue";
    }

    setValidationErrors(errors);
  }, [formData.twitch, formData.discordId, formData.createdAt, formData.integrationDate, formData.lastReviewAt, formData.nextReviewAt, existingMembers, member.twitch, member.discordId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (showRoleHistory) {
        setShowRoleHistory(false);
        return;
      }
      onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, showRoleHistory]);

  useEffect(() => {
    if (!isOpen) return;
    if (formData.role !== "Communauté") return;
    if (formData.statut === "Inactif") return;
    setFormData((prev) => ({ ...prev, statut: "Inactif" }));
  }, [formData.role, formData.statut, isOpen]);

  const loadAvailableMembers = async () => {
    try {
      const response = await fetch("/api/members/public", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (response.ok) {
        const data = await response.json();
        const members = (data.members || [])
          .filter((m: any) => m.displayName && m.displayName !== member.nom) // Exclure le membre lui-même
          .map((m: any) => ({
            nom: m.displayName,
            twitch: m.twitchLogin || "",
          }));
        setAvailableMembers(members);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des membres:", error);
    }
  };

  const loadExistingMembersForValidation = async () => {
    try {
      const response = await fetch("/api/admin/members", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!response.ok) return;
      const data = await response.json();
      const rows = (data.members || []).map((m: any) => ({
        twitchLogin: (m.twitchLogin || "").toLowerCase(),
        discordId: m.discordId || undefined,
        displayName: m.displayName || undefined,
      }));
      setExistingMembers(rows);
    } catch (error) {
      console.error("Erreur validation membres existants:", error);
    }
  };

  const handleParrainInputChange = (value: string) => {
    setFormData({ ...formData, parrain: value });
    if (value.trim().length > 0) {
      const filtered = availableMembers
        .filter(m => 
          m.nom.toLowerCase().includes(value.toLowerCase()) ||
          m.twitch.toLowerCase().includes(value.toLowerCase())
        )
        .map(m => m.nom)
        .slice(0, 10); // Limiter à 10 suggestions
      setParrainSuggestions(filtered);
      setShowParrainSuggestions(true);
    } else {
      setParrainSuggestions([]);
      setShowParrainSuggestions(false);
    }
  };

  const handleQuickMergeFromDiscordConflict = async () => {
    if (!discordConflictMember?.twitchLogin) {
      alert("Membre en conflit introuvable pour la fusion.");
      return;
    }

    const currentLogin = (formData.twitch || member.twitch || "").trim().toLowerCase();
    const conflictLogin = discordConflictMember.twitchLogin.trim().toLowerCase();

    if (!currentLogin || !conflictLogin || currentLogin === conflictLogin) {
      alert("Impossible de préparer la fusion (logins invalides).");
      return;
    }

    const confirmed = confirm(
      `Fusionner "${currentLogin}" avec "${conflictLogin}" maintenant ?\n\n` +
      `Le profil "${currentLogin}" sera conservé comme profil principal.`
    );
    if (!confirmed) return;

    setQuickMergeLoading(true);
    try {
      const response = await fetch("/api/admin/members/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membersToMerge: [currentLogin, conflictLogin],
          mergedData: {
            twitchLogin: currentLogin,
            displayName: formData.nom,
            twitchUrl: `https://www.twitch.tv/${currentLogin}`,
            discordId: (formData.discordId || discordConflictMember.discordId || "").trim() || undefined,
            discordUsername: formData.discord,
            role: toCanonicalMemberRole(formData.role),
            isVip: formData.isVip || false,
            badges: formData.badges || [],
            description: formData.description,
            siteUsername: formData.nom,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Fusion impossible");
      }

      alert(
        `Fusion réussie !\n\n` +
        `Profil conservé: ${data.primaryMember}\n` +
        `Profil(s) fusionné(s): ${(data.deletedMembers || []).join(", ")}`
      );
      onClose();
      window.location.reload();
    } catch (error) {
      console.error("Erreur fusion rapide:", error);
      alert(`Erreur de fusion: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    } finally {
      setQuickMergeLoading(false);
    }
  };

  const selectParrain = (parrainName: string) => {
    setFormData({ ...formData, parrain: parrainName });
    setShowParrainSuggestions(false);
  };

  if (!isOpen) return null;

  const normalizeText = (value?: string | null) => (value ?? "").trim();
  const normalizeDateOnly = (value?: string | null) => ((value ?? "").split("T")[0] || "").trim();
  const normalizeBadges = (badges?: string[]) =>
    [...(badges || [])]
      .map((badge) => badge.trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  const areStringArraysEqual = (left?: string[], right?: string[]) => {
    const normalizedLeft = normalizeBadges(left);
    const normalizedRight = normalizeBadges(right);
    if (normalizedLeft.length !== normalizedRight.length) return false;
    return normalizedLeft.every((value, index) => value === normalizedRight[index]);
  };

  const tabDirtyState = useMemo<Record<EditTab, boolean>>(() => {
    const baseRole = toCanonicalMemberRole(member.role);
    return {
      comptes:
        normalizeText(formData.nom) !== normalizeText(member.nom) ||
        normalizeText(formData.twitch) !== normalizeText(member.twitch) ||
        normalizeText(formData.twitchId) !== normalizeText(member.twitchId) ||
        normalizeText(formData.discord) !== normalizeText(member.discord) ||
        normalizeText(formData.discordId) !== normalizeText(member.discordId),
      role:
        formData.role !== baseRole ||
        formData.statut !== member.statut ||
        !!formData.isVip !== !!member.isVip ||
        !!formData.shadowbanLives !== !!member.shadowbanLives ||
        normalizeText(roleChangeReason).length > 0,
      suivi:
        normalizeDateOnly(formData.createdAt) !== normalizeDateOnly(member.createdAt) ||
        normalizeDateOnly(formData.integrationDate) !== normalizeDateOnly(member.integrationDate) ||
        normalizeDateOnly(formData.birthday) !== normalizeDateOnly(member.birthday) ||
        normalizeDateOnly(formData.twitchAffiliateDate) !== normalizeDateOnly(member.twitchAffiliateDate) ||
        normalizeText(formData.parrain) !== normalizeText(member.parrain) ||
        normalizeText(formData.onboardingStatus) !== normalizeText(member.onboardingStatus) ||
        normalizeText(formData.mentorTwitchLogin) !== normalizeText(member.mentorTwitchLogin) ||
        normalizeText(formData.primaryLanguage) !== normalizeText(member.primaryLanguage) ||
        normalizeText(formData.timezone) !== normalizeText(member.timezone) ||
        normalizeText(formData.countryCode) !== normalizeText(member.countryCode) ||
        normalizeDateOnly(formData.lastReviewAt) !== normalizeDateOnly(member.lastReviewAt) ||
        normalizeDateOnly(formData.nextReviewAt) !== normalizeDateOnly(member.nextReviewAt),
      badges: !areStringArraysEqual(formData.badges, member.badges),
      notes:
        normalizeText(formData.description) !== normalizeText(member.description) ||
        normalizeText(formData.notesInternes) !== normalizeText(member.notesInternes),
    };
  }, [formData, member, roleChangeReason]);

  const tabErrorState: Record<EditTab, boolean> = {
    comptes: !!validationErrors.twitch || !!validationErrors.discordId,
    role: false,
    suivi: !!validationErrors.integrationDate || !!validationErrors.nextReviewAt,
    badges: false,
    notes: false,
  };

  const modifiedTabCount = tabOrder.filter((tab) => tabDirtyState[tab]).length;
  const hasUnsavedChanges = modifiedTabCount > 0;
  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  const focusTab = (tab: EditTab) => {
    const node = tabButtonRefs.current[tab];
    if (node) node.focus();
  };

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, currentTab: EditTab) => {
    const currentIndex = tabOrder.indexOf(currentTab);
    if (currentIndex < 0) return;
    let targetIndex = currentIndex;
    if (event.key === "ArrowRight") {
      targetIndex = (currentIndex + 1) % tabOrder.length;
    } else if (event.key === "ArrowLeft") {
      targetIndex = (currentIndex - 1 + tabOrder.length) % tabOrder.length;
    } else if (event.key === "Home") {
      targetIndex = 0;
    } else if (event.key === "End") {
      targetIndex = tabOrder.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    const nextTab = tabOrder[targetIndex];
    setActiveTab(nextTab);
    focusTab(nextTab);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasValidationErrors) {
      alert("Impossible d'enregistrer : corrigez les erreurs du formulaire.");
      return;
    }
    // Si le rôle a changé, ajouter roleChangeReason aux données
    const normalizedRole = toCanonicalMemberRole(formData.role);
    const dataToSave = {
      ...formData,
      role: normalizedRole,
      statut: normalizedRole === "Communauté" ? ("Inactif" as const) : formData.statut,
    };
    if (formData.role !== originalRole) {
      (dataToSave as any).roleChangeReason = roleChangeReason || undefined;
    }
    onSave(dataToSave);
  };

  const resetFormToInitial = () => {
    setFormData({ ...member, role: toCanonicalMemberRole(member.role) });
    setRoleChangeReason("");
    setBadgeInput("");
    setValidationErrors({});
  };

  const getStatusBadgeColor = (statut: "Actif" | "Inactif") => {
    return statut === "Actif"
      ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
      : "bg-purple-900/20 text-purple-400 border-purple-900/30";
  };

  const adminFicheHref = `/admin/membres/fiche/${encodeURIComponent(
    String(formData.discordId || formData.twitchId || formData.twitch || formData.nom || "")
  )}`;
  const twitchChannelUrl = formData.twitch ? `https://www.twitch.tv/${formData.twitch}` : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-md sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-indigo-400/20 bg-[#0f1118] shadow-[0_24px_80px_rgba(0,0,0,0.55),0_0_0_1px_rgba(99,102,241,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent"
          aria-hidden
        />
        {/* Header */}
        <div className="relative flex-shrink-0 border-b border-white/10 bg-[linear-gradient(125deg,rgba(79,70,229,0.18),rgba(15,17,24,0.96)_42%,rgba(56,189,248,0.08))] p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <div className="relative shrink-0">
                <img
                  src={formData.avatar}
                  alt={formData.nom}
                  className="h-20 w-20 rounded-2xl border border-white/15 object-cover shadow-lg shadow-black/40 ring-2 ring-indigo-500/20 sm:h-[5.5rem] sm:w-[5.5rem]"
                />
                <span
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-lg border border-amber-400/40 bg-amber-500/25 text-amber-100 shadow-md"
                  title="Membre TENF"
                  aria-hidden
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-200/90">
                  <Sparkles className="h-3 w-3 text-amber-300" aria-hidden />
                  Fiche créateur · TENF New Family
                </p>
                <h2 className="truncate text-2xl font-bold tracking-tight text-white sm:text-3xl">{formData.nom}</h2>
                <p className="text-sm text-slate-400">
                  Réf. admin #{formData.id}
                  {formData.twitch ? (
                    <>
                      {" "}
                      · <span className="text-slate-300">@{formData.twitch}</span>
                    </>
                  ) : null}
                </p>
                <p className="max-w-2xl text-xs leading-relaxed text-slate-400">
                  Les changements ici alimentent l&apos;espace membre et les pages publiques (selon les champs). Avance par onglet :
                  identité d&apos;abord, puis rôle, parcours, badges et textes.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {twitchChannelUrl ? (
                    <a
                      href={twitchChannelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#9146ff]/35 bg-[#9146ff]/15 px-3 py-1.5 text-xs font-semibold text-[#bf94ff] transition hover:bg-[#9146ff]/25"
                    >
                      Chaîne Twitch
                      <ExternalLink className="h-3.5 w-3.5 opacity-90" aria-hidden />
                    </a>
                  ) : null}
                  <Link
                    href={adminFicheHref}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/35 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
                  >
                    Fiche 360° admin
                    <ExternalLink className="h-3.5 w-3.5 opacity-90" aria-hidden />
                  </Link>
                  <Link
                    href="/membres"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                  >
                    Annuaire public
                    <ExternalLink className="h-3.5 w-3.5 opacity-90" aria-hidden />
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex flex-shrink-0 flex-wrap items-center gap-2 lg:flex-col lg:items-end">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className={getRoleBadgeClassName(formData.role)}>{getRoleBadgeLabel(formData.role)}</span>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeColor(formData.statut)}`}>
                  {formData.statut}
                </span>
                {formData.isVip ? (
                  <span className="rounded-full border border-[#9146ff]/40 bg-[#9146ff]/20 px-3 py-1 text-xs font-semibold text-[#d4b8ff]">
                    VIP
                  </span>
                ) : null}
              </div>
              <button
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-black/20 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                type="button"
                aria-label="Fermer le modal"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 border-b border-white/10 bg-[#12151f]/95 px-4 py-3 sm:px-6">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="inline-flex items-center gap-2 text-[11px] text-slate-500">
              <Keyboard className="h-3.5 w-3.5 shrink-0 text-slate-600" aria-hidden />
              Onglets : flèches gauche / droite, Home, End · Échap ferme la fenêtre.
            </p>
            <span
              className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                hasUnsavedChanges
                  ? "border-amber-400/35 bg-amber-500/15 text-amber-100"
                  : "border-white/10 bg-white/5 text-slate-400"
              }`}
            >
              {hasUnsavedChanges ? `${modifiedTabCount} section(s) modifiée(s)` : "Aucune modification en cours"}
            </span>
          </div>
          <p className="mb-3 text-xs leading-snug text-slate-400">{tabMeta[activeTab].hint}</p>
          <div
            className="-mx-1 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Sections du formulaire membre"
          >
            {tabOrder.map((tab) => {
              const { Icon, label } = tabMeta[tab];
              const selected = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`edit-member-tab-panel-${tab}`}
                  id={`edit-member-tab-${tab}`}
                  ref={(node) => {
                    tabButtonRefs.current[tab] = node;
                  }}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveTab(tab)}
                  onKeyDown={(event) => handleTabKeyDown(event, tab)}
                  className={`flex min-w-[max-content] shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-all ${
                    selected
                      ? "scale-[1.02] border-indigo-400/50 bg-gradient-to-r from-indigo-600/90 to-violet-700/85 text-white shadow-lg shadow-indigo-950/40"
                      : "border-white/10 bg-[#1a1f2e] text-slate-300 hover:border-indigo-400/25 hover:bg-[#222836] hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${selected ? "text-white" : "text-indigo-300/80"}`} aria-hidden />
                  <span>{label}</span>
                  {tabDirtyState[tab] ? (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" aria-hidden />
                  ) : null}
                  {tabErrorState[tab] ? <span className="h-2 w-2 shrink-0 rounded-full bg-red-400" aria-hidden /> : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Corps scrollable */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          <form onSubmit={handleSubmit} id="edit-member-form">
            <div className="grid grid-cols-1 gap-6">
              {/* Colonne gauche */}
              <div
                className={activeTab === "comptes" ? "space-y-6" : "hidden"}
                role="tabpanel"
                id="edit-member-tab-panel-comptes"
                aria-labelledby="edit-member-tab-comptes"
              >
                {/* Section Identité */}
                <div className={EDIT_MODAL_SECTION}>
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Identité</h3>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Nom du créateur *
                    </label>
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                </div>

                {/* Section Twitch */}
                <div className={EDIT_MODAL_SECTION}>
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Twitch</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Pseudo Twitch *
                      </label>
                      <input
                        type="text"
                        value={formData.twitch}
                        onChange={(e) => setFormData({ ...formData, twitch: e.target.value })}
                        className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                        required
                      />
                      {validationErrors.twitch && (
                        <p className="text-xs text-red-400 mt-1">{validationErrors.twitch}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        ID Twitch (numérique)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={formData.twitchId || ""}
                          onChange={(e) => setFormData({ ...formData, twitchId: e.target.value })}
                          className="flex-1 bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                          placeholder="Ex: 123456789 (résolu automatiquement)"
                        />
                        {formData.twitch && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (!confirm(`Synchroniser l'ID Twitch pour ${formData.twitch} ?`)) return;
                              try {
                                const response = await fetch('/api/admin/members/sync-twitch-id', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ twitchLogin: formData.twitch }),
                                });
                                const data = await response.json();
                                if (response.ok && data.success && data.results?.[0]?.twitchId) {
                                  setFormData({ ...formData, twitchId: data.results[0].twitchId });
                                  alert(`✅ ID Twitch synchronisé: ${data.results[0].twitchId}`);
                                } else {
                                  alert(`❌ ${data.error || 'Impossible de synchroniser l\'ID Twitch'}`);
                                }
                              } catch (error) {
                                console.error('Erreur sync Twitch ID:', error);
                                alert('❌ Erreur lors de la synchronisation');
                              }
                            }}
                            className="text-sm text-purple-400 hover:text-purple-300 bg-purple-600/20 hover:bg-purple-600/30 px-3 py-2 rounded-lg border border-purple-500/30 whitespace-nowrap"
                            title="Synchroniser depuis Twitch API"
                          >
                            🔄 Sync
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.twitchId ? (
                          <span className="text-green-400">✅ ID Twitch lié</span>
                        ) : (
                          <span className="text-yellow-400">⚠️ ID manquant - utilisez le bouton Sync pour résoudre automatiquement</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section Discord */}
                <div className={EDIT_MODAL_SECTION}>
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Discord</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Pseudo Discord *
                      </label>
                      <input
                        type="text"
                        value={formData.discord}
                        onChange={(e) => setFormData({ ...formData, discord: e.target.value })}
                        className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        ID Discord
                      </label>
                      <input
                        type="text"
                        value={formData.discordId || ""}
                        onChange={(e) => setFormData({ ...formData, discordId: e.target.value })}
                        className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                        placeholder="Ex: 535244297214361603"
                      />
                      {validationErrors.discordId && (
                        <p className="text-xs text-red-400 mt-1">{validationErrors.discordId}</p>
                      )}
                      {validationErrors.discordId && discordConflictMember && (
                        <div className="mt-2">
                          <p className="text-xs text-amber-300 mb-2">
                            Conflit détecté avec:{" "}
                            <span className="font-semibold">
                              {discordConflictMember.displayName || discordConflictMember.twitchLogin}
                            </span>{" "}
                            ({discordConflictMember.twitchLogin})
                          </p>
                          <button
                            type="button"
                            onClick={handleQuickMergeFromDiscordConflict}
                            disabled={quickMergeLoading}
                            className="text-xs bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 px-3 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {quickMergeLoading ? "Fusion en cours..." : "Fusionner ces 2 profils maintenant"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Colonne droite */}
              <div className={activeTab === "role" || activeTab === "suivi" || activeTab === "badges" ? "space-y-6" : "hidden"}>
                {/* Section Statut */}
                <div
                  className={activeTab === "role" ? EDIT_MODAL_SECTION : "hidden"}
                  role="tabpanel"
                  id="edit-member-tab-panel-role"
                  aria-labelledby="edit-member-tab-role"
                >
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Statut</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-semibold text-gray-300">
                          Rôle
                        </label>
                        {formData.roleHistory && formData.roleHistory.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowRoleHistory(true)}
                            className="inline-flex items-center gap-1 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-2 py-1 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/20"
                          >
                            <History className="h-3.5 w-3.5" aria-hidden />
                            Historique
                          </button>
                        )}
                      </div>
                      {originalRole === "Communauté" && (
                        <div className="mb-2 p-2 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                          <p className="text-xs text-orange-300">
                            ⚠️ Rôle &quot;Communauté&quot; forcé par l&apos;évaluation mensuelle. Changez le rôle ci-dessous pour le retirer.
                          </p>
                        </div>
                      )}
                      <select
                        value={formData.role}
                        onChange={(e) => {
                          const nextRole = e.target.value as MemberRole;
                          setFormData((prev) => ({
                            ...prev,
                            role: nextRole,
                            statut: nextRole === "Communauté" ? "Inactif" : prev.statut,
                          }));
                        }}
                        className={`w-full bg-[#0e0e10] border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 ${
                          formData.role === "Communauté" ? 'border-orange-500/50' : 'border-gray-700'
                        }`}
                      >
                        <option value="Nouveau">Nouveau</option>
                        <option value="Affilié">Affilié</option>
                        <option value="Développement">Développement</option>
                        <option value="Modérateur">Modérateur</option>
                        <option value="Modérateur en formation">Modérateur en formation</option>
                        <option value="Modérateur en activité réduite">Modérateur en activité réduite</option>
                        <option value="Modérateur en pause">Modérateur en pause</option>
                        <option value="Admin">Admin</option>
                        <option value="Admin Coordinateur">Admin Coordinateur</option>
                        <option value="Créateur Junior">Créateur Junior</option>
                        <option value="Les P'tits Jeunes">Les P'tits Jeunes</option>
                        <option value="Soutien TENF">Soutien TENF</option>
                        <option value="Contributeur TENF du Mois">Contributeur TENF du Mois</option>
                        <option value="Communauté">Communauté (évaluation)</option>
                      </select>
                      {formData.role !== originalRole && (
                        <div className="mt-2">
                          <label className="block text-xs text-gray-400 mb-1">
                            Raison du changement de rôle (optionnel)
                          </label>
                          <input
                            type="text"
                            value={roleChangeReason}
                            onChange={(e) => setRoleChangeReason(e.target.value)}
                            className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                            placeholder="Ex: Promotion, changement de fonction..."
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Statut
                      </label>
                      {formData.role === "Communauté" && (
                        <p className="text-xs text-orange-300 mb-2">
                          Le rôle Communauté impose le statut Inactif. Pour réactiver ce membre, change d&apos;abord le rôle.
                        </p>
                      )}
                      <select
                        value={formData.statut}
                        onChange={(e) =>
                          setFormData({ ...formData, statut: e.target.value as "Actif" | "Inactif" })
                        }
                        className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="Actif" disabled={formData.role === "Communauté"}>
                          Actif
                        </option>
                        <option value="Inactif">Inactif</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        VIP
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isVip || false}
                          onChange={(e) => setFormData({ ...formData, isVip: e.target.checked })}
                          className="w-4 h-4 text-purple-600 bg-[#0e0e10] border-gray-700 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-300">Membre VIP</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Shadowban Lives
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.shadowbanLives || false}
                          onChange={(e) => setFormData({ ...formData, shadowbanLives: e.target.checked })}
                          className="w-4 h-4 text-purple-600 bg-[#0e0e10] border-gray-700 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-300">Masquer ce membre uniquement sur la page /lives</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Le membre reste visible ailleurs sur le site.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section Badges */}
                <div
                  className={activeTab === "badges" ? EDIT_MODAL_SECTION : "hidden"}
                  role="tabpanel"
                  id="edit-member-tab-panel-badges"
                  aria-labelledby="edit-member-tab-badges"
                >
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Badges</h3>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={badgeInput}
                        onChange={(e) => setBadgeInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (badgeInput.trim() && !formData.badges?.includes(badgeInput.trim())) {
                              setFormData({
                                ...formData,
                                badges: [...(formData.badges || []), badgeInput.trim()],
                              });
                              setBadgeInput("");
                            }
                          }
                        }}
                        className="flex-1 bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                        placeholder="Ajouter un badge (ex: VIP Élite, Modérateur Junior...)"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (badgeInput.trim() && !formData.badges?.includes(badgeInput.trim())) {
                            setFormData({
                              ...formData,
                              badges: [...(formData.badges || []), badgeInput.trim()],
                            });
                            setBadgeInput("");
                          }
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg whitespace-nowrap"
                      >
                        Ajouter
                      </button>
                    </div>
                    {formData.badges && formData.badges.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.badges.map((badge, index) => (
                          <span
                            key={index}
                            className="bg-purple-600/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-2"
                          >
                            {badge}
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  badges: formData.badges?.filter((_, i) => i !== index),
                                });
                              }}
                              className="text-purple-300 hover:text-white"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Section Dates */}
                <div
                  className={activeTab === "suivi" ? EDIT_MODAL_SECTION : "hidden"}
                  role="tabpanel"
                  id="edit-member-tab-panel-suivi"
                  aria-labelledby="edit-member-tab-suivi"
                >
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Dates</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Date de création (membre depuis)
                      </label>
                      <input
                        type="date"
                        value={formData.createdAt ? formData.createdAt.split('T')[0] : ""}
                        onChange={(e) => {
                          const dateValue = e.target.value;
                          setFormData({
                            ...formData,
                            createdAt: dateValue ? new Date(dateValue).toISOString() : undefined,
                          });
                        }}
                        className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Date d'ajout du membre dans TENF V2 (utilisée pour "membre depuis X")
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Date d'intégration
                      </label>
                      <input
                        type="date"
                        value={formData.integrationDate ? formData.integrationDate.split('T')[0] : ""}
                        onChange={(e) => {
                          const dateValue = e.target.value;
                          setFormData({
                            ...formData,
                            integrationDate: dateValue ? new Date(dateValue).toISOString() : undefined,
                          });
                        }}
                        className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                      />
                      {validationErrors.integrationDate && (
                        <p className="text-xs text-red-400 mt-1">{validationErrors.integrationDate}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Date de la réunion d'intégration validée
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Date d'anniversaire
                      </label>
                      <input
                        type="date"
                        value={formData.birthday ? formData.birthday.split('T')[0] : ""}
                        onChange={(e) => {
                          const dateValue = e.target.value;
                          setFormData({
                            ...formData,
                            birthday: dateValue ? new Date(dateValue).toISOString() : undefined,
                          });
                        }}
                        className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Utilisée pour les mises en avant anniversaire du jour
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Date d'affiliation Twitch
                      </label>
                      <input
                        type="date"
                        value={formData.twitchAffiliateDate ? formData.twitchAffiliateDate.split('T')[0] : ""}
                        onChange={(e) => {
                          const dateValue = e.target.value;
                          setFormData({
                            ...formData,
                            twitchAffiliateDate: dateValue ? new Date(dateValue).toISOString() : undefined,
                          });
                        }}
                        className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Date d'obtention du statut affilié Twitch
                      </p>
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Parrain / Marraine
                      </label>
                      <input
                        type="text"
                        value={formData.parrain || ""}
                        onChange={(e) => handleParrainInputChange(e.target.value)}
                        onFocus={() => {
                          if (formData.parrain) {
                            handleParrainInputChange(formData.parrain);
                          }
                        }}
                        onBlur={() => {
                          // Délai pour permettre le clic sur une suggestion
                          setTimeout(() => setShowParrainSuggestions(false), 200);
                        }}
                        className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                        placeholder="Rechercher un membre..."
                      />
                      {showParrainSuggestions && parrainSuggestions.length > 0 && (
                        <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-indigo-400/25 bg-[#151821] py-1 shadow-xl shadow-black/40 ring-1 ring-black/30">
                          {parrainSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => selectParrain(suggestion)}
                              className="w-full px-4 py-2.5 text-left text-sm text-white transition hover:bg-indigo-600/25"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Membre qui a parrainé ce membre dans TENF
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Statut onboarding
                      </label>
                      <select
                        value={formData.onboardingStatus || "a_faire"}
                        onChange={(e) => setFormData({ ...formData, onboardingStatus: e.target.value as "a_faire" | "en_cours" | "termine" })}
                        className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="a_faire">A faire</option>
                        <option value="en_cours">En cours</option>
                        <option value="termine">Termine</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Mentor (login Twitch)
                      </label>
                      <input
                        type="text"
                        value={formData.mentorTwitchLogin || ""}
                        onChange={(e) => setFormData({ ...formData, mentorTwitchLogin: e.target.value.toLowerCase().trim() })}
                        className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                        placeholder="Ex: redshadow31"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          Langue principale
                        </label>
                        <input
                          type="text"
                          value={formData.primaryLanguage || ""}
                          onChange={(e) => setFormData({ ...formData, primaryLanguage: e.target.value })}
                          className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                          placeholder="Français"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          Fuseau horaire (IANA)
                        </label>
                        <input
                          type="text"
                          value={formData.timezone || ""}
                          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                          className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                          placeholder="Europe/Paris"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          Pays (ISO2)
                        </label>
                        <input
                          type="text"
                          maxLength={2}
                          value={formData.countryCode || ""}
                          onChange={(e) => setFormData({ ...formData, countryCode: e.target.value.toUpperCase().trim() })}
                          className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                          placeholder="FR"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          Dernière revue
                        </label>
                        <input
                          type="date"
                          value={formData.lastReviewAt ? formData.lastReviewAt.split("T")[0] : ""}
                          onChange={(e) => setFormData({ ...formData, lastReviewAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                          className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Prochaine revue
                      </label>
                      <input
                        type="date"
                        value={formData.nextReviewAt ? formData.nextReviewAt.split("T")[0] : ""}
                        onChange={(e) => setFormData({ ...formData, nextReviewAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                        className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                      />
                      {validationErrors.nextReviewAt && (
                        <p className="text-xs text-red-400 mt-1">{validationErrors.nextReviewAt}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bas pleine largeur */}
            <div
              className={activeTab === "notes" ? "mt-6 space-y-4" : "hidden"}
              role="tabpanel"
              id="edit-member-tab-panel-notes"
              aria-labelledby="edit-member-tab-notes"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Descriptif du streamer
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 min-h-[100px]"
                  placeholder="Description publique du streamer..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Notes internes
                </label>
                <textarea
                  value={formData.notesInternes || ""}
                  onChange={(e) => setFormData({ ...formData, notesInternes: e.target.value })}
                  className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 min-h-[100px]"
                  placeholder="Notes internes (non visibles publiquement)..."
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer fixe */}
        <div className="flex-shrink-0 border-t border-white/10 bg-[linear-gradient(180deg,rgba(18,21,32,0.98),rgba(12,14,20,1))] p-4 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <p
              className={`text-xs font-medium ${
                hasValidationErrors ? "text-red-300" : hasUnsavedChanges ? "text-emerald-200/90" : "text-slate-500"
              }`}
            >
              {hasValidationErrors
                ? `${Object.keys(validationErrors).length} erreur(s) à corriger avant enregistrement`
                : hasUnsavedChanges
                ? "Tu peux enregistrer : les données à jour pour les créateurs et le staff."
                : "Aucun changement détecté — modifie un champ pour activer l’enregistrement."}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={resetFormToInitial}
              disabled={!hasUnsavedChanges}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              <RotateCcw className="h-4 w-4 shrink-0" aria-hidden />
              Réinitialiser
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-[#252830] py-3 text-sm font-semibold text-white transition hover:bg-[#323846] sm:min-w-[120px] sm:flex-none"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="edit-member-form"
              disabled={hasValidationErrors || !hasUnsavedChanges}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-indigo-400/40 bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:border-transparent disabled:!bg-slate-700 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:shadow-none sm:min-w-[200px]"
            >
              <Save className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              {hasUnsavedChanges ? "Enregistrer" : "À jour"}
            </button>
          </div>
        </div>

        {/* Modal Historique des rôles */}
        {showRoleHistory && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setShowRoleHistory(false)}
            role="presentation"
          >
            <div
              className="max-h-[82vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-indigo-400/25 bg-[#12151f] shadow-2xl shadow-black/50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-[linear-gradient(90deg,rgba(79,70,229,0.2),transparent)] p-5">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                    <History className="h-5 w-5 text-indigo-300" aria-hidden />
                    Historique des rôles
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">Traçabilité des changements de rôle pour ce membre.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRoleHistory(false)}
                  className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                  aria-label="Fermer l'historique"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="max-h-[calc(82vh-5.5rem)] overflow-y-auto p-5">
                {formData.roleHistory && formData.roleHistory.length > 0 ? (
                  <ul className="space-y-3">
                    {formData.roleHistory.map((entry, index) => (
                      <li
                        key={index}
                        className="rounded-xl border border-white/[0.08] border-l-4 border-l-indigo-500/75 bg-[linear-gradient(160deg,rgba(26,28,40,0.92),rgba(14,15,22,0.98))] p-4 shadow-inner shadow-black/20"
                      >
                        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                          <p className="font-semibold text-white">
                            <span className="text-slate-400">{entry.fromRole}</span>
                            <span className="mx-2 text-indigo-400">→</span>
                            <span>{entry.toRole}</span>
                          </p>
                          <time className="text-xs tabular-nums text-slate-500">
                            {new Date(entry.changedAt).toLocaleDateString("fr-FR", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </time>
                        </div>
                        <p className="text-sm text-slate-400">
                          <span className="text-slate-600">Par</span> {entry.changedBy}
                        </p>
                        {entry.reason ? (
                          <p className="mt-2 rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-sm italic text-slate-300">
                            {entry.reason}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-12 text-center text-sm text-slate-500">Aucun changement de rôle enregistré pour l’instant.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
