"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  X,
  Save,
  Tag,
  Trash2,
  Upload,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Activity,
  ShieldAlert,
  History,
} from "lucide-react";
import { getDiscordUser } from "@/lib/discord";
import { getRoleBadgeClassName, getRoleBadgeLabel, SYSTEM_BADGES } from "@/lib/roleBadgeSystem";

interface Member {
  twitchLogin: string;
  displayName: string;
  badges?: string[];
  role: string;
  isActive: boolean;
  isVip?: boolean;
}

interface BadgeEvent {
  id: string;
  memberId: string;
  type: string;
  createdAt: string;
  actor?: string;
  source?: string;
  payload?: {
    metadata?: Record<string, any>;
    previousValue?: Record<string, any>;
    newValue?: Record<string, any>;
    [key: string]: any;
  };
}

// Badges disponibles dans le système
const AVAILABLE_BADGES = [...SYSTEM_BADGES, "Streamer Vétéran", "Contributeur", "Bénévole", "Ambassadeur"];

const VIP_ELITE_BADGE = "VIP Élite";

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";

function getBadgeDisplayName(badge: string): string {
  return badge === VIP_ELITE_BADGE ? "VIP" : badge;
}

function normalizeBadgeForStorage(badge: string): string {
  const trimmed = badge.trim();
  if (trimmed.toLowerCase() === "vip") {
    return VIP_ELITE_BADGE;
  }
  if (trimmed === "Communauté (mineur)") {
    return "Communauté";
  }
  return trimmed;
}

function getBadgesFromEventPayload(event: BadgeEvent): { previousBadges: string[]; newBadges: string[] } {
  const previousRaw = event.payload?.previousValue?.badges;
  const nextRaw = event.payload?.newValue?.badges;
  const previousBadges = Array.isArray(previousRaw) ? previousRaw : [];
  const newBadges = Array.isArray(nextRaw) ? nextRaw : [];
  return { previousBadges, newBadges };
}

function isBadgeRelatedEvent(event: BadgeEvent): boolean {
  if (event.type.toLowerCase().includes("badge")) return true;
  const fieldsChanged = event.payload?.metadata?.fieldsChanged;
  if (Array.isArray(fieldsChanged) && fieldsChanged.includes("badges")) return true;
  const { previousBadges, newBadges } = getBadgesFromEventPayload(event);
  return previousBadges.length > 0 || newBadges.length > 0;
}

