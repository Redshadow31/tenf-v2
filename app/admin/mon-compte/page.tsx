"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2, Shield } from "lucide-react";

type CharterPayload = {
  currentVersion: string;
  accepted: boolean;
  validatedAt: string | null;
  validatedVersion: string | null;
  deadlineIso: string;
  daysRemainingApprox: number | null;
  graceElapsed: boolean;
};

type SensitivePayload = {
  discordId: string;
  discordRename: string | null;
  discordHandle: string | null;
  twitchId: string | null;
} | null;

type AccountPayload = {
  hasAdvancedAdminView: boolean;
  displayName: string | null;
  siteRole: string | null;
  adminRole: string;
  adminRoleLabel: string;
  discordUsername: string | null;
  twitchLogin: string | null;
  twitchUrl: string | null;
  charter: CharterPayload;
  staffNotificationEmail: string;
  sensitive: SensitivePayload;
};

const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-[#0f1118]";

export default function AdminMonComptePage() {
  const [data, setData] = useState<AccountPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/me/account", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/auth/login";
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Impossible de charger la fiche.");
      }
      const json = (await res.json()) as AccountPayload;
      setData(json);
      setEmailInput(json.staffNotificationEmail || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveEmail() {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/admin/me/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffNotificationEmail: emailInput }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j?.error || "Enregistrement refusé.");
      }
      setSaveMessage("E-mail enregistré.");
      await load();
    } catch (e) {
      setSaveMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-slate-300">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        Chargement de ta fiche…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-red-100">
        <p>{error || "Données indisponibles."}</p>
        <button
          type="button"
          onClick={() => void load()}
          className={`mt-3 rounded-lg bg-red-900/50 px-3 py-2 text-sm text-white ${focusRingClass}`}
        >
          Réessayer
        </button>
      </div>
    );
  }

  const { charter } = data;
  const charterUrgent = !charter.accepted && (charter.graceElapsed || (charter.daysRemainingApprox ?? 99) <= 5);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Mon compte</h1>
        <p className="mt-1 text-sm text-slate-400">
          Fiche personnelle réservée à ton compte administrateur. Les identifiants techniques (Discord, Twitch) ne
          sont affichés que si tu disposes d&apos;un accès administrateur avancé.
        </p>
      </div>

      {!data.hasAdvancedAdminView && (
        <div className="flex gap-3 rounded-xl border border-amber-900/50 bg-amber-950/25 p-4 text-amber-100">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden />
          <p className="text-sm">
            Tu n&apos;as pas l&apos;accès « admin avancé » : la section « Identifiants techniques » est masquée.
            Les fondateurs peuvent l&apos;accorder depuis la page{" "}
            <Link href="/admin/gestion-acces/admin-avance" className="underline decoration-amber-400/80">
              Accès admin avancé
            </Link>
            .
          </p>
        </div>
      )}

      {charterUrgent && (
        <div className="flex gap-3 rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-red-50">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden />
          <div className="text-sm">
            <p className="font-medium">Charte de modération</p>
            {!charter.accepted && (
              <p className="mt-1 text-red-100/90">
                {charter.graceElapsed
                  ? "Le délai de 15 jours après l’entrée dans l’équipe est dépassé sans validation de charte : ton accès peut être bloqué. Valide la charte immédiatement."
                  : `Tu as environ ${charter.daysRemainingApprox} jour(s) pour valider la charte. Passé ce délai (15 jours depuis la prise en compte de ta fiche), l’accès administrateur peut être suspendu.`}
              </p>
            )}
            <Link
              href="/admin/moderation/staff/info/validation-charte"
              className={`mt-2 inline-block text-sm font-medium text-red-200 underline ${focusRingClass}`}
            >
              Valider la charte
            </Link>
          </div>
        </div>
      )}

      <section className="rounded-xl border border-slate-800 bg-[#141820] p-5">
        <h2 className="text-lg font-semibold text-white">Identité</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Nom / pseudo affiché</dt>
            <dd className="font-medium text-slate-100">{data.displayName || "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Rôle sur le site (membre)</dt>
            <dd className="font-medium text-slate-100">{data.siteRole || "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Rôle administration</dt>
            <dd className="font-medium text-slate-100">{data.adminRoleLabel}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Pseudo Discord (fiche)</dt>
            <dd className="font-medium text-slate-100">{data.discordUsername || "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Chaîne Twitch</dt>
            <dd className="font-medium text-slate-100">
              {data.twitchUrl ? (
                <a href={data.twitchUrl} className="text-sky-400 hover:underline" target="_blank" rel="noreferrer">
                  {data.twitchLogin || data.twitchUrl}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>
      </section>

      {data.sensitive && (
        <section className="rounded-xl border border-slate-800 bg-[#141820] p-5">
          <h2 className="text-lg font-semibold text-white">Identifiants techniques</h2>
          <p className="mt-1 text-xs text-slate-500">Visible uniquement avec accès administrateur avancé.</p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-slate-500">ID Discord</dt>
              <dd className="font-mono text-xs text-slate-200">{data.sensitive.discordId}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Rename Discord (global_name)</dt>
              <dd className="font-medium text-slate-100">{data.sensitive.discordRename || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Handle Discord</dt>
              <dd className="font-medium text-slate-100">
                {data.sensitive.discordHandle ? `@${data.sensitive.discordHandle}` : "—"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-500">ID Twitch</dt>
              <dd className="font-mono text-xs text-slate-200">{data.sensitive.twitchId || "—"}</dd>
            </div>
          </dl>
        </section>
      )}

      <section className="rounded-xl border border-slate-800 bg-[#141820] p-5">
        <h2 className="text-lg font-semibold text-white">E-mail (notifications importantes)</h2>
        <p className="mt-1 text-sm text-slate-400">
          Utilisé pour les alertes staff critiques. Tu peux le laisser vide si tu préfères être joignable uniquement
          sur Discord.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="staff-email" className="mb-1 block text-xs text-slate-500">
              Adresse e-mail
            </label>
            <input
              id="staff-email"
              type="email"
              autoComplete="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-[#0f1317] px-3 py-2 text-white placeholder:text-slate-600"
              placeholder="exemple@domaine.com"
            />
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveEmail()}
            className={`rounded-lg bg-[#c9a227] px-4 py-2 text-sm font-medium text-black disabled:opacity-50 ${focusRingClass}`}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
        {saveMessage && <p className="mt-2 text-sm text-slate-300">{saveMessage}</p>}
      </section>

      <section className="rounded-xl border border-slate-800 bg-[#141820] p-5">
        <h2 className="text-lg font-semibold text-white">Charte de modération</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <dt className="text-slate-500">Statut</dt>
            <dd>
              {charter.accepted ? (
                <span className="rounded-full bg-emerald-950/80 px-2 py-0.5 text-emerald-200">Acceptée</span>
              ) : (
                <span className="rounded-full bg-amber-950/80 px-2 py-0.5 text-amber-200">Non validée</span>
              )}
            </dd>
          </div>
          {charter.accepted && charter.validatedAt && (
            <div>
              <dt className="text-slate-500">Validée le</dt>
              <dd className="text-slate-200">
                {new Date(charter.validatedAt).toLocaleString("fr-FR")}
                {charter.validatedVersion ? ` · ${charter.validatedVersion}` : ""}
              </dd>
            </div>
          )}
          {!charter.accepted && (
            <div>
              <dt className="text-slate-500">Échéance indicative (15 jours)</dt>
              <dd className="text-slate-200">{new Date(charter.deadlineIso).toLocaleString("fr-FR")}</dd>
            </div>
          )}
        </dl>
        <Link
          href="/admin/moderation/staff/info/validation-charte"
          className={`mt-4 inline-block text-sm text-sky-400 hover:underline ${focusRingClass}`}
        >
          Ouvrir la page de validation
        </Link>
      </section>
    </div>
  );
}
