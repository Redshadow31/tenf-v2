"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Save, Plus, Trash2, AlertCircle, CheckCircle2, X } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import DiscordGrowthImportModal from "@/components/admin/DiscordGrowthImportModal";
import DiscordDailyActivityImportModal from "@/components/admin/DiscordDailyActivityImportModal";
import DiscordMessagesImportModal from "@/components/admin/DiscordMessagesImportModal";
import DiscordVocalsImportModal from "@/components/admin/DiscordVocalsImportModal";

interface MonthlyDataPoint {
  month: string;
  value: number;
}

interface RankingMember {
  id: number;
  name: string;
  avatar: string;
  value: number;
  progression?: string;
  messages?: number; // Pour vocalRanking
}

interface DashboardData {
  twitchActivity: MonthlyDataPoint[];
  discordGrowth: MonthlyDataPoint[];
  discordActivity: MonthlyDataPoint[];
  spotlightProgression: MonthlyDataPoint[];
  raidsReceived: MonthlyDataPoint[];
  raidsSent: MonthlyDataPoint[];
  vocalRanking: RankingMember[];
  textRanking: RankingMember[];
  lastUpdated?: string;
  updatedBy?: string;
}

interface WorkflowMemberLite {
  discordId?: string;
  twitchId?: string;
  integrationDate?: string;
  isActive?: boolean;
  badges?: string[];
  onboardingStatus?: "a_faire" | "en_cours" | "termine";
  profileValidationStatus?: "non_soumis" | "en_cours_examen" | "valide";
}

interface WorkflowFollowSummaryItem {
  staffSlug: string;
  staffName: string;
  status: "up_to_date" | "obsolete" | "not_validated";
}

interface WorkflowStep {
  id: string;
  label: string;
  href: string;
  status: "todo" | "in_progress" | "done";
  helper: string;
}

const MONTHS = ["Janv", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];

type TabId =
  | 'twitch'
  | 'discordMonth'
  | 'discordGrowth'
  | 'discordActivity'
  | 'spotlight'
  | 'raidsReceived'
  | 'raidsSent'
  | 'vocal'
  | 'text';

