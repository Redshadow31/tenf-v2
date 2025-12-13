"use client";

import { useState } from "react";

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
  onClose: () => void;
  onSave: (member: MemberData) => void;
}

export default function EditMemberCompletModal({
  member,
  onClose,
  onSave,
}: EditMemberCompletModalProps) {
  const [formData, setFormData] = useState<MemberData>(member);

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
              <option value="Affilié">Affilié</option>
              <option value="Développement">Développement</option>
              <option value="Staff">Staff</option>
              <option value="Mentor">Mentor</option>
              <option value="Admin">Admin</option>
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

