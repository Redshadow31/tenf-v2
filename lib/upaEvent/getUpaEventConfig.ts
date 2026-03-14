import { DEFAULT_UPA_EVENT_CONTENT, upaEventRepository } from "@/lib/repositories/UpaEventRepository";
import type { UpaEventContent } from "@/lib/upaEvent/types";

export async function getUpaEventConfig(slug = "upa-event"): Promise<UpaEventContent> {
  try {
    return await upaEventRepository.getContent(slug);
  } catch (error) {
    console.error("[UPA_EVENT] Fallback config used:", error);
    return {
      ...DEFAULT_UPA_EVENT_CONTENT,
      slug,
      updatedAt: new Date().toISOString(),
    };
  }
}