export default function GestionBadgesPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBadgeFilter, setSelectedBadgeFilter] = useState<string>("all");
  const [excludeBadgeFilter, setExcludeBadgeFilter] = useState<string>("none");
  const [activityFilter, setActivityFilter] = useState<"all" | "active" | "inactive">("all");
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editingBadges, setEditingBadges] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; username: string } | null>(null);
  const [badgeEvents, setBadgeEvents] = useState<BadgeEvent[]>([]);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [bulkPseudoList, setBulkPseudoList] = useState("");
  const [bulkBadgeToAdd, setBulkBadgeToAdd] = useState<string>("");
  const [bulkAnalysis, setBulkAnalysis] = useState<{
    matched: Array<{ login: string; member: Member }>;
    unmatched: Array<{ original: string; suggestions: Member[] }>;
  } | null>(null);
  const [selectedUnmatched, setSelectedUnmatched] = useState<Record<string, string>>({}); // original -> twitchLogin
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [badgeTypeToDelete, setBadgeTypeToDelete] = useState<string>("");
  const [confirmDeleteType, setConfirmDeleteType] = useState(false);

  useEffect(() => {
    async function loadAdmin() {
      const user = await getDiscordUser();
      if (user) {
        try {
          const roleResponse = await fetch("/api/user/role");
          const roleData = await roleResponse.json();
          
          if (!roleData.hasAdminAccess) {
            window.location.href = "/unauthorized";
            return;
          }
          
          setCurrentAdmin({ id: user.id, username: user.username });
        } catch (error) {
          console.error("Erreur lors du chargement de l'admin:", error);
        }
      }
    }
    loadAdmin();
    void loadMembers();
    void loadBadgeEvents();
  }, []);

  async function loadMembers() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/members", {
        cache: "no-store",
      });
      
      if (response.ok) {
        const data = await response.json();
        const membersList = (data.members || []).map((m: any) => ({
          twitchLogin: m.twitchLogin || "",
          displayName: m.displayName || m.nom || m.twitchLogin || "",
          badges: m.badges || [],
          role: m.role || "Affilié",
          isActive: m.isActive !== false,
          isVip: Boolean(m.isVip),
        }));
        
        // Trier par nom d'affichage
        membersList.sort((a: Member, b: Member) => 
          a.displayName.localeCompare(b.displayName, 'fr', { sensitivity: 'base' })
        );
        
        setMembers(membersList);
      } else {
        setMessage({ type: "error", text: "Erreur lors du chargement des membres" });
      }
    } catch (error) {
      console.error("Erreur lors du chargement des membres:", error);
      setMessage({ type: "error", text: "Erreur lors du chargement des membres" });
    } finally {
      setLoading(false);
    }
  }

  async function loadBadgeEvents() {
    try {
      setLoadingEvents(true);
      const response = await fetch("/api/admin/members/events?limit=250&page=1", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      const rawEvents = Array.isArray(data.events) ? (data.events as BadgeEvent[]) : [];
      const filtered = rawEvents.filter(isBadgeRelatedEvent);
      setBadgeEvents(filtered);
    } catch (error) {
      console.warn("Impossible de charger l'audit badges:", error);
    } finally {
      setLoadingEvents(false);
    }
  }

  const filteredMembers = useMemo(() => {
    let filtered = members;

    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.displayName.toLowerCase().includes(query) ||
          m.twitchLogin.toLowerCase().includes(query)
      );
    }

    // Filtrer par badge
    if (selectedBadgeFilter !== "all") {
      if (selectedBadgeFilter === "none") {
        filtered = filtered.filter((m) => !m.badges || m.badges.length === 0);
      } else {
        filtered = filtered.filter(
          (m) => m.badges && m.badges.includes(selectedBadgeFilter)
        );
      }
    }

    // Exclusion par badge
    if (excludeBadgeFilter !== "none") {
      filtered = filtered.filter((m) => !(m.badges || []).includes(excludeBadgeFilter));
    }

    // Filtre activité
    if (activityFilter === "active") {
      filtered = filtered.filter((m) => m.isActive);
    } else if (activityFilter === "inactive") {
      filtered = filtered.filter((m) => !m.isActive);
    }

    return filtered;
  }, [members, searchQuery, selectedBadgeFilter, excludeBadgeFilter, activityFilter]);

  function handleEditMember(member: Member) {
    setEditingMember(member);
    setEditingBadges([...(member.badges || [])]);
  }

  function toggleBadge(badge: string) {
    setEditingBadges((prev) => {
      if (prev.includes(badge)) {
        return prev.filter((b) => b !== badge);
      } else {
        return [...prev, badge];
      }
    });
  }

  function addCustomBadge(badgeName: string) {
    const normalized = normalizeBadgeForStorage(badgeName);
    if (normalized && !editingBadges.includes(normalized) && !AVAILABLE_BADGES.includes(normalized)) {
      setEditingBadges([...editingBadges, normalized]);
    }
  }

  async function handleSave() {
    if (!editingMember || !currentAdmin) return;

    try {
      setSaving(true);
      setMessage(null);

      // Charger le membre complet depuis l'API
      const memberResponse = await fetch(`/api/admin/members?twitchLogin=${editingMember.twitchLogin}`);
      if (!memberResponse.ok) {
        throw new Error("Membre non trouvé");
      }
      
      const memberData = await memberResponse.json();
      const fullMember = memberData.member || memberData.members?.[0];
      
      if (!fullMember) {
        throw new Error("Membre non trouvé");
      }

      // Préparer les mises à jour
      const updates: any = {
        badges: editingBadges,
      };

      // Appeler l'API de mise à jour
      const response = await fetch("/api/admin/members", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          twitchLogin: editingMember.twitchLogin,
          originalDiscordId: fullMember.discordId,
          originalTwitchId: fullMember.twitchId,
          ...updates,
        }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Badges mis à jour avec succès" });
        setEditingMember(null);
        setEditingBadges([]);
        // Recharger les membres
        await loadMembers();
        await loadBadgeEvents();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la mise à jour");
      }
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde:", error);
      setMessage({ type: "error", text: error.message || "Erreur lors de la sauvegarde" });
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setEditingMember(null);
    setEditingBadges([]);
    setMessage(null);
  }

  // Normaliser un pseudo pour la recherche (minuscules, sans caractères spéciaux)
  function normalizePseudo(pseudo: string): string {
    return pseudo.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  }

  // Trouver des suggestions pour un pseudo non reconnu
  function findSuggestions(pseudo: string): Member[] {
    const normalized = normalizePseudo(pseudo);
    const suggestions: Member[] = [];

    members.forEach((member) => {
      const memberLoginNormalized = normalizePseudo(member.twitchLogin);
      const memberDisplayNormalized = normalizePseudo(member.displayName);

      // Si le pseudo correspond exactement (normalisé) ou contient une partie
      if (
        memberLoginNormalized.includes(normalized) ||
        normalized.includes(memberLoginNormalized) ||
        memberDisplayNormalized.includes(normalized) ||
        normalized.includes(memberDisplayNormalized)
      ) {
        suggestions.push(member);
      }
    });

    return suggestions.slice(0, 5); // Limiter à 5 suggestions
  }

  // Analyser la liste de pseudos collée
  function analyzeBulkList() {
    if (!bulkPseudoList.trim() || !bulkBadgeToAdd) {
      setMessage({ type: "error", text: "Veuillez coller une liste de pseudos et sélectionner un badge" });
      return;
    }

    const lines = bulkPseudoList.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
    const matched: Array<{ login: string; member: Member }> = [];
    const unmatched: Array<{ original: string; suggestions: Member[] }> = [];

    lines.forEach((original) => {
      const normalized = normalizePseudo(original);
      let found = false;

      // Chercher une correspondance exacte ou proche
      for (const member of members) {
        if (
          normalizePseudo(member.twitchLogin) === normalized ||
          normalizePseudo(member.displayName) === normalized ||
          member.twitchLogin.toLowerCase() === original.toLowerCase() ||
          member.displayName.toLowerCase() === original.toLowerCase()
        ) {
          matched.push({ login: original, member });
          found = true;
          break;
        }
      }

      if (!found) {
        const suggestions = findSuggestions(original);
        unmatched.push({ original, suggestions });
      }
    });

    setBulkAnalysis({ matched, unmatched });
    setSelectedUnmatched({});
  }

  // Appliquer les badges en masse
  async function applyBulkBadges() {
    if (!bulkAnalysis || !currentAdmin) return;

    try {
      setSaving(true);
      setMessage(null);

      const membersToUpdate = [...bulkAnalysis.matched];

      // Ajouter les membres sélectionnés pour les pseudos non reconnus
      for (const [original, selectedLogin] of Object.entries(selectedUnmatched)) {
        const member = members.find((m) => m.twitchLogin === selectedLogin);
        if (member) {
          membersToUpdate.push({ login: original, member });
        }
      }

      if (membersToUpdate.length === 0) {
        setMessage({ type: "error", text: "Aucun membre à mettre à jour" });
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      // Mettre à jour chaque membre
      for (const { member } of membersToUpdate) {
        try {
          // Charger le membre complet
          const memberResponse = await fetch(`/api/admin/members?twitchLogin=${member.twitchLogin}`);
          if (!memberResponse.ok) continue;

          const memberData = await memberResponse.json();
          const fullMember = memberData.member || memberData.members?.[0];
          if (!fullMember) continue;

          // Ajouter le badge s'il n'est pas déjà présent
          const currentBadges = fullMember.badges || [];
          if (!currentBadges.includes(bulkBadgeToAdd)) {
            const updatedBadges = [...currentBadges, bulkBadgeToAdd];

            const response = await fetch("/api/admin/members", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                twitchLogin: member.twitchLogin,
                originalDiscordId: fullMember.discordId,
                originalTwitchId: fullMember.twitchId,
                badges: updatedBadges,
              }),
            });

            if (response.ok) {
              successCount++;
            } else {
              errorCount++;
            }
          } else {
            successCount++; // Déjà présent, on compte comme succès
          }
        } catch (error) {
          console.error(`Erreur pour ${member.twitchLogin}:`, error);
          errorCount++;
        }
      }

      setMessage({
        type: successCount > 0 ? "success" : "error",
        text: `${successCount} badge(s) ajouté(s) avec succès${errorCount > 0 ? `, ${errorCount} erreur(s)` : ""}`,
      });

      // Réinitialiser et recharger
      setBulkAnalysis(null);
      setBulkPseudoList("");
      setBulkBadgeToAdd("");
      setShowBulkAddModal(false);
      await loadMembers();
      await loadBadgeEvents();
    } catch (error: any) {
      console.error("Erreur lors de l'ajout en masse:", error);
      setMessage({ type: "error", text: error.message || "Erreur lors de l'ajout en masse" });
    } finally {
      setSaving(false);
    }
  }

  // Supprimer tous les badges
  async function deleteAllBadges() {
    if (!currentAdmin) return;

    try {
      setSaving(true);
      setMessage(null);

      const membersWithBadges = members.filter((m) => m.badges && m.badges.length > 0);
      let successCount = 0;
      let errorCount = 0;

      for (const member of membersWithBadges) {
        try {
          const memberResponse = await fetch(`/api/admin/members?twitchLogin=${member.twitchLogin}`);
          if (!memberResponse.ok) continue;

          const memberData = await memberResponse.json();
          const fullMember = memberData.member || memberData.members?.[0];
          if (!fullMember) continue;

          const response = await fetch("/api/admin/members", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              twitchLogin: member.twitchLogin,
              originalDiscordId: fullMember.discordId,
              originalTwitchId: fullMember.twitchId,
              badges: [],
            }),
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Erreur pour ${member.twitchLogin}:`, error);
          errorCount++;
        }
      }

      setMessage({
        type: successCount > 0 ? "success" : "error",
        text: `${successCount} membre(s) mis à jour${errorCount > 0 ? `, ${errorCount} erreur(s)` : ""}`,
      });

      setConfirmDeleteAll(false);
      await loadMembers();
      await loadBadgeEvents();
    } catch (error: any) {
      console.error("Erreur lors de la suppression:", error);
      setMessage({ type: "error", text: error.message || "Erreur lors de la suppression" });
    } finally {
      setSaving(false);
    }
  }

  async function deleteBadgeTypeFromAll() {
    if (!currentAdmin || !badgeTypeToDelete) return;

    try {
      setSaving(true);
      setMessage(null);

      const impactedMembers = members.filter((m) => (m.badges || []).includes(badgeTypeToDelete));
      let successCount = 0;
      let errorCount = 0;

      for (const member of impactedMembers) {
        try {
          const memberResponse = await fetch(`/api/admin/members?twitchLogin=${member.twitchLogin}`);
          if (!memberResponse.ok) continue;

          const memberData = await memberResponse.json();
          const fullMember = memberData.member || memberData.members?.[0];
          if (!fullMember) continue;

          const updatedBadges = (fullMember.badges || []).filter((badge: string) => badge !== badgeTypeToDelete);
          const response = await fetch("/api/admin/members", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              twitchLogin: member.twitchLogin,
              originalDiscordId: fullMember.discordId,
              originalTwitchId: fullMember.twitchId,
              badges: updatedBadges,
            }),
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Erreur suppression badge ${badgeTypeToDelete} pour ${member.twitchLogin}:`, error);
          errorCount++;
        }
      }

      setMessage({
        type: successCount > 0 ? "success" : "error",
        text: `Badge ${getBadgeDisplayName(badgeTypeToDelete)} retiré sur ${successCount} membre(s)${
          errorCount > 0 ? `, ${errorCount} erreur(s)` : ""
        }`,
      });

      setConfirmDeleteType(false);
      setBadgeTypeToDelete("");
      await loadMembers();
      await loadBadgeEvents();
    } catch (error: any) {
      console.error("Erreur suppression par type:", error);
      setMessage({ type: "error", text: error.message || "Erreur lors de la suppression par type" });
    } finally {
      setSaving(false);
    }
  }

  // Statistiques
  const stats = useMemo(() => {
    const totalBadges = members.reduce((sum, m) => sum + (m.badges?.length || 0), 0);
    const membersWithBadges = members.filter((m) => m.badges && m.badges.length > 0).length;
    const membersWithoutBadges = members.filter((m) => !m.badges || m.badges.length === 0).length;
    const badgeCounts: Record<string, number> = {};
    
    members.forEach((m) => {
      m.badges?.forEach((badge) => {
        badgeCounts[badge] = (badgeCounts[badge] || 0) + 1;
      });
    });

    const topBadges = Object.entries(badgeCounts)
      .map(([badge, count]) => ({ badge, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { totalBadges, membersWithBadges, membersWithoutBadges, badgeCounts, topBadges };
  }, [members]);

  const badgeEventsInsights = useMemo(() => {
    const now = Date.now();
    const window7 = now - 7 * 24 * 60 * 60 * 1000;
    const window30 = now - 30 * 24 * 60 * 60 * 1000;

    let added7 = 0;
    let removed7 = 0;
    let added30 = 0;
    let removed30 = 0;
    const impactedMembers7 = new Set<string>();
    const impactedMembers30 = new Set<string>();

    for (const event of badgeEvents) {
      const at = new Date(event.createdAt).getTime();
      if (Number.isNaN(at)) continue;
      const { previousBadges, newBadges } = getBadgesFromEventPayload(event);
      const prevSet = new Set(previousBadges);
      const nextSet = new Set(newBadges);
      const added = newBadges.filter((badge) => !prevSet.has(badge)).length;
      const removed = previousBadges.filter((badge) => !nextSet.has(badge)).length;

      if (at >= window7) {
        added7 += added;
        removed7 += removed;
        impactedMembers7.add(event.memberId);
      }
      if (at >= window30) {
        added30 += added;
        removed30 += removed;
        impactedMembers30.add(event.memberId);
      }
    }

    return {
      added7,
      removed7,
      net7: added7 - removed7,
      impacted7: impactedMembers7.size,
      added30,
      removed30,
      net30: added30 - removed30,
      impacted30: impactedMembers30.size,
    };
  }, [badgeEvents]);

  const prioritizedActions = useMemo(() => {
    const withoutBadges = members.filter((m) => m.isActive && (!m.badges || m.badges.length === 0));
    const inactiveWithBadges = members.filter((m) => !m.isActive && (m.badges || []).length > 0);
    const overloaded = members.filter((m) => (m.badges || []).length >= 4);
    const vipMismatch = members.filter((m) => {
      const hasVipBadge = (m.badges || []).includes(VIP_ELITE_BADGE);
      return hasVipBadge !== Boolean(m.isVip);
    });

    return [
      {
        key: "onboarding",
        label: "Actifs sans badge",
        impact: "bloquant_onboarding",
        count: withoutBadges.length,
        cta: "/admin/membres/badges?badge=none",
      },
      {
        key: "quality",
        label: "Profils surcharge badges (4+)",
        impact: "qualite_data",
        count: overloaded.length,
        cta: "/admin/membres/badges",
      },
      {
        key: "inactive",
        label: "Inactifs avec badges",
        impact: "processus_interne",
        count: inactiveWithBadges.length,
        cta: "/admin/membres/badges?activite=inactive",
      },
      {
        key: "vip",
        label: "Incohérences VIP ↔ badge VIP",
        impact: "risque_moderation",
        count: vipMismatch.length,
        cta: "/admin/membres/badges",
      },
    ]
      .map((item) => ({
        ...item,
        score:
          item.count *
          (item.impact === "bloquant_onboarding"
            ? 1.4
            : item.impact === "risque_moderation"
              ? 1.3
              : item.impact === "qualite_data"
                ? 1.2
                : 1.1),
      }))
      .sort((a, b) => b.score - a.score);
  }, [members]);

  const recentBadgeTimeline = useMemo(() => badgeEvents.slice(0, 8), [badgeEvents]);

  const bulkSimulation = useMemo(() => {
    if (!bulkAnalysis || !bulkBadgeToAdd) {
      return { totalCandidates: 0, alreadyAssigned: 0, toApply: 0 };
    }

    let totalCandidates = bulkAnalysis.matched.length;
    let alreadyAssigned = bulkAnalysis.matched.filter(({ member }) =>
      (member.badges || []).includes(bulkBadgeToAdd)
    ).length;

    for (const [_, selectedLogin] of Object.entries(selectedUnmatched)) {
      if (!selectedLogin) continue;
      const member = members.find((m) => m.twitchLogin === selectedLogin);
      if (!member) continue;
      totalCandidates++;
      if ((member.badges || []).includes(bulkBadgeToAdd)) {
        alreadyAssigned++;
      }
    }

    return {
      totalCandidates,
      alreadyAssigned,
      toApply: Math.max(0, totalCandidates - alreadyAssigned),
    };
  }, [bulkAnalysis, bulkBadgeToAdd, selectedUnmatched, members]);

  const impactClassMap: Record<string, string> = {
    bloquant_onboarding: "border-rose-400/35 bg-rose-500/15 text-rose-100",
    risque_moderation: "border-amber-400/35 bg-amber-500/15 text-amber-100",
    qualite_data: "border-sky-400/35 bg-sky-500/15 text-sky-100",
    processus_interne: "border-indigo-400/35 bg-indigo-500/15 text-indigo-100",
  };

  const impactLabelMap: Record<string, string> = {
    bloquant_onboarding: "Onboarding",
    risque_moderation: "Modération",
    qualite_data: "Qualité data",
    processus_interne: "Process interne",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff] mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8 text-white">
      <section className={`${glassCardClass} p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <Link href="/admin/membres" className="mb-3 inline-block text-sm text-slate-300 transition hover:text-white">
              ← Retour à Membres
            </Link>
            <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Membres · Rôles & badges</p>
            <div className="mt-2 flex items-center gap-2">
              <Tag className="h-6 w-6 text-indigo-200" />
              <h1 className="bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
                Gestion des badges membres
              </h1>
            </div>
            <p className="mt-3 text-sm text-slate-300">
              Pilote l’attribution des badges, les corrections en masse et la cohérence des distinctions membres.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void loadMembers();
              void loadBadgeEvents();
            }}
            disabled={loading || saving}
            className={`${subtleButtonClass} disabled:opacity-60`}
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </button>
        </div>
      </section>

      {/* Message de succès/erreur */}
      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === "success"
              ? "bg-green-900/30 border-green-600 text-green-300"
              : "bg-red-900/30 border-red-600 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Statistiques */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Total badges assignés</p>
          <p className="mt-2 text-3xl font-semibold text-indigo-200">{stats.totalBadges}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Membres avec badges</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-300">{stats.membersWithBadges}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Membres sans badges</p>
          <p className="mt-2 text-3xl font-semibold text-amber-300">{stats.membersWithoutBadges}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Membres actifs</p>
          <p className="mt-2 text-3xl font-semibold">{members.filter((m) => m.isActive).length}</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1fr]">
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Top badges distribués</h2>
          <div className="mt-3 space-y-2">
            {stats.topBadges.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun badge attribué pour le moment.</p>
            ) : (
              stats.topBadges.map((item) => (
                <div key={item.badge} className="flex items-center justify-between rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2">
                  <span className="text-sm text-slate-200">{getBadgeDisplayName(getRoleBadgeLabel(item.badge))}</span>
                  <span className="text-sm font-semibold text-indigo-200">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </article>
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Actions internes</h2>
          <div className="mt-3 space-y-2">
            <button
              onClick={() => setShowBulkAddModal(true)}
              className="w-full inline-flex items-center justify-between rounded-lg border border-emerald-300/35 bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/25"
            >
              Ajouter badges en masse
              <Upload className="h-4 w-4" />
            </button>
            <button
              onClick={() => setConfirmDeleteAll(true)}
              className="w-full inline-flex items-center justify-between rounded-lg border border-rose-300/35 bg-rose-500/15 px-3 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-500/25"
            >
              Supprimer tous les badges
              <Trash2 className="h-4 w-4" />
            </button>
            <Link
              href="/admin/membres/gestion"
              className="w-full inline-flex items-center justify-between rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2 text-sm text-slate-100 hover:border-indigo-300/45"
            >
              Ouvrir gestion membres
              <ArrowRight className="h-4 w-4 text-indigo-200" />
            </Link>
            <div className="rounded-lg border border-[#353a50] bg-[#121623]/80 p-3">
              <p className="text-xs uppercase tracking-[0.09em] text-slate-400">Purge ciblée</p>
              <div className="mt-2 flex gap-2">
                <select
                  value={badgeTypeToDelete}
                  onChange={(e) => setBadgeTypeToDelete(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-[#353a50] bg-[#0f1321] px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-300/55"
                >
                  <option value="">Sélectionner un badge</option>
                  {AVAILABLE_BADGES.map((badge) => (
                    <option key={badge} value={badge}>
                      {getBadgeDisplayName(badge)} ({stats.badgeCounts[badge] || 0})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteType(true)}
                  disabled={!badgeTypeToDelete || saving}
                  className="rounded-lg border border-rose-300/40 bg-rose-500/20 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/30 disabled:opacity-50"
                >
                  Retirer
                </button>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className={`${sectionCardClass} p-5`}>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-200" />
            <h2 className="text-lg font-semibold text-slate-100">Evolutions 7 jours</h2>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3">
              <p className="text-slate-300">Ajouts</p>
              <p className="text-xl font-semibold text-emerald-200">{badgeEventsInsights.added7}</p>
            </div>
            <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-3">
              <p className="text-slate-300">Retraits</p>
              <p className="text-xl font-semibold text-rose-200">{badgeEventsInsights.removed7}</p>
            </div>
            <div className="rounded-lg border border-sky-400/30 bg-sky-500/10 p-3">
              <p className="text-slate-300">Variation nette</p>
              <p className="text-xl font-semibold text-sky-200">{badgeEventsInsights.net7}</p>
            </div>
            <div className="rounded-lg border border-indigo-400/30 bg-indigo-500/10 p-3">
              <p className="text-slate-300">Membres impactés</p>
              <p className="text-xl font-semibold text-indigo-200">{badgeEventsInsights.impacted7}</p>
            </div>
          </div>
        </article>
        <article className={`${sectionCardClass} p-5`}>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-200" />
            <h2 className="text-lg font-semibold text-slate-100">Evolutions 30 jours</h2>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3">
              <p className="text-slate-300">Ajouts</p>
              <p className="text-xl font-semibold text-emerald-200">{badgeEventsInsights.added30}</p>
            </div>
            <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-3">
              <p className="text-slate-300">Retraits</p>
              <p className="text-xl font-semibold text-rose-200">{badgeEventsInsights.removed30}</p>
            </div>
            <div className="rounded-lg border border-sky-400/30 bg-sky-500/10 p-3">
              <p className="text-slate-300">Variation nette</p>
              <p className="text-xl font-semibold text-sky-200">{badgeEventsInsights.net30}</p>
            </div>
            <div className="rounded-lg border border-indigo-400/30 bg-indigo-500/10 p-3">
              <p className="text-slate-300">Membres impactés</p>
              <p className="text-xl font-semibold text-indigo-200">{badgeEventsInsights.impacted30}</p>
            </div>
          </div>
        </article>
        <article className={`${sectionCardClass} p-5`}>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-200" />
            <h2 className="text-lg font-semibold text-slate-100">Qualité & conformité</h2>
          </div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="rounded-lg border border-[#353a50] bg-[#121623]/80 p-3">
              <p className="text-slate-300">Profils surcharge badges (4+)</p>
              <p className="text-lg font-semibold text-amber-200">
                {members.filter((m) => (m.badges || []).length >= 4).length}
              </p>
            </div>
            <div className="rounded-lg border border-[#353a50] bg-[#121623]/80 p-3">
              <p className="text-slate-300">Inactifs avec badges</p>
              <p className="text-lg font-semibold text-rose-200">
                {members.filter((m) => !m.isActive && (m.badges || []).length > 0).length}
              </p>
            </div>
            <div className="rounded-lg border border-[#353a50] bg-[#121623]/80 p-3">
              <p className="text-slate-300">Incohérences VIP</p>
              <p className="text-lg font-semibold text-indigo-200">
                {members.filter((m) => (m.badges || []).includes(VIP_ELITE_BADGE) !== Boolean(m.isVip)).length}
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_1fr]">
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">File d'actions priorisées</h2>
          <div className="mt-3 space-y-2">
            {prioritizedActions.map((action) => (
              <div key={action.key} className="flex items-center justify-between rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-100">{action.label}</p>
                  <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs ${impactClassMap[action.impact]}`}>
                    {impactLabelMap[action.impact]}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-indigo-200">{action.count}</p>
                  <p className="text-xs text-slate-400">Score {Math.round(action.score)}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
        <article className={`${sectionCardClass} p-5`}>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-sky-200" />
            <h2 className="text-lg font-semibold text-slate-100">Audit badges récent</h2>
          </div>
          <div className="mt-3 space-y-2">
            {loadingEvents ? (
              <p className="text-sm text-slate-400">Chargement de l’audit...</p>
            ) : recentBadgeTimeline.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun événement badge détecté.</p>
            ) : (
              recentBadgeTimeline.map((event) => {
                const { previousBadges, newBadges } = getBadgesFromEventPayload(event);
                const prev = new Set(previousBadges);
                const next = new Set(newBadges);
                const added = newBadges.filter((badge) => !prev.has(badge)).length;
                const removed = previousBadges.filter((badge) => !next.has(badge)).length;
                return (
                  <div key={event.id} className="rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2 text-xs">
                    <p className="text-slate-200">
                      <span className="font-semibold">{event.memberId}</span> · {new Date(event.createdAt).toLocaleString("fr-FR")}
                    </p>
                    <p className="mt-1 text-slate-400">
                      +{added} / -{removed} · {event.actor || "system"} · {event.type}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </article>
      </section>

      {/* Boutons d'action globaux */}
      <div className="flex gap-4">
        <button
          onClick={() => setShowBulkAddModal(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/35 bg-[linear-gradient(135deg,rgba(16,185,129,0.28),rgba(6,95,70,0.4))] px-5 py-2.5 text-sm font-semibold text-emerald-100 transition hover:-translate-y-[1px] hover:border-emerald-200/55 hover:bg-[linear-gradient(135deg,rgba(16,185,129,0.4),rgba(6,95,70,0.58))]"
        >
          <Upload className="w-5 h-5" />
          Ajouter badges en masse
        </button>
        <button
          onClick={() => setConfirmDeleteAll(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-300/35 bg-[linear-gradient(135deg,rgba(244,63,94,0.24),rgba(127,29,29,0.42))] px-5 py-2.5 text-sm font-semibold text-rose-100 transition hover:-translate-y-[1px] hover:border-rose-200/55 hover:bg-[linear-gradient(135deg,rgba(244,63,94,0.36),rgba(127,29,29,0.58))]"
        >
          <Trash2 className="w-5 h-5" />
          Supprimer tous les badges
        </button>
      </div>

      {/* Filtres et recherche */}
      <section className={`${sectionCardClass} p-6`}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un membre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#353a50] bg-[#121623]/80 pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-300/55"
            />
          </div>

          {/* Filtre par badge */}
          <div>
            <select
              value={selectedBadgeFilter}
              onChange={(e) => setSelectedBadgeFilter(e.target.value)}
              className="w-full rounded-lg border border-[#353a50] bg-[#121623]/80 px-4 py-2 text-white focus:outline-none focus:border-indigo-300/55"
            >
              <option value="all">Tous les membres</option>
              <option value="none">Sans badges</option>
              {AVAILABLE_BADGES.map((badge) => (
                <option key={badge} value={badge}>
                  {getBadgeDisplayName(badge)} ({stats.badgeCounts[badge] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Exclure un badge */}
          <div>
            <select
              value={excludeBadgeFilter}
              onChange={(e) => setExcludeBadgeFilter(e.target.value)}
              className="w-full rounded-lg border border-[#353a50] bg-[#121623]/80 px-4 py-2 text-white focus:outline-none focus:border-indigo-300/55"
            >
              <option value="none">Ne pas exclure de badge</option>
              {AVAILABLE_BADGES.map((badge) => (
                <option key={`exclude-${badge}`} value={badge}>
                  Exclure: {getBadgeDisplayName(badge)}
                </option>
              ))}
            </select>
          </div>

          {/* Activité */}
          <div>
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value as "all" | "active" | "inactive")}
              className="w-full rounded-lg border border-[#353a50] bg-[#121623]/80 px-4 py-2 text-white focus:outline-none focus:border-indigo-300/55"
            >
              <option value="all">Tous (actifs + inactifs)</option>
              <option value="active">Actifs uniquement</option>
              <option value="inactive">Inactifs uniquement</option>
            </select>
          </div>
        </div>
      </section>

      {/* Liste des membres */}
      <section className={`${sectionCardClass} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800/50">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                  Membre
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                  Rôle
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                  Badges ({filteredMembers.length})
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    Aucun membre trouvé
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr
                    key={member.twitchLogin}
                    className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-white">{member.displayName}</div>
                          {!member.isActive && (
                            <span className="rounded-full border border-rose-400/35 bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-200">
                              Inactif
                            </span>
                          )}
                        </div>
                        <div className="text-gray-500 text-xs">{member.twitchLogin}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={getRoleBadgeClassName(member.role)}>
                        {getRoleBadgeLabel(member.role)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-2">
                        {member.badges && member.badges.length > 0 ? (
                          member.badges.map((badge) => (
                            <span
                              key={badge}
                              className={getRoleBadgeClassName(badge)}
                            >
                              {getBadgeDisplayName(getRoleBadgeLabel(badge))}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-xs italic">Aucun badge</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleEditMember(member)}
                        className="rounded-lg border border-indigo-300/35 bg-indigo-500/20 px-3 py-2 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/30"
                      >
                        Modifier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal d'édition */}
      {editingMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
          onClick={cancelEdit}
        >
          <div
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-[#353a50] bg-[#141927] p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Modifier les badges de {editingMember.displayName}
              </h2>
              <button
                onClick={cancelEdit}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Badges disponibles */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">
                Badges disponibles
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AVAILABLE_BADGES.map((badge) => {
                  const isSelected = editingBadges.includes(badge);
                  return (
                    <button
                      key={badge}
                      onClick={() => toggleBadge(badge)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        isSelected
                          ? "bg-indigo-500/35 text-indigo-100 border border-indigo-300/45"
                          : "bg-[#0f1321] border border-[#353a50] text-gray-300 hover:border-indigo-300/35"
                      }`}
                    >
                      {getBadgeDisplayName(badge)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Badges personnalisés */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">
                Badges sélectionnés
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {editingBadges.length > 0 ? (
                  editingBadges.map((badge) => (
                    <span
                      key={badge}
                      className={`${getRoleBadgeClassName(badge)} inline-flex items-center gap-2`}
                    >
                      {getBadgeDisplayName(getRoleBadgeLabel(badge))}
                      <button
                        onClick={() => toggleBadge(badge)}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm italic">Aucun badge sélectionné</span>
                )}
              </div>
              
              {/* Ajouter un badge personnalisé */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ajouter un badge personnalisé..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      addCustomBadge(e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                  className="flex-1 rounded-lg border border-[#353a50] bg-[#0f1321] px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-300/55"
                />
                <button
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    if (input) {
                      addCustomBadge(input.value);
                      input.value = "";
                    }
                  }}
                  className="rounded-lg border border-slate-300/30 bg-slate-500/15 px-4 py-2 text-slate-100 transition hover:bg-slate-500/25"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="rounded-lg border border-slate-300/30 bg-slate-500/15 px-6 py-2 font-semibold text-slate-100 transition hover:bg-slate-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/35 bg-emerald-500/20 px-6 py-2 font-semibold text-emerald-100 transition hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation suppression tous badges */}
      {confirmDeleteAll && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
          onClick={() => setConfirmDeleteAll(false)}
        >
          <div
            className="max-w-md w-full rounded-2xl border border-rose-500/40 bg-[#141927] p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <h2 className="text-2xl font-bold text-white">Confirmation</h2>
            </div>
            <p className="text-gray-300 mb-6">
              Êtes-vous sûr de vouloir supprimer <strong className="text-red-400">tous les badges</strong> de tous les membres ?
              Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setConfirmDeleteAll(false)}
                disabled={saving}
                className="rounded-lg border border-slate-300/30 bg-slate-500/15 px-6 py-2 font-semibold text-slate-100 transition hover:bg-slate-500/25 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={deleteAllBadges}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-300/40 bg-rose-500/20 px-6 py-2 font-semibold text-rose-100 transition hover:bg-rose-500/30 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Confirmer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation suppression d'un type de badge */}
      {confirmDeleteType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
          onClick={() => !saving && setConfirmDeleteType(false)}
        >
          <div
            className="max-w-md w-full rounded-2xl border border-rose-500/40 bg-[#141927] p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-rose-300" />
              <h2 className="text-2xl font-bold text-white">Purge ciblée</h2>
            </div>
            <p className="text-gray-300 mb-3">
              Vous allez retirer le badge <strong className="text-rose-200">{getBadgeDisplayName(badgeTypeToDelete)}</strong> sur{" "}
              <strong className="text-rose-200">
                {members.filter((m) => (m.badges || []).includes(badgeTypeToDelete)).length}
              </strong>{" "}
              membre(s).
            </p>
            <p className="text-xs text-slate-400 mb-6">Action massive irréversible sans restauration automatique.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setConfirmDeleteType(false)}
                disabled={saving}
                className="rounded-lg border border-slate-300/30 bg-slate-500/15 px-6 py-2 font-semibold text-slate-100 transition hover:bg-slate-500/25 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={deleteBadgeTypeFromAll}
                disabled={saving || !badgeTypeToDelete}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-300/40 bg-rose-500/20 px-6 py-2 font-semibold text-rose-100 transition hover:bg-rose-500/30 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Confirmer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ajout en masse */}
      {showBulkAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
          onClick={() => {
            if (!saving) {
              setShowBulkAddModal(false);
              setBulkAnalysis(null);
              setBulkPseudoList("");
              setBulkBadgeToAdd("");
              setSelectedUnmatched({});
            }
          }}
        >
          <div
            className="max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-[#353a50] bg-[#141927] p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Ajouter badges en masse</h2>
              <button
                onClick={() => {
                  if (!saving) {
                    setShowBulkAddModal(false);
                    setBulkAnalysis(null);
                    setBulkPseudoList("");
                    setBulkBadgeToAdd("");
                    setSelectedUnmatched({});
                  }
                }}
                disabled={saving}
                className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {!bulkAnalysis ? (
              <>
                {/* Sélection du badge */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Badge à ajouter *
                  </label>
                  <select
                    value={bulkBadgeToAdd}
                    onChange={(e) => setBulkBadgeToAdd(e.target.value)}
                    className="w-full rounded-lg border border-[#353a50] bg-[#0f1321] px-4 py-2 text-white focus:outline-none focus:border-indigo-300/55"
                  >
                    <option value="">Sélectionner un badge</option>
                    {AVAILABLE_BADGES.map((badge) => (
                      <option key={badge} value={badge}>
                        {getBadgeDisplayName(badge)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Zone de texte pour coller les pseudos */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Liste des pseudos (un par ligne) *
                  </label>
                  <textarea
                    value={bulkPseudoList}
                    onChange={(e) => setBulkPseudoList(e.target.value)}
                    placeholder="aabadon&#10;alicorne&#10;batje&#10;..."
                    rows={15}
                    className="w-full rounded-lg border border-[#353a50] bg-[#0f1321] px-4 py-3 font-mono text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-300/55"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Collez la liste de pseudos (un par ligne). Les pseudos seront analysés et validés.
                  </p>
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setShowBulkAddModal(false);
                      setBulkPseudoList("");
                      setBulkBadgeToAdd("");
                    }}
                    disabled={saving}
                    className="rounded-lg border border-slate-300/30 bg-slate-500/15 px-6 py-2 font-semibold text-slate-100 transition hover:bg-slate-500/25 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={analyzeBulkList}
                    disabled={!bulkPseudoList.trim() || !bulkBadgeToAdd || saving}
                    className="inline-flex items-center gap-2 rounded-lg border border-indigo-300/35 bg-indigo-500/20 px-6 py-2 font-semibold text-indigo-100 transition hover:bg-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Search className="w-5 h-5" />
                    Analyser
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Résultats de l'analyse */}
                <div className="space-y-6">
                  {/* Membres reconnus */}
                  {bulkAnalysis.matched.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <h3 className="text-lg font-semibold text-white">
                          Membres reconnus ({bulkAnalysis.matched.length})
                        </h3>
                      </div>
                      <div className="max-h-40 overflow-y-auto rounded-lg border border-green-700/30 bg-[#0f1321] p-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {bulkAnalysis.matched.map(({ login, member }) => (
                            <div key={member.twitchLogin} className="text-sm text-gray-300">
                              <span className="text-gray-400">{login}</span> →{" "}
                              <span className="text-green-400 font-semibold">{member.displayName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pseudos non reconnus */}
                  {bulkAnalysis.unmatched.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        <h3 className="text-lg font-semibold text-white">
                          Pseudos non reconnus ({bulkAnalysis.unmatched.length})
                        </h3>
                      </div>
                      <div className="max-h-96 space-y-4 overflow-y-auto rounded-lg border border-yellow-700/30 bg-[#0f1321] p-4">
                        {bulkAnalysis.unmatched.map(({ original, suggestions }) => (
                          <div key={original} className="border-b border-gray-700 pb-4 last:border-0">
                            <div className="font-semibold text-yellow-400 mb-2">{original}</div>
                            {suggestions.length > 0 ? (
                              <div className="space-y-2">
                                <label className="text-sm text-gray-400">
                                  Suggestions (sélectionnez un membre) :
                                </label>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedUnmatched((prev) => ({
                                        ...prev,
                                        [original]: "", // Ignorer ce pseudo
                                      }));
                                    }}
                                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                                      selectedUnmatched[original] === ""
                                        ? "bg-gray-600 text-white"
                                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                    }`}
                                  >
                                    Ignorer
                                  </button>
                                  {suggestions.map((member) => (
                                    <button
                                      key={member.twitchLogin}
                                      onClick={() => {
                                        setSelectedUnmatched((prev) => ({
                                          ...prev,
                                          [original]: member.twitchLogin,
                                        }));
                                      }}
                                      className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                                        selectedUnmatched[original] === member.twitchLogin
                                          ? "bg-[#9146ff] text-white"
                                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                      }`}
                                    >
                                      {member.displayName} ({member.twitchLogin})
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 italic">
                                Aucune suggestion trouvée. Ce pseudo sera ignoré.
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Résumé */}
                  <div className="rounded-lg border border-[#353a50] bg-[#0f1321] p-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-400">{bulkAnalysis.matched.length}</div>
                        <div className="text-xs text-gray-400">Reconnus</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-400">
                          {Object.values(selectedUnmatched).filter((v) => v !== "").length}
                        </div>
                        <div className="text-xs text-gray-400">Sélectionnés</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-400">
                          {bulkAnalysis.matched.length + Object.values(selectedUnmatched).filter((v) => v !== "").length}
                        </div>
                        <div className="text-xs text-gray-400">Total à mettre à jour</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-amber-300">{bulkSimulation.alreadyAssigned}</div>
                        <div className="text-xs text-gray-400">Déjà badge</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-emerald-300">{bulkSimulation.toApply}</div>
                        <div className="text-xs text-gray-400">Nouveaux ajouts</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => {
                        setBulkAnalysis(null);
                        setSelectedUnmatched({});
                      }}
                      disabled={saving}
                      className="rounded-lg border border-slate-300/30 bg-slate-500/15 px-6 py-2 font-semibold text-slate-100 transition hover:bg-slate-500/25 disabled:opacity-50"
                    >
                      Retour
                    </button>
                    <button
                      onClick={applyBulkBadges}
                      disabled={
                        saving || bulkSimulation.totalCandidates === 0
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/35 bg-emerald-500/20 px-6 py-2 font-semibold text-emerald-100 transition hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Traitement...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Appliquer ({bulkSimulation.toApply})
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

