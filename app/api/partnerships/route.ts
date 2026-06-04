import { NextRequest, NextResponse } from "next/server";
import { requirePrivacyConsent } from "@/lib/legal/privacyConsent";
import { checkRateLimit } from "@/lib/security/rateLimit";
import {
  createPartnershipRequest,
  PARTNERSHIP_TYPES,
  PARTNERSHIP_DURATIONS,
  type PartnershipType,
  type DesiredDuration,
} from "@/lib/partnershipRequestsStorage";

export const dynamic = "force-dynamic";

/**
 * POST /api/partnerships
 * ──────────────────────
 * Création publique d'une demande de partenariat depuis la modale 3 étapes
 * de la page /partenariats. Le visiteur n'est jamais authentifié et n'a aucun
 * accès en lecture aux demandes ; voir la migration 0051 pour les RLS.
 *
 * Sécurité :
 *  - rate-limit IP : 3 demandes / 30 min
 *  - rate-limit identité (projet) : 4 demandes / 24h
 *  - honeypot anti-bot (`website`)
 *  - validation stricte de tous les champs obligatoires + bornes de longueur
 *  - les flags admin (status) sont posés serveur-side, jamais lus du body
 */

const IP_POLICY = {
  name: "public-partnership-ip",
  limit: 3,
  windowSeconds: 30 * 60,
} as const;

const IDENTITY_POLICY = {
  name: "public-partnership-identity",
  limit: 4,
  windowSeconds: 24 * 60 * 60,
} as const;

const TYPE_SET = new Set<string>(PARTNERSHIP_TYPES);
const DURATION_SET = new Set<string>(PARTNERSHIP_DURATIONS);

