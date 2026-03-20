"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, RefreshCw, AlertTriangle } from "lucide-react";

interface PublicMember {
  twitchLogin: string;
  twitchUrl?: string;
  displayName?: string;
  role?: string;
  isVip?: boolean;
  isActive?: boolean;
  discordId?: string;
  discordUsername?: string;
}

interface AdminMember {
  twitchLogin?: string;
  discordId?: string;
}

function normalizeText(value?: string | null): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeId(value?: string | null): string {
  return String(value || "").trim();
}

function normalizeDiscordIdDigits(value?: string | null): string {
  return normalizeId(value).replace(/\D/g, "");
}

function normalizeTwitchLogin(value?: string | null): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_]/g, "");
}

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";

export default function ReconciliationMembresPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingLogin, setSubmittingLogin] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [publicMembers, setPublicMembers] = useState<PublicMember[]>([]);
  const [adminMembers, setAdminMembers] = useState<AdminMember[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setRefreshing(true);
      setError(null);

      const [publicResponse, adminResponse] = await Promise.all([
        fetch("/api/members/public", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        }),
        fetch("/api/admin/members", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        }),
      ]);

      if (!adminResponse.ok) {
        if (adminResponse.status === 401 || adminResponse.status === 403) {
          window.location.href = "/unauthorized";
          return;
        }
        throw new Error("Impossible de charger la base admin des membres");
      }

      if (!publicResponse.ok) {
        throw new Error("Impossible de charger la liste publique des membres");
      }

      const publicData = await publicResponse.json();
      const adminData = await adminResponse.json();

      setPublicMembers(Array.isArray(publicData.members) ? publicData.members : []);
      setAdminMembers(Array.isArray(adminData.members) ? adminData.members : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const missingInAdmin = useMemo(() => {
    const adminLogins = new Set(
      adminMembers
        .map((m) => normalizeTwitchLogin(m.twitchLogin))
        .filter((v) => v.length > 0)
    );

    const adminDiscordIds = new Set(
      adminMembers
        .map((m) => normalizeDiscordIdDigits(m.discordId))
        .filter((v) => v.length > 0)
    );

    return publicMembers.filter((member) => {
      const login = normalizeTwitchLogin(member.twitchLogin);
      const discordId = normalizeDiscordIdDigits(member.discordId);

      if (login && adminLogins.has(login)) return false;
      if (discordId && adminDiscordIds.has(discordId)) return false;
      return true;
    });
  }, [publicMembers, adminMembers]);

  const filteredMissing = useMemo(() => {
    const q = normalizeText(searchQuery);
    if (!q) return missingInAdmin;

    return missingInAdmin.filter((member) => {
      const login = normalizeText(member.twitchLogin);
      const displayName = normalizeText(member.displayName);
      const discordUsername = normalizeText(member.discordUsername);
      const discordId = normalizeId(member.discordId);
      const twitchUrl = normalizeText(member.twitchUrl);

      return (
        login.includes(q) ||
        displayName.includes(q) ||
        discordUsername.includes(q) ||
        twitchUrl.includes(q) ||
        (discordId && discordId.includes(searchQuery.trim()))
      );
    });
  }, [missingInAdmin, searchQuery]);

  const reconciliationCoverage = useMemo(() => {
    if (publicMembers.length === 0) return 100;
    return Math.max(0, Math.round(((publicMembers.length - missingInAdmin.length) / publicMembers.length) * 100));
  }, [missingInAdmin.length, publicMembers.length]);

  const topMissingRoles = useMemo(() => {
    const counts = new Map<string, number>();
    missingInAdmin.forEach((member) => {
      const key = String(member.role || "Non défini");
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [missingInAdmin]);

  async function handleAddToGestion(member: PublicMember) {
    const login = normalizeTwitchLogin(member.twitchLogin);
    if (!login) {
      alert("Impossible d'ajouter ce membre : login Twitch manquant.");
      return;
    }

    try {
      setSubmittingLogin(login);

      const verifyAndOpenGestion = async (successPrefix: string) => {
        let foundMember: any = null;

        if (member.discordId) {
          const byDiscord = await fetch(
            `/api/admin/members?discordId=${encodeURIComponent(member.discordId)}`,
            { cache: "no-store" }
          );
          if (byDiscord.ok) {
            const payload = await byDiscord.json().catch(() => ({}));
            foundMember = payload.member || null;
          }
        }

        if (!foundMember) {
          const byLogin = await fetch(
            `/api/admin/members?twitchLogin=${encodeURIComponent(login)}`,
            { cache: "no-store" }
          );
          if (byLogin.ok) {
            const payload = await byLogin.json().catch(() => ({}));
            foundMember = payload.member || null;
          }
        }

        await loadData();

        if (!foundMember) {
          alert(
            `${successPrefix}\n\n⚠️ La vérification automatique n'a pas retrouvé la fiche dans /api/admin/members.\nUtilise "Ouvrir gestion" puis recherche l'ID Discord.`
          );
          return;
        }

        const gestionSearch = String(
          normalizeId(foundMember.discordId) ||
            normalizeId(member.discordId) ||
            foundMember.twitchLogin ||
            login
        );
        alert(
          `${successPrefix}\n\nFiche gestion détectée: ${foundMember.twitchLogin || login}${
            foundMember.discordId ? ` (Discord ID: ${foundMember.discordId})` : ""
          }`
        );
        window.location.href = `/admin/membres/gestion?search=${encodeURIComponent(gestionSearch)}`;
      };

      const response = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          twitchLogin: login,
          displayName: member.displayName || member.twitchLogin,
          twitchUrl: member.twitchUrl || `https://www.twitch.tv/${login}`,
          discordId: member.discordId,
          discordUsername: member.discordUsername,
          role: member.role || "Affilié",
          isVip: member.isVip === true,
          isActive: member.isActive !== false,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage = String(data.error || "Erreur lors de l'ajout dans la gestion");
        const isExistingLoginError = errorMessage
          .toLowerCase()
          .includes("login twitch existe déjà");

        // Cas fréquent: le membre existe déjà mais est mal rattaché/peu visible dans la gestion.
        // On tente alors une mise à jour/fusion douce au lieu d'échouer.
        if (isExistingLoginError) {
          const mergeResponse = await fetch("/api/admin/members", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              twitchLogin: login,
              originalTwitchLogin: login,
              displayName: member.displayName || member.twitchLogin,
              discordId: member.discordId,
              discordUsername: member.discordUsername,
              role: member.role || "Affilié",
              isVip: member.isVip === true,
              isActive: member.isActive !== false,
            }),
          });

          const mergeData = await mergeResponse.json().catch(() => ({}));
          if (!mergeResponse.ok) {
            throw new Error(
              mergeData.error ||
                "Le membre existe déjà, mais la fusion automatique a échoué."
            );
          }

          await verifyAndOpenGestion(
            `✅ ${member.displayName || login} existait déjà : la fiche a été fusionnée/synchronisée dans la gestion.`
          );
          return;
        }

        throw new Error(errorMessage);
      }

      await verifyAndOpenGestion(
        `✅ ${member.displayName || login} a été ajouté à la gestion.`
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur inconnue lors de l'ajout";
      alert(`❌ ${message}`);
    } finally {
      setSubmittingLogin(null);
    }
  }

  return (
    <div className="space-y-6 text-white">
      <section className={`${glassCardClass} p-5 md:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <Link href="/admin/membres" className="mb-3 inline-block text-sm text-slate-300 transition hover:text-white">
              ← Retour au hub Membres
            </Link>
            <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Membres · Réconciliation</p>
            <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
              Réconciliation public → gestion
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Détecte les membres visibles publiquement mais absents de la gestion admin, puis les ajoute en flux rapide.
            </p>
          </div>
          <button type="button" onClick={() => void loadData()} disabled={refreshing} className={`${subtleButtonClass} disabled:opacity-60`}>
            <RefreshCw className="h-4 w-4" />
            {refreshing ? "Actualisation..." : "Actualiser"}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Membres publics</p>
          <p className="mt-2 text-3xl font-semibold">{publicMembers.length}</p>
          <p className="mt-1 text-xs text-slate-400">Référentiel visible</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Membres en gestion</p>
          <p className="mt-2 text-3xl font-semibold">{adminMembers.length}</p>
          <p className="mt-1 text-xs text-slate-400">Base administrative</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Manquants en gestion</p>
          <p className="mt-2 text-3xl font-semibold text-amber-300">{missingInAdmin.length}</p>
          <p className="mt-1 text-xs text-slate-400">Candidats à importer</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Couverture réconciliation</p>
          <p className="mt-2 text-3xl font-semibold text-cyan-300">{reconciliationCoverage}%</p>
          <p className="mt-1 text-xs text-slate-400">Alignement public/gestion</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Progression d’alignement</h2>
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
              <span>Public déjà couvert dans gestion</span>
              <span>{reconciliationCoverage}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-800">
              <div className="h-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-300" style={{ width: `${reconciliationCoverage}%` }} />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Objectif: tendre vers 100% pour réduire les pertes de traçabilité lors des opérations staff.
          </p>
        </article>
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Top rôles manquants</h2>
          <div className="mt-3 space-y-2">
            {topMissingRoles.length === 0 ? (
              <p className="text-sm text-emerald-300">Aucun manque détecté.</p>
            ) : (
              topMissingRoles.map((item) => (
                <div key={item.role} className="flex items-center justify-between rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2">
                  <span className="text-sm text-slate-200">{item.role}</span>
                  <span className="text-sm font-semibold text-indigo-200">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className={`${sectionCardClass} p-4`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher (pseudo, nom, Discord, ID Discord, URL Twitch...)"
            className="w-full md:max-w-xl rounded-lg border border-[#353a50] bg-[#121623]/80 px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-300/55"
          />
          <button
            onClick={loadData}
            className="rounded-lg border border-indigo-300/35 bg-indigo-500/25 px-4 py-2 font-semibold text-indigo-100 hover:bg-indigo-500/35"
          >
            Actualiser
          </button>
        </div>
      </section>

      {loading ? (
        <section className={`${sectionCardClass} p-8 text-center text-gray-400`}>
          Chargement du diagnostic...
        </section>
      ) : error ? (
        <section className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          {error}
        </section>
      ) : filteredMissing.length === 0 ? (
        <section className={`${sectionCardClass} p-8 text-center`}>
          <div className="text-4xl mb-3">✅</div>
          <div className="text-lg font-semibold text-white">
            Aucun membre public manquant dans la gestion
          </div>
          <div className="text-gray-400 mt-2">
            La base publique et la gestion admin sont alignées pour les filtres
            actuels.
          </div>
        </section>
      ) : (
        <section className={`${sectionCardClass} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-700 bg-[#121623]/80">
                <tr>
                  <th className="text-left py-3 px-4 text-sm text-gray-300">Membre public</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-300">Twitch</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-300">Discord</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-300">Rôle</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMissing.map((member) => {
                  const login = normalizeTwitchLogin(member.twitchLogin);
                  const isSubmitting = submittingLogin === login;
                  const hasMissingIdentity = !member.discordId || !member.twitchLogin;

                  return (
                    <tr key={`${member.twitchLogin}-${member.discordId || "no-discord"}`} className="border-b border-gray-800 hover:bg-gray-800/35 transition-colors">
                      <td className="py-3 px-4 text-white">
                        <div className="flex items-center gap-2">
                          <span>{member.displayName || member.twitchLogin}</span>
                          {hasMissingIdentity ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/35 bg-amber-300/10 px-2 py-0.5 text-[11px] text-amber-200">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Identité partielle
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {member.twitchLogin || "-"}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        <div>{member.discordUsername || "-"}</div>
                        <div className="text-xs text-gray-500">{member.discordId || ""}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{member.role || "-"}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleAddToGestion(member)}
                            disabled={isSubmitting}
                            className="rounded-lg border border-emerald-300/35 bg-emerald-500/20 px-3 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:border-gray-600 disabled:bg-gray-700 disabled:text-gray-400"
                          >
                            {isSubmitting ? "Ajout..." : "Ajouter dans gestion"}
                          </button>
                          <Link
                            href={`/admin/membres/gestion?search=${encodeURIComponent(member.twitchLogin || member.displayName || "")}`}
                            className="inline-flex items-center gap-1 text-indigo-200 hover:text-indigo-100 text-sm"
                          >
                            Ouvrir gestion
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

