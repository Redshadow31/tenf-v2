import { NextRequest, NextResponse } from "next/server";
import { requireAdvancedAdminAccess } from "@/lib/requireAdmin";
import { requireUser } from "@/lib/requireUser";
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

function asBoolean(value: unknown): boolean {
  return value === true || value === "true" || value === "oui" || value === 1;
}

function strOrFallback(value: unknown, fallback: string): string {
  return isNonEmptyString(value) ? value.trim() : fallback;
}

function parseAnswers(payload: any): { ok: true; answers: StaffApplicationAnswers } | { ok: false; error: string } {
  const role = payload?.role_postule;
  const isModeratorTrack = role === "moderateur" || role === "les_deux";
  const isSupportTrack = role === "soutien";
  if (!["moderateur", "soutien", "les_deux"].includes(role)) {
    return { ok: false, error: "Rôle postulé invalide." };
  }

  const requiredForAll = ["pseudo_discord", "pays_fuseau", "disponibilites", "pourquoi_tenf", "pourquoi_role", "motivation_560"] as const;
  for (const key of requiredForAll) {
    if (!isNonEmptyString(payload?.[key])) {
      return { ok: false, error: `Champ requis manquant: ${key}` };
    }
  }
  if (!asBoolean(payload?.consentement_traitement) || !asBoolean(payload?.comprend_entretien) || !asBoolean(payload?.accepte_confidentialite)) {
    return { ok: false, error: "Tous les consentements requis doivent être acceptés." };
  }

  const age = Number(payload?.age);
  if (!Number.isFinite(age) || age < 13) {
    return { ok: false, error: "L'âge minimum est de 13 ans." };
  }

  const styleCommunication = payload?.style_communication || "mixte";
  if (!["direct", "empathique", "structure", "mixte", "autre"].includes(styleCommunication)) {
    return { ok: false, error: "Valeur invalide pour style_communication." };
  }

  const engagementHebdo = payload?.engagement_hebdo || "variable";
  if (!["2h", "4h", "6h", "variable"].includes(engagementHebdo)) {
    return { ok: false, error: "Valeur invalide pour engagement_hebdo." };
  }
  if (engagementHebdo === "variable" && !isNonEmptyString(payload?.engagement_hebdo_variable)) {
    return { ok: false, error: "Précise l'engagement hebdo variable." };
  }
  if (!Array.isArray(payload?.poles_interet) || payload.poles_interet.length === 0) {
    return { ok: false, error: "Sélectionne au moins un pôle d'intérêt." };
  }
  if (!isNonEmptyString(payload?.objectif_apprentissage)) {
    return { ok: false, error: "objectif_apprentissage est requis." };
  }

  const reactionStressInput = Array.isArray(payload?.reaction_stress) ? payload.reaction_stress : [];
  const reactionStress = reactionStressInput.length > 0 ? reactionStressInput : ["controle"];
  if (reactionStress.includes("autre") && !isNonEmptyString(payload?.reaction_stress_autre)) {
    return { ok: false, error: "Précise 'autre' pour reaction_stress." };
  }

  const defaultsForSupport = {
    experience_modo: false,
    niveau_discord: 3,
    principes_proportionnalite: true,
    principes_proportionnalite_explication: "Parcours soutien: question non requise.",
    difference_sanctions: true,
    difference_sanctions_exemple: "Parcours soutien: question non requise.",
    redaction_cr: false,
    scenario_critique_staff: "Parcours soutien: question non requise.",
    scenario_clash_vocal: "Parcours soutien: question non requise.",
    scenario_dm_grave: "Parcours soutien: question non requise.",
    scenario_spam_promo: "Parcours soutien: question non requise.",
    scenario_modo_sec: "Parcours soutien: question non requise.",
    scenario_manipulation: "Parcours soutien: question non requise.",
    scenario_intrusif_vocal: "Parcours soutien: question non requise.",
    contradiction: "Parcours soutien: question non requise.",
    quand_jai_tort: "Parcours soutien: question non requise.",
    limites_declencheurs: "Parcours soutien: question non requise.",
    prise_de_recul: "Parcours soutien: question non requise.",
    energie_mentale: 3,
    periode_impact: "non" as const,
    preference_cadre: "mix" as const,
    passer_relais: true,
    passer_relais_exemple: "Parcours soutien: question non requise.",
    desaccord_staff: "Parcours soutien: question non requise.",
    accepte_pause_retrait: true,
    accepte_pause_retrait_pourquoi: "Parcours soutien: question non requise.",
    ami_demande_infos: "Je respecte la confidentialite staff.",
    accepte_documenter: true,
    micro_ok: true,
    vocal_reunion: "parfois" as const,
  };

  let experienceModo = asBoolean(payload?.experience_modo);
  let niveauDiscord = Number(payload?.niveau_discord);
  let energieMentale = Number(payload?.energie_mentale);

  if (isModeratorTrack) {
    const requiredModeratorStrings = [
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
    ] as const;
    for (const key of requiredModeratorStrings) {
      if (!isNonEmptyString(payload?.[key])) {
        return { ok: false, error: `Champ requis manquant: ${key}` };
      }
    }
    if (!["oui", "non", "parfois"].includes(payload?.vocal_reunion)) {
      return { ok: false, error: "Valeur invalide pour vocal_reunion." };
    }
    if (!["non", "oui_legere", "oui_importante"].includes(payload?.periode_impact)) {
      return { ok: false, error: "Valeur invalide pour periode_impact." };
    }
    if (![1, 2, 3, 4, 5].includes(niveauDiscord)) {
      return { ok: false, error: "niveau_discord doit être compris entre 1 et 5." };
    }
    if (![1, 2, 3, 4, 5].includes(energieMentale)) {
      return { ok: false, error: "energie_mentale doit être compris entre 1 et 5." };
    }
    if (payload?.periode_impact !== "non" && !isNonEmptyString(payload?.periode_gestion)) {
      return { ok: false, error: "periode_gestion est requis si periode_impact n'est pas 'non'." };
    }
    if (typeof payload?.experience_modo !== "boolean") {
      return { ok: false, error: "experience_modo est requis." };
    }
    if (experienceModo && !isNonEmptyString(payload?.experience_details)) {
      return { ok: false, error: "experience_details est requis si experience_modo = true." };
    }
    if (!experienceModo && !isNonEmptyString(payload?.experience_similaire)) {
      return { ok: false, error: "experience_similaire est requis si experience_modo = false." };
    }
  } else if (isSupportTrack) {
    // Defaults adaptés au parcours soutien allégé.
    experienceModo = defaultsForSupport.experience_modo;
    niveauDiscord = defaultsForSupport.niveau_discord;
    energieMentale = defaultsForSupport.energie_mentale;
  }


  const answers: StaffApplicationAnswers = {
    pseudo_discord: strOrFallback(payload.pseudo_discord, "Inconnu"),
    pseudo_twitch: isNonEmptyString(payload?.pseudo_twitch) ? payload.pseudo_twitch.trim() : undefined,
    age,
    pays_fuseau: strOrFallback(payload.pays_fuseau, "Non renseigne"),
    disponibilites: strOrFallback(payload.disponibilites, "Non renseigne"),
    micro_ok: isModeratorTrack ? asBoolean(payload.micro_ok) : defaultsForSupport.micro_ok,
    vocal_reunion: isModeratorTrack ? payload.vocal_reunion : defaultsForSupport.vocal_reunion,
    role_postule: role,
    experience_modo: experienceModo,
    experience_details: isNonEmptyString(payload?.experience_details) ? payload.experience_details.trim() : undefined,
    experience_similaire: isNonEmptyString(payload?.experience_similaire) ? payload.experience_similaire.trim() : undefined,
    pourquoi_tenf: strOrFallback(payload.pourquoi_tenf, "Non renseigne"),
    pourquoi_role: strOrFallback(payload.pourquoi_role, "Non renseigne"),
    motivation_560: strOrFallback(payload.motivation_560, "Non renseigne"),
    niveau_discord: niveauDiscord as 1 | 2 | 3 | 4 | 5,
    principes_proportionnalite: isModeratorTrack ? asBoolean(payload.principes_proportionnalite) : defaultsForSupport.principes_proportionnalite,
    principes_proportionnalite_explication: isModeratorTrack
      ? strOrFallback(payload.principes_proportionnalite_explication, defaultsForSupport.principes_proportionnalite_explication)
      : defaultsForSupport.principes_proportionnalite_explication,
    difference_sanctions: isModeratorTrack ? asBoolean(payload.difference_sanctions) : defaultsForSupport.difference_sanctions,
    difference_sanctions_exemple: isModeratorTrack
      ? strOrFallback(payload.difference_sanctions_exemple, defaultsForSupport.difference_sanctions_exemple)
      : defaultsForSupport.difference_sanctions_exemple,
    redaction_cr: isModeratorTrack ? asBoolean(payload.redaction_cr) : defaultsForSupport.redaction_cr,
    scenario_critique_staff: isModeratorTrack ? strOrFallback(payload.scenario_critique_staff, defaultsForSupport.scenario_critique_staff) : defaultsForSupport.scenario_critique_staff,
    scenario_clash_vocal: isModeratorTrack ? strOrFallback(payload.scenario_clash_vocal, defaultsForSupport.scenario_clash_vocal) : defaultsForSupport.scenario_clash_vocal,
    scenario_dm_grave: isModeratorTrack ? strOrFallback(payload.scenario_dm_grave, defaultsForSupport.scenario_dm_grave) : defaultsForSupport.scenario_dm_grave,
    scenario_spam_promo: isModeratorTrack ? strOrFallback(payload.scenario_spam_promo, defaultsForSupport.scenario_spam_promo) : defaultsForSupport.scenario_spam_promo,
    scenario_modo_sec: isModeratorTrack ? strOrFallback(payload.scenario_modo_sec, defaultsForSupport.scenario_modo_sec) : defaultsForSupport.scenario_modo_sec,
    scenario_manipulation: isModeratorTrack ? strOrFallback(payload.scenario_manipulation, defaultsForSupport.scenario_manipulation) : defaultsForSupport.scenario_manipulation,
    scenario_intrusif_vocal: isModeratorTrack ? strOrFallback(payload.scenario_intrusif_vocal, defaultsForSupport.scenario_intrusif_vocal) : defaultsForSupport.scenario_intrusif_vocal,
    style_communication: styleCommunication,
    style_communication_autre: isNonEmptyString(payload?.style_communication_autre)
      ? payload.style_communication_autre.trim()
      : undefined,
    contradiction: isModeratorTrack ? strOrFallback(payload.contradiction, defaultsForSupport.contradiction) : defaultsForSupport.contradiction,
    quand_jai_tort: isModeratorTrack ? strOrFallback(payload.quand_jai_tort, defaultsForSupport.quand_jai_tort) : defaultsForSupport.quand_jai_tort,
    limites_declencheurs: isModeratorTrack ? strOrFallback(payload.limites_declencheurs, defaultsForSupport.limites_declencheurs) : defaultsForSupport.limites_declencheurs,
    prise_de_recul: isModeratorTrack ? strOrFallback(payload.prise_de_recul, defaultsForSupport.prise_de_recul) : defaultsForSupport.prise_de_recul,
    energie_mentale: energieMentale as 1 | 2 | 3 | 4 | 5,
    periode_impact: (isModeratorTrack ? payload.periode_impact : defaultsForSupport.periode_impact),
    periode_gestion: isNonEmptyString(payload?.periode_gestion) ? payload.periode_gestion.trim() : undefined,
    reaction_stress: reactionStress,
    reaction_stress_autre: isNonEmptyString(payload?.reaction_stress_autre)
      ? payload.reaction_stress_autre.trim()
      : undefined,
    preference_cadre: isModeratorTrack
      ? ["cadre", "humain", "mix"].includes(payload?.preference_cadre)
        ? payload.preference_cadre
        : "mix"
      : defaultsForSupport.preference_cadre,
    preference_cadre_detail: isNonEmptyString(payload?.preference_cadre_detail)
      ? payload.preference_cadre_detail.trim()
      : undefined,
    passer_relais: isModeratorTrack ? asBoolean(payload.passer_relais) : defaultsForSupport.passer_relais,
    passer_relais_exemple: isModeratorTrack ? strOrFallback(payload.passer_relais_exemple, defaultsForSupport.passer_relais_exemple) : defaultsForSupport.passer_relais_exemple,
    desaccord_staff: isModeratorTrack ? strOrFallback(payload.desaccord_staff, defaultsForSupport.desaccord_staff) : defaultsForSupport.desaccord_staff,
    accepte_pause_retrait: isModeratorTrack ? asBoolean(payload.accepte_pause_retrait) : defaultsForSupport.accepte_pause_retrait,
    accepte_pause_retrait_pourquoi: isModeratorTrack ? strOrFallback(payload.accepte_pause_retrait_pourquoi, defaultsForSupport.accepte_pause_retrait_pourquoi) : defaultsForSupport.accepte_pause_retrait_pourquoi,
    accepte_confidentialite: asBoolean(payload.accepte_confidentialite),
    ami_demande_infos: isModeratorTrack ? strOrFallback(payload.ami_demande_infos, defaultsForSupport.ami_demande_infos) : defaultsForSupport.ami_demande_infos,
    accepte_documenter: isModeratorTrack ? asBoolean(payload.accepte_documenter) : defaultsForSupport.accepte_documenter,
    engagement_hebdo: engagementHebdo,
    engagement_hebdo_variable: isNonEmptyString(payload?.engagement_hebdo_variable)
      ? payload.engagement_hebdo_variable.trim()
      : undefined,
    poles_interet: payload.poles_interet,
    objectif_apprentissage: strOrFallback(payload.objectif_apprentissage, "Non renseigne"),
    consentement_traitement: asBoolean(payload.consentement_traitement),
    comprend_entretien: asBoolean(payload.comprend_entretien),
    commentaire_libre: isNonEmptyString(payload?.commentaire_libre) ? payload.commentaire_libre.trim() : undefined,
  };

  return { ok: true, answers };
}

export async function GET() {
  try {
    const admin = await requireAdvancedAdminAccess();
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
    const user = await requireUser();
    const discordId = user?.discordId;
    const discordUsername = user?.username;
    const discordAvatar = user?.avatar;

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
    const admin = await requireAdvancedAdminAccess();
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
