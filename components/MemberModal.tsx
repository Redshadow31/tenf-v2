"use client";

import { useEffect } from "react";
import Link from "next/link";

type MemberModalProps = {
  member: {
    id: string;
    name: string;
    role: string;
    avatar: string;
    twitchLogin: string;
    description?: string;
    twitchUrl?: string;
    socials?: {
      discord?: string;
      instagram?: string;
      twitter?: string;
      youtube?: string;
    };
    isVip?: boolean;
  };
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
};

export default function MemberModal({
  member,
  isOpen,
  onClose,
  isAdmin = false,
}: MemberModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getBadgeColor = (role: string) => {
    switch (role) {
      case "Staff":
        return "bg-[#9146ff] text-white";
      case "Développement":
        return "bg-[#5a32b4] text-white";
      case "Affilié":
        return "bg-[#9146ff]/20 text-[#9146ff] border border-[#9146ff]/30";
      case "Mentor":
        return "bg-gray-700 text-white";
      case "Admin":
        return "bg-gray-700 text-white";
      default:
        return "bg-gray-700 text-white";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="card relative max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-[#1a1a1d] border border-gray-700 p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg bg-[#0e0e10] p-2 text-gray-400 transition-colors hover:text-white"
        >
          <svg
            className="h-6 w-6"
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

        {/* Contenu du modal */}
        <div className="flex flex-col items-center space-y-6 text-center">
          {/* Avatar avec badge VIP */}
          <div className="relative">
            <img
              src={member.avatar}
              alt={member.name}
              className="h-32 w-32 rounded-full object-cover border-4 border-gray-700"
            />
            {member.isVip && (
              <div className="absolute -bottom-2 -right-2 rounded-full bg-[#9146ff] px-3 py-1 text-xs font-bold text-white">
                VIP
              </div>
            )}
          </div>

          {/* Nom et badge rôle */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white">{member.name}</h2>
            <span
              className={`inline-block rounded-lg px-4 py-1 text-sm font-bold ${getBadgeColor(
                member.role
              )}`}
            >
              {member.role}
            </span>
          </div>

          {/* Description Twitch */}
          <div className="w-full space-y-2">
            <h3 className="text-lg font-semibold text-white">Description</h3>
            <p className="text-gray-300">
              {member.description ||
                "Aucune description disponible pour le moment."}
            </p>
            {isAdmin && (
              <button className="mt-2 rounded-lg bg-[#9146ff]/10 px-4 py-2 text-sm font-medium text-[#9146ff] transition-colors hover:bg-[#9146ff]/20 border border-[#9146ff]/30">
                Modifier la description
              </button>
            )}
          </div>

          {/* Lien Twitch */}
          <div className="w-full space-y-3">
            <h3 className="text-lg font-semibold text-white">Chaîne Twitch</h3>
            <Link
              href={member.twitchUrl || `https://twitch.tv/${member.twitchLogin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#9146ff] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#5a32b4]"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
              </svg>
              Voir sur Twitch
            </Link>
          </div>

          {/* Autres réseaux sociaux */}
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Autres réseaux
              </h3>
              {isAdmin && (
                <button className="rounded-lg bg-[#9146ff]/10 px-3 py-1 text-xs font-medium text-[#9146ff] transition-colors hover:bg-[#9146ff]/20 border border-[#9146ff]/30">
                  + Ajouter
                </button>
            )}
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {member.socials?.discord && (
                <Link
                  href={member.socials.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-[#5865F2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4752C4]"
                >
                  Discord
                </Link>
              )}
              {member.socials?.instagram && (
                <Link
                  href={member.socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
                >
                  Instagram
                </Link>
              )}
              {member.socials?.twitter && (
                <Link
                  href={member.socials.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-[#1DA1F2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a8cd8]"
                >
                  Twitter
                </Link>
              )}
              {member.socials?.youtube && (
                <Link
                  href={member.socials.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-[#FF0000] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#cc0000]"
                >
                  YouTube
                </Link>
              )}
              {(!member.socials?.discord &&
                !member.socials?.instagram &&
                !member.socials?.twitter &&
                !member.socials?.youtube) && (
                <p className="text-sm text-gray-400">
                  Aucun réseau social ajouté
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

