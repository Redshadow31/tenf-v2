"use client";

import { Twitch } from "lucide-react";
import ProfileSectionCard from "@/components/member/profil/ProfileSectionCard";

type TwitchLinkStatus = {
  loading: boolean;
  connected: boolean;
  login: string | null;
  displayName: string | null;
};

type ProfileTwitchPanelProps = {
  status: TwitchLinkStatus;
  startHref: string;
  reconnectHref: string;
  twitchLinkedNow: boolean;
  twitchError: string | null;
  onDisconnect: () => void;
  disconnecting: boolean;
};

export default function ProfileTwitchPanel({
  status,
  startHref,
  reconnectHref,
  twitchLinkedNow,
  twitchError,
  onDisconnect,
  disconnecting,
}: ProfileTwitchPanelProps) {
  return (
    <ProfileSectionCard
      id="twitch-connection"
      title="Connexion Twitch"
      description="Le lien OAuth qui permet à TENF de t’afficher correctement (planning, profil, outils)."
      icon={Twitch}
      accentClassName="border-[#9146FF]/45 bg-[#9146FF]/15 text-[#d8b6ff]"
    >
      <div className="grid gap-[clamp(0.55rem,0.85vw,0.9rem)]">
        {twitchLinkedNow ? (
          <p className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-[clamp(0.78rem,0.88vw,0.88rem)] text-emerald-200">
            Compte Twitch relié avec succès.
          </p>
        ) : null}
        {twitchError ? (
          <p className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-[clamp(0.78rem,0.88vw,0.88rem)] text-red-200">
            Liaison Twitch échouée ({twitchError}). Réessaie ou contacte le staff si ça bloque.
          </p>
        ) : null}

        <div className="rounded-2xl border border-white/[0.06] bg-black/25 p-[clamp(0.7rem,0.95vw,1rem)]">
          {status.loading ? (
            <p className="text-sm animate-pulse text-zinc-500">Vérification du lien Twitch…</p>
          ) : status.connected ? (
            <div className="space-y-3">
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#ad92ff]">
                  Connecté
                </p>
                <p
                  className="mt-1 text-pretty font-bold text-white"
                  style={{ fontSize: "clamp(1rem,1.15vw,1.2rem)" }}
                >
                  {status.displayName || status.login || "Twitch"}
                </p>
                {status.login ? <p className="text-sm text-zinc-400">@{status.login}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={reconnectHref}
                  className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#9146FF]/45 bg-[#9146FF]/15 px-3 py-2 text-sm font-semibold text-[#e9d5ff] transition hover:bg-[#9146FF]/25"
                >
                  Changer de compte
                </a>
                <button
                  type="button"
                  onClick={onDisconnect}
                  disabled={disconnecting}
                  className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-white/12 px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
                >
                  {disconnecting ? "Déconnexion…" : "Déconnecter"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                Non relié
              </p>
              <p
                className="text-pretty leading-relaxed text-zinc-300"
                style={{ fontSize: "clamp(0.82rem,0.92vw,0.92rem)" }}
              >
                Branche ton compte Twitch pour débloquer les fonctionnalités qui en dépendent. Tout passe par Twitch — pas de mot de passe partagé.
              </p>
              <a
                href={startHref}
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[#9146FF] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#462881]/40 transition hover:brightness-110 sm:w-auto"
              >
                Connecter Twitch
              </a>
            </div>
          )}
        </div>
      </div>
    </ProfileSectionCard>
  );
}
