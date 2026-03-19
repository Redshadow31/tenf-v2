"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Copy, Search } from "lucide-react";

interface VerifyListModalV2Props {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedRow {
  lineNumber: number;
  rawLine: string;
  nom: string;
  discord: string;
  twitch: string;
  isDuplicateInList?: boolean;
  duplicateIndex?: number;
  isExistingMember?: boolean;
  existingMemberInfo?: {
    displayName: string;
    twitchLogin: string;
    discordUsername?: string;
  };
  isInvalid?: boolean;
}

function parseLine(line: string): Omit<ParsedRow, "lineNumber" | "rawLine"> | null {
  const match = line.match(/@([^:]+?)\s*(?:\(([^)]+)\))?\s*:\s*(https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]+)/i);
  if (!match) return null;

  const discordPseudo = match[1].trim();
  const nomAlternatif = match[2]?.trim();
  const twitchChannel = match[4].toLowerCase();

  return {
    nom: nomAlternatif || discordPseudo,
    discord: discordPseudo.replace(/^@/, ""),
    twitch: twitchChannel,
  };
}

export default function VerifyListModalV2({ isOpen, onClose }: VerifyListModalV2Props) {
  const [inputText, setInputText] = useState("");
  const [existingMembers, setExistingMembers] = useState<any[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    async function loadExistingMembers() {
      setLoadingExisting(true);
      try {
        const response = await fetch("/api/admin/members", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) {
          setExistingMembers(data.members || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des membres existants:", error);
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    }

    loadExistingMembers();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setInputText("");
      setCopied(false);
    }
  }, [isOpen]);

  const parsedRows = useMemo(() => {
    const lines = inputText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const rows: ParsedRow[] = lines.map((line, index) => {
      const parsed = parseLine(line);
      if (!parsed) {
        return {
          lineNumber: index + 1,
          rawLine: line,
          nom: "",
          discord: "",
          twitch: "",
          isInvalid: true,
        };
      }
      return {
        lineNumber: index + 1,
        rawLine: line,
        ...parsed,
      };
    });

    const twitchSet = new Map<string, number>();
    const discordSet = new Map<string, number>();

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      if (row.isInvalid) continue;

      const twitchKey = row.twitch.toLowerCase();
      const discordKey = row.discord.toLowerCase();

      if (twitchSet.has(twitchKey)) {
        row.isDuplicateInList = true;
        row.duplicateIndex = twitchSet.get(twitchKey);
        const firstIndex = twitchSet.get(twitchKey)!;
        if (rows[firstIndex]) {
          rows[firstIndex].isDuplicateInList = true;
          rows[firstIndex].duplicateIndex = firstIndex;
        }
      } else {
        twitchSet.set(twitchKey, i);
      }

      if (discordKey) {
        if (discordSet.has(discordKey)) {
          row.isDuplicateInList = true;
          row.duplicateIndex = discordSet.get(discordKey);
          const firstIndex = discordSet.get(discordKey)!;
          if (rows[firstIndex]) {
            rows[firstIndex].isDuplicateInList = true;
          }
        } else {
          discordSet.set(discordKey, i);
        }
      }
    }

    const existingTwitchLogins = new Set(existingMembers.map((m) => String(m.twitchLogin || m.twitch || "").toLowerCase()));
    const existingDiscordUsernames = new Set(
      existingMembers.map((m) => String(m.discordUsername || m.discord || "").toLowerCase()).filter(Boolean)
    );
    const existingDiscordIds = new Set(existingMembers.map((m) => String(m.discordId || "").toLowerCase()).filter(Boolean));

    for (const row of rows) {
      if (row.isInvalid) continue;
      const twitchLower = row.twitch.toLowerCase();
      const discordLower = row.discord.toLowerCase();

      if (existingTwitchLogins.has(twitchLower) || existingDiscordUsernames.has(discordLower) || existingDiscordIds.has(discordLower)) {
        row.isExistingMember = true;
        const existing = existingMembers.find(
          (m) =>
            String(m.twitchLogin || m.twitch || "").toLowerCase() === twitchLower ||
            String(m.discordUsername || m.discord || "").toLowerCase() === discordLower ||
            String(m.discordId || "").toLowerCase() === discordLower
        );
        if (existing) {
          row.existingMemberInfo = {
            displayName: existing.displayName || existing.nom || "",
            twitchLogin: existing.twitchLogin || existing.twitch || "",
            discordUsername: existing.discordUsername || existing.discord || "",
          };
        }
      }
    }

    return rows;
  }, [existingMembers, inputText]);

  const stats = useMemo(() => {
    const total = parsedRows.length;
    const invalid = parsedRows.filter((r) => r.isInvalid).length;
    const duplicates = parsedRows.filter((r) => !r.isInvalid && r.isDuplicateInList).length;
    const existing = parsedRows.filter((r) => !r.isInvalid && r.isExistingMember).length;
    const missing = parsedRows.filter((r) => !r.isInvalid && !r.isDuplicateInList && !r.isExistingMember);
    return { total, invalid, duplicates, existing, missing };
  }, [parsedRows]);

  const handleCopyMissing = async () => {
    const payload = stats.missing.map((m) => `@${m.discord} : https://www.twitch.tv/${m.twitch}`).join("\n");
    if (!payload) return;
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      alert("Impossible de copier la liste.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4">
      <div
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border p-6 md:p-7"
        style={{
          borderColor: "rgba(96,165,250,0.35)",
          background:
            "radial-gradient(circle at 8% 0%, rgba(59,130,246,0.14), transparent 35%), radial-gradient(circle at 95% 0%, rgba(145,70,255,0.14), transparent 35%), #13151b",
          boxShadow: "0 26px 60px rgba(0,0,0,0.45)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white">Verif liste</h2>
            <p className="text-xs md:text-sm text-gray-300 mt-1">
              Analyse en lecture seule. Aucun membre n est ajoute ou modifie.
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-[#1c2130]">
            Fermer
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-xl border border-gray-700/70 bg-[#0f1117] p-4">
            <label className="block text-sm font-semibold text-gray-200 mb-2">Liste a verifier (meme format que Import en masse)</label>
            <p className="text-xs text-gray-400 mb-2">
              Exemple: @PseudoDiscord : https://www.twitch.tv/channel
            </p>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full min-h-[320px] rounded-lg border border-gray-700 bg-[#0b0d12] px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
              placeholder="@Evan34740 : https://www.twitch.tv/evan34740&#10;@LudraTv : https://www.twitch.tv/ludra_tv"
            />
            {loadingExisting ? <p className="mt-2 text-xs text-gray-400">Chargement des membres existants...</p> : null}
          </section>

          <section className="space-y-3">
            <div className="rounded-xl border border-blue-400/35 bg-blue-500/10 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-blue-200">Resultat filtre</p>
              <p className="text-sm text-blue-100 mt-1">Membres manquants sur le site: <span className="font-bold">{stats.missing.length}</span></p>
              <p className="text-xs text-blue-200/80 mt-1">Ce sont uniquement les lignes valides, non doublons, et non deja presentes.</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <StatPill label="Lignes" value={stats.total} tone="neutral" />
              <StatPill label="Manquants" value={stats.missing.length} tone="good" />
              <StatPill label="Existants" value={stats.existing} tone="warn" />
              <StatPill label="Invalides" value={stats.invalid} tone="danger" />
            </div>

            <div className="rounded-xl border border-gray-700 bg-[#0f1117] p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-300" />
                  Liste manquante
                </h3>
                <button
                  type="button"
                  onClick={handleCopyMissing}
                  disabled={stats.missing.length === 0}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-700 px-2 py-1 text-xs text-gray-200 hover:bg-[#1a2030] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? "Copie" : "Copier"}
                </button>
              </div>
              <div className="max-h-[360px] overflow-y-auto space-y-1">
                {stats.missing.length === 0 ? (
                  <p className="text-xs text-gray-400">Aucun membre manquant detecte avec les donnees actuelles.</p>
                ) : (
                  stats.missing.map((m) => (
                    <div key={`${m.lineNumber}-${m.twitch}`} className="rounded-md border border-green-500/30 bg-green-500/10 px-2 py-1.5 text-xs text-green-200">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-300" />
                        <span className="font-semibold">Ligne {m.lineNumber}</span>
                      </div>
                      <p className="mt-0.5">{m.nom} (@{m.discord}) → {m.twitch}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {(stats.existing > 0 || stats.invalid > 0 || stats.duplicates > 0) ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="text-xs text-amber-200 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {stats.existing} existant(s) • {stats.duplicates} doublon(s) • {stats.invalid} ligne(s) invalide(s)
                </p>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "good" | "warn" | "danger" | "neutral";
}) {
  const toneStyle =
    tone === "good"
      ? { border: "rgba(74,222,128,0.35)", bg: "rgba(34,197,94,0.12)", color: "#bbf7d0" }
      : tone === "warn"
        ? { border: "rgba(250,204,21,0.35)", bg: "rgba(234,179,8,0.12)", color: "#fde68a" }
        : tone === "danger"
          ? { border: "rgba(248,113,113,0.35)", bg: "rgba(239,68,68,0.12)", color: "#fecaca" }
          : { border: "rgba(148,163,184,0.35)", bg: "rgba(148,163,184,0.10)", color: "#e2e8f0" };

  return (
    <div className="rounded-lg border px-2.5 py-2" style={{ borderColor: toneStyle.border, backgroundColor: toneStyle.bg }}>
      <p className="text-[11px] text-gray-300">{label}</p>
      <p className="text-sm font-semibold" style={{ color: toneStyle.color }}>
        {value}
      </p>
    </div>
  );
}

