"use client";

import { useMemo } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import MemberBentoShell, { MemberBentoCell, MemberBentoRow } from "@/components/member/layout/MemberBentoShell";
import { useAdminDashboardData } from "@/hooks/useAdminDashboardData";
import { buildAdminDashboardModel } from "@/lib/admin/dashboard/adminDashboardModel";
import AdminAlertsStrip from "@/components/admin/dashboard/bento/AdminAlertsStrip";
import AdminDashboardHero from "@/components/admin/dashboard/bento/AdminDashboardHero";
import AdminDashboardPulseCards from "@/components/admin/dashboard/bento/AdminDashboardPulseCards";
import AdminNextActionCard from "@/components/admin/dashboard/bento/AdminNextActionCard";
import AdminRoleGuideCard from "@/components/admin/dashboard/bento/AdminRoleGuideCard";
import AdminOpsQueueCard from "@/components/admin/dashboard/bento/AdminOpsQueueCard";
import AdminAgendaCard from "@/components/admin/dashboard/bento/AdminAgendaCard";
import AdminQuickLinksCard from "@/components/admin/dashboard/bento/AdminQuickLinksCard";
import AdminRecentActivityCard from "@/components/admin/dashboard/bento/AdminRecentActivityCard";
import AdminDashboardLoadingScreen from "@/components/admin/dashboard/AdminDashboardLoadingScreen";

export default function AdminDashboardView() {
  const { user, data, loading, error } = useAdminDashboardData();

  const model = useMemo(() => {
    if (!user) return null;
    return buildAdminDashboardModel(user, data);
  }, [user, data]);

  if (loading) {
    return <AdminDashboardLoadingScreen />;
  }

  if (error || !user || !model) {
    return (
      <div className="-mx-4 md:-mx-6">
        <MemberBentoShell>
          <section
            className="rounded-2xl border border-red-500/35 bg-red-950/30 p-6 text-center text-sm text-red-100"
            role="alert"
          >
            <p className="font-semibold">Impossible de charger ton tableau de bord staff</p>
            <p className="mt-2 opacity-90">{error || "Données indisponibles."}</p>
            <button
              type="button"
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-red-950"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Réessayer
            </button>
          </section>
        </MemberBentoShell>
      </div>
    );
  }

  const showRoleGuide = model.showRoleGuide;

  return (
    <div className="-mx-4 md:-mx-6">
      <MemberBentoShell accentHex={model.accent}>
        <AdminAlertsStrip model={model} />

        <MemberBentoRow>
          <MemberBentoCell span={8}>
            <AdminDashboardHero model={model} />
          </MemberBentoCell>
          <MemberBentoCell span={4}>
            <AdminDashboardPulseCards model={model} />
          </MemberBentoCell>
        </MemberBentoRow>

        <MemberBentoRow>
          <MemberBentoCell span={7}>
            <AdminNextActionCard model={model} />
          </MemberBentoCell>
          <MemberBentoCell span={5}>
            {showRoleGuide ? (
              <AdminRoleGuideCard model={model} />
            ) : (
              <AdminAgendaCard model={model} />
            )}
          </MemberBentoCell>
        </MemberBentoRow>

        <MemberBentoRow>
          <MemberBentoCell span={5}>
            <AdminOpsQueueCard model={model} />
          </MemberBentoCell>
          <MemberBentoCell span={4}>
            {showRoleGuide ? <AdminAgendaCard model={model} /> : <AdminRecentActivityCard model={model} events={data.ops.events} />}
          </MemberBentoCell>
          <MemberBentoCell span={3}>
            <AdminQuickLinksCard model={model} />
          </MemberBentoCell>
        </MemberBentoRow>

        {showRoleGuide ? (
          <MemberBentoRow>
            <MemberBentoCell span={8}>
              <AdminRecentActivityCard model={model} events={data.ops.events} />
            </MemberBentoCell>
            <MemberBentoCell span={4}>
              <MemberPreviewCard model={model} />
            </MemberBentoCell>
          </MemberBentoRow>
        ) : null}
      </MemberBentoShell>
    </div>
  );
}

function MemberPreviewCard({ model }: { model: ReturnType<typeof buildAdminDashboardModel> }) {
  return (
    <section className="dashboard-panel relative flex h-full w-full min-w-0 flex-col overflow-hidden rounded-[1.35rem] border border-white/10 bg-gradient-to-br from-violet-950/40 to-black/30 p-4 backdrop-blur-sm md:p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-300/80">Expérience membre</p>
      <h2 className="mt-2 text-lg font-bold text-white">{model.memberPreviewTitle}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-white/65">{model.memberPreviewMessage}</p>
      <Link
        href="/member/dashboard"
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex min-h-[38px] items-center justify-center rounded-full border border-violet-400/35 bg-violet-500/15 px-4 py-2 text-xs font-bold text-violet-100 transition hover:-translate-y-0.5"
      >
        Ouvrir l’espace membre
      </Link>
    </section>
  );
}
