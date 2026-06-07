export type CharterPayload = {
  currentVersion: string;
  accepted: boolean;
  validatedAt: string | null;
  validatedVersion: string | null;
  deadlineIso: string;
  daysRemainingApprox: number | null;
  graceElapsed: boolean;
};

export type SensitivePayload = {
  discordId: string;
  discordRename: string | null;
  discordHandle: string | null;
  twitchId: string | null;
} | null;

export type StaffSnapshotPayload = {
  activeCommunityMembers: number | null;
  moderatorsActive: number;
  moderatorsPaused: number;
  staffWithDashboardAccess: number;
} | null;

export type StaffFeedItem = {
  id: string;
  headline: string;
  subline: string;
  timestamp: string;
  timestampIso: string;
};

export type StaffMissionItem = {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
};

export type StaffAnnouncementBrief = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  imageUrl: string | null;
  createdAt: string;
};

export type AdminAccountPayload = {
  hasAdvancedAdminView: boolean;
  displayName: string | null;
  siteUsername: string | null;
  siteRole: string | null;
  adminRole: string;
  adminRoleLabel: string;
  discordUsername: string | null;
  twitchLogin: string | null;
  twitchDisplayNameLinked: string | null;
  hasLinkedTwitchAccount: boolean;
  twitchUrl: string | null;
  integrationDateIso: string | null;
  memberCreatedAtIso: string | null;
  charter: CharterPayload;
  staffNotificationEmail: string;
  staffSnapshot: StaffSnapshotPayload;
  staffMissions: StaffMissionItem[];
  sensitive: SensitivePayload;
};

export type AdminExperienceLink = {
  href: string;
  title: string;
  description: string;
  tone: string;
};

export type AdminAccountQuickLink = {
  href: string;
  title: string;
  desc: string;
  tone: string;
};
