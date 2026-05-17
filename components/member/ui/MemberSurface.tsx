import type { CSSProperties, ReactNode } from "react";

type MemberSurfaceProps = {
  children: ReactNode;
  /**
   * `default` : colonne centrée max-w-6xl (comportement historique).
   * `fluid` : occupe la largeur du `<main>` avec marges latérales en `clamp()`
   * et conteneur `min(120rem, 100%)` — lisible au zoom navigateur.
   */
  layout?: "default" | "fluid";
  /**
   * Avec `layout="fluid"` : marges et plafond de largeur un peu plus généreux
   * (pages type inbox qui doivent respirer au zoom et sur grands écrans).
   */
  wide?: boolean;
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
  "--member-surface-px": "clamp(0.6rem, 0.35rem + 1.65vw, 3.25rem)",
  paddingLeft: "var(--member-surface-px)",
  paddingRight: "var(--member-surface-px)",
  paddingTop: "clamp(0.65rem, 0.5rem + 1.25vw, 1.75rem)",
  paddingBottom: "clamp(0.65rem, 0.5rem + 1.25vw, 1.75rem)",
  width: "100%",
  minWidth: 0,
};

const FLUID_INNER_STYLE: CSSProperties = {
  maxWidth: "min(120rem, 100%)",
  marginLeft: "auto",
  marginRight: "auto",
  width: "100%",
};

const FLUID_INNER_WIDE_STYLE: CSSProperties = {
  maxWidth: "min(100%, 140rem)",
  marginLeft: "auto",
  marginRight: "auto",
  width: "100%",
};

export default function MemberSurface({ children, layout = "default", wide = false }: MemberSurfaceProps) {
  if (layout === "fluid") {
    return (
      <div style={wide ? FLUID_OUTER_WIDE_STYLE : FLUID_OUTER_STYLE}>
        <div style={wide ? FLUID_INNER_WIDE_STYLE : FLUID_INNER_STYLE} className="space-y-[clamp(0.65rem,1vw,1.5rem)] sm:space-y-[clamp(0.85rem,1.25vw,1.75rem)]">
          {children}
        </div>
      </div>
    );
  }

  return <div className="mx-auto w-full max-w-6xl space-y-3 sm:space-y-6">{children}</div>;
}
