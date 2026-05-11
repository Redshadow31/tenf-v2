import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

interface AdminTableShellProps {
  title: string;
  subtitle?: string;
  searchValue: string;
  searchPlaceholder?: string;
  onSearchChange: (value: string) => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange: (nextPageSize: number) => void;
  children: ReactNode;
  /** Bandeau chiffres / filtres actifs entre l’en-tête et la liste */
  statsSlot?: ReactNode;
  /** Variante visuelle renforcée (ex. postulations staff) */
  variant?: "default" | "elevated";
}

export default function AdminTableShell({
  title,
  subtitle,
  searchValue,
  searchPlaceholder = "Filtrer...",
  onSearchChange,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  children,
  statsSlot,
  variant = "default",
}: AdminTableShellProps) {
  const totalPages = Math.max(1, Math.ceil(Math.max(0, total) / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const end = Math.min(total, clampedPage * pageSize);
  const elevated = variant === "elevated";

  const pageBtnClass = elevated
    ? "inline-flex items-center gap-1 rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-violet-400/35 hover:bg-violet-500/10 hover:text-white disabled:pointer-events-none disabled:opacity-35"
    : "rounded border border-white/15 px-2 py-1 text-gray-200 disabled:opacity-40";

  const pagination = (
    <div
      className={
        elevated
          ? "flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] bg-black/30 px-4 py-3.5 text-sm text-slate-400 md:px-6"
          : "mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400"
      }
    >
      <span className={elevated ? "tabular-nums text-slate-400" : ""}>
        <span className={elevated ? "font-semibold text-slate-200" : ""}>
          {start}-{end}
        </span>{" "}
        / {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, clampedPage - 1))}
          disabled={clampedPage <= 1}
          className={pageBtnClass}
        >
          {elevated ? (
            <>
              <ChevronLeft className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              Précédent
            </>
          ) : (
            "Précédent"
          )}
        </button>
        <span className={elevated ? "min-w-[7rem] text-center text-xs font-medium text-slate-500" : ""}>
          Page {clampedPage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, clampedPage + 1))}
          disabled={clampedPage >= totalPages}
          className={pageBtnClass}
        >
          {elevated ? (
            <>
              Suivant
              <ChevronRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            </>
          ) : (
            "Suivant"
          )}
        </button>
      </div>
    </div>
  );

  if (elevated) {
    return (
      <div className="overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-b from-violet-950/35 via-[#0a0c14] to-[#05060a] shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
        <div className="flex flex-col gap-4 border-b border-white/[0.08] bg-black/25 px-4 py-5 md:flex-row md:items-end md:justify-between md:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300/80">Pipeline recrutement</p>
            <h3 className="mt-1 text-xl font-bold tracking-tight text-white md:text-2xl">{title}</h3>
            {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{subtitle}</p> : null}
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end md:w-auto">
            <div className="relative w-full sm:min-w-[220px] sm:max-w-xs md:max-w-md md:min-w-[280px]">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                aria-hidden
              />
              <input
                type="search"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-xl border border-white/12 bg-black/45 py-2.5 pl-10 pr-3 text-sm text-white shadow-inner shadow-black/20 placeholder:text-slate-500 focus:border-violet-400/40 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
            </div>
            <select
              value={String(pageSize)}
              onChange={(e) => onPageSizeChange(Number(e.target.value) || 10)}
              className="shrink-0 rounded-xl border border-white/12 bg-black/45 px-3 py-2.5 text-sm font-medium text-white focus:border-violet-400/40 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            >
              <option value="5">5 / page</option>
              <option value="10">10 / page</option>
              <option value="20">20 / page</option>
            </select>
          </div>
        </div>
        {statsSlot ? (
          <div className="border-b border-white/[0.06] bg-violet-500/[0.04] px-4 py-3 md:px-6">{statsSlot}</div>
        ) : null}
        <div>{children}</div>
        {pagination}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-56 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-gray-500"
          />
          <select
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange(Number(e.target.value) || 10)}
            className="rounded-lg border border-white/15 bg-black/30 px-2 py-2 text-sm text-white"
          >
            <option value="5">5 / page</option>
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
          </select>
        </div>
      </div>

      {children}

      {pagination}
    </div>
  );
}
