"use client";

import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import type {
  EvaluationDSortColumn,
  EvaluationDSortDirection,
} from "@/lib/admin/evaluation-d/evaluationDTableSort";

type Props = {
  column: EvaluationDSortColumn;
  label: string;
  activeColumn: EvaluationDSortColumn;
  direction: EvaluationDSortDirection;
  onSort: (column: EvaluationDSortColumn) => void;
  align?: "left" | "center";
  title?: string;
  className?: string;
};

export default function EvaluationDSortableTh({
  column,
  label,
  activeColumn,
  direction,
  onSort,
  align = "left",
  title,
  className = "",
}: Props) {
  const isActive = activeColumn === column;
  const ariaSort: "none" | "ascending" | "descending" = isActive
    ? direction === "asc"
      ? "ascending"
      : "descending"
    : "none";

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      title={title ?? `Trier par ${label}`}
      className={`group cursor-pointer select-none whitespace-nowrap px-2 py-2 transition-colors hover:bg-white/[0.04] sm:px-3 sm:py-2.5 ${
        align === "center" ? "text-center" : "text-left"
      } ${className}`}
      onClick={() => onSort(column)}
    >
      <span
        className={`inline-flex w-full items-center gap-1 ${
          align === "center" ? "justify-center" : "justify-start"
        }`}
      >
        <span>{label}</span>
        <span className="inline-flex shrink-0 items-center">
          {isActive ? (
            <span className="rounded-md bg-violet-500/20 p-0.5 text-violet-300">
              {direction === "asc" ? (
                <ChevronUp className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" aria-hidden />
              )}
            </span>
          ) : (
            <ArrowUpDown
              className="h-3 w-3 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden
            />
          )}
        </span>
      </span>
    </th>
  );
}
