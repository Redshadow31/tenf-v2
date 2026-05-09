/**
 * Lecture des entrées vocales Discord (stockage imports) et format durée côté membres.
 */

export function coerceFiniteNumber(u: unknown): number | null {
  if (typeof u === "number" && Number.isFinite(u)) return u;
  if (typeof u === "string") {
    const n = Number(u.replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Parse les libellés type import TENF ("12h30", "5h05") ou "HH:MM" minutes cumulées. */
export function parseDisplayToMinutes(display: unknown): number | null {
  if (typeof display !== "string") return null;
  const s = display.trim().toLowerCase().replace(/\s/g, "");
  let m = s.match(/^(\d+)h(\d{1,2})$/);
  if (m) {
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (min >= 0 && min < 60 && h >= 0) return h * 60 + min;
  }
  m = s.match(/^(\d+)h$/);
  if (m) {
    const h = parseInt(m[1], 10);
    if (h >= 0) return h * 60;
  }
  m = s.match(/^(\d{1,4}):(\d{2})$/);
  if (m) {
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (min >= 0 && min < 60 && h >= 0 && h < 10000) return h * 60 + min;
  }
  return null;
}

/**
 * Déduit les minutes à partir de totalMinutes, hoursDecimal ou display (chaînes JSON tolérées).
 * Si totalMinutes et hoursDecimal divergent, on fait confiance aux heures décimales (source CSV).
 */
export function vocalEntryToMinutes(v: unknown): number {
  if (v == null || typeof v !== "object") return 0;
  const o = v as Record<string, unknown>;
  const tmRaw = coerceFiniteNumber(o.totalMinutes);
  const tmRounded = tmRaw !== null && tmRaw >= 0 ? Math.round(tmRaw) : null;
  const hd = coerceFiniteNumber(o.hoursDecimal);
  const fromHd = hd !== null && hd >= 0 ? Math.round(hd * 60) : null;
  const fromDisplay = parseDisplayToMinutes(o.display);

  if (tmRounded !== null && tmRounded > 0 && fromHd !== null && fromHd > 0) {
    if (Math.abs(tmRounded - fromHd) <= 2) return tmRounded;
    return fromHd;
  }
  if (tmRounded !== null && tmRounded > 0) return tmRounded;
  if (fromHd !== null && fromHd > 0) return fromHd;
  if (fromDisplay !== null && fromDisplay > 0) return fromDisplay;
  if (tmRounded !== null) return tmRounded;
  if (fromHd !== null) return fromHd;
  return 0;
}

/** Affichage lisible : pas d'ambiguïté avec une heure décimale. */
export function formatVocalDurationFr(totalMinutes: number): string {
  const safe = Number.isFinite(totalMinutes) ? Math.max(0, Math.round(totalMinutes)) : 0;
  const h = Math.floor(safe / 60);
  const min = safe % 60;
  if (safe === 0) return "0 min";
  if (h === 0) return `${min} min`;
  if (min === 0) return `${h} h`;
  return `${h} h ${min.toString().padStart(2, "0")} min`;
}
