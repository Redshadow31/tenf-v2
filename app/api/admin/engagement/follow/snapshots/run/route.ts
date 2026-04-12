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
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
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
    const bgSecret = process.env.NETLIFY_FOLLOW_SNAPSHOT_BG_SECRET;
    const siteOrigin = (
      process.env.URL ||
      process.env.DEPLOY_PRIME_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXTAUTH_URL ||
      ""
    ).replace(/\/$/, "");

    // En production Netlify, la route Next est coupee par le CDN (~60s) avant la fin du job -> 504.
    // Une Netlify Background Function tourne jusqu'a ~15 min apres la reponse au declencheur.
    if (isNetlify && bgSecret && siteOrigin) {
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
              "Impossible de lancer le snapshot en arriere-plan. Consulter les logs Netlify (fonction follow-engagement-snapshot-background).",
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

    if (isNetlify && (!bgSecret || !siteOrigin)) {
      return NextResponse.json(
        {
          error:
            "Configuration Netlify manquante : definir NETLIFY_FOLLOW_SNAPSHOT_BG_SECRET (secret partage) et s'assurer que URL ou NEXT_PUBLIC_BASE_URL est disponible pour declencher la fonction background.",
        },
        { status: 503 }
      );
    }

    // Local (next dev) ou hors Netlify : execution synchrone dans la route.
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
      { error: "Erreur interne lors de la generation du snapshot follow" },
      { status: 500 }
    );
  }
}
