"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Upload, LayoutGrid, Eye, Download, RefreshCw, Copy, Save, Users, ChevronUp, ChevronDown, AlertCircle, CheckCircle2, XCircle, History } from "lucide-react";
import MemberBadges from "@/components/admin/MemberBadges";
import AddChannelModal from "@/components/admin/AddChannelModal";
import EditMemberModal from "@/components/admin/EditMemberModal";
import BulkImportModal from "@/components/admin/BulkImportModal";
import DiscordSyncModal from "@/components/admin/DiscordSyncModal";
import MergeMemberModal from "@/components/admin/MergeMemberModal";
import MemberHistoryModal from "@/components/admin/MemberHistoryModal";
import VerifyTwitchNamesModal from "@/components/admin/VerifyTwitchNamesModal";
// logAction est maintenant appelé via l'API /api/admin/log
import { getDiscordUser } from "@/lib/discord";
import { isFounder } from "@/lib/admin";
import { getRoleBadgeClasses } from "@/lib/roleColors";
import { toCanonicalMemberRole } from "@/lib/memberRoles";

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
}


export default function GestionMembresPage() {
  const searchParams = useSearchParams();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<{
    id: string;
    username: string;
    isFounder: boolean;
    canWrite: boolean;
  } | null>(null);
  const [safeModeEnabled, setSafeModeEnabled] = useState(false);
  const [viewMode, setViewMode] = useState<"simple" | "complet">("simple");
  type SortableColumn = "nom" | "role" | "statut" | "createdAt" | "integrationDate" | "parrain" | "lastLive" | "raidsDone" | "raidsReceived" | "isVip" | "isLive" | "completude";
  type PresetFilter = "all" | "nouveaux" | "incomplets" | "sans_twitch_id" | "sans_integration" | "vip" | "inactifs" | "revue_due";
  const [presetFilter, setPresetFilter] = useState<PresetFilter>("all");
  const [savedViews, setSavedViews] = useState<Array<{
    id: string;
    name: string;
    searchQuery: string;
    viewMode: "simple" | "complet";
    sortColumn: SortableColumn | null;
    sortDirection: "asc" | "desc";
    presetFilter: PresetFilter;
  }>>([]);
  const [selectedSavedViewId, setSelectedSavedViewId] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<SortableColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [lastLiveDatesLoaded, setLastLiveDatesLoaded] = useState(false);
  const [showDiscordSyncModal, setShowDiscordSyncModal] = useState(false);
  const [discordSyncMembers, setDiscordSyncMembers] = useState<any[]>([]);
  const [discordSyncLoading, setDiscordSyncLoading] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [membersToMerge, setMembersToMerge] = useState<any[]>([]);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [duplicates, setDuplicates] = useState<Array<{ key: string; type: string; members: any[] }>>([]);
  const [currentDuplicateIndex, setCurrentDuplicateIndex] = useState(0);
  const [showMemberHistory, setShowMemberHistory] = useState(false);
  const [showVerifyTwitchNamesModal, setShowVerifyTwitchNamesModal] = useState(false);
  const [selectedMemberLogins, setSelectedMemberLogins] = useState<string[]>([]);
  const [bulkRole, setBulkRole] = useState<MemberRole | "">("");
  const [bulkStatus, setBulkStatus] = useState<"" | "Actif" | "Inactif">("");
  const [bulkOnboarding, setBulkOnboarding] = useState<"" | "a_faire" | "en_cours" | "termine">("");
  const [bulkNextReviewDate, setBulkNextReviewDate] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [statusTab, setStatusTab] = useState<"actifs" | "inactifs" | "nouveaux">("actifs");

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

  function saveViewsToStorage(views: typeof savedViews) {
    setSavedViews(views);
    try {
      localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(views));
    } catch (error) {
      console.warn("Impossible de sauvegarder les vues:", error);
    }
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

  // Charger les membres depuis la base de données centralisée
  async function loadMembers() {
    try {
      setLoading(true);
      setLastLiveDatesLoaded(false); // Réinitialiser le flag pour recharger les dates
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
          
          const mappedMembers: Member[] = allMembers.map((member: any, index: number) => {
            const avatar = member.avatar || `https://placehold.co/64x64?text=${(member.displayName || member.twitchLogin).charAt(0).toUpperCase()}`;
            
            return {
              id: index + 1,
              avatar,
              nom: member.displayName || member.twitchLogin,
              role: member.role || "Affilié",
              statut: member.isActive ? "Actif" : "Inactif" as MemberStatus,
              discord: member.discordUsername || "",
              discordId: member.discordId,
              twitch: member.twitchLogin || "",
              twitchUrl: member.twitchUrl || `https://www.twitch.tv/${member.twitchLogin}`,
              twitchId: member.twitchId, // Ajouter l'ID Twitch
              siteUsername: member.siteUsername,
              description: member.description,
              customBio: member.customBio,
              twitchStatus: member.twitchStatus,
              badges: member.badges || [],
              isVip: member.isVip || false,
              shadowbanLives: member.shadowbanLives || false,
              isModeratorJunior: member.badges?.includes("Modérateur en formation") || member.badges?.includes("Modérateur Junior") || false,
              isModeratorMentor: member.badges?.includes("Modérateur") || member.badges?.includes("Modérateur Mentor") || false,
              raidsDone: 0,
              raidsReceived: 0,
              createdAt: member.createdAt ? (typeof member.createdAt === 'string' ? member.createdAt : new Date(member.createdAt).toISOString()) : undefined,
              integrationDate: member.integrationDate ? (typeof member.integrationDate === 'string' ? member.integrationDate : new Date(member.integrationDate).toISOString()) : undefined,
              birthday: member.birthday ? (typeof member.birthday === 'string' ? member.birthday : new Date(member.birthday).toISOString()) : undefined,
              twitchAffiliateDate: member.twitchAffiliateDate ? (typeof member.twitchAffiliateDate === 'string' ? member.twitchAffiliateDate : new Date(member.twitchAffiliateDate).toISOString()) : undefined,
              onboardingStatus: member.onboardingStatus,
              mentorTwitchLogin: member.mentorTwitchLogin,
              primaryLanguage: member.primaryLanguage,
              timezone: member.timezone,
              countryCode: member.countryCode,
              lastReviewAt: member.lastReviewAt ? (typeof member.lastReviewAt === 'string' ? member.lastReviewAt : new Date(member.lastReviewAt).toISOString()) : undefined,
              nextReviewAt: member.nextReviewAt ? (typeof member.nextReviewAt === 'string' ? member.nextReviewAt : new Date(member.nextReviewAt).toISOString()) : undefined,
              roleHistory: member.roleHistory || [],
              parrain: member.parrain,
              profileValidationStatus: member.profileValidationStatus,
            };
          });
          
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
      setLoading(false);
    }
  }

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
        
        // Avatar : priorité centralMember.avatar (Twitch), sinon discordMember.avatar (Discord)
        let avatar = centralMember?.avatar || discordMember.avatar;
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
      .normalize("NFD") // Décompose les caractères accentués
      .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
      .replace(/\s+/g, " ") // Remplace les espaces multiples par un seul
      .trim(); // Supprime les espaces en début/fin
  }

  // Filtrer les membres avec recherche multi-champs améliorée
  let filteredMembers = members;
  
  if (searchQuery.trim().length > 0) {
    const normalizedQuery = normalize(searchQuery);
    
    filteredMembers = members.filter((member) => {
      // Recherche dans tous les champs avec normalisation
      const normalizedNom = normalize(member.nom);
      const normalizedTwitch = normalize(member.twitch);
      const normalizedDiscord = normalize(member.discord);
      const normalizedSiteUsername = normalize(member.siteUsername);
      const normalizedDiscordId = member.discordId || "";
      
      // Correspondance partielle insensible à la casse et aux accents
      return (
        normalizedNom.includes(normalizedQuery) ||
        normalizedTwitch.includes(normalizedQuery) ||
        normalizedDiscord.includes(normalizedQuery) ||
        normalizedSiteUsername.includes(normalizedQuery) ||
        // Recherche exacte sur l'ID Discord (sans normalisation pour garder la précision)
        (normalizedDiscordId && normalizedDiscordId.toLowerCase().includes(searchQuery.toLowerCase()))
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
  const activeMembers = filteredMembers.filter((member) => member.statut === "Actif" && member.role !== "Nouveau");
  const inactiveMembers = filteredMembers.filter((member) => member.statut === "Inactif" && member.role !== "Nouveau");
  const displayedMembers = statusTab === "actifs" ? activeMembers : statusTab === "inactifs" ? inactiveMembers : newMembers;
  const tableColumnCount =
    viewMode === "complet"
      ? currentAdmin?.isFounder
        ? 19
        : 18
      : currentAdmin?.isFounder
      ? 12
      : 11;

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

  const handleToggleStatus = async (memberId: number) => {
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

    const member = members.find((m) => m.id === memberId);
    if (!member || !member.twitch) return;

    const oldStatus = member.statut;
    const newStatus = oldStatus === "Actif" ? "Inactif" : "Actif";

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
    } catch (error) {
      console.error("Erreur lors de la modification du statut:", error);
      alert(`Erreur : ${error instanceof Error ? error.message : "Erreur inconnue"}`);
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

    const oldMember = members.find((m) => m.id === updatedMember.id);
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

    try {
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
    if (!currentAdmin?.isFounder) {
      alert("Seuls les fondateurs peuvent ajouter des membres");
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

    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement ${member.nom} ? Cette action est irréversible.`)) {
      return;
    }

    try {
        const response = await fetch(`/api/admin/members?twitchLogin=${encodeURIComponent(member.twitch)}`, {
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

      alert("Membre supprimé avec succès");
      // Recharger les membres depuis la base de données
      await loadMembers();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert(`Erreur : ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    }
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
      <div className="p-8">
        <h1 className="text-4xl font-bold text-white mb-8">Gestion des Membres</h1>

        {/* Barre de recherche et actions */}
        <div className="mb-6 flex items-center gap-4 flex-wrap">
          <input
            type="text"
            placeholder="Rechercher un membre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 max-w-md bg-[#1a1a1d] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
          <select
            value={presetFilter}
            onChange={(e) => setPresetFilter(e.target.value as PresetFilter)}
            className="bg-[#1a1a1d] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            title="Filtre métier rapide"
          >
            <option value="all">Tous</option>
            <option value="nouveaux">Nouveaux (&lt; 30 jours)</option>
            <option value="incomplets">Incomplets</option>
            <option value="sans_twitch_id">Sans ID Twitch</option>
            <option value="sans_integration">Sans intégration</option>
            <option value="vip">VIP</option>
            <option value="inactifs">Inactifs</option>
            <option value="revue_due">Revue due</option>
          </select>
          <select
            value={selectedSavedViewId}
            onChange={(e) => applySavedView(e.target.value)}
            className="bg-[#1a1a1d] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
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
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-2 rounded-lg transition-colors text-sm"
            title="Enregistrer la vue actuelle"
          >
            Sauver vue
          </button>
          {selectedSavedViewId && (
            <button
              onClick={() => deleteSavedView(selectedSavedViewId)}
              className="bg-red-600/20 hover:bg-red-600/30 text-red-300 font-semibold px-3 py-2 rounded-lg transition-colors text-sm"
              title="Supprimer la vue sélectionnée"
            >
              Suppr vue
            </button>
          )}
          
          <div className="flex gap-2">
            <Link
              href="/admin/membres/postulations"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Postulations staff
            </Link>
            {currentAdmin?.isFounder && (
              <>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-[#9146ff] hover:bg-[#5a32b4] text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une chaîne
                </button>
                <button
                  onClick={() => setIsBulkImportOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Import en masse
                </button>
              </>
            )}
            <button
              onClick={() => setViewMode(viewMode === "simple" ? "complet" : "simple")}
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
            >
              {viewMode === "simple" ? (
                <>
                  <LayoutGrid className="w-4 h-4" />
                  Vue complète
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Vue simple
                </>
              )}
            </button>

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
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
                title="Exporter les modifications manuelles dans un fichier JSON"
              >
                <Download className="w-4 h-4" />
                Exporter Modifications
              </button>
            )}

            {/* Bouton de synchronisation complète Discord (pour les fondateurs) */}
            {currentAdmin?.isFounder && (
              <button
                onClick={async () => {
                  setDiscordSyncLoading(true);
                  try {
                    // Récupérer la liste des membres Discord disponibles
                    const response = await fetch("/api/discord/members/sync?preview=true", {
                      method: "POST",
                      cache: 'no-store',
                      headers: {
                        'Cache-Control': 'no-cache',
                      },
                    });
                    const data = await response.json();
                    if (data.success && data.members) {
                      // Charger les membres existants pour détecter les modifications manuelles
                      const existingResponse = await fetch("/api/admin/members", {
                        cache: 'no-store',
                        headers: {
                          'Cache-Control': 'no-cache',
                        },
                      });
                      const existingData = await existingResponse.json();
                      const existingMembers = existingData.members || [];
                      const existingByDiscordId = new Map(
                        existingMembers
                          .filter((m: any) => m.discordId)
                          .map((m: any) => [m.discordId, m])
                      );

                      // Enrichir les membres Discord avec les infos de modifications manuelles
                      const enrichedMembers = data.members.map((member: any) => {
                        const existing: any = existingByDiscordId.get(member.discordId);
                        return {
                          ...member,
                          isExisting: !!existing,
                          hasManualChanges: existing?.roleManuallySet || false,
                          twitchLogin: existing?.twitchLogin || member.twitchLogin,
                        };
                      });

                      setDiscordSyncMembers(enrichedMembers);
                      setShowDiscordSyncModal(true);
                    } else {
                      alert(`Erreur: ${data.error || "Erreur inconnue"}`);
                    }
                  } catch (error) {
                    console.error("Erreur lors de la récupération des membres Discord:", error);
                    alert(`Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
                  } finally {
                    setDiscordSyncLoading(false);
                  }
                }}
                className="bg-[#9146ff] hover:bg-[#5a32b4] text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
                disabled={discordSyncLoading}
              >
                <RefreshCw className={`w-4 h-4 ${discordSyncLoading ? 'animate-spin' : ''}`} />
                {discordSyncLoading ? "Chargement..." : "Sync Discord Complète"}
              </button>
            )}

            {/* Bouton de vérification des noms de chaînes Twitch (pour les fondateurs) */}
            {currentAdmin?.isFounder && (
              <button
                onClick={() => setShowVerifyTwitchNamesModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
                title="Vérifier les noms de chaînes Twitch via leur ID pour détecter les changements de pseudo"
              >
                <CheckCircle2 className="w-4 h-4" />
                Vérifier noms Twitch
              </button>
            )}

            {/* Modale de synchronisation Discord avec sélection */}
            {showDiscordSyncModal && (
              <DiscordSyncModal
                isOpen={showDiscordSyncModal}
                onClose={() => {
                  setShowDiscordSyncModal(false);
                  setDiscordSyncMembers([]);
                }}
                onSync={async (selectedMemberIds: string[]) => {
                  setDiscordSyncLoading(true);
                  try {
                    const response = await fetch("/api/discord/members/sync", {
                      method: "POST",
                      cache: 'no-store',
                      headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache',
                      },
                      body: JSON.stringify({ selectedMemberIds }),
                    });
                    const data = await response.json();
                    if (data.success) {
                      const stats = data.stats || {};
                      alert(
                        `Synchronisation terminée !\n\n` +
                        `Membres sélectionnés : ${selectedMemberIds.length}\n` +
                        `Synchronisés : ${stats.synced || 0}\n` +
                        `Créés : ${stats.created || 0}\n` +
                        `Mis à jour : ${stats.updated || 0}\n` +
                        `Ignorés (modifications manuelles) : ${stats.skippedManual || 0}`
                      );
                      setShowDiscordSyncModal(false);
                      setDiscordSyncMembers([]);
                      await loadMembers();
                    } else {
                      alert(`Erreur: ${data.error || "Erreur inconnue"}`);
                    }
                  } catch (error) {
                    console.error("Erreur lors de la synchronisation:", error);
                    alert(`Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
                  } finally {
                    setDiscordSyncLoading(false);
                  }
                }}
                members={discordSyncMembers}
                loading={discordSyncLoading}
              />
            )}

            {currentAdmin?.isFounder && (
              <>
                <button
                  onClick={() => {
                    window.location.href = "/admin/fusion-doublons";
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
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
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
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
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Sauvegarder données
                </button>
              </>
            )}
          </div>
        </div>

        {/* Encadré de statistiques des membres */}
        <div className="mb-6 bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-[#9146ff]" />
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">Statistiques des membres</h3>
              <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                <span>
                  <span className="text-white font-semibold">{members.length}</span> membre{members.length > 1 ? 's' : ''} au total
                </span>
                {members.length > 0 && (
                  <>
                    <span>
                      <span className="text-green-400 font-semibold">
                        {members.filter(m => m.statut === "Actif" && m.role !== "Nouveau").length}
                      </span> actif{members.filter(m => m.statut === "Actif" && m.role !== "Nouveau").length > 1 ? 's' : ''}
                    </span>
                    <span>
                      <span className="text-red-400 font-semibold">
                        {members.filter(m => m.statut === "Inactif" && m.role !== "Nouveau").length}
                      </span> inactif{members.filter(m => m.statut === "Inactif" && m.role !== "Nouveau").length > 1 ? 's' : ''}
                    </span>
                    <span>
                      <span className="text-purple-400 font-semibold">
                        {members.filter(m => m.role === "Nouveau").length}
                      </span> nouveau{members.filter(m => m.role === "Nouveau").length > 1 ? "x" : ""}
                    </span>
                    <span>
                      <span className="text-yellow-400 font-semibold">
                        {members.filter(m => getMemberCompleteness(m).percent < 80).length}
                      </span> incomplet{members.filter(m => getMemberCompleteness(m).percent < 80).length > 1 ? 's' : ''}
                    </span>
                    <span>
                      <span className="text-cyan-400 font-semibold">
                        {members.filter(m => !m.twitchId).length}
                      </span> sans ID Twitch
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
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

        {currentAdmin?.isFounder && (
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

        {/* Onglets Actifs/Inactifs/Nouveaux */}
        <div className="mb-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStatusTab("actifs")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              statusTab === "actifs"
                ? "bg-green-600 text-white"
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
                ? "bg-red-600 text-white"
                : "bg-[#1a1a1d] border border-gray-700 text-gray-300 hover:text-white"
            }`}
          >
            Inactifs ({inactiveMembers.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusTab("nouveaux")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              statusTab === "nouveaux"
                ? "bg-purple-600 text-white"
                : "bg-[#1a1a1d] border border-gray-700 text-gray-300 hover:text-white"
            }`}
          >
            Nouveaux ({newMembers.length})
          </button>
        </div>

        {/* Tableau des membres */}
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  {currentAdmin?.isFounder && (
                    <th className="py-4 px-3 text-sm font-semibold text-gray-300">
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
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Pseudo Site</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">ID Discord</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">ID Twitch</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Onboarding</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Mentor</th>
                    </>
                  )}
                  <SortableHeader column="role" label="RÔLE" />
                  <SortableHeader column="statut" label="STATUT" />
                  <SortableHeader column="createdAt" label="MEMBRE DEPUIS" />
                  <SortableHeader column="integrationDate" label="INTÉGRATION" />
                  <SortableHeader column="completude" label="COMPLÉTUDE" />
                  <SortableHeader column="parrain" label="PARRAIN" />
                  <SortableHeader column="lastLive" label="DERNIER LIVE" />
                  <SortableHeader column="raidsDone" label="Raids TENF faits" />
                  <SortableHeader column="raidsReceived" label="Raids reçus" />
                  {viewMode === "complet" && (
                    <>
                      <SortableHeader column="isVip" label="VIP" />
                      <SortableHeader column="isLive" label="Live" />
                    </>
                  )}
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {displayedMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
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
                          className="w-12 h-12 rounded-full object-cover"
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
                                className="text-[#9146ff] hover:text-[#5a32b4]"
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
                          <code className="text-xs text-gray-400 bg-[#0e0e10] px-2 py-1 rounded">
                            {member.discordId || "-"}
                          </code>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {member.twitchId ? (
                              <>
                                <code className="text-xs text-green-400 bg-[#0e0e10] px-2 py-1 rounded">
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
                                className="text-xs text-purple-400 hover:text-purple-300 underline ml-1 flex items-center gap-1"
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
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold w-fit ${getRoleBadgeColor(
                          member.role
                        )}`}
                      >
                        {member.role}
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
                      {formatMemberSince(member.createdAt)}
                    </td>
                    <td className="py-4 px-6">
                      {member.integrationDate ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Oui
                        </span>
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
                    {viewMode === "complet" && (
                      <>
                        <td className="py-4 px-6">
                          {member.isVip ? (
                            <span className="px-2 py-1 rounded bg-[#9146ff] text-white text-xs font-semibold">
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setShowMemberHistory(true);
                          }}
                          className="px-3 py-1 rounded text-xs font-semibold transition-colors bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 flex items-center gap-1"
                          title="Voir l'historique"
                        >
                          <History className="w-3 h-3" />
                          Historique
                        </button>
                        <Link
                          href={`/admin/membres/fiche/${encodeURIComponent(
                            member.discordId || member.twitchId || member.twitch || member.siteUsername || member.nom
                          )}`}
                          className="px-3 py-1 rounded text-xs font-semibold transition-colors bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 flex items-center gap-1"
                          title="Voir la fiche membre"
                        >
                          👁️ Fiche
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(member.id)}
                          className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                            member.statut === "Actif"
                              ? "bg-red-600/20 text-red-300 hover:bg-red-600/30"
                              : "bg-green-600/20 text-green-300 hover:bg-green-600/30"
                          }`}
                        >
                          {member.statut === "Actif" ? "Désactiver" : "Activer"}
                        </button>
                        {currentAdmin?.canWrite && (
                          <>
                            <button
                              onClick={() => handleEdit(member)}
                              className="bg-[#9146ff] hover:bg-[#5a32b4] px-3 py-1 rounded text-xs font-semibold text-white transition-colors"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => handleDelete(member)}
                              className="bg-red-600/20 hover:bg-red-600/30 text-red-300 px-3 py-1 rounded text-xs font-semibold transition-colors"
                            >
                              Supprimer
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {displayedMembers.length === 0 && (
                  <tr>
                    <td
                      colSpan={tableColumnCount}
                      className="py-8 px-6 text-center text-gray-400"
                    >
                      Aucun membre {statusTab === "actifs" ? "actif" : statusTab === "inactifs" ? "inactif" : "nouveau"} avec les filtres actuels.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
