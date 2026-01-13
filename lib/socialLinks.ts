/**
 * Configuration des liens des réseaux sociaux TENF
 * Modifiez ces valeurs pour changer les liens affichés dans le header
 */

export interface SocialLink {
  name: string;
  url: string;
  icon: 'discord' | 'twitter' | 'tiktok' | 'instagram';
}

export const socialLinks: SocialLink[] = [
  {
    name: 'Discord',
    url: 'https://discord.gg/ypn6s9XK8t',
    icon: 'discord',
  },
  {
    name: 'X (Twitter)',
    url: 'https://x.com/Team_New_Family',
    icon: 'twitter',
  },
  {
    name: 'TikTok',
    url: 'https://www.tiktok.com/@twitchentraidenewfamily',
    icon: 'tiktok',
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/twitchentraidenewfamily',
    icon: 'instagram',
  },
];








