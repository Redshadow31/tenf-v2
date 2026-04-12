"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Upload, LayoutGrid, Eye, Download, RefreshCw, Copy, Save, Users, ChevronUp, ChevronDown, AlertCircle, CheckCircle2, XCircle, History, ArchiveRestore, Trash2, Calendar } from "lucide-react";
import MemberBadges from "@/components/admin/MemberBadges";
import AddChannelModal from "@/components/admin/AddChannelModal";
import EditMemberModal from "@/components/admin/EditMemberModal";
import BulkImportModal from "@/components/admin/BulkImportModal";
import VerifyListModalV2 from "@/components/admin/VerifyListModalV2";
import MergeMemberModal from "@/components/admin/MergeMemberModal";
import MemberHistoryModal from "@/components/admin/MemberHistoryModal";
import VerifyTwitchNamesModal from "@/components/admin/VerifyTwitchNamesModal";
import AdminToastStack from "@/components/admin/ui/AdminToastStack";
// logAction est maintenant appelé via l'API /api/admin/log
import { getDiscordUser } from "@/lib/discord";
import { isFounder } from "@/lib/adminRoles";
import { getRoleBadgeClasses } from "@/lib/roleColors";
import { toCanonicalMemberRole } from "@/lib/memberRoles";
import { getRoleBadgeLabel } from "@/lib/roleBadgeSystem";
import { calendarDayKey, indexIntegrationsByCalendarDay, type SessionDayIndex } from "@/lib/integrationSessionCalendar";

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
type MemberStatus = "Actif" | "Inactif";

interface Member {
  id: number;
  avatar: string;
  nom: string;
  role: MemberRole;
  statut: MemberStatus;
  discord: string;
  discordId?: string;
  twitch: string;
  twitchUrl?: string;
  twitchId?: string; // ID Twitch numérique
  siteUsername?: string;
  notesInternes?: string;
  badges?: string[];
  isVip?: boolean;
  isModeratorJunior?: boolean;
  isModeratorMentor?: boolean;
  description?: string;
  customBio?: string;
  twitchStatus?: {
    isLive: boolean;
    gameName?: string;
    viewerCount?: number;
  };
  lastLiveDate?: string; // Date ISO du dernier live
  raidsDone?: number; // Nombre de raids envoyés ce mois
  raidsReceived?: number; // Nombre de raids reçus ce mois
  createdAt?: string; // Date ISO de création
  integrationDate?: string; // Date ISO d'intégration
  birthday?: string; // Date ISO anniversaire
  twitchAffiliateDate?: string; // Date ISO affiliation Twitch
  shadowbanLives?: boolean;
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
  profileValidationStatus?: "non_soumis" | "en_cours_examen" | "valide";
  isArchived?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deleteReason?: string;
}

type DiscordVerifyResult = {
  twitchLogin: string;
  displayName: string;
  discordId: string;
  storedDiscordUsername: string | null;
  fetchedDiscordUsername: string | null;
  status: "same" | "updated" | "different" | "not_found" | "error";
  error?: string;
};

type DiscordVerifyResponse = {
  processed: number;
  same: number;
  different: number;
  updated: number;
  notFound: number;
  errors: number;
  totalSelected?: number;
  nextOffset?: number;
  hasMore?: boolean;
  results: DiscordVerifyResult[];
  error?: string;
};

async function parseApiResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.toLowerCase().includes("application/json")) {
    return (await response.json()) as T;
  }

  const raw = await response.text().catch(() => "");
  const preview = raw.trim().slice(0, 180).replace(/\s+/g, " ");
  throw new Error(preview ? `Reponse API non-JSON: ${preview}` : "Reponse API non-JSON.");
}

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";

function getPresetFilterDisplayLabel(preset: string): string {
  switch (preset) {
    case "nouveaux":
      return "Nouveaux (< 30 jours)";
    case "incomplets":
      return "Incomplets";
    case "sans_twitch_id":
      return "Sans ID Twitch";
    case "sans_integration":
      return "Sans intégration";
    case "integration_session_alignee":
      return "Date intégration = session planifiée";
    case "vip":
      return "VIP";
    case "inactifs":
      return "Inactifs";
    case "revue_due":
      return "Revue due";
    default:
      return preset;
  }
}

