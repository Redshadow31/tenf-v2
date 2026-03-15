"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toCanonicalMemberRole } from "@/lib/memberRoles";
import { getRoleBadgeClassName, getRoleBadgeLabel } from "@/lib/roleBadgeSystem";

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
  const tabLabels: Record<EditTab, string> = {
    comptes: "Identité & comptes",
    role: "Rôles & statut",
    suivi: "Profil & suivi",
    badges: "Badges",
    notes: "Description & notes",
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
    if (Object.keys(validationErrors).length > 0) {
      alert("Impossible d'enregistrer : corrigez les erreurs du formulaire.");
      return;
    }
    // Si le rôle a changé, ajouter roleChangeReason aux données
    const dataToSave = { ...formData, role: toCanonicalMemberRole(formData.role) };
    if (formData.role !== originalRole) {
      (dataToSave as any).roleChangeReason = roleChangeReason || undefined;
    }
    onSave(dataToSave);
  };

  const getStatusBadgeColor = (statut: "Actif" | "Inactif") => {
    return statut === "Actif"
      ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
      : "bg-purple-900/20 text-purple-400 border-purple-900/30";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <div
        className="bg-[#1a1a1d] border border-gray-700 rounded-lg max-w-5xl w-full max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header fixe */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-4">
            <img
              src={formData.avatar}
              alt={formData.nom}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div>
              <h2 className="text-2xl font-bold text-white">{formData.nom}</h2>
              <p className="text-sm text-gray-400">ID: {formData.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={getRoleBadgeClassName(formData.role)}>
              {getRoleBadgeLabel(formData.role)}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeColor(formData.statut)}`}>
              {formData.statut}
            </span>
            {formData.isVip && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#9146ff]/20 text-[#9146ff] border border-[#9146ff]/30">
                VIP
              </span>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors ml-2"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-gray-700 bg-[#141418]">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-xs text-gray-400">
              Navigation clavier onglets: fleches gauche/droite, Home, End.
            </p>
            <span className="text-xs text-gray-400">
              {modifiedTabCount > 0 ? `${modifiedTabCount} onglet(s) modifié(s)` : "Aucune modification"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Sections du formulaire membre">
            {tabOrder.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                aria-controls={`edit-member-tab-panel-${tab}`}
                id={`edit-member-tab-${tab}`}
                ref={(node) => {
                  tabButtonRefs.current[tab] = node;
                }}
                tabIndex={activeTab === tab ? 0 : -1}
                onClick={() => setActiveTab(tab)}
                onKeyDown={(event) => handleTabKeyDown(event, tab)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors border ${
                  activeTab === tab
                    ? "bg-purple-600 text-white"
                    : "bg-[#0e0e10] text-gray-300 border-gray-700 hover:text-white"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {tabLabels[tab]}
                  {tabDirtyState[tab] && <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />}
                  {tabErrorState[tab] && <span className="h-2 w-2 rounded-full bg-red-400" aria-hidden="true" />}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Corps scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
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
                <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
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
                <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
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
                <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
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
                  className={activeTab === "role" ? "bg-[#0e0e10] border border-gray-700 rounded-lg p-4" : "hidden"}
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
                            className="text-xs text-purple-400 hover:text-purple-300 underline"
                          >
                            📜 Historique
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
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as MemberRole })}
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
                      <select
                        value={formData.statut}
                        onChange={(e) =>
                          setFormData({ ...formData, statut: e.target.value as "Actif" | "Inactif" })
                        }
                        className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="Actif">Actif</option>
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
                  className={activeTab === "badges" ? "bg-[#0e0e10] border border-gray-700 rounded-lg p-4" : "hidden"}
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
                  className={activeTab === "suivi" ? "bg-[#0e0e10] border border-gray-700 rounded-lg p-4" : "hidden"}
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
                        <div className="absolute z-10 w-full mt-1 bg-[#1a1a1d] border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {parrainSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => selectParrain(suggestion)}
                              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-purple-600/20 transition-colors"
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
        <div className="flex gap-3 p-6 border-t border-gray-700 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="edit-member-form"
            disabled={Object.keys(validationErrors).length > 0}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Enregistrer
          </button>
        </div>

        {/* Modal Historique des rôles */}
        {showRoleHistory && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          >
            <div
              className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Historique des rôles</h3>
                <button
                  onClick={() => setShowRoleHistory(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              {formData.roleHistory && formData.roleHistory.length > 0 ? (
                <div className="space-y-3">
                  {formData.roleHistory.map((entry, index) => (
                    <div
                      key={index}
                      className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-white font-semibold">
                            {entry.fromRole} → {entry.toRole}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            {new Date(entry.changedAt).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-300">
                        <span className="text-gray-500">Modifié par:</span> {entry.changedBy}
                      </div>
                      {entry.reason && (
                        <div className="text-sm text-gray-400 mt-2 italic">
                          Raison: {entry.reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  Aucun historique de changement de rôle
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
