import fs from "fs";
import path from "path";

type LegacyAny = Record<string, unknown>;

type MemberStreamPlanning = {
  id: string;
  userId: string;
  twitchLogin: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  liveType: string;
  title?: string;
  createdAt: string;
  updatedAt?: string;
};

const MAX_LIVE_TYPE_LENGTH = 80;
const MAX_TITLE_LENGTH = 120;

function trimAndLimit(value: unknown, maxLength: number): string | undefined {
  const text = String(value ?? "").trim();
  if (!text) return undefined;
  return text.slice(0, maxLength);
}

function normalizeDate(input: unknown): string | null {
  const raw = String(input ?? "").trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizeTime(input: unknown): string | null {
  const raw = String(input ?? "").trim();
  if (!raw) return null;
  const hhmm = raw.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (hhmm) return raw;
  const withSeconds = raw.match(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/);
  if (withSeconds) return `${withSeconds[1]}:${withSeconds[2]}`;
  const parsed = new Date(`1970-01-01T${raw}`);
  if (!Number.isNaN(parsed.getTime())) {
    return `${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`;
  }
  return null;
}

function dateTimeMs(date: string, time: string): number {
  return new Date(`${date}T${time}:00`).getTime();
}

function toPlanning(raw: LegacyAny, index: number): MemberStreamPlanning | null {
  const userId = trimAndLimit(
    raw.userId ?? raw.discordId ?? raw.memberId ?? raw.memberDiscordId,
    80
  );
  const twitchLogin = trimAndLimit(
    raw.twitchLogin ?? raw.login ?? raw.twitch ?? raw.twitch_username ?? raw.username,
    80
  )?.toLowerCase();
  const date = normalizeDate(raw.date ?? raw.streamDate ?? raw.day);
  const time = normalizeTime(raw.time ?? raw.horaire ?? raw.hour ?? raw.startsAt);
  const liveType = trimAndLimit(
    raw.liveType ?? raw.typeLive ?? raw.streamType ?? raw.game ?? raw.category,
    MAX_LIVE_TYPE_LENGTH
  );
  const title = trimAndLimit(raw.title ?? raw.name ?? raw.streamTitle, MAX_TITLE_LENGTH);
  const createdAt = trimAndLimit(raw.createdAt ?? raw.updatedAt, 64) ?? new Date().toISOString();
  const updatedAt = trimAndLimit(raw.updatedAt, 64);
  const id =
    trimAndLimit(raw.id, 200) ??
    `member-planning-legacy-${Date.now()}-${String(index).padStart(4, "0")}`;

  if (!userId || !twitchLogin || !date || !time || !liveType) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) return null;
  if (Number.isNaN(dateTimeMs(date, time))) return null;

  return {
    id,
    userId,
    twitchLogin,
    date,
    time,
    liveType,
    title,
    createdAt,
    updatedAt,
  };
}

function normalizeInputShape(data: unknown): LegacyAny[] {
  if (Array.isArray(data)) return data.filter((entry) => entry && typeof entry === "object") as LegacyAny[];
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.items)) return normalizeInputShape(obj.items);
    if (Array.isArray(obj.plannings)) return normalizeInputShape(obj.plannings);
    return Object.values(obj).filter((entry) => entry && typeof entry === "object") as LegacyAny[];
  }
  return [];
}

function deduplicate(plannings: MemberStreamPlanning[]): MemberStreamPlanning[] {
  const map = new Map<string, MemberStreamPlanning>();
  for (const planning of plannings) {
    const key = `${planning.userId}|${planning.date}|${planning.time}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, planning);
      continue;
    }
    const existingTs = new Date(existing.updatedAt || existing.createdAt).getTime();
    const candidateTs = new Date(planning.updatedAt || planning.createdAt).getTime();
    if (candidateTs >= existingTs) map.set(key, planning);
  }
  return [...map.values()].sort((a, b) => dateTimeMs(a.date, a.time) - dateTimeMs(b.date, b.time));
}

function parseArgs(argv: string[]): {
  input: string;
  output: string;
  dryRun: boolean;
  inPlace: boolean;
} {
  const args = new Map<string, string | boolean>();
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }
    if (token === "--dry-run") {
      args.set("dryRun", true);
      continue;
    }
    if (token === "--in-place") {
      args.set("inPlace", true);
      continue;
    }
    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) continue;
    args.set(key, value);
    i += 1;
  }

  const input = String(args.get("input") || positional[0] || "").trim();
  const output = String(args.get("output") || positional[1] || "").trim();
  const dryRun = Boolean(args.get("dryRun"));
  const inPlace = Boolean(args.get("inPlace"));

  if (!input) {
    throw new Error(
      "Argument manquant: --input <chemin>. Exemple: npm run migration:member-plannings-legacy -- --input migration/exported-data/stream-plannings.json --output data/members/stream-plannings.json"
    );
  }

  const resolvedInput = path.resolve(process.cwd(), input);
  let resolvedOutput = output ? path.resolve(process.cwd(), output) : path.resolve(process.cwd(), "data/members/stream-plannings.migrated.json");
  if (inPlace) {
    resolvedOutput = resolvedInput;
  }

  return {
    input: resolvedInput,
    output: resolvedOutput,
    dryRun,
    inPlace,
  };
}

async function main() {
  const { input, output, dryRun, inPlace } = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(input)) {
    throw new Error(`Fichier introuvable: ${input}`);
  }

  const rawContent = fs.readFileSync(input, "utf-8");
  const rawJson = JSON.parse(rawContent);
  const sourceItems = normalizeInputShape(rawJson);

  const converted: MemberStreamPlanning[] = [];
  let invalidCount = 0;

  sourceItems.forEach((entry, index) => {
    const planning = toPlanning(entry, index);
    if (!planning) {
      invalidCount += 1;
      return;
    }
    converted.push(planning);
  });

  const deduped = deduplicate(converted);
  const convertedCount = deduped.length;
  const duplicateCount = converted.length - deduped.length;

  console.log("Migration plannings legacy");
  console.log(`- Source: ${input}`);
  console.log(`- Sortie: ${output}${inPlace ? " (in-place)" : ""}`);
  console.log(`- Entrees source: ${sourceItems.length}`);
  console.log(`- Entrees converties: ${convertedCount}`);
  console.log(`- Entrees invalides ignorees: ${invalidCount}`);
  console.log(`- Doublons supprimes: ${duplicateCount}`);

  if (dryRun) {
    console.log("- Mode dry-run: aucun fichier ecrit.");
    return;
  }

  const outputDir = path.dirname(output);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(output, `${JSON.stringify(deduped, null, 2)}\n`, "utf-8");
  console.log("- Ecriture terminee.");
}

main().catch((error) => {
  console.error("Erreur migration:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});