export default function GestionMembresPage() {
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
  const [hasAdvancedAccess, setHasAdvancedAccess] = useState(false);
  const [safeModeEnabled, setSafeModeEnabled] = useState(false);
  const [viewMode, setViewMode] = useState<"simple" | "complet">("simple");
  type SortableColumn = "nom" | "role" | "statut" | "createdAt" | "integrationDate" | "parrain" | "lastLive" | "raidsDone" | "raidsReceived" | "isVip" | "isLive" | "completude";
  type PresetFilter =
    | "all"
    | "nouveaux"
    | "incomplets"
    | "sans_twitch_id"
    | "sans_integration"
    | "integration_session_alignee"
    | "vip"
    | "inactifs"
    | "revue_due";
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
  const [lastLiveDatesLoaded, setLastLiveDatesLoaded] = useState(false);
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
  const [statusTab, setStatusTab] = useState<"actifs" | "inactifs" | "nouveaux" | "archives">("actifs");
  const [archivedMembers, setArchivedMembers] = useState<Member[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<25 | 50 | 100>(25);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [actionNotice, setActionNotice] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

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

  // Lire le paramètre search de l'URL au chargement
  useEffect(() => {
    const searchParam = searchParams.get("search");
    if (searchParam) {
      setSearchQuery(decodeURIComponent(searchParam));
    }
  }, [searchParams]);

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
            roleData.role === "Mentor" ||
            roleData.role === "Modérateur Junior";
          const founderStatus = isFounder(user.id);
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
  ]);

  useEffect(() => {
    if (!actionNotice) return;
    const timeout = setTimeout(() => setActionNotice(null), 5000);
    return () => clearTimeout(timeout);
  }, [actionNotice]);

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
      setLastLiveDatesLoaded(false); // Réinitialiser le flag pour recharger les dates
      const archivesPromise = loadArchivedMembers().catch(() => undefined);
      const raidsStatsPromise = fetchRaidsStats().catch(() => ({}));

      // Toujours essayer de charger depuis l'API centralisée (l'API vérifie les permissions)
      // L'API centralisée contient les modifications manuelles et est prioritaire
      // Tous les admins (Fondateur, Admin, Admin Adjoint, Mentor, Modérateur Junior) ont accès
      try {
        const centralResponse = await fetchWithTimeout("/api/admin/members", {
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
          await archivesPromise;
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
      await archivesPromise;
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
        alert(`Erreur Discord: ${errorMessage}`);
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
        const centralResponse = await fetchWithTimeout("/api/admin/members", {
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
      alert(`Erreur: ${errorMessage}`);
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

  // Filtrer les membres
  /**
   * Fonction de normalisation pour la recherche
   * Supprime les majuscules, les accents et les espaces inutiles
   */
  function normalize(text: string | undefined | null): string {
    if (!text) return "";
    return text
      .toLowerCase()
      .normalize("NFKD") // Décompose aussi les variantes Unicode fancy (ex: 𝖓𝖆𝖓𝖌𝖊𝖑)
      .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
      .replace(/[^a-z0-9\s]/g, " ") // Uniformise ponctuation/symboles en espaces
      .replace(/\s+/g, " ") // Remplace les espaces multiples par un seul
      .trim(); // Supprime les espaces en début/fin
  }

  // Filtrer les membres avec recherche multi-champs améliorée
  let filteredMembers = members;
  
  if (searchQuery.trim().length > 0) {
    const normalizedQuery = normalize(searchQuery);
    const rawQuery = searchQuery.trim();
    const queryDigits = rawQuery.replace(/\D/g, "");
    
    filteredMembers = members.filter((member) => {
      // Recherche dans tous les champs avec normalisation
      const normalizedNom = normalize(member.nom);
      const normalizedTwitch = normalize(member.twitch);
      const normalizedTwitchUrl = normalize(member.twitchUrl);
      const twitchChannelFromUrl = member.twitchUrl
        ? member.twitchUrl.split("/").filter(Boolean).pop()
        : "";
      const normalizedTwitchChannelFromUrl = normalize(twitchChannelFromUrl);
      const normalizedDiscord = normalize(member.discord);
      const normalizedSiteUsername = normalize(member.siteUsername);
      const normalizedDiscordId = String(member.discordId || "").trim();
      const discordIdDigits = normalizedDiscordId.replace(/\D/g, "");
      const discordIdMatchesRaw =
        normalizedDiscordId.length > 0 &&
        normalizedDiscordId.toLowerCase().includes(rawQuery.toLowerCase());
      const discordIdMatchesDigits =
        queryDigits.length > 0 &&
        discordIdDigits.length > 0 &&
        discordIdDigits.includes(queryDigits);
      
      // Correspondance partielle insensible à la casse et aux accents
      return (
        normalizedNom.includes(normalizedQuery) ||
        normalizedTwitch.includes(normalizedQuery) ||
        normalizedTwitchChannelFromUrl.includes(normalizedQuery) ||
        normalizedTwitchUrl.includes(normalizedQuery) ||
        normalizedDiscord.includes(normalizedQuery) ||
        normalizedSiteUsername.includes(normalizedQuery) ||
        // Recherche sur l'ID Discord: accepte aussi <@id>, espaces, etc.
        discordIdMatchesRaw ||
        discordIdMatchesDigits
      );
    });
  }

  // Filtres métier rapides
  if (presetFilter !== "all") {
    const now = new Date();
    filteredMembers = filteredMembers.filter((member) => {
      const completeness = getMemberCompleteness(member);
      const createdAtMs = member.createdAt ? new Date(member.createdAt).getTime() : 0;
      const daysSinceCreate = createdAtMs > 0 ? Math.floor((now.getTime() - createdAtMs) / (1000 * 60 * 60 * 24)) : 9999;
      switch (presetFilter) {
        case "nouveaux":
          return daysSinceCreate <= 30;
        case "incomplets":
          return completeness.percent < 80 || member.profileValidationStatus !== "valide";
        case "sans_twitch_id":
          return !member.twitchId;
        case "sans_integration":
          return !member.integrationDate;
        case "integration_session_alignee": {
          if (!integrationSessionsLoaded) return false;
          if (!member.integrationDate) return false;
          const dayK = calendarDayKey(member.integrationDate);
          return !!dayK && sessionDayIndex.dayKeys.has(dayK);
        }
        case "vip":
          return !!member.isVip;
        case "inactifs":
          return member.statut === "Inactif";
        case "revue_due":
          if (!member.nextReviewAt) return false;
          return new Date(member.nextReviewAt).getTime() <= now.getTime();
        default:
          return true;
      }
    });
  }

  const joinedAfterMs = joinedAfterFilter ? new Date(`${joinedAfterFilter}T00:00:00`).getTime() : null;
  const joinedBeforeMs = joinedBeforeFilter ? new Date(`${joinedBeforeFilter}T23:59:59.999`).getTime() : null;
  if (roleFilter !== "all" || memberStatusFilter !== "all" || joinedAfterMs !== null || joinedBeforeMs !== null) {
    filteredMembers = filteredMembers.filter((member) => {
      if (roleFilter !== "all" && member.role !== roleFilter) return false;
      if (memberStatusFilter !== "all" && member.statut !== memberStatusFilter) return false;
      if (joinedAfterMs !== null || joinedBeforeMs !== null) {
        if (!member.createdAt) return false;
        const createdAtMs = new Date(member.createdAt).getTime();
        if (!Number.isFinite(createdAtMs)) return false;
        if (joinedAfterMs !== null && createdAtMs < joinedAfterMs) return false;
        if (joinedBeforeMs !== null && createdAtMs > joinedBeforeMs) return false;
      }
      return true;
    });
  }

  // Trier les membres
  if (sortColumn) {
    filteredMembers = [...filteredMembers].sort((a, b) => {
      let comparison = 0;
      
      switch (sortColumn) {
        case "nom":
          comparison = a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' });
          break;
        case "role":
          comparison = a.role.localeCompare(b.role, 'fr', { sensitivity: 'base' });
          break;
        case "statut":
          comparison = a.statut.localeCompare(b.statut, 'fr', { sensitivity: 'base' });
          break;
        case "createdAt":
          const createdAtA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const createdAtB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          comparison = createdAtA - createdAtB;
          break;
        case "integrationDate":
          const integrationA = a.integrationDate ? new Date(a.integrationDate).getTime() : 0;
          const integrationB = b.integrationDate ? new Date(b.integrationDate).getTime() : 0;
          comparison = integrationA - integrationB;
          break;
        case "parrain":
          const parrainA = (a.parrain || "").localeCompare(b.parrain || "", 'fr', { sensitivity: 'base' });
          comparison = parrainA;
          break;
        case "lastLive":
          const dateA = a.lastLiveDate ? new Date(a.lastLiveDate).getTime() : 0;
          const dateB = b.lastLiveDate ? new Date(b.lastLiveDate).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case "raidsDone":
          comparison = (a.raidsDone || 0) - (b.raidsDone || 0);
          break;
        case "raidsReceived":
          comparison = (a.raidsReceived || 0) - (b.raidsReceived || 0);
          break;
        case "isVip":
          const vipA = a.isVip ? 1 : 0;
          const vipB = b.isVip ? 1 : 0;
          comparison = vipA - vipB;
          break;
        case "isLive":
          const liveA = a.twitchStatus?.isLive ? 1 : 0;
          const liveB = b.twitchStatus?.isLive ? 1 : 0;
          comparison = liveA - liveB;
          break;
        case "completude":
          comparison = getMemberCompleteness(a).percent - getMemberCompleteness(b).percent;
          break;
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }

  const newMembers = filteredMembers.filter((member) => member.role === "Nouveau");
  const isStaffRole = (role?: string): boolean => {
    const staffRoles = new Set([
      "Admin",
      "Admin Coordinateur",
      "Modérateur",
      "Modérateur en formation",
      "Modérateur en activité réduite",
      "Modérateur en pause",
      // Compat legacy
      "Admin Adjoint",
      "Mentor",
      "Modérateur Junior",
    ]);
    return !!role && staffRoles.has(role);
  };
  const activeMembers = filteredMembers.filter(
    (member) =>
      (member.statut === "Actif" || isStaffRole(member.role)) &&
      member.role !== "Nouveau"
  );
  const inactiveCommunityMembers = filteredMembers.filter(
    (member) => member.statut === "Inactif" && member.role === "Communauté"
  );
  const inactiveOtherMembers = filteredMembers.filter(
    (member) =>
      member.statut === "Inactif" &&
      !isStaffRole(member.role) &&
      member.role !== "Nouveau" &&
      member.role !== "Communauté"
  );
  const communityFollowupMembers = [...inactiveCommunityMembers, ...inactiveOtherMembers];
  const isSearching = searchQuery.trim().length > 0;
  let filteredArchivedMembers = archivedMembers;
  if (searchQuery.trim().length > 0) {
    const normalizedQuery = normalize(searchQuery);
    filteredArchivedMembers = archivedMembers.filter((member) => {
      const searchable = [
        member.nom,
        member.twitch,
        member.discord,
        member.discordId,
        member.siteUsername,
        member.deleteReason,
      ]
        .map((value) => normalize(value))
        .join(" ");
      return searchable.includes(normalizedQuery);
    });
  }
  if (roleFilter !== "all") {
    filteredArchivedMembers = filteredArchivedMembers.filter((member) => member.role === roleFilter);
  }
  if (memberStatusFilter !== "all") {
    filteredArchivedMembers = filteredArchivedMembers.filter((member) => member.statut === memberStatusFilter);
  }

  // En mode recherche sur les onglets membres, afficher tous les statuts pour éviter de "perdre" un membre selon l'onglet actif.
  const displayedMembers = statusTab === "archives"
    ? filteredArchivedMembers
    : isSearching
    ? filteredMembers
    : statusTab === "actifs"
    ? activeMembers
    : statusTab === "inactifs"
    ? communityFollowupMembers
    : newMembers;
  const totalPages = Math.max(1, Math.ceil(displayedMembers.length / pageSize));
  const clampedCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (clampedCurrentPage - 1) * pageSize;
  const startItem = displayedMembers.length === 0 ? 0 : startIndex + 1;
  const endItem = Math.min(clampedCurrentPage * pageSize, displayedMembers.length);
  const paginatedMembers = displayedMembers.slice(startIndex, endItem);
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

  const reviewAlerts = (() => {
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
  })();
  /** Tous les comptes marqués actifs (is_active), y compris rôle Nouveau — aligné sur la base / Discord. */
  const totalActiveMembers = members.filter(
    (m) => m.statut === "Actif" || isStaffRole(m.role)
  ).length;
  /** Même périmètre que l’onglet « Actifs » (hors pipeline Nouveau). */
  const totalActiveMembersIntegrated = members.filter(
    (m) => (m.statut === "Actif" || isStaffRole(m.role)) && m.role !== "Nouveau"
  ).length;
  const totalActiveNewRoleMembers = members.filter(
    (m) => m.role === "Nouveau" && m.statut === "Actif"
  ).length;
  const verifyDiscordRows = Object.values(verifyDiscordResultsByLogin).sort((a, b) =>
    String(a.displayName || a.twitchLogin).localeCompare(String(b.displayName || b.twitchLogin), "fr")
  );
  const verifyDiscordUpdatedRows = verifyDiscordRows.filter((row) => row.status === "updated");
  const totalInactiveMembers = members.filter(
    (member) =>
      member.statut === "Inactif" &&
      !isStaffRole(member.role) &&
      member.role !== "Nouveau"
  ).length;
  const totalNewMembers = members.filter((m) => m.role === "Nouveau").length;
  const totalArchivedMembers = archivedMembers.length;
  const totalIncompleteMembers = members.filter((m) => getMemberCompleteness(m).percent < 80).length;
  const totalWithoutTwitchId = members.filter((m) => !m.twitchId).length;
  const activeTabLabel =
    statusTab === "actifs"
      ? "Actifs"
      : statusTab === "inactifs"
      ? "Suivi communauté"
      : statusTab === "nouveaux"
      ? "Nouveaux"
      : "Archivé";
  const availableRoles = Array.from(new Set(members.map((member) => member.role))).sort((a, b) =>
    a.localeCompare(b, "fr", { sensitivity: "base" })
  );

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
      alert("Seuls les fondateurs peuvent utiliser les actions de masse");
      return;
    }
    if (selectedMemberLogins.length === 0) {
      alert("Sélectionne au moins un membre");
      return;
    }
    if (!bulkRole && !bulkStatus && !bulkOnboarding && !bulkNextReviewDate) {
      alert("Aucune action de masse sélectionnée");
      return;
    }

    const includesSensitiveBulkChanges = Boolean(bulkRole || bulkStatus);
    let bulkAuditReason: string | undefined;
    if (includesSensitiveBulkChanges) {
      const reason = prompt("Motif obligatoire pour les changements sensibles en masse (rôle/statut) :");
      if (!reason || !reason.trim()) {
        alert("Motif obligatoire pour cette action.");
        return;
      }
      bulkAuditReason = reason.trim();
    }

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
      alert(`✅ Actions appliquées à ${success} membre(s)`);
    } else {
      alert(`⚠️ ${success} succès, ${errors.length} erreur(s)\n${errors.slice(0, 10).join("\n")}`);
    }
  }

  // Helper pour rendre un en-tête de colonne triable
  const SortableHeader = ({ column, label }: { column: SortableColumn; label: string }) => (
    <th 
      className="text-left py-4 px-6 text-sm font-semibold text-gray-300 cursor-pointer hover:text-white transition-colors"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-2">
        {label}
        {sortColumn === column && (
          <span className="text-purple-400">
            {sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        )}
      </div>
    </th>
  );

  // Récupérer les dernières dates de live après le chargement initial
  useEffect(() => {
    if (members.length > 0 && !loading && !lastLiveDatesLoaded) {
      setLastLiveDatesLoaded(true);
      fetchLastLiveDates(members).then(updatedMembers => {
        // Ne mettre à jour que si les dates ont changé
        const hasNewDates = updatedMembers.some((m, i) => 
          m.lastLiveDate !== members[i]?.lastLiveDate
        );
        if (hasNewDates) {
          setMembers(updatedMembers);
        }
      });
    }
  }, [loading]); // Seulement quand le chargement change

  const handleToggleStatus = async (memberToUpdate: Member) => {
    if (!currentAdmin) {
      alert("Vous devez être connecté pour effectuer cette action");
      return;
    }

    if (!currentAdmin.canWrite) {
      alert("Permissions insuffisantes: vous n'avez pas le droit de modifier les membres.");
      return;
    }

    if (safeModeEnabled && !currentAdmin.isFounder) {
      alert("Action bloquée : Safe Mode activé. Seuls les fondateurs peuvent modifier les données.");
      return;
    }

    const member = members.find((m) => areSameMember(m, memberToUpdate)) ?? memberToUpdate;
    if (!member || !member.twitch) return;

    const oldStatus = member.statut;
    if (oldStatus === "Inactif" && member.role === "Communauté") {
      alert(
        "Ce membre est verrouillé en Inactif car il est au rôle Communauté. " +
          "Changez d'abord le rôle pour pouvoir le réactiver."
      );
      return;
    }
    const newStatus = oldStatus === "Actif" ? "Inactif" : "Actif";
    const reason = prompt("Motif obligatoire pour le changement de statut :");
    if (!reason || !reason.trim()) {
      alert("Motif obligatoire pour cette modification.");
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
    member.profileValidationStatus === "valide";

  const handleValidateCommunityPassage = async (memberToUpdate: Member) => {
    if (!currentAdmin) {
      alert("Vous devez être connecté pour effectuer cette action");
      return;
    }

    if (!currentAdmin.canWrite) {
      alert("Permissions insuffisantes: vous n'avez pas le droit de modifier les membres.");
      return;
    }

    if (safeModeEnabled && !currentAdmin.isFounder) {
      alert("Action bloquée : Safe Mode activé. Seuls les fondateurs peuvent modifier les données.");
      return;
    }

    const member = members.find((m) => areSameMember(m, memberToUpdate)) ?? memberToUpdate;
    if (!member || !member.twitch) return;

    if (!canValidateCommunityPassage(member)) {
      alert("Ce membre n'est pas éligible au passage Communauté.");
      return;
    }

    const reason = prompt("Motif obligatoire pour valider le passage en Communauté :");
    if (!reason || !reason.trim()) {
      alert("Motif obligatoire pour cette modification.");
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
      alert("Vous devez être connecté pour effectuer cette action");
      return;
    }

    if (!currentAdmin.canWrite) {
      alert("Permissions insuffisantes: vous n'avez pas le droit de modifier les membres.");
      return;
    }

    if (safeModeEnabled && !currentAdmin.isFounder) {
      alert("Action bloquée : Safe Mode activé. Seuls les fondateurs peuvent modifier les données.");
      return;
    }

    const member = members.find((m) => areSameMember(m, memberToUpdate)) ?? memberToUpdate;
    if (!member || !member.twitch) return;

    const reason = prompt(`Motif obligatoire pour attribuer le rôle ${targetRole} et activer le membre :`);
    if (!reason || !reason.trim()) {
      alert("Motif obligatoire pour cette modification.");
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
          integrationDate: new Date().toISOString(),
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
      alert("Vous n'avez pas la permission de modifier les membres.");
      return;
    }
    setSelectedMember(member);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedMember: {
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
    createdAt?: string;
    integrationDate?: string;
    birthday?: string;
    twitchAffiliateDate?: string;
    onboardingStatus?: "a_faire" | "en_cours" | "termine";
    mentorTwitchLogin?: string;
    primaryLanguage?: string;
    timezone?: string;
    countryCode?: string;
    lastReviewAt?: string;
    nextReviewAt?: string;
    parrain?: string;
    roleHistory?: Array<{
      fromRole: string;
      toRole: string;
      changedAt: string;
      changedBy: string;
      reason?: string;
    }>;
    roleChangeReason?: string;
  }) => {
    if (!currentAdmin?.canWrite) {
      alert("Vous n'avez pas la permission de modifier les membres.");
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
    };

    if (mergedMember.role === "Communauté" && mergedMember.statut !== "Inactif") {
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
          alert("Motif obligatoire pour cette modification.");
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
      alert("Membre modifié avec succès");
      // Recharger les membres depuis la base de données
      await loadMembers();
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
      alert(`Erreur : ${error instanceof Error ? error.message : "Erreur inconnue"}`);
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
  }) => {
    if (!currentAdmin?.isFounder && !hasAdvancedAccess) {
      alert("Accès refusé : droits insuffisants pour ajouter un membre");
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
      alert("Membre ajouté avec succès");
      // Recharger les membres depuis la base de données
      await loadMembers();
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
      alert(`Erreur : ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    }
  };

  const handleDelete = async (member: Member) => {
    if (!currentAdmin?.isFounder) {
      alert("Seuls les fondateurs peuvent supprimer des membres");
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
      setStatusTab("inactifs");
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
      alert("Seuls les fondateurs peuvent importer des membres");
      return;
    }

    // Les doublons ont déjà été filtrés dans le modal
    // On peut directement importer les membres reçus
    if (members.length === 0) {
      alert("Aucun membre à importer.");
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
    if (errorCount > 0) {
      message += `, ${errorCount} erreur(s)`;
    }
    if (successCount < members.length) {
      message += `\n${members.length - successCount - errorCount} membre(s) non importé(s)`;
    }
    alert(message);
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
    "px-3 py-1 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1 border hover:-translate-y-[1px]";
  const rowActionButtonBaseCompact =
    "px-2 py-1 rounded-lg text-[11px] font-semibold transition inline-flex items-center gap-1 whitespace-nowrap border hover:-translate-y-[1px]";
  const rowActionInfo = `${rowActionButtonBase} border-sky-300/35 bg-sky-500/15 text-sky-100 hover:bg-sky-500/25`;
  const rowActionPrimary = `${rowActionButtonBase} border-indigo-300/35 bg-indigo-500/18 text-indigo-100 hover:bg-indigo-500/28`;
  const rowActionEdit = `${rowActionButtonBase} border-violet-300/35 bg-violet-500/18 text-violet-100 hover:bg-violet-500/28`;
  const rowActionDanger = `${rowActionButtonBase} border-rose-300/35 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25`;
  const rowActionSuccess = `${rowActionButtonBase} border-emerald-300/35 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25`;
  const rowActionWarning = `${rowActionButtonBase} border-amber-300/35 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25`;
  const rowActionInfoCompact = `${rowActionButtonBaseCompact} border-sky-300/35 bg-sky-500/15 text-sky-100 hover:bg-sky-500/25`;
  const rowActionPrimaryCompact = `${rowActionButtonBaseCompact} border-indigo-300/35 bg-indigo-500/18 text-indigo-100 hover:bg-indigo-500/28`;
  const rowActionEditCompact = `${rowActionButtonBaseCompact} border-violet-300/35 bg-violet-500/18 text-violet-100 hover:bg-violet-500/28`;
  const rowActionDangerCompact = `${rowActionButtonBaseCompact} border-rose-300/35 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25`;
  const rowActionSuccessCompact = `${rowActionButtonBaseCompact} border-emerald-300/35 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25`;
  const rowActionWarningCompact = `${rowActionButtonBaseCompact} border-amber-300/35 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25`;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff] mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement des membres depuis la base centralisée...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white">
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
      <div className="p-4 md:p-6 xl:p-8">
        <section className={`${glassCardClass} mb-6 p-5 md:p-6`}>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-4xl">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-300">Admin panel · gestion membres</p>
              <h1 className="bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
                Gestion des Membres
              </h1>
              <p className="mt-2 text-sm text-slate-200">
                Cette page te permet de piloter l'ensemble du cycle membre: recherche et segmentation avancées, édition des profils,
                gestion des statuts (actif/inactif/archivé), onboarding, revue périodique, contrôle qualité des fiches et opérations bulk
                (imports, fusion, vérification Twitch/Discord, vues sauvegardées).
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                void loadMembers();
                void loadArchivedMembers();
              }}
              className={subtleButtonClass}
              title="Rafraîchir les données membres"
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
            <div className="rounded-xl border border-gray-700 bg-[#14151a] px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">Total</p>
              <p className="mt-1 text-xl font-semibold text-white">{members.length}</p>
            </div>
            <div className="rounded-xl border border-green-500/25 bg-green-500/10 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-green-200">Actifs</p>
              <p className="mt-1 text-xl font-semibold text-green-300">{totalActiveMembers}</p>
              {totalActiveNewRoleMembers > 0 ? (
                <p className="mt-1 text-[10px] leading-snug text-green-200/80">
                  {totalActiveMembersIntegrated} intégrés (onglet Actifs) ·{" "}
                  {totalActiveNewRoleMembers}{" "}
                  {totalActiveNewRoleMembers > 1 ? "nouveaux actifs (onglet Nouveaux)" : "nouveau actif (onglet Nouveaux)"}
                </p>
              ) : null}
            </div>
            <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-red-200">Suivi communauté</p>
              <p className="mt-1 text-xl font-semibold text-red-300">{totalInactiveMembers}</p>
            </div>
            <div className="rounded-xl border border-purple-500/25 bg-purple-500/10 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-purple-200">Nouveaux</p>
              <p className="mt-1 text-xl font-semibold text-purple-300">{totalNewMembers}</p>
            </div>
            <div className="rounded-xl border border-yellow-500/25 bg-yellow-500/10 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-yellow-200">Incomplets</p>
              <p className="mt-1 text-xl font-semibold text-yellow-300">{totalIncompleteMembers}</p>
            </div>
            <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-cyan-200">Sans ID Twitch</p>
              <p className="mt-1 text-xl font-semibold text-cyan-300">{totalWithoutTwitchId}</p>
            </div>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-3 xl:grid-cols-[1.35fr_1fr]">
          <article className={`${sectionCardClass} p-4`}>
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Fonctionnalités clés</p>
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 text-sm text-slate-200">
              <p className="rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2">Recherche multi-critères et filtres métier</p>
              <p className="rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2">Vues enregistrées pour workflows récurrents</p>
              <p className="rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2">Edition détaillée profil + actions rapides par ligne</p>
              <p className="rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2">Bulk update, import, fusion et vérifications massives</p>
            </div>
          </article>
          <article className={`${sectionCardClass} p-4`}>
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Repères opérationnels</p>
            <div className="mt-2 space-y-2 text-sm">
              <p className="rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2 text-slate-200">
                Active les filtres avancés pour les revues hebdo.
              </p>
              <p className="rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2 text-slate-200">
                Sauvegarde tes segments de suivi par équipe.
              </p>
              <p className="rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2 text-slate-200">
                Vérifie les IDs Twitch/Discord avant actions bulk.
              </p>
            </div>
          </article>
        </section>

        {/* Barre de recherche et actions */}
        <div className="mb-6 sticky top-3 z-20 rounded-2xl border border-[#2f3244] bg-[#0f1118]/95 p-4 backdrop-blur">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Rechercher un membre (pseudo, role, bio, jeu...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-[240px] rounded-lg border border-[#353a50] bg-[#121623]/85 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-300/55"
              />
              <select
                value={presetFilter}
                onChange={(e) => setPresetFilter(e.target.value as PresetFilter)}
                className="rounded-lg border border-[#353a50] bg-[#121623]/85 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-300/55"
                title="Filtre métier rapide"
              >
                <option value="all">Tous</option>
                <option value="nouveaux">Nouveaux (&lt; 30 jours)</option>
                <option value="incomplets">Incomplets</option>
                <option value="sans_twitch_id">Sans ID Twitch</option>
                <option value="sans_integration">Sans intégration</option>
                <option value="integration_session_alignee">Date intégration = session planifiée</option>
                <option value="vip">VIP</option>
                <option value="inactifs">Inactifs</option>
                <option value="revue_due">Revue due</option>
              </select>
              <button
                type="button"
                onClick={() => setShowAdvancedFilters((prev) => !prev)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  showAdvancedFilters
                    ? "bg-indigo-500/20 border-indigo-300/45 text-indigo-100"
                    : "bg-[#121623]/85 border-[#353a50] text-gray-300 hover:text-white"
                }`}
                title="Afficher/Masquer les filtres avancés"
              >
                Filtres avancés
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedSavedViewId}
                onChange={(e) => applySavedView(e.target.value)}
                className="rounded-lg border border-[#353a50] bg-[#121623]/85 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-300/55"
                title="Vues enregistrées"
              >
                <option value="">Vues enregistrées</option>
                {savedViews.map((view) => (
                  <option key={view.id} value={view.id}>
                    {view.name}
                  </option>
                ))}
              </select>
              <button
                onClick={saveCurrentView}
                className="border border-indigo-300/35 bg-indigo-500/18 px-3 py-2 text-sm font-semibold text-indigo-100 rounded-lg transition hover:bg-indigo-500/28"
                title="Enregistrer la vue actuelle"
              >
                Sauver vue
              </button>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setPresetFilter("all");
                  setRoleFilter("all");
                  setMemberStatusFilter("all");
                  setJoinedAfterFilter("");
                  setJoinedBeforeFilter("");
                  setSelectedSavedViewId("");
                  pushNotice("info", "Filtres réinitialisés");
                }}
                className="border border-[#353a50] bg-[#121623]/85 px-3 py-2 text-sm font-semibold text-slate-100 rounded-lg transition hover:bg-[#1a2132]"
                title="Réinitialiser recherche et filtres"
              >
                Reset filtres
              </button>
              {selectedSavedViewId && (
                <button
                  onClick={() => deleteSavedView(selectedSavedViewId)}
                  className="border border-rose-300/35 bg-rose-500/15 px-3 py-2 text-sm font-semibold text-rose-100 rounded-lg transition hover:bg-rose-500/24"
                  title="Supprimer la vue sélectionnée"
                >
                  Suppr vue
                </button>
              )}
            </div>

            {showAdvancedFilters && (
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as "all" | MemberRole)}
                  className="rounded-lg border border-[#353a50] bg-[#121623]/85 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-300/55"
                  title="Filtrer par rôle"
                >
                  <option value="all">Tous les rôles</option>
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {getRoleBadgeLabel(role)}
                    </option>
                  ))}
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

            <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/membres/postulations"
              className="bg-indigo-500/12 hover:bg-indigo-500/20 border border-indigo-400/35 text-indigo-200 font-semibold px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Postulations staff
            </Link>
            {(currentAdmin?.isFounder || hasAdvancedAccess) && (
              <>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-violet-500/14 hover:bg-violet-500/24 border border-violet-400/40 text-violet-200 font-semibold px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une chaîne
                </button>
                <button
                  onClick={() => setIsBulkImportOpen(true)}
                  className="bg-emerald-500/14 hover:bg-emerald-500/24 border border-emerald-400/35 text-emerald-200 font-semibold px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Import en masse
                </button>
                <button
                  onClick={() => setIsVerifyListOpen(true)}
                  className="bg-sky-500/14 hover:bg-sky-500/24 border border-sky-400/35 text-sky-200 font-semibold px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
                  title="Vérifier une liste sans modifier la base"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Verif liste
                </button>
              </>
            )}
            <div
              className="inline-flex items-center rounded-lg border border-gray-700 bg-[#151821] p-1"
              role="group"
              aria-label="Choix du mode de vue"
            >
              <button
                type="button"
                onClick={() => setViewMode("simple")}
                className={`min-w-[118px] px-3 py-1.5 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                  viewMode === "simple"
                    ? "bg-sky-500/16 border border-sky-400/30 text-sky-200"
                    : "border border-transparent text-gray-300 hover:bg-[#1b2030]"
                }`}
                aria-pressed={viewMode === "simple"}
              >
                <Eye className="w-4 h-4" />
                Vue simple
              </button>
              <button
                type="button"
                onClick={() => setViewMode("complet")}
                className={`min-w-[118px] px-3 py-1.5 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                  viewMode === "complet"
                    ? "bg-violet-500/16 border border-violet-400/35 text-violet-200"
                    : "border border-transparent text-gray-300 hover:bg-[#1b2030]"
                }`}
                aria-pressed={viewMode === "complet"}
              >
                <LayoutGrid className="w-4 h-4" />
                Vue complète
              </button>
            </div>

            {/* Bouton d'export des modifications manuelles (pour les fondateurs) */}
            {currentAdmin?.isFounder && (
              <button
                onClick={async () => {
                  try {
                    const response = await fetch("/api/admin/members/export-manual", {
                      cache: 'no-store',
                      headers: {
                        'Cache-Control': 'no-cache',
                      },
                    });
                    const data = await response.json();
                    if (data.success) {
                      // Télécharger le fichier JSON
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `manual-changes-export-${new Date().toISOString().split('T')[0]}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      
                      alert(
                        `Export terminé !\n\n` +
                        `Total: ${data.totalManualChanges} membre(s)\n` +
                        `Fichier téléchargé: ${a.download}`
                      );
                    } else {
                      alert(`Erreur: ${data.error || "Erreur inconnue"}`);
                    }
                  } catch (error) {
                    console.error("Erreur lors de l'export:", error);
                    alert(`Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
                  }
                }}
                className="bg-emerald-500/14 hover:bg-emerald-500/24 border border-emerald-400/35 text-emerald-200 font-semibold px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
                title="Exporter les modifications manuelles dans un fichier JSON"
              >
                <Download className="w-4 h-4" />
                Exporter Modifications
              </button>
            )}

            {/* Bouton de vérification des noms de chaînes Twitch (pour les fondateurs) */}
            {currentAdmin?.isFounder && (
              <button
                onClick={() => setShowVerifyTwitchNamesModal(true)}
                className="bg-sky-500/14 hover:bg-sky-500/24 border border-sky-400/35 text-sky-200 font-semibold px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
                title="Vérifier les noms de chaînes Twitch via leur ID pour détecter les changements de pseudo"
              >
                <CheckCircle2 className="w-4 h-4" />
                Vérifier noms Twitch
              </button>
            )}

            {currentAdmin?.isFounder && (
              <button
                onClick={() => {
                  setShowVerifyDiscordNamesModal(true);
                  setVerifyDiscordError("");
                  setVerifyDiscordInfo("");
                  setVerifyDiscordResultsByLogin({});
                }}
                disabled={syncingDiscordNames}
                className="bg-blue-500/14 hover:bg-blue-500/24 border border-blue-400/35 text-blue-200 font-semibold px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                title="Vérifier et synchroniser les noms Discord via les IDs Discord"
              >
                <RefreshCw className={`w-4 h-4 ${syncingDiscordNames ? "animate-spin" : ""}`} />
                {syncingDiscordNames ? "Vérification Discord..." : "Vérifier noms Discord"}
              </button>
            )}

            {currentAdmin?.isFounder && (
              <>
                <button
                  onClick={() => {
                    window.location.href = "/admin/fusion-doublons";
                  }}
                  className="bg-amber-500/14 hover:bg-amber-500/24 border border-amber-400/35 text-amber-200 font-semibold px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Gérer les doublons
                </button>
                <button
                  onClick={async () => {
                    // 1. Analyser les doublons discord_
                    const analyzeResponse = await fetch("/api/admin/members/cleanup-discord-duplicates");
                    if (!analyzeResponse.ok) {
                      alert(`Erreur analyse: ${analyzeResponse.status}`);
                      return;
                    }
                    const analyzeData = await analyzeResponse.json();
                    if (!analyzeData.success || analyzeData.total === 0) {
                      alert("Aucun doublon discord_ trouvé.");
                      return;
                    }

                    const withDup = analyzeData.withRealDuplicate;
                    const orphans = analyzeData.orphans;
                    const total = analyzeData.total;

                    const details = analyzeData.duplicates
                      .slice(0, 15)
                      .map((d: any) => `  ${d.displayName} (${d.discordLogin})${d.hasRealMember ? ` → vrai: ${d.realMemberLogin}` : ' [orphelin]'}`)
                      .join('\n');

                    const msg = `${total} entrée(s) discord_ trouvée(s):\n` +
                      `- ${withDup} avec un vrai doublon (suppression sûre)\n` +
                      `- ${orphans} orphelin(s)\n\n` +
                      `Exemples:\n${details}` +
                      (analyzeData.duplicates.length > 15 ? `\n  ... et ${analyzeData.duplicates.length - 15} autre(s)` : '') +
                      `\n\nVoulez-vous supprimer TOUTES les ${total} entrées discord_ ?`;

                    if (!confirm(msg)) return;

                    // 2. Supprimer
                    const deleteResponse = await fetch("/api/admin/members/cleanup-discord-duplicates", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ deleteOrphans: true }),
                    });
                    const deleteData = await deleteResponse.json();
                    if (deleteResponse.ok && deleteData.success) {
                      alert(`${deleteData.message}`);
                      await loadMembers();
                    } else {
                      alert(`Erreur: ${deleteData.error || "Erreur inconnue"}`);
                    }
                  }}
                  className="bg-orange-500/14 hover:bg-orange-500/24 border border-orange-400/35 text-orange-200 font-semibold px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
                  title="Supprimer les membres avec twitchLogin discord_XXXX (doublons du bot)"
                >
                  <XCircle className="w-4 h-4" />
                  Nettoyer doublons discord_
                </button>
                <button
                  onClick={async () => {
                    if (!confirm("Voulez-vous sauvegarder toutes les données des membres de façon durable ?")) {
                      return;
                    }
                    try {
                      const response = await fetch("/api/admin/members/save-durable", {
                        method: "POST",
                      });
                      const data = await response.json();
                      if (data.success) {
                        alert(
                          `Sauvegarde réussie !\n\n` +
                          `Total: ${data.stats.total} membres\n` +
                          `Avec Discord: ${data.stats.withDiscord}\n` +
                          `Modifications manuelles: ${data.stats.withManualChanges}\n` +
                          `Avec description: ${data.stats.withDescription}\n\n` +
                          `Fichier: ${data.membersFile}\n` +
                          `Sauvegarde: ${data.backupFile}`
                        );
                      } else {
                        alert(`Erreur: ${data.error || "Erreur inconnue"}`);
                      }
                    } catch (error) {
                      console.error("Erreur lors de la sauvegarde:", error);
                      alert(`Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
                    }
                  }}
                  className="bg-emerald-500/14 hover:bg-emerald-500/24 border border-emerald-400/35 text-emerald-200 font-semibold px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Sauvegarder données
                </button>
              </>
            )}
          </div>
          </div>
        </div>
        <div className="mb-6 rounded-xl border border-gray-800 bg-[#111218] px-3 py-3 flex flex-wrap items-center gap-2 text-xs text-gray-300">
          <span className="rounded-full border border-gray-700 bg-[#1a1a1d] px-3 py-1">
            {displayedMembers.length} résultat{displayedMembers.length > 1 ? "s" : ""} ({activeTabLabel})
          </span>
          {isSearching && (
            <span className="rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-1 text-purple-200">
              Recherche: "{searchQuery.trim()}"
            </span>
          )}
          {presetFilter !== "all" && (
            <span className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-indigo-200">
              Filtre métier actif : {getPresetFilterDisplayLabel(presetFilter)}
            </span>
          )}
          {roleFilter !== "all" && (
            <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-cyan-200">
              Rôle: {getRoleBadgeLabel(roleFilter)}
            </span>
          )}
          {memberStatusFilter !== "all" && (
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-emerald-200">
              Statut: {memberStatusFilter}
            </span>
          )}
          {joinedAfterFilter && (
            <span className="rounded-full border border-slate-500/40 bg-slate-500/10 px-3 py-1 text-slate-200">
              Depuis: {joinedAfterFilter}
            </span>
          )}
          {joinedBeforeFilter && (
            <span className="rounded-full border border-slate-500/40 bg-slate-500/10 px-3 py-1 text-slate-200">
              Jusqu&apos;au: {joinedBeforeFilter}
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
                <option value="Affilié">Affilié</option>
                <option value="Développement">Développement</option>
                <option value="Modérateur">Modérateur</option>
                <option value="Modérateur en formation">Modérateur en formation</option>
                <option value="Modérateur en activité réduite">Modérateur en activité réduite</option>
                <option value="Modérateur en pause">Modérateur en pause</option>
                <option value="Admin">Admin</option>
                <option value="Admin Coordinateur">Admin Coordinateur</option>
                <option value="Créateur Junior">Créateur Junior</option>
                <option value="Les P'tits Jeunes">Les P&apos;tits Jeunes</option>
                <option value="Soutien TENF">Soutien TENF</option>
                <option value="Contributeur TENF du Mois">Contributeur TENF du Mois</option>
                <option value="Communauté">Communauté</option>
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

        {/* Onglets Actifs/Suivi communauté/Nouveaux */}
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-gray-800 bg-[#111218] p-2">
          <button
            type="button"
            onClick={() => setStatusTab("actifs")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              statusTab === "actifs"
                ? "bg-green-600/90 text-white border border-green-400/40"
                : "bg-[#1a1a1d] border border-gray-700 text-gray-300 hover:text-white"
            }`}
          >
            Actifs ({activeMembers.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusTab("inactifs")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              statusTab === "inactifs"
                ? "bg-red-600/90 text-white border border-red-400/40"
                : "bg-[#1a1a1d] border border-gray-700 text-gray-300 hover:text-white"
            }`}
          >
            Suivi communauté ({communityFollowupMembers.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusTab("nouveaux")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              statusTab === "nouveaux"
                ? "bg-purple-600/90 text-white border border-purple-400/40"
                : "bg-[#1a1a1d] border border-gray-700 text-gray-300 hover:text-white"
            }`}
          >
            Nouveaux ({newMembers.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusTab("archives")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              statusTab === "archives"
                ? "bg-slate-600/90 text-white border border-slate-400/40"
                : "bg-[#1a1a1d] border border-gray-700 text-gray-300 hover:text-white"
            }`}
          >
            Archivé ({totalArchivedMembers})
          </button>
        </div>

        {/* Tableau des membres */}
        <div className={`${sectionCardClass} overflow-hidden`}>
          <div className="border-b border-[#353a50]/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-[#121623]/95">
            <div className="space-y-1">
              <p className="text-sm text-slate-300">
                Affichage <span className="font-semibold text-white">{startItem}</span>-<span className="font-semibold text-white">{endItem}</span> sur{" "}
                <span className="font-semibold text-white">{displayedMembers.length}</span>
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
          <div className="overflow-x-auto">
            <table
              className={
                viewMode === "complet"
                  ? "w-full min-w-[1540px]"
                  : "w-full"
              }
            >
              <thead className="sticky top-0 z-10 bg-[#111421]">
                <tr className="border-b border-[#353a50]">
                  {currentAdmin?.isFounder && (
                    <th className="py-4 px-3 text-sm font-semibold text-slate-300">
                      <input
                        type="checkbox"
                        checked={displayedMembers.length > 0 && displayedMembers.every((m) => selectedMemberLogins.includes(m.twitch))}
                        onChange={(e) => toggleSelectAllFiltered(e.target.checked)}
                      />
                    </th>
                  )}
                  <SortableHeader column="nom" label="CRÉATEUR" />
                  {viewMode === "complet" && (
                    <>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Pseudo Site</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">ID Discord</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">ID Twitch</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Onboarding</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Mentor</th>
                    </>
                  )}
                  <SortableHeader column="role" label="RÔLE" />
                  <SortableHeader column="statut" label="STATUT" />
                  <SortableHeader column="createdAt" label={statusTab === "archives" ? "DATE SUPPR." : "MEMBRE DEPUIS"} />
                  <SortableHeader column="integrationDate" label="INTÉGRATION" />
                  <SortableHeader column="completude" label="COMPLÉTUDE" />
                  {viewMode === "complet" && (
                    <>
                      <SortableHeader column="parrain" label="PARRAIN" />
                      <SortableHeader column="lastLive" label="DERNIER LIVE" />
                      <SortableHeader column="raidsDone" label="Raids TENF faits" />
                      <SortableHeader column="raidsReceived" label="Raids reçus" />
                    </>
                  )}
                  {viewMode === "complet" && (
                    <>
                      <SortableHeader column="isVip" label="VIP" />
                      <SortableHeader column="isLive" label="Live" />
                    </>
                  )}
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMembers.map((member, rowIndex) => (
                  <tr
                    key={getMemberStableKey(member)}
                    className={`border-b border-[#2f354a]/80 hover:bg-[#1a2132] transition-colors ${rowIndex % 2 === 0 ? "bg-transparent" : "bg-[#131824]"}`}
                  >
                    {currentAdmin?.isFounder && (
                      <td className="py-4 px-3">
                        <input
                          type="checkbox"
                          checked={selectedMemberLogins.includes(member.twitch)}
                          onChange={(e) => toggleMemberSelection(member.twitch, e.target.checked)}
                        />
                      </td>
                    )}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={member.avatar}
                          alt={member.nom}
                          className="w-11 h-11 rounded-full object-cover ring-1 ring-white/10"
                        />
                        <div>
                          <div className="text-white font-medium">{member.nom}</div>
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
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!confirm(`Voulez-vous synchroniser l'ID Twitch pour ${member.twitch} ?`)) {
                                    return;
                                  }
                                  try {
                                    const response = await fetch('/api/admin/members/sync-twitch-id', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ twitchLogin: member.twitch }),
                                    });
                                    const data = await response.json();
                                    if (response.ok && data.success) {
                                      alert(`ID Twitch synchronisé avec succès${data.results?.[0]?.twitchId ? `: ${data.results[0].twitchId}` : ''}`);
                                      window.location.reload();
                                    } else {
                                      alert(`ÔØî Erreur: ${data.error || 'Impossible de synchroniser l\'ID Twitch'}`);
                                    }
                                  } catch (error) {
                                    console.error('Erreur sync Twitch ID:', error);
                                    alert('ÔØî Erreur lors de la synchronisation');
                                  }
                                }}
                                className="text-xs text-indigo-300 hover:text-indigo-200 underline ml-1 inline-flex items-center gap-1"
                                title="Synchroniser l'ID Twitch"
                              >
                                <RefreshCw className="w-3 h-3" />
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
                        return (
                          <span
                            title={title}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${colorClass}`}
                          >
                            {completeness.percent}%
                          </span>
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
                        const isCommunityLocked = member.statut === "Inactif" && member.role === "Communauté";
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
                          className={actionPrimaryClass}
                          title="Voir la fiche membre"
                        >
                          {isCompactView ? "Fiche" : "👁️ Fiche"}
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
                                  ? "Rôle Communauté: changez d'abord le rôle pour réactiver"
                                  : undefined
                              }
                            >
                              {member.statut === "Actif"
                                ? (isCompactView ? "OFF" : "Désactiver")
                                : isCommunityLocked
                                ? (isCompactView ? "ON 🔒" : "Activer (rôle verrouillé)")
                                : (isCompactView ? "ON" : "Activer")}
                            </button>
                            {statusTab !== "nouveaux" && canValidateCommunity && currentAdmin?.canWrite && (
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
                ))}
                {displayedMembers.length === 0 && (
                  <tr>
                    <td
                      colSpan={tableColumnCount}
                      className="py-8 px-6 text-center text-gray-400"
                    >
                      {isSearching
                        ? "Aucun membre ne correspond à cette recherche."
                        : `Aucun membre ${
                            statusTab === "actifs"
                              ? "actif"
                              : statusTab === "inactifs"
                              ? "du suivi communauté"
                              : statusTab === "nouveaux"
                              ? "nouveau"
                              : "archivé"
                          } avec les filtres actuels.`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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

        {/* Modal d'ajout (pour les fondateurs) */}
        {currentAdmin?.isFounder && (
          <>
            <AddChannelModal
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              onAdd={handleAdd}
            />
            <BulkImportModal
              isOpen={isBulkImportOpen}
              onClose={() => setIsBulkImportOpen(false)}
              onImport={handleBulkImport}
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
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => {
              if (!syncingDiscordNames) setShowVerifyDiscordNamesModal(false);
            }}
          >
            <div
              className="bg-[#1a1a1d] border border-gray-700 rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-700">
                <div>
                  <h3 className="text-xl font-bold text-white">Vérification des pseudos Discord</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Interroge Discord via chaque ID, synchronise les pseudos différents, puis affiche le résultat détaillé.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVerifyDiscordNamesModal(false)}
                  disabled={syncingDiscordNames}
                  className="text-gray-400 hover:text-white disabled:opacity-50"
                >
                  Fermer
                </button>
              </div>

              <div className="p-5 border-b border-gray-700 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleVerifyDiscordNames()}
                  disabled={syncingDiscordNames}
                  className="bg-blue-500/14 hover:bg-blue-500/24 border border-blue-400/35 text-blue-200 font-semibold px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${syncingDiscordNames ? "animate-spin" : ""}`} />
                  {syncingDiscordNames ? "Vérification en cours..." : "Lancer la vérification"}
                </button>
                <span className="text-xs text-gray-400">
                  Traitement progressif par lots (20 membres), comme la page Donnée Discord.
                </span>
              </div>

              <div className="p-5 space-y-3">
                {verifyDiscordError ? (
                  <div className="rounded-lg border border-red-500/40 bg-red-900/20 px-3 py-2 text-sm text-red-200">
                    {verifyDiscordError}
                  </div>
                ) : null}
                {verifyDiscordInfo ? (
                  <div className="rounded-lg border border-emerald-500/40 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-200">
                    {verifyDiscordInfo}
                  </div>
                ) : null}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-gray-700 bg-[#0e0e10] px-3 py-2 text-sm text-gray-200">
                    Résultats chargés: <strong>{verifyDiscordRows.length}</strong>
                  </div>
                  <div className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                    Pseudos changés: <strong>{verifyDiscordUpdatedRows.length}</strong>
                  </div>
                  <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                    Non modifiés / autres: <strong>{Math.max(0, verifyDiscordRows.length - verifyDiscordUpdatedRows.length)}</strong>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 overflow-y-auto space-y-4">
                {verifyDiscordUpdatedRows.length > 0 ? (
                  <div className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 p-3">
                    <p className="text-sm font-semibold text-emerald-200 mb-2">Pseudos Discord mis à jour</p>
                    <div className="space-y-2">
                      {verifyDiscordUpdatedRows.map((row) => (
                        <div key={`updated-${row.twitchLogin}`} className="text-xs text-emerald-100">
                          <span className="font-semibold">{row.displayName}</span> ({row.twitchLogin}) • ID: {row.discordId} •{" "}
                          {row.storedDiscordUsername || "vide"} → {row.fetchedDiscordUsername || "introuvable"}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="rounded-lg border border-gray-700 bg-[#0e0e10] p-3">
                  <p className="text-sm font-semibold text-gray-200 mb-2">Détail complet</p>
                  {verifyDiscordRows.length === 0 ? (
                    <p className="text-xs text-gray-400">Lance la vérification pour voir les résultats membre par membre.</p>
                  ) : (
                    <div className="space-y-2">
                      {verifyDiscordRows.map((row) => (
                        <div key={`${row.twitchLogin}-${row.discordId}`} className="rounded border border-gray-700 bg-[#141418] p-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-white">
                              {row.displayName} <span className="text-gray-400">({row.twitchLogin})</span>
                            </p>
                            <span className="text-[11px] rounded-full border border-gray-600 px-2 py-0.5 text-gray-300">
                              {row.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-1">
                            ID Discord: {row.discordId} • Base: {row.storedDiscordUsername || "vide"} • Discord:{" "}
                            {row.fetchedDiscordUsername || "introuvable"}
                            {row.error ? ` • ${row.error}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
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
                  alert(
                    `Fusion réussie !\n\n` +
                    `Membre principal: ${data.primaryMember}\n` +
                    `Membres fusionnés: ${data.deletedMembers.join(", ")}`
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
                  alert(`Erreur: ${data.error || "Erreur inconnue"}`);
                }
              } catch (error) {
                console.error("Erreur lors de la fusion:", error);
                alert(`Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
              } finally {
                setMergeLoading(false);
              }
            }}
            loading={mergeLoading}
          />
        )}
      </div>
    </div>
  );
}
