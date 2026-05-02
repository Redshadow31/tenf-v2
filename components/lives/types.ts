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
  isTopRaider?: boolean;
  topRaidsCount?: number;
  raidsDoneThisMonth?: number;
  raidsReceivedThisMonth?: number;
  uniqueRaidTargetsThisMonth?: number;
  uniqueRaidersReceivedThisMonth?: number;
  isSolidarityRaider?: boolean;
  isCommunityBooster?: boolean;
  isDiscoverer?: boolean;
  isWarmlySupported?: boolean;
  isBalancedSupport?: boolean;
  followState?: "followed" | "not_followed" | "unknown";
  integrationDate?: string;
  /** Lien annuaire (/membres?member=) quand la fiche doit être mise en avant (ex. bloc UPA). */
  memberAnnuaireHref?: string;
  /** Données profil API publique (pour modale fiche membre). */
  description?: string;
  discordId?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  badges?: string[];
  vipBadge?: string;
}

export interface PublicEventItem {
  id: string;
  title: string;
  date: string;
  category: string;
}