export default function DashboardManagementPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isFounder, setIsFounder] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('twitch');
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    twitchActivity: [],
    discordGrowth: [],
    discordActivity: [],
    spotlightProgression: [],
    raidsReceived: [],
    raidsSent: [],
    vocalRanking: [],
    textRanking: [],
  });

  // Vérifier si l'utilisateur est fondateur
  useEffect(() => {
    async function checkAccess() {
      try {
        const accessResponse = await fetch("/api/admin/access");
        if (accessResponse.status === 403) {
          window.location.href = "/unauthorized";
          return;
        }
        if (!accessResponse.ok) {
          throw new Error("Erreur lors de la vérification");
        }
        setIsFounder(true);
      } catch (err) {
        console.error("Error checking access:", err);
        setError("Erreur lors de la vérification des permissions");
        window.location.href = "/unauthorized";
      }
    }
    checkAccess();
  }, []);

  // Charger les données
  useEffect(() => {
    if (!isFounder) return;
    loadDashboardData();
  }, [isFounder]);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/dashboard/data", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          setError("Accès refusé. Seuls les fondateurs peuvent accéder à cette page.");
          window.location.href = "/unauthorized";
          return;
        }
        throw new Error("Erreur lors du chargement");
      }

      const result = await response.json();
      if (result.success && result.data) {
        setDashboardData(result.data);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/admin/dashboard/data", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullData: dashboardData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la sauvegarde");
      }

      setSuccess("Données sauvegardées avec succès !");
      setTimeout(() => setSuccess(null), 3000);
      
      // Recharger les données pour obtenir les métadonnées
      await loadDashboardData();
    } catch (err: any) {
      console.error("Error saving dashboard data:", err);
      setError(err.message || "Erreur lors de la sauvegarde");
      setSuccess(null);
    } finally {
      setSaving(false);
    }
  }

  function addDataPoint(section: 'twitchActivity' | 'discordGrowth' | 'discordActivity' | 'spotlightProgression' | 'raidsReceived' | 'raidsSent', month: string, value: number) {
    setDashboardData(prev => ({
      ...prev,
      [section]: [...prev[section], { month, value }].sort((a, b) => {
        const aIndex = MONTHS.indexOf(a.month);
        const bIndex = MONTHS.indexOf(b.month);
        return aIndex - bIndex;
      }),
    }));
  }

  function updateDataPoint(section: 'twitchActivity' | 'discordGrowth' | 'discordActivity' | 'spotlightProgression' | 'raidsReceived' | 'raidsSent', index: number, month: string, value: number) {
    setDashboardData(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => 
        i === index ? { month, value } : item
      ),
    }));
  }

  function removeDataPoint(section: 'twitchActivity' | 'discordGrowth' | 'discordActivity' | 'spotlightProgression' | 'raidsReceived' | 'raidsSent', index: number) {
    setDashboardData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }));
  }

  function addRankingMember(section: 'vocalRanking' | 'textRanking', member: RankingMember) {
    setDashboardData(prev => ({
      ...prev,
      [section]: [...prev[section], member],
    }));
  }

  function updateRankingMember(section: 'vocalRanking' | 'textRanking', index: number, member: RankingMember) {
    setDashboardData(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => 
        i === index ? member : item
      ),
    }));
  }

  function removeRankingMember(section: 'vocalRanking' | 'textRanking', index: number) {
    setDashboardData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }));
  }


  if (loading && !isFounder) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--color-primary)' }}></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <AdminHeader
        title="Paramètres dashboard"
        navLinks={[
          { href: "/admin/gestion-acces/accueil", label: "Dashboard administration" },
          { href: "/admin/gestion-acces", label: "Comptes administrateurs" },
          { href: "/admin/gestion-acces/dashboard", label: "Paramètres dashboard", active: true },
          { href: "/admin/gestion-acces/permissions", label: "Permissions par section" },
          { href: "/admin/gestion-acces/admin-avance", label: "Admin avancé (fondateurs)" },
        ]}
      />

      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Messages d'erreur et de succès */}
        {error && (
          <div className="mb-6 p-4 rounded-lg border flex items-center gap-3" style={{ backgroundColor: 'var(--color-card)', borderColor: '#dc2626' }}>
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm flex-1" style={{ color: 'var(--color-text)' }}>{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg border flex items-center gap-3" style={{ backgroundColor: 'var(--color-card)', borderColor: '#10b981' }}>
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-sm flex-1" style={{ color: 'var(--color-text)' }}>{success}</p>
            <button
              onClick={() => setSuccess(null)}
              className="text-green-500 hover:text-green-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* En-tête avec bouton de sauvegarde */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
              Gestion des données du Dashboard
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Modifiez manuellement les données affichées sur le dashboard principal
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-6 py-3 rounded-lg font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ backgroundColor: 'var(--color-primary)' }}
            onMouseEnter={(e) => {
              if (!saving && !loading) e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              if (!saving && !loading) e.currentTarget.style.opacity = '1';
            }}
          >
            <Save className="w-5 h-5" />
            {saving ? "Sauvegarde..." : "Sauvegarder tout"}
          </button>
        </div>

        <MonthlyWorkflowSection />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
          </div>
        ) : (
          <>
            {/* Système d'onglets */}
            <div className="mb-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <nav className="flex space-x-1 flex-wrap" style={{ backgroundColor: 'var(--color-bg)' }}>
                {[
                  { id: 'twitch' as TabId, label: 'Activité Discord', icon: '💬' },
                  { id: 'discordMonth' as TabId, label: 'Activité Discord du mois', icon: '📊' },
                  { id: 'discordGrowth' as TabId, label: 'Croissance Discord', icon: '📈' },
                  { id: 'discordActivity' as TabId, label: 'Activité Discord quotidienne', icon: '💬' },
                  { id: 'spotlight' as TabId, label: 'Progression Spotlight', icon: '⭐' },
                  { id: 'raidsReceived' as TabId, label: 'Raids reçus', icon: '🎯' },
                  { id: 'raidsSent' as TabId, label: 'Raids envoyés', icon: '🚀' },
                  { id: 'vocal' as TabId, label: 'Classement vocal Discord', icon: '🎤' },
                  { id: 'text' as TabId, label: 'Classement texte Discord', icon: '📝' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                      activeTab === tab.id
                        ? 'text-white border-b-2'
                        : 'text-gray-400 hover:text-gray-300 hover:border-gray-600'
                    }`}
                    style={{
                      backgroundColor: activeTab === tab.id ? 'transparent' : 'transparent',
                      borderBottomColor: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
                      borderBottomWidth: activeTab === tab.id ? '2px' : '0px',
                      color: activeTab === tab.id ? 'var(--color-text)' : 'var(--color-text-secondary)',
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== tab.id) {
                        e.currentTarget.style.color = 'var(--color-text)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== tab.id) {
                        e.currentTarget.style.color = 'var(--color-text-secondary)';
                      }
                    }}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Contenu des onglets */}
            <div className="mt-6">
              {activeTab === 'twitch' && (
                <DiscordDailyActivitySection
                  title="Activité Discord"
                  description="Données quotidiennes pour le graphique d'activité Discord (messages et vocaux)"
                  onImportComplete={() => loadDashboardData()}
                />
              )}

              {activeTab === 'discordGrowth' && (
                <DiscordGrowthSection
                  title="Croissance Discord"
                  description="Données mensuelles pour le graphique de croissance Discord"
                  data={dashboardData.discordGrowth}
                  onAdd={(month, value) => addDataPoint('discordGrowth', month, value)}
                  onUpdate={(index, month, value) => updateDataPoint('discordGrowth', index, month, value)}
                  onRemove={(index) => removeDataPoint('discordGrowth', index)}
                  type="monthly"
                  onImportComplete={() => loadDashboardData()}
                />
              )}

              {activeTab === 'discordMonth' && (
                <DiscordMonthActivitySection onImportComplete={() => loadDashboardData()} />
              )}

              {activeTab === 'discordActivity' && (
                <DiscordDailyActivitySection
                  title="Activité Discord quotidienne"
                  description="Données quotidiennes pour le graphique d'activité Discord (messages et vocaux)"
                  onImportComplete={() => loadDashboardData()}
                />
              )}

              {activeTab === 'spotlight' && (
                <DataSection
                  title="Progression Spotlight"
                  description="Données mensuelles pour le graphique de progression Spotlight"
                  data={dashboardData.spotlightProgression}
                  onAdd={(month, value) => addDataPoint('spotlightProgression', month, value)}
                  onUpdate={(index, month, value) => updateDataPoint('spotlightProgression', index, month, value)}
                  onRemove={(index) => removeDataPoint('spotlightProgression', index)}
                  type="monthly"
                />
              )}

              {activeTab === 'raidsReceived' && (
                <DataSection
                  title="Raids reçus"
                  description="Données mensuelles pour les raids reçus"
                  data={dashboardData.raidsReceived}
                  onAdd={(month, value) => addDataPoint('raidsReceived', month, value)}
                  onUpdate={(index, month, value) => updateDataPoint('raidsReceived', index, month, value)}
                  onRemove={(index) => removeDataPoint('raidsReceived', index)}
                  type="monthly"
                />
              )}

              {activeTab === 'raidsSent' && (
                <DataSection
                  title="Raids envoyés"
                  description="Données mensuelles pour les raids envoyés"
                  data={dashboardData.raidsSent}
                  onAdd={(month, value) => addDataPoint('raidsSent', month, value)}
                  onUpdate={(index, month, value) => updateDataPoint('raidsSent', index, month, value)}
                  onRemove={(index) => removeDataPoint('raidsSent', index)}
                  type="monthly"
                />
              )}

              {activeTab === 'vocal' && (
                <RankingSection
                  title="Classement vocal Discord"
                  description="Classement des membres par heures vocales"
                  data={dashboardData.vocalRanking}
                  onAdd={(member) => addRankingMember('vocalRanking', member)}
                  onUpdate={(index, member) => updateRankingMember('vocalRanking', index, member)}
                  onRemove={(index) => removeRankingMember('vocalRanking', index)}
                  valueLabel="Heures vocales"
                />
              )}

              {activeTab === 'text' && (
                <RankingSection
                  title="Classement texte Discord"
                  description="Classement des membres par nombre de messages"
                  data={dashboardData.textRanking}
                  onAdd={(member) => addRankingMember('textRanking', member)}
                  onUpdate={(index, member) => updateRankingMember('textRanking', index, member)}
                  onRemove={(index) => removeRankingMember('textRanking', index)}
                  valueLabel="Messages"
                  showProgression={true}
                />
              )}
            </div>
          </>
        )}

        {/* Informations de dernière mise à jour */}
        {dashboardData.lastUpdated && (
          <div className="mt-6 p-4 rounded-lg border text-sm" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Dernière mise à jour : {new Date(dashboardData.lastUpdated).toLocaleString('fr-FR')}
              {dashboardData.updatedBy && ` par ${dashboardData.updatedBy}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function previousMonthKey(date = new Date()): string {
  return monthKey(new Date(date.getFullYear(), date.getMonth() - 1, 1));
}

function completionPct(member: WorkflowMemberLite): number {
  const checks = [
    !!member.discordId,
    !!member.twitchId,
    !!member.integrationDate,
    member.onboardingStatus === "termine",
    member.profileValidationStatus === "valide",
  ];
  const ok = checks.filter(Boolean).length;
  return Math.round((ok / checks.length) * 100);
}

function MonthlyWorkflowSection() {
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);

  useEffect(() => {
    async function loadWorkflow() {
      try {
        setLoading(true);
        const currentMonth = monthKey();
        const evaluationMonth = previousMonthKey();
        const [
          membersRes,
          notesRes,
          followSummaryRes,
          vipMonthRes,
          staffApplicationsRes,
          profileValidationRes,
        ] = await Promise.all([
          fetch("/api/admin/members", { cache: "no-store" }),
          fetch(`/api/evaluations/synthesis/save?month=${evaluationMonth}`, { cache: "no-store" }),
          fetch(`/api/follow/summary/${currentMonth}`, { cache: "no-store" }),
          fetch(`/api/vip-month/save?month=${currentMonth}`, { cache: "no-store" }),
          fetch("/api/staff-applications", { cache: "no-store" }),
          fetch("/api/admin/members/profile-validation", { cache: "no-store" }),
        ]);

        let incomplete = 0;
        let communityMonthCount = 0;
        let finalNotesCount = 0;
        let followOverdueStaffNames: string[] = [];
        let vipMonthCount = 0;
        let staffApplicationsPendingCount = 0;
        let staffApplicationsRedFlagCount = 0;
        let profileValidationPendingCount = 0;

        if (membersRes.ok) {
          const membersData = await membersRes.json();
          const members = (membersData.members || []) as WorkflowMemberLite[];
          const activeMembers = members.filter((m) => m.isActive !== false);
          incomplete = activeMembers.filter((m) => completionPct(m) < 80).length;
          communityMonthCount = activeMembers.filter(
            (m) => Array.isArray(m.badges) && m.badges.includes("Contributeur TENF du Mois")
          ).length;
        }

        if (notesRes.ok) {
          const notesData = await notesRes.json();
          const finalNotes = notesData.finalNotes || {};
          finalNotesCount = Object.keys(finalNotes).length;
        }

        if (followSummaryRes.ok) {
          const followSummaryData = await followSummaryRes.json();
          const summary = (followSummaryData.summary || []) as WorkflowFollowSummaryItem[];
          followOverdueStaffNames = summary
            .filter((item) => item.status === "obsolete")
            .map((item) => item.staffName);
        }

        if (vipMonthRes.ok) {
          const vipMonthData = await vipMonthRes.json();
          const vipLogins = Array.isArray(vipMonthData?.vipLogins) ? vipMonthData.vipLogins : [];
          vipMonthCount = vipLogins.length;
        }

        if (staffApplicationsRes.ok) {
          const applicationsData = await staffApplicationsRes.json();
          const applications = (applicationsData.applications || []) as Array<{
            admin_status: "nouveau" | "a_contacter" | "entretien_prevu" | "accepte" | "refuse" | "archive";
            has_red_flag?: boolean;
          }>;
          const pendingStatuses = new Set(["nouveau", "a_contacter", "entretien_prevu"]);
          staffApplicationsPendingCount = applications.filter((app) => pendingStatuses.has(app.admin_status)).length;
          staffApplicationsRedFlagCount = applications.filter((app) => app.has_red_flag).length;
        }

        if (profileValidationRes.ok) {
          const profileValidationData = await profileValidationRes.json();
          profileValidationPendingCount = (profileValidationData.pending || []).length;
        }

        const overduePreview =
          followOverdueStaffNames.length > 3
            ? `${followOverdueStaffNames.slice(0, 3).join(", ")} +${followOverdueStaffNames.length - 3}`
            : followOverdueStaffNames.join(", ");

        setSteps([
          {
            id: "members_quality",
            label: "Qualité des fiches membres",
            href: "/admin/membres/incomplets",
            status: incomplete === 0 ? "done" : incomplete < 10 ? "in_progress" : "todo",
            helper: `${incomplete} incomplets`,
          },
          {
            id: "evaluation_monthly",
            label: "Évaluation mensuelle",
            href: "/admin/evaluation/d",
            status: finalNotesCount > 0 ? "done" : "todo",
            helper: `${finalNotesCount} note(s) manuelle(s)`,
          },
          {
            id: "vip_month",
            label: "VIP du mois",
            href: "/admin/membres/vip",
            status: vipMonthCount > 0 ? "done" : "todo",
            helper: `${vipMonthCount} VIP validé(s)`,
          },
          {
            id: "community_month",
            label: "Communauté du mois",
            href: "/admin/membres/badges",
            status: communityMonthCount > 0 ? "done" : "todo",
            helper: `${communityMonthCount} contributeur(s) du mois`,
          },
          {
            id: "follow",
            label: "Suivi des follows",
            href: "/admin/follow",
            status: followOverdueStaffNames.length === 0 ? "done" : "in_progress",
            helper:
              followOverdueStaffNames.length === 0
                ? "Aucun retard > 30 jours"
                : `${followOverdueStaffNames.length} en retard > 30 jours: ${overduePreview}`,
          },
          {
            id: "staff_applications",
            label: "Postulations staff",
            href: "/admin/membres/postulations",
            status: staffApplicationsPendingCount === 0 ? "done" : "todo",
            helper: `${staffApplicationsPendingCount} à traiter${staffApplicationsRedFlagCount > 0 ? ` · ${staffApplicationsRedFlagCount} red flag` : ""}`,
          },
          {
            id: "profile_validation",
            label: "Validation profils",
            href: "/admin/membres/validation-profil",
            status: profileValidationPendingCount === 0 ? "done" : "todo",
            helper: `${profileValidationPendingCount} demande(s)`,
          },
        ]);
      } catch (error) {
        console.error("Erreur chargement workflow mensuel (gestion):", error);
        setSteps([]);
      } finally {
        setLoading(false);
      }
    }

    loadWorkflow();
  }, []);

  const statusStyle = (status: WorkflowStep["status"]): { bg: string; color: string; border: string } => {
    if (status === "done") return { bg: "#10b98120", color: "#10b981", border: "#10b98140" };
    if (status === "in_progress") return { bg: "#3b82f620", color: "#60a5fa", border: "#3b82f640" };
    return { bg: "#6b728020", color: "#9ca3af", border: "#6b728040" };
  };

  return (
    <div className="mb-6 p-6 rounded-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>Workflow mensuel</h3>
        <Link
          href="/admin/dashboard2"
          className="text-sm font-medium hover:underline"
          style={{ color: 'var(--color-primary)' }}
        >
          Ouvrir le dashboard v2
        </Link>
      </div>

      {loading ? (
        <div className="py-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Chargement du workflow...
        </div>
      ) : (
        <div className="space-y-3">
          {steps.map((step) => {
            const style = statusStyle(step.status);
            return (
              <Link
                key={step.id}
                href={step.href}
                className="flex items-center justify-between p-3 rounded-lg border transition-colors"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
              >
                <div>
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>{step.label}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{step.helper}</p>
                </div>
                <span
                  className="px-2 py-1 rounded-full text-xs border"
                  style={{ backgroundColor: style.bg, color: style.color, borderColor: style.border }}
                >
                  {step.status === "done" ? "Terminé" : step.status === "in_progress" ? "En cours" : "À faire"}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DiscordMonthActivitySection({
  onImportComplete,
}: {
  onImportComplete: () => void;
}) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showMessagesImport, setShowMessagesImport] = useState(false);
  const [showVocalsImport, setShowVocalsImport] = useState(false);
  const [stats, setStats] = useState<{
    totalMessages: number;
    totalVoiceHours: number;
    topMessages: Array<{ rank: number; displayName: string; messages: number }>;
    topVocals: Array<{ rank: number; displayName: string; display: string }>;
  }>({
    totalMessages: 0,
    totalVoiceHours: 0,
    topMessages: [],
    topVocals: [],
  });

  async function loadMonthStats(targetMonth: string) {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/discord-activity/data?month=${targetMonth}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Erreur chargement stats Discord du mois");
      const payload = await response.json();
      const data = payload?.data || {};
      setStats({
        totalMessages: data.totalMessages || 0,
        totalVoiceHours: data.totalVoiceHours || 0,
        topMessages: data.topMessages || [],
        topVocals: data.topVocals || [],
      });
    } catch (error) {
      console.error("Erreur chargement activité Discord mensuelle:", error);
      setStats({
        totalMessages: 0,
        totalVoiceHours: 0,
        topMessages: [],
        topVocals: [],
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMonthStats(month);
  }, [month]);

  async function handleImportMessages(data: Record<string, number>) {
    setImporting(true);
    try {
      const response = await fetch("/api/admin/discord-activity/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          type: "messages",
          data,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur lors de l'import des messages");
      }
      await loadMonthStats(month);
      onImportComplete();
      setShowMessagesImport(false);
    } catch (error) {
      console.error("Erreur import messages mensuels:", error);
      alert(error instanceof Error ? error.message : "Erreur lors de l'import des messages");
    } finally {
      setImporting(false);
    }
  }

  async function handleImportVocals(
    data: Record<string, { hoursDecimal: number; totalMinutes: number; display: string }>
  ) {
    setImporting(true);
    try {
      const response = await fetch("/api/admin/discord-activity/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          type: "vocals",
          data,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur lors de l'import des vocaux");
      }
      await loadMonthStats(month);
      onImportComplete();
      setShowVocalsImport(false);
    } catch (error) {
      console.error("Erreur import vocaux mensuels:", error);
      alert(error instanceof Error ? error.message : "Erreur lors de l'import des vocaux");
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <div className="p-6 rounded-lg border" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--color-text)" }}>
              Activité Discord du mois
            </h3>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Importez les classements mensuels Discord (messages et heures vocales)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="discord-month-picker" className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Mois :
            </label>
            <input
              id="discord-month-picker"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2 rounded border text-sm"
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium" style={{ color: "var(--color-text)" }}>Messages</h4>
              <button
                onClick={() => setShowMessagesImport(true)}
                disabled={importing}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                📋 Importer Messages
              </button>
            </div>
            <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
              {loading ? "..." : stats.totalMessages.toLocaleString("fr-FR")}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
              Top 5 messages du mois sélectionné
            </p>
            <div className="mt-3 space-y-1.5">
              {stats.topMessages.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Aucune donnée disponible</p>
              ) : (
                stats.topMessages.slice(0, 5).map((item) => (
                  <div key={`month-msg-${item.rank}-${item.displayName}`} className="flex items-center justify-between text-sm">
                    <span style={{ color: "var(--color-text)" }}>#{item.rank} {item.displayName}</span>
                    <span style={{ color: "var(--color-text-secondary)" }}>{item.messages.toLocaleString("fr-FR")}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-4 rounded-lg border" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium" style={{ color: "var(--color-text)" }}>Vocaux</h4>
              <button
                onClick={() => setShowVocalsImport(true)}
                disabled={importing}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                📋 Importer Vocaux
              </button>
            </div>
            <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
              {loading ? "..." : stats.totalVoiceHours.toFixed(1)}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
              Heures vocales totales du mois sélectionné
            </p>
            <div className="mt-3 space-y-1.5">
              {stats.topVocals.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Aucune donnée disponible</p>
              ) : (
                stats.topVocals.slice(0, 5).map((item) => (
                  <div key={`month-voc-${item.rank}-${item.displayName}`} className="flex items-center justify-between text-sm">
                    <span style={{ color: "var(--color-text)" }}>#{item.rank} {item.displayName}</span>
                    <span style={{ color: "var(--color-text-secondary)" }}>{item.display}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <DiscordMessagesImportModal
        isOpen={showMessagesImport}
        onClose={() => setShowMessagesImport(false)}
        onImport={handleImportMessages}
        month={month}
      />

      <DiscordVocalsImportModal
        isOpen={showVocalsImport}
        onClose={() => setShowVocalsImport(false)}
        onImport={handleImportVocals}
        month={month}
      />
    </>
  );
}

// Composant spécialisé pour l'activité Discord quotidienne avec import
function DiscordDailyActivitySection({
  title,
  description,
  onImportComplete,
}: {
  title: string;
  description: string;
  onImportComplete: () => void;
}) {
  const [showMessagesImport, setShowMessagesImport] = useState(false);
  const [showVocalsImport, setShowVocalsImport] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleImportMessages = async (data: Array<{ date: string; value: number }>) => {
    setImporting(true);
    try {
      const response = await fetch('/api/admin/discord-daily-activity/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'messages', data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'import');
      }

      await onImportComplete();
      setShowMessagesImport(false);
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'import');
    } finally {
      setImporting(false);
    }
  };

  const handleImportVocals = async (data: Array<{ date: string; value: number }>) => {
    setImporting(true);
    try {
      const response = await fetch('/api/admin/discord-daily-activity/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'vocals', data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'import');
      }

      await onImportComplete();
      setShowVocalsImport(false);
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'import');
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <div className="p-6 rounded-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text)' }}>{title}</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{description}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium" style={{ color: 'var(--color-text)' }}>Messages</h4>
              <button
                onClick={() => setShowMessagesImport(true)}
                disabled={importing}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                📋 Importer Messages
              </button>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Importez les données quotidiennes de messages Discord (format: Date ISO + Nombre)
            </p>
          </div>

          <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium" style={{ color: 'var(--color-text)' }}>Vocaux</h4>
              <button
                onClick={() => setShowVocalsImport(true)}
                disabled={importing}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                📋 Importer Vocaux
              </button>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Importez les données quotidiennes de vocaux Discord (format: Date ISO + Heures décimales)
            </p>
          </div>
        </div>
      </div>

      <DiscordDailyActivityImportModal
        isOpen={showMessagesImport}
        onClose={() => setShowMessagesImport(false)}
        onImport={handleImportMessages}
        type="messages"
      />

      <DiscordDailyActivityImportModal
        isOpen={showVocalsImport}
        onClose={() => setShowVocalsImport(false)}
        onImport={handleImportVocals}
        type="vocals"
      />
    </>
  );
}

// Composant spécialisé pour la croissance Discord avec import
function DiscordGrowthSection({
  title,
  description,
  data,
  onAdd,
  onUpdate,
  onRemove,
  type,
  onImportComplete,
}: {
  title: string;
  description: string;
  data: MonthlyDataPoint[];
  onAdd: (month: string, value: number) => void;
  onUpdate: (index: number, month: string, value: number) => void;
  onRemove: (index: number) => void;
  type: "monthly";
  onImportComplete: () => void;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newMonth, setNewMonth] = useState("");
  const [newValue, setNewValue] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleAdd = () => {
    if (newMonth && newValue) {
      onAdd(newMonth, parseInt(newValue) || 0);
      setNewMonth("");
      setNewValue("");
    }
  };

  const handleImport = async (importData: Array<{ date: string; members: number; avg21?: number | null }>) => {
    setImporting(true);
    try {
      const response = await fetch('/api/admin/dashboard/discord-growth/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: importData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'import');
      }

      await onImportComplete();
      setShowImportModal(false);
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'import');
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <div className="p-6 rounded-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text)' }}>{title}</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{description}</p>
          </div>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            📋 Importer (copier-coller)
          </button>
        </div>

      {/* Liste des données */}
      <div className="space-y-2 mb-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-4 p-3 rounded border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            {editingIndex === index ? (
              <>
                <select
                  value={item.month}
                  onChange={(e) => onUpdate(index, e.target.value, item.value)}
                  className="px-3 py-1 rounded border text-sm"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  {MONTHS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={item.value}
                  onChange={(e) => onUpdate(index, item.month, parseInt(e.target.value) || 0)}
                  className="flex-1 px-3 py-1 rounded border text-sm"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
                <button
                  onClick={() => setEditingIndex(null)}
                  className="px-3 py-1 rounded text-sm text-white"
                  style={{ backgroundColor: '#10b981' }}
                >
                  ✓
                </button>
              </>
            ) : (
              <>
                <span className="font-medium w-16" style={{ color: 'var(--color-text)' }}>{item.month}</span>
                <span className="flex-1" style={{ color: 'var(--color-text-secondary)' }}>{item.value}</span>
                <button
                  onClick={() => setEditingIndex(index)}
                  className="px-3 py-1 rounded text-sm text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  Modifier
                </button>
                <button
                  onClick={() => onRemove(index)}
                  className="px-3 py-1 rounded text-sm text-white"
                  style={{ backgroundColor: '#dc2626' }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Ajouter une nouvelle entrée */}
      <div className="flex items-center gap-4 p-3 rounded border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <select
          value={newMonth}
          onChange={(e) => setNewMonth(e.target.value)}
          className="px-3 py-1 rounded border text-sm"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        >
          <option value="">Sélectionner un mois</option>
          {MONTHS.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input
          type="number"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Valeur"
          className="flex-1 px-3 py-1 rounded border text-sm"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        />
        <button
          onClick={handleAdd}
          disabled={!newMonth || !newValue}
          className="px-4 py-1 rounded text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>
      </div>

      <DiscordGrowthImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />
    </>
  );
}

// Composant pour les sections de données mensuelles
function DataSection({
  title,
  description,
  data,
  onAdd,
  onUpdate,
  onRemove,
  type,
}: {
  title: string;
  description: string;
  data: MonthlyDataPoint[];
  onAdd: (month: string, value: number) => void;
  onUpdate: (index: number, month: string, value: number) => void;
  onRemove: (index: number) => void;
  type: "monthly";
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newMonth, setNewMonth] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleAdd = () => {
    if (newMonth && newValue) {
      onAdd(newMonth, parseInt(newValue) || 0);
      setNewMonth("");
      setNewValue("");
    }
  };

  return (
    <div className="p-6 rounded-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text)' }}>{title}</h3>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{description}</p>
      </div>

      {/* Liste des données */}
      <div className="space-y-2 mb-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-4 p-3 rounded border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            {editingIndex === index ? (
              <>
                <select
                  value={item.month}
                  onChange={(e) => onUpdate(index, e.target.value, item.value)}
                  className="px-3 py-1 rounded border text-sm"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  {MONTHS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={item.value}
                  onChange={(e) => onUpdate(index, item.month, parseInt(e.target.value) || 0)}
                  className="flex-1 px-3 py-1 rounded border text-sm"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
                <button
                  onClick={() => setEditingIndex(null)}
                  className="px-3 py-1 rounded text-sm text-white"
                  style={{ backgroundColor: '#10b981' }}
                >
                  ✓
                </button>
              </>
            ) : (
              <>
                <span className="font-medium w-16" style={{ color: 'var(--color-text)' }}>{item.month}</span>
                <span className="flex-1" style={{ color: 'var(--color-text-secondary)' }}>{item.value}</span>
                <button
                  onClick={() => setEditingIndex(index)}
                  className="px-3 py-1 rounded text-sm text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  Modifier
                </button>
                <button
                  onClick={() => onRemove(index)}
                  className="px-3 py-1 rounded text-sm text-white"
                  style={{ backgroundColor: '#dc2626' }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Ajouter une nouvelle entrée */}
      <div className="flex items-center gap-4 p-3 rounded border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <select
          value={newMonth}
          onChange={(e) => setNewMonth(e.target.value)}
          className="px-3 py-1 rounded border text-sm"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        >
          <option value="">Sélectionner un mois</option>
          {MONTHS.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input
          type="number"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Valeur"
          className="flex-1 px-3 py-1 rounded border text-sm"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        />
        <button
          onClick={handleAdd}
          disabled={!newMonth || !newValue}
          className="px-4 py-1 rounded text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>
    </div>
  );
}

// Composant pour les sections de ranking
function RankingSection({
  title,
  description,
  data,
  onAdd,
  onUpdate,
  onRemove,
  valueLabel,
  showProgression = false,
}: {
  title: string;
  description: string;
  data: RankingMember[];
  onAdd: (member: RankingMember) => void;
  onUpdate: (index: number, member: RankingMember) => void;
  onRemove: (index: number) => void;
  valueLabel: string;
  showProgression?: boolean;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [newAvatar, setNewAvatar] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newProgression, setNewProgression] = useState("");

  const handleAdd = () => {
    if (newName && newAvatar && newValue) {
      onAdd({
        id: Date.now(),
        name: newName,
        avatar: newAvatar,
        value: parseInt(newValue) || 0,
        ...(showProgression && newProgression ? { progression: newProgression } : {}),
      });
      setNewName("");
      setNewAvatar("");
      setNewValue("");
      setNewProgression("");
    }
  };

  return (
    <div className="p-6 rounded-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text)' }}>{title}</h3>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{description}</p>
      </div>

      {/* Liste des membres */}
      <div className="space-y-2 mb-4">
        {data.map((member, index) => (
          <div key={member.id || index} className="flex items-center gap-4 p-3 rounded border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            {editingIndex === index ? (
              <>
                <input
                  type="text"
                  value={member.name}
                  onChange={(e) => onUpdate(index, { ...member, name: e.target.value })}
                  placeholder="Nom"
                  className="flex-1 px-3 py-1 rounded border text-sm"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
                <input
                  type="text"
                  value={member.avatar}
                  onChange={(e) => onUpdate(index, { ...member, avatar: e.target.value })}
                  placeholder="URL Avatar"
                  className="flex-1 px-3 py-1 rounded border text-sm"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
                <input
                  type="number"
                  value={member.value}
                  onChange={(e) => onUpdate(index, { ...member, value: parseInt(e.target.value) || 0 })}
                  placeholder={valueLabel}
                  className="w-32 px-3 py-1 rounded border text-sm"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
                {showProgression && (
                  <input
                    type="text"
                    value={member.progression || ""}
                    onChange={(e) => onUpdate(index, { ...member, progression: e.target.value })}
                    placeholder="Progression"
                    className="w-24 px-3 py-1 rounded border text-sm"
                    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                )}
                <button
                  onClick={() => setEditingIndex(null)}
                  className="px-3 py-1 rounded text-sm text-white"
                  style={{ backgroundColor: '#10b981' }}
                >
                  ✓
                </button>
              </>
            ) : (
              <>
                <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full" />
                <span className="font-medium flex-1" style={{ color: 'var(--color-text)' }}>{member.name}</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{member.value} {valueLabel.toLowerCase()}</span>
                {showProgression && member.progression && (
                  <span className="px-2 py-1 rounded text-xs" style={{ 
                    backgroundColor: member.progression.startsWith('+') ? '#10b98120' : '#dc262620',
                    color: member.progression.startsWith('+') ? '#10b981' : '#dc2626'
                  }}>
                    {member.progression}
                  </span>
                )}
                <button
                  onClick={() => setEditingIndex(index)}
                  className="px-3 py-1 rounded text-sm text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  Modifier
                </button>
                <button
                  onClick={() => onRemove(index)}
                  className="px-3 py-1 rounded text-sm text-white"
                  style={{ backgroundColor: '#dc2626' }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Ajouter un nouveau membre */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 rounded border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nom"
          className="px-3 py-1 rounded border text-sm"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        />
        <input
          type="text"
          value={newAvatar}
          onChange={(e) => setNewAvatar(e.target.value)}
          placeholder="URL Avatar"
          className="px-3 py-1 rounded border text-sm"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        />
        <input
          type="number"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder={valueLabel}
          className="px-3 py-1 rounded border text-sm"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        />
        {showProgression && (
          <input
            type="text"
            value={newProgression}
            onChange={(e) => setNewProgression(e.target.value)}
            placeholder="Progression (ex: +3)"
            className="px-3 py-1 rounded border text-sm"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          />
        )}
        <button
          onClick={handleAdd}
          disabled={!newName || !newAvatar || !newValue}
          className="col-span-2 md:col-span-1 px-4 py-1 rounded text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>
    </div>
  );
}

