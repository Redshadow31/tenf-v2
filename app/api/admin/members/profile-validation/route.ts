import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { memberRepository } from "@/lib/repositories";
import { supabaseAdmin } from "@/lib/db/supabase";
import { syncProfileValidationNotification } from "@/lib/memberNotifications";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseDateFromDb(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

function isDiscordPlaceholderLogin(value?: string | null): boolean {
  const login = (value || "").trim().toLowerCase();
  return login.startsWith("nouveau_");
}

async function ensureSupabaseMemberForPending(pending: any, updatedBy: string) {
  const normalizedLogin = String(pending?.twitch_login || "").trim().toLowerCase();
  if (!normalizedLogin) return null;

  const byLogin = await memberRepository.findByTwitchLogin(normalizedLogin);
  if (byLogin) return byLogin;

  if (!isDiscordPlaceholderLogin(normalizedLogin)) {
    return null;
  }

  const discordId = String(pending?.discord_id || "").trim() || undefined;
  const fallbackDisplayName = discordId
    ? `Nouveau membre ${discordId.slice(-4)}`
    : normalizedLogin;

  try {
    return await memberRepository.create({
      twitchLogin: normalizedLogin,
      twitchUrl: `https://www.twitch.tv/${normalizedLogin}`,
      displayName: fallbackDisplayName,
      siteUsername: fallbackDisplayName,
      discordId,
      role: "Nouveau",
      isVip: false,
      isActive: false,
      badges: [],
      profileValidationStatus: "non_soumis",
      onboardingStatus: "a_faire",
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy,
    });
  } catch (createError) {
    // Tolérance aux courses d'écriture: un autre process a pu le créer entre-temps.
    const lateRead = await memberRepository.findByTwitchLogin(normalizedLogin);
    if (lateRead) return lateRead;
    throw createError;
  }
}

/**
 * GET - Liste les demandes de modification de profil en attente
 *
 * Réponse enrichie : chaque demande embarque, quand le membre existe en base,
 * un mini-objet `member` (rôle, nom affiché, statut actif, VIP) pour permettre
 * à l'écran de validation d'afficher un badge rôle et un avertissement
 * contextualisé sans devoir refaire un appel par ligne.
 */
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("member_profile_pending")
      .select("*")
      .eq("status", "pending")
      .order("submitted_at", { ascending: false });

    if (error) throw error;

    // Enrichit chaque demande avec le snapshot léger du membre associé
    // (rôle, displayName, actif, VIP). Une seule requête batch pour limiter
    // l'overhead, et tolérante aux logins absents (member = null).
    const pending = data || [];
    const uniqueLogins = Array.from(
      new Set(
        pending
          .map((row: any) => String(row?.twitch_login || "").trim().toLowerCase())
          .filter((login: string) => login.length > 0)
      )
    );

    let membersByLogin = new Map<string, any>();
    if (uniqueLogins.length > 0) {
      const { data: memberRows, error: membersError } = await supabaseAdmin
        .from("members")
        .select(
          "twitch_login, role, display_name, is_active, is_vip, is_archived, profile_validation_status, integration_date, twitch_status"
        )
        .in("twitch_login", uniqueLogins);
      if (membersError) {
        console.error("[profile-validation] members enrich error:", membersError);
      }
      membersByLogin = new Map(
        (memberRows || []).map((m: any) => [String(m.twitch_login || "").toLowerCase(), m])
      );
    }

    const enriched = pending.map((row: any) => {
      const login = String(row?.twitch_login || "").trim().toLowerCase();
      const m = login ? membersByLogin.get(login) : undefined;
      const twitchStatus = m?.twitch_status && typeof m.twitch_status === "object" ? m.twitch_status : null;
      const avatarFromStatus =
        twitchStatus && typeof (twitchStatus as { profileImageUrl?: unknown }).profileImageUrl === "string"
          ? String((twitchStatus as { profileImageUrl: string }).profileImageUrl).trim() || null
          : null;
      return {
        ...row,
        member: m
          ? {
              role: m.role ?? null,
              displayName: m.display_name ?? null,
              isActive: typeof m.is_active === "boolean" ? m.is_active : null,
              isVip: typeof m.is_vip === "boolean" ? m.is_vip : null,
              isArchived: typeof m.is_archived === "boolean" ? m.is_archived : null,
              profileValidationStatus: m.profile_validation_status ?? null,
              hasIntegrationDate: !!m.integration_date,
              /** URL Twitch si synchronisée dans twitch_status (sinon null — pas d'invention). */
              avatarUrl: avatarFromStatus,
            }
          : null,
      };
    });

    try {
      await syncProfileValidationNotification();
    } catch (notificationError) {
      console.error("[profile-validation] notification sync error (GET):", notificationError);
    }

    return NextResponse.json({ pending: enriched });
  } catch (error) {
    console.error("[profile-validation] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST - Approuve, rejette ou supprime une demande
 * Body: { id, action: 'approve' | 'reject' | 'force_delete' }
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { id, action } = body;

    if (!id || !["approve", "reject", "force_delete"].includes(action)) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const pendingQuery = supabaseAdmin
      .from("member_profile_pending")
      .select("*")
      .eq("id", id);

    const { data: pending, error: fetchError } =
      action === "force_delete"
        ? await pendingQuery.single()
        : await pendingQuery.eq("status", "pending").single();

    if (fetchError || !pending) {
      return NextResponse.json({ error: "Demande non trouvée ou déjà traitée" }, { status: 404 });
    }

    if (action === "force_delete") {
      const { error: deleteError } = await supabaseAdmin
        .from("member_profile_pending")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw deleteError;
      }

      try {
        await syncProfileValidationNotification();
      } catch (notificationError) {
        console.error("[profile-validation] notification sync error (POST force_delete):", notificationError);
      }

      return NextResponse.json({
        success: true,
        message: "Demande supprimée définitivement",
      });
    }

    if (action === "approve") {
      const ensuredMember = await ensureSupabaseMemberForPending(pending, admin.discordId);
      if (!ensuredMember) {
        return NextResponse.json(
          { error: "Membre introuvable en base pour cette demande" },
          { status: 404 }
        );
      }
      // Règle métier TENF :
      //  - rôle "Communauté"  → reste inactif après validation
      //  - rôle "Nouveau"     → reste inactif après validation (attribution explicite
      //    d'un rôle actif requise via la fiche membre)
      //  - autres rôles       → activation automatique
      // Le rôle "Nouveau" est un statut interne transitoire et ne doit pas devenir
      // actif tant qu'un admin n'a pas attribué un vrai rôle communautaire.
      const shouldStayInactive =
        ensuredMember.role === "Communauté" || ensuredMember.role === "Nouveau";
      await memberRepository.update(pending.twitch_login, {
        description: pending.description || undefined,
        instagram: pending.instagram || undefined,
        tiktok: pending.tiktok || undefined,
        twitter: pending.twitter || undefined,
        birthday: parseDateFromDb(pending.birthday),
        twitchAffiliateDate: parseDateFromDb(pending.twitch_affiliate_date),
        isActive: shouldStayInactive ? false : true,
        profileValidationStatus: "valide",
        updatedBy: admin.discordId,
      });
    }

    await supabaseAdmin
      .from("member_profile_pending")
      .update({
        status: action === "approve" ? "approved" : "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: admin.discordId,
      })
      .eq("id", id);

    if (action === "reject") {
      await memberRepository.update(pending.twitch_login, {
        profileValidationStatus: "non_soumis",
      });
    }

    try {
      await syncProfileValidationNotification();
    } catch (notificationError) {
      console.error("[profile-validation] notification sync error (POST):", notificationError);
    }

    return NextResponse.json({
      success: true,
      message: action === "approve" ? "Profil validé" : "Demande rejetée",
    });
  } catch (error) {
    console.error("[profile-validation] POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
