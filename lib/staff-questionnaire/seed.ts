import { supabaseAdmin } from "@/lib/db/supabase";
import {
  STAFF_QUESTIONNAIRE_DESCRIPTION,
  STAFF_QUESTIONNAIRE_QUESTIONS,
  STAFF_QUESTIONNAIRE_TITLE,
} from "./questionnaire-data";
import { STAFF_QUESTIONNAIRE_TEMPLATE_SLUG } from "./types";

let seedPromise: Promise<string> | null = null;

/**
 * Synchronise le template actif et les 85 questions depuis la config TS.
 * Retourne l'UUID du template.
 */
export async function ensureStaffQuestionnaireTemplateSeeded(): Promise<string> {
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    const { data: existing, error: findError } = await supabaseAdmin
      .from("staff_questionnaire_templates")
      .select("id, version")
      .eq("slug", STAFF_QUESTIONNAIRE_TEMPLATE_SLUG)
      .maybeSingle();

    if (findError) throw findError;

    let templateId = existing?.id as string | undefined;

    if (!templateId) {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("staff_questionnaire_templates")
        .insert({
          slug: STAFF_QUESTIONNAIRE_TEMPLATE_SLUG,
          title: STAFF_QUESTIONNAIRE_TITLE,
          description: STAFF_QUESTIONNAIRE_DESCRIPTION,
          version: 1,
          is_active: true,
        })
        .select("id")
        .single();
      if (insertError) throw insertError;
      templateId = inserted.id;
    } else {
      await supabaseAdmin
        .from("staff_questionnaire_templates")
        .update({
          title: STAFF_QUESTIONNAIRE_TITLE,
          description: STAFF_QUESTIONNAIRE_DESCRIPTION,
          is_active: true,
        })
        .eq("id", templateId);
    }

    const rows = STAFF_QUESTIONNAIRE_QUESTIONS.map((q, index) => ({
      template_id: templateId,
      section_key: q.sectionKey,
      section_title: q.sectionTitle,
      order: index + 1,
      question_number: q.number,
      question_key: q.key,
      label: q.label,
      help_text: q.helpText ?? null,
      type: q.type,
      options: {
        choices: q.options ?? null,
        scaleLabels: q.scaleLabels ?? null,
        threeFieldLabels: q.threeFieldLabels ?? null,
        complementLabel: q.complementLabel ?? null,
      },
      is_required: q.required !== false,
      analysis_hints: q.analysisHints ?? null,
    }));

    const { error: upsertError } = await supabaseAdmin
      .from("staff_questionnaire_questions")
      .upsert(rows, { onConflict: "template_id,question_key" });

    if (upsertError) throw upsertError;

    return templateId!;
  })();

  return seedPromise;
}
