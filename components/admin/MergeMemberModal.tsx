"use client";

import { useState } from "react";
import { getRoleBadgeClassName, getRoleBadgeLabel } from "@/lib/roleBadgeSystem";
import { GESTION_MODAL_COPY_DEFAULT } from "@/lib/admin/members-gestion/gestionCopyModel";
import type { GestionModalCopy } from "@/lib/admin/members-gestion/gestionCopyModel";
import GestionModalShell, {
  gestionModalGhostBtnClass,
  gestionModalPrimaryBtnClass,
} from "@/components/admin/members-gestion/GestionModalShell";

interface MemberToMerge {
  twitchLogin: string;
  displayName: string;
  discordId?: string;
  discordUsername?: string;
  twitchUrl: string;
  role: string;
  isVip: boolean;
  badges?: string[];
  description?: string;
  customBio?: string;
  siteUsername?: string;
  listId?: number;
  avatar?: string;
}

interface MergeMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberToMerge[];
  onMerge: (mergedData: MemberToMerge) => void;
  loading?: boolean;
  allDuplicates?: Array<{ key: string; type: string; members: MemberToMerge[] }>;
  currentDuplicateIndex?: number;
  onNextDuplicate?: () => void;
  onPreviousDuplicate?: () => void;
  modalCopy?: GestionModalCopy;
  accentHex?: string;
}

