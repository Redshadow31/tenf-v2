"use client";

import { useState, useEffect } from "react";

type MemberRole = "Affilié" | "Développement" | "Staff" | "Mentor" | "Admin" | "Admin Adjoint" | "Créateur Junior";

interface Member {
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
  integrationDate?: string; // Date ISO d'intégration
  roleHistory?: Array<{
    fromRole: string;
    toRole: string;
    changedAt: string;
    changedBy: string;
    reason?: string;
  }>;
}

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  onSave: (member: Member) => void;
}

export default function EditMemberModal({
  isOpen,
  onClose,
  member,
  onSave,
}: EditMemberModalProps) {
  const [formData, setFormData] = useState<Member>(member);
  const [badgeInput, setBadgeInput] = useState("");
  const [showRoleHistory, setShowRoleHistory] = useState(false);
  const [roleChangeReason, setRoleChangeReason] = useState("");
  const originalRole = member.role;

  useEffect(() => {
    if (isOpen) {
      setFormData(member);
      setBadgeInput("");
      setRoleChangeReason("");
    }
  }, [isOpen, member]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Si le rôle a changé, ajouter roleChangeReason aux données
    const dataToSave = { ...formData };
    if (formData.role !== originalRole) {
      (dataToSave as any).roleChangeReason = roleChangeReason || undefined;
    }
    onSave(dataToSave);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Modifier le membre</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <img
              src={formData.avatar}
              alt={formData.nom}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div>
              <p className="text-white font-semibold">{formData.nom}</p>
              <p className="text-sm text-gray-400">ID: {formData.id}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Nom du créateur *
            </label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Pseudo Twitch *
            </label>
            <input
              type="text"
              value={formData.twitch}
              onChange={(e) => setFormData({ ...formData, twitch: e.target.value })}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Pseudo Discord *
            </label>
            <input
              type="text"
              value={formData.discord}
              onChange={(e) => setFormData({ ...formData, discord: e.target.value })}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              required
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
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              placeholder="Ex: 535244297214361603"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              ID Twitch (numérique)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={formData.twitchId || ""}
                onChange={(e) => setFormData({ ...formData, twitchId: e.target.value })}
                className="flex-1 bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                placeholder="Ex: 123456789 (résolu automatiquement)"
              />
              {formData.twitch && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm(`Synchroniser l'ID Twitch pour ${formData.twitch} ?`)) return;
                    try {
                      const response = await fetch('/api/admin/members/sync-twitch-id', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ twitchLogin: formData.twitch }),
                      });
                      const data = await response.json();
                      if (response.ok && data.success && data.results?.[0]?.twitchId) {
                        setFormData({ ...formData, twitchId: data.results[0].twitchId });
                        alert(`✅ ID Twitch synchronisé: ${data.results[0].twitchId}`);
                      } else {
                        alert(`❌ ${data.error || 'Impossible de synchroniser l\'ID Twitch'}`);
                      }
                    } catch (error) {
                      console.error('Erreur sync Twitch ID:', error);
                      alert('❌ Erreur lors de la synchronisation');
                    }
                  }}
                  className="text-sm text-purple-400 hover:text-purple-300 bg-purple-600/20 hover:bg-purple-600/30 px-3 py-2 rounded-lg border border-purple-500/30"
                  title="Synchroniser depuis Twitch API"
                >
                  🔄 Sync
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formData.twitchId ? (
                <span className="text-green-400">✅ ID Twitch lié</span>
              ) : (
                <span className="text-yellow-400">⚠️ ID manquant - utilisez le bouton Sync pour résoudre automatiquement</span>
              )}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-300">
                Rôle
              </label>
              {formData.roleHistory && formData.roleHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowRoleHistory(true)}
                  className="text-xs text-purple-400 hover:text-purple-300 underline"
                >
                  📜 Historique des rôles
                </button>
              )}
            </div>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as MemberRole })}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="Affilié">Affilié</option>
              <option value="Développement">Développement</option>
              <option value="Staff">Staff</option>
              <option value="Mentor">Mentor</option>
              <option value="Admin">Admin</option>
              <option value="Admin Adjoint">Admin Adjoint</option>
              <option value="Créateur Junior">Créateur Junior</option>
            </select>
            {formData.role !== originalRole && (
              <div className="mt-2">
                <label className="block text-xs text-gray-400 mb-1">
                  Raison du changement de rôle (optionnel)
                </label>
                <input
                  type="text"
                  value={roleChangeReason}
                  onChange={(e) => setRoleChangeReason(e.target.value)}
                  className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  placeholder="Ex: Promotion, changement de fonction..."
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Statut
            </label>
            <select
              value={formData.statut}
              onChange={(e) =>
                setFormData({ ...formData, statut: e.target.value as "Actif" | "Inactif" })
              }
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="Actif">Actif</option>
              <option value="Inactif">Inactif</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Badges
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={badgeInput}
                  onChange={(e) => setBadgeInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (badgeInput.trim() && !formData.badges?.includes(badgeInput.trim())) {
                        setFormData({
                          ...formData,
                          badges: [...(formData.badges || []), badgeInput.trim()],
                        });
                        setBadgeInput("");
                      }
                    }
                  }}
                  className="flex-1 bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  placeholder="Ajouter un badge (ex: VIP Élite, Modérateur Junior...)"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (badgeInput.trim() && !formData.badges?.includes(badgeInput.trim())) {
                      setFormData({
                        ...formData,
                        badges: [...(formData.badges || []), badgeInput.trim()],
                      });
                      setBadgeInput("");
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                >
                  Ajouter
                </button>
              </div>
              {formData.badges && formData.badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.badges.map((badge, index) => (
                    <span
                      key={index}
                      className="bg-purple-600/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-2"
                    >
                      {badge}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            badges: formData.badges?.filter((_, i) => i !== index),
                          });
                        }}
                        className="text-purple-300 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              VIP
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isVip || false}
                onChange={(e) => setFormData({ ...formData, isVip: e.target.checked })}
                className="w-4 h-4 text-purple-600 bg-[#0e0e10] border-gray-700 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-300">Membre VIP</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Descriptif du streamer
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 min-h-[100px]"
              placeholder="Description publique du streamer..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Date d'intégration
            </label>
            <input
              type="date"
              value={formData.integrationDate ? formData.integrationDate.split('T')[0] : ""}
              onChange={(e) => {
                const dateValue = e.target.value;
                setFormData({
                  ...formData,
                  integrationDate: dateValue ? new Date(dateValue).toISOString() : undefined,
                });
              }}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Date de la réunion d'intégration validée
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Notes internes
            </label>
            <textarea
              value={formData.notesInternes || ""}
              onChange={(e) => setFormData({ ...formData, notesInternes: e.target.value })}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 min-h-[100px]"
              placeholder="Notes internes (non visibles publiquement)..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>

        {/* Modal Historique des rôles */}
        {showRoleHistory && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setShowRoleHistory(false)}
          >
            <div
              className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Historique des rôles</h3>
                <button
                  onClick={() => setShowRoleHistory(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              {formData.roleHistory && formData.roleHistory.length > 0 ? (
                <div className="space-y-3">
                  {formData.roleHistory.map((entry, index) => (
                    <div
                      key={index}
                      className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-white font-semibold">
                            {entry.fromRole} → {entry.toRole}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            {new Date(entry.changedAt).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-300">
                        <span className="text-gray-500">Modifié par:</span> {entry.changedBy}
                      </div>
                      {entry.reason && (
                        <div className="text-sm text-gray-400 mt-2 italic">
                          Raison: {entry.reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  Aucun historique de changement de rôle
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


