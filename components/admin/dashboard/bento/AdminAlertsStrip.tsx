"use client";

import Link from "next/link";
import { AlertTriangle, ArrowUpRight } from "lucide-react";
import type { AdminDashboardModel } from "@/lib/admin/dashboard/adminDashboardModel";

type AdminAlertsStripProps = {
  model: AdminDashboardModel;
};

export default function AdminAlertsStrip({ model }: AdminAlertsStripProps) {
  if (model.alerts.length === 0) return null;

  return (
    <section
      className="rounded-[1.35rem] border border-rose-400/35 bg-gradient-to-br from-rose-950/50 to-black/40 p-4 md:p-5"
      role="alert"
      aria-label="Alertes staff"
    >
      <div className="mb-3 flex items-center gap-2 text-rose-100">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
        <p className="text-sm font-bold">Points d’attention pour toi</p>
      </div>
      <p className="mb-3 text-xs text-rose-100/75">{model.alertsIntro}</p>
      <ul className="space-y-2">
        {model.alerts.map((alert) => (
          <li key={alert.id}>
            {alert.href ? (
              <Link
                href={alert.href}
                className="group flex items-start justify-between gap-3 rounded-xl border border-rose-300/20 bg-black/20 px-3 py-2.5 text-sm text-rose-50/95 transition hover:border-rose-300/40"
              >
                <span>{alert.message}</span>
                <ArrowUpRight className="h-4 w-4 shrink-0 opacity-60 group-hover:opacity-100" aria-hidden />
              </Link>
            ) : (
              <p className="rounded-xl border border-rose-300/20 bg-black/20 px-3 py-2.5 text-sm text-rose-50/95">
                {alert.message}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