export default function MergeMemberModal({
  isOpen,
  onClose,
  members,
  onMerge,
  loading = false,
  allDuplicates = [],
  currentDuplicateIndex = 0,
  onNextDuplicate,
  onPreviousDuplicate,
  modalCopy = GESTION_MODAL_COPY_DEFAULT.merge,
  accentHex = "#8b5cf6",
}: MergeMemberModalProps) {
  const [selectedFields, setSelectedFields] = useState<Record<string, number>>({});

  if (!isOpen || members.length < 2) return null;

  // Initialiser les sélections par défaut (garder les infos du premier membre)
  if (Object.keys(selectedFields).length === 0) {
    const defaultSelections: Record<string, number> = {};
    const fields = [
      'displayName',
      'twitchLogin',
      'twitchUrl',
      'discordId',
      'discordUsername',
      'role',
      'isVip',
      'badges',
      'description',
      'customBio',
      'siteUsername',
      'listId',
    ];
    fields.forEach(field => {
      defaultSelections[field] = 0; // Par défaut, garder les infos du premier membre
    });
    setSelectedFields(defaultSelections);
  }

  const handleFieldSelection = (field: string, memberIndex: number) => {
    setSelectedFields({
      ...selectedFields,
      [field]: memberIndex,
    });
  };

  const handleMerge = () => {
    // Construire l'objet fusionné avec les sélections
    const merged: MemberToMerge = {
      twitchLogin: members[selectedFields.twitchLogin || 0].twitchLogin,
      displayName: members[selectedFields.displayName || 0].displayName,
      twitchUrl: members[selectedFields.twitchUrl || 0].twitchUrl,
      discordId: members[selectedFields.discordId || 0]?.discordId,
      discordUsername: members[selectedFields.discordUsername || 0]?.discordUsername,
      role: members[selectedFields.role || 0].role,
      isVip: members[selectedFields.isVip || 0]?.isVip || false,
      badges: members[selectedFields.badges || 0]?.badges,
      description: members[selectedFields.description || 0]?.description,
      customBio: members[selectedFields.customBio || 0]?.customBio,
      siteUsername: members[selectedFields.siteUsername || 0]?.siteUsername,
      listId: members[selectedFields.listId || 0]?.listId,
      avatar: members[0]?.avatar, // Garder l'avatar du premier
    };

    onMerge(merged);
  };

  const fieldLabels: Record<string, string> = {
    displayName: "Nom d'affichage",
    twitchLogin: "Login Twitch",
    twitchUrl: "URL Twitch",
    discordId: "ID Discord",
    discordUsername: "Pseudo Discord",
    role: "Rôle",
    isVip: "Statut VIP",
    badges: "Badges",
    description: "Description",
    customBio: "Bio personnalisée",
    siteUsername: "Pseudo site",
    listId: "Liste",
  };

  return (
    <GestionModalShell
      open={isOpen}
      onClose={onClose}
      title={modalCopy.title}
      subtitle={
        allDuplicates.length > 1
          ? `${modalCopy.subtitle} Doublon ${currentDuplicateIndex + 1} sur ${allDuplicates.length}.`
          : modalCopy.subtitle
      }
      size="lg"
      accentHex={accentHex}
      disableClose={loading}
      footer={
        <div className="flex flex-wrap gap-2">
          {allDuplicates.length > 1 && (
            <>
              <button
                type="button"
                onClick={onPreviousDuplicate}
                disabled={loading || currentDuplicateIndex === 0}
                className={gestionModalGhostBtnClass}
              >
                ← Précédent
              </button>
              <button
                type="button"
                onClick={onNextDuplicate}
                disabled={loading || currentDuplicateIndex === allDuplicates.length - 1}
                className={gestionModalGhostBtnClass}
              >
                Suivant →
              </button>
            </>
          )}
          <button type="button" onClick={onClose} className={`flex-1 ${gestionModalGhostBtnClass}`} disabled={loading}>
            {modalCopy.cancel}
          </button>
          <button type="button" onClick={handleMerge} disabled={loading} className={`flex-1 ${gestionModalPrimaryBtnClass}`}>
            {loading ? "Fusion en cours…" : `${modalCopy.confirm} (${members.length})`}
          </button>
        </div>
      }
    >
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm text-amber-100">
            Doublons détectés (même Discord, chaînes Twitch différentes). Choisis, champ par champ, quelle version conserver — la fusion remplace les entrées en double.
          </p>
        </div>

        {/* Liste des membres à fusionner */}
        <div className="space-y-4 mb-6">
          {members.map((member, index) => (
            <div
              key={index}
              className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4"
            >
              <h3 className="font-semibold text-white mb-2">
                Membre {index + 1}: {member.displayName}
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-400">Twitch:</span>{" "}
                  <span className="text-white">{member.twitchLogin}</span>
                </div>
                <div>
                  <span className="text-gray-400">Discord:</span>{" "}
                  <span className="text-white">
                    {member.discordUsername || member.discordId || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Rôle:</span>{" "}
                  <span className={getRoleBadgeClassName(member.role)}>
                    {getRoleBadgeLabel(member.role)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">VIP:</span>{" "}
                  <span className="text-white">{member.isVip ? "Oui" : "Non"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sélection des champs */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-white">
            Sélectionner les informations à conserver
          </h3>
          {Object.entries(fieldLabels).map(([field, label]) => {
            const values = members.map(m => {
              if (field === 'isVip') return m.isVip ? 'Oui' : 'Non';
              if (field === 'badges') return m.badges?.join(', ') || 'Aucun';
              if (field === 'listId') return m.listId?.toString() || 'Aucune';
              return (m as any)[field] || 'N/A';
            });

            return (
              <div key={field} className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  {label}
                </label>
                <div className="space-y-2">
                  {members.map((member, index) => (
                    <label
                      key={index}
                      className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                        selectedFields[field] === index
                          ? "bg-purple-500/20 border border-purple-500"
                          : "hover:bg-gray-700/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={field}
                        checked={selectedFields[field] === index}
                        onChange={() => handleFieldSelection(field, index)}
                        className="w-4 h-4 text-purple-600 bg-[#0e0e10] border-gray-700 focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <span className="text-white font-medium">
                          Membre {index + 1} ({member.displayName}):
                        </span>
                        <span className="text-gray-300 ml-2">
                          {values[index]}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Aperçu du résultat */}
        <div className="mb-6 p-4 bg-[#0e0e10] border border-purple-500/30 rounded-lg">
          <h3 className="text-sm font-semibold text-purple-300 mb-2">
            Aperçu du membre fusionné:
          </h3>
          <div className="text-sm text-gray-300 space-y-1">
            <div>
              <span className="text-gray-400">Nom:</span>{" "}
              {members[selectedFields.displayName || 0]?.displayName}
            </div>
            <div>
              <span className="text-gray-400">Twitch:</span>{" "}
              {members[selectedFields.twitchLogin || 0]?.twitchLogin}
            </div>
            <div>
              <span className="text-gray-400">Discord:</span>{" "}
              {members[selectedFields.discordUsername || 0]?.discordUsername || 
               members[selectedFields.discordId || 0]?.discordId || "N/A"}
            </div>
            <div>
              <span className="text-gray-400">Rôle:</span>{" "}
              <span className={getRoleBadgeClassName(members[selectedFields.role || 0]?.role || "")}>
                {getRoleBadgeLabel(members[selectedFields.role || 0]?.role || "")}
              </span>
            </div>
          </div>
        </div>
    </GestionModalShell>
  );
}

