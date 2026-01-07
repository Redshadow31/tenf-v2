"use client";

import { useState, useEffect } from "react";
import { getDiscordUser } from "@/lib/discord";
import { isFounder } from "@/lib/admin";
import Link from "next/link";

interface Member {
  twitchLogin: string;
  displayName: string;
  discordUsername?: string;
  discordId?: string;
  twitchId?: string;
  twitchUrl?: string;
  role: string;
  isActive: boolean;
}

interface ErrorIssue {
  type: string;
  severity: "error" | "warning";
  member: Member;
  description: string;
  suggestion?: string;
}

export default function ErreursMembresPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [errors, setErrors] = useState<ErrorIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; username: string; isFounder: boolean } | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

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
        window.location.href = "/auth/login?redirect=/admin/membres/erreurs";
      }
    }
    loadAdmin();
  }, []);

  useEffect(() => {
    if (currentAdmin !== null) {
      loadMembersAndDetectErrors();
    }
  }, [currentAdmin]);

  async function loadMembersAndDetectErrors() {
    try {
      setLoading(true);
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

      // Détecter les erreurs
      const detectedErrors: ErrorIssue[] = [];

      for (const member of membersData) {
        // 1. Chaîne Twitch introuvable (pas de twitchLogin)
        if (!member.twitchLogin || member.twitchLogin.trim() === "") {
          detectedErrors.push({
            type: "twitch_missing",
            severity: "error",
            member,
            description: "Chaîne Twitch manquante",
            suggestion: "Ajouter un login Twitch valide",
          });
        }

        // 2. ID Twitch invalide ou manquant
        if (member.twitchLogin && !member.twitchId) {
          detectedErrors.push({
            type: "twitch_id_missing",
            severity: "warning",
            member,
            description: "ID Twitch manquant",
            suggestion: "Synchroniser l'ID Twitch depuis l'API Twitch",
          });
        }

        // 3. Login Twitch incohérent (vérifier si le login existe sur Twitch)
        // Note: Cette vérification nécessite une API Twitch, on la fait de manière asynchrone
        // Pour l'instant, on détecte seulement les cas évidents (login vide ou invalide)
        if (member.twitchLogin && member.twitchLogin.trim() !== "" && !member.twitchId) {
          // Si on a un login mais pas d'ID, c'est suspect
          // (déjà détecté dans twitch_id_missing, mais on peut ajouter une vérification supplémentaire)
        }

        // 4. Avatar non récupérable (vérifier si l'avatar existe)
        // Cette vérification peut être faite côté client si nécessaire

        // 5. Doublons suspects (même twitchLogin ou discordId)
        const duplicates = membersData.filter(
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

        // 6. Membre actif sans activité connue (pas de Discord ni Twitch)
        if (member.isActive && !member.discordId && !member.twitchLogin) {
          detectedErrors.push({
            type: "inactive_active",
            severity: "warning",
            member,
            description: "Membre marqué actif mais sans Discord ni Twitch",
            suggestion: "Vérifier le statut ou ajouter les informations manquantes",
          });
        }

        // 7. Discord manquant pour membre actif
        if (member.isActive && !member.discordId) {
          detectedErrors.push({
            type: "discord_missing_active",
            severity: "warning",
            member,
            description: "Membre actif sans ID Discord",
            suggestion: "Ajouter l'ID Discord ou désactiver le membre",
          });
        }
      }

      setErrors(detectedErrors);
    } catch (error) {
      console.error("Erreur lors de la détection des erreurs:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredErrors = filterType === "all" 
    ? errors 
    : errors.filter(e => e.type === filterType);

  const errorTypes = Array.from(new Set(errors.map(e => e.type)));

  const getErrorIcon = (type: string) => {
    switch (type) {
      case "twitch_missing":
      case "twitch_not_found":
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

  const getSeverityColor = (severity: string) => {
    return severity === "error" 
      ? "border-red-500/30 bg-red-500/10" 
      : "border-yellow-500/30 bg-yellow-500/10";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff] mx-auto mb-4"></div>
          <p className="text-gray-400">Analyse des erreurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white">
      <div className="p-8">
        <div className="mb-6">
          <Link 
            href="/admin/membres" 
            className="text-[#9146ff] hover:text-[#5a32b4] mb-4 inline-block"
          >
            ← Retour au hub Membres
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-white mb-2">Erreurs & Incohérences</h1>
        <p className="text-gray-400 mb-8">Problèmes détectés automatiquement dans les données des membres</p>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-400">{errors.filter(e => e.severity === "error").length}</div>
            <div className="text-sm text-gray-400">Erreurs critiques</div>
          </div>
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">{errors.filter(e => e.severity === "warning").length}</div>
            <div className="text-sm text-gray-400">Avertissements</div>
          </div>
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{errors.length}</div>
            <div className="text-sm text-gray-400">Total des problèmes</div>
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterType("all")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterType === "all"
                ? "bg-[#9146ff] text-white"
                : "bg-[#1a1a1d] border border-gray-700 text-gray-300 hover:border-[#9146ff]"
            }`}
          >
            Tous ({errors.length})
          </button>
          {errorTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === type
                  ? "bg-[#9146ff] text-white"
                  : "bg-[#1a1a1d] border border-gray-700 text-gray-300 hover:border-[#9146ff]"
              }`}
            >
              {getErrorIcon(type)} {type.replace(/_/g, " ")} ({errors.filter(e => e.type === type).length})
            </button>
          ))}
        </div>

        {/* Liste des erreurs */}
        {filteredErrors.length === 0 ? (
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">✅</div>
            <div className="text-xl font-semibold text-white mb-2">Aucune erreur détectée</div>
            <div className="text-gray-400">Tous les membres semblent correctement configurés.</div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredErrors.map((error, index) => (
              <div
                key={index}
                className={`bg-[#1a1a1d] border rounded-lg p-6 ${getSeverityColor(error.severity)}`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{getErrorIcon(error.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{error.description}</h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          error.severity === "error"
                            ? "bg-red-500/20 text-red-300"
                            : "bg-yellow-500/20 text-yellow-300"
                        }`}
                      >
                        {error.severity === "error" ? "Erreur" : "Avertissement"}
                      </span>
                    </div>
                    <div className="text-gray-300 mb-3">
                      <div className="font-medium">{error.member.displayName || error.member.twitchLogin}</div>
                      {error.member.twitchLogin && (
                        <div className="text-sm text-gray-400">
                          Twitch: {error.member.twitchLogin}
                        </div>
                      )}
                      {error.member.discordUsername && (
                        <div className="text-sm text-gray-400">
                          Discord: {error.member.discordUsername}
                        </div>
                      )}
                    </div>
                    {error.suggestion && (
                      <div className="text-sm text-gray-400 italic">
                        💡 {error.suggestion}
                      </div>
                    )}
                    <div className="mt-4">
                      <Link
                        href={`/admin/membres/gestion?search=${encodeURIComponent(error.member.twitchLogin || error.member.displayName)}`}
                        className="text-[#9146ff] hover:text-[#5a32b4] text-sm font-medium"
                      >
                        → Voir dans la gestion
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

