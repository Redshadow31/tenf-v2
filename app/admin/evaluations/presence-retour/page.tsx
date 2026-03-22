"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { X, UserPlus, CheckCircle2, RefreshCw, ArrowRight, Activity, UserMinus, Plus } from "lucide-react";

type Integration = {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  isPublished: boolean;
};

type IntegrationRegistration = {
  id: string;
  integrationId: string;
  twitchLogin: string;
  twitchChannelUrl: string;
  displayName: string;
  discordId?: string;
  discordUsername?: string;
  parrain?: string;
  registeredAt: string;
  notes?: string;
  present?: boolean;
};

type MemberForIntegrate = {
  id: string;
  twitchLogin: string;
  twitchChannelUrl: string;
  displayName: string;
  discordId?: string;
  discordUsername?: string;
  parrain?: string;
  notes?: string;
};

type EditableMember = {
  member: MemberForIntegrate;
  role: "Affilié" | "Développement";
  included: boolean;
};

type ApiMember = {
  twitchLogin?: string;
  twitchUrl?: string;
  displayName?: string;
  discordId?: string;
  discordUsername?: string;
  role?: string;
  parrain?: string;
};

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";

function toMemberForIntegrate(reg: IntegrationRegistration): MemberForIntegrate {
  return {
    id: reg.id,
    twitchLogin: reg.twitchLogin,
    twitchChannelUrl: reg.twitchChannelUrl,
    displayName: reg.displayName || reg.discordUsername || "",
    discordId: reg.discordId,
    discordUsername: reg.discordUsername,
    parrain: reg.parrain,
    notes: reg.notes,
  };
}

