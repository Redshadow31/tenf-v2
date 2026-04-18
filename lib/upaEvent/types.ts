export type UpaRegistrationStatus = "open" | "soon" | "closed" | "ended";
export type UpaTimelineStatus = "past" | "current" | "upcoming";

export interface UpaEventGeneralInfo {
  title: string;
  subtitle: string;
  slogan: string;
  startDate: string;
  endDate: string;
  causeSupported: string;
  partnershipBadge: string;
  heroText: string;
  registrationStatus: UpaRegistrationStatus;
  moodMessage: string;
  /** Page publique de la campagne (ex. Streamlabs Charity) — affichée sur /lives pendant l'UPA si renseignée. */
  charityCampaignUrl: string;
}

export interface UpaEventSocialProof {
  totalRegistered: number;
  streamersRegistered: number;
  moderatorsRegistered: number;
  socialProofMessage: string;
  isVisible: boolean;
}

export interface UpaEventTimelineItem {
  id: string;
  title: string;
  description: string;
  dateLabel: string;
  order: number;
  status: UpaTimelineStatus;
  isActive: boolean;
}

export interface UpaEventEditorialSection {
  id: string;
  key: string;
  title: string;
  subtitle?: string;
  content: string;
  order: number;
  variant: "default" | "highlight" | "soft";
  isActive: boolean;
}

export interface UpaEventStaffMember {
  id: string;
  twitchLogin: string;
  name: string;
  role: string;
  description: string;
  staffType: "high_staff" | "moderator";
  avatarUrl?: string;
  order: number;
  isActive: boolean;
}

export interface UpaEventStreamerMember {
  id: string;
  twitchLogin: string;
  displayName: string;
  avatarUrl?: string;
  description?: string;
  /** Discord ID de la fiche membre TENF (gestion centralisée), pour rattachement et résolution du login Twitch à l’enregistrement. */
  linkedMemberDiscordId?: string;
  order: number;
  isActive: boolean;
}

export interface UpaEventFaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
}

export interface UpaEventOfficialLink {
  id: string;
  label: string;
  url: string;
  description?: string;
  order: number;
  isActive: boolean;
}

export interface UpaEventPartnerCommunity {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  url?: string;
  order: number;
  isActive: boolean;
}

export interface UpaEventCtaContent {
  streamerButtonText: string;
  moderatorButtonText: string;
  finalCtaTitle: string;
  finalCtaText: string;
  finalEmotionText: string;
  secondaryText?: string;
}

export interface UpaEventDisplaySettings {
  showSocialProof: boolean;
  showTimeline: boolean;
  showStaff: boolean;
  showFaq: boolean;
  showPartnerCommunities: boolean;
  showTenfPartnershipBlock: boolean;
  showFinalCta: boolean;
}

export interface UpaEventStatusMessages {
  statusLabel: string;
  statusMessage: string;
  highlightMessage: string;
}

export interface UpaEventContent {
  slug: string;
  general: UpaEventGeneralInfo;
  socialProof: UpaEventSocialProof;
  timeline: UpaEventTimelineItem[];
  editorialSections: UpaEventEditorialSection[];
  staff: UpaEventStaffMember[];
  streamers: UpaEventStreamerMember[];
  faq: UpaEventFaqItem[];
  officialLinks: UpaEventOfficialLink[];
  partnerCommunities: UpaEventPartnerCommunity[];
  cta: UpaEventCtaContent;
  displaySettings: UpaEventDisplaySettings;
  statusMessages: UpaEventStatusMessages;
  updatedAt: string;
  updatedBy?: string;
}
