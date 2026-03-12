"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

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

export default function ReconciliationMembresPage() {
  const [loading, setLoading] = useState(true);
  const [submittingLogin, setSubmittingLogin] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [publicMembers, setPublicMembers] = useState<PublicMember[]>([]);
  const [adminMembers, setAdminMembers] = useState<AdminMember[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
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
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const missingInAdmin = useMemo(() => {
    const adminLogins = new Set(
      adminMembers
        .map((m) => normalizeText(m.twitchLogin))
        .filter((v) => v.length > 0)
    );

    const adminDiscordIds = new Set(
      adminMembers
        .map((m) => normalizeId(m.discordId))
        .filter((v) => v.length > 0)
    );

    return publicMembers.filter((member) => {
      const login = normalizeText(member.twitchLogin);
      const discordId = normalizeId(member.discordId);

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

  async function handleAddToGestion(member: PublicMember) {
    const login = normalizeText(member.twitchLogin);
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
          foundMember.discordId || member.discordId || foundMember.twitchLogin || login
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
    <div className="text-white">
      <div className="mb-6">
        <Link
          href="/admin/membres"
          className="text-[#9146ff] hover:text-[#5a32b4] mb-3 inline-block"
        >
          ← Retour au hub Membres
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">
          Détection Public → Gestion
        </h1>
        <p className="text-gray-400">
          Détecte les membres visibles sur la page publique mais absents de la
          gestion admin, puis les ajoute en 1 clic.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{publicMembers.length}</div>
          <div className="text-sm text-gray-400">Membres visibles en public</div>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{adminMembers.length}</div>
          <div className="text-sm text-gray-400">Membres présents en gestion</div>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-300">{missingInAdmin.length}</div>
          <div className="text-sm text-gray-400">Manquants en gestion</div>
        </div>
      </div>

      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher (pseudo, nom, Discord, ID Discord, URL Twitch...)"
            className="w-full md:max-w-xl bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff]"
          />
          <button
            onClick={loadData}
            className="bg-[#9146ff] hover:bg-[#5a32b4] text-white px-4 py-2 rounded-lg font-semibold"
          >
            Actualiser
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 text-center text-gray-400">
          Chargement du diagnostic...
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300">
          {error}
        </div>
      ) : filteredMissing.length === 0 ? (
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 text-center">
          <div className="text-4xl mb-3">✅</div>
          <div className="text-lg font-semibold text-white">
            Aucun membre public manquant dans la gestion
          </div>
          <div className="text-gray-400 mt-2">
            La base publique et la gestion admin sont alignées pour les filtres
            actuels.
          </div>
        </div>
      ) : (
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0e0e10] border-b border-gray-700">
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
                  const login = normalizeText(member.twitchLogin);
                  const isSubmitting = submittingLogin === login;

                  return (
                    <tr key={`${member.twitchLogin}-${member.discordId || "no-discord"}`} className="border-b border-gray-800">
                      <td className="py-3 px-4 text-white">
                        {member.displayName || member.twitchLogin}
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
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-400 text-white text-sm font-semibold px-3 py-2 rounded-lg"
                          >
                            {isSubmitting ? "Ajout..." : "Ajouter dans gestion"}
                          </button>
                          <Link
                            href={`/admin/membres/gestion?search=${encodeURIComponent(member.twitchLogin || member.displayName || "")}`}
                            className="text-[#9146ff] hover:text-[#5a32b4] text-sm"
                          >
                            Ouvrir gestion
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

