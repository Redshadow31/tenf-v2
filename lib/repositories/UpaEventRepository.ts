import { supabaseAdmin } from "@/lib/db/supabase";
import type {
  UpaEventContent,
  UpaEventCtaContent,
  UpaEventDisplaySettings,
  UpaEventEditorialSection,
  UpaEventFaqItem,
  UpaEventGeneralInfo,
  UpaEventOfficialLink,
  UpaEventPartnerCommunity,
  UpaEventSocialProof,
  UpaEventStaffMember,
  UpaEventStatusMessages,
  UpaEventStreamerMember,
  UpaEventTimelineItem,
  UpaRegistrationStatus,
  UpaTimelineStatus,
} from "@/lib/upaEvent/types";

const UPA_EVENT_TABLE = "upa_event_pages";
const DEFAULT_SLUG = "upa-event";

function isMissingColumnError(error: { code?: string; message?: string } | null | undefined, columnName: string): boolean {
  if (!error) return false;
  const message = String(error.message || "").toLowerCase();
  return error.code === "42703" || (message.includes("column") && message.includes(columnName.toLowerCase()));
}

function trimText(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

function sanitizePublicHttpUrl(raw: unknown): string {
  const trimmed = trimText(raw, "");
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function toInt(value: unknown, fallback = 0): number {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

function toBool(value: unknown, fallback = true): boolean {
  if (typeof value === "boolean") return value;
  return fallback;
}

function toRegistrationStatus(value: unknown, fallback: UpaRegistrationStatus): UpaRegistrationStatus {
  if (value === "open" || value === "soon" || value === "closed" || value === "ended") {
    return value;
  }
  return fallback;
}

function toTimelineStatus(value: unknown, fallback: UpaTimelineStatus): UpaTimelineStatus {
  if (value === "past" || value === "current" || value === "upcoming") {
    return value;
  }
  return fallback;
}

function makeId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export const DEFAULT_UPA_EVENT_CONTENT: UpaEventContent = {
  slug: DEFAULT_SLUG,
  general: {
    title: "UPA EVENT - Unis pour l'Avenir",
    subtitle: "Partenariat TENF x UPA",
    slogan: "Un evenement caritatif communautaire et engage",
    startDate: "2026-04-18",
    endDate: "2026-04-26",
    causeSupported: "Lutte contre le cancer",
    partnershipBadge: "Partenariat TENF x UPA",
    heroText:
      "Pendant 9 jours, streamers et benevoles se mobilisent pour soutenir une cause essentielle.",
    registrationStatus: "open",
    moodMessage: "La mobilisation est lancee.",
    charityCampaignUrl: "",
  },
  socialProof: {
    totalRegistered: 23,
    streamersRegistered: 0,
    moderatorsRegistered: 0,
    socialProofMessage: "Deja plus de 23 participants inscrits",
    isVisible: true,
  },
  timeline: [
    {
      id: makeId("timeline"),
      title: "Ouverture des inscriptions",
      description: "Les parcours streamer et moderateur sont ouverts.",
      dateLabel: "Mars 2026",
      order: 1,
      status: "past",
      isActive: true,
    },
    {
      id: makeId("timeline"),
      title: "Debut de l'evenement",
      description: "Lancement officiel des lives caritatifs.",
      dateLabel: "18 avril 2026",
      order: 2,
      status: "upcoming",
      isActive: true,
    },
    {
      id: makeId("timeline"),
      title: "Cloture",
      description: "Fin de la session et recap de l'impact collectif.",
      dateLabel: "26 avril 2026",
      order: 3,
      status: "upcoming",
      isActive: true,
    },
  ],
  editorialSections: [
    {
      id: makeId("editorial"),
      key: "organisation",
      title: "Organisation",
      subtitle: "",
      content: "UPA est une organisation caritative creee par Symaog.",
      order: 1,
      variant: "default",
      isActive: true,
    },
  ],
  staff: [
    {
      id: makeId("staff"),
      twitchLogin: "symaog",
      name: "Symaog",
      role: "Organisateur",
      description: "Coordonne la vision globale de l'evenement.",
      staffType: "high_staff",
      avatarUrl: "",
      order: 1,
      isActive: true,
    },
  ],
  streamers: [],
  faq: [],
  officialLinks: [
    {
      id: makeId("link"),
      label: "Site UPA",
      url: "https://www.upa-event.fr",
      description: "",
      order: 1,
      isActive: true,
    },
  ],
  partnerCommunities: [],
  cta: {
    streamerButtonText: "Participer comme streamer",
    moderatorButtonText: "Devenir moderateur volontaire",
    finalCtaTitle: "Rejoignez l'evenement",
    finalCtaText: "Chaque participation peut faire une vraie difference.",
    finalEmotionText: "Inscription ouverte maintenant.",
    secondaryText: "",
  },
  displaySettings: {
    showSocialProof: true,
    showTimeline: true,
    showStaff: true,
    showFaq: true,
    showPartnerCommunities: true,
    showTenfPartnershipBlock: true,
    showFinalCta: true,
  },
  statusMessages: {
    statusLabel: "Inscriptions ouvertes",
    statusMessage: "L'evenement est en preparation active.",
    highlightMessage: "La communaute se mobilise deja.",
  },
  updatedAt: new Date(0).toISOString(),
  updatedBy: "",
};

function normalizeGeneral(value: unknown): UpaEventGeneralInfo {
  const base = DEFAULT_UPA_EVENT_CONTENT.general;
  const source = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return {
    title: trimText(source.title, base.title),
    subtitle: trimText(source.subtitle, base.subtitle),
    slogan: trimText(source.slogan, base.slogan),
    startDate: trimText(source.startDate, base.startDate),
    endDate: trimText(source.endDate, base.endDate),
    causeSupported: trimText(source.causeSupported, base.causeSupported),
    partnershipBadge: trimText(source.partnershipBadge, base.partnershipBadge),
    heroText: trimText(source.heroText, base.heroText),
    registrationStatus: toRegistrationStatus(source.registrationStatus, base.registrationStatus),
    moodMessage: trimText(source.moodMessage, base.moodMessage),
    charityCampaignUrl: sanitizePublicHttpUrl(source.charityCampaignUrl) || base.charityCampaignUrl,
  };
}

function normalizeSocialProof(value: unknown): UpaEventSocialProof {
  const base = DEFAULT_UPA_EVENT_CONTENT.socialProof;
  const source = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return {
    totalRegistered: toInt(source.totalRegistered, base.totalRegistered),
    streamersRegistered: toInt(source.streamersRegistered, base.streamersRegistered),
    moderatorsRegistered: toInt(source.moderatorsRegistered, base.moderatorsRegistered),
    socialProofMessage: trimText(source.socialProofMessage, base.socialProofMessage),
    isVisible: toBool(source.isVisible, base.isVisible),
  };
}

function normalizeTimeline(value: unknown): UpaEventTimelineItem[] {
  const source = Array.isArray(value) ? value : [];
  return source.map((item, index) => {
    const obj = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    return {
      id: trimText(obj.id, makeId("timeline")),
      title: trimText(obj.title, ""),
      description: trimText(obj.description, ""),
      dateLabel: trimText(obj.dateLabel, ""),
      order: toInt(obj.order, index + 1),
      status: toTimelineStatus(obj.status, "upcoming"),
      isActive: toBool(obj.isActive, true),
    };
  });
}

function normalizeEditorialSections(value: unknown): UpaEventEditorialSection[] {
  const source = Array.isArray(value) ? value : [];
  return source.map((item, index) => {
    const obj = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const variantRaw = trimText(obj.variant, "default");
    const variant = variantRaw === "highlight" || variantRaw === "soft" ? variantRaw : "default";
    return {
      id: trimText(obj.id, makeId("editorial")),
      key: trimText(obj.key, `section-${index + 1}`),
      title: trimText(obj.title, ""),
      subtitle: trimText(obj.subtitle, ""),
      content: trimText(obj.content, ""),
      order: toInt(obj.order, index + 1),
      variant,
      isActive: toBool(obj.isActive, true),
    };
  });
}

function normalizeStaff(value: unknown): UpaEventStaffMember[] {
  const source = Array.isArray(value) ? value : [];
  return source.map((item, index) => {
    const obj = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const rawLogin = trimText(obj.twitchLogin, trimText(obj.name, ""));
    const twitchLogin = rawLogin.replace(/^@/, "").toLowerCase();
    const staffTypeRaw = trimText(obj.staffType, "moderator");
    const staffType = staffTypeRaw === "high_staff" ? "high_staff" : "moderator";
    return {
      id: trimText(obj.id, makeId("staff")),
      twitchLogin,
      name: trimText(obj.name, twitchLogin || ""),
      role: trimText(obj.role, ""),
      description: trimText(obj.description, ""),
      staffType,
      avatarUrl: trimText(obj.avatarUrl, ""),
      order: toInt(obj.order, index + 1),
      isActive: toBool(obj.isActive, true),
    };
  });
}

function normalizeStreamers(value: unknown): UpaEventStreamerMember[] {
  const source = Array.isArray(value) ? value : [];
  return source.map((item, index) => {
    const obj = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const rawLogin = trimText(obj.twitchLogin, trimText(obj.displayName, ""));
    const twitchLogin = rawLogin.replace(/^@/, "").toLowerCase();
    return {
      id: trimText(obj.id, makeId("streamer")),
      twitchLogin,
      displayName: trimText(obj.displayName, twitchLogin || ""),
      avatarUrl: trimText(obj.avatarUrl, ""),
      description: trimText(obj.description, ""),
      order: toInt(obj.order, index + 1),
      isActive: toBool(obj.isActive, true),
    };
  });
}

function normalizeFaq(value: unknown): UpaEventFaqItem[] {
  const source = Array.isArray(value) ? value : [];
  return source.map((item, index) => {
    const obj = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    return {
      id: trimText(obj.id, makeId("faq")),
      question: trimText(obj.question, ""),
      answer: trimText(obj.answer, ""),
      order: toInt(obj.order, index + 1),
      isActive: toBool(obj.isActive, true),
    };
  });
}

function normalizeOfficialLinks(value: unknown): UpaEventOfficialLink[] {
  const source = Array.isArray(value) ? value : [];
  return source.map((item, index) => {
    const obj = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    return {
      id: trimText(obj.id, makeId("link")),
      label: trimText(obj.label, ""),
      url: trimText(obj.url, ""),
      description: trimText(obj.description, ""),
      order: toInt(obj.order, index + 1),
      isActive: toBool(obj.isActive, true),
    };
  });
}

function normalizePartnerCommunities(value: unknown): UpaEventPartnerCommunity[] {
  const source = Array.isArray(value) ? value : [];
  return source.map((item, index) => {
    const obj = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    return {
      id: trimText(obj.id, makeId("partner")),
      name: trimText(obj.name, ""),
      description: trimText(obj.description, ""),
      logoUrl: trimText(obj.logoUrl, ""),
      url: trimText(obj.url, ""),
      order: toInt(obj.order, index + 1),
      isActive: toBool(obj.isActive, true),
    };
  });
}

function normalizeCta(value: unknown): UpaEventCtaContent {
  const base = DEFAULT_UPA_EVENT_CONTENT.cta;
  const source = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return {
    streamerButtonText: trimText(source.streamerButtonText, base.streamerButtonText),
    moderatorButtonText: trimText(source.moderatorButtonText, base.moderatorButtonText),
    finalCtaTitle: trimText(source.finalCtaTitle, base.finalCtaTitle),
    finalCtaText: trimText(source.finalCtaText, base.finalCtaText),
    finalEmotionText: trimText(source.finalEmotionText, base.finalEmotionText),
    secondaryText: trimText(source.secondaryText, base.secondaryText || ""),
  };
}

function normalizeDisplaySettings(value: unknown): UpaEventDisplaySettings {
  const base = DEFAULT_UPA_EVENT_CONTENT.displaySettings;
  const source = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return {
    showSocialProof: toBool(source.showSocialProof, base.showSocialProof),
    showTimeline: toBool(source.showTimeline, base.showTimeline),
    showStaff: toBool(source.showStaff, base.showStaff),
    showFaq: toBool(source.showFaq, base.showFaq),
    showPartnerCommunities: toBool(source.showPartnerCommunities, base.showPartnerCommunities),
    showTenfPartnershipBlock: toBool(source.showTenfPartnershipBlock, base.showTenfPartnershipBlock),
    showFinalCta: toBool(source.showFinalCta, base.showFinalCta),
  };
}

function normalizeStatusMessages(value: unknown): UpaEventStatusMessages {
  const base = DEFAULT_UPA_EVENT_CONTENT.statusMessages;
  const source = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return {
    statusLabel: trimText(source.statusLabel, base.statusLabel),
    statusMessage: trimText(source.statusMessage, base.statusMessage),
    highlightMessage: trimText(source.highlightMessage, base.highlightMessage),
  };
}

function normalizeUpaEventContent(raw: any, slug: string): UpaEventContent {
  const fallback = DEFAULT_UPA_EVENT_CONTENT;
  return {
    slug,
    general: normalizeGeneral(raw?.general),
    socialProof: normalizeSocialProof(raw?.social_proof),
    timeline: normalizeTimeline(raw?.timeline),
    editorialSections: normalizeEditorialSections(raw?.editorial_sections),
    staff: normalizeStaff(raw?.staff),
    streamers: normalizeStreamers(raw?.streamers),
    faq: normalizeFaq(raw?.faq),
    officialLinks: normalizeOfficialLinks(raw?.official_links),
    partnerCommunities: normalizePartnerCommunities(raw?.partner_communities),
    cta: normalizeCta(raw?.cta),
    displaySettings: normalizeDisplaySettings(raw?.display_settings),
    statusMessages: normalizeStatusMessages(raw?.status_messages),
    updatedAt: raw?.updated_at || fallback.updatedAt,
    updatedBy: raw?.updated_by || "",
  };
}

export class UpaEventRepository {
  async getContent(slug = DEFAULT_SLUG): Promise<UpaEventContent> {
    const { data, error } = await supabaseAdmin
      .from(UPA_EVENT_TABLE)
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return this.upsertContent(slug, DEFAULT_UPA_EVENT_CONTENT, "system");
    }

    return normalizeUpaEventContent(data, slug);
  }

  async upsertContent(slug: string, content: UpaEventContent, updatedBy: string): Promise<UpaEventContent> {
    const normalized = {
      slug,
      general: normalizeGeneral(content.general),
      social_proof: normalizeSocialProof(content.socialProof),
      timeline: normalizeTimeline(content.timeline),
      editorial_sections: normalizeEditorialSections(content.editorialSections),
      staff: normalizeStaff(content.staff),
      streamers: normalizeStreamers(content.streamers),
      faq: normalizeFaq(content.faq),
      official_links: normalizeOfficialLinks(content.officialLinks),
      partner_communities: normalizePartnerCommunities(content.partnerCommunities),
      cta: normalizeCta(content.cta),
      display_settings: normalizeDisplaySettings(content.displaySettings),
      status_messages: normalizeStatusMessages(content.statusMessages),
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    };

    let { data, error } = await supabaseAdmin
      .from(UPA_EVENT_TABLE)
      .upsert(normalized, { onConflict: "slug" })
      .select("*")
      .single();

    if (error && isMissingColumnError(error, "streamers")) {
      const legacyPayload = { ...normalized } as Record<string, unknown>;
      delete legacyPayload.streamers;
      const retry = await supabaseAdmin
        .from(UPA_EVENT_TABLE)
        .upsert(legacyPayload, { onConflict: "slug" })
        .select("*")
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      throw error;
    }

    return normalizeUpaEventContent(data, slug);
  }
}

export const upaEventRepository = new UpaEventRepository();
