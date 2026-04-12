import type { Handler } from "@netlify/functions";
import { executeFollowEngagementSnapshotJob } from "../../lib/admin/followEngagement";

type Body = {
  snapshotId?: string;
  generatedByDiscordId?: string | null;
  secret?: string;
};

/**
 * Netlify Background Function (suffixe -background) : execution jusqu'a ~15 min
 * apres reponse HTTP au client. Utilisee pour le snapshot follow admin (Twitch + DB)
 * sans subir le timeout de la route Next.js / du CDN.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body: Body;
  try {
    body = JSON.parse(event.body || "{}") as Body;
  } catch {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "invalid_json" }),
    };
  }

  const expected = process.env.NETLIFY_FOLLOW_SNAPSHOT_BG_SECRET;
  if (!expected || body.secret !== expected) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "unauthorized" }),
    };
  }

  if (!body.snapshotId) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "missing_snapshotId" }),
    };
  }

  try {
    await executeFollowEngagementSnapshotJob(
      body.snapshotId,
      body.generatedByDiscordId ?? null
    );
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("[follow-engagement-snapshot-background] Erreur:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};
