"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Crown,
  Calendar,
  X,
  Save,
  Star,
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
import { getRoleBadgeClassName, getRoleBadgeLabel } from "@/lib/roleBadgeSystem";

interface Member {
  twitchLogin: string;
  displayName: string;
  isVip: boolean;
  role: string;
  isActive: boolean;
  vipBadge?: string;
  consecutiveMonths?: number;
}

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function GestionVipPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [vipFilter, setVipFilter] = useState<"all" | "vip" | "non-vip">("all");
  const [activityFilter, setActivityFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [vipHistory, setVipHistory] = useState<Record<string, string[]>>({});
  const [showMonthManager, setShowMonthManager] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; username: string } | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [bulkApplyMode, setBulkApplyMode] = useState<"current" | "history">("current");
  const [bulkPseudoList, setBulkPseudoList] = useState("");
  const [bulkAnalysis, setBulkAnalysis] = useState<{
    matched: Array<{ login: string; member: Member }>;
    unmatched: Array<{ original: string; suggestions: Member[] }>;
  } | null>(null);
  const [selectedUnmatched, setSelectedUnmatched] = useState<Record<string, string>>({});
  const [savingMonth, setSavingMonth] = useState(false);
  // VIP du mois depuis le blob (source de vérité après "Enregistrer VIP du mois")
  const [vipMonthLogins, setVipMonthLogins] = useState<string[] | null>(null);

  // Fonctions de chargement
  async function loadMembers() {
    try {
      setLoading(true);
      const [membersResponse, badgeMapResponse] = await Promise.all([
        fetch("/api/admin/members", { cache: "no-store" }),
        fetch("/api/vip-history?action=badge-map", { cache: "no-store" }),
      ]);

      if (membersResponse.ok) {
        const data = await membersResponse.json();
        const badgeMapPayload = badgeMapResponse.ok ? await badgeMapResponse.json() : { byLogin: {} };
        const badgeMap = (badgeMapPayload?.byLogin || {}) as Record<string, { badge?: string; months?: number }>;

        const membersList = (data.members || []).map((m: any) => {
          const login = String(m.twitchLogin || "").toLowerCase();
          const vipInfo = badgeMap[login] || {};
          return {
            twitchLogin: m.twitchLogin || "",
            displayName: m.displayName || m.nom || m.twitchLogin || "",
            isVip: m.isVip || false,
            role: m.role || "Affilié",
            isActive: m.isActive !== false,
            vipBadge: vipInfo.badge || "",
            consecutiveMonths: vipInfo.months || 0,
          };
        });

        membersList.sort((a: Member, b: Member) =>
          a.displayName.localeCompare(b.displayName, "fr", { sensitivity: "base" })
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

  async function loadVipHistory() {
    try {
      const response = await fetch("/api/vip-history?action=by-month");
      if (response.ok) {
        const data = await response.json();
        setVipHistory(data.byMonth || {});
      }
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique VIP:", error);
    }
  }

  async function loadVipMonthForSelectedMonth() {
    if (!selectedMonth) {
      setVipMonthLogins(null);
      return;
    }
    try {
      const response = await fetch(`/api/vip-month/save?month=${encodeURIComponent(selectedMonth)}`);
      if (response.ok) {
        const data = await response.json();
        setVipMonthLogins(Array.isArray(data.vipLogins) ? data.vipLogins : []);
      } else {
        setVipMonthLogins(null);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des VIP du mois (blob):", error);
      setVipMonthLogins(null);
    }
  }

  useEffect(() => {
    async function initialize() {
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
          
          // Initialiser avec le mois actuel
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const currentMonthKey = `${year}-${month}`;
          setSelectedMonth(currentMonthKey);
          
          // Charger les données en parallèle
          await Promise.all([loadMembers(), loadVipHistory()]);
        } catch (error) {
          console.error("Erreur lors de l'initialisation:", error);
          setMessage({ type: "error", text: "Erreur lors du chargement des données" });
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      loadVipHistory();
      loadVipMonthForSelectedMonth();
    } else {
      setVipMonthLogins(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

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

    // Filtrer par statut VIP
    if (vipFilter === "vip") {
      filtered = filtered.filter((m) => m.isVip);
    } else if (vipFilter === "non-vip") {
      filtered = filtered.filter((m) => !m.isVip);
    }

    // Filtrer par activité
    if (activityFilter === "active") {
      filtered = filtered.filter((m) => m.isActive);
    } else if (activityFilter === "inactive") {
      filtered = filtered.filter((m) => !m.isActive);
    }

    return filtered;
  }, [members, searchQuery, vipFilter, activityFilter]);

  async function toggleVipStatus(member: Member) {
    if (!currentAdmin) return;

    try {
      setSaving(true);
      setMessage(null);

      // Charger le membre complet depuis l'API
      const memberResponse = await fetch(`/api/admin/members?twitchLogin=${member.twitchLogin}`);
      if (!memberResponse.ok) {
        throw new Error("Membre non trouvé");
      }
      
      const memberData = await memberResponse.json();
      const fullMember = memberData.member || memberData.members?.[0];
      
      if (!fullMember) {
        throw new Error("Membre non trouvé");
      }

      const newVipStatus = !member.isVip;

      // Appeler l'API de mise à jour
      const response = await fetch("/api/admin/members", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          twitchLogin: member.twitchLogin,
          originalDiscordId: fullMember.discordId,
          originalTwitchId: fullMember.twitchId,
          isVip: newVipStatus,
        }),
      });

      if (response.ok) {
        // Si on active le VIP, ajouter au mois actuel
        if (newVipStatus && selectedMonth) {
          await addVipToMonth(member.twitchLogin, selectedMonth);
        }
        
        setMessage({ 
          type: "success", 
          text: `Statut VIP ${newVipStatus ? "activé" : "désactivé"} avec succès` 
        });
        await loadMembers();
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

  async function addVipToMonth(twitchLogin: string, month: string) {
    try {
      const response = await fetch("/api/vip-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login: twitchLogin,
          month: month,
        }),
      });

      if (response.ok) {
        await loadVipHistory();
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout VIP au mois:", error);
    }
  }

  async function removeVipFromMonth(twitchLogin: string, month: string) {
    try {
      const response = await fetch("/api/vip-history", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login: twitchLogin,
          month: month,
        }),
      });

      if (response.ok) {
        await loadVipHistory();
        await loadMembers(); // Recharger pour mettre à jour les badges
      }
    } catch (error) {
      console.error("Erreur lors de la suppression VIP du mois:", error);
    }
  }

  function getMonthOptions(): string[] {
    const options: string[] = [];
    const now = new Date();
    for (let i = 0; i < 60; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      options.push(`${year}-${month}`);
    }
    return options;
  }

  function formatMonthKey(key: string): string {
    const [year, month] = key.split('-');
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }

  // Normaliser un pseudo pour la recherche
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

      if (
        memberLoginNormalized.includes(normalized) ||
        normalized.includes(memberLoginNormalized) ||
        memberDisplayNormalized.includes(normalized) ||
        normalized.includes(memberDisplayNormalized)
      ) {
        suggestions.push(member);
      }
    });

    return suggestions.slice(0, 5);
  }

  // Analyser la liste de pseudos collée
  function analyzeBulkList() {
    if (!bulkPseudoList.trim()) {
      setMessage({ type: "error", text: "Veuillez coller une liste de pseudos" });
      return;
    }

    const lines = bulkPseudoList.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
    const matched: Array<{ login: string; member: Member }> = [];
    const unmatched: Array<{ original: string; suggestions: Member[] }> = [];

    lines.forEach((original) => {
      const normalized = normalizePseudo(original);
      let found = false;

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

  // Appliquer VIP en masse
  async function applyBulkVip() {
    if (!bulkAnalysis || !currentAdmin || !selectedMonth) return;

    try {
      setSaving(true);
      setMessage(null);

      const membersToUpdate = [...bulkAnalysis.matched];

      for (const [original, selectedLogin] of Object.entries(selectedUnmatched)) {
        if (selectedLogin) {
          const member = members.find((m) => m.twitchLogin === selectedLogin);
          if (member) {
            membersToUpdate.push({ login: original, member });
          }
        }
      }

      if (membersToUpdate.length === 0) {
        setMessage({ type: "error", text: "Aucun membre à mettre à jour" });
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const historicalMode = bulkApplyMode === "history" || selectedMonth !== getCurrentMonthKey();
      const monthLogins = vipMonthLogins ?? vipHistory[selectedMonth] ?? [];
      const existingMonthSet = new Set(monthLogins.map((login) => login.toLowerCase()));

      for (const { member } of membersToUpdate) {
        try {
          if (historicalMode) {
            const normalizedLogin = member.twitchLogin.toLowerCase();
            if (!existingMonthSet.has(normalizedLogin)) {
              await addVipToMonth(member.twitchLogin, selectedMonth);
              existingMonthSet.add(normalizedLogin);
            }
            successCount++;
            continue;
          }

          if (member.isVip) continue; // Déjà VIP (mode courant)

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
              isVip: true,
            }),
          });

          if (response.ok) {
            await addVipToMonth(member.twitchLogin, selectedMonth);
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
        text: historicalMode
          ? `${successCount} entrée(s) historique VIP enregistrée(s) pour ${formatMonthKey(selectedMonth)}${
              errorCount > 0 ? `, ${errorCount} erreur(s)` : ""
            }`
          : `${successCount} VIP activé(s) avec succès${errorCount > 0 ? `, ${errorCount} erreur(s)` : ""}`,
      });

      setBulkAnalysis(null);
      setBulkPseudoList("");
      setShowBulkAddModal(false);
      await loadMembers();
      await loadVipHistory();
    } catch (error: any) {
      console.error("Erreur lors de l'ajout en masse:", error);
      setMessage({ type: "error", text: error.message || "Erreur lors de l'ajout en masse" });
    } finally {
      setSaving(false);
    }
  }

  // Retirer VIP à tous
  async function deleteAllVips() {
    if (!currentAdmin) return;

    try {
      setSaving(true);
      setMessage(null);

      const vipMembers = members.filter((m) => m.isVip && m.isActive);
      let successCount = 0;
      let errorCount = 0;

      for (const member of vipMembers) {
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
              isVip: false,
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
        text: `${successCount} VIP retiré(s)${errorCount > 0 ? `, ${errorCount} erreur(s)` : ""}`,
      });

      setConfirmDeleteAll(false);
      await loadMembers();
    } catch (error: any) {
      console.error("Erreur lors de la suppression:", error);
      setMessage({ type: "error", text: error.message || "Erreur lors de la suppression" });
    } finally {
      setSaving(false);
    }
  }

  // Sauvegarder les VIP du mois actuel dans un blob spécial
  async function saveCurrentMonthVips() {
    if (!currentAdmin || !selectedMonth) return;

    try {
      setSavingMonth(true);
      setMessage(null);

      // Récupérer tous les VIP actifs avec isVip = true
      const vipMembers = members.filter((m) => m.isVip && m.isActive);
      const vipLogins = vipMembers.map((m) => m.twitchLogin);

      // Enregistrer dans le blob spécial pour le mois
      const response = await fetch("/api/vip-month/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: selectedMonth,
          vipLogins: vipLogins,
        }),
      });

      if (response.ok) {
        // Mettre à jour la liste du blob pour que le KPI et la liste s'affichent immédiatement
        setVipMonthLogins(vipLogins);
        // Synchroniser aussi avec l'historique VIP (fichier / autre stockage)
        for (const login of vipLogins) {
          await addVipToMonth(login, selectedMonth);
        }

        setMessage({
          type: "success",
          text: `${vipLogins.length} VIP enregistré(s) pour ${formatMonthKey(selectedMonth)}. Les VIP sont maintenant synchronisés sur tout le site.`,
        });

        await loadMembers();
        await loadVipHistory();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'enregistrement");
      }
    } catch (error: any) {
      console.error("Erreur lors de l'enregistrement des VIP du mois:", error);
      setMessage({ type: "error", text: error.message || "Erreur lors de l'enregistrement" });
    } finally {
      setSavingMonth(false);
    }
  }

  // Statistiques (priorité au blob vip-month pour le mois sélectionné, puis vip-history)
  const stats = useMemo(() => {
    const vipCount = members.filter((m) => m.isVip && m.isActive).length;
    const currentMonthVips = selectedMonth
      ? (vipMonthLogins !== null ? vipMonthLogins.length : (vipHistory[selectedMonth] || []).length)
      : 0;
    const totalActive = members.filter((m) => m.isActive).length;
    const inactiveVip = members.filter((m) => m.isVip && !m.isActive).length;
    return { vipCount, currentMonthVips, totalActive, inactiveVip };
  }, [members, selectedMonth, vipHistory, vipMonthLogins]);

  const vipTrend = useMemo(() => {
    const months = Object.keys(vipHistory).sort((a, b) => b.localeCompare(a));
    const current = selectedMonth ? (vipHistory[selectedMonth]?.length || 0) : 0;
    const previousMonth = selectedMonth
      ? (() => {
          const [y, m] = selectedMonth.split("-").map((v) => parseInt(v, 10));
          const d = new Date(y, m - 2, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          return vipHistory[key]?.length || 0;
        })()
      : 0;
    const variation = current - previousMonth;
    const recent3 = months.slice(0, 3).map((month) => ({ month, count: vipHistory[month]?.length || 0 }));
    return { current, previousMonth, variation, recent3 };
  }, [vipHistory, selectedMonth]);

  const vipQuality = useMemo(() => {
    const goldOrHigher = members.filter(
      (m) => m.isVip && (m.vipBadge === "Or" || m.vipBadge === "Légende" || m.vipBadge === "Diamant")
    ).length;
    const multiMonth = members.filter((m) => m.isVip && (m.consecutiveMonths || 0) >= 3).length;
    const vipWithoutMonth = members.filter((m) => {
      if (!m.isVip || !selectedMonth) return false;
      const monthLogins = vipMonthLogins ?? vipHistory[selectedMonth] ?? [];
      return !monthLogins.some((login) => login.toLowerCase() === m.twitchLogin.toLowerCase());
    }).length;

    return { goldOrHigher, multiMonth, vipWithoutMonth };
  }, [members, selectedMonth, vipHistory, vipMonthLogins]);

  const prioritizedActions = useMemo(() => {
    const monthLogins = selectedMonth ? vipMonthLogins ?? vipHistory[selectedMonth] ?? [] : [];
    const monthSet = new Set(monthLogins.map((login) => login.toLowerCase()));

    return [
      {
        key: "month-sync",
        label: "VIP actifs non synchronisés au mois",
        impact: "bloquant_onboarding",
        count: members.filter((m) => m.isVip && m.isActive && !monthSet.has(m.twitchLogin.toLowerCase())).length,
      },
      {
        key: "inactive",
        label: "VIP inactifs à nettoyer",
        impact: "qualite_data",
        count: members.filter((m) => m.isVip && !m.isActive).length,
      },
      {
        key: "candidate",
        label: "Candidats VIP (badge Or+ mais non VIP)",
        impact: "processus_interne",
        count: members.filter(
          (m) =>
            !m.isVip &&
            (m.vipBadge === "Or" || m.vipBadge === "Légende" || m.vipBadge === "Diamant") &&
            m.isActive
        ).length,
      },
    ].map((item) => ({
      ...item,
      score:
        item.count *
        (item.impact === "bloquant_onboarding" ? 1.4 : item.impact === "qualite_data" ? 1.25 : 1.1),
    }));
  }, [members, selectedMonth, vipHistory, vipMonthLogins]);

  const isSelectedMonthCurrent = selectedMonth === getCurrentMonthKey();

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
            <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Membres · VIP</p>
            <div className="mt-2 flex items-center gap-2">
              <Crown className="h-6 w-6 text-amber-200" />
              <h1 className="bg-gradient-to-r from-amber-100 via-yellow-200 to-orange-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
                Gestion des statuts VIP
              </h1>
            </div>
            <p className="mt-3 text-sm text-slate-300">
              Pilote les promotions VIP, la cohérence mensuelle et le suivi de rétention des membres premium.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void loadMembers();
              void loadVipHistory();
              void loadVipMonthForSelectedMonth();
            }}
            disabled={loading || saving || savingMonth}
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

      {/* Boutons d'action globaux */}
      <div className="flex gap-4 flex-wrap">
        <button
          onClick={() => {
            setBulkApplyMode(isSelectedMonthCurrent ? "current" : "history");
            setShowBulkAddModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/35 bg-[linear-gradient(135deg,rgba(16,185,129,0.28),rgba(6,95,70,0.4))] px-5 py-2.5 text-sm font-semibold text-emerald-100 transition hover:-translate-y-[1px] hover:border-emerald-200/55 hover:bg-[linear-gradient(135deg,rgba(16,185,129,0.4),rgba(6,95,70,0.58))]"
        >
          <Upload className="w-5 h-5" />
          Ajouter VIP en masse
        </button>
        <button
          onClick={() => setConfirmDeleteAll(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-300/35 bg-[linear-gradient(135deg,rgba(244,63,94,0.24),rgba(127,29,29,0.42))] px-5 py-2.5 text-sm font-semibold text-rose-100 transition hover:-translate-y-[1px] hover:border-rose-200/55 hover:bg-[linear-gradient(135deg,rgba(244,63,94,0.36),rgba(127,29,29,0.58))]"
        >
          <Trash2 className="w-5 h-5" />
          Retirer VIP à tous
        </button>
        <button
          onClick={saveCurrentMonthVips}
          disabled={savingMonth || !selectedMonth || !isSelectedMonthCurrent}
          className="inline-flex items-center gap-2 rounded-xl border border-indigo-300/35 bg-indigo-500/20 px-5 py-2.5 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {savingMonth ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Enregistrer snapshot mois courant
            </>
          )}
        </button>
        {!isSelectedMonthCurrent && selectedMonth ? (
          <p className="self-center text-xs text-amber-300/90">
            Snapshot désactivé hors mois courant. Utilise l'ajout en masse en mode historique.
          </p>
        ) : null}
      </div>

      {/* Statistiques */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">VIP actifs</p>
          <p className="mt-2 text-3xl font-semibold text-amber-200">{stats.vipCount}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">VIP du mois sélectionné</p>
          <p className="mt-2 text-3xl font-semibold text-yellow-200">{stats.currentMonthVips}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Membres actifs</p>
          <p className="mt-2 text-3xl font-semibold">{stats.totalActive}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Taux VIP</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-300">
            {stats.totalActive > 0 ? Math.round((stats.vipCount / stats.totalActive) * 100) : 0}%
          </p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className={`${sectionCardClass} p-5`}>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-200" />
            <h2 className="text-lg font-semibold text-slate-100">Tendance mensuelle</h2>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg border border-indigo-400/30 bg-indigo-500/10 p-3">
              <p className="text-slate-300">Mois actuel</p>
              <p className="text-xl font-semibold text-indigo-200">{vipTrend.current}</p>
            </div>
            <div className="rounded-lg border border-slate-400/30 bg-slate-500/10 p-3">
              <p className="text-slate-300">Mois précédent</p>
              <p className="text-xl font-semibold text-slate-200">{vipTrend.previousMonth}</p>
            </div>
            <div className="col-span-2 rounded-lg border border-sky-400/30 bg-sky-500/10 p-3">
              <p className="text-slate-300">Variation</p>
              <p className="text-xl font-semibold text-sky-200">{vipTrend.variation >= 0 ? `+${vipTrend.variation}` : vipTrend.variation}</p>
            </div>
          </div>
        </article>

        <article className={`${sectionCardClass} p-5`}>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-200" />
            <h2 className="text-lg font-semibold text-slate-100">Qualité VIP</h2>
          </div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="rounded-lg border border-[#353a50] bg-[#121623]/80 p-3">
              <p className="text-slate-300">VIP inactifs</p>
              <p className="text-lg font-semibold text-rose-200">{stats.inactiveVip}</p>
            </div>
            <div className="rounded-lg border border-[#353a50] bg-[#121623]/80 p-3">
              <p className="text-slate-300">VIP badge Or / Diamant / Légende</p>
              <p className="text-lg font-semibold text-amber-200">{vipQuality.goldOrHigher}</p>
            </div>
            <div className="rounded-lg border border-[#353a50] bg-[#121623]/80 p-3">
              <p className="text-slate-300">VIP 3+ mois consécutifs</p>
              <p className="text-lg font-semibold text-emerald-200">{vipQuality.multiMonth}</p>
            </div>
          </div>
        </article>

        <article className={`${sectionCardClass} p-5`}>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-sky-200" />
            <h2 className="text-lg font-semibold text-slate-100">Lecture rapide</h2>
          </div>
          <div className="mt-3 space-y-2 text-sm">
            {vipTrend.recent3.length === 0 ? (
              <p className="text-slate-400">Aucun historique sur les 3 derniers mois.</p>
            ) : (
              vipTrend.recent3.map((entry) => (
                <div key={entry.month} className="flex items-center justify-between rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2">
                  <span className="text-slate-200">{formatMonthKey(entry.month)}</span>
                  <span className="font-semibold text-indigo-200">{entry.count}</span>
                </div>
              ))
            )}
            <p className="rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2 text-slate-300">
              VIP actifs hors mois sélectionné: <span className="font-semibold text-amber-200">{vipQuality.vipWithoutMonth}</span>
            </p>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Plan d'action priorisé</h2>
          <div className="mt-3 space-y-2">
            {prioritizedActions.map((action) => (
              <div key={action.key} className="flex items-center justify-between rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-100">{action.label}</p>
                  <p className="text-xs text-slate-400">Score {Math.round(action.score)}</p>
                </div>
                <span className="text-lg font-semibold text-indigo-200">{action.count}</span>
              </div>
            ))}
          </div>
        </article>
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Actions internes</h2>
          <div className="mt-3 space-y-2">
            <button
              onClick={() => {
                setBulkApplyMode(isSelectedMonthCurrent ? "current" : "history");
                setShowBulkAddModal(true);
              }}
              className="w-full inline-flex items-center justify-between rounded-lg border border-emerald-300/35 bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/25"
            >
              Ajouter VIP en masse
              <Upload className="h-4 w-4" />
            </button>
            <button
              onClick={() => setConfirmDeleteAll(true)}
              className="w-full inline-flex items-center justify-between rounded-lg border border-rose-300/35 bg-rose-500/15 px-3 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-500/25"
            >
              Retirer VIP à tous
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={saveCurrentMonthVips}
              disabled={savingMonth || !selectedMonth || !isSelectedMonthCurrent}
              className="w-full inline-flex items-center justify-between rounded-lg border border-indigo-300/35 bg-indigo-500/20 px-3 py-2 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/30 disabled:opacity-50"
            >
              Enregistrer VIP du mois
              <Save className="h-4 w-4" />
            </button>
            <Link
              href="/admin/membres/gestion"
              className="w-full inline-flex items-center justify-between rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2 text-sm text-slate-100 hover:border-indigo-300/45"
            >
              Ouvrir gestion membres
              <ArrowRight className="h-4 w-4 text-indigo-200" />
            </Link>
          </div>
        </article>
      </section>

      {/* Filtres et sélection de mois */}
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

          {/* Filtre VIP */}
          <div>
            <select
              value={vipFilter}
              onChange={(e) => setVipFilter(e.target.value as "all" | "vip" | "non-vip")}
              className="w-full rounded-lg border border-[#353a50] bg-[#121623]/80 px-4 py-2 text-white focus:outline-none focus:border-indigo-300/55"
            >
              <option value="all">Tous les membres</option>
              <option value="vip">VIP uniquement</option>
              <option value="non-vip">Non-VIP uniquement</option>
            </select>
          </div>

          {/* Filtre activité */}
          <div>
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value as "all" | "active" | "inactive")}
              className="w-full rounded-lg border border-[#353a50] bg-[#121623]/80 px-4 py-2 text-white focus:outline-none focus:border-indigo-300/55"
            >
              <option value="all">Actifs + inactifs</option>
              <option value="active">Actifs uniquement</option>
              <option value="inactive">Inactifs uniquement</option>
            </select>
          </div>

          {/* Sélection de mois */}
          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="flex-1 rounded-lg border border-[#353a50] bg-[#121623]/80 px-4 py-2 text-white focus:outline-none focus:border-indigo-300/55"
            >
              {getMonthOptions().map((option) => (
                <option key={option} value={option}>
                  {formatMonthKey(option)}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowMonthManager(!showMonthManager)}
              className="rounded-lg border border-indigo-300/35 bg-indigo-500/20 px-4 py-2 text-indigo-100 transition hover:bg-indigo-500/30 flex items-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Gérer
            </button>
          </div>
        </div>
      </section>

      {/* Gestion du mois sélectionné */}
      {showMonthManager && selectedMonth && (
        <section className={`${sectionCardClass} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              VIP du mois : {formatMonthKey(selectedMonth)}
            </h3>
            <button
              onClick={() => setShowMonthManager(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            {((vipMonthLogins !== null ? vipMonthLogins : vipHistory[selectedMonth]) || []).length > 0 ? (
              (vipMonthLogins !== null ? vipMonthLogins : vipHistory[selectedMonth] || []).map((login) => {
                const member = members.find((m) => m.twitchLogin.toLowerCase() === login.toLowerCase());
                return (
                  <div
                    key={login}
                    className="flex items-center justify-between rounded-lg border border-[#353a50] bg-[#121623]/80 p-3"
                  >
                    <div>
                      <span className="font-semibold text-white">
                        {member?.displayName || login}
                      </span>
                      {member && (
                        <span className="text-gray-500 text-sm ml-2">({member.twitchLogin})</span>
                      )}
                    </div>
                    <button
                      onClick={() => removeVipFromMonth(login, selectedMonth)}
                      className="rounded-lg border border-rose-300/40 bg-rose-500/20 px-3 py-1 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/30"
                    >
                      Retirer
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-400 text-center py-4">
                Aucun VIP pour ce mois
              </p>
            )}
          </div>
        </section>
      )}

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
                  Statut VIP
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                  Badge VIP
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
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
                      {member.isVip ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-yellow-900/30 text-yellow-300 border border-yellow-600/30 text-sm font-semibold">
                          <Star className="w-4 h-4" />
                          VIP
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">Non-VIP</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {member.vipBadge ? (
                        <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-yellow-600 to-yellow-400 text-white text-sm font-bold">
                          {member.vipBadge}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm italic">-</span>
                      )}
                      {member.consecutiveMonths && member.consecutiveMonths > 1 && (
                        <span className="text-gray-500 text-xs ml-2">
                          ({member.consecutiveMonths} mois)
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => toggleVipStatus(member)}
                        disabled={saving}
                        className={`font-semibold px-4 py-2 rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${
                          member.isVip
                            ? "border border-rose-300/35 bg-rose-500/20 text-rose-100 hover:bg-rose-500/30"
                            : "border border-emerald-300/35 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30"
                        }`}
                      >
                        {member.isVip ? "Retirer VIP" : "Activer VIP"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal de confirmation suppression tous VIP */}
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
              Êtes-vous sûr de vouloir retirer le statut VIP à <strong className="text-red-400">tous les membres VIP</strong> ?
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
                onClick={deleteAllVips}
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
              setSelectedUnmatched({});
            }
          }}
        >
          <div
            className="max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-[#353a50] bg-[#141927] p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Ajouter VIP en masse</h2>
              <button
                onClick={() => {
                  if (!saving) {
                    setShowBulkAddModal(false);
                    setBulkAnalysis(null);
                    setBulkPseudoList("");
                    setSelectedUnmatched({});
                  }
                }}
                disabled={saving}
                className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6 rounded-lg border border-[#353a50] bg-[#0f1321] p-3">
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Mode d'application</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setBulkApplyMode("current")}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    bulkApplyMode === "current"
                      ? "border border-emerald-300/45 bg-emerald-500/20 text-emerald-100"
                      : "border border-[#353a50] bg-[#121623]/80 text-slate-200 hover:border-emerald-300/35"
                  }`}
                >
                  Activer VIP actuel
                </button>
                <button
                  type="button"
                  onClick={() => setBulkApplyMode("history")}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    bulkApplyMode === "history"
                      ? "border border-amber-300/45 bg-amber-500/20 text-amber-100"
                      : "border border-[#353a50] bg-[#121623]/80 text-slate-200 hover:border-amber-300/35"
                  }`}
                >
                  Historique uniquement (mois passé)
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {bulkApplyMode === "history"
                  ? "Ce mode ajoute des entrées VIP au mois sélectionné sans modifier le statut VIP actuel des membres."
                  : "Ce mode active le statut VIP actuel et rattache aussi les membres au mois sélectionné."}
              </p>
            </div>

            {!bulkAnalysis ? (
              <>
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
                    Collez la liste de pseudos (un par ligne). Cible: {selectedMonth ? formatMonthKey(selectedMonth) : "..."}.
                    {bulkApplyMode === "history"
                      ? " Mode historique: pas d'activation VIP actuelle."
                      : " Mode courant: activation VIP + affectation mensuelle."}
                  </p>
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setShowBulkAddModal(false);
                      setBulkPseudoList("");
                    }}
                    disabled={saving}
                    className="rounded-lg border border-slate-300/30 bg-slate-500/15 px-6 py-2 font-semibold text-slate-100 transition hover:bg-slate-500/25 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={analyzeBulkList}
                    disabled={!bulkPseudoList.trim() || saving}
                    className="inline-flex items-center gap-2 rounded-lg border border-indigo-300/35 bg-indigo-500/20 px-6 py-2 font-semibold text-indigo-100 transition hover:bg-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Search className="w-5 h-5" />
                    Analyser
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-6">
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
                              {member.isVip && <span className="text-yellow-400 text-xs ml-1">(Déjà VIP)</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

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
                                <label className="text-sm text-gray-400">Suggestions :</label>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedUnmatched((prev) => ({
                                        ...prev,
                                        [original]: "",
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

                  <div className="rounded-lg border border-[#353a50] bg-[#0f1321] p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
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
                        <div className="text-xs text-gray-400">
                          {bulkApplyMode === "history" ? "Total à historiser" : "Total à activer"}
                        </div>
                      </div>
                    </div>
                  </div>

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
                      onClick={applyBulkVip}
                      disabled={
                        saving ||
                        bulkAnalysis.matched.length + Object.values(selectedUnmatched).filter((v) => v !== "").length === 0 ||
                        !selectedMonth
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
                          {bulkApplyMode === "history" ? "Historiser" : "Appliquer"} (
                          {bulkAnalysis.matched.length + Object.values(selectedUnmatched).filter((v) => v !== "").length})
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

