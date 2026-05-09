"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  MessageSquare,
  Mic,
  Search,
  Shield,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import {
  mergeSalonsByNormalizedName,
  normalizeDiscordSalonName,
  shouldAutoStaffDiscordSalonNormalized,
  splitSalonsForDisplay,
} from "@/lib/discordActivityChannelsAggregate";
import DiscordStaffSalonClusterCard from "@/components/admin/DiscordStaffSalonClusterCard";

const SESSION_STORAGE_KEY = "tenf-discord-salon-import-staff-v1";

function readSessionStaff(): { messages: string[]; vocals: string[] } {
  if (typeof sessionStorage === "undefined") return { messages: [], vocals: [] };
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return { messages: [], vocals: [] };
    const j = JSON.parse(raw) as Record<string, unknown>;
    return {
      messages: Array.isArray(j.messages) ? j.messages.filter((x): x is string => typeof x === "string") : [],
      vocals: Array.isArray(j.vocals) ? j.vocals.filter((x): x is string => typeof x === "string") : [],
    };
  } catch {
    return { messages: [], vocals: [] };
  }
}

function writeSessionStaff(kind: "messages" | "vocals", keys: string[]) {
  if (typeof sessionStorage === "undefined") return;
  const s = readSessionStaff();
  const uniq = [...new Set(keys.map((k) => normalizeDiscordSalonName(k)).filter(Boolean))];
  if (kind === "messages") s.messages = uniq;
  else s.vocals = uniq;
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(s));
}

interface DiscordSalonsImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  kind: "messages" | "vocals";
  month: string;
  onImport: (payload: {
    data: Record<string, number>;
    replace: boolean;
    staffNormalizedKeys: string[];
  }) => Promise<void>;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function parseNumericValue(raw: string): number {
  const cleaned = raw.replace(/\s+/g, "").replace(",", ".");
  return Number.parseFloat(cleaned);
}

function looksLikeHeader(col0: string, col1: string): boolean {
  const a = col0.toLowerCase();
  const b = col1.toLowerCase();
  const salonLike = /salon|canal|channel|room|texte|vocal/.test(a);
  const metricLike = /message|msg|nombre|count|temps|heure|hour|min|durée|duree|minute/.test(b);
  return salonLike && metricLike;
}

function isDiscordChannelRankingHeader(columns: string[]): boolean {
  if (columns.length < 4) return false;
  const c0 = (columns[0] || "").toLowerCase().trim().replace(/^\ufeff/, "");
  const c1 = (columns[1] || "").toLowerCase().trim();
  const c3 = (columns[3] || "").toLowerCase().trim().replace(/\s/g, "");
  return (
    (c0 === "rang" || c0 === "rank") &&
    (c1 === "nom" || c1 === "name" || c1 === "channel") &&
    /^(compter|count|messages?)$/.test(c3)
  );
}

function isLikelyDiscordSnowflake(s: string): boolean {
  const t = s.replace(/\s/g, "");
  return /^\d{17,22}$/.test(t);
}

