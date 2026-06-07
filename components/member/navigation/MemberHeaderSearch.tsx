"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  buildMemberSidebarSearchEntries,
  filterMemberSidebarSearchEntries,
  type MemberSidebarSearchEntry,
} from "@/lib/navigation/memberSidebar";
import { useMemberSidebarSearch } from "@/contexts/MemberSidebarSearchContext";

type MemberHeaderSearchProps = {
  variant?: "desktop" | "mobile";
  onItemSelect?: () => void;
};

const SEARCH_ENTRIES = buildMemberSidebarSearchEntries();

export default function MemberHeaderSearch({ variant = "desktop", onItemSelect }: MemberHeaderSearchProps) {
  const router = useRouter();
  const { query, setQuery, clearQuery } = useMemberSidebarSearch();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(
    () => filterMemberSidebarSearchEntries(query, SEARCH_ENTRIES.filter((item) => !item.disabled)),
    [query],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "k") return;
      const tag = (event.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (event.target as HTMLElement | null)?.isContentEditable) return;
      event.preventDefault();
      inputRef.current?.focus();
      setOpen(true);
    }
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  function navigateTo(item: MemberSidebarSearchEntry) {
    setOpen(false);
    clearQuery();
    onItemSelect?.();
    if (item.external) {
      window.open(item.href, "_blank", "noopener,noreferrer");
      return;
    }
    router.push(item.href);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    const navigable = matches.filter((item) => !item.disabled);
    if (navigable.length > 0) {
      navigateTo(navigable[activeIndex] ?? navigable[0]);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (matches.length > 0) {
        setOpen(true);
        setActiveIndex((idx) => (idx + 1) % matches.length);
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (matches.length > 0) {
        setOpen(true);
        setActiveIndex((idx) => (idx - 1 + matches.length) % matches.length);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  const inputId = variant === "desktop" ? "member-header-search-desktop" : "member-header-search-mobile";

  return (
    <div
      ref={containerRef}
      className={variant === "desktop" ? "relative w-full max-w-[min(17rem,calc(100vw-26rem))]" : "relative w-full"}
    >
      <form onSubmit={handleSubmit} role="search" aria-label="Rechercher dans ton espace membre">
        <label htmlFor={inputId} className="sr-only">
          Rechercher une page de l&apos;espace membre
        </label>
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--color-text-secondary)" }}
            aria-hidden
          />
          <input
            ref={inputRef}
            id={inputId}
            type="search"
            value={query}
            placeholder={variant === "desktop" ? "Ton espace… (Ctrl+K)" : "Ton espace membre…"}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm transition focus:outline-none focus-visible:ring-2"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "color-mix(in srgb, var(--color-card) 70%, transparent)",
              color: "var(--color-text)",
            }}
          />
        </div>
      </form>

      {open && query.trim().length > 0 ? (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-50 max-h-64 overflow-y-auto rounded-xl border py-1 shadow-xl"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-bg)",
          }}
        >
          {matches.length === 0 ? (
            <li className="px-3 py-2.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Aucun lien membre pour « {query.trim()} »
            </li>
          ) : (
            matches.map((item, idx) => (
              <li key={`${item.href}-${item.label}`} role="option" aria-selected={idx === activeIndex}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => navigateTo(item)}
                  className="flex w-full flex-col gap-0.5 px-3 py-2 text-left transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500/50"
                  style={{
                    backgroundColor: idx === activeIndex ? "rgba(139, 92, 246, 0.12)" : undefined,
                  }}
                >
                  <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                    {item.label}
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {item.sectionTitle}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
