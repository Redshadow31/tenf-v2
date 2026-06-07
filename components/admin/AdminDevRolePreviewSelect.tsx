"use client";

import { Eye } from "lucide-react";
import { useAdminDevRolePreviewOptional } from "@/contexts/AdminDevRolePreviewContext";
import { getDevRolePreviewLabel } from "@/lib/admin/devRolePreviewLabels";
import type { AdminRole } from "@/lib/adminRoles";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]";

export default function AdminDevRolePreviewSelect() {
  const ctx = useAdminDevRolePreviewOptional();
  if (!ctx?.enabled) return null;

  const { previewRole, options, setPreviewRole } = ctx;
  const activeLabel = previewRole ? getDevRolePreviewLabel(previewRole as AdminRole) : null;

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-1 sm:max-w-[min(100%,14rem)]">
      <label
        htmlFor="admin-dev-role-preview"
        className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-200/85"
      >
        <Eye className="h-3 w-3 shrink-0" aria-hidden />
        Voir en tant que
        <span className="rounded bg-amber-500/15 px-1 py-px text-[9px] text-amber-100/90">dev</span>
      </label>
      <select
        id="admin-dev-role-preview"
        value={previewRole || ""}
        onChange={(e) => setPreviewRole((e.target.value || "") as AdminRole | "")}
        className={`w-full min-w-0 truncate rounded-lg border border-amber-400/30 bg-amber-500/[0.08] px-2 py-1.5 text-[length:clamp(0.625rem,0.55rem+0.2vw,0.75rem)] font-medium text-amber-50 ${focusRing}`}
        title="Prévisualiser l’admin comme un autre rôle staff (local uniquement)"
      >
        <option value="">Mon rôle réel</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {activeLabel ? (
        <p className="truncate text-[10px] leading-snug text-amber-100/75">
          Prévisualisation : {activeLabel}
        </p>
      ) : null}
    </div>
  );
}
