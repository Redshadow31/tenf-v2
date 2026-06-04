"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Radio, Sparkles } from "lucide-react";
import { isTenfMemberWithActiveRole } from "@/lib/memberRoles";

type HeaderPrimaryCtaProps = {
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
};

export default function HeaderPrimaryCta({ variant, onNavigate }: HeaderPrimaryCtaProps) {
  const { status } = useSession();
  const [memberRole, setMemberRole] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") {
      setMemberRole(null);
      setResolved(true);
      return;
    }

    let cancelled = false;
    setResolved(false);

    (async () => {
      try {
        const res = await fetch("/api/members/me", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setMemberRole(null);
          return;
        }
        const data = (await res.json()) as { member?: { role?: string } };
        if (!cancelled) setMemberRole(data.member?.role ?? null);
      } catch {
        if (!cancelled) setMemberRole(null);
      } finally {
        if (!cancelled) setResolved(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status]);

  const showLivesCta = status === "authenticated" && resolved && isTenfMemberWithActiveRole(memberRole);
  const showJoinCta = status !== "authenticated" || (resolved && !showLivesCta);

  if (status === "loading" || (status === "authenticated" && !resolved)) {
    return (
      <span
        aria-hidden
        className={
          variant === "mobile"
            ? "inline-flex h-11 w-full animate-pulse rounded-xl border"
            : "inline-flex h-9 w-[clamp(6.5rem,8vw,9.5rem)] animate-pulse rounded-xl border"
        }
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
      />
    );
  }

  if (!showJoinCta && !showLivesCta) return null;

  if (showLivesCta) {
    const livesClass =
      variant === "mobile"
        ? "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-md focus-visible:outline-none focus-visible:ring-2 motion-safe:hover:-translate-y-0.5"
        : "inline-flex items-center gap-1.5 rounded-xl px-[clamp(0.65rem,1vw,0.85rem)] py-[clamp(0.45rem,0.65vw,0.55rem)] text-[clamp(0.65rem,0.6rem+0.2vw,0.8rem)] font-bold text-white transition motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 sm:text-[clamp(0.75rem,0.68rem+0.22vw,0.875rem)]";

    return (
      <Link
        href="/lives"
        onClick={onNavigate}
        className={livesClass}
        style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #059669 100%)",
          boxShadow: "0 0 20px -6px rgba(124, 58, 237, 0.45)",
        }}
        aria-label="Voir les lives TENF en cours"
      >
        <Radio size={variant === "mobile" ? 16 : 14} aria-hidden className="shrink-0" />
        {variant === "mobile" ? (
          <span>Lives en cours</span>
        ) : (
          <>
            <span className="hidden sm:inline">Lives en cours</span>
            <span className="sm:hidden">Lives</span>
          </>
        )}
      </Link>
    );
  }

  const joinClass =
    variant === "mobile"
      ? "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-md focus-visible:outline-none focus-visible:ring-2"
      : "inline-flex items-center gap-1.5 rounded-xl px-[clamp(0.65rem,1vw,0.85rem)] py-[clamp(0.45rem,0.65vw,0.55rem)] text-[clamp(0.65rem,0.6rem+0.2vw,0.8rem)] font-bold text-white transition motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 sm:text-[clamp(0.75rem,0.68rem+0.22vw,0.875rem)]";

  return (
    <Link
      href="/rejoindre"
      onClick={onNavigate}
      className={joinClass}
      style={{ backgroundColor: "var(--color-primary)" }}
      aria-label="Rejoindre TENF"
    >
      <Sparkles size={variant === "mobile" ? 16 : 14} aria-hidden className="shrink-0" />
      <span className={variant === "desktop" ? "hidden sm:inline" : undefined}>Rejoindre TENF</span>
      <span className={variant === "desktop" ? "sm:hidden" : undefined}>Rejoindre</span>
    </Link>
  );
}
