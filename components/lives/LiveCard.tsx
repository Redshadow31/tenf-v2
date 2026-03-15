import type { LiveMember } from "@/components/lives/types";
import { getRoleBadgeClassName, getRoleBadgeLabel } from "@/lib/roleBadgeSystem";

function formatLiveDuration(startedAt: string): string {
  const start = new Date(startedAt).getTime();
  if (Number.isNaN(start)) return "N/A";
  const diffMin = Math.max(0, Math.floor((Date.now() - start) / 60000));
  const hours = Math.floor(diffMin / 60);
  const minutes = diffMin % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

type LiveCardProps = {
  live: LiveMember;
};

export default function LiveCard({ live }: LiveCardProps) {
  const integrationTs = live.integrationDate ? new Date(live.integrationDate).getTime() : NaN;
  const isNewMember =
    Number.isFinite(integrationTs) &&
    integrationTs <= Date.now() &&
    Date.now() - integrationTs <= 7 * 24 * 60 * 60 * 1000;
  const isVipMember = live.isVip === true;
  const isDiscoverCta = live.followState === "not_followed";

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-0.5"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-card)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.24)",
      }}
    >
      <div className="relative aspect-video w-full overflow-hidden">
        <img
          src={live.thumbnailUrl}
          alt={`Miniature live ${live.displayName}`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          onError={(event) => {
            (event.currentTarget as HTMLImageElement).src =
              "https://placehold.co/640x360?text=Live+TENF";
          }}
        />
        <div className="absolute left-3 top-3 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow">
          LIVE
        </div>
        {isVipMember || isNewMember ? (
          <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
            {isVipMember ? (
              <div className="inline-flex animate-pulse items-center gap-1.5 rounded-full border border-amber-300/60 bg-gradient-to-r from-amber-500/30 to-yellow-400/25 px-2.5 py-1 text-xs font-extrabold tracking-[0.02em] text-amber-100 shadow-[0_0_16px_rgba(251,191,36,0.32)]">
                <span aria-hidden="true">⭐</span>
                VIP
              </div>
            ) : null}
            {isNewMember ? (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/50 bg-cyan-500/20 px-2.5 py-1 text-xs font-semibold text-cyan-100 shadow">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-200" aria-hidden="true" />
                Nouveau
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-3.5 md:gap-3 md:p-5">
        {(live.isSpotlight || live.isBirthdayToday || live.isAffiliateAnniversaryToday) && (
          <div className="flex flex-wrap gap-1.5 text-[11px] md:gap-2 md:text-xs">
            {live.isSpotlight && (
              <span className="rounded-full border border-amber-300/50 bg-amber-500/20 px-2.5 py-1 font-semibold text-amber-200">
                Spotlight TENF
              </span>
            )}
            {live.isBirthdayToday && (
              <span className="rounded-full border border-pink-300/50 bg-pink-500/20 px-2.5 py-1 font-semibold text-pink-200">
                Anniversaire du streamer
              </span>
            )}
            {live.isAffiliateAnniversaryToday && (
              <span className="rounded-full border border-cyan-300/50 bg-cyan-500/20 px-2.5 py-1 font-semibold text-cyan-200">
                Anniversaire d'affiliation
              </span>
            )}
          </div>
        )}

        <div className="flex items-start gap-3">
          <img
            src={live.avatar}
            alt={live.displayName}
            className="h-9 w-9 rounded-full border object-cover md:h-11 md:w-11"
            style={{ borderColor: "var(--color-border)" }}
            onError={(event) => {
              (event.currentTarget as HTMLImageElement).src =
                `https://placehold.co/44x44?text=${live.displayName.charAt(0)}`;
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.95rem] font-semibold md:text-[1.05rem]" style={{ color: "var(--color-text)" }}>
              {live.displayName}
            </p>
            <p className="truncate text-xs" style={{ color: "var(--color-text-secondary)" }}>
              @{live.twitchLogin}
            </p>
            <p className="mt-1 hidden truncate text-xs md:block" style={{ color: "var(--color-text-secondary)" }}>
              {live.title || "Titre indisponible"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 text-[11px] md:gap-2 md:text-xs">
          <span className="rounded-full border px-2.5 py-1" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
            {live.game || "Jeu non renseigne"}
          </span>
          <span
            className={getRoleBadgeClassName(live.role)}
          >
            {getRoleBadgeLabel(live.role)}
          </span>
          <span className="rounded-full border px-2.5 py-1" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
            Duree: {formatLiveDuration(live.startedAt)}
          </span>
        </div>

        <a
          href={live.twitchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-[1px] hover:opacity-95 md:py-2.5"
          style={{ backgroundColor: "var(--color-primary)", boxShadow: "0 10px 22px rgba(145,70,255,0.24)" }}
        >
          {isDiscoverCta ? "Decouvrir le createur" : "Rejoindre le live"}
        </a>
      </div>
    </article>
  );
}
