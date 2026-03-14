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
  return (
    <article
      className="group overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-0.5"
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
      </div>

      <div className="space-y-2.5 p-3.5 md:space-y-3 md:p-5">
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
          className="inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-[1px] hover:opacity-95 md:py-2.5"
          style={{ backgroundColor: "var(--color-primary)", boxShadow: "0 10px 22px rgba(145,70,255,0.24)" }}
        >
          Rejoindre le live
        </a>
      </div>
    </article>
  );
}
