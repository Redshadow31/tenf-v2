import { NextResponse } from "next/server";
import { requireAdvancedAdminAccess } from "@/lib/requireAdmin";
import {
  executeFollowEngagementSnapshotJob,
  startFollowEngagementSnapshotJob,
} from "@/lib/admin/followEngagement";
import { supabaseAdmin } from "@/lib/db/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300; // Snapshot follow potentiellement long (Twitch + DB)

export async function POST() {
  try {
    const admin = await requireAdvancedAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const started = await startFollowEngagementSnapshotJob(admin.discordId || null);
    if (started.alreadyRunning) {
      return NextResponse.json(
        {
          success: true,
          snapshotId: started.snapshotId,
          status: "running" as const,
          alreadyRunning: true,
        },
        { status: 202 }
      );
    }

    const netlifyEnv = process.env.NETLIFY;
    const isNetlify = netlifyEnv === "true" || Boolean(netlifyEnv);
    // `process.env.NETLIFY` n'est pas fiable au runtime des fonctions Next.js sur Netlify :
    // si la detection echoue, la route bascule en synchrone et le job (Twitch + DB) depasse
    // le timeout du CDN/lambda (~26-60s) -> 504. On considere donc "serveur deploye" des que
    // NODE_ENV vaut "production" (fiable cote serveur Next prod), independamment de NETLIFY.
    const isDeployedServer = process.env.NODE_ENV === "production" || isNetlify;
    // Secret partage route <-> fonction background. On retombe sur NEXTAUTH_SECRET
    // (toujours defini en prod) pour ne pas exiger une nouvelle variable Netlify.
    const bgSecret =
      process.env.NETLIFY_FOLLOW_SNAPSHOT_BG_SECRET || process.env.NEXTAUTH_SECRET;
    const siteOrigin = (
      process.env.URL ||
      process.env.DEPLOY_PRIME_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXTAUTH_URL ||
      process.env.NEXTAUTH_URL_INTERNAL ||
      ""
    ).replace(/\/$/, "");

    // En production, la route Next est coupee par le CDN (~60s) avant la fin du job -> 504.
    // Une Netlify Background Function tourne jusqu'a ~15 min apres la reponse au declencheur.
    if (isDeployedServer && bgSecret && siteOrigin) {
      const bgUrl = `${siteOrigin}/.netlify/functions/follow-engagement-snapshot-background`;
      const trigger = await fetch(bgUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          snapshotId: started.snapshotId,
          generatedByDiscordId: admin.discordId || null,
          secret: bgSecret,
        }),
        cache: "no-store",
      });

      if (!trigger.ok && trigger.status !== 202) {
        const detail = await trigger.text().catch(() => "");
        console.error(
          "[Admin Follow Snapshot Run] Echec declenchement background Netlify:",
          trigger.status,
          detail
        );
        await supabaseAdmin
          .from("follow_engagement_snapshots")
          .update({ status: "failed" })
          .eq("id", started.snapshotId);
        return NextResponse.json(
          {
            error:
              "Impossible de lancer le snapshot en arrière-plan. Consulter les logs Netlify (fonction follow-engagement-snapshot-background).",
          },
          { status: 502 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          snapshotId: started.snapshotId,
          status: "running" as const,
          alreadyRunning: false,
        },
        { status: 202 }
      );
    }

    if (isDeployedServer && (!bgSecret || !siteOrigin)) {
      console.error(
        "[Admin Follow Snapshot Run] Config background manquante:",
        JSON.stringify({ hasBgSecret: Boolean(bgSecret), hasSiteOrigin: Boolean(siteOrigin) })
      );
      return NextResponse.json(
        {
          error:
            "Configuration background manquante : définir NETLIFY_FOLLOW_SNAPSHOT_BG_SECRET (secret partagé) et s'assurer que URL, NEXT_PUBLIC_BASE_URL ou NEXTAUTH_URL est disponible pour déclencher la fonction background.",
        },
        { status: 503 }
      );
    }

    // Local (next dev) uniquement : execution synchrone dans la route.
    await executeFollowEngagementSnapshotJob(started.snapshotId, admin.discordId || null);

    return NextResponse.json(
      {
        success: true,
        snapshotId: started.snapshotId,
        status: "completed" as const,
        alreadyRunning: false,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Admin Follow Snapshot Run] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur interne lors de la génération du snapshot follow" },
      { status: 500 }
    );
  }
}
