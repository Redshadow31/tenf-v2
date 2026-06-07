export type AdminDashboardSummary = {
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

export type AdminDashboardOps = {
  events: AdminMemberEventLite[];
  finalNotesCount: number;
  followOverdueStaffNames: string[];
  vipMonthCount: number;
  staffApplicationsPendingCount: number;
  staffApplicationsRedFlagCount: number;
  profileValidationPendingCount: number;
  raidsPendingCount: number;
  discordPointsPendingCount: number;
  raidsIgnoredToProcessCount: number;
};

export type AdminMemberEventLite = {
  id: string;
  memberId: string;
  type: string;
  createdAt: string;
  source?: string;
  actor?: string;
};

export type AdminUpcomingKpis = {
  nextMeetingRegistrations: number;
  nextMeetingDateIso: string;
  nextMeetingLabel: string;
  nextEventRegistrations: number;
  nextEventLabel: string;
  upcomingSpotlights: number;
  pendingEventValidations: number;
};

export type AdminOpsQueueItem = {
  id: string;
  title: string;
  href: string;
  count: number;
  priority: "P1" | "P2" | "P3";
  slaHours: number;
  helper: string;
};

export type AdminDashboardAggregate = {
  summary: AdminDashboardSummary;
  ops: AdminDashboardOps;
  upcoming: AdminUpcomingKpis;
};

export type AdminDashboardUser = {
  displayName: string;
  roleLabel: string;
  rawRole: string | null;
};
