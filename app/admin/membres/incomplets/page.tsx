"use client";

import { useState, useEffect, useMemo } from "react";
import { getDiscordUser } from "@/lib/discord";
import { isFounder } from "@/lib/adminRoles";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";

interface Member {
  twitchLogin: string;
  displayName: string;
  discordUsername?: string;
  discordId?: string;
  twitchId?: string;
  twitchUrl?: string;
  role: string;
  isActive: boolean;
  siteUsername?: string;
  description?: string;
}

interface IncompleteMember {
  member: Member;
  missingFields: string[];
  completionPercentage: number;
}

interface ErrorIssue {
  type: string;
  severity: "error" | "warning";
  member: Member;
  description: string;
  suggestion?: string;
}

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";

export default function IncompletsMembresPage() {
  const searchParams = useSearchParams();
  const [members, setMembers] = useState<Member[]>([]);
  const [incompleteMembers, setIncompleteMembers] = useState<IncompleteMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; username: string; isFounder: boolean } | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [errorFilterType, setErrorFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"completion" | "name">("completion");
  const [viewMode, setViewMode] = useState<"incomplets" | "erreurs">("incomplets");

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
          
          const isAdminRole = roleData.role === "Admin";
          const isAdminAdjoint = roleData.role === "Admin Adjoint";
          const founderStatus = isFounder(user.id);
          
          setCurrentAdmin({ 
            id: user.id, 
            username: user.username, 
            isFounder: founderStatus || isAdminRole || isAdminAdjoint 
          });
        } catch (err) {
          const founderStatus = isFounder(user.id);
          if (!founderStatus) {
            window.location.href = "/unauthorized";
            return;
          }
          setCurrentAdmin({ id: user.id, username: user.username, isFounder: founderStatus });
        }
      } else {
        window.location.href = "/auth/login?redirect=/admin/membres/incomplets";
      }
    }
    loadAdmin();
  }, []);

  useEffect(() => {
    if (currentAdmin !== null) {
      loadMembersAndDetectIncomplete();
    }
  }, [currentAdmin]);

  useEffect(() => {
    const mode = searchParams?.get("vue");
    if (mode === "erreurs") {
      setViewMode("erreurs");
    }
  }, [searchParams]);

  async function loadMembersAndDetectIncomplete() {
    try {
      setLoading(true);
      setRefreshing(true);
      const response = await fetch("/api/admin/members", {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (!response.ok) {
        console.error("Erreur lors du chargement des membres");
        return;
      }

      const data = await response.json();
      const membersData: Member[] = data.members || [];
      setMembers(membersData);

      // Détecter les comptes incomplets
      const incomplete: IncompleteMember[] = [];

      for (const member of membersData) {
        const missingFields: string[] = [];
        
        // Champs essentiels
        if (!member.twitchLogin || member.twitchLogin.trim() === "") {
          missingFields.push("Twitch");
        }
        if (!member.discordId) {
          missingFields.push("Discord");
        }
        if (!member.twitchId) {
          missingFields.push("ID Twitch");
        }
        if (!member.displayName || member.displayName.trim() === "") {
          missingFields.push("Nom d'affichage");
        }

        // Champs optionnels mais importants
        if (!member.description) {
          missingFields.push("Description");
        }
        if (!member.siteUsername) {
          missingFields.push("Pseudo site");
        }

        // Calculer le pourcentage de complétion
        const totalFields = 6; // twitchLogin, discordId, twitchId, displayName, description, siteUsername
        const completedFields = totalFields - missingFields.length;
        const completionPercentage = Math.round((completedFields / totalFields) * 100);

        // Considérer comme incomplet si moins de 100% ou si des champs essentiels manquent
        if (completionPercentage < 100 || missingFields.some(f => ["Twitch", "Discord", "Nom d'affichage"].includes(f))) {
          incomplete.push({
            member,
            missingFields,
            completionPercentage,
          });
        }
      }

      // Trier par pourcentage de complétion
      incomplete.sort((a, b) => a.completionPercentage - b.completionPercentage);
      setIncompleteMembers(incomplete);
    } catch (error) {
      console.error("Erreur lors de la détection des comptes incomplets:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const filteredIncomplete = useMemo(
    () =>
      filterType === "all"
        ? incompleteMembers
        : incompleteMembers.filter((im) => im.missingFields.includes(filterType)),
    [filterType, incompleteMembers]
  );

  const sortedIncomplete = useMemo(
    () =>
      [...filteredIncomplete].sort((a, b) => {
        if (sortBy === "completion") {
          return a.completionPercentage - b.completionPercentage;
        }
        return (a.member.displayName || a.member.twitchLogin).localeCompare(
          b.member.displayName || b.member.twitchLogin
        );
      }),
    [filteredIncomplete, sortBy]
  );

  const allMissingFields = useMemo(
    () => Array.from(new Set(incompleteMembers.flatMap((im) => im.missingFields))),
    [incompleteMembers]
  );

  const averageCompletion = useMemo(() => {
    if (incompleteMembers.length === 0) return 100;
    return Math.round(
      incompleteMembers.reduce((sum, item) => sum + item.completionPercentage, 0) /
        incompleteMembers.length
    );
  }, [incompleteMembers]);

  const criticalMembersCount = useMemo(
    () =>
      incompleteMembers.filter((item) =>
        item.missingFields.some((field) =>
          ["Twitch", "Discord", "ID Twitch", "Nom d'affichage"].includes(field)
        )
      ).length,
    [incompleteMembers]
  );

  const missingFieldRanking = useMemo(
    () =>
      allMissingFields
        .map((field) => ({
          field,
          count: incompleteMembers.filter((item) => item.missingFields.includes(field)).length,
        }))
        .sort((a, b) => b.count - a.count),
    [allMissingFields, incompleteMembers]
  );

  const errorIssues = useMemo<ErrorIssue[]>(() => {
    const detectedErrors: ErrorIssue[] = [];

    for (const member of members) {
      if (!member.twitchLogin || member.twitchLogin.trim() === "") {
        detectedErrors.push({
          type: "twitch_missing",
          severity: "error",
          member,
          description: "Chaîne Twitch manquante",
          suggestion: "Ajouter un login Twitch valide",
        });
      }

      if (member.twitchLogin && !member.twitchId) {
        detectedErrors.push({
          type: "twitch_id_missing",
          severity: "warning",
          member,
          description: "ID Twitch manquant",
          suggestion: "Synchroniser l'ID Twitch depuis l'API Twitch",
        });
      }

      const duplicates = members.filter(
        (m) =>
          m.twitchLogin?.toLowerCase() === member.twitchLogin?.toLowerCase() ||
          (m.discordId && member.discordId && m.discordId === member.discordId)
      );
      if (duplicates.length > 1) {
        detectedErrors.push({
          type: "duplicate",
          severity: "warning",
          member,
          description: `Doublon suspect détecté (${duplicates.length} occurrences)`,
          suggestion: "Vérifier et fusionner les doublons si nécessaire",
        });
      }

      if (member.isActive && !member.discordId && !member.twitchLogin) {
        detectedErrors.push({
          type: "inactive_active",
          severity: "warning",
          member,
          description: "Membre actif sans Discord ni Twitch",
          suggestion: "Vérifier le statut ou compléter les identifiants",
        });
      }

      if (member.isActive && !member.discordId) {
        detectedErrors.push({
          type: "discord_missing_active",
          severity: "warning",
          member,
          description: "Membre actif sans ID Discord",
          suggestion: "Ajouter l'ID Discord ou ajuster le statut",
        });
      }
    }

    return detectedErrors;
  }, [members]);

  const errorTypes = useMemo(
    () => Array.from(new Set(errorIssues.map((e) => e.type))),
    [errorIssues]
  );

  const filteredErrors = useMemo(
    () => (errorFilterType === "all" ? errorIssues : errorIssues.filter((e) => e.type === errorFilterType)),
    [errorFilterType, errorIssues]
  );

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-400";
    if (percentage >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getCompletionBgColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500/20";
    if (percentage >= 50) return "bg-yellow-500/20";
    return "bg-red-500/20";
  };

  const getErrorIcon = (type: string) => {
    switch (type) {
      case "twitch_missing":
        return "📺";
      case "twitch_id_missing":
        return "🔢";
      case "duplicate":
        return "🔗";
      case "discord_missing_active":
        return "💬";
      case "inactive_active":
        return "⚠️";
      default:
        return "❌";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff] mx-auto mb-4"></div>
          <p className="text-gray-400">Analyse des comptes incomplets...</p>
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
              ← Retour au hub Membres
            </Link>
            <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Membres · Profils incomplets</p>
            <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
              Centre de complétude des profils
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Priorise les comptes à compléter pour fiabiliser les opérations, la modération et la synchronisation des identifiants.
            </p>
          </div>
          <button type="button" onClick={() => void loadMembersAndDetectIncomplete()} disabled={refreshing} className={`${subtleButtonClass} disabled:opacity-60`}>
            <RefreshCw className="h-4 w-4" />
            {refreshing ? "Actualisation..." : "Actualiser"}
          </button>
        </div>
      </section>

      <section className={`${sectionCardClass} p-3`}>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setViewMode("incomplets")}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              viewMode === "incomplets"
                ? "border-indigo-300/50 bg-indigo-400/20 text-indigo-100"
                : "border-[#353a50] bg-[#121623]/80 text-slate-300 hover:border-indigo-300/35"
            }`}
          >
            Comptes incomplets
          </button>
          <button
            type="button"
            onClick={() => setViewMode("erreurs")}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              viewMode === "erreurs"
                ? "border-indigo-300/50 bg-indigo-400/20 text-indigo-100"
                : "border-[#353a50] bg-[#121623]/80 text-slate-300 hover:border-indigo-300/35"
            }`}
          >
            Incohérences & erreurs
          </button>
        </div>
      </section>

      {viewMode === "incomplets" ? (
        <>
          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <article className={`${sectionCardClass} p-4`}>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Comptes incomplets</p>
              <p className="mt-2 text-3xl font-semibold">{incompleteMembers.length}</p>
              <p className="mt-1 text-xs text-slate-400">Sur {members.length} membres</p>
            </article>
            <article className={`${sectionCardClass} p-4`}>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Critiques</p>
              <p className="mt-2 text-3xl font-semibold text-rose-300">{criticalMembersCount}</p>
              <p className="mt-1 text-xs text-slate-400">Champs essentiels manquants</p>
            </article>
            <article className={`${sectionCardClass} p-4`}>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Moins de 50%</p>
              <p className="mt-2 text-3xl font-semibold text-red-300">
                {incompleteMembers.filter((im) => im.completionPercentage < 50).length}
              </p>
              <p className="mt-1 text-xs text-slate-400">Risque opérationnel élevé</p>
            </article>
            <article className={`${sectionCardClass} p-4`}>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">50-80%</p>
              <p className="mt-2 text-3xl font-semibold text-amber-300">
                {incompleteMembers.filter((im) => im.completionPercentage >= 50 && im.completionPercentage < 80).length}
              </p>
              <p className="mt-1 text-xs text-slate-400">À compléter cette semaine</p>
            </article>
            <article className={`${sectionCardClass} p-4`}>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Complétude moyenne</p>
              <p className="mt-2 text-3xl font-semibold text-cyan-300">{averageCompletion}%</p>
              <p className="mt-1 text-xs text-slate-400">Profils incomplets uniquement</p>
            </article>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
            <article className={`${sectionCardClass} p-5`}>
              <h2 className="text-lg font-semibold text-slate-100">Champs les plus manquants</h2>
              <div className="mt-4 space-y-2">
                {missingFieldRanking.length === 0 ? (
                  <p className="text-sm text-slate-400">Aucun champ manquant détecté.</p>
                ) : (
                  missingFieldRanking.slice(0, 6).map((item) => (
                    <div key={item.field} className="flex items-center justify-between rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2">
                      <span className="text-sm text-slate-200">{item.field}</span>
                      <span className="text-sm font-semibold text-indigo-200">{item.count}</span>
                    </div>
                  ))
                )}
              </div>
            </article>
            <article className={`${sectionCardClass} p-5`}>
              <h2 className="text-lg font-semibold text-slate-100">Actions rapides</h2>
              <div className="mt-4 space-y-2">
                <Link href="/admin/membres/gestion" className="flex items-center justify-between rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2 text-sm text-slate-100 hover:border-indigo-300/45">
                  Ouvrir gestion membres
                  <ArrowRight className="h-4 w-4 text-indigo-200" />
                </Link>
                <Link href="/admin/membres/validation-profil" className="flex items-center justify-between rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2 text-sm text-slate-100 hover:border-indigo-300/45">
                  Ouvrir validations profil
                  <ArrowRight className="h-4 w-4 text-indigo-200" />
                </Link>
                <Link href="/admin/membres/qualite-data" className="flex items-center justify-between rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2 text-sm text-slate-100 hover:border-indigo-300/45">
                  Ouvrir qualité data
                  <ArrowRight className="h-4 w-4 text-indigo-200" />
                </Link>
              </div>
            </article>
          </section>

          <section className={`${sectionCardClass} p-3`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">Filtrer par champ manquant :</span>
              <button
                onClick={() => setFilterType("all")}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                  filterType === "all"
                    ? "border-indigo-300/50 bg-indigo-400/20 text-indigo-100"
                    : "border-[#353a50] bg-[#121623]/80 text-slate-300 hover:border-indigo-300/35"
                }`}
              >
                Tous ({incompleteMembers.length})
              </button>
              {allMissingFields.map((field) => (
                <button
                  key={field}
                  onClick={() => setFilterType(field)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    filterType === field
                      ? "border-indigo-300/50 bg-indigo-400/20 text-indigo-100"
                      : "border-[#353a50] bg-[#121623]/80 text-slate-300 hover:border-indigo-300/35"
                  }`}
                >
                  {field} ({incompleteMembers.filter((im) => im.missingFields.includes(field)).length})
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-slate-400">Trier :</span>
                <button
                  onClick={() => setSortBy("completion")}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    sortBy === "completion"
                      ? "border-indigo-300/50 bg-indigo-400/20 text-indigo-100"
                      : "border-[#353a50] bg-[#121623]/80 text-slate-300 hover:border-indigo-300/35"
                  }`}
                >
                  Complétion
                </button>
                <button
                  onClick={() => setSortBy("name")}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    sortBy === "name"
                      ? "border-indigo-300/50 bg-indigo-400/20 text-indigo-100"
                      : "border-[#353a50] bg-[#121623]/80 text-slate-300 hover:border-indigo-300/35"
                  }`}
                >
                  Nom
                </button>
              </div>
            </div>
          </section>

          {sortedIncomplete.length === 0 ? (
            <section className={`${sectionCardClass} p-8 text-center`}>
              <div className="text-4xl mb-4">✅</div>
              <div className="text-xl font-semibold text-white mb-2">Tous les comptes sont complets</div>
              <div className="text-slate-400">Aucun membre avec une configuration partielle.</div>
            </section>
          ) : (
            <section className="space-y-4">
              {sortedIncomplete.map((incomplete) => {
                const identity = incomplete.member.twitchLogin || incomplete.member.displayName || "membre";
                const isCritical = incomplete.missingFields.some((field) =>
                  ["Twitch", "Discord", "ID Twitch", "Nom d'affichage"].includes(field)
                );
                return (
                  <article key={identity} className={`${sectionCardClass} p-5`}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-white">
                            {incomplete.member.displayName || incomplete.member.twitchLogin}
                          </h3>
                          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getCompletionBgColor(incomplete.completionPercentage)} ${getCompletionColor(incomplete.completionPercentage)}`}>
                            {incomplete.completionPercentage}% complet
                          </span>
                          {isCritical ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-300/35 bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-100">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Critique
                            </span>
                          ) : null}
                        </div>

                        <div className="mb-3">
                          <div className="mb-1 flex justify-between text-xs text-slate-300">
                            <span>Progression profil</span>
                            <span>{incomplete.completionPercentage}%</span>
                          </div>
                          <div className="h-2.5 rounded-full bg-slate-800">
                            <div className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-300" style={{ width: `${incomplete.completionPercentage}%` }} />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          <div className="text-sm">
                            <span className="text-slate-400">Twitch:</span>{" "}
                            <span className="text-white">{incomplete.member.twitchLogin || "Non renseigné"}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-slate-400">Discord:</span>{" "}
                            <span className="text-white">{incomplete.member.discordUsername || "Non renseigné"}</span>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="mb-2 text-sm text-slate-400">Champs manquants :</div>
                          <div className="flex flex-wrap gap-2">
                            {incomplete.missingFields.map((field) => (
                              <span
                                key={`${identity}-${field}`}
                                className="rounded border border-rose-300/35 bg-rose-500/15 px-2 py-1 text-xs font-semibold text-rose-200"
                              >
                                {field}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="w-full md:w-auto">
                        <Link
                          href={`/admin/membres/gestion?search=${encodeURIComponent(incomplete.member.twitchLogin || incomplete.member.displayName)}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-indigo-300/35 bg-indigo-500/20 px-3 py-2 text-sm font-semibold text-indigo-100 hover:bg-indigo-500/30"
                        >
                          Compléter dans gestion
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className={`${sectionCardClass} p-4`}>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Erreurs critiques</p>
              <p className="mt-2 text-3xl font-semibold text-rose-300">
                {errorIssues.filter((e) => e.severity === "error").length}
              </p>
            </article>
            <article className={`${sectionCardClass} p-4`}>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Avertissements</p>
              <p className="mt-2 text-3xl font-semibold text-amber-300">
                {errorIssues.filter((e) => e.severity === "warning").length}
              </p>
            </article>
            <article className={`${sectionCardClass} p-4`}>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Total problèmes</p>
              <p className="mt-2 text-3xl font-semibold">{errorIssues.length}</p>
            </article>
            <article className={`${sectionCardClass} p-4`}>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Types détectés</p>
              <p className="mt-2 text-3xl font-semibold text-cyan-300">{errorTypes.length}</p>
            </article>
          </section>

          <section className={`${sectionCardClass} p-3`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">Filtrer les incohérences :</span>
              <button
                onClick={() => setErrorFilterType("all")}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                  errorFilterType === "all"
                    ? "border-indigo-300/50 bg-indigo-400/20 text-indigo-100"
                    : "border-[#353a50] bg-[#121623]/80 text-slate-300 hover:border-indigo-300/35"
                }`}
              >
                Tous ({errorIssues.length})
              </button>
              {errorTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setErrorFilterType(type)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    errorFilterType === type
                      ? "border-indigo-300/50 bg-indigo-400/20 text-indigo-100"
                      : "border-[#353a50] bg-[#121623]/80 text-slate-300 hover:border-indigo-300/35"
                  }`}
                >
                  {getErrorIcon(type)} {type.replace(/_/g, " ")} ({errorIssues.filter((e) => e.type === type).length})
                </button>
              ))}
            </div>
          </section>

          {filteredErrors.length === 0 ? (
            <section className={`${sectionCardClass} p-8 text-center`}>
              <div className="text-4xl mb-4">✅</div>
              <div className="text-xl font-semibold text-white mb-2">Aucune incohérence détectée</div>
              <div className="text-slate-400">Tous les membres semblent correctement configurés.</div>
            </section>
          ) : (
            <section className="space-y-4">
              {filteredErrors.map((issue, idx) => {
                const issueKey = `${issue.type}-${issue.member.twitchLogin || issue.member.discordId || idx}`;
                return (
                  <article
                    key={issueKey}
                    className={`${sectionCardClass} p-5 ${
                      issue.severity === "error" ? "border-rose-400/30" : "border-amber-400/30"
                    }`}
                  >
                    <div className="flex flex-wrap items-start gap-4">
                      <div className="text-2xl">{getErrorIcon(issue.type)}</div>
                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-white">{issue.description}</h3>
                          <span
                            className={`rounded px-2 py-1 text-xs font-semibold ${
                              issue.severity === "error"
                                ? "bg-rose-500/20 text-rose-300"
                                : "bg-amber-500/20 text-amber-300"
                            }`}
                          >
                            {issue.severity === "error" ? "Erreur" : "Avertissement"}
                          </span>
                        </div>
                        <div className="text-sm text-slate-300">
                          <p className="font-medium">{issue.member.displayName || issue.member.twitchLogin}</p>
                          <p className="text-slate-400">Twitch: {issue.member.twitchLogin || "Non renseigné"}</p>
                          <p className="text-slate-400">Discord: {issue.member.discordUsername || "Non renseigné"}</p>
                        </div>
                        {issue.suggestion ? (
                          <p className="mt-2 text-xs italic text-slate-400">💡 {issue.suggestion}</p>
                        ) : null}
                      </div>
                      <div>
                        <Link
                          href={`/admin/membres/gestion?search=${encodeURIComponent(issue.member.twitchLogin || issue.member.displayName)}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-indigo-300/35 bg-indigo-500/20 px-3 py-2 text-sm font-semibold text-indigo-100 hover:bg-indigo-500/30"
                        >
                          Voir dans gestion
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </>
      )}
    </div>
  );
}

