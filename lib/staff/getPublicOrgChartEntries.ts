import { staffOrgChartRepository } from "@/lib/repositories";
import type { OrgChartEntry } from "@/lib/staff/orgChartTypes";

export async function getPublicOrgChartEntries(): Promise<OrgChartEntry[]> {
  try {
    return await staffOrgChartRepository.listPublic();
  } catch (error) {
    console.error("[getPublicOrgChartEntries] Erreur:", error);
    return [];
  }
}
