"use client";

import { useState, useEffect, useRef, Fragment, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Plus,
  Upload,
  LayoutGrid,
  Eye,
  Download,
  RefreshCw,
  Copy,
  Save,
  Users,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
  History,
  ArchiveRestore,
  Trash2,
  Calendar,
  Sparkles,
  Star,
  LayoutList,
  ClipboardList,
  Zap,
  UserCheck,
  HeartHandshake,
  UserCircle2,
  Shield,
  Percent,
  ExternalLink,
  ArrowUpDown,
  Filter,
  RotateCcw,
  Bookmark,
  PauseCircle,
  HelpCircle,
} from "lucide-react";
import MemberBadges from "@/components/admin/MemberBadges";
import GestionBulkReasonModal from "@/components/admin/members-gestion/GestionBulkReasonModal";
import GestionStatusTabs from "@/components/admin/members-gestion/GestionStatusTabs";
import GestionTeamShortcuts from "@/components/admin/members-gestion/GestionTeamShortcuts";
import GestionActionsMenu, {
  type GestionActionGroup,
} from "@/components/admin/members-gestion/GestionActionsMenu";
import MemberStateBadge from "@/components/admin/members-gestion/MemberStateBadge";
import { getMemberTenfState } from "@/lib/admin/members-gestion/memberState";
import AddChannelModal from "@/components/admin/AddChannelModal";
import EditMemberModal from "@/components/admin/EditMemberModal";
import BulkImportModal from "@/components/admin/BulkImportModal";
import VerifyListModalV2 from "@/components/admin/VerifyListModalV2";
import MergeMemberModal from "@/components/admin/MergeMemberModal";
import MemberHistoryModal from "@/components/admin/MemberHistoryModal";
import VerifyTwitchNamesModal from "@/components/admin/VerifyTwitchNamesModal";
import AdminToastStack from "@/components/admin/ui/AdminToastStack";
import { getDiscordUser } from "@/lib/discord";
import { isFounder } from "@/lib/adminRoles";
import { getRoleBadgeClasses } from "@/lib/roleColors";
import { isHonoraryStaffRole, isInactiveExitMemberRole, toCanonicalMemberRole } from "@/lib/memberRoles";
import { getRoleBadgeLabel, STAFF_MEMBER_ROLE_KEYS } from "@/lib/roleBadgeSystem";
import { MemberRoleSelectOptions } from "@/components/admin/members-gestion/MemberRoleSelectOptions";
import { getMemberRoleFilterOptions } from "@/lib/admin/members-gestion/memberListHelpers";
import { calendarDayKey, indexIntegrationsByCalendarDay, type SessionDayIndex } from "@/lib/integrationSessionCalendar";
import type { Member, MemberRole, MemberStatus, DiscordVerifyResult, DiscordVerifyResponse, PresetFilter, SortableColumn } from "@/lib/admin/members-gestion/types";
import {
  ADMIN_MEMBERS_LIST_QUERY,
  glassCardClass,
  sectionCardClass,
  subtleButtonClass,
} from "@/lib/admin/members-gestion/constants";
import {
  parseApiResponse,
  getPresetFilterDisplayLabel,
  getMemberCompleteness,
  isStaffRole,
  computeMemberListPipeline,
} from "@/lib/admin/members-gestion/memberListHelpers";
import {
  type GestionStatusTab,
  parseGestionStatusTabFromUrl,
} from "@/lib/admin/members-gestion/memberPopulationFilters";
import AdminDashboardLoadingScreen from "@/components/admin/dashboard/AdminDashboardLoadingScreen";
import GestionKpiStrip from "@/components/admin/members-gestion/GestionKpiStrip";
import GestionPageAside from "@/components/admin/members-gestion/GestionPageAside";
import GestionPageHeader, { type GestionKpiId } from "@/components/admin/members-gestion/GestionPageHeader";
import GestionStaffGuide from "@/components/admin/members-gestion/GestionStaffGuide";
import VerifyDiscordNamesModal from "@/components/admin/members-gestion/VerifyDiscordNamesModal";
import MemberBentoShell, { MemberBentoCell, MemberBentoRow } from "@/components/member/layout/MemberBentoShell";
import { buildGestionCopyModel } from "@/lib/admin/members-gestion/gestionCopyModel";
import { cockpitInputClass, cockpitPanelClass } from "@/components/admin/members-hub/membersHubStyles";

