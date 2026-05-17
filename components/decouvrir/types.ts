export type DiscoverClip = {
  id: string;
  url: string;
  title: string;
  thumbnailUrl: string;
  creatorName: string;
  creatorLogin: string;
  creatorAvatar?: string;
  viewCount: number;
  createdAt: string;
  duration: number;
  language: string;
  style: "fun" | "epic" | "educatif" | "best-of";
  category: "gaming" | "just-chatting" | "irl" | "autre";
  moderationStatus: "approved" | "pending" | "rejected";
  memberRole?: string;
};

export type DiscoverClipsApiResponse = {
  clips?: DiscoverClip[];
  total?: number;
  error?: string;
};