function parseSalonFileContent(content: string, kind: "messages" | "vocals"): Record<string, number> {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const out: Record<string, number> = {};

  for (const line of lines) {
    const hasTab = line.includes("\t");
    const hasComma = line.includes(",") && !hasTab;
    const columns = hasComma
      ? parseCsvLine(line).map((col) => col.trim())
      : hasTab
        ? line.split("\t").map((col) => col.trim())
        : line.split(/\s+/).filter((col) => col.trim().length > 0);

    if (columns.length < 2) continue;

    const col0 = columns[0] || "";
    const col1 = columns[1] || "";
    if (isDiscordChannelRankingHeader(columns)) continue;
    if (looksLikeHeader(col0, col1)) continue;

    let salonRaw = col0;
    let valueRaw = col1;

    if (columns.length >= 4) {
      const idCol = columns[2]?.trim() ?? "";
      const metricCol = columns[columns.length - 1]?.trim() ?? "";
      if (isLikelyDiscordSnowflake(idCol) && Number.isFinite(parseNumericValue(metricCol))) {
        salonRaw = columns[1] || "";
        valueRaw = metricCol;
      }
    }

    if (columns.length === 3 && !isLikelyDiscordSnowflake(columns[1] || "")) {
      const rankMaybe = columns[0]?.trim();
      if (!Number.isNaN(Number.parseInt(rankMaybe || "", 10)) && rankMaybe !== "") {
        salonRaw = columns[1] || "";
        valueRaw = columns[2] || "";
      }
    }

    const salon = salonRaw.replace(/^#+/u, "").trim();
    if (!salon) continue;

    const n = parseNumericValue(valueRaw || "0");
    if (!Number.isFinite(n) || n < 0) continue;

    const contribution = kind === "vocals" ? Math.round(n * 60) : Math.round(n);

    out[salon] = (out[salon] || 0) + contribution;
  }

  return out;
}

function formatMinutesFr(totalMinutes: number): string {
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  return `${hh}h${mm.toString().padStart(2, "0")}`;
}

function formatMonthFr(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return format(new Date(y, m - 1, 1), "MMMM yyyy", { locale: fr });
}

type MonthSalonCtx = {
  staffNameSubstrings: string[];
  staffBucketLabel: string;
  salonStaffNormalizedKeysMessages: string[];
  salonStaffNormalizedKeysVocals: string[];
};

const STEPS = [
  { id: 1 as const, label: "Ta donnée", sub: "Coller ou glisser un fichier" },
  { id: 2 as const, label: "Protéger le staff", sub: "Ce qui reste public pour les membres" },
  { id: 3 as const, label: "Valider", sub: "Aperçu avant enregistrement" },
];

export default function DiscordSalonsImportModal({
  isOpen,
  onClose,
  kind,
  month,
  onImport,
}: DiscordSalonsImportModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [stateText, setStateText] = useState("");
  const [replace, setReplace] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedRaw, setParsedRaw] = useState<Record<string, number> | null>(null);
  const [staffKeysSel, setStaffKeysSel] = useState<string[]>([]);
  const [monthCtx, setMonthCtx] = useState<MonthSalonCtx | null>(null);
  const [ctxLoading, setCtxLoading] = useState(false);
  const [filterQ, setFilterQ] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const step2InitDone = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mergedMap = useMemo(
    () => (parsedRaw ? mergeSalonsByNormalizedName(parsedRaw) : {}),
    [parsedRaw]
  );

  const mergedRows = useMemo(() => {
    return Object.entries(mergedMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [mergedMap]);

  const maxRowVal = useMemo(() => Math.max(1, ...mergedRows.map((r) => r.value)), [mergedRows]);

  const filteredRows = useMemo(() => {
    const q = filterQ.trim().toLowerCase();
    if (!q) return mergedRows;
    return mergedRows.filter((r) => r.label.includes(q));
  }, [mergedRows, filterQ]);

  const staffSelSet = useMemo(() => new Set(staffKeysSel), [staffKeysSel]);

  const resetModal = useCallback(() => {
    setStep(1);
    setStateText("");
    setReplace(false);
    setError(null);
    setParsedRaw(null);
    setStaffKeysSel([]);
    setMonthCtx(null);
    setCtxLoading(false);
    setFilterQ("");
    setDragOver(false);
    step2InitDone.current = false;
  }, []);

  useEffect(() => {
    if (!isOpen) resetModal();
  }, [isOpen, resetModal]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || step !== 2 || !parsedRaw) return;
    let cancelled = false;
    setCtxLoading(true);
    void (async () => {
      try {
        const res = await fetch(
          `/api/admin/discord-activity/month-salons?month=${encodeURIComponent(month)}`,
          { cache: "no-store" }
        );
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setMonthCtx({
            staffNameSubstrings: [],
            staffBucketLabel: "Espace staff (hors capture publique)",
            salonStaffNormalizedKeysMessages: [],
            salonStaffNormalizedKeysVocals: [],
          });
          return;
        }
        setMonthCtx({
          staffNameSubstrings: json.staffNameSubstrings || [],
          staffBucketLabel: json.staffBucketLabel || "Espace staff (hors capture publique)",
          salonStaffNormalizedKeysMessages: json.salonStaffNormalizedKeysMessages || [],
          salonStaffNormalizedKeysVocals: json.salonStaffNormalizedKeysVocals || [],
        });
      } finally {
        if (!cancelled) setCtxLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, step, month, parsedRaw]);

  useEffect(() => {
    if (step !== 2 || !parsedRaw || !monthCtx || step2InitDone.current) return;
    step2InitDone.current = true;
    const keys = Object.keys(mergedMap);
    const patterns = monthCtx.staffNameSubstrings.map((s) => normalizeDiscordSalonName(s)).filter(Boolean);
    const serverStaff =
      kind === "messages"
        ? monthCtx.salonStaffNormalizedKeysMessages
        : monthCtx.salonStaffNormalizedKeysVocals;
    const sess = readSessionStaff()[kind === "messages" ? "messages" : "vocals"];
    const sel = new Set<string>();
    for (const k of keys) {
      if (patterns.some((p) => p && k.includes(p))) sel.add(k);
      if (shouldAutoStaffDiscordSalonNormalized(k)) sel.add(k);
    }
    for (const s of serverStaff) {
      const nk = normalizeDiscordSalonName(s);
      if (keys.includes(nk)) sel.add(nk);
    }
    const staffFromOtherKind =
      kind === "messages"
        ? monthCtx.salonStaffNormalizedKeysVocals
        : monthCtx.salonStaffNormalizedKeysMessages;
    for (const s of staffFromOtherKind) {
      const nk = normalizeDiscordSalonName(s);
      if (keys.includes(nk)) sel.add(nk);
    }
    for (const s of sess) {
      const nk = normalizeDiscordSalonName(s);
      if (keys.includes(nk)) sel.add(nk);
    }
    setStaffKeysSel([...sel]);
  }, [step, parsedRaw, monthCtx, mergedMap, kind]);

  const toggleStaffKey = (normalizedKey: string) => {
    setStaffKeysSel((prev) => {
      const set = new Set(prev);
      if (set.has(normalizedKey)) set.delete(normalizedKey);
      else set.add(normalizedKey);
      return [...set];
    });
  };

  const applyPatternSuggestionsOnly = () => {
    if (!monthCtx) return;
    const keys = Object.keys(mergedMap);
    const patterns = monthCtx.staffNameSubstrings.map((s) => normalizeDiscordSalonName(s)).filter(Boolean);
    setStaffKeysSel(
      keys.filter(
        (k) => patterns.some((p) => p && k.includes(p)) || shouldAutoStaffDiscordSalonNormalized(k)
      )
    );
  };

  const applySessionPrevious = () => {
    const keys = Object.keys(mergedMap);
    const sess = readSessionStaff()[kind === "messages" ? "messages" : "vocals"];
    const sel = new Set(staffKeysSel);
    for (const s of sess) {
      const nk = normalizeDiscordSalonName(s);
      if (keys.includes(nk)) sel.add(nk);
    }
    setStaffKeysSel([...sel]);
  };

  const clearAllStaff = () => setStaffKeysSel([]);

  const previewSplit = useMemo(() => {
    if (!parsedRaw || !monthCtx) return null;
    return splitSalonsForDisplay(
      parsedRaw,
      monthCtx.staffNameSubstrings,
      monthCtx.staffBucketLabel,
      {
        mergeStaff: true,
        topPublic: 12,
        extraStaffNormalizedKeys: staffKeysSel,
      }
    );
  }, [parsedRaw, monthCtx, staffKeysSel]);

  const goAnalyzeStep2 = () => {
    setError(null);
    const data = parseSalonFileContent(stateText, kind);
    if (Object.keys(data).length === 0) {
      setError("Aucune ligne reconnue. Essaie un CSV Discord (rang,nom,id,compter) ou nom + valeur séparés par une tabulation.");
      return;
    }
    step2InitDone.current = false;
    setParsedRaw(data);
    setStaffKeysSel([]);
    setMonthCtx(null);
    setFilterQ("");
    setStep(2);
  };

  const handleFinalize = async () => {
    if (!parsedRaw) return;
    setError(null);
    setImporting(true);
    try {
      const keysInMap = new Set(Object.keys(mergedMap));
      const staffNormalizedKeys = staffKeysSel.filter((k) => keysInMap.has(k));
      await onImport({ data: parsedRaw, replace, staffNormalizedKeys });
      writeSessionStaff(kind, staffNormalizedKeys);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur d’import");
    } finally {
      setImporting(false);
    }
  };

  const handleFileText = (t: string) => {
    setStateText(t);
    setError(null);
  };

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const t = await file.text();
    handleFileText(t);
    e.target.value = "";
  };

  const onDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    const t = await f.text();
    handleFileText(t);
  };

  const quickParseCheck = useMemo(() => {
    if (!stateText.trim()) return null as { ok: boolean; count: number } | null;
    const data = parseSalonFileContent(stateText, kind);
    const n = Object.keys(data).length;
    return { ok: n > 0, count: n };
  }, [stateText, kind]);

  const handleBack = () => {
    if (step === 1) onClose();
    else if (step === 2) {
      step2InitDone.current = false;
      setStep(1);
    } else setStep(2);
  };

  const handleNext = () => {
    if (step === 1) goAnalyzeStep2();
    else if (step === 2 && monthCtx && !ctxLoading) setStep(3);
  };

  if (!isOpen) return null;

  const sumParsed = parsedRaw ? Object.values(parsedRaw).reduce((s, v) => s + v, 0) : 0;
  const accent = kind === "messages" ? "from-[#5865F2] to-indigo-600" : "from-violet-500 to-fuchsia-600";
  const Icon = kind === "messages" ? MessageSquare : Mic;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-3 backdrop-blur-md sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[1.75rem] border border-white/[0.12] bg-gradient-to-b from-[#141824] via-[#10131c] to-[#0a0c12] shadow-[0_25px_80px_-15px_rgba(0,0,0,0.85)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
        aria-labelledby="salon-import-title"
      >
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent} opacity-90`}
          aria-hidden
        />

        <div className="relative flex items-start justify-between gap-4 border-b border-white/[0.06] px-6 py-5 pr-14">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} shadow-lg`}
            >
              <Icon className="h-7 w-7 text-white" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#b4b9ff]/90">
                <Heart className="h-3.5 w-3.5 text-pink-300/80" aria-hidden />
                Pour une communauté TENF plus lisible
              </p>
              <h2 id="salon-import-title" className="mt-1 text-xl font-bold tracking-tight text-white md:text-2xl">
                {kind === "messages" ? "Salons les plus actifs (écrit)" : "Salons vocal les plus présents"}
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Période :{" "}
                <span className="font-semibold capitalize text-gray-200">{formatMonthFr(month)}</span>
                <span className="mx-2 text-gray-600">·</span>
                <span className="text-gray-500">
                  {kind === "vocals"
                    ? "Les durées sont en heures décimales (ex. 1,5 = 1h30)."
                    : "Les nombres = messages par salon sur la période."}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-gray-400 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="border-b border-white/[0.05] bg-black/20 px-6 py-4">
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-black/40">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${accent} transition-all duration-500 ease-out`}
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
          <div className="flex justify-between gap-2" role="list" aria-label="Progression de l'import">
            {STEPS.map((s) => {
              const active = step === s.id;
              const done = step > s.id;
              return (
                <div
                  key={s.id}
                  role="listitem"
                  className={`flex flex-1 flex-col items-center rounded-xl px-2 py-2 text-center transition ${
                    active ? "bg-white/[0.08] ring-1 ring-[#5865F2]/40" : done ? "opacity-95" : "opacity-45"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${
                      done
                        ? "bg-emerald-500/25 text-emerald-300"
                        : active
                          ? `bg-gradient-to-br ${accent} text-white`
                          : "bg-white/10 text-gray-500"
                    }`}
                  >
                    {done ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : s.id}
                  </span>
                  <span className="mt-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">{s.label}</span>
                  <span className="hidden text-[10px] text-gray-600 sm:block">{s.sub}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carousel */}
        <div className="relative min-h-[min(52vh,420px)] flex-1 overflow-hidden">
          <div
            className="flex h-full w-[300%] transition-transform duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)]"
            style={{ transform: `translateX(-${((step - 1) / 3) * 100}%)` }}
          >
            {/* Step 1 */}
            <div className="flex h-full w-[calc(100%/3)] shrink-0 flex-col px-6 py-6">
              <p className="text-sm leading-relaxed text-gray-400">
                Les membres voient surtout les salons « publics ». Importe ici le classement Discord — on t&apos;aide
                ensuite à <strong className="text-gray-200">masquer le détail staff</strong> sans perdre les totaux.
              </p>

              <div
                className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-10 transition ${
                  dragOver
                    ? "border-[#5865F2] bg-[#5865F2]/10"
                    : "border-white/15 bg-black/25 hover:border-[#5865F2]/35 hover:bg-[#5865F2]/5"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <Upload className={`mb-3 h-12 w-12 ${dragOver ? "text-[#b4b9ff]" : "text-gray-600"}`} aria-hidden />
                <p className="text-center text-sm font-semibold text-gray-200">
                  Glisse un fichier .csv / .txt ici
                </p>
                <p className="mt-1 text-center text-xs text-gray-500">ou clique pour parcourir — puis complète ou corrige ci-dessous</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt"
                  className="hidden"
                  onChange={handleFile}
                />
              </div>

              <textarea
                value={stateText}
                onChange={(e) => {
                  setStateText(e.target.value);
                  setError(null);
                }}
                rows={6}
                placeholder={`Exemple :\nrang,nom,id,compter\n1,général,123…,4200\n\nou :\ngénéral\t1240`}
                className="mt-4 w-full resize-y rounded-2xl border border-white/10 bg-[#07080c]/90 px-4 py-3 font-mono text-sm leading-relaxed text-gray-100 outline-none ring-0 transition focus:border-[#5865F2]/45 focus:shadow-[0_0_0_3px_rgba(88,101,242,0.15)]"
              />

              {quickParseCheck && (
                <div
                  className={`mt-3 flex items-center gap-2 rounded-xl px-4 py-2 text-sm ${
                    quickParseCheck.ok
                      ? "border border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                      : "border border-amber-500/25 bg-amber-500/10 text-amber-200"
                  }`}
                >
                  <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                  {quickParseCheck.ok ? (
                    <span>
                      <strong>{quickParseCheck.count}</strong> salon(s) détecté(s) dans le texte — tu peux passer à
                      l&apos;étape suivante.
                    </span>
                  ) : (
                    <span>Ajuste le fichier : aucun salon valide pour l&apos;instant.</span>
                  )}
                </div>
              )}

              <button
                type="button"
                role="switch"
                aria-checked={replace}
                onClick={() => setReplace((v) => !v)}
                className={`mt-5 flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                  replace
                    ? "border-amber-400/40 bg-amber-500/10"
                    : "border-white/10 bg-black/20 hover:border-white/15"
                }`}
              >
                <span>
                  <span className="block text-sm font-semibold text-gray-100">Remplacer les données de ce mois</span>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    Sinon on fusionne avec ce qui existe déjà pour les salons {kind === "messages" ? "messages" : "vocaux"}.
                  </span>
                </span>
                <span
                  className={`relative ml-3 h-9 w-16 shrink-0 rounded-full transition ${
                    replace ? "bg-amber-500" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 h-7 w-7 rounded-full bg-white shadow transition-transform ${
                      replace ? "translate-x-7" : "translate-x-0"
                    }`}
                  />
                </span>
              </button>
            </div>

            {/* Step 2 */}
            <div className="flex h-full w-[calc(100%/3)] shrink-0 flex-col overflow-hidden px-6 py-6">
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <div className="relative min-w-[140px] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    type="search"
                    value={filterQ}
                    onChange={(e) => setFilterQ(e.target.value)}
                    placeholder="Filtrer les salons…"
                    className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#5865F2]/40"
                  />
                </div>
                <button
                  type="button"
                  onClick={applyPatternSuggestionsOnly}
                  className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-100 transition hover:bg-amber-500/20"
                >
                  Mots-clés
                </button>
                <button
                  type="button"
                  onClick={applySessionPrevious}
                  className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs font-bold text-violet-100 transition hover:bg-violet-500/20"
                >
                  Session
                </button>
                <button
                  type="button"
                  onClick={clearAllStaff}
                  className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-gray-400 transition hover:bg-white/5"
                >
                  Tout décocher
                </button>
              </div>

              <p className="mt-3 shrink-0 text-sm text-gray-400">
                <Shield className="mr-1 inline h-4 w-4 text-violet-300 align-text-bottom" aria-hidden />
                Ce que tu coches part dans le <strong className="text-gray-200">bloc anonyme</strong> — les noms ne
                s&apos;affichent pas aux membres pour ces salons.
              </p>
              <p className="mt-2 shrink-0 text-xs leading-relaxed text-gray-500">
                Cochage auto : salons ticket (<strong className="text-gray-400">@ferme-…</strong>,{" "}
                <strong className="text-gray-400">fermé-…</strong>, préfixe <strong className="text-gray-400">ticket</strong>
                , nom avec <strong className="text-gray-400">#</strong>). Les salons{" "}
                <strong className="text-gray-400">live-…</strong> / <strong className="text-gray-400">live …</strong>{" "}
                restent publics.
              </p>

              <div className="relative mt-4 min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/[0.07] bg-black/25">
                {ctxLoading && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0b0d12]/85 backdrop-blur-sm">
                    <Loader2 className="h-10 w-10 animate-spin text-[#5865F2]" aria-hidden />
                    <p className="text-sm text-gray-400">On charge tes réglages du mois…</p>
                  </div>
                )}
                <div className="h-full max-h-[min(38vh,340px)] overflow-y-auto overscroll-contain">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 z-[1] bg-[#151924]/95 backdrop-blur-sm">
                      <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <th className="w-12 px-3 py-3">Staff</th>
                        <th className="px-3 py-3">Salon</th>
                        <th className="px-3 py-3 text-right">
                          {kind === "messages" ? "Messages" : "Temps"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {filteredRows.map((row) => (
                        <tr
                          key={row.label}
                          className={`cursor-pointer transition-colors ${
                            staffSelSet.has(row.label)
                              ? "bg-violet-500/[0.08]"
                              : "hover:bg-white/[0.04]"
                          }`}
                          onClick={() => toggleStaffKey(row.label)}
                        >
                          <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={staffSelSet.has(row.label)}
                              onChange={() => toggleStaffKey(row.label)}
                              className="h-4 w-4 rounded border-gray-500 bg-[#0b0d12] text-[#5865F2] focus:ring-[#5865F2]/40"
                            />
                          </td>
                          <td className="max-w-[200px] px-3 py-2.5 md:max-w-none">
                            <span className="font-medium text-gray-100">#{row.label}</span>
                            <div className="mt-1 h-1 overflow-hidden rounded-full bg-black/40">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${accent} opacity-80 transition-all duration-300`}
                                style={{ width: `${(row.value / maxRowVal) * 100}%` }}
                              />
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-gray-400">
                            {kind === "messages"
                              ? row.value.toLocaleString("fr-FR")
                              : formatMinutesFr(row.value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="mt-3 shrink-0 text-center text-xs text-gray-500">
                <strong className="text-gray-300">{staffKeysSel.length}</strong> salon(s) staff ·{" "}
                <strong className="text-gray-300">{mergedRows.length}</strong> après fusion des noms ·{" "}
                <strong className="text-gray-300">{filteredRows.length}</strong> affiché(s)
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex h-full w-[calc(100%/3)] shrink-0 flex-col px-6 py-6">
              {parsedRaw && monthCtx && previewSplit && (
                <>
                  <p className="text-sm leading-relaxed text-gray-400">
                    Classement unifié une fois enregistré :{" "}
                    <strong className="text-gray-200">salons publics</strong> et{" "}
                    <strong className="text-gray-200">l’espace staff regroupé</strong> sont mélangés selon l’activité
                    {previewSplit.rankedRows.length === 0
                      ? " (aucune ligne dans cet aperçu)."
                      : ` (${previewSplit.rankedRows.length} ligne${previewSplit.rankedRows.length > 1 ? "s" : ""} dans cet aperçu).`}
                  </p>
                  <div className="mt-5 flex flex-1 flex-col rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#1a1f2e]/80 to-transparent p-5">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#b4b9ff]">
                      <MessageSquare className="h-4 w-4" aria-hidden />
                      Aperçu du classement
                    </p>
                    <ol className="mt-4 max-h-[min(32vh,280px)] list-none space-y-3 overflow-y-auto pr-1">
                      {previewSplit.rankedRows.length === 0 ? (
                        <li className="text-sm text-gray-600">Rien à afficher avec ces réglages.</li>
                      ) : (
                        previewSplit.rankedRows.map((r, i) => (
                          <li key={`${r.kind}-${r.label}-${i}`}>
                            <div className="flex gap-3">
                              <span className="w-6 shrink-0 pt-0.5 text-right text-xs font-bold tabular-nums text-gray-500">
                                {i + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                {r.kind === "staff" ? (
                                  <DiscordStaffSalonClusterCard
                                    compact
                                    label={r.label}
                                    valueFormatted={
                                      kind === "messages"
                                        ? r.value.toLocaleString("fr-FR")
                                        : formatMinutesFr(Math.round(r.value))
                                    }
                                  />
                                ) : (
                                  <div className="flex items-center justify-between gap-2 rounded-lg bg-black/20 px-3 py-2 text-sm">
                                    <span className="truncate text-gray-200">#{r.label}</span>
                                    <span className="shrink-0 tabular-nums font-semibold text-gray-400">
                                      {kind === "messages"
                                        ? r.value.toLocaleString("fr-FR")
                                        : formatMinutesFr(Math.round(r.value))}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </li>
                        ))
                      )}
                    </ol>
                  </div>
                  <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3 text-center text-sm text-gray-400">
                    Total importé :{" "}
                    <strong className="text-white">
                      {kind === "messages"
                        ? sumParsed.toLocaleString("fr-FR")
                        : formatMinutesFr(sumParsed)}
                    </strong>{" "}
                    · <strong className="text-white">{mergedRows.length}</strong> salons distincts
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="border-t border-red-500/20 bg-red-500/10 px-6 py-3 text-sm text-red-200">{error}</div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] bg-black/25 px-6 py-4">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/[0.06]"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            {step === 1 ? "Fermer" : "Retour"}
          </button>
          <div className="flex flex-wrap gap-2">
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={step === 2 && (ctxLoading || !monthCtx)}
                className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${accent}`}
              >
                {step === 1 ? "Continuer" : "Voir l'aperçu"}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                disabled={importing}
                onClick={() => void handleFinalize()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Enregistrement…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    Enregistrer pour la communauté
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
