export type AdminConnectionType = "discord" | "guest";

export interface ConnectionLogModel {
  id: string;
  sessionId: string;
  userId: string | null;
  username: string | null;
  isDiscordAuth: boolean;
  connectionType: AdminConnectionType;
  ipMasked: string | null;
  ipHash: string | null;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  userAgent: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  path: string | null;
  referer: string | null;
  createdAt: string;
  lastSeenAt: string;
  updatedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
}

export interface LoginLogsQuery {
  page: number;
  limit: number;
  startDate?: string;
  endDate?: string;
  country?: string;
  userId?: string;
  userSearch?: string;
  connectionType?: AdminConnectionType;
}
