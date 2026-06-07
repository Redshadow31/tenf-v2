import { NextResponse } from "next/server";
import { fetchFollowCoverageByLogins } from "@/lib/lives/followCoverage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { logins?: unknown };
    const logins = Array.isArray(body.logins)
      ? body.logins.filter((login: unknown): login is string => typeof login === "string" && login.trim().length > 0)
      : [];

    if (logins.length === 0) {
      return NextResponse.json({ coverage: {} });
    }

    const coverage = await fetchFollowCoverageByLogins(logins.slice(0, 500));
    return NextResponse.json({ coverage });
  } catch (error) {
    console.error("[Lives Follow Coverage]", error);
    return NextResponse.json({ coverage: {} }, { status: 500 });
  }
}
