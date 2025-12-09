import Link from "next/link";
import { getTwitchUser } from "@/lib/twitch";

type MemberPageProps = {
  params: { id: string };
};

const roleBadgeClass: Record<string, string> = {
  Staff: "bg-[#9146ff] text-white",
  "Développement": "bg-[#5a32b4] text-white",
  Affilié: "bg-[#9146ff]/20 text-[#9146ff] border border-[#9146ff]/30",
};

export default async function MemberPage({ params }: MemberPageProps) {
  // Mock data pour le membre
  const mockMember = {
    id: params.id,
    name: "Streamer Exemple",
    role: "Affilié",
    twitchLogin: "streamerexemple", // Login Twitch pour récupérer l'avatar
    bio: "Streamer passionné et membre actif de la New Family.",
    socials: {
      twitch: "#",
      discord: "#",
      instagram: "#",
    },
    stats: {
      livesThisMonth: 12,
      raidsTENF: 10,
      gamesPlayed: ["Fortnite", "Sims 4", "Inzoi"],
    },
    spotlight: {
      participated: "Oui",
      vip: false,
    },
  };

  // Récupération de l'avatar Twitch (mock pour l'instant)
  const twitchUser = await getTwitchUser(mockMember.twitchLogin);

  return (
    <div className="space-y-8">
      {/* Header fiche membre */}
      <section className="card flex flex-col gap-6 bg-[#1a1a1d] border border-gray-700 p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <img
              src={twitchUser.profile_image_url}
              alt={mockMember.name}
              className="h-20 w-20 rounded-full object-cover border border-gray-700"
            />
            <div>
              <h1 className="text-3xl font-bold text-white">{mockMember.name}</h1>
              <div className="mt-2 inline-flex items-center gap-2">
                <span
                  className={`rounded-lg px-3 py-1 text-xs font-bold ${
                    roleBadgeClass[mockMember.role] ?? "bg-gray-700 text-white"
                  }`}
                >
                  {mockMember.role}
                </span>
                <span className="text-sm text-gray-400">ID : {mockMember.id}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={mockMember.socials.twitch}
              className="rounded-lg bg-[#9146ff]/10 px-4 py-2 text-sm font-medium text-[#9146ff] transition-colors hover:bg-[#9146ff]/20 border border-[#9146ff]/30"
            >
              Twitch
            </Link>
            <Link
              href={mockMember.socials.discord}
              className="rounded-lg bg-[#1a1a1d] px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/5 border border-gray-700"
            >
              Discord
            </Link>
            <Link
              href={mockMember.socials.instagram}
              className="rounded-lg bg-[#1a1a1d] px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/5 border border-gray-700"
            >
              Instagram
            </Link>
          </div>
        </div>
        <p className="text-gray-300">{mockMember.bio}</p>
      </section>

      {/* Statistiques publiques */}
      <section className="card grid gap-6 bg-[#1a1a1d] border border-gray-700 p-8 md:grid-cols-3">
        <div className="rounded-lg border border-gray-700 bg-[#0e0e10] p-4">
          <p className="text-sm text-gray-400">Lives ce mois</p>
          <p className="text-2xl font-bold text-white">{mockMember.stats.livesThisMonth}</p>
        </div>
        <div className="rounded-lg border border-gray-700 bg-[#0e0e10] p-4">
          <p className="text-sm text-gray-400">Raids TENF</p>
          <p className="text-2xl font-bold text-white">{mockMember.stats.raidsTENF}</p>
        </div>
        <div className="rounded-lg border border-gray-700 bg-[#0e0e10] p-4">
          <p className="text-sm text-gray-400">Jeux joués</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {mockMember.stats.gamesPlayed.map((game) => (
              <span
                key={game}
                className="rounded-lg bg-[#1a1a1d] px-3 py-1 text-xs text-gray-200 border border-gray-700"
              >
                {game}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Spotlight */}
      <section className="card grid gap-6 bg-[#1a1a1d] border border-gray-700 p-8 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold text-white">Spotlight</h2>
          <p className="mt-2 text-gray-300">
            Participation Spotlight : {mockMember.spotlight.participated}
          </p>
        </div>
        <div className="flex items-center justify-start gap-3 md:justify-end">
          {mockMember.spotlight.vip ? (
            <span className="rounded-lg bg-[#9146ff] px-4 py-2 text-sm font-bold text-white">
              VIP
            </span>
          ) : (
            <span className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300">
              Membre
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
