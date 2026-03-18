import type { ReactNode } from "react";

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
}: AdminTableShellProps) {
  const totalPages = Math.max(1, Math.ceil(Math.max(0, total) / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const end = Math.min(total, clampedPage * pageSize);

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

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
        <span>
          {start}-{end} / {total}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, clampedPage - 1))}
            disabled={clampedPage <= 1}
            className="rounded border border-white/15 px-2 py-1 text-gray-200 disabled:opacity-40"
          >
            Précédent
          </button>
          <span>
            Page {clampedPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, clampedPage + 1))}
            disabled={clampedPage >= totalPages}
            className="rounded border border-white/15 px-2 py-1 text-gray-200 disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}

