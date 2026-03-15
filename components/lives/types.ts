export interface LiveStream {
  id: string;
  userId: string;
  userLogin: string;
  userName: string;
  gameName: string;
  title: string;
  viewerCount: number;
  startedAt: string;
  thumbnailUrl: string;
  type: string;
}

export interface LiveMember {
  twitchLogin: string;
  twitchUrl: string;
  displayName: string;
  game: string;
  title: string;
  viewerCount: number;
  startedAt: string;
  thumbnailUrl: string;
  avatar: string;
  role: string;
  isVip: boolean;
  isSpotlight?: boolean;
  isBirthdayToday?: boolean;
  isAffiliateAnniversaryToday?: boolean;
  followState?: "followed" | "not_followed" | "unknown";
  integrationDate?: string;
}

export interface PublicEventItem {
  id: string;
  title: string;
  date: string;
  category: string;
}
