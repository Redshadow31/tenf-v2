"use client";

import {
  CheckCircle2,
  Lock,
  Radio,
  ShieldCheck,
  Sparkles,
  Twitch,
  UserCircle2,
  Users2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ProfileSectionCard from "@/components/member/profil/ProfileSectionCard";
import { DashboardInnerCard, MemberAlert } from "@/components/member/dashboard/dashboardUi";

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

const TWITCH_FEATURES: { icon: LucideIcon; label: string; detail: string }[] = [
  {
    icon: UserCircle2,
    label: "Ta fiche publique",
    detail: "Avatar, pseudo et lien vers ta chaîne dans l'annuaire TENF.",
  },
  {
    icon: Radio,
    label: "Planning & lives",
    detail: "Tes créneaux visibles par la communauté, repérables sur /lives.",
  },
  {
    icon: Sparkles,
    label: "Raids automatiques",
    detail: "Tes passages en live sont comptés — pas de déclaration manuelle.",
  },
  {
    icon: Users2,
    label: "Suivi réseau",
    detail: "Follows entre membres et repères d'entraide du mois.",
  },
];

export default function ProfileTwitchPanel({
  status,
  startHref,
  reconnectHref,
  twitchLinkedNow,
  twitchError,
  onDisconnect,
  disconnecting,
}: ProfileTwitchPanelProps) {
  const connected = status.connected;

  return (
    <ProfileSectionCard
      id="twitch-connection"
      kicker="OAuth"
      title="Connexion Twitch"
      description={
        connected
          ? "Ton compte est relié — les outils TENF qui en dépendent tournent normalement."
          : "Une autorisation officielle Twitch pour activer ton espace membre. On ne voit jamais ton mot de passe."
      }
      icon={Twitch}
      tone="violet"
      accentHex="#9146ff"
    >
      <div className="flex flex-col gap-2.5">
        {twitchLinkedNow ? (
          <MemberAlert variant="success">
            Compte Twitch relié avec succès — merci, tout est prêt de ce côté.
          </MemberAlert>
        ) : null}
        {twitchError ? (
          <MemberAlert variant="error">
            Liaison échouée ({twitchError}). Réessaie tranquillement ou contacte le staff si ça persiste.
          </MemberAlert>
        ) : null}

        <div className="grid w-full gap-2.5 grid-cols-1 lg:grid-cols-2">
          <DashboardInnerCard accentHex="#9146ff" className="flex flex-col justify-between !p-4">
            {status.loading ? (
              <p className="text-sm animate-pulse text-white/50">Vérification du lien Twitch…</p>
            ) : connected ? (
              <>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-300">
                    Connecté
                  </p>
                  <p className="mt-1 text-lg font-bold text-white">
                    {status.displayName || status.login || "Twitch"}
                  </p>
                  {status.login ? <p className="text-sm text-white/50">@{status.login}</p> : null}
                  <p className="mt-3 text-xs leading-relaxed text-white/60">
                    C&apos;est bien ce compte qui alimente ton profil, ton planning et le suivi des raids.
                    Tu peux le changer ou le révoquer quand tu veux.
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={reconnectHref}
                    className="inline-flex min-h-[38px] items-center justify-center rounded-xl border border-[#9146FF]/45 bg-[#9146FF]/15 px-3 py-2 text-xs font-semibold text-violet-100 transition hover:bg-[#9146FF]/25"
                  >
                    Changer de compte
                  </a>
                  <button
                    type="button"
                    onClick={onDisconnect}
                    disabled={disconnecting}
                    className="inline-flex min-h-[38px] items-center justify-center rounded-xl border border-white/12 px-3 py-2 text-xs font-medium text-white/70 transition hover:bg-white/5 disabled:opacity-50"
                  >
                    {disconnecting ? "Déconnexion…" : "Déconnecter"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
                    Non relié
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-white/75">
                    TENF a besoin d&apos;une autorisation Twitch pour te reconnaître, afficher ta fiche et
                    compter ton activité (raids, planning, réseau). C&apos;est le standard utilisé par les
                    apps connectées à Twitch — rapide et réversible.
                  </p>
                </div>
                <a
                  href={startHref}
                  className="mt-4 inline-flex min-h-[42px] w-full items-center justify-center rounded-xl bg-[#9146FF] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-950/40 transition hover:brightness-110"
                >
                  Connecter mon compte Twitch
                </a>
              </>
            )}
          </DashboardInnerCard>

          <div className="flex min-h-0 flex-col gap-3">
            <DashboardInnerCard className="!p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-300/90">
                {connected ? "Fonctionnalités actives" : "Ce que tu débloques"}
              </p>
              <ul className="mt-2.5 space-y-2">
                {TWITCH_FEATURES.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <li key={feature.label} className="flex gap-2.5">
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-200"
                        aria-hidden
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                          {feature.label}
                          {connected ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" aria-hidden />
                          ) : null}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-white/50">
                          {feature.detail}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </DashboardInnerCard>

            <DashboardInnerCard className="!p-3.5">
              <div className="flex gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                <div className="min-w-0 text-[11px] leading-relaxed text-white/60">
                  <p className="font-semibold text-white/85">Pourquoi OAuth, et pas un mot de passe ?</p>
                  <p className="mt-1">
                    Tu te connectes directement chez Twitch. TENF ne stocke ni ton mot de passe ni tes
                    identifiants de stream. On reçoit seulement l&apos;accès nécessaire pour faire tourner
                    l&apos;espace membre — et tu peux couper le lien à tout moment depuis cette page.
                  </p>
                </div>
              </div>
              <p className="mt-2.5 flex items-center gap-1.5 text-[10px] text-white/40">
                <Lock className="h-3 w-3" aria-hidden />
                Connexion membre TENF = Discord · Outils stream = autorisation Twitch
              </p>
            </DashboardInnerCard>
          </div>
        </div>
      </div>
    </ProfileSectionCard>
  );
}
