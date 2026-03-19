import { NextResponse } from "next/server";
import { listInterviews } from "@/lib/interviewsStorage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CACHE_MAX_AGE_SECONDS = 90;
const CACHE_STALE_SECONDS = 180;

function sortForPublic(items: ReturnType<typeof listInterviews>) {
  return [...items].sort((a, b) => {
    if (a.groupType !== b.groupType) return a.groupType.localeCompare(b.groupType);
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    const left = a.publishedAt || a.updatedAt;
    const right = b.publishedAt || b.updatedAt;
    return right.localeCompare(left);
  });
}

export async function GET() {
  try {
    const published = listInterviews().filter(
      (item) => item.isPublished && !!item.memberTwitchLogin && !!item.memberDisplayName
    );
    const interviews = sortForPublic(published);

    const response = NextResponse.json({
      interviews,
      total: interviews.length,
      staffCount: interviews.filter((item) => item.groupType === "staff").length,
      memberCount: interviews.filter((item) => item.groupType === "member").length,
    });
    response.headers.set(
      "Cache-Control",
      `public, max-age=${CACHE_MAX_AGE_SECONDS}, stale-while-revalidate=${CACHE_STALE_SECONDS}`
    );
    return response;
  } catch (error) {
    console.error("[Public Interviews] GET error:", error);
    const response = NextResponse.json({ interviews: [], total: 0 }, { status: 200 });
    response.headers.set(
      "Cache-Control",
      `public, max-age=${CACHE_MAX_AGE_SECONDS}, stale-while-revalidate=${CACHE_STALE_SECONDS}`
    );
    return response;
  }
}
