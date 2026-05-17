import { supabaseAdmin } from "@/lib/db/supabase";
import { FOUNDERS, getAdminRole } from "@/lib/adminRoles";
import { loadAdminAccessCache, getAllAdminIdsFromCache } from "@/lib/adminAccessCache";
import { AUDIENCE_MEMBER_DIRECT } from "@/lib/memberNotifications";

/**
 * Notifie chaque fondateur et admin coordinateur lorsqu'un questionnaire est soumis en entier.
 */
export async function notifyStaffQuestionnaireSubmitted(params: {
  submissionId: string;
  moderatorDiscordId: string;
  moderatorLabel: string;
}): Promise<void> {
  await loadAdminAccessCache();

  const recipients = new Set<string>();
  for (const id of FOUNDERS) recipients.add(id);

  for (const discordId of getAllAdminIdsFromCache()) {
    const role = getAdminRole(discordId);
    if (role === "FONDATEUR" || role === "ADMIN_COORDINATEUR") {
      recipients.add(discordId);
    }
  }

  if (recipients.size === 0) return;

  const now = new Date().toISOString();
  const rows = [...recipients].map((discordId) => ({
    dedupe_key: `staff_questionnaire.submitted.${params.submissionId}.${discordId}`,
    audience: AUDIENCE_MEMBER_DIRECT,
    target_discord_id: discordId,
    type: "staff_questionnaire_submitted",
    title: "Questionnaire posture staff soumis",
    message: `${params.moderatorLabel} a envoyé son questionnaire posture staff. Tu peux consulter ses réponses et préparer la synthèse.`,
    link: `/admin/moderation/staff/questionnaires/${params.submissionId}`,
    metadata: {
      submissionId: params.submissionId,
      moderatorDiscordId: params.moderatorDiscordId,
    },
    is_active: true,
    updated_at: now,
  }));

  const { error } = await supabaseAdmin.from("member_notifications").upsert(rows, {
    onConflict: "dedupe_key",
  });
  if (error) {
    console.error("[staff-questionnaire] notify submit failed:", error);
  }
}
