export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
  imageUrl?: string | null;
  bodyFormat?: "markdown" | "plain";
  /** Audience DB (`community_broadcast`, `member_direct`, `admin_access`) si exposée par l’API. */
  audience?: string;
}
