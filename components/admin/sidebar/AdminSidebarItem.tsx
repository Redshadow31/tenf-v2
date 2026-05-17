"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

type CommonProps = {
  label: string;
  depth?: 0 | 1 | 2;
  active?: boolean;
  parentActive?: boolean;
  badge?: ReactNode;
  iconChar?: string | null;
  children?: ReactNode;
};

type LeafProps = CommonProps & {
  href: string;
  expandable?: false;
};

type ExpandableProps = CommonProps & {
  href: string;
  expandable: true;
  open: boolean;
  onToggle: () => void;
};

type Props = LeafProps | ExpandableProps;

/**
 * Lien de navigation admin — surfaces douces, actif lisible, palette cohérente.
 * Labels longs : wrap (pas de truncate sur une ligne unique).
 */
export default function AdminSidebarItem(props: Props) {
  const { label, active, parentActive, badge, children, depth = 1, iconChar = null } = props;
  const expandable = "expandable" in props && props.expandable === true;
  const open = expandable ? (props as ExpandableProps).open : false;

  const baseClass =
    "group relative flex w-full items-start gap-2 rounded-md pr-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/45 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-950";

  const indentPx = depth === 0 ? 10 : depth === 1 ? 10 : 18;
  const paddingStyle = { paddingLeft: indentPx, paddingTop: "0.3rem", paddingBottom: "0.3rem" };

  // État actif : un peu plus marqué qu'avant pour rendre l'item courant clairement
  // identifiable, tout en restant cohérent avec la palette violet/indigo/rose doux.
  const stateClass = active
    ? "bg-gradient-to-r from-violet-500/[0.18] via-indigo-500/[0.10] to-transparent text-zinc-50 shadow-[inset_0_0_0_1px_rgba(167,139,250,0.16)]"
    : parentActive
      ? "text-zinc-200/95 hover:bg-white/[0.025] hover:text-zinc-50"
      : "text-zinc-400/90 hover:bg-white/[0.02] hover:text-zinc-100";

  const fontSizeStyle =
    depth === 0
      ? { fontSize: "clamp(0.65rem,0.62rem+0.09vw,0.71rem)" }
      : depth === 1
        ? { fontSize: "clamp(0.63rem,0.60rem+0.08vw,0.69rem)" }
        : { fontSize: "clamp(0.60rem,0.57rem+0.07vw,0.66rem)" };

  const activeBar = active ? (
    <span
      aria-hidden
      className="absolute left-[3px] top-1.5 bottom-1.5 w-[3px] rounded-full bg-gradient-to-b from-rose-300/90 via-violet-300/95 to-indigo-300/80 shadow-[0_0_10px_rgba(167,139,250,0.4)]"
    />
  ) : null;

  const iconNode = iconChar ? (
    <span
      aria-hidden
      className={
        "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] leading-none transition-colors " +
        (active
          ? "text-violet-100"
          : "text-violet-300/45 group-hover:text-violet-200/85")
      }
    >
      {iconChar}
    </span>
  ) : null;

  const content = (
    <>
      {activeBar}
      {iconNode}
      <span
        className={
          "min-w-0 flex-1 text-pretty leading-snug [overflow-wrap:normal] [word-break:keep-all] [hyphens:none] " +
          (active ? "font-semibold text-zinc-50" : "font-normal")
        }
        style={fontSizeStyle}
      >
        {label}
      </span>
      {badge ? <span className="mt-0.5 shrink-0">{badge}</span> : null}
      {expandable ? (
        <ChevronRight
          aria-hidden
          className={
            "mt-1 ml-auto h-3 w-3 shrink-0 transition-all duration-150 " +
            (open
              ? "rotate-90 text-violet-300/80"
              : "text-zinc-500/60 group-hover:text-violet-300/70")
          }
        />
      ) : null}
    </>
  );

  if (expandable) {
    const exp = props as ExpandableProps;
    return (
      <li>
        <button
          type="button"
          onClick={exp.onToggle}
          className={baseClass + " " + stateClass}
          style={paddingStyle}
          aria-expanded={open}
          aria-current={active ? "page" : undefined}
        >
          {content}
        </button>
        {open ? (
          <div
            className="relative mt-0.5 space-y-0.5"
            style={{ marginLeft: indentPx + 4 }}
          >
            <span
              aria-hidden
              className="absolute bottom-0 left-0 top-0 w-px rounded-full bg-gradient-to-b from-indigo-400/35 via-violet-400/25 to-rose-400/15"
            />
            <div className="space-y-0.5 pl-2.5">{children}</div>
          </div>
        ) : null}
      </li>
    );
  }

  const leaf = props as LeafProps;
  return (
    <li>
      <Link
        href={leaf.href}
        className={baseClass + " " + stateClass}
        style={paddingStyle}
        aria-current={active ? "page" : undefined}
      >
        {content}
      </Link>
    </li>
  );
}
