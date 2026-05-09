/**
 * Agrégation des stats « par salon » : fusion des noms équivalents et bucket staff anonymisé.
 */

export function normalizeDiscordSalonName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^#+/u, "")
    .replace(/\s+/gu, " ")
    .trim();
}

/**
 * Salon vocal/texte « live pseudo » : reste public (pas staff automatique).
 * Ex. live-pseudo, live_pseudo, live pseudo (pas livestream, liverpool…).
 */
export function isDiscordLivePseudoSalonNormalized(normalizedName: string): boolean {
  const n = normalizedName.trim().toLowerCase();
  // live seul, live-pseudo, live_pseudo, live pseudo… — pas livestream (pas de séparateur après live).
  return /^live(?:$|[-_\s])/u.test(n);
}

/**
 * Heuristique ticket / staff : @ferme-pseudo, fermé-pseudo, préfixe ticket…, ou un # restant dans le nom.
 */
export function isDiscordTicketStaffSalonNormalized(normalizedName: string): boolean {
  const n = normalizedName.trim().toLowerCase();
  if (!n) return false;
  if (/^@ferm[eé]/u.test(n)) return true;
  if (/^ferm[eé][-_]/u.test(n)) return true;
  if (/^ticket(?:[-_\s]|$)/u.test(n)) return true;
  if (n.includes("#")) return true;
  return false;
}

/** Staff auto dans l’import modal : tickets oui, salons live-pseudo non. */
export function shouldAutoStaffDiscordSalonNormalized(normalizedName: string): boolean {
  if (isDiscordLivePseudoSalonNormalized(normalizedName)) return false;
  return isDiscordTicketStaffSalonNormalized(normalizedName);
}

/** Fusionne les clés dont le nom normalisé est identique (somme des valeurs). */
export function mergeSalonsByNormalizedName(counts: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(counts)) {
    const key = normalizeDiscordSalonName(k);
    if (!key) continue;
    const n = typeof v === "number" && !Number.isNaN(v) ? v : 0;
    out[key] = (out[key] || 0) + n;
  }
  return out;
}

/**
 * Totaux sur salons importés : masse staff vs tout le périmètre salons (pour le % représentation).
 * Utilise motifs globaux + clés staff du mois ; indépendant du toggle d’affichage merge/public.
 */
export function salonChannelStaffTotals(
  raw: Record<string, number> | undefined,
  staffSubstrings: string[],
  extraStaffNormalizedKeys?: string[]
): { staff: number; total: number } {
  if (!raw || Object.keys(raw).length === 0) return { staff: 0, total: 0 };
  const merged = mergeSalonsByNormalizedName(raw);
  const extraSet =
    extraStaffNormalizedKeys && extraStaffNormalizedKeys.length > 0
      ? new Set(extraStaffNormalizedKeys.map((k) => normalizeDiscordSalonName(k)).filter(Boolean))
      : undefined;
  const { staffSum, publicSalons } = partitionStaffSalons(merged, staffSubstrings, extraSet);
  const publicSum = Object.values(publicSalons).reduce((s, n) => s + n, 0);
  return { staff: staffSum, total: staffSum + publicSum };
}

export function partitionStaffSalons(
  mergedByNormalizedName: Record<string, number>,
  staffSubstrings: string[],
  extraStaffNormalizedKeys?: Set<string>
): { staffSum: number; publicSalons: Record<string, number> } {
  const patterns = staffSubstrings.map((s) => normalizeDiscordSalonName(s)).filter(Boolean);
  const extra = extraStaffNormalizedKeys ?? new Set<string>();
  let staffSum = 0;
  const publicSalons: Record<string, number> = {};

  for (const [name, count] of Object.entries(mergedByNormalizedName)) {
    const isStaff =
      extra.has(name) || patterns.some((p) => name.includes(p));
    if (isStaff) staffSum += count;
    else publicSalons[name] = count;
  }

  return { staffSum, publicSalons };
}

export type SalonPublicRow = { label: string; value: number };

/** Une ligne du classement affiché : salon public ou masse staff agrégée. */
export type SalonRankRow =
  | { kind: "public"; label: string; value: number }
  | { kind: "staff"; label: string; value: number };

export type SalonSplitDisplay = {
  /** Salons publics les plus actifs (après fusion des noms identiques), sans tenir compte du staff. */
  publicTop: SalonPublicRow[];
  /** Total agrégé pour les salons matching staff — aucun nom de salon exposé. */
  staffAggregate: { label: string; value: number } | null;
  /** Classement unifié : public + espace staff mélangés par valeur, tronqué à `topPublic`. */
  rankedRows: SalonRankRow[];
};

function buildRankedRows(
  publicSalons: Record<string, number>,
  staffAggregate: { label: string; value: number } | null,
  topPublic: number
): SalonRankRow[] {
  const publicRows: SalonRankRow[] = Object.entries(publicSalons).map(([label, value]) => ({
    kind: "public" as const,
    label,
    value,
  }));
  const staffRows: SalonRankRow[] =
    staffAggregate && staffAggregate.value > 0
      ? [{ kind: "staff" as const, label: staffAggregate.label, value: staffAggregate.value }]
      : [];
  return [...publicRows, ...staffRows].sort((a, b) => b.value - a.value).slice(0, topPublic);
}

export function splitSalonsForDisplay(
  raw: Record<string, number> | undefined,
  staffSubstrings: string[],
  staffBucketLabel: string,
  options: {
    mergeStaff: boolean;
    topPublic: number;
    /** Clés normalisées marquées staff pour ce mois (import / réglages locaux). */
    extraStaffNormalizedKeys?: string[];
  }
): SalonSplitDisplay {
  if (!raw || Object.keys(raw).length === 0) {
    return { publicTop: [], staffAggregate: null, rankedRows: [] };
  }

  const merged = mergeSalonsByNormalizedName(raw);
  const extraSet =
    options.extraStaffNormalizedKeys && options.extraStaffNormalizedKeys.length > 0
      ? new Set(options.extraStaffNormalizedKeys.map((k) => normalizeDiscordSalonName(k)).filter(Boolean))
      : undefined;

  const effectivePatterns =
    options.mergeStaff && (staffSubstrings.length > 0 || (extraSet && extraSet.size > 0));

  if (!effectivePatterns) {
    const publicTop = Object.entries(merged)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, options.topPublic);
    const rankedRows: SalonRankRow[] = publicTop.map(({ label, value }) => ({
      kind: "public",
      label,
      value,
    }));
    return { publicTop, staffAggregate: null, rankedRows };
  }

  const { staffSum, publicSalons } = partitionStaffSalons(merged, staffSubstrings, extraSet);
  const publicTop = Object.entries(publicSalons)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, options.topPublic);

  const staffAggregate =
    staffSum > 0 ? { label: staffBucketLabel, value: staffSum } : null;

  const rankedRows = buildRankedRows(publicSalons, staffAggregate, options.topPublic);

  return { publicTop, staffAggregate, rankedRows };
}
