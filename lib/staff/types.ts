export type StaffRole =
  | "FONDATEUR"
  | "ADMIN_COORDINATEUR"
  | "MODERATEUR"
  | "MODERATEUR_EN_FORMATION"
  | "SOUTIEN_TENF"
  | "AUTRE";

export interface StaffMember {
  id: string;
  displayName: string;
  discordId?: string;
  twitchUrl?: string;
  avatarUrl?: string;
  role: StaffRole;
  roleLabel?: string;
  order: number;
  isVisiblePublic: boolean;
  isArchived: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaffMemberInput {
  displayName: string;
  discordId?: string;
  twitchUrl?: string;
  avatarUrl?: string;
  role: StaffRole;
  roleLabel?: string;
  order?: number;
  isVisiblePublic?: boolean;
}

