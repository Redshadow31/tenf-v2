"use client";

import { useState } from "react";
import Link from "next/link";

interface MemberData {
  twitchLogin: string;
  twitchUrl: string;
  discordId?: string;
  discordUsername?: string;
  displayName: string;
  siteUsername?: string;
  role: string;
  isVip: boolean;
  isActive: boolean;
  description?: string;
  customBio?: string;
  twitchStatus?: {
    isLive: boolean;
    gameName?: string;
    viewerCount?: number;
  };
}

interface EditMemberCompletModalProps {
  member: MemberData;
  allMembers?: MemberData[];
  onClose: () => void;
  onSave: (member: MemberData) => void;
  onMerged?: () => void;
}

export default function EditMemberCompletModal({
  member,
  allMembers = [],
  onClose,
  onSave,
  onMerged,
}: EditMemberCompletModalProps) {
  const [formData, setFormData] = useState<MemberData>(member);
  const [quickMergeLoading, setQuickMergeLoading] = useState(false);

  const normalizedCurrentLogin = (formData.twitchLogin || "").toLowerCase().trim();
  const normalizedDiscordId = (formData.discordId || "").trim();
  const discordConflictMember =
    normalizedDiscordId.length > 0
      ? allMembers.find(
          (m) =>
            (m.discordId || "").trim() === normalizedDiscordId &&
            (m.twitchLogin || "").toLowerCase().trim() !== normalizedCurrentLogin
        )
      : undefined;

  const handleQuickMergeFromDiscordConflict = async () => {
    if (!discordConflictMember) {
      alert("Aucun conflit Discord détecté.");
      return;
    }

    const currentLogin = normalizedCurrentLogin;
    const conflictLogin = (discordConflictMember.twitchLogin || "").toLowerCase().trim();
    if (!currentLogin || !conflictLogin || currentLogin === conflictLogin) {
      alert("Impossible de préparer la fusion (logins invalides).");
      return;
    }

    const confirmed = confirm(
      `Fusionner "${currentLogin}" avec "${conflictLogin}" ?\n\n` +
      `Le profil "${currentLogin}" sera conservé.`
    );
    if (!confirmed) return;

    setQuickMergeLoading(true);
    try {
      const response = await fetch("/api/admin/members/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membersToMerge: [currentLogin, conflictLogin],
          mergedData: {
            twitchLogin: currentLogin,
            displayName: formData.displayName,
            twitchUrl: formData.twitchUrl || `https://www.twitch.tv/${currentLogin}`,
            discordId: normalizedDiscordId || discordConflictMember.discordId || undefined,
            discordUsername: formData.discordUsername,
            role: formData.role,
            isVip: formData.isVip,
            isActive: formData.isActive,
            description: formData.description,
            customBio: formData.customBio,
            siteUsername: formData.siteUsername || formData.displayName,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Fusion impossible");
      }

      alert(
        `Fusion réussie !\n\n` +
        `Profil conservé: ${data.primaryMember}\n` +
        `Profil(s) fusionné(s): ${(data.deletedMembers || []).join(", ")}`
      );
      if (onMerged) {
        onMerged();
      } else {
        onClose();
      }
    } catch (error) {
      console.error("Erreur fusion rapide (membres-complets):", error);
      alert(`Erreur de fusion: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    } finally {
      setQuickMergeLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1d] border border-[#2a2a2d] rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Modifier le membre</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Pseudo choisi sur le site *
            </label>
            <input
              type="text"
              value={formData.siteUsername || formData.displayName}
              onChange={(e) => setFormData({ ...formData, siteUsername: e.target.value })}
              className="w-full bg-[#0e0e10] border border-[#2a2a2d] rounded-lg px-4 py-2 text-white"
              placeholder="Pseudo affiché sur le site"
            />
            <p className="text-xs text-gray-400 mt-1">Ce pseudo sera affiché partout sur le site</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Nom d'affichage (par défaut)
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full bg-[#0e0e10] border border-[#2a2a2d] rounded-lg px-4 py-2 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Login Twitch
              </label>
              <input
                type="text"
                value={formData.twitchLogin}
                disabled
                className="w-full bg-[#0e0e10] border border-[#2a2a2d] rounded-lg px-4 py-2 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                URL Twitch
              </label>
              <input
                type="text"
                value={formData.twitchUrl}
                onChange={(e) => setFormData({ ...formData, twitchUrl: e.target.value })}
                className="w-full bg-[#0e0e10] border border-[#2a2a2d] rounded-lg px-4 py-2 text-white"
                placeholder="https://www.twitch.tv/..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Pseudo Discord
              </label>
              <input
                type="text"
                value={formData.discordUsername || ""}
                onChange={(e) => setFormData({ ...formData, discordUsername: e.target.value })}
                className="w-full bg-[#0e0e10] border border-[#2a2a2d] rounded-lg px-4 py-2 text-white"
                placeholder="Ex: NeXou31"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                ID Discord
              </label>
              <input
                type="text"
                value={formData.discordId || ""}
                onChange={(e) => setFormData({ ...formData, discordId: e.target.value })}
                className="w-full bg-[#0e0e10] border border-[#2a2a2d] rounded-lg px-4 py-2 text-white font-mono text-sm"
                placeholder="Ex: 535244297214361603"
              />
              {discordConflictMember && (
                <div className="mt-2">
                  <p className="text-xs text-red-400 mb-2">
                    Cet ID Discord est deja lie a{" "}
                    <span className="font-semibold">
                      {discordConflictMember.displayName || discordConflictMember.twitchLogin}
                    </span>{" "}
                    ({discordConflictMember.twitchLogin}).
                  </p>
                  <button
                    type="button"
                    onClick={handleQuickMergeFromDiscordConflict}
                    disabled={quickMergeLoading}
                    className="text-xs bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 px-3 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {quickMergeLoading ? "Fusion en cours..." : "Fusionner ces 2 profils maintenant"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Rôle
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-[#0e0e10] border border-[#2a2a2d] rounded-lg px-4 py-2 text-white"
            >
              <option value="Nouveau">Nouveau</option>
              <option value="Affilié">Affilié</option>
              <option value="Développement">Développement</option>
              <option value="Créateur Junior">Créateur Junior</option>
              <option value="Les P'tits Jeunes">Les P&apos;tits Jeunes</option>
              <option value="Communauté">Communauté</option>
              <option value="Modérateur en formation">Modérateur en formation</option>
              <option value="Modérateur">Modérateur</option>
              <option value="Modérateur en activité réduite">Modérateur en activité réduite</option>
              <option value="Modérateur en pause">Modérateur en pause</option>
              <option value="Admin">Admin</option>
              <option value="Admin Coordinateur">Admin Coordinateur</option>
              <option value="Soutien TENF">Soutien TENF</option>
              <option value="Contributeur TENF du Mois">Contributeur TENF du Mois</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isVip}
                onChange={(e) => setFormData({ ...formData, isVip: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-gray-300">VIP</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-gray-300">Actif</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Description personnalisée
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full bg-[#0e0e10] border border-[#2a2a2d] rounded-lg px-4 py-2 text-white"
              placeholder="Description visible sur le site..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Bio personnalisée (remplace la bio Twitch)
            </label>
            <textarea
              value={formData.customBio || ""}
              onChange={(e) => setFormData({ ...formData, customBio: e.target.value })}
              rows={4}
              className="w-full bg-[#0e0e10] border border-[#2a2a2d] rounded-lg px-4 py-2 text-white"
              placeholder="Bio personnalisée..."
            />
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={() => onSave(formData)}
            className="flex-1 bg-[#9146ff] hover:bg-[#5a32b4] px-4 py-2 rounded-lg font-semibold text-white transition-colors"
          >
            Enregistrer
          </button>
          <Link
            href={`/admin/membres/gestion?search=${encodeURIComponent(member.twitchLogin || member.displayName)}`}
            className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-semibold text-white transition-colors text-center"
          >
            Voir dans la gestion
          </Link>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-semibold text-white transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

