import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import { supabaseAdmin } from "@/lib/db/supabase";
import { cacheGet, cacheSet, cacheKey } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const ADMIN_DASHBOARD_SUMMARY_TTL_SECONDS = 20;

const PAGE_SIZE = 1000;
const MAX_PAGES = 20;

type MemberSummaryRow = {
  discord_id: string | null;
  twitch_id: string | null;
  integration_date: string | null;
  onboarding_status: string | null;
  profile_validation_status: string | null;
  is_active: boolean | null;
  badges: unknown;
  next_review_at: string | null;
};

type DashboardSummary = {
  total: number;
  missingDiscord: number;
  missingTwitchId: number;
  incomplete: number;
  reviewOverdue: number;
  reviewDue7d: number;
  avgCompletion: number;
  validatedProfiles: number;
  communityMonthCount: number;
};

function toTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function hasContributeurBadge(badges: unknown): boolean {
  if (!Array.isArray(badges)) return false;
  return badges.some((badge) => badge === "Contributeur TENF du Mois");
}

function completionPct(row: MemberSummaryRow): number {
  const checks = [
    !!toTrimmedString(row.discord_id),
    !!toTrimmedString(row.twitch_id),
    !!toTrimmedString(row.integration_date),
    row.onboarding_status === "termine",
    row.profile_validation_status === "valide",
  ];
  const ok = checks.filter(Boolean).length;
  return Math.round((ok / checks.length) * 100);
}

async function fetchAllMemberSummaries(): Promise<MemberSummaryRow[]> {
  const rows: MemberSummaryRow[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const offset = page * PAGE_SIZE;
    const { data, error } = await supabaseAdmin
      .from("members")
      .select(
        "discord_id,twitch_id,integration_date,onboarding_status,profile_validation_status,is_active,badges,next_review_at"
      )
      .order("updated_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    const chunk = (data || []) as MemberSummaryRow[];
    if (chunk.length === 0) break;
    rows.push(...chunk);

    if (chunk.length < PAGE_SIZE) break;
  }

  return rows;
}

function computeDashboardSummary(rows: MemberSummaryRow[]): DashboardSummary {
  const activeMembers = rows.filter((row) => row.is_active !== false);
  const now = Date.now();
  const in7Days = now + 7 * 24 * 60 * 60 * 1000;

  let completionTotal = 0;

  const summary: DashboardSummary = {
    total: activeMembers.length,
    missingDiscord: 0,
    missingTwitchId: 0,
    incomplete: 0,
    reviewOverdue: 0,
    reviewDue7d: 0,
    avgCompletion: 0,
    validatedProfiles: 0,
    communityMonthCount: 0,
  };

  for (const member of activeMembers) {
    if (!toTrimmedString(member.discord_id)) summary.missingDiscord += 1;
    if (!toTrimmedString(member.twitch_id)) summary.missingTwitchId += 1;
    if (member.profile_validation_status === "valide") summary.validatedProfiles += 1;
    if (hasContributeurBadge(member.badges)) summary.communityMonthCount += 1;

    const completion = completionPct(member);
    completionTotal += completion;
    if (completion < 80) summary.incomplete += 1;

    if (member.next_review_at) {
      const reviewTs = new Date(member.next_review_at).getTime();
      if (!Number.isNaN(reviewTs)) {
        if (reviewTs <= now) {
          summary.reviewOverdue += 1;
        } else if (reviewTs <= in7Days) {
          summary.reviewDue7d += 1;
        }
      }
    }
  }

  summary.avgCompletion =
    activeMembers.length > 0 ? Math.round(completionTotal / activeMembers.length) : 0;

  return summary;
}

export async function GET() {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou permissions insuffisantes" },
        { status: 401 }
      );
    }

    const cacheKeyStr = cacheKey("api", "admin", "dashboard", "summary", "v1");
    const cached = await cacheGet<any>(cacheKeyStr);
    if (cached) {
      return NextResponse.json(cached);
    }

    const rows = await fetchAllMemberSummaries();
    const data = computeDashboardSummary(rows);

    const payload = { success: true, data };
    await cacheSet(cacheKeyStr, payload, ADMIN_DASHBOARD_SUMMARY_TTL_SECONDS);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[API Admin Dashboard Summary] Erreur GET:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
