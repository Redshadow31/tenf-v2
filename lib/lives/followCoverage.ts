import { getLatestCalculatedRowsForLogins } from "@/lib/admin/followEngagement";
import { qualifiesAsTenfExplorer } from "@/lib/lives/memberLiveBadges";

export type FollowCoverageEntry = {
  followRate: number;
  isTenfExplorer: boolean;
};

export async function fetchFollowCoverageByLogins(
  logins: string[],
): Promise<Record<string, FollowCoverageEntry>> {
  const latest = await getLatestCalculatedRowsForLogins(logins);
  const coverage: Record<string, FollowCoverageEntry> = {};

  latest.forEach(({ row }, login) => {
    const followRate = typeof row.follow_rate === "number" ? row.follow_rate : null;
    if (followRate === null) return;
    coverage[login] = {
      followRate,
      isTenfExplorer: qualifiesAsTenfExplorer(followRate),
    };
  });

  return coverage;
}
