import type { Metadata } from "next";
import AboutPublicPage, { type FounderProfilePublic } from "@/components/about/AboutPublicPage";
import { getTwitchUsers } from "@/lib/twitch";

type HomeApiResponse = {
  stats?: {
    totalMembers?: number;
    activeMembers?: number;
  };
};

type FounderProfile = {
  name: string;
  twitchLogin: string;
  role: string;
  personality: string;
  quote: string;
};

const founders: FounderProfile[] = [
  {
    name: "Red",
    twitchLogin: "red_shadow_31",
    role: "Structure et vision",
    personality: "Calme, cadrant, tourné long terme",
    quote: "On peut être exigeants sans perdre l'humain.",
  },
  {
    name: "Clara",
    twitchLogin: "clarastonewall",
    role: "Émotion et valeurs",
    personality: "Empathique, directe, protectrice",
    quote: "Si l'entraide devient un décor, on a déjà perdu.",
  },
  {
    name: "Nexou",
    twitchLogin: "nexou31",
    role: "Équilibre et lien",
    personality: "Spontané, pragmatique, fédérateur",
    quote: "On avance mieux quand on reste vrais entre nous.",
  },
];

export const metadata: Metadata = {
  title: "À propos | TENF",
  description:
    "L’histoire de TENF : des débuts sur Facebook à une communauté de streamers structurée, portée par l’entraide réelle et trois fondateurs. Pour le public et les membres.",
  alternates: {
    canonical: "https://tenf-community.com/a-propos",
  },
};

export default async function Page() {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  let totalMembers = 564;
  let activeMembers = 220;
  let foundersWithAvatar: FounderProfilePublic[] = founders.map((founder) => ({
    ...founder,
    avatarUrl: `https://unavatar.io/twitch/${founder.twitchLogin}`,
  }));

  try {
    const [homeRes, twitchUsers] = await Promise.all([
      fetch(`${baseUrl}/api/home`, { next: { revalidate: 60 } }),
      getTwitchUsers(founders.map((founder) => founder.twitchLogin)),
    ]);

    if (homeRes.ok) {
      const homeData = (await homeRes.json()) as HomeApiResponse;
      totalMembers = homeData.stats?.totalMembers ?? totalMembers;
      activeMembers = homeData.stats?.activeMembers ?? activeMembers;
    }

    const avatarByLogin = new Map((twitchUsers || []).map((user) => [user.login.toLowerCase(), user.profile_image_url]));
    foundersWithAvatar = founders.map((founder) => ({
      ...founder,
      avatarUrl: avatarByLogin.get(founder.twitchLogin.toLowerCase()) || `https://unavatar.io/twitch/${founder.twitchLogin}`,
    }));
  } catch (error) {
    console.error("[A propos] Erreur chargement données:", error);
  }

  return (
    <AboutPublicPage totalMembers={totalMembers} activeMembers={activeMembers} foundersWithAvatar={foundersWithAvatar} />
  );
}
