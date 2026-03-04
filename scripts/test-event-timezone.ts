import { formatEventDateTimeInTimezone, parisLocalDateTimeToUtcIso } from "../lib/timezone";

function assertEqual(actual: string, expected: string, label: string) {
  if (actual !== expected) {
    throw new Error(`[${label}] attendu=${expected}, reçu=${actual}`);
  }
  console.log(`✅ ${label}: ${actual}`);
}

function run() {
  // Été (CEST UTC+2): Paris 21:00 -> Toronto 15:00
  const summerUtc = parisLocalDateTimeToUtcIso("2026-07-15T21:00");
  const summerToronto = formatEventDateTimeInTimezone(summerUtc, "America/Toronto");
  assertEqual(summerToronto.timeLabel, "15:00", "Été Paris->Toronto");

  // Hiver (CET UTC+1): Paris 21:00 -> Toronto 15:00
  const winterUtc = parisLocalDateTimeToUtcIso("2026-01-15T21:00");
  const winterToronto = formatEventDateTimeInTimezone(winterUtc, "America/Toronto");
  assertEqual(winterToronto.timeLabel, "15:00", "Hiver Paris->Toronto");

  // Vérification France: Paris 21:00 reste 21:00
  const parisDisplay = formatEventDateTimeInTimezone(winterUtc, "Europe/Paris");
  assertEqual(parisDisplay.timeLabel, "21:00", "Affichage Paris");
}

run();