export default function GestionClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isVerifyListOpen, setIsVerifyListOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<{
    id: string;
    username: string;
    isFounder: boolean;
    canWrite: boolean;
  } | null>(null);
  const [staffProfile, setStaffProfile] = useState<{
    displayName: string;
    roleLabel: string;
    rawRole: string | null;
  } | null>(null);
  const [hasAdvancedAccess, setHasAdvancedAccess] = useState(false);
  const [safeModeEnabled, setSafeModeEnabled] = useState(false);
  const [viewMode, setViewMode] = useState<"simple" | "complet">("simple");
  /** Affichage liste tableau ou grille de cartes (même données paginées). */
  const [listLayout, setListLayout] = useState<"table" | "gallery">("table");
  /** Ligne tableau dépliée : aperçu créateur + raccourcis (clic sur la ligne). */
  const [expandedTableRowKey, setExpandedTableRowKey] = useState<string | null>(null);
  const [presetFilter, setPresetFilter] = useState<PresetFilter>("all");
  const [sessionDayIndex, setSessionDayIndex] = useState<SessionDayIndex>({
    dayKeys: new Set(),
    titlesByDay: new Map(),
  });
  const [integrationSessionsLoaded, setIntegrationSessionsLoaded] = useState(false);
  const [roleFilter, setRoleFilter] = useState<"all" | MemberRole>("all");
  const [memberStatusFilter, setMemberStatusFilter] = useState<"all" | MemberStatus>("all");
  const [joinedAfterFilter, setJoinedAfterFilter] = useState("");
  const [joinedBeforeFilter, setJoinedBeforeFilter] = useState("");
  const [savedViews, setSavedViews] = useState<Array<{
    id: string;
    name: string;
    searchQuery: string;
    viewMode: "simple" | "complet";
    sortColumn: SortableColumn | null;
    sortDirection: "asc" | "desc";
    presetFilter: PresetFilter;
    roleFilter?: "all" | MemberRole;
    memberStatusFilter?: "all" | MemberStatus;
    joinedAfterFilter?: string;
    joinedBeforeFilter?: string;
  }>>([]);
  const [selectedSavedViewId, setSelectedSavedViewId] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<SortableColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const membersRef = useRef<Member[]>([]);
  membersRef.current = members;
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [membersToMerge, setMembersToMerge] = useState<any[]>([]);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [duplicates, setDuplicates] = useState<Array<{ key: string; type: string; members: any[] }>>([]);
  const [currentDuplicateIndex, setCurrentDuplicateIndex] = useState(0);
  const [showMemberHistory, setShowMemberHistory] = useState(false);
  const [showVerifyTwitchNamesModal, setShowVerifyTwitchNamesModal] = useState(false);
  const [showVerifyDiscordNamesModal, setShowVerifyDiscordNamesModal] = useState(false);
  const [syncingDiscordNames, setSyncingDiscordNames] = useState(false);
  const [verifyDiscordInfo, setVerifyDiscordInfo] = useState("");
  const [verifyDiscordError, setVerifyDiscordError] = useState("");
  const [verifyDiscordResultsByLogin, setVerifyDiscordResultsByLogin] = useState<Record<string, DiscordVerifyResult>>({});
  const [selectedMemberLogins, setSelectedMemberLogins] = useState<string[]>([]);
  const [bulkRole, setBulkRole] = useState<MemberRole | "">("");
  const [bulkStatus, setBulkStatus] = useState<"" | "Actif" | "Inactif">("");
  const [bulkOnboarding, setBulkOnboarding] = useState<"" | "a_faire" | "en_cours" | "termine">("");
  const [bulkNextReviewDate, setBulkNextReviewDate] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [statusTab, setStatusTab] = useState<GestionStatusTab>("actifs");
  const [archivedMembers, setArchivedMembers] = useState<Member[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<25 | 50 | 100>(25);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  /** Raccourcis équipe : repliés par défaut pour remonter le tableau plus vite sur laptop. */
  const [showTeamShortcuts, setShowTeamShortcuts] = useState(false);
  const [bulkReasonModalOpen, setBulkReasonModalOpen] = useState(false);
  const [bulkAuditReasonDraft, setBulkAuditReasonDraft] = useState("");
  const [actionNotice, setActionNotice] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  /** Ouverture « Ajouter une chaîne » avec pseudo prérempli (ex. lien depuis activité Discord). */
  const [addChannelInitial, setAddChannelInitial] = useState<{ twitch?: string; discord?: string } | null>(null);

  const SAVED_VIEWS_KEY = "tenf-admin-members-saved-views";

  async function fetchWithTimeout(
    input: RequestInfo | URL,
    init: RequestInit = {},
    timeoutMs = 20000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(input, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Lire search / tab / addTwitch / addDiscord depuis l'URL (deep links)
  useEffect(() => {
    const tabParam = parseGestionStatusTabFromUrl(searchParams?.get("tab") ?? null);
    if (tabParam) {
      setStatusTab(tabParam);
    }
    const searchParam = searchParams?.get("search");
    if (searchParam) {
      setSearchQuery(decodeURIComponent(searchParam));
    }
    const addTwitch = searchParams?.get("addTwitch");
    const addDiscord = searchParams?.get("addDiscord");
    if (addTwitch || addDiscord) {
      setAddChannelInitial({
        twitch: addTwitch ? decodeURIComponent(addTwitch) : undefined,
        discord: addDiscord ? decodeURIComponent(addDiscord) : undefined,
      });
    } else {
      setAddChannelInitial(null);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!addChannelInitial) return;
    if (!currentAdmin?.isFounder) return;
    setIsAddModalOpen(true);
  }, [addChannelInitial, currentAdmin?.isFounder]);

  useEffect(() => {
    async function loadAdmin() {
      const user = await getDiscordUser();
      if (user) {
        // Vérifier le rôle dans memberData pour savoir si c'est un Admin Adjoint
        try {
          const roleResponse = await fetch("/api/user/role");
          const roleData = await roleResponse.json();
          
          // Vérifier que l'utilisateur a accès admin
          if (!roleData.hasAdminAccess) {
            // Rediriger vers la page unauthorized
            window.location.href = "/unauthorized";
            return;
          }
          
          const isAdminRole = roleData.role === "Admin";
          const isAdminAdjoint = roleData.role === "Admin Adjoint";
          const canWriteRole =
            roleData.canWrite === true ||
            roleData.role === "Modérateur" ||
            roleData.role === "Modérateur en formation" ||
            roleData.role === "Modérateur en Découverte" ||
            roleData.role === "Modérateur en Accompagnement" ||
            roleData.role === "Modérateur en Autonomie" ||
            roleData.role === "Mentor" ||
            roleData.role === "Modérateur Junior";
          const founderStatus = isFounder(user.id);
          let displayName = user.username;
          try {
            const aliasResponse = await fetch("/api/admin/access/self", { cache: "no-store" });
            if (aliasResponse.ok) {
              const aliasData = await aliasResponse.json();
              if (typeof aliasData.adminAlias === "string" && aliasData.adminAlias.trim()) {
                displayName = aliasData.adminAlias.trim();
              }
            }
          } catch {
            /* ignore */
          }
          setStaffProfile({
            displayName,
            roleLabel: roleData.role || "",
            rawRole: roleData.rawRole ?? null,
          });
          // Admin, Admin Adjoint et Fondateurs ont accès complet
          setCurrentAdmin({ 
            id: user.id, 
            username: user.username, 
            isFounder: founderStatus || isAdminRole || isAdminAdjoint,
            canWrite: canWriteRole || founderStatus || isAdminRole || isAdminAdjoint,
          });
          try {
            const advancedResponse = await fetch("/api/admin/advanced-access?check=1", { cache: "no-store" });
            if (advancedResponse.ok) {
              const advancedData = await advancedResponse.json();
              setHasAdvancedAccess(advancedData?.canAccessAdvanced === true);
            } else {
              setHasAdvancedAccess(false);
            }
          } catch {
            setHasAdvancedAccess(false);
          }
        } catch (err) {
          // Fallback si l'API de rôle ne fonctionne pas
          const founderStatus = isFounder(user.id);
          // En fallback, on vérifie seulement les fondateurs (liste hardcodée)
          // Les Admin et Admin Adjoint devront attendre que l'API fonctionne
          if (!founderStatus) {
            // Si pas fondateur et API ne fonctionne pas, rediriger
            window.location.href = "/unauthorized";
            return;
          }
          setCurrentAdmin({ id: user.id, username: user.username, isFounder: founderStatus, canWrite: founderStatus });
          setStaffProfile({
            displayName: user.username,
            roleLabel: founderStatus ? "Fondateur·rice TENF" : "Staff TENF",
            rawRole: founderStatus ? "FONDATEUR" : null,
          });
          setHasAdvancedAccess(founderStatus);
        }
      } else {
        // Pas connecté, rediriger vers login
        window.location.href = "/auth/login?redirect=/admin/membres";
      }
    }
    loadAdmin();

    // Vérifier le Safe Mode
    fetch("/api/admin/safe-mode")
      .then((res) => res.json())
      .then((data) => setSafeModeEnabled(data.safeModeEnabled || false))
      .catch(() => setSafeModeEnabled(false));
  }, []);

  // Charger les membres une fois que currentAdmin est défini
  useEffect(() => {
    if (currentAdmin !== null) {
      loadMembers();
    }
  }, [currentAdmin?.id]); // Charger quand l'admin change (tous les admins ont accès maintenant)

  // Index des jours de sessions d’intégration (pour pastilles + filtre « date = session »)
  useEffect(() => {
    if (!currentAdmin) return;
    let cancelled = false;
    setIntegrationSessionsLoaded(false);
    (async () => {
      try {
        const res = await fetch("/api/integrations?admin=true", { cache: "no-store" });
        const data = res.ok ? await res.json().catch(() => null) : null;
        const list = Array.isArray(data?.integrations) ? data.integrations : [];
        if (!cancelled) {
          setSessionDayIndex(indexIntegrationsByCalendarDay(list));
          setIntegrationSessionsLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setSessionDayIndex({ dayKeys: new Set(), titlesByDay: new Map() });
          setIntegrationSessionsLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentAdmin]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_VIEWS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setSavedViews(parsed);
      }
    } catch (error) {
      console.warn("Impossible de charger les vues enregistrées:", error);
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setExpandedTableRowKey(null);
  }, [
    searchQuery,
    presetFilter,
    statusTab,
    viewMode,
    sortColumn,
    sortDirection,
    roleFilter,
    memberStatusFilter,
    joinedAfterFilter,
    joinedBeforeFilter,
    integrationSessionsLoaded,
    sessionDayIndex.dayKeys.size,
    listLayout,
  ]);

  useEffect(() => {
    if (!actionNotice) return;
    const timeout = setTimeout(() => setActionNotice(null), 5000);
    return () => clearTimeout(timeout);
  }, [actionNotice]);

  useEffect(() => {
    setExpandedTableRowKey(null);
  }, [currentPage, pageSize]);

  function saveViewsToStorage(views: typeof savedViews) {
    setSavedViews(views);
    try {
      localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(views));
    } catch (error) {
      console.warn("Impossible de sauvegarder les vues:", error);
    }
  }

  function pushNotice(type: "success" | "error" | "info", message: string) {
    setActionNotice({ type, message });
  }

  function getMemberCompleteness(member: Member): { percent: number; missing: string[]; label: string } {
    const checks = [
      { key: "discordId", ok: !!member.discordId, label: "ID Discord" },
      { key: "twitchId", ok: !!member.twitchId, label: "ID Twitch" },
      { key: "integrationDate", ok: !!member.integrationDate, label: "Date intégration" },
      { key: "parrain", ok: !!member.parrain, label: "Parrain" },
      { key: "description", ok: !!member.description, label: "Description" },
    ];
    const valid = checks.filter((c) => c.ok).length;
    const percent = Math.round((valid / checks.length) * 100);
    const missing = checks.filter((c) => !c.ok).map((c) => c.label);
    const label = percent >= 80 ? "Complet" : percent >= 50 ? "Partiel" : "Incomplet";
    return { percent, missing, label };
  }

  function saveCurrentView() {
    const name = prompt("Nom de la vue enregistrée :");
    if (!name || !name.trim()) return;
    const newView = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      searchQuery,
      viewMode,
      sortColumn,
      sortDirection,
      presetFilter,
      roleFilter,
      memberStatusFilter,
      joinedAfterFilter,
      joinedBeforeFilter,
    };
    const nextViews = [newView, ...savedViews].slice(0, 20);
    saveViewsToStorage(nextViews);
    setSelectedSavedViewId(newView.id);
  }

  function applySavedView(viewId: string) {
    setSelectedSavedViewId(viewId);
    const view = savedViews.find((v) => v.id === viewId);
    if (!view) return;
    setSearchQuery(view.searchQuery);
    setViewMode(view.viewMode);
    setSortColumn(view.sortColumn);
    setSortDirection(view.sortDirection);
    setPresetFilter(view.presetFilter);
    setRoleFilter(view.roleFilter ?? "all");
    setMemberStatusFilter(view.memberStatusFilter ?? "all");
    setJoinedAfterFilter(view.joinedAfterFilter ?? "");
    setJoinedBeforeFilter(view.joinedBeforeFilter ?? "");
  }

  function deleteSavedView(viewId: string) {
    const nextViews = savedViews.filter((v) => v.id !== viewId);
    saveViewsToStorage(nextViews);
    if (selectedSavedViewId === viewId) {
      setSelectedSavedViewId("");
    }
  }

  async function fetchRaidsStats(): Promise<Record<string, { done: number; received: number }>> {
    const stats: Record<string, { done: number; received: number }> = {};
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const raidsResponse = await fetch(`/api/discord/raids/data-v2?month=${currentMonth}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
      });
      if (!raidsResponse.ok) return stats;

      const raidsData = await raidsResponse.json();
      const filteredRaidsFaits = (raidsData.raidsFaits || []).filter((raid: any) => {
        const source = raid.source || (raid.manual ? "admin" : "twitch-live");
        if (source === "discord") return false;
        return source === "manual" || source === "admin" || raid.manual;
      });

      const filteredRaidsRecus = (raidsData.raidsRecus || []).filter((raid: any) => {
        const source = raid.source || (raid.manual ? "admin" : "twitch-live");
        if (source === "discord") return false;
        return source === "manual" || source === "admin" || raid.manual;
      });

      for (const raid of filteredRaidsFaits) {
        const raiderLogin = (raid.raiderTwitchLogin || raid.raider || "").toLowerCase();
        if (!raiderLogin) continue;
        if (!stats[raiderLogin]) stats[raiderLogin] = { done: 0, received: 0 };
        stats[raiderLogin].done += raid.count || 1;
      }

      for (const raid of filteredRaidsRecus) {
        const targetLogin = (raid.targetTwitchLogin || raid.target || "").toLowerCase();
        if (!targetLogin) continue;
        if (!stats[targetLogin]) stats[targetLogin] = { done: 0, received: 0 };
        stats[targetLogin].received += 1;
      }
    } catch (err) {
      console.warn("Impossible de charger les stats de raids:", err);
    } finally {
      clearTimeout(timeoutId);
    }

    return stats;
  }

  function applyRaidsStatsToMembers(
    membersToUpdate: Member[],
    raidsStats: Record<string, { done: number; received: number }>
  ): Member[] {
    return membersToUpdate.map((member) => {
      const login = (member.twitch || "").toLowerCase();
      const raidStats = raidsStats[login] || { done: 0, received: 0 };
      if (member.raidsDone === raidStats.done && member.raidsReceived === raidStats.received) {
        return member;
      }
      return {
        ...member,
        raidsDone: raidStats.done,
        raidsReceived: raidStats.received,
      };
    });
  }

  function getMemberStableKey(member: Pick<Member, "discordId" | "twitchId" | "twitch" | "id">): string {
    const discordId = member.discordId?.trim();
    if (discordId) return `discord:${discordId}`;
    const twitchId = member.twitchId?.trim();
    if (twitchId) return `twitchId:${twitchId}`;
    const twitchLogin = member.twitch?.trim().toLowerCase();
    if (twitchLogin) return `twitch:${twitchLogin}`;
    return `fallback:${member.id}`;
  }

  function areSameMember(a: Pick<Member, "discordId" | "twitchId" | "twitch" | "id">, b: Pick<Member, "discordId" | "twitchId" | "twitch" | "id">): boolean {
    return getMemberStableKey(a) === getMemberStableKey(b);
  }

  function mapAdminMemberToUi(member: any, index: number): Member {
    const avatar =
      member.avatar ||
      `https://placehold.co/64x64?text=${(member.displayName || member.twitchLogin).charAt(0).toUpperCase()}`;

    return {
      id: index + 1,
      avatar,
      nom: member.displayName || member.twitchLogin,
      role: member.role || "Affilié",
      statut: (member.isActive ? "Actif" : "Inactif") as MemberStatus,
      discord: member.discordUsername || "",
      discordId: member.discordId,
      twitch: member.twitchLogin || "",
      twitchUrl: member.twitchUrl || `https://www.twitch.tv/${member.twitchLogin}`,
      twitchId: member.twitchId,
      siteUsername: member.siteUsername,
      description: member.description,
      customBio: member.customBio,
      twitchStatus: member.twitchStatus,
      badges: member.badges || [],
      isVip: member.isVip || false,
      shadowbanLives: member.shadowbanLives || false,
      isModeratorJunior:
        member.badges?.includes("Modérateur en formation") ||
        member.badges?.includes("Modérateur en Découverte") ||
        member.badges?.includes("Modérateur en Accompagnement") ||
        member.badges?.includes("Modérateur en Autonomie") ||
        member.badges?.includes("Modérateur Junior") ||
        false,
      isModeratorMentor:
        member.badges?.includes("Modérateur") ||
        member.badges?.includes("Modérateur Mentor") ||
        false,
      raidsDone: 0,
      raidsReceived: 0,
      createdAt: member.createdAt
        ? typeof member.createdAt === "string"
          ? member.createdAt
          : new Date(member.createdAt).toISOString()
        : undefined,
      integrationDate: member.integrationDate
        ? typeof member.integrationDate === "string"
          ? member.integrationDate
          : new Date(member.integrationDate).toISOString()
        : undefined,
      birthday: member.birthday
        ? typeof member.birthday === "string"
          ? member.birthday
          : new Date(member.birthday).toISOString()
        : undefined,
      twitchAffiliateDate: member.twitchAffiliateDate
        ? typeof member.twitchAffiliateDate === "string"
          ? member.twitchAffiliateDate
          : new Date(member.twitchAffiliateDate).toISOString()
        : undefined,
      onboardingStatus: member.onboardingStatus,
      mentorTwitchLogin: member.mentorTwitchLogin,
      primaryLanguage: member.primaryLanguage,
      timezone: member.timezone,
      countryCode: member.countryCode,
      lastReviewAt: member.lastReviewAt
        ? typeof member.lastReviewAt === "string"
          ? member.lastReviewAt
          : new Date(member.lastReviewAt).toISOString()
        : undefined,
      nextReviewAt: member.nextReviewAt
        ? typeof member.nextReviewAt === "string"
          ? member.nextReviewAt
          : new Date(member.nextReviewAt).toISOString()
        : undefined,
      roleHistory: member.roleHistory || [],
      staffPeriods: member.staffPeriods || [],
      parrain: member.parrain,
      profileValidationStatus: member.profileValidationStatus,
    };
  }

  function mapArchiveEntryToUi(entry: any, index: number): Member {
    const snapshot = entry?.snapshot || {};
    const base = mapAdminMemberToUi(snapshot, index);
    return {
      ...base,
      id: index + 1,
      statut: "Inactif",
      isArchived: true,
      deletedAt: entry?.deletedAt
        ? typeof entry.deletedAt === "string"
          ? entry.deletedAt
          : new Date(entry.deletedAt).toISOString()
        : undefined,
      deletedBy: entry?.deletedBy,
      deleteReason: entry?.deleteReason,
    };
  }

  async function loadArchivedMembers() {
    try {
      const response = await fetch("/api/admin/members/archives", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!response.ok) {
        setArchivedMembers([]);
        return;
      }
      const data = await response.json();
      const archives = Array.isArray(data?.archives) ? data.archives : [];
      setArchivedMembers(archives.map((entry: any, index: number) => mapArchiveEntryToUi(entry, index)));
    } catch (error) {
      console.warn("Impossible de charger les archives membres:", error);
      setArchivedMembers([]);
    }
  }

  // Charger les membres depuis la base de données centralisée
  async function loadMembers() {
    try {
      setLoading(true);
      void loadArchivedMembers().catch(() => undefined);
      const raidsStatsPromise = fetchRaidsStats().catch(() => ({}));

      // Toujours essayer de charger depuis l'API centralisée (l'API vérifie les permissions)
      // L'API centralisée contient les modifications manuelles et est prioritaire
      // Tous les admins (Fondateur, Admin, Admin Adjoint, Mentor, Modérateur Junior) ont accès
      try {
        const centralResponse = await fetchWithTimeout(`/api/admin/members${ADMIN_MEMBERS_LIST_QUERY}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (centralResponse.ok) {
          const centralData = await centralResponse.json();
          const centralMembers = centralData.members || [];
          
          // L'API admin renvoie déjà les avatars Twitch pour tous les membres (y compris non validés)
          const allMembers = centralMembers;
          
          const mappedMembers: Member[] = allMembers.map((member: any, index: number) =>
            mapAdminMemberToUi(member, index)
          );
          
          setMembers(mappedMembers);
          setLoading(false);
          raidsStatsPromise.then((raidsStats) => {
            if (!raidsStats || Object.keys(raidsStats).length === 0) return;
            setMembers((prev) => applyRaidsStatsToMembers(prev, raidsStats));
          });
          return;
        } else if (centralResponse.status === 403) {
          // Accès refusé : rediriger vers unauthorized
          console.warn("Accès refusé à l'API centralisée");
          window.location.href = "/unauthorized";
          return;
        }
      } catch (err) {
        console.warn("Impossible de charger les membres depuis l'API centralisée:", err);
      }
      
      // Fallback: essayer de charger depuis Discord si l'API centralisée n'est pas disponible
      await loadDiscordMembers();
    } catch (error) {
      console.error("Erreur lors du chargement des membres:", error);
      setMembers([]);
      setArchivedMembers([]);
      setLoading(false);
    }
  }

  // Garde-fou: si recherche par ID Discord et membre absent du lot initial,
  // on récupère explicitement la fiche via l'API détail puis on l'injecte.
  useEffect(() => {
    if (loading) return;
    const raw = searchQuery.trim();
    if (!raw) return;
    const digits = raw.replace(/\D/g, "");
    if (digits.length < 10) return;

    const alreadyInList = members.some(
      (m) => String(m.discordId || "").replace(/\D/g, "") === digits
    );
    if (alreadyInList) return;

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(
          `/api/admin/members?discordId=${encodeURIComponent(digits)}`,
          {
            cache: "no-store",
            headers: { "Cache-Control": "no-cache" },
          }
        );
        if (!response.ok) return;
        const data = await response.json();
        const fetchedMember = data?.member;
        if (!fetchedMember || cancelled) return;

        setMembers((prev) => {
          const exists = prev.some(
            (m) =>
              String(m.discordId || "").replace(/\D/g, "") === digits ||
              (m.twitch || "").toLowerCase() ===
                String(fetchedMember.twitchLogin || "").toLowerCase()
          );
          if (exists) return prev;
          return [...prev, mapAdminMemberToUi(fetchedMember, prev.length)];
        });
      } catch (err) {
        console.warn("Recherche ciblée discordId échouée:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchQuery, loading, members]);

  // Charger les membres depuis le canal Discord #vos-chaînes-twitch (fallback)
  async function loadDiscordMembers() {
    try {
      setLoading(true);
      // Récupérer les membres depuis le canal Discord
      const discordResponse = await fetch("/api/discord/channel/members", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (!discordResponse.ok) {
        let errorMessage = "Erreur lors du chargement des membres Discord";
        try {
          const errorData = await discordResponse.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
          
          // Messages d'erreur plus spécifiques
          if (errorMessage.includes("Discord bot token not configured")) {
            errorMessage = "Le token du bot Discord n'est pas configuré. Veuillez configurer DISCORD_BOT_TOKEN dans Netlify.";
          } else if (errorMessage.includes("Failed to fetch Discord messages")) {
            errorMessage = "Impossible de récupérer les messages Discord. Vérifiez que le bot a accès au canal.";
          } else if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
            errorMessage = "Token Discord invalide ou expiré. Vérifiez la configuration du bot.";
          } else if (errorMessage.includes("403") || errorMessage.includes("Forbidden")) {
            errorMessage = "Le bot n'a pas les permissions nécessaires. Vérifiez les permissions du bot sur le serveur Discord.";
          }
        } catch (e) {
          // Si on ne peut pas parser l'erreur, utiliser le message par défaut
          console.error("Erreur lors du parsing de l'erreur:", e);
        }
        console.error("Erreur lors du chargement des membres depuis Discord:", errorMessage);
        pushNotice("error", `Erreur Discord: ${errorMessage}`);
        setMembers([]); // Afficher une liste vide plutôt que de rester bloqué
        return;
      }
      const discordData = await discordResponse.json();

      // Vérifier si la réponse contient des membres
      if (!discordData.members || !Array.isArray(discordData.members)) {
        console.warn("Aucun membre trouvé dans la réponse Discord");
        setMembers([]);
        return;
      }

      // Récupérer aussi les données centralisées pour enrichir (tous les admins ont accès)
      let centralMembers: any[] = [];
      try {
        const centralResponse = await fetchWithTimeout(`/api/admin/members${ADMIN_MEMBERS_LIST_QUERY}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        if (centralResponse.ok) {
          const centralData = await centralResponse.json();
          centralMembers = centralData.members || [];
        } else if (centralResponse.status === 403) {
          // Accès refusé : continuer avec les données Discord uniquement
          console.warn("Accès refusé à l'API centralisée pour enrichissement");
        }
      } catch (err) {
        console.warn("Impossible de charger les données centralisées:", err);
      }

      // Créer des maps pour fusionner les données
      const centralByDiscordId = new Map(
        centralMembers
          .filter((m: any) => m.discordId)
          .map((m: any) => [m.discordId, m])
      );
      
      // Map par Twitch login pour récupérer les IDs Discord même si pas de discordId dans Discord
      const centralByTwitchLogin = new Map(
        centralMembers
          .map((m: any) => [m.twitchLogin?.toLowerCase(), m])
      );

      // Mapper les membres Discord vers le format Member
      // L'API admin renvoie déjà les avatars pour tous les membres centralisés
      const mappedMembers: Member[] = discordData.members.map((discordMember: any, index: number) => {
        let centralMember = centralByDiscordId.get(discordMember.discordId);
        if (!centralMember && discordMember.twitchLogin) {
          centralMember = centralByTwitchLogin.get(discordMember.twitchLogin.toLowerCase());
        }
        
        const discordId = centralMember?.discordId || discordMember.discordId;
        
        // Avatar membre canonique: Twitch centralisé uniquement, sinon placeholder UI.
        let avatar = centralMember?.avatar;
        if (!avatar) {
          avatar = `https://placehold.co/64x64?text=${(discordMember.discordNickname || discordMember.discordUsername || "?").charAt(0).toUpperCase()}`;
        }
        
        return {
          id: index + 1,
          avatar,
          nom: discordMember.discordNickname || discordMember.discordUsername,
          role: toCanonicalMemberRole((centralMember?.role || discordMember.siteRole) as MemberRole),
          statut: (centralMember?.isActive !== false ? "Actif" : "Inactif") as MemberStatus,
          discord: centralMember?.discordUsername || discordMember.discordUsername,
          discordId: discordId, // Utiliser l'ID Discord de la base de données si disponible
          twitch: discordMember.twitchLogin || "",
          twitchUrl: discordMember.twitchUrl || `https://www.twitch.tv/${discordMember.twitchLogin}`,
          twitchId: centralMember?.twitchId, // Ajouter l'ID Twitch depuis la base de données
          siteUsername: centralMember?.siteUsername,
          badges: centralMember?.badges || discordMember.badges || [],
          isVip: centralMember?.isVip || discordMember.isVip || false,
          shadowbanLives: centralMember?.shadowbanLives || false,
          isModeratorJunior: discordMember.isModeratorJunior,
          isModeratorMentor: discordMember.isModeratorMentor,
          description: centralMember?.description,
          customBio: centralMember?.customBio,
          twitchStatus: centralMember?.twitchStatus,
          createdAt: centralMember?.createdAt ? (typeof centralMember.createdAt === 'string' ? centralMember.createdAt : new Date(centralMember.createdAt).toISOString()) : undefined,
          integrationDate: centralMember?.integrationDate ? (typeof centralMember.integrationDate === 'string' ? centralMember.integrationDate : new Date(centralMember.integrationDate).toISOString()) : undefined,
          birthday: centralMember?.birthday ? (typeof centralMember.birthday === 'string' ? centralMember.birthday : new Date(centralMember.birthday).toISOString()) : undefined,
          twitchAffiliateDate: centralMember?.twitchAffiliateDate ? (typeof centralMember.twitchAffiliateDate === 'string' ? centralMember.twitchAffiliateDate : new Date(centralMember.twitchAffiliateDate).toISOString()) : undefined,
          onboardingStatus: centralMember?.onboardingStatus,
          mentorTwitchLogin: centralMember?.mentorTwitchLogin,
          primaryLanguage: centralMember?.primaryLanguage,
          timezone: centralMember?.timezone,
          countryCode: centralMember?.countryCode,
          lastReviewAt: centralMember?.lastReviewAt ? (typeof centralMember.lastReviewAt === 'string' ? centralMember.lastReviewAt : new Date(centralMember.lastReviewAt).toISOString()) : undefined,
          nextReviewAt: centralMember?.nextReviewAt ? (typeof centralMember.nextReviewAt === 'string' ? centralMember.nextReviewAt : new Date(centralMember.nextReviewAt).toISOString()) : undefined,
          roleHistory: centralMember?.roleHistory || [],
          parrain: centralMember?.parrain,
          profileValidationStatus: centralMember?.profileValidationStatus,
        };
      });

      // Afficher tous les membres (actifs et inactifs) pour permettre de réactiver une chaîne désactivée
      setMembers(mappedMembers);
    } catch (error) {
      console.error("Erreur lors du chargement des membres:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue lors du chargement des membres";
      pushNotice("error", `Erreur: ${errorMessage}`);
      setMembers([]); // Afficher une liste vide plutôt que de rester bloqué
    } finally {
      setLoading(false);
    }
  }

  // Fonction pour récupérer les dernières dates de live
  const fetchLastLiveDates = async (membersToUpdate: Member[]) => {
    const twitchLogins = membersToUpdate
      .map(m => m.twitch)
      .filter(Boolean);
    
    if (twitchLogins.length === 0) return membersToUpdate;

    try {
      const response = await fetch(
        `/api/twitch/last-streams?logins=${twitchLogins.join(',')}`,
        { cache: 'no-store' }
      );
      
      if (response.ok) {
        const data = await response.json();
        const lastStreams = data.lastStreams || {};
        
        return membersToUpdate.map(member => ({
          ...member,
          lastLiveDate: lastStreams[member.twitch.toLowerCase()] || undefined,
        }));
      }
    } catch (error) {
      console.error('Error fetching last live dates:', error);
    }
    
    return membersToUpdate;
  };

  const listPipeline = useMemo(
    () =>
      computeMemberListPipeline(
        {
          members,
          archivedMembers,
          searchQuery,
          presetFilter,
          roleFilter,
          memberStatusFilter,
          joinedAfterFilter,
          joinedBeforeFilter,
          sortColumn,
          sortDirection,
          statusTab,
          integrationSessionsLoaded,
          sessionDayIndex,
        },
        pageSize,
        currentPage
      ),
    [
      members,
      archivedMembers,
      searchQuery,
      presetFilter,
      roleFilter,
      memberStatusFilter,
      joinedAfterFilter,
      joinedBeforeFilter,
      sortColumn,
      sortDirection,
      statusTab,
      integrationSessionsLoaded,
      sessionDayIndex,
      pageSize,
      currentPage,
    ]
  );

  const {
    displayedMembers,
    paginatedMembers,
    totalPages,
    clampedCurrentPage,
    startItem,
    endItem,
    newMembers,
    activeMembers,
    communityRoleMembers,
    communityFollowupMembers,
    tenfAffiliateMembers,
    departedMembers,
    bannedMembers,
    isSearching,
  } = listPipeline;

  const tableColumnCount =
    viewMode === "complet"
      ? currentAdmin?.isFounder
        ? 19
        : 18
      : currentAdmin?.isFounder
      ? 8
      : 7;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const reviewAlerts = useMemo(() => {
    const now = new Date();
    const in7days = new Date(now);
    in7days.setDate(in7days.getDate() + 7);
    let overdue = 0;
    let dueSoon = 0;
    for (const member of members) {
      if (!member.nextReviewAt) continue;
      const next = new Date(member.nextReviewAt);
      if (next.getTime() <= now.getTime()) overdue++;
      else if (next.getTime() <= in7days.getTime()) dueSoon++;
    }
    return { overdue, dueSoon };
  }, [members]);

  const gestionKpiStats = useMemo(() => {
    let totalActiveMembers = 0;
    let totalActiveMembersIntegrated = 0;
    let totalActiveNewRoleMembers = 0;
    let totalInactiveMembers = 0;
    let totalNewMembers = 0;
    let totalIncompleteMembers = 0;
    let totalWithoutTwitchId = 0;
    for (const m of members) {
      const activeOrStaff = m.statut === "Actif" || isStaffRole(m.role);
      if (activeOrStaff) {
        totalActiveMembers++;
        if (m.role !== "Nouveau") totalActiveMembersIntegrated++;
      }
      if (m.role === "Nouveau" && m.statut === "Actif") totalActiveNewRoleMembers++;
      if (
        m.statut === "Inactif" &&
        !isStaffRole(m.role) &&
        m.role !== "Nouveau" &&
        !isInactiveExitMemberRole(m.role)
      ) {
        totalInactiveMembers++;
      }
      if (m.role === "Nouveau") totalNewMembers++;
      if (getMemberCompleteness(m).percent < 80) totalIncompleteMembers++;
      if (!m.twitchId) totalWithoutTwitchId++;
    }
    return {
      totalActiveMembers,
      totalActiveMembersIntegrated,
      totalActiveNewRoleMembers,
      totalInactiveMembers,
      totalNewMembers,
      totalIncompleteMembers,
      totalWithoutTwitchId,
    };
  }, [members]);

  const {
    totalActiveMembers,
    totalActiveMembersIntegrated,
    totalActiveNewRoleMembers,
    totalInactiveMembers,
    totalNewMembers,
    totalIncompleteMembers,
    totalWithoutTwitchId,
  } = gestionKpiStats;

  const verifyDiscordRows = useMemo(
    () =>
      Object.values(verifyDiscordResultsByLogin).sort((a, b) =>
        String(a.displayName || a.twitchLogin).localeCompare(String(b.displayName || b.twitchLogin), "fr")
      ),
    [verifyDiscordResultsByLogin]
  );
  const verifyDiscordUpdatedRows = useMemo(
    () => verifyDiscordRows.filter((row) => row.status === "updated"),
    [verifyDiscordRows]
  );

  const gestionCounts = useMemo(
    () => ({
      total: members.length,
      active: totalActiveMembers,
      activeIntegrated: totalActiveMembersIntegrated,
      activeNewRole: totalActiveNewRoleMembers,
      suivi: totalInactiveMembers,
      nouveaux: totalNewMembers,
      incomplets: totalIncompleteMembers,
      sansTwitchId: totalWithoutTwitchId,
    }),
    [
      members.length,
      totalActiveMembers,
      totalActiveMembersIntegrated,
      totalActiveNewRoleMembers,
      totalInactiveMembers,
      totalNewMembers,
      totalIncompleteMembers,
      totalWithoutTwitchId,
    ],
  );

  const gestionCopy = useMemo(() => {
    if (!staffProfile) return null;
    return buildGestionCopyModel({
      displayName: staffProfile.displayName,
      roleLabel: staffProfile.roleLabel,
      rawRole: staffProfile.rawRole,
      counts: gestionCounts,
    });
  }, [staffProfile, gestionCounts]);

  const activeKpiFilters = useMemo(
    () => ({
      total: presetFilter === "all" && statusTab === "actifs",
      actifs: statusTab === "actifs" && presetFilter === "all",
      suivi: statusTab === "suivi_pause" || statusTab === "communaute",
      nouveaux: statusTab === "nouveaux",
      incomplets: presetFilter === "incomplets",
      "no-twitch-id": presetFilter === "sans_twitch_id",
    }),
    [presetFilter, statusTab],
  );

  function handleGestionKpiClick(id: GestionKpiId) {
    switch (id) {
      case "total":
        setPresetFilter("all");
        setStatusTab("actifs");
        break;
      case "actifs":
        setStatusTab("actifs");
        setPresetFilter("all");
        break;
      case "suivi":
        setStatusTab("suivi_pause");
        break;
      case "nouveaux":
        setStatusTab("nouveaux");
        break;
      case "incomplets":
        setPresetFilter("incomplets");
        break;
      case "no-twitch-id":
        setPresetFilter("sans_twitch_id");
        break;
      default:
        break;
    }
  }

  const totalArchivedMembers = archivedMembers.length;
  const STATUS_TAB_LABELS: Record<GestionStatusTab, string> = {
    actifs: "Actifs",
    communaute: "Communauté",
    suivi_pause: "Suivi pause",
    nouveaux: "Nouveaux",
    affilies: "Affiliés TENF",
    departs: "Départs",
    bans: "Bans",
    archives: "Archivé",
  };
  const activeTabLabel = STATUS_TAB_LABELS[statusTab];
  const availableRoles = useMemo(
    () => getMemberRoleFilterOptions(members.map((member) => member.role)),
    [members],
  );

  const staffRoleFilterOptions = useMemo(() => [...STAFF_MEMBER_ROLE_KEYS], []);

  // Fonction pour gérer le clic sur un en-tête de colonne
  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      // Inverser la direction si on clique sur la même colonne
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Nouvelle colonne, trier par ordre croissant
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  function toggleMemberSelection(twitchLogin: string, selected: boolean) {
    setSelectedMemberLogins((prev) => {
      if (selected) {
        if (prev.includes(twitchLogin)) return prev;
        return [...prev, twitchLogin];
      }
      return prev.filter((login) => login !== twitchLogin);
    });
  }

  function toggleSelectAllFiltered(selected: boolean) {
    if (!selected) {
      setSelectedMemberLogins([]);
      return;
    }
    setSelectedMemberLogins(displayedMembers.map((m) => m.twitch).filter(Boolean));
  }

  async function applyBulkChanges() {
    if (!currentAdmin?.isFounder) {
      pushNotice("error", "Seuls les fondateurs peuvent utiliser les actions de masse");
      return;
    }
    if (selectedMemberLogins.length === 0) {
      pushNotice("error", "Sélectionne au moins un membre");
      return;
    }
    if (!bulkRole && !bulkStatus && !bulkOnboarding && !bulkNextReviewDate) {
      pushNotice("error", "Aucune action de masse sélectionnée");
      return;
    }

    const includesSensitiveBulkChanges = Boolean(bulkRole || bulkStatus);
    if (includesSensitiveBulkChanges) {
      setBulkAuditReasonDraft("");
      setBulkReasonModalOpen(true);
      return;
    }

    await runBulkMemberUpdates(undefined);
  }

  async function runBulkMemberUpdates(bulkAuditReason: string | undefined) {
    setBulkLoading(true);
    let success = 0;
    const errors: string[] = [];

    for (const login of selectedMemberLogins) {
      try {
        const member = members.find((m) => m.twitch.toLowerCase() === login.toLowerCase());
        if (!member) continue;
        const payload: any = {
          twitchLogin: member.twitch,
          originalDiscordId: member.discordId,
        };
        if (bulkRole) payload.role = bulkRole;
        if (bulkStatus) payload.isActive = bulkStatus === "Actif";
        if (bulkOnboarding) payload.onboardingStatus = bulkOnboarding;
        if (bulkNextReviewDate) payload.nextReviewAt = new Date(bulkNextReviewDate).toISOString();
        if (bulkAuditReason) payload.auditReason = bulkAuditReason;

        const response = await fetch("/api/admin/members", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Erreur API");
        }
        success++;
      } catch (error) {
        errors.push(`${login}: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
      }
    }

    setBulkLoading(false);
    await loadMembers();

    if (errors.length === 0) {
      pushNotice("success", `Actions appliquées à ${success} membre(s)`);
    } else {
      pushNotice(
        "error",
        `${success} succès, ${errors.length} erreur(s). ${errors.slice(0, 5).join(" · ")}`
      );
    }
  }

  async function confirmBulkAuditReasonAndRun() {
    const reason = bulkAuditReasonDraft.trim();
    if (!reason) {
      pushNotice("error", "Motif obligatoire pour cette action.");
      return;
    }
    setBulkReasonModalOpen(false);
    await runBulkMemberUpdates(reason);
  }

  async function handleSyncMemberTwitchId(member: Member) {
    if (!member.twitch) return;
    if (!confirm(`Voulez-vous synchroniser l'ID Twitch pour ${member.twitch} ?`)) {
      return;
    }
    try {
      const response = await fetch("/api/admin/members/sync-twitch-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ twitchLogin: member.twitch }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) {
        const row = Array.isArray(data.results)
          ? data.results.find(
              (r: { twitchLogin?: string; success?: boolean; twitchId?: string }) =>
                String(r.twitchLogin || "").toLowerCase() === member.twitch.toLowerCase()
            )
          : undefined;
        if (row?.success && row.twitchId) {
          setMembers((prev) =>
            prev.map((m) =>
              m.twitch.toLowerCase() === member.twitch.toLowerCase() ? { ...m, twitchId: row.twitchId } : m
            )
          );
          pushNotice("success", `ID Twitch synchronisé pour ${member.twitch} : ${row.twitchId}`);
          return;
        }
        if (row && row.success === false) {
          pushNotice("error", row.error || "Impossible de synchroniser l'ID Twitch");
          return;
        }
        pushNotice("info", typeof data.message === "string" ? data.message : "Synchronisation terminée.");
        return;
      }
      pushNotice("error", data.error || "Impossible de synchroniser l'ID Twitch");
    } catch (error) {
      console.error("Erreur sync Twitch ID:", error);
      pushNotice("error", "Erreur lors de la synchronisation");
    }
  }

  // En-têtes triables : infobulle métier + feedback hover (tableau orienté équipe / créateurs TENF)
  const SortableHeader = ({
    column,
    label,
    hint,
    icon: Icon,
  }: {
    column: SortableColumn;
    label: string;
    hint?: string;
    icon?: LucideIcon;
  }) => {
    const ariaSort: "none" | "ascending" | "descending" =
      sortColumn === column ? (sortDirection === "asc" ? "ascending" : "descending") : "none";
    return (
    <th
      scope="col"
      aria-sort={ariaSort}
      title={hint}
      className="group cursor-pointer px-3 py-3 text-left align-middle transition-colors hover:bg-white/[0.06] sm:px-5 sm:py-4"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-2">
        {Icon ? (
          <Icon className="h-4 w-4 shrink-0 text-indigo-400/70" aria-hidden />
        ) : null}
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</span>
        <span className="flex shrink-0 items-center">
          {sortColumn === column ? (
            <span className="rounded-md bg-indigo-500/25 p-0.5 text-indigo-300">
              {sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-600 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
          )}
        </span>
      </div>
      {hint ? <p className="mt-1 hidden max-w-[200px] text-[10px] font-normal normal-case leading-snug text-slate-600 xl:block">{hint}</p> : null}
    </th>
    );
  };

  // Derniers lives : uniquement en vue « complet » (colonne absente en vue simple).
  useEffect(() => {
    if (loading || viewMode !== "complet") return;
    const snapshot = membersRef.current;
    if (snapshot.length === 0) return;

    let cancelled = false;
    void fetchLastLiveDates(snapshot).then((updatedMembers) => {
      if (cancelled) return;
      const lastByLogin = new Map(
        updatedMembers.map((m) => [(m.twitch || "").toLowerCase(), m.lastLiveDate] as const)
      );
      setMembers((prev) => {
        let changed = false;
        const next = prev.map((m) => {
          const login = (m.twitch || "").toLowerCase();
          const nextLd = lastByLogin.get(login);
          if (nextLd !== m.lastLiveDate) {
            changed = true;
            return { ...m, lastLiveDate: nextLd };
          }
          return m;
        });
        return changed ? next : prev;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [loading, viewMode]);

  const handleToggleStatus = async (memberToUpdate: Member) => {
    if (!currentAdmin) {
      pushNotice("error", "Vous devez être connecté pour effectuer cette action");
      return;
    }

    if (!currentAdmin.canWrite) {
      pushNotice("error", "Permissions insuffisantes: vous n'avez pas le droit de modifier les membres.");
      return;
    }

    if (safeModeEnabled && !currentAdmin.isFounder) {
      pushNotice("error", "Action bloquée : Safe Mode activé. Seuls les fondateurs peuvent modifier les données.");
      return;
    }

    const member = members.find((m) => areSameMember(m, memberToUpdate)) ?? memberToUpdate;
    if (!member || !member.twitch) return;

    const oldStatus = member.statut;
    if (oldStatus === "Inactif" && (member.role === "Communauté" || isInactiveExitMemberRole(member.role))) {
      pushNotice(
        "info",
        "Membre verrouillé en Inactif (rôle Communauté, Départ ou Banni). Changez d'abord le rôle pour le réactiver."
      );
      return;
    }
    const newStatus = oldStatus === "Actif" ? "Inactif" : "Actif";
    const reason = prompt("Motif obligatoire pour le changement de statut :");
    if (!reason || !reason.trim()) {
      pushNotice("error", "Motif obligatoire pour cette modification.");
      return;
    }
    if (
      !confirm(
        `Confirmer le changement de statut ?\n\nMembre: ${member.nom}\nTwitch: ${member.twitch}\nStatut actuel: ${oldStatus}\nNouveau statut: ${newStatus}`
      )
    ) {
      return;
    }

    try {
      // Mettre à jour via l'API si c'est un fondateur
      if (currentAdmin.isFounder) {
        const response = await fetch("/api/admin/members", {
          method: "PUT",
          cache: 'no-store',
          headers: {
            "Content-Type": "application/json",
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify({
            twitchLogin: member.twitch,
            isActive: newStatus === "Actif",
            auditReason: reason.trim(),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erreur lors de la mise à jour");
        }
      }

      // Logger l'action via l'API
      try {
        await fetch("/api/admin/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: newStatus === "Actif" ? "Activation d'un membre" : "Désactivation d'un membre",
            target: member.nom,
            details: { oldStatus, newStatus },
          }),
        });
      } catch (err) {
        console.error("Erreur lors du logging:", err);
      }

      // Recharger les membres depuis la base de données
      await loadMembers();
      pushNotice("success", `Statut mis à jour pour ${member.nom} (${newStatus}).`);
    } catch (error) {
      console.error("Erreur lors de la modification du statut:", error);
      pushNotice("error", `Erreur statut: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    }
  };

  const canValidateCommunityPassage = (member: Member) =>
    member.statut === "Inactif" &&
    member.role !== "Communauté" &&
    !isInactiveExitMemberRole(member.role) &&
    member.profileValidationStatus === "valide";

  const handleValidateCommunityPassage = async (memberToUpdate: Member) => {
    if (!currentAdmin) {
      pushNotice("error", "Vous devez être connecté pour effectuer cette action");
      return;
    }

    if (!currentAdmin.canWrite) {
      pushNotice("error", "Permissions insuffisantes: vous n'avez pas le droit de modifier les membres.");
      return;
    }

    if (safeModeEnabled && !currentAdmin.isFounder) {
      pushNotice("error", "Action bloquée : Safe Mode activé. Seuls les fondateurs peuvent modifier les données.");
      return;
    }

    const member = members.find((m) => areSameMember(m, memberToUpdate)) ?? memberToUpdate;
    if (!member || !member.twitch) return;

    if (!canValidateCommunityPassage(member)) {
      pushNotice("info", "Ce membre n'est pas éligible au passage Communauté.");
      return;
    }

    const reason = prompt("Motif obligatoire pour valider le passage en Communauté :");
    if (!reason || !reason.trim()) {
      pushNotice("error", "Motif obligatoire pour cette modification.");
      return;
    }

    if (
      !confirm(
        `Confirmer le passage en Communauté ?\n\nMembre: ${member.nom}\nTwitch: ${member.twitch}\n` +
          `Nouveau rôle: Communauté\nNouveau statut: Inactif (forcé)`
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/admin/members", {
        method: "PUT",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          twitchLogin: member.twitch,
          role: "Communauté",
          isActive: false,
          roleChangeReason: "Validation passage Communauté depuis l'onglet Inactifs",
          auditReason: reason.trim(),
          originalDiscordId: member.discordId,
          originalTwitchId: member.twitchId,
          originalTwitchLogin: member.twitch,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la validation du passage en Communauté");
      }

      await loadMembers();
      pushNotice("success", `Passage Communauté validé pour ${member.nom} (reste Inactif).`);
    } catch (error) {
      console.error("Erreur validation passage Communauté:", error);
      pushNotice(
        "error",
        `Erreur passage Communauté: ${error instanceof Error ? error.message : "Erreur inconnue"}`
      );
    }
  };

  const handleQuickAssignRole = async (memberToUpdate: Member, targetRole: "Affilié" | "Développement") => {
    if (!currentAdmin) {
      pushNotice("error", "Vous devez être connecté pour effectuer cette action");
      return;
    }

    if (!currentAdmin.canWrite) {
      pushNotice("error", "Permissions insuffisantes: vous n'avez pas le droit de modifier les membres.");
      return;
    }

    if (safeModeEnabled && !currentAdmin.isFounder) {
      pushNotice("error", "Action bloquée : Safe Mode activé. Seuls les fondateurs peuvent modifier les données.");
      return;
    }

    const member = members.find((m) => areSameMember(m, memberToUpdate)) ?? memberToUpdate;
    if (!member || !member.twitch) return;

    const reason = prompt(`Motif obligatoire pour attribuer le rôle ${targetRole} et activer le membre :`);
    if (!reason || !reason.trim()) {
      pushNotice("error", "Motif obligatoire pour cette modification.");
      return;
    }

    if (
      !confirm(
        `Confirmer l'attribution rapide ?\n\nMembre: ${member.nom}\nTwitch: ${member.twitch}\nNouveau rôle: ${targetRole}\nNouveau statut: Actif`
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/admin/members", {
        method: "PUT",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          twitchLogin: member.twitch,
          role: targetRole,
          isActive: true,
          // NB : on n'envoie plus `integrationDate: new Date()`.
          // La route serveur préserve la date réelle d'intégration si elle existe
          // déjà — la promotion d'un membre "Nouveau" vers "Affilié" ne doit pas
          // ré-écraser la date d'ajout réel à TENF.
          roleChangeReason: `Attribution rapide ${targetRole} depuis l'onglet Nouveaux`,
          auditReason: reason.trim(),
          originalDiscordId: member.discordId,
          originalTwitchId: member.twitchId,
          originalTwitchLogin: member.twitch,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error || "Erreur lors de l'attribution rapide du rôle");
      }

      await loadMembers();
      pushNotice("success", `${member.nom} est maintenant ${targetRole} (Actif).`);
    } catch (error) {
      console.error("Erreur attribution rapide:", error);
      pushNotice("error", `Erreur attribution ${targetRole}: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    }
  };

  const handleVerifyDiscordNames = async () => {
    if (!currentAdmin?.isFounder) {
      pushNotice("error", "Action réservée aux fondateurs.");
      return;
    }
    if (syncingDiscordNames) return;

    setSyncingDiscordNames(true);
    setVerifyDiscordError("");
    setVerifyDiscordInfo("");
    setVerifyDiscordResultsByLogin({});
    try {
      const batchSize = 20;
      let nextOffset = 0;
      let hasMore = true;
      let totalSelected = 0;
      let totalProcessed = 0;
      let totalSame = 0;
      let totalDifferent = 0;
      let totalUpdated = 0;
      let totalNotFound = 0;
      let totalErrors = 0;
      const nextResults: Record<string, DiscordVerifyResult> = {};

      while (hasMore) {
        const response = await fetch("/api/admin/members/discord-data", {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
          body: JSON.stringify({
            all: true,
            updateMismatches: true,
            offset: nextOffset,
            limit: batchSize,
          }),
        });
        const body = await parseApiResponse<DiscordVerifyResponse>(response);
        if (!response.ok) {
          throw new Error(body.error || "Erreur lors de la vérification des noms Discord");
        }

        for (const row of body.results || []) {
          nextResults[row.twitchLogin.toLowerCase()] = row;
        }

        totalProcessed += Number(body.processed || 0);
        totalSame += Number(body.same || 0);
        totalDifferent += Number(body.different || 0);
        totalUpdated += Number(body.updated || 0);
        totalNotFound += Number(body.notFound || 0);
        totalErrors += Number(body.errors || 0);
        totalSelected = Number(body.totalSelected || totalSelected || 0);

        setVerifyDiscordResultsByLogin({ ...nextResults });
        setVerifyDiscordInfo(
          `Vérification en cours... ${Math.min(totalProcessed, totalSelected || totalProcessed)}/${totalSelected || "?"} • ` +
            `identiques: ${totalSame}, différents: ${totalDifferent}, synchronisés: ${totalUpdated}, introuvables: ${totalNotFound}, erreurs: ${totalErrors}.`
        );

        hasMore = Boolean(body.hasMore);
        nextOffset = Number(body.nextOffset || totalProcessed);
      }

      setVerifyDiscordInfo(
        `Vérification terminée. Traités: ${totalProcessed}/${totalSelected || totalProcessed}, identiques: ${totalSame}, différents: ${totalDifferent}, synchronisés: ${totalUpdated}, introuvables: ${totalNotFound}, erreurs: ${totalErrors}.`
      );
      pushNotice(
        "success",
        `Vérification Discord terminée: ${totalUpdated} pseudo(s) mis à jour • ${totalNotFound} introuvable(s) • ${totalErrors} erreur(s).`
      );
      await loadMembers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      setVerifyDiscordError(message);
      pushNotice(
        "error",
        `Erreur vérification Discord: ${message}`
      );
    } finally {
      setSyncingDiscordNames(false);
    }
  };

  const handleEdit = (member: Member) => {
    if (!currentAdmin?.canWrite) {
      pushNotice("error", "Vous n'avez pas la permission de modifier les membres.");
      return;
    }
    setSelectedMember(member);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedMember: Member & { roleChangeReason?: string }) => {
    if (!currentAdmin?.canWrite) {
      pushNotice("error", "Vous n'avez pas la permission de modifier les membres.");
      return;
    }

    const oldMember =
      (selectedMember ? members.find((m) => areSameMember(m, selectedMember)) : undefined) ??
      members.find((m) => areSameMember(m, updatedMember));
    if (!oldMember) return;

    // Fusionner les données du modal avec les données existantes
    const mergedMember: Member = {
      ...oldMember,
      nom: updatedMember.nom,
      role: updatedMember.role,
      statut: updatedMember.statut,
      discord: updatedMember.discord,
      discordId: updatedMember.discordId,
      twitch: updatedMember.twitch,
      twitchId: updatedMember.twitchId !== undefined ? updatedMember.twitchId : oldMember.twitchId, // Préserver ou mettre à jour l'ID Twitch
      description: updatedMember.description || oldMember.description,
      notesInternes: updatedMember.notesInternes || oldMember.notesInternes,
      badges: updatedMember.badges || oldMember.badges,
      isVip: updatedMember.isVip !== undefined ? updatedMember.isVip : oldMember.isVip,
      shadowbanLives: updatedMember.shadowbanLives !== undefined ? updatedMember.shadowbanLives : oldMember.shadowbanLives,
      createdAt: updatedMember.createdAt || oldMember.createdAt,
      integrationDate: updatedMember.integrationDate || oldMember.integrationDate,
      birthday: updatedMember.birthday || oldMember.birthday,
      twitchAffiliateDate: updatedMember.twitchAffiliateDate || oldMember.twitchAffiliateDate,
      onboardingStatus: updatedMember.onboardingStatus !== undefined ? updatedMember.onboardingStatus : oldMember.onboardingStatus,
      mentorTwitchLogin: updatedMember.mentorTwitchLogin !== undefined ? updatedMember.mentorTwitchLogin : oldMember.mentorTwitchLogin,
      primaryLanguage: updatedMember.primaryLanguage !== undefined ? updatedMember.primaryLanguage : oldMember.primaryLanguage,
      timezone: updatedMember.timezone !== undefined ? updatedMember.timezone : oldMember.timezone,
      countryCode: updatedMember.countryCode !== undefined ? updatedMember.countryCode : oldMember.countryCode,
      lastReviewAt: updatedMember.lastReviewAt !== undefined ? updatedMember.lastReviewAt : oldMember.lastReviewAt,
      nextReviewAt: updatedMember.nextReviewAt !== undefined ? updatedMember.nextReviewAt : oldMember.nextReviewAt,
      parrain: updatedMember.parrain !== undefined ? updatedMember.parrain : oldMember.parrain,
      roleHistory: updatedMember.roleHistory || oldMember.roleHistory,
      staffPeriods: updatedMember.staffPeriods ?? oldMember.staffPeriods,
    };

    if (
      (mergedMember.role === "Communauté" || isInactiveExitMemberRole(mergedMember.role)) &&
      mergedMember.statut !== "Inactif"
    ) {
      mergedMember.statut = "Inactif";
    }

    try {
      const hasSensitiveChanges =
        oldMember.role !== mergedMember.role ||
        oldMember.statut !== mergedMember.statut ||
        (oldMember.isVip || false) !== (mergedMember.isVip || false) ||
        oldMember.twitch !== mergedMember.twitch ||
        (oldMember.twitchId || "") !== (mergedMember.twitchId || "") ||
        (oldMember.discordId || "") !== (mergedMember.discordId || "") ||
        (oldMember.discord || "") !== (mergedMember.discord || "");

      let editAuditReason: string | undefined;
      if (hasSensitiveChanges) {
        const reason = prompt("Motif obligatoire pour les changements sensibles (rôle/statut/VIP/identifiants) :");
        if (!reason || !reason.trim()) {
          pushNotice("error", "Motif obligatoire pour cette modification.");
          return;
        }
        editAuditReason = reason.trim();
      }

      // Mettre à jour via l'API
      const response = await fetch("/api/admin/members", {
        method: "PUT",
        cache: 'no-store',
        headers: { 
          "Content-Type": "application/json",
          'Cache-Control': 'no-cache',
        },
          body: JSON.stringify({
            twitchLogin: mergedMember.twitch, // Nouveau pseudo (peut avoir changé)
            twitchId: mergedMember.twitchId, // Inclure l'ID Twitch
            displayName: mergedMember.nom,
            twitchUrl: mergedMember.twitchUrl || `https://www.twitch.tv/${mergedMember.twitch}`,
            discordId: mergedMember.discordId,
            discordUsername: mergedMember.discord,
            role: toCanonicalMemberRole(mergedMember.role),
            isActive: mergedMember.statut === "Actif",
            isVip: mergedMember.isVip || false,
            shadowbanLives: mergedMember.shadowbanLives || false,
            badges: mergedMember.badges || [],
            description: mergedMember.description,
            createdAt: mergedMember.createdAt,
            integrationDate: mergedMember.integrationDate,
            birthday: mergedMember.birthday,
            twitchAffiliateDate: mergedMember.twitchAffiliateDate,
            onboardingStatus: mergedMember.onboardingStatus,
            mentorTwitchLogin: mergedMember.mentorTwitchLogin,
            primaryLanguage: mergedMember.primaryLanguage,
            timezone: mergedMember.timezone,
            countryCode: mergedMember.countryCode,
            lastReviewAt: mergedMember.lastReviewAt,
            nextReviewAt: mergedMember.nextReviewAt,
            parrain: mergedMember.parrain,
            roleChangeReason: updatedMember.roleChangeReason,
            auditReason: editAuditReason,
            // Identifiants stables pour identifier le membre (important si le pseudo change)
            originalDiscordId: oldMember.discordId, // ID Discord original (stable)
            originalTwitchId: oldMember.twitchId, // ID Twitch original (stable)
            originalTwitchLogin: oldMember.twitch, // Fallback si pas de discordId
          }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la mise ├á jour");
      }

      // Logger l'action via l'API
      try {
        await fetch("/api/admin/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "Modification d'un membre",
            target: mergedMember.nom,
            details: {
              oldData: {
                nom: oldMember.nom,
                role: oldMember.role,
                statut: oldMember.statut,
                discord: oldMember.discord,
                twitch: oldMember.twitch,
              },
              newData: {
                nom: mergedMember.nom,
                role: mergedMember.role,
                statut: mergedMember.statut,
                discord: mergedMember.discord,
                twitch: mergedMember.twitch,
              },
            },
          }),
        });
      } catch (err) {
        console.error("Erreur lors du logging:", err);
      }

      setIsEditModalOpen(false);
      setSelectedMember(null);
      pushNotice("success", "Membre modifié avec succès");
      await loadMembers();
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
      pushNotice("error", `Erreur : ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    }
  };

  const handleAdd = async (newMember: {
    nom: string;
    role: MemberRole;
    statut: "Actif" | "Inactif";
    discord: string;
    discordId?: string;
    twitch: string;
    avatar: string;
    description?: string;
    onboardingStatus?: "a_faire" | "en_cours" | "termine";
    mentorTwitchLogin?: string;
    parrain?: string;
    integrationDate?: string;
    primaryLanguage?: string;
    timezone?: string;
    countryCode?: string;
  }) => {
    if (!currentAdmin?.isFounder && !hasAdvancedAccess) {
      pushNotice("error", "Accès refusé : droits insuffisants pour ajouter un membre");
      return;
    }

    try {
      // Créer via l'API
      const response = await fetch("/api/admin/members", {
        method: "POST",
        cache: 'no-store',
        headers: { 
          "Content-Type": "application/json",
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          twitchLogin: newMember.twitch,
          displayName: newMember.nom,
          twitchUrl: `https://www.twitch.tv/${newMember.twitch}`,
          discordId: newMember.discordId,
          discordUsername: newMember.discord,
          role: newMember.role,
          isActive: newMember.statut === "Actif",
          ...(newMember.description?.trim() ? { description: newMember.description.trim() } : {}),
          ...(newMember.onboardingStatus ? { onboardingStatus: newMember.onboardingStatus } : {}),
          ...(newMember.mentorTwitchLogin?.trim() ? { mentorTwitchLogin: newMember.mentorTwitchLogin.trim().toLowerCase() } : {}),
          ...(newMember.parrain?.trim() ? { parrain: newMember.parrain.trim() } : {}),
          ...(newMember.integrationDate ? { integrationDate: newMember.integrationDate } : {}),
          ...(newMember.primaryLanguage?.trim() ? { primaryLanguage: newMember.primaryLanguage.trim() } : {}),
          ...(newMember.timezone?.trim() ? { timezone: newMember.timezone.trim() } : {}),
          ...(newMember.countryCode?.trim() ? { countryCode: newMember.countryCode.trim().toUpperCase().slice(0, 2) } : {}),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'ajout");
      }

      const data = await response.json();
      
      // Logger l'action via l'API
      try {
        await fetch("/api/admin/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "Ajout d'un membre",
            target: newMember.nom,
            details: {
              twitchLogin: newMember.twitch,
              role: newMember.role,
              statut: newMember.statut,
            },
          }),
        });
      } catch (err) {
        console.error("Erreur lors du logging:", err);
      }

      // Ajouter à la liste locale
      const addedMember: Member = {
        id: members.length + 1,
        avatar: newMember.avatar,
        nom: newMember.nom,
        role: newMember.role,
        statut: newMember.statut,
        discord: newMember.discord,
        twitch: newMember.twitch,
        twitchUrl: `https://www.twitch.tv/${newMember.twitch}`,
      };

      setIsAddModalOpen(false);
      pushNotice("success", "Membre ajouté avec succès");
      await loadMembers();
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
      pushNotice("error", `Erreur : ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    }
  };

  const handleDelete = async (member: Member) => {
    if (!currentAdmin?.isFounder) {
      pushNotice("error", "Seuls les fondateurs peuvent supprimer des membres");
      return;
    }

    const reason = prompt("Motif obligatoire de suppression :");
    if (!reason || !reason.trim()) {
      pushNotice("error", "Le motif de suppression est obligatoire.");
      return;
    }

    if (
      !confirm(
        `Archiver le membre\n\nNom: ${member.nom}\nTwitch: ${member.twitch}\nDiscord: ${member.discord || "N/A"}\n\nLe profil sera déplacé dans l'onglet Archivé.`
      )
    ) {
      return;
    }

    try {
        const response = await fetch(`/api/admin/members?twitchLogin=${encodeURIComponent(member.twitch)}&reason=${encodeURIComponent(reason.trim())}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la suppression");
      }

      // Logger l'action via l'API
      try {
        await fetch("/api/admin/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "Suppression d'un membre",
            target: member.nom,
            details: {
              twitchLogin: member.twitch,
              role: member.role,
            },
          }),
        });
      } catch (err) {
        console.error("Erreur lors du logging:", err);
      }

      pushNotice("success", `Membre archivé: ${member.nom}`);
      // Recharger les membres depuis la base de données
      await loadMembers();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      pushNotice("error", `Erreur suppression: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    }
  };

  const handleRestoreArchived = async (member: Member) => {
    if (!currentAdmin?.canWrite) {
      pushNotice("error", "Permissions insuffisantes.");
      return;
    }

    if (!confirm(`Désarchiver ${member.nom} ?\n\nLe profil repasse en rôle Communauté (Inactif).`)) {
      return;
    }

    try {
      const response = await fetch("/api/admin/members/archives", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
        body: JSON.stringify({ action: "restore", twitchLogin: member.twitch }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Désarchivage impossible");
      }
      pushNotice("success", `Membre désarchivé: ${member.nom}`);
      await loadMembers();
      setStatusTab("suivi_pause");
    } catch (error) {
      pushNotice("error", `Erreur désarchivage: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    }
  };

  const handlePurgeArchived = async (member: Member) => {
    if (!currentAdmin?.isFounder) {
      pushNotice("error", "Seuls les fondateurs peuvent supprimer définitivement.");
      return;
    }
    if (
      !confirm(
        `Suppression définitive TOTALE\n\nNom: ${member.nom}\nTwitch: ${member.twitch}\n\nCette action efface les données restantes de l'archive.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/admin/members/archives", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
        body: JSON.stringify({ action: "purge", twitchLogin: member.twitch }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Suppression définitive impossible");
      }
      pushNotice("success", `Archive supprimée définitivement: ${member.nom}`);
      await loadArchivedMembers();
    } catch (error) {
      pushNotice("error", `Erreur suppression définitive: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    }
  };

  const handleViewArchivedData = (member: Member) => {
    const payload = {
      nom: member.nom,
      twitch: member.twitch,
      discord: member.discord,
      discordId: member.discordId,
      role: member.role,
      statut: member.statut,
      siteUsername: member.siteUsername,
      dateSuppression: member.deletedAt,
      supprimePar: member.deletedBy,
      motifSuppression: member.deleteReason,
      profil: {
        description: member.description,
        customBio: member.customBio,
        badges: member.badges || [],
        integrationDate: member.integrationDate,
        createdAt: member.createdAt,
      },
    };
    alert(JSON.stringify(payload, null, 2));
  };

  const handleBulkImport = async (members: Array<{ nom: string; discord: string; twitch: string; discordId?: string }>) => {
    if (!currentAdmin?.isFounder) {
      pushNotice("error", "Seuls les fondateurs peuvent importer des membres");
      return;
    }

    if (members.length === 0) {
      pushNotice("info", "Aucun membre à importer.");
      setIsBulkImportOpen(false);
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const member of members) {
      try {
        const response = await fetch("/api/admin/members", {
          method: "POST",
          cache: 'no-store',
          headers: { 
            "Content-Type": "application/json",
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify({
            twitchLogin: member.twitch,
            displayName: member.nom,
            twitchUrl: `https://www.twitch.tv/${member.twitch}`,
            discordId: member.discordId,
            discordUsername: member.discord,
            role: "Affilié",
            isActive: true,
          }),
        });

        if (response.ok) {
          successCount++;
        } else {
          const error = await response.json();
          errorCount++;
          errors.push(`${member.nom}: ${error.error || "Erreur inconnue"}`);
        }
      } catch (error) {
        errorCount++;
        errors.push(`${member.nom}: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
      }
    }

    // Logger l'action via l'API
    try {
      await fetch("/api/admin/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "Import en masse de membres",
          target: `${successCount} membres importés`,
          details: { successCount, errorCount, totalAttempted: members.length, errors: errors.slice(0, 10) },
        }),
      });
    } catch (err) {
      console.error("Erreur lors du logging:", err);
    }

    let message = `Import terminé : ${successCount} membre(s) ajouté(s)`;
    if (errorCount > 0) message += `, ${errorCount} erreur(s)`;
    if (successCount < members.length) {
      message += ` · ${members.length - successCount - errorCount} non importé(s)`;
    }
    pushNotice(errorCount > 0 ? "error" : "success", message);
    setIsBulkImportOpen(false);
    await loadMembers();
  };

  // Utiliser la fonction utilitaire pour les couleurs de rôles
  const getRoleBadgeColor = (role: MemberRole) => getRoleBadgeClasses(role);

  const getStatusBadgeColor = (statut: MemberStatus) => {
    return statut === "Actif"
      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
      : "bg-purple-900/20 text-purple-400 border border-purple-900/30";
  };

  const formatLastLiveDate = (dateString?: string) => {
    if (!dateString) return "-";
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffDays > 0) {
        return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
      } else if (diffHours > 0) {
        return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
      } else if (diffMinutes > 0) {
        return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
      } else {
        return "À l'instant";
      }
    } catch (error) {
      return "-";
    }
  };

  const formatMemberSince = (dateString?: string) => {
    if (!dateString) return "-";
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffMonths = Math.floor(diffDays / 30);
      const diffYears = Math.floor(diffDays / 365);
      
      if (diffYears > 0) {
        return `${diffYears} an${diffYears > 1 ? 's' : ''}`;
      } else if (diffMonths > 0) {
        return `${diffMonths} mois`;
      } else if (diffDays > 0) {
        return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
      } else {
        return "Aujourd'hui";
      }
    } catch (error) {
      return "-";
    }
  };
  const rowActionButtonBase =
    "px-3 py-1 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1 border focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f121a] hover:-translate-y-[1px]";
  const rowActionButtonBaseCompact =
    "px-2 py-1 rounded-lg text-[11px] font-semibold transition inline-flex items-center gap-1 whitespace-nowrap border focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f121a] hover:-translate-y-[1px]";
  const rowActionInfo = `${rowActionButtonBase} border-white/10 bg-white/[0.04] text-slate-200 hover:border-sky-400/25 hover:bg-sky-500/10 hover:text-sky-100`;
  const rowActionPrimary = `${rowActionButtonBase} border-indigo-400/45 bg-indigo-500/22 text-indigo-50 shadow-sm shadow-indigo-950/30 hover:bg-indigo-500/32`;
  const rowActionEdit = `${rowActionButtonBase} border-white/10 bg-white/[0.04] text-violet-200/95 hover:border-violet-400/30 hover:bg-violet-500/12`;
  const rowActionDanger = `${rowActionButtonBase} border-rose-400/25 bg-rose-500/10 text-rose-100 hover:bg-rose-500/18`;
  const rowActionSuccess = `${rowActionButtonBase} border-emerald-400/25 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/16`;
  const rowActionWarning = `${rowActionButtonBase} border-amber-400/25 bg-amber-500/10 text-amber-100 hover:bg-amber-500/16`;
  const rowActionInfoCompact = `${rowActionButtonBaseCompact} border-white/10 bg-white/[0.04] text-slate-200 hover:border-sky-400/25 hover:bg-sky-500/10 hover:text-sky-100`;
  const rowActionPrimaryCompact = `${rowActionButtonBaseCompact} border-indigo-400/45 bg-indigo-500/22 text-indigo-50 shadow-sm shadow-indigo-950/30 hover:bg-indigo-500/32`;
  const rowActionEditCompact = `${rowActionButtonBaseCompact} border-white/10 bg-white/[0.04] text-violet-200/95 hover:border-violet-400/30 hover:bg-violet-500/12`;
  const rowActionDangerCompact = `${rowActionButtonBaseCompact} border-rose-400/25 bg-rose-500/10 text-rose-100 hover:bg-rose-500/18`;
  const rowActionSuccessCompact = `${rowActionButtonBaseCompact} border-emerald-400/25 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/16`;
  const rowActionWarningCompact = `${rowActionButtonBaseCompact} border-amber-400/25 bg-amber-500/10 text-amber-100 hover:bg-amber-500/16`;

  /**
   * Reconstruit "à la volée" quel champ de la fiche correspond à la recherche
   * en cours, pour pouvoir afficher un petit indice « match Twitch / Discord /
   * ID / nom » à côté du résultat. Best-effort : si rien ne matche directement
   * sur un champ explicite (cas bio/jeu), on retourne null.
   */
  function getSearchMatchType(
    member: Member,
    rawQuery: string
  ): "Twitch" | "Discord" | "Nom" | "ID Discord" | "ID Twitch" | "Lien" | "Site" | null {
    const q = rawQuery.trim().toLowerCase();
    if (!q) return null;
    const digits = q.replace(/\D/g, "");
    if (member.twitch && member.twitch.toLowerCase().includes(q)) return "Twitch";
    if (member.discord && member.discord.toLowerCase().includes(q)) return "Discord";
    if (member.nom && member.nom.toLowerCase().includes(q)) return "Nom";
    if (digits.length >= 4 && member.discordId && String(member.discordId).includes(digits)) return "ID Discord";
    if (digits.length >= 4 && member.twitchId && String(member.twitchId).includes(digits)) return "ID Twitch";
    if (member.twitchUrl && member.twitchUrl.toLowerCase().includes(q)) return "Lien";
    if (member.siteUsername && member.siteUsername.toLowerCase().includes(q)) return "Site";
    return null;
  }

  function resetFilters() {
    setSearchQuery("");
    setPresetFilter("all");
    setRoleFilter("all");
    setMemberStatusFilter("all");
    setJoinedAfterFilter("");
    setJoinedBeforeFilter("");
    setSelectedSavedViewId("");
    pushNotice("info", "Filtres réinitialisés");
  }

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    presetFilter !== "all" ||
    roleFilter !== "all" ||
    memberStatusFilter !== "all" ||
    joinedAfterFilter !== "" ||
    joinedBeforeFilter !== "" ||
    selectedSavedViewId !== "";

  async function handleExportManualChanges() {
    try {
      const response = await fetch("/api/admin/members/export-manual", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await response.json();
      if (data.success) {
        const fileName = `manual-changes-export-${new Date().toISOString().split("T")[0]}.json`;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        pushNotice(
          "success",
          `Export terminé : ${data.totalManualChanges} membre(s). Fichier « ${fileName} » téléchargé.`
        );
      } else {
        pushNotice("error", data.error || "Erreur inconnue");
      }
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      pushNotice("error", error instanceof Error ? error.message : "Erreur inconnue");
    }
  }

  async function handleCleanupDiscordDuplicates() {
    const analyzeResponse = await fetch("/api/admin/members/cleanup-discord-duplicates");
    if (!analyzeResponse.ok) {
      pushNotice("error", `Erreur analyse: ${analyzeResponse.status}`);
      return;
    }
    const analyzeData = await analyzeResponse.json();
    if (!analyzeData.success || analyzeData.total === 0) {
      pushNotice("info", "Aucun doublon discord_ trouvé.");
      return;
    }

    const withDup = analyzeData.withRealDuplicate;
    const orphans = analyzeData.orphans;
    const total = analyzeData.total;
    const details = analyzeData.duplicates
      .slice(0, 15)
      .map(
        (d: any) =>
          `  ${d.displayName} (${d.discordLogin})${d.hasRealMember ? ` → vrai: ${d.realMemberLogin}` : " [orphelin]"}`
      )
      .join("\n");
    const msg =
      `${total} entrée(s) discord_ trouvée(s):\n` +
      `- ${withDup} avec un vrai doublon (suppression sûre)\n` +
      `- ${orphans} orphelin(s)\n\n` +
      `Exemples:\n${details}` +
      (analyzeData.duplicates.length > 15 ? `\n  ... et ${analyzeData.duplicates.length - 15} autre(s)` : "") +
      `\n\nVoulez-vous supprimer TOUTES les ${total} entrées discord_ ?`;
    if (!confirm(msg)) return;

    const deleteResponse = await fetch("/api/admin/members/cleanup-discord-duplicates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleteOrphans: true }),
    });
    const deleteData = await deleteResponse.json();
    if (deleteResponse.ok && deleteData.success) {
      pushNotice("success", deleteData.message || "Doublons supprimés.");
      await loadMembers();
    } else {
      pushNotice("error", `Erreur: ${deleteData.error || "Erreur inconnue"}`);
    }
  }

  async function handleSaveDurable() {
    if (!confirm("Voulez-vous sauvegarder toutes les données des membres de façon durable ?")) return;
    try {
      const response = await fetch("/api/admin/members/save-durable", { method: "POST" });
      const data = await response.json();
      if (data.success) {
        pushNotice(
          "success",
          `Sauvegarde OK : ${data.stats.total} membres · Discord ${data.stats.withDiscord} · manuels ${data.stats.withManualChanges} · description ${data.stats.withDescription}`
        );
      } else {
        pushNotice("error", `Erreur: ${data.error || "Erreur inconnue"}`);
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      pushNotice("error", `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    }
  }

  /**
   * Groupes d'actions secondaires regroupés dans le menu « Actions »
   * (remplace les boutons étalés sur 3 lignes). Filtré par permissions ici
   * pour que GestionActionsMenu n'ait qu'à afficher les groupes non vides.
   */
  const gestionActionGroups: GestionActionGroup[] = [
    {
      id: "create",
      label: "Créer / importer",
      items:
        currentAdmin?.isFounder || hasAdvancedAccess
          ? [
              {
                id: "add-channel",
                label: "Ajouter une chaîne",
                description: "Créer une nouvelle fiche membre",
                icon: Plus,
                tone: "primary",
                onClick: () => setIsAddModalOpen(true),
              },
              {
                id: "bulk-import",
                label: "Import en masse",
                description: "Coller une liste de membres",
                icon: Upload,
                tone: "success",
                onClick: () => setIsBulkImportOpen(true),
              },
              {
                id: "verify-list",
                label: "Vérifier une liste",
                description: "Comparer sans modifier la base",
                icon: CheckCircle2,
                tone: "info",
                onClick: () => setIsVerifyListOpen(true),
              },
            ]
          : [],
    },
    {
      id: "navigate",
      label: "Aller à",
      items: [
        {
          id: "postulations",
          label: "Postulations staff",
          description: "Candidatures et entretiens",
          icon: Users,
          tone: "neutral",
          href: "/admin/membres/postulations",
        },
      ],
    },
    {
      id: "export",
      label: "Export",
      items: currentAdmin?.isFounder
        ? [
            {
              id: "export-manual",
              label: "Exporter modifications",
              description: "JSON des changements manuels",
              icon: Download,
              tone: "success",
              onClick: () => void handleExportManualChanges(),
            },
          ]
        : [],
    },
    {
      id: "maintenance",
      label: "Maintenance",
      items: currentAdmin?.isFounder
        ? [
            {
              id: "verify-twitch-names",
              label: "Vérifier noms Twitch",
              description: "Synchroniser via les IDs",
              icon: CheckCircle2,
              tone: "info",
              onClick: () => setShowVerifyTwitchNamesModal(true),
            },
            {
              id: "verify-discord-names",
              label: syncingDiscordNames ? "Vérification Discord…" : "Vérifier noms Discord",
              description: "Resynchroniser pseudos Discord",
              icon: RefreshCw,
              tone: "info",
              loading: syncingDiscordNames,
              onClick: () => {
                setShowVerifyDiscordNamesModal(true);
                setVerifyDiscordError("");
                setVerifyDiscordInfo("");
                setVerifyDiscordResultsByLogin({});
              },
            },
            {
              id: "manage-duplicates",
              label: "Gérer les doublons",
              description: "Fusion guidée",
              icon: Copy,
              tone: "warning",
              onClick: () => {
                window.location.href = "/admin/fusion-doublons";
              },
            },
          ]
        : [],
    },
    {
      id: "sensitive",
      label: "Données sensibles",
      items: currentAdmin?.isFounder
        ? [
            {
              id: "cleanup-discord",
              label: "Nettoyer doublons discord_",
              description: "Supprimer les entrées techniques",
              icon: XCircle,
              tone: "danger",
              onClick: () => void handleCleanupDiscordDuplicates(),
            },
            {
              id: "save-durable",
              label: "Sauvegarder données",
              description: "Snapshot durable de la base",
              icon: Save,
              tone: "success",
              onClick: () => void handleSaveDurable(),
            },
          ]
        : [],
    },
  ];

  if (loading || !gestionCopy) {
    return (
      <div className="-mx-4 md:-mx-6">
        <AdminDashboardLoadingScreen
          title={gestionCopy?.loadingTitle ?? "Chargement de l'annuaire TENF"}
          subtitle={gestionCopy?.loadingSubtitle ?? "Récupération des membres depuis la base centralisée…"}
        />
      </div>
    );
  }

  return (
    <>
      <AdminToastStack
        toasts={
          actionNotice
            ? [
                {
                  id: "gestion-members-notice",
                  type: actionNotice.type === "error" ? "warning" : actionNotice.type,
                  title: actionNotice.message,
                },
              ]
            : []
        }
        onClose={() => setActionNotice(null)}
      />
      <MemberBentoShell accentHex={gestionCopy.accent} className="-mx-4 md:-mx-6">
        <MemberBentoRow stretch>
          <MemberBentoCell span={7} stretch>
            <GestionPageHeader
              copy={gestionCopy}
              onRefresh={() => {
                void loadMembers();
                void loadArchivedMembers();
              }}
            />
          </MemberBentoCell>
          <MemberBentoCell span={5} stretch>
            <GestionPageAside
              copy={gestionCopy}
              newCount={totalNewMembers}
              incompleteCount={totalIncompleteMembers}
              inactiveCount={totalInactiveMembers}
            />
          </MemberBentoCell>
        </MemberBentoRow>

        <MemberBentoRow stretch>
          <MemberBentoCell span={12} stretch>
            <GestionKpiStrip
              copy={gestionCopy}
              counts={gestionCounts}
              activeFilters={activeKpiFilters}
              onKpiClick={handleGestionKpiClick}
            />
          </MemberBentoCell>
        </MemberBentoRow>

        <MemberBentoRow stretch>
          <MemberBentoCell span={12} stretch>
            <GestionStaffGuide copy={gestionCopy} />
          </MemberBentoCell>
        </MemberBentoRow>

        <MemberBentoRow>
          <MemberBentoCell span={12}>
        <GestionTeamShortcuts
          expanded={showTeamShortcuts}
          onToggle={() => setShowTeamShortcuts((v) => !v)}
        />

        {/* Barre de recherche et actions — version compacte */}
        <div className={`sticky top-2 z-40 ${cockpitPanelClass} p-2.5 backdrop-blur`}>
          <div className="mb-2 border-b border-white/[0.06] pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-200/75">{gestionCopy.toolbarKicker}</p>
            <p className="text-sm font-semibold text-white">{gestionCopy.toolbarTitle}</p>
            <p className="text-xs text-zinc-500">{gestionCopy.toolbarIntro}</p>
          </div>
          <div className="flex flex-col gap-2">
            {/* Ligne principale : recherche + presets + filtres + affichage + actions */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[220px]">
                <input
                  id="gestion-search-input"
                  type="search"
                  placeholder={gestionCopy.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${cockpitInputClass} w-full py-2`}
                  aria-label="Rechercher un membre"
                  aria-describedby="gestion-search-help"
                  title="Recherche dans : pseudo Twitch, pseudo Discord, nom, ID Discord, lien Twitch, identifiant site"
                />
                <span id="gestion-search-help" className="sr-only">
                  {gestionCopy.searchHelp}
                </span>
              </div>
              <select
                value={presetFilter}
                onChange={(e) => setPresetFilter(e.target.value as PresetFilter)}
                className="rounded-lg border border-[#353a50] bg-[#121623]/85 px-2.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-300/55"
                title="Filtre métier rapide"
                aria-label="Filtre métier rapide"
              >
                <option value="all">Tous</option>
                <option value="nouveaux">Nouveaux (&lt; 30 j)</option>
                <option value="incomplets">À compléter</option>
                <option value="revue_due">À revoir</option>
                <option value="sans_twitch_id">Sans Twitch ID</option>
                <option value="sans_integration">Sans intégration</option>
                <option value="integration_session_alignee">Aligné session</option>
                <option value="vip">VIP</option>
                <option value="inactifs">En pause</option>
                <option value="staff">Staff actif</option>
                <option value="ancien_staff">Anciens staff (honorifique)</option>
              </select>
              <button
                type="button"
                onClick={() => setShowAdvancedFilters((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/45 ${
                  showAdvancedFilters
                    ? "border-indigo-300/45 bg-indigo-500/18 text-indigo-100"
                    : "border-[#353a50] bg-[#121623]/85 text-slate-200 hover:border-indigo-400/30 hover:bg-[#1a2132] hover:text-white"
                }`}
                aria-expanded={showAdvancedFilters}
                title="Afficher/masquer les filtres avancés"
              >
                <Filter className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                <span className="hidden md:inline">Filtres avancés</span>
                <span className="md:hidden">Filtres</span>
              </button>

              {/* Segmented control : vue simple / complète (icônes + tooltip pour rester compact) */}
              <div
                className="inline-flex items-center rounded-lg border border-[#353a50] bg-[#121623]/85 p-0.5"
                role="group"
                aria-label="Densité d'affichage"
              >
                <button
                  type="button"
                  onClick={() => setViewMode("simple")}
                  aria-pressed={viewMode === "simple"}
                  title="Vue simple (colonnes essentielles)"
                  className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/45 ${
                    viewMode === "simple"
                      ? "bg-sky-500/18 text-sky-100"
                      : "text-slate-300 hover:bg-[#1b2030] hover:text-white"
                  }`}
                >
                  <Eye className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="hidden lg:inline">Simple</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("complet")}
                  aria-pressed={viewMode === "complet"}
                  title="Vue complète (toutes les colonnes)"
                  className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/45 ${
                    viewMode === "complet"
                      ? "bg-violet-500/18 text-violet-100"
                      : "text-slate-300 hover:bg-[#1b2030] hover:text-white"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="hidden lg:inline">Complète</span>
                </button>
              </div>

              {/* Segmented control : tableau / cartes */}
              <div
                className="inline-flex items-center rounded-lg border border-[#353a50] bg-[#121623]/85 p-0.5"
                role="group"
                aria-label="Mode d'affichage liste ou cartes"
              >
                <button
                  type="button"
                  onClick={() => setListLayout("table")}
                  aria-pressed={listLayout === "table"}
                  title="Affichage tableau"
                  className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/45 ${
                    listLayout === "table"
                      ? "bg-indigo-500/22 text-indigo-100"
                      : "text-slate-300 hover:bg-[#1b2030] hover:text-white"
                  }`}
                >
                  <LayoutList className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="hidden lg:inline">Tableau</span>
                </button>
                <button
                  type="button"
                  onClick={() => setListLayout("gallery")}
                  aria-pressed={listLayout === "gallery"}
                  title="Affichage en cartes"
                  className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/45 ${
                    listLayout === "gallery"
                      ? "bg-fuchsia-500/18 text-fuchsia-100"
                      : "text-slate-300 hover:bg-[#1b2030] hover:text-white"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="hidden lg:inline">Cartes</span>
                </button>
              </div>

              <GestionActionsMenu groups={gestionActionGroups} />
            </div>

            {/* Chips de filtres rapides — sur une seule ligne scrollable */}
            <div
              className="flex gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-0.5 px-0.5"
              role="toolbar"
              aria-label="Filtres métier rapides"
            >
              {(
                [
                  { key: "all" as const, label: "Tous", Icon: Users, hint: "Aucun filtre métier" },
                  {
                    key: "nouveaux" as const,
                    label: "Nouveaux",
                    Icon: Sparkles,
                    hint: "Créés il y a moins de 30 jours",
                  },
                  {
                    key: "incomplets" as const,
                    label: "À compléter",
                    Icon: AlertCircle,
                    hint: "Fiche < 80 % ou non validée",
                  },
                  {
                    key: "revue_due" as const,
                    label: "À revoir",
                    Icon: ClipboardList,
                    hint: "Revue staff planifiée ou en retard",
                  },
                  {
                    key: "sans_twitch_id" as const,
                    label: "Sans Twitch ID",
                    Icon: Zap,
                    hint: "Compte non lié à un ID Twitch",
                  },
                  {
                    key: "inactifs" as const,
                    label: "En pause",
                    Icon: PauseCircle,
                    hint: "Statut inactif — accompagnement",
                  },
                  {
                    key: "vip" as const,
                    label: "VIP",
                    Icon: Star,
                    hint: "Membres mis en avant",
                  },
                  {
                    key: "staff" as const,
                    label: "Staff",
                    Icon: Shield,
                    hint: "Modérateurs, admins, mentors…",
                  },
                ] as const
              ).map(({ key, label, Icon, hint }) => {
                const active = presetFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPresetFilter(key)}
                    aria-pressed={active}
                    title={hint}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/45 ${
                      active
                        ? "border-indigo-400/55 bg-indigo-500/22 text-white shadow-[0_0_16px_rgba(99,102,241,0.22)]"
                        : "border-[#353a50] bg-[#151821]/90 text-slate-300 hover:border-indigo-400/35 hover:bg-[#1b2130] hover:text-white"
                    }`}
                  >
                    <Icon className="h-3 w-3 shrink-0 opacity-90" aria-hidden />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Ligne « vues enregistrées + reset » — affichée seulement si pertinente */}
            {(savedViews.length > 0 || hasActiveFilters) && (
              <div className="flex flex-wrap items-center gap-1.5 border-t border-white/5 pt-2 text-xs">
                {savedViews.length > 0 && (
                  <div className="inline-flex items-center gap-1 rounded-lg border border-[#353a50] bg-[#121623]/85 pl-2">
                    <Bookmark className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                    <select
                      value={selectedSavedViewId}
                      onChange={(e) => applySavedView(e.target.value)}
                      className="bg-transparent py-1 pr-2 text-xs text-slate-200 focus:outline-none"
                      title="Vues enregistrées"
                      aria-label="Vues enregistrées"
                    >
                      <option value="">Vues enregistrées ({savedViews.length})</option>
                      {savedViews.map((view) => (
                        <option key={view.id} value={view.id}>
                          {view.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  type="button"
                  onClick={saveCurrentView}
                  className="inline-flex items-center gap-1 rounded-lg border border-indigo-300/30 bg-indigo-500/12 px-2 py-1 text-xs font-medium text-indigo-100 transition hover:bg-indigo-500/22 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
                  title="Enregistrer la vue actuelle"
                >
                  <Bookmark className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Sauver vue
                </button>
                {selectedSavedViewId && (
                  <button
                    type="button"
                    onClick={() => deleteSavedView(selectedSavedViewId)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-300/30 bg-rose-500/10 px-2 py-1 text-xs font-medium text-rose-100 transition hover:bg-rose-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40"
                    title="Supprimer la vue sélectionnée"
                  >
                    <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Suppr vue
                  </button>
                )}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
                    title="Réinitialiser recherche et filtres"
                  >
                    <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Reset filtres
                  </button>
                )}
              </div>
            )}

            {showAdvancedFilters && (
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as "all" | MemberRole)}
                  className="rounded-lg border border-[#353a50] bg-[#121623]/85 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-300/55"
                  title="Filtrer par rôle"
                >
                  <option value="all">Tous les rôles</option>
                  <optgroup label="Staff TENF">
                    {staffRoleFilterOptions.map((role) => (
                      <option key={role} value={role}>
                        {getRoleBadgeLabel(role)}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Autres rôles">
                    {availableRoles
                      .filter((role) => !(staffRoleFilterOptions as readonly string[]).includes(role))
                      .map((role) => (
                        <option key={role} value={role}>
                          {getRoleBadgeLabel(role)}
                        </option>
                      ))}
                  </optgroup>
                </select>
                <select
                  value={memberStatusFilter}
                  onChange={(e) => setMemberStatusFilter(e.target.value as "all" | MemberStatus)}
                  className="rounded-lg border border-[#353a50] bg-[#121623]/85 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-300/55"
                  title="Filtrer par statut membre"
                >
                  <option value="all">Tous statuts</option>
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
                </select>
                <input
                  type="date"
                  value={joinedAfterFilter}
                  onChange={(e) => setJoinedAfterFilter(e.target.value)}
                  className="rounded-lg border border-[#353a50] bg-[#121623]/85 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-300/55"
                  title="Membre depuis - date minimum"
                />
                <input
                  type="date"
                  value={joinedBeforeFilter}
                  onChange={(e) => setJoinedBeforeFilter(e.target.value)}
                  className="rounded-lg border border-[#353a50] bg-[#121623]/85 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-300/55"
                  title="Membre depuis - date maximum"
                />
              </div>
            )}

          </div>
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-slate-200">
            {displayedMembers.length} résultat{displayedMembers.length > 1 ? "s" : ""} · {activeTabLabel}
          </span>
          {isSearching && (
            <span className="rounded-full border border-purple-500/35 bg-purple-500/10 px-2 py-0.5 text-purple-200">
              « {searchQuery.trim()} »
            </span>
          )}
          {presetFilter !== "all" && (
            <span className="rounded-full border border-indigo-500/35 bg-indigo-500/10 px-2 py-0.5 text-indigo-200">
              {getPresetFilterDisplayLabel(presetFilter)}
            </span>
          )}
          {roleFilter !== "all" && (
            <span className="rounded-full border border-cyan-500/35 bg-cyan-500/10 px-2 py-0.5 text-cyan-200">
              Rôle : {getRoleBadgeLabel(roleFilter)}
            </span>
          )}
          {memberStatusFilter !== "all" && (
            <span className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-emerald-200">
              Statut : {memberStatusFilter}
            </span>
          )}
          {joinedAfterFilter && (
            <span className="rounded-full border border-slate-500/35 bg-slate-500/10 px-2 py-0.5">
              Depuis : {joinedAfterFilter}
            </span>
          )}
          {joinedBeforeFilter && (
            <span className="rounded-full border border-slate-500/35 bg-slate-500/10 px-2 py-0.5">
              Jusqu&apos;au : {joinedBeforeFilter}
            </span>
          )}
        </div>

        {(reviewAlerts.overdue > 0 || reviewAlerts.dueSoon > 0) && (
          <div className="mb-6 bg-[#1a1a1d] border border-amber-500/40 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-amber-300 mb-2">Rappels revue staff</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-red-300">
                <strong>{reviewAlerts.overdue}</strong> revue(s) en retard
              </span>
              <span className="text-yellow-300">
                <strong>{reviewAlerts.dueSoon}</strong> revue(s) dans les 7 jours
              </span>
            </div>
          </div>
        )}

        {currentAdmin?.isFounder && selectedMemberLogins.length > 0 && (
          <div className="mb-6 bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-200 mb-3">Actions de masse</h3>
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-sm text-gray-300">
                {selectedMemberLogins.length} membre(s) sélectionné(s)
              </span>
              <select
                value={bulkRole}
                onChange={(e) => setBulkRole(e.target.value as MemberRole | "")}
                className="bg-[#0e0e10] border border-gray-700 rounded px-3 py-2 text-sm text-white"
              >
                <option value="">Rôle (optionnel)</option>
                <MemberRoleSelectOptions />
              </select>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value as "" | "Actif" | "Inactif")}
                className="bg-[#0e0e10] border border-gray-700 rounded px-3 py-2 text-sm text-white"
              >
                <option value="">Statut (optionnel)</option>
                <option value="Actif">Actif</option>
                <option value="Inactif">Inactif</option>
              </select>
              <select
                value={bulkOnboarding}
                onChange={(e) => setBulkOnboarding(e.target.value as "" | "a_faire" | "en_cours" | "termine")}
                className="bg-[#0e0e10] border border-gray-700 rounded px-3 py-2 text-sm text-white"
              >
                <option value="">Onboarding (optionnel)</option>
                <option value="a_faire">A faire</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Termine</option>
              </select>
              <input
                type="date"
                value={bulkNextReviewDate}
                onChange={(e) => setBulkNextReviewDate(e.target.value)}
                className="bg-[#0e0e10] border border-gray-700 rounded px-3 py-2 text-sm text-white"
                title="Prochaine revue"
              />
              <button
                onClick={applyBulkChanges}
                disabled={bulkLoading || selectedMemberLogins.length === 0}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white font-semibold px-4 py-2 rounded-lg text-sm"
              >
                {bulkLoading ? "Application..." : "Appliquer"}
              </button>
            </div>
          </div>
        )}
        {!currentAdmin?.isFounder && (
          <div className="mb-6 bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-300">
              Les actions de masse (changement de rôle/statut en lot) sont disponibles uniquement pour les fondateurs.
            </p>
          </div>
        )}

        <GestionStatusTabs
          statusTab={statusTab}
          onChange={setStatusTab}
          counts={{
            actifs: activeMembers.length,
            communaute: communityRoleMembers.length,
            suivi_pause: communityFollowupMembers.length,
            nouveaux: newMembers.length,
            affilies: tenfAffiliateMembers.length,
            departs: departedMembers.length,
            bans: bannedMembers.length,
            archives: totalArchivedMembers,
          }}
        />

        {/* Microcopy contextuelle — courte aide selon l'onglet en cours */}
        <p
          className="mt-1 mb-2 inline-flex items-start gap-1.5 text-[11px] leading-snug text-slate-400"
          role="note"
        >
          <HelpCircle className="mt-0.5 h-3 w-3 shrink-0 text-slate-500" aria-hidden />
          {statusTab === "actifs"
            ? "Membres présents dans la communauté active. Utilise « À compléter » ou « À revoir » pour repérer ce qui demande une action staff."
            : statusTab === "communaute"
            ? "Rôle « Communauté » : membres en pause stable, hors suivi actif. Les infos communauté restent visibles sur leur fiche."
            : statusTab === "suivi_pause"
            ? "Suivi pause : inactifs à accompagner (hors Communauté). Valide un passage en « Communauté » ou attribue Départ / Banni si la sortie est définitive."
            : statusTab === "nouveaux"
            ? "Nouveaux membres (rôle « Nouveau »). Utilise les raccourcis Affilié / Développement pour activer rapidement après l'intégration."
            : statusTab === "affilies"
            ? "Affiliés TENF : affiliation Twitch obtenue après l'intégration au collectif (historique de rôle ou date d'affiliation post-intégration)."
            : statusTab === "departs"
            ? "Départs : ont quitté TENF (rôle « Départ », toujours inactif, sans suivi d'information)."
            : statusTab === "bans"
            ? "Bans : comptes sanctionnés (rôle « Banni », inactif, hors suivi et hors listings publics)."
            : "Archives : comptes retirés des listings actifs. Consulte les données archivées avant toute restauration ou suppression définitive."}
        </p>

        {/* Tableau des membres */}
        <div className={`${sectionCardClass} overflow-hidden`}>
          <div className="border-b border-[#353a50]/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-[#121623]/95">
            <div className="space-y-1">
              <p className="text-sm text-slate-300">
                Affichage <span className="font-semibold text-white">{startItem}</span>-<span className="font-semibold text-white">{endItem}</span> sur{" "}
                <span className="font-semibold text-white">{displayedMembers.length}</span>
                {listLayout === "gallery" ? (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-fuchsia-500/35 bg-fuchsia-500/15 px-2 py-0.5 text-[11px] font-semibold text-fuchsia-100">
                    <LayoutGrid className="h-3 w-3" aria-hidden />
                    Cartes
                  </span>
                ) : (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/12 px-2 py-0.5 text-[11px] font-semibold text-sky-100">
                    <LayoutList className="h-3 w-3" aria-hidden />
                    Tableau
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2 py-0.5 text-emerald-100">
                  Actifs: {activeMembers.length}
                </span>
                <span className="rounded-full border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-amber-100">
                  Incomplets: {totalIncompleteMembers}
                </span>
                <span className="rounded-full border border-cyan-400/35 bg-cyan-500/15 px-2 py-0.5 text-cyan-100">
                  Sans Twitch ID: {totalWithoutTwitchId}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <label htmlFor="page-size" className="text-slate-400">Lignes/page</label>
              <select
                id="page-size"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value) as 25 | 50 | 100)}
                className="rounded border border-[#353a50] bg-[#0f1321] px-2 py-1 text-white"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          {listLayout === "table" ? (
          <div className="relative overflow-x-auto rounded-b-2xl border-x border-b border-white/[0.08] bg-[linear-gradient(180deg,rgba(16,18,28,0.98),rgba(8,9,14,0.99))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <table
              className={
                viewMode === "complet"
                  ? "w-full min-w-[1540px] border-collapse"
                  : "w-full border-collapse"
              }
            >
              <thead className="sticky top-0 z-20 border-b border-indigo-500/25 bg-[linear-gradient(180deg,#252a3d_0%,#181c28_100%)] shadow-[0_14px_48px_rgba(0,0,0,0.42)] backdrop-blur-md">
                <tr>
                  {currentAdmin?.isFounder && (
                    <th
                      scope="col"
                      className="w-11 px-2 py-3 text-center align-middle sm:px-3 sm:py-4"
                      title="Sélection pour actions de masse (fondateurs)"
                    >
                      <input
                        type="checkbox"
                        aria-label="Sélectionner tous les membres visibles sur cette page pour les actions de masse"
                        className="h-4 w-4 rounded border-slate-600 bg-[#1e2434] text-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                        checked={displayedMembers.length > 0 && displayedMembers.every((m) => selectedMemberLogins.includes(m.twitch))}
                        onChange={(e) => toggleSelectAllFiltered(e.target.checked)}
                      />
                    </th>
                  )}
                  <SortableHeader
                    column="nom"
                    label="Créateur"
                    hint="Nom et chaîne alignés avec l’annuaire public et l’espace membre TENF."
                    icon={UserCircle2}
                  />
                  {viewMode === "complet" && (
                    <>
                      <th className="px-3 py-3 text-left align-middle text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 sm:px-5 sm:py-4" title="Identifiant sur le site TENF">
                        Pseudo site
                      </th>
                      <th className="px-3 py-3 text-left align-middle text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 sm:px-5 sm:py-4" title="Clé technique Discord">
                        ID Discord
                      </th>
                      <th className="px-3 py-3 text-left align-middle text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 sm:px-5 sm:py-4" title="ID numérique Twitch (API)">
                        ID Twitch
                      </th>
                      <th className="px-3 py-3 text-left align-middle text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 sm:px-5 sm:py-4" title="Parcours d’accueil interne">
                        Onboarding
                      </th>
                      <th className="px-3 py-3 text-left align-middle text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 sm:px-5 sm:py-4" title="Référent staff Twitch">
                        Mentor
                      </th>
                    </>
                  )}
                  <SortableHeader column="role" label="Rôle" hint="Parcours TENF : staff, créateur, communauté…" icon={Shield} />
                  <SortableHeader column="statut" label="Statut" hint="Actif = dans les listings membres ; inactif = pause ou suivi." icon={UserCheck} />
                  <SortableHeader
                    column="createdAt"
                    label={statusTab === "archives" ? "Archivé" : "Membre depuis"}
                    hint={statusTab === "archives" ? "Date associée à l’archivage." : "Création de la fiche dans TENF."}
                    icon={Calendar}
                  />
                  <SortableHeader
                    column="integrationDate"
                    label="Intégration"
                    hint="Date de réunion d’intégration validée — repère fort pour la communauté."
                    icon={Calendar}
                  />
                  <SortableHeader
                    column="completude"
                    label="Complétude"
                    hint="Champs clés remplis (IDs, parrain, description…)."
                    icon={Percent}
                  />
                  {viewMode === "complet" && (
                    <>
                      <SortableHeader column="parrain" label="Parrain" hint="Membre TENF référent pour ce créateur." />
                      <SortableHeader column="lastLive" label="Dernier live" hint="Indicateur d’activité chaîne." />
                      <SortableHeader column="raidsDone" label="Raids envoyés" hint="Raids TENF relevés ce mois." />
                      <SortableHeader column="raidsReceived" label="Raids reçus" hint="Réception de raids ce mois." />
                    </>
                  )}
                  {viewMode === "complet" && (
                    <>
                      <SortableHeader column="isVip" label="VIP" hint="Badge mise en avant." />
                      <SortableHeader column="isLive" label="Live" hint="État live au chargement de la page." />
                    </>
                  )}
                  <th
                    scope="col"
                    className="px-3 py-3 text-left align-middle sm:px-5 sm:py-4"
                    title="Raccourcis staff : fiche, édition, statut…"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child_td]:border-b-0">
                {paginatedMembers.map((member, rowIndex) => {
                  const rowKey = getMemberStableKey(member);
                  const isRowExpanded = expandedTableRowKey === rowKey;
                  const isRowSelected = Boolean(currentAdmin?.isFounder && selectedMemberLogins.includes(member.twitch));
                  return (
                    <Fragment key={rowKey}>
                  <tr
                    className={`group cursor-pointer border-b border-white/[0.06] transition-all duration-200 hover:bg-[#1e2436]/95 hover:shadow-[inset_3px_0_0_rgba(129,140,248,0.65)] ${
                      rowIndex % 2 === 0 ? "bg-[#0f121a]/50" : "bg-[#141824]/65"
                    } ${isRowExpanded ? "bg-[#1a2033]/90 shadow-[inset_3px_0_0_rgba(167,139,250,0.85)]" : ""} ${
                      isRowSelected ? "ring-1 ring-inset ring-indigo-400/25" : ""
                    }`}
                    onClick={(e) => {
                      const el = e.target as HTMLElement;
                      if (el.closest("a,button,input,textarea,select,label")) return;
                      setExpandedTableRowKey((prev) => (prev === rowKey ? null : rowKey));
                    }}
                  >
                    {currentAdmin?.isFounder && (
                      <td className="py-4 px-3 align-middle" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`Sélectionner ${member.nom} pour les actions de masse`}
                          className="h-4 w-4 rounded border-slate-600 bg-[#1e2434] text-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                          checked={selectedMemberLogins.includes(member.twitch)}
                          onChange={(e) => toggleMemberSelection(member.twitch, e.target.checked)}
                        />
                      </td>
                    )}
                    <td className="py-4 px-4 align-middle sm:px-6">
                      {(() => {
                        const tenfState = getMemberTenfState(member);
                        const matchType = isSearching ? getSearchMatchType(member, searchQuery) : null;
                        return (
                          <div className="flex items-center gap-2 sm:gap-3">
                            <ChevronDown
                              className={`h-4 w-4 shrink-0 text-slate-600 transition-transform duration-200 ${isRowExpanded ? "rotate-180 text-indigo-400" : "group-hover:text-slate-400"}`}
                              aria-hidden
                            />
                            <img
                              src={member.avatar}
                              alt={member.nom}
                              className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-white/15 transition-[box-shadow] duration-200 group-hover:ring-2 group-hover:ring-indigo-400/40"
                            />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-white font-medium">{member.nom}</span>
                                <MemberStateBadge state={tenfState} />
                                {matchType ? (
                                  <span
                                    className="inline-flex items-center gap-0.5 rounded-full border border-purple-400/35 bg-purple-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-purple-200"
                                    title={`Le résultat correspond au champ ${matchType}`}
                                  >
                                    {matchType}
                                  </span>
                                ) : null}
                              </div>
                              {member.discord && (
                                <div className="text-xs text-gray-400">@{member.discord}</div>
                              )}
                              {member.twitch && (
                                <div className="text-xs text-gray-400">
                                  Twitch:{" "}
                                  <a
                                    href={`https://www.twitch.tv/${member.twitch}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-300 hover:text-indigo-200"
                                  >
                                    {member.twitch}
                                  </a>
                                </div>
                              )}
                              <MemberBadges
                                badges={member.badges || []}
                                isVip={member.isVip}
                                isModeratorJunior={member.isModeratorJunior}
                                isModeratorMentor={member.isModeratorMentor}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    {viewMode === "complet" && (
                      <>
                        <td className="py-4 px-6 text-gray-300">
                          {member.siteUsername || "-"}
                        </td>
                        <td className="py-4 px-6">
                          <code className="text-xs text-slate-300 bg-[#0f1321] px-2 py-1 rounded border border-[#343a4f]">
                            {member.discordId || "-"}
                          </code>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {member.twitchId ? (
                              <>
                                <code className="text-xs text-green-300 bg-[#0f1321] px-2 py-1 rounded border border-[#345048]">
                                  {member.twitchId}
                                </code>
                                <span title="ID Twitch lié">
                                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-xs text-gray-500">-</span>
                                <span title="ID Twitch manquant">
                                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                                </span>
                              </>
                            )}
                            {member.twitch && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleSyncMemberTwitchId(member);
                                }}
                                className="text-xs text-indigo-300 hover:text-indigo-200 underline ml-1 inline-flex items-center gap-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50"
                                title="Synchroniser l'ID Twitch"
                              >
                                <RefreshCw className="w-3 h-3 shrink-0" aria-hidden />
                                Sync
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {member.onboardingStatus === "termine" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30">
                              Terminé
                            </span>
                          ) : member.onboardingStatus === "en_cours" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                              En cours
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-400 border border-gray-500/30">
                              À faire
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-gray-300 text-sm">
                          {member.mentorTwitchLogin ? `@${member.mentorTwitchLogin}` : "—"}
                        </td>
                      </>
                    )}
                    <td className="py-4 px-6">
                      <span className={getRoleBadgeColor(member.role)}>
                        {getRoleBadgeLabel(member.role)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                          member.statut
                        )}`}
                      >
                        {member.statut}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-300 text-sm">
                      {member.isArchived
                        ? member.deletedAt
                          ? new Date(member.deletedAt).toLocaleDateString("fr-FR")
                          : "—"
                        : formatMemberSince(member.createdAt)}
                    </td>
                    <td className="py-4 px-6">
                      {member.integrationDate ? (
                        <div className="flex flex-col gap-1.5 max-w-[200px]">
                          <span className="text-sm text-slate-200 tabular-nums">
                            {new Date(member.integrationDate).toLocaleDateString("fr-FR", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/20 text-green-300 border border-green-500/30">
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                              Renseignée
                            </span>
                            {integrationSessionsLoaded &&
                              (() => {
                                const dk = calendarDayKey(member.integrationDate);
                                if (!dk || !sessionDayIndex.dayKeys.has(dk)) return null;
                                const titles = sessionDayIndex.titlesByDay.get(dk) || [];
                                const tip =
                                  titles.length > 0
                                    ? `Même jour qu’une session créée : ${titles.join(" · ")}`
                                    : "Même jour calendaire qu’une session d’intégration planifiée";
                                return (
                                  <span
                                    title={tip}
                                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/25 text-violet-200 border border-violet-400/45"
                                  >
                                    <Calendar className="w-3 h-3 shrink-0 opacity-90" />
                                    Session
                                  </span>
                                );
                              })()}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-400 border border-gray-500/30">
                          <XCircle className="w-3 h-3" />
                          Non
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {(() => {
                        const completeness = getMemberCompleteness(member);
                        const colorClass =
                          completeness.percent >= 80
                            ? "bg-green-500/20 text-green-300 border-green-500/30"
                            : completeness.percent >= 50
                            ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                            : "bg-red-500/20 text-red-300 border-red-500/30";
                        const title = completeness.missing.length > 0
                          ? `Champs manquants: ${completeness.missing.join(", ")}`
                          : "Profil complet";
                        const barGradient =
                          completeness.percent >= 80
                            ? "from-emerald-400 to-teal-400"
                            : completeness.percent >= 50
                            ? "from-amber-400 to-orange-400"
                            : "from-rose-400 to-red-500";
                        return (
                          <div className="max-w-[140px]" title={title}>
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold tabular-nums text-slate-200">
                                <Percent className="h-3 w-3 text-indigo-400/80" aria-hidden />
                                {completeness.percent}%
                              </span>
                              <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${colorClass}`}>
                                {completeness.label}
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-[#252a3d]">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-[width] duration-500`}
                                style={{ width: `${completeness.percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    {viewMode === "complet" && (
                      <>
                        <td className="py-4 px-6 text-gray-300 text-sm">
                          {member.parrain || "—"}
                        </td>
                        <td className="py-4 px-6 text-gray-300 text-sm">
                          {formatLastLiveDate(member.lastLiveDate)}
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-white font-semibold">
                            {member.raidsDone || 0}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-white font-semibold">
                            {member.raidsReceived || 0}
                          </span>
                        </td>
                      </>
                    )}
                    {viewMode === "complet" && (
                      <>
                        <td className="py-4 px-6">
                          {member.isVip ? (
                            <span className="px-2 py-1 rounded border border-indigo-300/35 bg-indigo-500/20 text-indigo-100 text-xs font-semibold">
                              VIP
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {member.twitchStatus?.isLive ? (
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                              <span className="text-red-400 text-xs font-semibold">LIVE</span>
                              {member.twitchStatus.viewerCount && (
                                <span className="text-gray-400 text-xs">
                                  {member.twitchStatus.viewerCount} viewers
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                      </>
                    )}
                    <td className="py-4 px-6">
                      {(() => {
                        const isCommunityLocked =
                          member.statut === "Inactif" &&
                          (member.role === "Communauté" || isInactiveExitMemberRole(member.role));
                        const canValidateCommunity = canValidateCommunityPassage(member);
                        const isCompactView = viewMode !== "complet";
                        const actionInfoClass = isCompactView ? rowActionInfoCompact : rowActionInfo;
                        const actionPrimaryClass = isCompactView ? rowActionPrimaryCompact : rowActionPrimary;
                        const actionDangerClass = isCompactView ? rowActionDangerCompact : rowActionDanger;
                        const actionSuccessClass = isCompactView ? rowActionSuccessCompact : rowActionSuccess;
                        const actionWarningClass = isCompactView ? rowActionWarningCompact : rowActionWarning;
                        const actionEditClass = isCompactView ? rowActionEditCompact : rowActionEdit;
                        return (
                      <div className={`gap-2 ${isCompactView ? "flex items-center whitespace-nowrap" : "flex items-center"}`}>
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setShowMemberHistory(true);
                          }}
                          className={actionInfoClass}
                          title="Voir l'historique"
                        >
                          <History className="w-3 h-3" />
                          {isCompactView ? "Hist." : "Historique"}
                        </button>
                        <Link
                          href={`/admin/membres/fiche/${encodeURIComponent(
                            member.discordId || member.twitchId || member.twitch || member.siteUsername || member.nom
                          )}`}
                          className={`${actionPrimaryClass} inline-flex items-center gap-1`}
                          title="Voir la fiche membre"
                        >
                          <Eye className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                          {isCompactView ? "Fiche" : "Fiche"}
                        </Link>
                        {member.isArchived ? (
                          <>
                            <button
                              onClick={() => handleViewArchivedData(member)}
                              className={actionInfoClass}
                              title="Voir les données archivées"
                            >
                              {isCompactView ? "Data" : "Voir données"}
                            </button>
                            {currentAdmin?.canWrite && (
                              <button
                                onClick={() => handleRestoreArchived(member)}
                                className={actionSuccessClass}
                                title="Désarchiver vers Communauté inactif"
                              >
                                <ArchiveRestore className="w-3 h-3" />
                                {isCompactView ? "On" : "Désarchiver"}
                              </button>
                            )}
                            {currentAdmin?.isFounder && (
                              <button
                                onClick={() => handlePurgeArchived(member)}
                                className={actionDangerClass}
                                title="Suppression définitive totale"
                              >
                                <Trash2 className="w-3 h-3" />
                                {isCompactView ? "Del" : "Supp. définitive"}
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleToggleStatus(member)}
                              className={`${member.statut === "Actif" ? actionDangerClass : actionSuccessClass} ${
                                isCommunityLocked ? "opacity-60 cursor-not-allowed" : ""
                              }`}
                              disabled={isCommunityLocked}
                              title={
                                isCommunityLocked
                                  ? "Rôle verrouillé (Communauté / Départ / Banni) : changez d'abord le rôle pour réactiver"
                                  : undefined
                              }
                            >
                              {member.statut === "Actif"
                                ? (isCompactView ? "OFF" : "Désactiver")
                                : isCommunityLocked
                                ? (isCompactView ? "ON 🔒" : "Activer (rôle verrouillé)")
                                : (isCompactView ? "ON" : "Activer")}
                            </button>
                            {statusTab === "suivi_pause" && canValidateCommunity && currentAdmin?.canWrite && (
                              <button
                                onClick={() => handleValidateCommunityPassage(member)}
                                className={actionWarningClass}
                                title="Valider le passage en rôle Communauté (reste Inactif)"
                              >
                                {isCompactView ? "Valider" : "Valider communauté"}
                              </button>
                            )}
                            {statusTab === "nouveaux" && currentAdmin?.canWrite && (
                              <>
                                <button
                                  onClick={() => handleQuickAssignRole(member, "Affilié")}
                                  className={actionSuccessClass}
                                  title="Attribuer le rôle Affilié et activer le membre"
                                >
                                  {isCompactView ? "Affilié" : "Raccourci Affilié"}
                                </button>
                                <button
                                  onClick={() => handleQuickAssignRole(member, "Développement")}
                                  className={actionPrimaryClass}
                                  title="Attribuer le rôle Développement et activer le membre"
                                >
                                  {isCompactView ? "Dév." : "Raccourci Développement"}
                                </button>
                              </>
                            )}
                            {currentAdmin?.canWrite && (
                              <>
                                <button
                                  onClick={() => handleEdit(member)}
                                  className={actionEditClass}
                                >
                                  {isCompactView ? "Edit" : "Modifier"}
                                </button>
                                <button
                                  onClick={() => handleDelete(member)}
                                  className={actionDangerClass}
                                >
                                  {isCompactView ? "Suppr." : "Supprimer"}
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                        );
                      })()}
                    </td>
                  </tr>
                  {isRowExpanded ? (
                    <tr className="border-b border-indigo-500/25 bg-[radial-gradient(ellipse_120%_80%_at_0%_0%,rgba(99,102,241,0.14),transparent_55%),#10131c]">
                      <td colSpan={tableColumnCount} className="px-4 py-5 sm:px-8">
                        {(() => {
                          const completeness = getMemberCompleteness(member);
                          const ficheHref = `/admin/membres/fiche/${encodeURIComponent(
                            member.discordId || member.twitchId || member.twitch || member.siteUsername || member.nom
                          )}`;
                          const publicAnnuaireHref = member.twitch
                            ? `/membres?member=${encodeURIComponent(member.twitch)}`
                            : "/membres";
                          const desc = (member.description || "").trim();
                          return (
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0 flex-1 space-y-3">
                                <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-300/90">
                                  <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden />
                                  Aperçu créateur TENF
                                </p>
                                <p className="text-sm leading-relaxed text-slate-300">
                                  {desc
                                    ? desc.length > 280
                                      ? `${desc.slice(0, 280)}…`
                                      : desc
                                    : "Pas encore de description publique : pense à la renseigner pour l’annuaire et l’espace membre."}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {completeness.missing.length > 0 ? (
                                    completeness.missing.map((label) => (
                                      <span
                                        key={label}
                                        className="rounded-full border border-amber-400/35 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-100"
                                      >
                                        À compléter · {label}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-100">
                                      Champs clés renseignés
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                                <Link
                                  href={ficheHref}
                                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-400/35 bg-indigo-500/15 px-4 py-2.5 text-xs font-semibold text-indigo-100 transition hover:bg-indigo-500/25"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Fiche 360°
                                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                                </Link>
                                <Link
                                  href={publicAnnuaireHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Voir dans l’annuaire
                                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                                </Link>
                                {member.twitch ? (
                                  <a
                                    href={`https://www.twitch.tv/${member.twitch}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#9146ff]/35 bg-[#9146ff]/10 px-4 py-2.5 text-xs font-semibold text-[#e9d5ff] transition hover:bg-[#9146ff]/20"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Ouvrir Twitch
                                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                                  </a>
                                ) : null}
                                {currentAdmin?.canWrite ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(member);
                                    }}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-400/35 bg-violet-500/15 px-4 py-2.5 text-xs font-semibold text-violet-100 transition hover:bg-violet-500/25"
                                  >
                                    Modifier la fiche
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          );
                        })()}
                        <p className="mt-4 border-t border-white/5 pt-3 text-[11px] text-slate-600">
                          Clique à nouveau sur la ligne pour replier. Les données affichées côté membres dépendent des champs remplis et des droits de publication.
                        </p>
                      </td>
                    </tr>
                  ) : null}
                    </Fragment>
                  );
                })}
                {displayedMembers.length === 0 && (
                  <tr>
                    <td
                      colSpan={tableColumnCount}
                      className="py-8 px-6 text-center text-gray-400"
                    >
                      {isSearching
                        ? "Aucun membre ne correspond à cette recherche."
                        : `Aucun membre dans l'onglet « ${activeTabLabel} » avec les filtres actuels.`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          ) : (
          <div className="border-t border-[#353a50]/40 bg-[linear-gradient(180deg,rgba(18,22,35,0.65),rgba(10,11,16,0.92))] p-4 md:p-6">
            {paginatedMembers.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                {isSearching
                  ? "Aucun membre ne correspond à cette recherche."
                  : `Aucun membre dans l'onglet « ${activeTabLabel} » avec les filtres actuels.`}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {paginatedMembers.map((member) => {
                  const completeness = getMemberCompleteness(member);
                  const ficheHref = `/admin/membres/fiche/${encodeURIComponent(
                    member.discordId || member.twitchId || member.twitch || member.siteUsername || member.nom
                  )}`;
                  const isCommunityLocked =
                    member.statut === "Inactif" &&
                    (member.role === "Communauté" || isInactiveExitMemberRole(member.role));
                  const canValidateCommunity = canValidateCommunityPassage(member);
                  const barColor =
                    completeness.percent >= 80
                      ? "from-emerald-400 to-cyan-400"
                      : completeness.percent >= 50
                      ? "from-amber-400 to-orange-400"
                      : "from-rose-400 to-red-500";
                  return (
                    <div
                      key={getMemberStableKey(member)}
                      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#2f354a] bg-gradient-to-b from-[#161a28] via-[#12151f] to-[#0b0d12] p-4 shadow-[0_16px_48px_rgba(0,0,0,0.35)] transition duration-300 hover:border-indigo-400/45 hover:shadow-[0_24px_60px_rgba(79,70,229,0.14)]"
                    >
                      {currentAdmin?.isFounder && (
                        <div className="absolute right-3 top-3 z-10">
                          <input
                            type="checkbox"
                            checked={selectedMemberLogins.includes(member.twitch)}
                            onChange={(e) => toggleMemberSelection(member.twitch, e.target.checked)}
                            className="h-4 w-4 rounded border-gray-600 bg-[#0f1321]"
                            aria-label={`Sélectionner ${member.nom}`}
                          />
                        </div>
                      )}
                      <div className="flex gap-3 pr-8">
                        <img
                          src={member.avatar}
                          alt={member.nom}
                          className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-white/10"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate font-semibold text-white">{member.nom}</p>
                            <MemberStateBadge state={getMemberTenfState(member)} />
                          </div>
                          {member.twitch ? (
                            <a
                              href={`https://www.twitch.tv/${member.twitch}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-0.5 block truncate text-xs text-indigo-300 hover:text-indigo-200"
                            >
                              twitch.tv/{member.twitch}
                            </a>
                          ) : (
                            <p className="mt-0.5 text-xs text-slate-500">Pas de Twitch</p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className={`inline-block max-w-full truncate rounded-full px-2 py-0.5 text-[11px] font-semibold ${getRoleBadgeColor(member.role)}`}>
                              {getRoleBadgeLabel(member.role)}
                            </span>
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${getStatusBadgeColor(member.statut)}`}
                            >
                              {member.statut}
                            </span>
                            {member.twitchStatus?.isLive ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-200">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" aria-hidden />
                                LIVE
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                        <div className="truncate" title={member.parrain ? `Parrain : ${member.parrain}` : "Pas de parrain"}>
                          <span className="text-slate-500">Parrain · </span>
                          <span className="text-slate-200">{member.parrain || "—"}</span>
                        </div>
                        <div className="truncate" title="Dernier live détecté">
                          <span className="text-slate-500">Dernier live · </span>
                          <span className="text-slate-200">{formatLastLiveDate(member.lastLiveDate)}</span>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Complétude fiche</span>
                          <span className="tabular-nums text-slate-200">{completeness.percent}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[#252a3d]">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`}
                            style={{ width: `${completeness.percent}%` }}
                          />
                        </div>
                        {completeness.missing.length > 0 ? (
                          <p className="pt-1 text-[10px] text-amber-200/80" title={`Champs manquants : ${completeness.missing.join(", ")}`}>
                            À compléter : {completeness.missing.slice(0, 2).join(", ")}
                            {completeness.missing.length > 2 ? ` · +${completeness.missing.length - 2}` : ""}
                          </p>
                        ) : null}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMember(member);
                            setShowMemberHistory(true);
                          }}
                          className={rowActionInfoCompact}
                          title="Historique"
                        >
                          <History className="w-3 h-3 shrink-0" aria-hidden />
                          Hist.
                        </button>
                        <Link href={ficheHref} className={rowActionPrimaryCompact} title="Fiche membre">
                          Fiche
                        </Link>
                        {member.isArchived ? (
                          <>
                            <button type="button" onClick={() => handleViewArchivedData(member)} className={rowActionInfoCompact}>
                              Data
                            </button>
                            {currentAdmin?.canWrite ? (
                              <button type="button" onClick={() => handleRestoreArchived(member)} className={rowActionSuccessCompact}>
                                <ArchiveRestore className="w-3 h-3 shrink-0" aria-hidden />
                                Restaurer
                              </button>
                            ) : null}
                            {currentAdmin?.isFounder ? (
                              <button type="button" onClick={() => handlePurgeArchived(member)} className={rowActionDangerCompact}>
                                <Trash2 className="w-3 h-3 shrink-0" aria-hidden />
                                Purge
                              </button>
                            ) : null}
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(member)}
                              disabled={isCommunityLocked}
                              className={`${member.statut === "Actif" ? rowActionDangerCompact : rowActionSuccessCompact} ${
                                isCommunityLocked ? "opacity-60 cursor-not-allowed" : ""
                              }`}
                              title={
                                isCommunityLocked
                                  ? "Rôle verrouillé (Communauté / Départ / Banni) : changez d'abord le rôle pour réactiver"
                                  : undefined
                              }
                            >
                              {member.statut === "Actif" ? "Désact." : "Activer"}
                            </button>
                            {statusTab === "suivi_pause" && canValidateCommunity && currentAdmin?.canWrite ? (
                              <button
                                type="button"
                                onClick={() => handleValidateCommunityPassage(member)}
                                className={rowActionWarningCompact}
                              >
                                Communauté
                              </button>
                            ) : null}
                            {statusTab === "nouveaux" && currentAdmin?.canWrite ? (
                              <>
                                <button type="button" onClick={() => handleQuickAssignRole(member, "Affilié")} className={rowActionSuccessCompact}>
                                  Affilié
                                </button>
                                <button type="button" onClick={() => handleQuickAssignRole(member, "Développement")} className={rowActionPrimaryCompact}>
                                  Dév.
                                </button>
                              </>
                            ) : null}
                            {currentAdmin?.canWrite ? (
                              <>
                                <button type="button" onClick={() => handleEdit(member)} className={rowActionEditCompact}>
                                  Éditer
                                </button>
                                <button type="button" onClick={() => handleDelete(member)} className={rowActionDangerCompact}>
                                  Suppr.
                                </button>
                              </>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          )}
          {displayedMembers.length > 0 && (
            <div className="border-t border-[#353a50]/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-[#121623]/95">
              <p className="text-sm text-slate-400">
                Page <span className="text-white font-semibold">{clampedCurrentPage}</span> / <span className="text-white font-semibold">{totalPages}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={clampedCurrentPage === 1}
                  className="px-3 py-1.5 text-sm rounded border border-[#353a50] text-slate-100 disabled:text-gray-500 disabled:border-gray-800 hover:bg-[#1b2132] transition-colors"
                >
                  Précédent
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={clampedCurrentPage === totalPages}
                  className="px-3 py-1.5 text-sm rounded border border-[#353a50] text-slate-100 disabled:text-gray-500 disabled:border-gray-800 hover:bg-[#1b2132] transition-colors"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
          </MemberBentoCell>
        </MemberBentoRow>
      </MemberBentoShell>

        {/* Modal motif audit — actions de masse sensibles (rôle / statut) */}
        {currentAdmin?.isFounder && (
          <GestionBulkReasonModal
            open={bulkReasonModalOpen}
            copy={gestionCopy.modals.bulkReason}
            accentHex={gestionCopy.accent}
            draft={bulkAuditReasonDraft}
            loading={bulkLoading}
            onDraftChange={setBulkAuditReasonDraft}
            onCancel={() => setBulkReasonModalOpen(false)}
            onConfirm={() => void confirmBulkAuditReasonAndRun()}
          />
        )}

        {/* Modal d'ajout (pour les fondateurs) */}
        {currentAdmin?.isFounder && (
          <>
            <AddChannelModal
              isOpen={isAddModalOpen}
              onClose={() => {
                setIsAddModalOpen(false);
                setAddChannelInitial(null);
                router.replace("/admin/membres/gestion", { scroll: false });
              }}
              initialTwitch={addChannelInitial?.twitch}
              initialDiscord={addChannelInitial?.discord}
              onAdd={handleAdd}
            />
            <BulkImportModal
              isOpen={isBulkImportOpen}
              onClose={() => setIsBulkImportOpen(false)}
              onImport={handleBulkImport}
              modalCopy={gestionCopy.modals.bulkImport}
              accentHex={gestionCopy.accent}
            />
            <VerifyListModalV2
              isOpen={isVerifyListOpen}
              onClose={() => setIsVerifyListOpen(false)}
            />
          </>
        )}

        {/* Modal d'édition (pour les rôles avec permission write) */}
        {isEditModalOpen && selectedMember && currentAdmin?.canWrite && (
          <EditMemberModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedMember(null);
            }}
            member={{
              id: selectedMember.id,
              avatar: selectedMember.avatar,
              nom: selectedMember.nom,
              role: selectedMember.role,
              statut: selectedMember.statut,
              discord: selectedMember.discord,
              discordId: selectedMember.discordId,
              twitch: selectedMember.twitch,
              twitchId: selectedMember.twitchId, // Ajouter l'ID Twitch
              description: selectedMember.description,
              notesInternes: selectedMember.description,
              badges: selectedMember.badges,
              isVip: selectedMember.isVip,
              shadowbanLives: selectedMember.shadowbanLives,
              createdAt: selectedMember.createdAt,
              integrationDate: selectedMember.integrationDate,
              birthday: selectedMember.birthday,
              twitchAffiliateDate: selectedMember.twitchAffiliateDate,
              onboardingStatus: selectedMember.onboardingStatus,
              mentorTwitchLogin: selectedMember.mentorTwitchLogin,
              primaryLanguage: selectedMember.primaryLanguage,
              timezone: selectedMember.timezone,
              countryCode: selectedMember.countryCode,
              lastReviewAt: selectedMember.lastReviewAt,
              nextReviewAt: selectedMember.nextReviewAt,
              roleHistory: selectedMember.roleHistory,
              staffPeriods: selectedMember.staffPeriods,
              parrain: selectedMember.parrain,
            }}
            onSave={handleSaveEdit}
          />
        )}

        {/* Modal d'historique du membre */}
        {showMemberHistory && selectedMember && (
          <MemberHistoryModal
            isOpen={showMemberHistory}
            onClose={() => {
              setShowMemberHistory(false);
              setSelectedMember(null);
            }}
            memberId={selectedMember.twitch}
            memberName={selectedMember.nom}
          />
        )}

        {/* Modal de vérification des noms de chaînes Twitch */}
        {showVerifyTwitchNamesModal && (
          <VerifyTwitchNamesModal
            isOpen={showVerifyTwitchNamesModal}
            onClose={async () => {
              setShowVerifyTwitchNamesModal(false);
              // Recharger les membres après fermeture du modal (en cas de modifications)
              await loadMembers();
            }}
          />
        )}

        {/* Modal de vérification des pseudos Discord */}
        {showVerifyDiscordNamesModal && (
          <VerifyDiscordNamesModal
            open={showVerifyDiscordNamesModal}
            onClose={() => {
              if (!syncingDiscordNames) setShowVerifyDiscordNamesModal(false);
            }}
            copy={gestionCopy.modals.verifyDiscord}
            accentHex={gestionCopy.accent}
            loading={syncingDiscordNames}
            error={verifyDiscordError}
            info={verifyDiscordInfo}
            rows={verifyDiscordRows}
            updatedRows={verifyDiscordUpdatedRows}
            onLaunch={() => void handleVerifyDiscordNames()}
          />
        )}

        {/* Modal de fusion de membres */}
        {showMergeModal && membersToMerge.length >= 2 && currentAdmin?.isFounder && (
          <MergeMemberModal
            isOpen={showMergeModal}
            onClose={() => {
              setShowMergeModal(false);
              setMembersToMerge([]);
              setCurrentDuplicateIndex(0);
            }}
            members={membersToMerge}
            allDuplicates={duplicates}
            currentDuplicateIndex={currentDuplicateIndex}
            onNextDuplicate={() => {
              if (currentDuplicateIndex < duplicates.length - 1) {
                const nextIndex = currentDuplicateIndex + 1;
                setCurrentDuplicateIndex(nextIndex);
                if (duplicates[nextIndex]?.members) {
                  setMembersToMerge(duplicates[nextIndex].members);
                }
              }
            }}
            onPreviousDuplicate={() => {
              if (currentDuplicateIndex > 0) {
                const prevIndex = currentDuplicateIndex - 1;
                setCurrentDuplicateIndex(prevIndex);
                if (duplicates[prevIndex]?.members) {
                  setMembersToMerge(duplicates[prevIndex].members);
                }
              }
            }}
            onMerge={async (mergedData) => {
              setMergeLoading(true);
              try {
                const response = await fetch("/api/admin/members/merge", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    membersToMerge: membersToMerge.map((m) => m.twitchLogin),
                    mergedData: mergedData,
                  }),
                });
                const data = await response.json();
                if (data.success) {
                  pushNotice(
                    "success",
                    `Fusion réussie · Principal: ${data.primaryMember} · Fusionnés: ${data.deletedMembers.join(", ")}`
                  );
                  
                  // Retirer le doublon fusionné de la liste
                  const updatedDuplicates = duplicates.filter((_, index) => index !== currentDuplicateIndex);
                  setDuplicates(updatedDuplicates);
                  
                  // Si il reste des doublons, passer au suivant, sinon fermer
                  if (updatedDuplicates.length > 0) {
                    if (currentDuplicateIndex >= updatedDuplicates.length) {
                      setCurrentDuplicateIndex(updatedDuplicates.length - 1);
                    }
                    setMembersToMerge(updatedDuplicates[Math.min(currentDuplicateIndex, updatedDuplicates.length - 1)].members);
                  } else {
                    setShowMergeModal(false);
                    setMembersToMerge([]);
                    setCurrentDuplicateIndex(0);
                  }
                  
                  await loadMembers();
                } else {
                  pushNotice("error", `Erreur: ${data.error || "Erreur inconnue"}`);
                }
              } catch (error) {
                console.error("Erreur lors de la fusion:", error);
                pushNotice("error", `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
              } finally {
                setMergeLoading(false);
              }
            }}
            loading={mergeLoading}
            modalCopy={gestionCopy.modals.merge}
            accentHex={gestionCopy.accent}
          />
        )}
    </>
  );
}
