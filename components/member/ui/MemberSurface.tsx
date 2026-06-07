import type { CSSProperties, ReactNode } from "react";

type MemberSurfaceProps = {
  children: ReactNode;
  /**
   * `default` : colonne centrée max-w-6xl (comportement historique).
   * `fluid` : occupe la largeur du `<main>` avec marges latérales en `clamp()`
   * — lisible au zoom navigateur.
   */
  layout?: "default" | "fluid";
  /**
   * Avec `layout="fluid"` : marges latérales plus serrées pour laisser la grille bento
   * occuper les côtés (dashboard, profil, compléter…).
   */
  wide?: boolean;
  /**
   * Avec `layout="fluid"` : pas de plafond max-width interne — 100 % du `<main>`.
   */
  fill?: boolean;
};

const FLUID_OUTER_STYLE: CSSProperties = {
  // @ts-expect-error propriété CSS personnalisée pour le padding horizontal fluide
  "--member-surface-px": "clamp(0.75rem, 2vw, 2.5rem)",
  paddingLeft: "var(--member-surface-px)",
  paddingRight: "var(--member-surface-px)",
  paddingTop: "clamp(0.75rem, 1.5vw, 1.5rem)",
  paddingBottom: "clamp(0.75rem, 1.5vw, 1.5rem)",
  width: "100%",
  minWidth: 0,
};

const FLUID_OUTER_WIDE_STYLE: CSSProperties = {
  // @ts-expect-error propriété CSS personnalisée
  "--member-surface-px": "clamp(0.4rem, 0.25rem + 0.85vw, 1.15rem)",
  paddingLeft: "var(--member-surface-px)",
  paddingRight: "var(--member-surface-px)",
  paddingTop: "clamp(0.55rem, 0.4rem + 0.9vw, 1.35rem)",
  paddingBottom: "clamp(0.55rem, 0.4rem + 0.9vw, 1.35rem)",
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
};

const FLUID_INNER_STYLE: CSSProperties = {
  maxWidth: "min(120rem, 100%)",
  marginLeft: "auto",
  marginRight: "auto",
  width: "100%",
  minWidth: 0,
};

const FLUID_INNER_WIDE_STYLE: CSSProperties = {
  maxWidth: "100%",
  width: "100%",
  minWidth: 0,
};

const FLUID_INNER_FILL_STYLE: CSSProperties = {
  width: "100%",
  minWidth: 0,
  maxWidth: "none",
};

export default function MemberSurface({
  children,
  layout = "default",
  wide = false,
  fill = false,
}: MemberSurfaceProps) {
  if (layout === "fluid") {
    const innerStyle = fill
      ? FLUID_INNER_FILL_STYLE
      : wide
        ? FLUID_INNER_WIDE_STYLE
        : FLUID_INNER_STYLE;

    return (
      <div style={wide || fill ? FLUID_OUTER_WIDE_STYLE : FLUID_OUTER_STYLE}>
        <div
          style={innerStyle}
          className="w-full min-w-0 space-y-[clamp(0.65rem,1vw,1.5rem)] sm:space-y-[clamp(0.85rem,1.25vw,1.75rem)]"
        >
          {children}
        </div>
      </div>
    );
  }

  return <div className="mx-auto w-full max-w-6xl space-y-3 sm:space-y-6">{children}</div>;
}