const LIMITS = {
  projectName: { min: 2, max: 160 },
  projectDescription: { min: 40, max: 2000 },
  contactName: { min: 2, max: 120 },
  contactEmail: { min: 5, max: 200 },
  freeText: { min: 0, max: 200 },
  goalText: { min: 20, max: 2000 },
  url: { min: 0, max: 300 },
  longUrlList: { min: 0, max: 500 },
  additional: { min: 0, max: 3000 },
} as const;

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asBool(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

function safeUrl(value: unknown, max = LIMITS.url.max): string | null {
  const raw = asString(value).slice(0, max);
  if (!raw) return null;
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (!/^https?:$/.test(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function safeEmail(value: unknown): string {
  const raw = asString(value);
  if (raw.length < LIMITS.contactEmail.min || raw.length > LIMITS.contactEmail.max) return "";
  // Validation minimaliste : un @ entouré, un point dans la partie domaine.
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(raw)) return "";
  return raw.toLowerCase();
}

function clampOptionalText(value: unknown, max: number): string | null {
  const raw = asString(value);
  if (!raw) return null;
  return raw.slice(0, max);
}

type ValidationFailure = { error: string; field?: string };

function validateAndNormalize(body: Record<string, unknown>):
  | { ok: true; data: Parameters<typeof createPartnershipRequest>[0] }
  | { ok: false; failure: ValidationFailure } {
  const projectName = asString(body.projectName);
  if (projectName.length < LIMITS.projectName.min || projectName.length > LIMITS.projectName.max) {
    return {
      ok: false,
      failure: { error: "Le nom du projet est obligatoire (2 à 160 caractères).", field: "projectName" },
    };
  }

  const rawType = asString(body.partnershipType).toLowerCase();
  if (!TYPE_SET.has(rawType)) {
    return {
      ok: false,
      failure: { error: "Type de partenariat invalide.", field: "partnershipType" },
    };
  }
  const partnershipType = rawType as PartnershipType;

  const projectDescription = asString(body.projectDescription);
  if (
    projectDescription.length < LIMITS.projectDescription.min ||
    projectDescription.length > LIMITS.projectDescription.max
  ) {
    return {
      ok: false,
      failure: {
        error: `La description du projet doit faire entre ${LIMITS.projectDescription.min} et ${LIMITS.projectDescription.max} caractères.`,
        field: "projectDescription",
      },
    };
  }

  const contactName = asString(body.contactName);
  if (contactName.length < LIMITS.contactName.min || contactName.length > LIMITS.contactName.max) {
    return {
      ok: false,
      failure: { error: "Le nom du responsable principal est obligatoire.", field: "contactName" },
    };
  }

  const contactEmail = safeEmail(body.contactEmail);
  if (!contactEmail) {
    return {
      ok: false,
      failure: { error: "Adresse e-mail invalide.", field: "contactEmail" },
    };
  }

  const partnershipGoal = asString(body.partnershipGoal);
  if (partnershipGoal.length < LIMITS.goalText.min || partnershipGoal.length > LIMITS.goalText.max) {
    return {
      ok: false,
      failure: { error: `L'objectif du partenariat doit faire au moins ${LIMITS.goalText.min} caractères.`, field: "partnershipGoal" },
    };
  }

  const partnerOffers = asString(body.partnerOffers);
  if (partnerOffers.length < LIMITS.goalText.min || partnerOffers.length > LIMITS.goalText.max) {
    return {
      ok: false,
      failure: { error: `Décris ce que le partenaire propose (au moins ${LIMITS.goalText.min} caractères).`, field: "partnerOffers" },
    };
  }

  const partnerExpectations = asString(body.partnerExpectations);
  if (
    partnerExpectations.length < LIMITS.goalText.min ||
    partnerExpectations.length > LIMITS.goalText.max
  ) {
    return {
      ok: false,
      failure: {
        error: `Décris ce que le partenaire attend (au moins ${LIMITS.goalText.min} caractères).`,
        field: "partnerExpectations",
      },
    };
  }

  // Consentements cadre & sécurité (5 cases Oui/Non obligatoires)
  const independenceAccepted = asBool(body.independenceAccepted);
  const noRecruitmentAccepted = asBool(body.noRecruitmentAccepted);
  const confidentialityAccepted = asBool(body.confidentialityAccepted);
  const observationAccepted = asBool(body.observationAccepted);
  const interruptionAccepted = asBool(body.interruptionAccepted);
  if (
    !independenceAccepted ||
    !noRecruitmentAccepted ||
    !confidentialityAccepted ||
    !observationAccepted ||
    !interruptionAccepted
  ) {
    return {
      ok: false,
      failure: {
        error: "Tous les engagements du cadre TENF doivent être acceptés (5 cases sur Oui).",
        field: "frameworkAcceptance",
      },
    };
  }

  // Consentement final
  const representativeConfirmed = asBool(body.representativeConfirmed);
  const dataUsageAccepted = asBool(body.dataUsageAccepted);
  if (!representativeConfirmed || !dataUsageAccepted) {
    return {
      ok: false,
      failure: {
        error: "Les deux cases du consentement final sont obligatoires.",
        field: "finalConsent",
      },
    };
  }

  // Durée souhaitée — optionnelle mais doit être valide si renseignée
  const rawDuration = asString(body.desiredDuration).toLowerCase();
  let desiredDuration: DesiredDuration = null;
  if (rawDuration) {
    if (!DURATION_SET.has(rawDuration)) {
      return {
        ok: false,
        failure: { error: "Durée souhaitée invalide.", field: "desiredDuration" },
      };
    }
    desiredDuration = rawDuration as DesiredDuration;
  }

  const discordLink = safeUrl(body.discordLink);
  const twitchLink = safeUrl(body.twitchLink);
  const websiteLink = safeUrl(body.websiteLink);
  const socialLinks = clampOptionalText(body.socialLinks, LIMITS.longUrlList.max);
  const contactRole = clampOptionalText(body.contactRole, LIMITS.freeText.max);
  const contactDiscord = clampOptionalText(body.contactDiscord, LIMITS.freeText.max);
  const otherContact = clampOptionalText(body.otherContact, LIMITS.freeText.max);
  const desiredDate = clampOptionalText(body.desiredDate, LIMITS.freeText.max);
  const targetAudience = clampOptionalText(body.targetAudience, LIMITS.freeText.max);
  const estimatedMembers = clampOptionalText(body.estimatedMembers, LIMITS.freeText.max);
  const additionalMessage = clampOptionalText(body.additionalMessage, LIMITS.additional.max);

  return {
    ok: true,
    data: {
      projectName,
      partnershipType,
      projectDescription,
      discordLink,
      twitchLink,
      websiteLink,
      socialLinks,
      contactName,
      contactRole,
      contactEmail,
      contactDiscord,
      otherContact,
      partnershipGoal,
      partnerOffers,
      partnerExpectations,
      desiredDuration,
      desiredDate,
      targetAudience,
      estimatedMembers,
      independenceAccepted,
      noRecruitmentAccepted,
      confidentialityAccepted,
      observationAccepted,
      interruptionAccepted,
      additionalMessage,
      representativeConfirmed,
      dataUsageAccepted,
    },
  };
}

function getRequestIp(request: NextRequest): string | null {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || null;
  return request.headers.get("x-real-ip") || request.ip || null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }
    const dict = body as Record<string, unknown>;

    const consentCheck = requirePrivacyConsent(dict);
    if (!consentCheck.ok) {
      return NextResponse.json({ error: consentCheck.error }, { status: 400 });
    }

    // Honeypot anti-bot : si le champ caché est rempli, on simule un succès
    // sans rien stocker — les bots ne savent pas qu'ils ont été détectés.
    if (typeof dict.website === "string" && dict.website.trim().length > 0) {
      return NextResponse.json({ ok: true, simulated: true }, { status: 200 });
    }

    const validated = validateAndNormalize(dict);
    if (!validated.ok) {
      return NextResponse.json(
        { error: validated.failure.error, field: validated.failure.field },
        { status: 400 }
      );
    }

    // Rate limit IP
    const ipLimit = await checkRateLimit({ request, policy: IP_POLICY });
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessaie dans quelques minutes." },
        {
          status: 429,
          headers: { "Retry-After": String(ipLimit.retryAfterSeconds) },
        }
      );
    }

    // Rate limit identité (par nom de projet) — bloque le spam d'un même projet
    const identityLimit = await checkRateLimit({
      request,
      policy: IDENTITY_POLICY,
      identity: validated.data.projectName.toLowerCase(),
    });
    if (!identityLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de demandes reçues pour ce projet. Réessaie plus tard." },
        {
          status: 429,
          headers: { "Retry-After": String(identityLimit.retryAfterSeconds) },
        }
      );
    }

    const ip = getRequestIp(request);
    const userAgent = request.headers.get("user-agent");

    const created = await createPartnershipRequest({
      ...validated.data,
      submittedIp: ip,
      submittedUserAgent: userAgent ? userAgent.slice(0, 500) : null,
    });

    return NextResponse.json({
      ok: true,
      id: created.id,
      message: "Demande envoyée. L'équipe TENF l'étudiera et reviendra vers toi si le projet correspond aux valeurs et au cadre de la communauté.",
    });
  } catch (error) {
    console.error("[partnerships] POST error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'envoi de la demande." },
      { status: 500 }
    );
  }
}