export default function PresenceRetourPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<Record<string, IntegrationRegistration[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [editableMembers, setEditableMembers] = useState<EditableMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [integrating, setIntegrating] = useState(false);
  const [nouveauxMembers, setNouveauxMembers] = useState<ApiMember[]>([]);
  const [loadingNouveaux, setLoadingNouveaux] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [addMode, setAddMode] = useState<"manual" | "nouveau">("nouveau");
  const [manualForm, setManualForm] = useState({
    displayName: "",
    twitchLogin: "",
    twitchChannelUrl: "",
    parrain: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger toutes les intégrations
      const response = await fetch("/api/integrations?admin=true", {
        cache: 'no-store',
      });
      
      if (response.ok) {
        const data = await response.json();
        const integrationsList = (data.integrations || []).filter((i: Integration) => i.isPublished);
        
        // Charger les inscriptions pour chaque intégration
        const registrationsMap: Record<string, IntegrationRegistration[]> = {};
        for (const integration of integrationsList) {
          const regResponse = await fetch(`/api/admin/integrations/${integration.id}/registrations`, {
            cache: 'no-store',
          });
          if (regResponse.ok) {
            const regData = await regResponse.json();
            registrationsMap[integration.id] = regData.registrations || [];
          }
        }
        setAllRegistrations(registrationsMap);
        
        // Filtrer uniquement les réunions où les présences ont été validées (au moins une présence enregistrée)
        const validatedIntegrations = integrationsList.filter((integration: Integration) => {
          const registrations = registrationsMap[integration.id] || [];
          // Une réunion est validée si au moins une présence a été enregistrée (present === true ou false)
          return registrations.some(reg => reg.present !== undefined);
        });
        
        // Trier par date (les plus proches en premier)
        validatedIntegrations.sort((a: Integration, b: Integration) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        
        setIntegrations(validatedIntegrations);
      }
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (integration: Integration) => {
    setSelectedIntegration(integration);
    const registrations = allRegistrations[integration.id] || [];
    const presentOnly = registrations.filter((reg) => reg.present === true);
    setEditableMembers(
      presentOnly.map((reg) => ({
        member: toMemberForIntegrate(reg),
        role: "Affilié" as const,
        included: true,
      }))
    );
    setShowAddSection(false);
    setManualForm({ displayName: "", twitchLogin: "", twitchChannelUrl: "", parrain: "" });
    setIsModalOpen(true);
  };

  const includedCount = editableMembers.filter((e) => e.included).length;

  const updateMember = (idx: number, updates: Partial<EditableMember>) => {
    setEditableMembers((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ...updates } : item))
    );
  };

  const removeMember = (idx: number) => {
    setEditableMembers((prev) => prev.filter((_, i) => i !== idx));
  };

  const loadNouveauxMembers = async () => {
    setLoadingNouveaux(true);
    try {
      const res = await fetch("/api/admin/members", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const members: ApiMember[] = data.members || [];
        const nouveaux = members.filter((m) => String(m.role || "").toLowerCase() === "nouveau");
        setNouveauxMembers(nouveaux);
      }
    } catch {
      setNouveauxMembers([]);
    } finally {
      setLoadingNouveaux(false);
    }
  };

  const addFromNouveau = (m: ApiMember) => {
    const login = (m.twitchLogin || "").toLowerCase();
    const displayName = m.displayName || m.discordUsername || login;
    if (!login || !displayName) return;
    if (editableMembers.some((e) => e.member.twitchLogin.toLowerCase() === login)) return;
    const newMember: MemberForIntegrate = {
      id: `nouveau_${login}_${Date.now()}`,
      twitchLogin: login,
      twitchChannelUrl: m.twitchUrl || `https://www.twitch.tv/${login}`,
      displayName,
      discordId: m.discordId,
      discordUsername: m.discordUsername,
      parrain: m.parrain,
    };
    setEditableMembers((prev) => [
      ...prev,
      { member: newMember, role: "Affilié" as const, included: true },
    ]);
  };

  const addManual = () => {
    const displayName = manualForm.displayName.trim();
    const twitchLogin = manualForm.twitchLogin.trim().toLowerCase();
    if (!displayName || !twitchLogin) return;
    if (editableMembers.some((e) => e.member.twitchLogin.toLowerCase() === twitchLogin)) return;
    const url = manualForm.twitchChannelUrl.trim() || `https://www.twitch.tv/${twitchLogin}`;
    const newMember: MemberForIntegrate = {
      id: `manual_${twitchLogin}_${Date.now()}`,
      twitchLogin,
      twitchChannelUrl: url.startsWith("http") ? url : `https://www.twitch.tv/${twitchLogin}`,
      displayName,
      parrain: manualForm.parrain.trim() || undefined,
    };
    setEditableMembers((prev) => [
      ...prev,
      { member: newMember, role: "Affilié" as const, included: true },
    ]);
    setManualForm({ displayName: "", twitchLogin: "", twitchChannelUrl: "", parrain: "" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPresentCount = (integrationId: string) => {
    const registrations = allRegistrations[integrationId] || [];
    return registrations.filter(reg => reg.present === true).length;
  };

  const getTotalCount = (integrationId: string) => {
    return allRegistrations[integrationId]?.length || 0;
  };

  const futureIntegrations = useMemo(() => {
    const now = Date.now();
    return integrations.filter((i) => new Date(i.date).getTime() >= now);
  }, [integrations]);

  const pastIntegrations = useMemo(() => {
    const now = Date.now();
    return integrations.filter((i) => new Date(i.date).getTime() < now);
  }, [integrations]);

  const stats = useMemo(() => {
    const totalSessions = integrations.length;
    const totalRegistrations = Object.values(allRegistrations).reduce((sum, regs) => sum + regs.length, 0);
    const totalPresent = Object.values(allRegistrations)
      .flat()
      .filter((reg) => reg.present === true).length;
    const totalAbsent = Object.values(allRegistrations)
      .flat()
      .filter((reg) => reg.present === false).length;
    const attendanceRate = totalPresent + totalAbsent > 0
      ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100)
      : 0;
    return { totalSessions, totalRegistrations, totalPresent, totalAbsent, attendanceRate };
  }, [integrations, allRegistrations]);

  const handleIntegrateMembers = async () => {
    const toIntegrate = editableMembers.filter((e) => e.included);
    if (!selectedIntegration || toIntegrate.length === 0) return;

    if (
      !confirm(
        `Êtes-vous sûr de vouloir intégrer ${toIntegrate.length} membre(s) au site et Discord ? Rôle et date d'intégration seront appliqués.`
      )
    ) {
      return;
    }

    const integrationDate = selectedIntegration.date
      ? new Date(selectedIntegration.date).toISOString().slice(0, 10)
      : undefined;

    try {
      setIntegrating(true);
      const response = await fetch("/api/admin/integrations/integrate-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrationId: selectedIntegration.id,
          members: toIntegrate.map(({ member, role }) => ({
            discordUsername: member.displayName || member.discordUsername,
            discordId: member.discordId,
            twitchLogin: member.twitchLogin,
            twitchChannelUrl: member.twitchChannelUrl,
            parrain: member.parrain,
            role,
            integrationDate,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(
          `✅ ${data.message || `${data.integrated || 0} membre(s) intégré(s) avec succès !`}`
        );
        await loadData();
        setIsModalOpen(false);
      } else {
        const error = await response.json();
        alert(`❌ Erreur: ${error.error || "Impossible d'intégrer les membres"}`);
      }
    } catch (error) {
      console.error("Erreur intégration membres:", error);
      alert("❌ Erreur lors de l'intégration");
    } finally {
      setIntegrating(false);
    }
  };

  return (
    <div className="space-y-6 p-8 text-white">
      <section className={`${glassCardClass} p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <Link
              href="/admin/onboarding"
              className="mb-3 inline-block text-sm text-slate-300 transition hover:text-white"
            >
              ← Retour à l'onboarding
            </Link>
            <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Onboarding · Présences</p>
            <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
              Présence et retours des sessions
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Contrôle les sessions validées, identifie les membres présents et lance l'intégration site/Discord en un flux unique.
            </p>
          </div>
          <button type="button" onClick={() => void loadData()} className={subtleButtonClass}>
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Sessions validées</p>
          <p className="mt-2 text-3xl font-semibold text-indigo-200">{stats.totalSessions}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Présents cumulés</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-300">{stats.totalPresent}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Absents cumulés</p>
          <p className="mt-2 text-3xl font-semibold text-rose-300">{stats.totalAbsent}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Taux de présence</p>
          <p className="mt-2 text-3xl font-semibold text-sky-300">{stats.attendanceRate}%</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_1fr]">
        <article className={`${sectionCardClass} p-5`}>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-sky-200" />
            <h2 className="text-lg font-semibold text-slate-100">Lecture rapide</h2>
          </div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2">
              <span className="text-slate-200">Sessions à venir validées</span>
              <span className="font-semibold text-sky-200">{futureIntegrations.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2">
              <span className="text-slate-200">Sessions passées validées</span>
              <span className="font-semibold text-indigo-200">{pastIntegrations.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2">
              <span className="text-slate-200">Inscriptions traitées</span>
              <span className="font-semibold text-emerald-200">{stats.totalRegistrations}</span>
            </div>
          </div>
        </article>
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Actions onboarding</h2>
          <div className="mt-3 space-y-2 text-sm">
            <p className="rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2 text-slate-200">
              Ouvre une session pour vérifier les présents avant intégration.
            </p>
            <p className="rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2 text-slate-200">
              Lance l'intégration groupée pour éviter les oublis.
            </p>
            <Link
              href="/admin/onboarding/inscriptions"
              className="inline-flex w-full items-center justify-between rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2 text-slate-100 hover:border-indigo-300/45"
            >
              Ouvrir les inscriptions
              <ArrowRight className="h-4 w-4 text-indigo-200" />
            </Link>
          </div>
        </article>
      </section>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#9146ff]"></div>
          <p className="text-gray-400 mt-4">Chargement des réunions validées...</p>
        </div>
      ) : integrations.length === 0 ? (
        <div className={`${sectionCardClass} p-6`}>
          <p className="text-gray-400 text-center">
            Aucune réunion avec présences validées pour le moment.
          </p>
        </div>
      ) : (
        <div className={`${sectionCardClass} overflow-hidden`}>
          <table className="w-full">
            <thead className="bg-[#0f1321] border-b border-[#353a50]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Réunion</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Inscrits</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Présents</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2f3448]">
              {integrations.map((integration) => {
                const presentCount = getPresentCount(integration.id);
                const totalCount = getTotalCount(integration.id);
                
                return (
                  <tr
                    key={integration.id}
                    className="hover:bg-[#1a2132] transition-colors cursor-pointer"
                    onClick={() => handleOpenModal(integration)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{integration.title}</div>
                      {integration.category && (
                        <div className="text-sm text-gray-400 mt-1">{integration.category}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {formatDate(integration.date)}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-300">
                      {totalCount}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-green-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-medium">{presentCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(integration);
                        }}
                        className="rounded-lg border border-indigo-300/35 bg-indigo-500/20 px-3 py-1.5 text-indigo-100 transition hover:bg-indigo-500/30 text-sm font-medium"
                      >
                        Voir les présents
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal des membres présents */}
      {isModalOpen && selectedIntegration && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="card relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-[#353a50] bg-[#141927]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton fermer */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 z-10 rounded-lg border border-[#353a50] bg-[#0f1321] p-2 text-gray-400 transition-colors hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>

            {/* En-tête */}
            <div className="p-6 border-b border-[#353a50]">
              <h2 className="text-2xl font-bold text-white mb-2">{selectedIntegration.title}</h2>
              <p className="text-gray-400">
                {formatDate(selectedIntegration.date)} • {editableMembers.length} dans la liste,{" "}
                {includedCount} à intégrer
              </p>
            </div>

            {/* Bouton d'intégration */}
            {includedCount > 0 && (
              <div className="p-6 border-b border-[#353a50] bg-green-950/20">
                <button
                  onClick={handleIntegrateMembers}
                  disabled={integrating}
                  className="flex items-center gap-2 rounded-lg border border-emerald-300/35 bg-emerald-500/20 px-6 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30 disabled:opacity-50"
                >
                  <UserPlus className="w-5 h-5" />
                  {integrating
                    ? "Intégration..."
                    : `Intégrer ${includedCount} membre(s) (rôle + statut actif + date d'intégration)`}
                </button>
                <p className="text-sm text-gray-400 mt-2">
                  Les membres cochés seront activés avec le rôle choisi et la date d'intégration
                  enregistrée dans la gestion.
                </p>
              </div>
            )}

            {/* Section Ajouter un membre */}
            <div className="p-6 border-b border-[#353a50]">
              <button
                type="button"
                onClick={() => {
                  setShowAddSection((s) => !s);
                  if (!showAddSection && addMode === "nouveau") void loadNouveauxMembers();
                }}
                className="flex items-center gap-2 rounded-lg border border-indigo-300/35 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-100 transition hover:bg-indigo-500/20"
              >
                <Plus className="h-4 w-4" />
                {showAddSection ? "Masquer" : "Ajouter un membre"}
              </button>
              {showAddSection && (
                <div className="mt-4 space-y-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAddMode("nouveau");
                        void loadNouveauxMembers();
                      }}
                      className={`rounded-lg px-3 py-2 text-sm font-medium ${
                        addMode === "nouveau"
                          ? "bg-indigo-500/30 text-indigo-100"
                          : "bg-[#0f1321] text-gray-400 hover:text-white"
                      }`}
                    >
                      Sélectionner parmi les Nouveaux
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddMode("manual")}
                      className={`rounded-lg px-3 py-2 text-sm font-medium ${
                        addMode === "manual"
                          ? "bg-indigo-500/30 text-indigo-100"
                          : "bg-[#0f1321] text-gray-400 hover:text-white"
                      }`}
                    >
                      Ajouter manuellement
                    </button>
                  </div>
                  {addMode === "nouveau" && (
                    <div>
                      {loadingNouveaux ? (
                        <p className="text-gray-400 text-sm">Chargement des membres Nouveau...</p>
                      ) : nouveauxMembers.length === 0 ? (
                        <p className="text-gray-400 text-sm">Aucun membre avec le rôle Nouveau.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {nouveauxMembers.map((m) => {
                            const login = (m.twitchLogin || "").toLowerCase();
                            const label = m.displayName || m.discordUsername || login;
                            const already = editableMembers.some(
                              (e) => e.member.twitchLogin.toLowerCase() === login
                            );
                            return (
                              <button
                                key={login}
                                type="button"
                                onClick={() => addFromNouveau(m)}
                                disabled={already}
                                className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                                  already
                                    ? "border-gray-600 bg-gray-800/50 text-gray-500 cursor-not-allowed"
                                    : "border-indigo-400/40 bg-indigo-500/15 text-indigo-200 hover:bg-indigo-500/25"
                                }`}
                              >
                                {label} {already && "(déjà ajouté)"}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  {addMode === "manual" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Pseudo Discord *"
                        value={manualForm.displayName}
                        onChange={(e) =>
                          setManualForm((f) => ({ ...f, displayName: e.target.value }))
                        }
                        className="rounded-lg border border-[#353a50] bg-[#0f1321] px-3 py-2 text-white placeholder-gray-500"
                      />
                      <input
                        type="text"
                        placeholder="Pseudo Twitch *"
                        value={manualForm.twitchLogin}
                        onChange={(e) =>
                          setManualForm((f) => ({ ...f, twitchLogin: e.target.value }))
                        }
                        className="rounded-lg border border-[#353a50] bg-[#0f1321] px-3 py-2 text-white placeholder-gray-500"
                      />
                      <input
                        type="text"
                        placeholder="Lien chaîne Twitch"
                        value={manualForm.twitchChannelUrl}
                        onChange={(e) =>
                          setManualForm((f) => ({ ...f, twitchChannelUrl: e.target.value }))
                        }
                        className="rounded-lg border border-[#353a50] bg-[#0f1321] px-3 py-2 text-white placeholder-gray-500 md:col-span-2"
                      />
                      <input
                        type="text"
                        placeholder="Parrain TENF"
                        value={manualForm.parrain}
                        onChange={(e) =>
                          setManualForm((f) => ({ ...f, parrain: e.target.value }))
                        }
                        className="rounded-lg border border-[#353a50] bg-[#0f1321] px-3 py-2 text-white placeholder-gray-500 md:col-span-2"
                      />
                      <button
                        type="button"
                        onClick={addManual}
                        disabled={!manualForm.displayName.trim() || !manualForm.twitchLogin.trim()}
                        className="rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Ajouter à la liste
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Liste des membres */}
            <div className="p-6">
              {editableMembers.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  Aucun membre. Ajoutez-en ou vérifiez les présences de la session.
                </p>
              ) : (
                <div className="space-y-3">
                  {editableMembers.map((item, idx) => (
                    <div
                      key={item.member.id}
                      className={`rounded-lg p-4 border ${
                        item.included ? "border-green-500/30 bg-[#0f1321]" : "border-gray-600/50 bg-[#0f1321]/50 opacity-70"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 min-w-0">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Pseudo Discord</div>
                            <div className="text-white font-medium">
                              {item.member.displayName || item.member.discordUsername || "N/A"}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Lien Twitch</div>
                            <div className="text-white">
                              {item.member.twitchChannelUrl ? (
                                <a
                                  href={item.member.twitchChannelUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-300 hover:text-indigo-200 underline break-all"
                                >
                                  {item.member.twitchChannelUrl}
                                </a>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Parrain</div>
                            <div className="text-white font-medium">
                              {item.member.parrain || <span className="text-gray-400">N/A</span>}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Rôle à attribuer</div>
                            <select
                              value={item.role}
                              onChange={(e) =>
                                updateMember(idx, {
                                  role: e.target.value as "Affilié" | "Développement",
                                })
                              }
                              className="rounded-lg border border-[#353a50] bg-[#0f1321] px-3 py-2 text-sm text-white"
                            >
                              <option value="Affilié">Affilié</option>
                              <option value="Développement">Développement</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.included}
                              onChange={(e) => updateMember(idx, { included: e.target.checked })}
                              className="rounded border-gray-500"
                            />
                            Inclure
                          </label>
                          <button
                            type="button"
                            onClick={() => removeMember(idx)}
                            className="rounded-lg p-2 text-gray-400 hover:bg-rose-500/20 hover:text-rose-300 transition"
                            title="Retirer de la liste"
                          >
                            <UserMinus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {item.member.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <div className="text-xs text-gray-500 mb-1">Notes</div>
                          <div className="text-gray-300 text-sm">{item.member.notes}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
