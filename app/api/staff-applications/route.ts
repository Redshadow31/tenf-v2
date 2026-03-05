import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/requireAdmin";
import {
  createStaffApplication,
  loadStaffApplications,
  updateStaffApplicationAdmin,
  type StaffApplicationAnswers,
  type StaffApplicationStatus,
} from "@/lib/staffApplicationsStorage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseAnswers(payload: any): { ok: true; answers: StaffApplicationAnswers } | { ok: false; error: string } {
  const requiredStrings = [
    "pseudo_discord",
    "pays_fuseau",
    "disponibilites",
    "pourquoi_tenf",
    "pourquoi_role",
    "motivation_560",
    "principes_proportionnalite_explication",
    "difference_sanctions_exemple",
    "scenario_critique_staff",
    "scenario_clash_vocal",
    "scenario_dm_grave",
    "scenario_spam_promo",
    "scenario_modo_sec",
    "scenario_manipulation",
    "scenario_intrusif_vocal",
    "contradiction",
    "quand_jai_tort",
    "limites_declencheurs",
    "prise_de_recul",
    "passer_relais_exemple",
    "desaccord_staff",
    "accepte_pause_retrait_pourquoi",
    "ami_demande_infos",
    "objectif_apprentissage",
  ] as const;

  for (const key of requiredStrings) {
    if (!isNonEmptyString(payload?.[key])) {
      return { ok: false, error: `Champ requis manquant: ${key}` };
    }
  }

  if (!["moderateur", "soutien", "les_deux"].includes(payload?.role_postule)) {
    return { ok: false, error: "Rôle postulé invalide." };
  }
  if (!["oui", "non", "parfois"].includes(payload?.vocal_reunion)) {
    return { ok: false, error: "Valeur invalide pour vocal_reunion." };
  }
  if (!["direct", "empathique", "structure", "mixte", "autre"].includes(payload?.style_communication)) {
    return { ok: false, error: "Valeur invalide pour style_communication." };
  }
  if (!["non", "oui_legere", "oui_importante"].includes(payload?.periode_impact)) {
    return { ok: false, error: "Valeur invalide pour periode_impact." };
  }
  if (!["cadre", "humain", "mix"].includes(payload?.preference_cadre)) {
    return { ok: false, error: "Valeur invalide pour preference_cadre." };
  }
  if (!["2h", "4h", "6h", "variable"].includes(payload?.engagement_hebdo)) {
    return { ok: false, error: "Valeur invalide pour engagement_hebdo." };
  }

  const age = Number(payload?.age);
  if (!Number.isFinite(age) || age < 13) {
    return { ok: false, error: "L'âge minimum est de 13 ans." };
  }

  const niveauDiscord = Number(payload?.niveau_discord);
  const energieMentale = Number(payload?.energie_mentale);
  if (![1, 2, 3, 4, 5].includes(niveauDiscord)) {
    return { ok: false, error: "niveau_discord doit être compris entre 1 et 5." };
  }
  if (![1, 2, 3, 4, 5].includes(energieMentale)) {
    return { ok: false, error: "energie_mentale doit être compris entre 1 et 5." };
  }

  if (typeof payload?.experience_modo !== "boolean") {
    return { ok: false, error: "experience_modo est requis." };
  }
  if (payload.experience_modo && !isNonEmptyString(payload?.experience_details)) {
    return { ok: false, error: "experience_details est requis si experience_modo = true." };
  }
  if (!payload.experience_modo && !isNonEmptyString(payload?.experience_similaire)) {
    return { ok: false, error: "experience_similaire est requis si experience_modo = false." };
  }
  if (payload?.periode_impact !== "non" && !isNonEmptyString(payload?.periode_gestion)) {
    return { ok: false, error: "periode_gestion est requis si periode_impact n'est pas 'non'." };
  }
  if (payload?.engagement_hebdo === "variable" && !isNonEmptyString(payload?.engagement_hebdo_variable)) {
    return { ok: false, error: "Précise l'engagement hebdo variable." };
  }
  if (!Array.isArray(payload?.reaction_stress) || payload.reaction_stress.length === 0) {
    return { ok: false, error: "Sélectionne au moins une réaction au stress." };
  }
  if (!Array.isArray(payload?.poles_interet) || payload.poles_interet.length === 0) {
    return { ok: false, error: "Sélectionne au moins un pôle d'intérêt." };
  }
  if (payload?.reaction_stress?.includes("autre") && !isNonEmptyString(payload?.reaction_stress_autre)) {
    return { ok: false, error: "Précise 'autre' pour reaction_stress." };
  }
  if (!payload?.consentement_traitement || !payload?.comprend_entretien || !payload?.accepte_confidentialite) {
    return { ok: false, error: "Tous les consentements requis doivent être acceptés." };
  }

  const answers: StaffApplicationAnswers = {
    pseudo_discord: payload.pseudo_discord.trim(),
    pseudo_twitch: isNonEmptyString(payload?.pseudo_twitch) ? payload.pseudo_twitch.trim() : undefined,
    age,
    pays_fuseau: payload.pays_fuseau.trim(),
    disponibilites: payload.disponibilites.trim(),
    micro_ok: !!payload.micro_ok,
    vocal_reunion: payload.vocal_reunion,
    role_postule: payload.role_postule,
    experience_modo: payload.experience_modo,
    experience_details: isNonEmptyString(payload?.experience_details) ? payload.experience_details.trim() : undefined,
    experience_similaire: isNonEmptyString(payload?.experience_similaire) ? payload.experience_similaire.trim() : undefined,
    pourquoi_tenf: payload.pourquoi_tenf.trim(),
    pourquoi_role: payload.pourquoi_role.trim(),
    motivation_560: payload.motivation_560.trim(),
    niveau_discord: niveauDiscord as 1 | 2 | 3 | 4 | 5,
    principes_proportionnalite: !!payload.principes_proportionnalite,
    principes_proportionnalite_explication: payload.principes_proportionnalite_explication.trim(),
    difference_sanctions: !!payload.difference_sanctions,
    difference_sanctions_exemple: payload.difference_sanctions_exemple.trim(),
    redaction_cr: !!payload.redaction_cr,
    scenario_critique_staff: payload.scenario_critique_staff.trim(),
    scenario_clash_vocal: payload.scenario_clash_vocal.trim(),
    scenario_dm_grave: payload.scenario_dm_grave.trim(),
    scenario_spam_promo: payload.scenario_spam_promo.trim(),
    scenario_modo_sec: payload.scenario_modo_sec.trim(),
    scenario_manipulation: payload.scenario_manipulation.trim(),
    scenario_intrusif_vocal: payload.scenario_intrusif_vocal.trim(),
    style_communication: payload.style_communication,
    style_communication_autre: isNonEmptyString(payload?.style_communication_autre)
      ? payload.style_communication_autre.trim()
      : undefined,
    contradiction: payload.contradiction.trim(),
    quand_jai_tort: payload.quand_jai_tort.trim(),
    limites_declencheurs: payload.limites_declencheurs.trim(),
    prise_de_recul: payload.prise_de_recul.trim(),
    energie_mentale: energieMentale as 1 | 2 | 3 | 4 | 5,
    periode_impact: payload.periode_impact,
    periode_gestion: isNonEmptyString(payload?.periode_gestion) ? payload.periode_gestion.trim() : undefined,
    reaction_stress: payload.reaction_stress,
    reaction_stress_autre: isNonEmptyString(payload?.reaction_stress_autre)
      ? payload.reaction_stress_autre.trim()
      : undefined,
    preference_cadre: payload.preference_cadre,
    preference_cadre_detail: isNonEmptyString(payload?.preference_cadre_detail)
      ? payload.preference_cadre_detail.trim()
      : undefined,
    passer_relais: !!payload.passer_relais,
    passer_relais_exemple: payload.passer_relais_exemple.trim(),
    desaccord_staff: payload.desaccord_staff.trim(),
    accepte_pause_retrait: !!payload.accepte_pause_retrait,
    accepte_pause_retrait_pourquoi: payload.accepte_pause_retrait_pourquoi.trim(),
    accepte_confidentialite: !!payload.accepte_confidentialite,
    ami_demande_infos: payload.ami_demande_infos.trim(),
    accepte_documenter: !!payload.accepte_documenter,
    engagement_hebdo: payload.engagement_hebdo,
    engagement_hebdo_variable: isNonEmptyString(payload?.engagement_hebdo_variable)
      ? payload.engagement_hebdo_variable.trim()
      : undefined,
    poles_interet: payload.poles_interet,
    objectif_apprentissage: payload.objectif_apprentissage.trim(),
    consentement_traitement: !!payload.consentement_traitement,
    comprend_entretien: !!payload.comprend_entretien,
    commentaire_libre: isNonEmptyString(payload?.commentaire_libre) ? payload.commentaire_libre.trim() : undefined,
  };

  return { ok: true, answers };
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const applications = await loadStaffApplications();
    return NextResponse.json({ applications });
  } catch (error) {
    console.error("[StaffApplications API] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const discordId = cookieStore.get("discord_user_id")?.value;
    const discordUsername = cookieStore.get("discord_username")?.value;
    const discordAvatar = cookieStore.get("discord_avatar")?.value;

    if (!discordId || !discordUsername) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = parseAnswers(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const application = await createStaffApplication({
      applicant_discord_id: discordId,
      applicant_username: discordUsername,
      applicant_avatar: discordAvatar || null,
      answers: parsed.answers,
    });

    return NextResponse.json({ success: true, application });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    if (message.includes("déjà")) {
      return NextResponse.json(
        { error: "Une candidature existe déjà pour ce compte." },
        { status: 409 }
      );
    }
    console.error("[StaffApplications API] POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    const adminStatus = body.adminStatus as StaffApplicationStatus | undefined;
    const adminNote = typeof body.adminNote === "string" ? body.adminNote : undefined;
    const hasRedFlag = typeof body.hasRedFlag === "boolean" ? body.hasRedFlag : undefined;
    const redFlagLabel = typeof body.redFlagLabel === "string" ? body.redFlagLabel : undefined;
    const assignedTo = typeof body.assignedTo === "string" ? body.assignedTo : undefined;
    const lastContactedAt = typeof body.lastContactedAt === "string" ? body.lastContactedAt : undefined;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }
    if (
      adminStatus &&
      !["nouveau", "a_contacter", "entretien_prevu", "accepte", "refuse", "archive"].includes(adminStatus)
    ) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const updated = await updateStaffApplicationAdmin({
      id,
      admin_status: adminStatus,
      admin_note: adminNote,
      has_red_flag: hasRedFlag,
      red_flag_label: redFlagLabel,
      assigned_to: assignedTo,
      last_contacted_at: lastContactedAt,
    });

    if (!updated) {
      return NextResponse.json({ error: "Postulation introuvable" }, { status: 404 });
    }

    return NextResponse.json({ success: true, application: updated });
  } catch (error) {
    console.error("[StaffApplications API] PATCH error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
