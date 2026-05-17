import type { AdminMode } from "@/lib/admin/navigation";

type Props = {
  hubLabel: string | null;
  /** Conservé pour compat — non rendu (UX : pas d'emoji). */
  hubIcon?: string | null;
  description?: string | null;
  /** Conservé pour compat — non rendu (UX : pas de badge mode). */
  mode?: AdminMode;
  /** Conservé pour compat — non rendu (UX : pas de compteur de pages). */
  itemsCount?: number;
};

/**
 * Carte hub épurée :
 * - Pas d'emoji, pas de tagline « HUB ACTIF », pas de badges mode / pages.
 * - Titre éditorial mis en valeur avec un filet coloré et un trait d'accent.
 * - Description narrative qui explique la catégorie active.
 */
export default function AdminHubContextCard({ hubLabel, description }: Props) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-violet-500/25 via-indigo-500/10 to-rose-500/15 p-px shadow-[0_8px_24px_rgba(76,29,149,0.16)]">
      <section
        aria-label={hubLabel ? `Section active : ${hubLabel}` : "Section active"}
        className="relative overflow-hidden rounded-[0.7rem] border border-white/[0.04] bg-[radial-gradient(120%_80%_at_50%_-30%,rgba(167,139,250,0.10),transparent_55%),linear-gradient(165deg,rgba(20,20,28,0.96)_0%,rgba(12,12,18,0.98)_60%,rgba(8,8,14,0.99)_100%)] px-3 py-2.5"
      >
        {/* Filet supérieur tricolore */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-rose-300/25 via-violet-300/45 to-indigo-300/30"
        />
        {/* Halos d'ambiance — discrets */}
        <span
          aria-hidden
          className="pointer-events-none absolute -left-12 top-0 h-24 w-24 rounded-full bg-violet-500/[0.05] blur-3xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 bottom-0 h-20 w-20 rounded-full bg-indigo-500/[0.04] blur-3xl"
        />

        {/* Pin d'accent tricolore */}
        <span
          aria-hidden
          className="relative mb-1.5 inline-block h-[2px] w-7 rounded-full bg-gradient-to-r from-rose-300/80 via-violet-300/90 to-indigo-300/75 shadow-[0_0_6px_rgba(167,139,250,0.30)]"
        />

        {/* Titre éditorial */}
        <h2
          className="relative text-pretty font-semibold leading-[1.15] tracking-tight text-white/95 drop-shadow-sm [overflow-wrap:break-word] [word-break:normal]"
          style={{ fontSize: "clamp(0.88rem,0.80rem+0.30vw,1.05rem)" }}
          title={hubLabel || undefined}
        >
          {hubLabel || "Espace admin"}
        </h2>

        {/* Description narrative */}
        {description ? (
          <p
            className="relative mt-1.5 text-pretty leading-relaxed text-zinc-300/75 [overflow-wrap:break-word] [word-break:normal]"
            style={{ fontSize: "clamp(0.60rem,0.56rem+0.10vw,0.70rem)" }}
          >
            {description}
          </p>
        ) : null}
      </section>
    </div>
  );
}
