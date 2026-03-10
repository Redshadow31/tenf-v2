import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { memberRepository } from "@/lib/repositories";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type BootstrapBody = {
  discordUsername?: string;
  twitchChannelUrl?: string;
  parrain?: string;
  notes?: string;
  birthday?: string;
  twitchAffiliateDate?: string;
  timezone?: string;
};

function normalizeDateInput(value?: string): Date | undefined {
  const raw = (value || "").trim();
  if (!raw) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function extractTwitchLogin(urlOrLogin: string): string | null {
  const raw = (urlOrLogin || "").trim();
  if (!raw) return null;
  const patterns = [/twitch\.tv\/([a-zA-Z0-9_]+)/i, /^([a-zA-Z0-9_]+)$/];
  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match?.[1]) return match[1].toLowerCase();
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const discordId = session?.user?.discordId;
    if (!discordId) {
      return NextResponse.json({ error: "Connexion Discord requise" }, { status: 401 });
    }

    const body = (await request.json()) as BootstrapBody;
    const discordUsername = (body.discordUsername || session.user.username || "").trim();
    const parrain = (body.parrain || "").trim();
    const timezone = (body.timezone || "").trim();
    const notes = (body.notes || "").trim();
    const twitchChannelUrl = (body.twitchChannelUrl || "").trim();
    const twitchLogin = extractTwitchLogin(twitchChannelUrl);

    if (!discordUsername) {
      return NextResponse.json({ error: "Le pseudo Discord est requis" }, { status: 400 });
    }
    if (!twitchLogin) {
      return NextResponse.json(
        { error: "Lien Twitch invalide (utilise https://www.twitch.tv/pseudo ou juste pseudo)" },
        { status: 400 }
      );
    }
    if (!parrain) {
      return NextResponse.json({ error: "Le parrain TENF est requis" }, { status: 400 });
    }

    const birthday = normalizeDateInput(body.birthday);
    const twitchAffiliateDate = normalizeDateInput(body.twitchAffiliateDate);

    if ((body.birthday || "").trim() && !birthday) {
      return NextResponse.json({ error: "Format anniversaire invalide (YYYY-MM-DD)" }, { status: 400 });
    }
    if ((body.twitchAffiliateDate || "").trim() && !twitchAffiliateDate) {
      return NextResponse.json({ error: "Format affiliation invalide (YYYY-MM-DD)" }, { status: 400 });
    }

    const existingByDiscord = await memberRepository.findByDiscordId(discordId);
    const existingByTwitch = await memberRepository.findByTwitchLogin(twitchLogin);

    if (existingByTwitch && existingByTwitch.discordId && existingByTwitch.discordId !== discordId) {
      return NextResponse.json(
        { error: "Ce compte Twitch est déjà lié à un autre membre." },
        { status: 409 }
      );
    }

    let member = existingByDiscord;
    if (!member && existingByTwitch) {
      member = await memberRepository.update(existingByTwitch.twitchLogin, {
        discordId,
        discordUsername,
        updatedAt: new Date(),
        updatedBy: discordId,
      });
    }

    if (!member) {
      member = await memberRepository.create({
        twitchLogin,
        twitchUrl: `https://www.twitch.tv/${twitchLogin}`,
        displayName: discordUsername,
        discordId,
        discordUsername,
        role: "Nouveau",
        isActive: false,
        isVip: false,
        badges: [],
        parrain,
        birthday,
        twitchAffiliateDate,
        timezone: timezone || undefined,
        description: notes || undefined,
        profileValidationStatus: "non_soumis",
        onboardingStatus: "a_faire",
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: discordId,
      });
    } else {
      const isPlaceholder =
        member.role === "Nouveau" &&
        (member.twitchLogin.startsWith("nouveau_") || member.twitchLogin.startsWith("nouveau-"));

      const updates: any = {
        discordUsername,
        parrain,
        birthday,
        twitchAffiliateDate,
        timezone: timezone || undefined,
        description: notes || member.description,
        role: member.role || "Nouveau",
        isActive: false,
        updatedAt: new Date(),
        updatedBy: discordId,
      };

      if (isPlaceholder || member.twitchLogin !== twitchLogin) {
        updates.twitchLogin = twitchLogin;
        updates.twitchUrl = `https://www.twitch.tv/${twitchLogin}`;
      }

      member = await memberRepository.update(member.twitchLogin, updates);
    }

    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error("[members/me/bootstrap] POST error:", error);
    return NextResponse.json({ error: "Erreur lors de la création du profil" }, { status: 500 });
  }
}
