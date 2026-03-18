"use client";

import Link from "next/link";
import { useState } from "react";

type TabId = "missing" | "transmission";

function Pill({ children }: { children: string }) {
  return (
    <span
      className="inline-flex rounded-full border px-2.5 py-1 text-xs"
      style={{ borderColor: "rgba(145,70,255,0.55)", backgroundColor: "rgba(145,70,255,0.12)" }}
    >
      {children}
    </span>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border p-5 md:p-6 space-y-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export default function EvaluationV2SourcesPage() {
  const [tab, setTab] = useState<TabId>("missing");

  return (
    <div className="min-h-screen p-4 md:p-8 text-white" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-7xl mx-auto space-y-6">
        <header
          className="rounded-2xl border p-5 md:p-7"
          style={{
            borderColor: "var(--color-border)",
            background: "linear-gradient(145deg, rgba(79,70,229,0.20) 0%, rgba(79,70,229,0.08) 35%, rgba(255,255,255,0) 100%)",
          }}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <Link href="/admin/evaluation" className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                ← Retour au pilotage évaluation
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight">Pilotage des données manquantes v2</h1>
              <p className="text-sm md:text-base mt-2 max-w-4xl leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                Page dédiée aux informations que le système ne détecte pas automatiquement, et au format attendu pour les transmettre.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/admin/evaluation/v2?system=new"
                className="rounded-xl px-3 py-2 text-sm font-medium border"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
              >
                Évaluation v2 (new)
              </Link>
              <Link
                href="/admin/evaluation/v2/pilotage?system=new"
                className="rounded-xl px-3 py-2 text-sm font-medium border"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
              >
                Pilotage manuel v2
              </Link>
              <Link
                href="/admin/evaluation/b/discord"
                className="rounded-xl px-3 py-2 text-sm font-medium"
                style={{ backgroundColor: "#9146ff", color: "white" }}
              >
                Import Discord (Statbot)
              </Link>
            </div>
          </div>
        </header>

        <main className="rounded-2xl border p-4 md:p-5 space-y-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <div className="flex flex-wrap gap-2 p-1 rounded-xl border w-fit" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
            {[
              { id: "missing", label: "Données non auto" },
              { id: "transmission", label: "Comment transmettre" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id as TabId)}
                className="px-4 py-2 rounded-lg text-sm border"
                style={{
                  borderColor: tab === item.id ? "#9146ff" : "var(--color-border)",
                  backgroundColor: tab === item.id ? "#9146ff" : "var(--color-surface)",
                  color: tab === item.id ? "white" : "var(--color-text)",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === "missing" && (
            <div className="space-y-4">
              <SectionCard title="Quelles informations sont souvent manquantes ?">
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  Le moteur v2 couvre automatiquement une grande partie des signaux, mais certains éléments métiers doivent encore être injectés
                  ou validés manuellement.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Pill>Engagement Discord utile</Pill>
                  <Pill>Soutien réseau hors signaux automatiques</Pill>
                  <Pill>Fiabilité (comportement / réactivité)</Pill>
                  <Pill>Bonus staff et équité horaire</Pill>
                </div>
              </SectionCard>

              <SectionCard title="Axes v2 concernés côté pilotage">
                <ul className="space-y-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  <li className="flex gap-2"><span aria-hidden="true">•</span><span><strong>Engagement Discord (/5):</strong> cas d’import incomplet ou pseudo non matché.</span></li>
                  <li className="flex gap-2"><span aria-hidden="true">•</span><span><strong>Soutien réseau (/5):</strong> entraide réelle non reflétée par les flux automatiques.</span></li>
                  <li className="flex gap-2"><span aria-hidden="true">•</span><span><strong>Fiabilité (/5):</strong> éléments qualitatifs (comportement, réactivité, obligations).</span></li>
                  <li className="flex gap-2"><span aria-hidden="true">•</span><span><strong>Bonus (/5 max):</strong> responsabilité staff/modération et équité fuseau horaire.</span></li>
                </ul>
              </SectionCard>

              <SectionCard title="Règle de gouvernance">
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  Toute correction manuelle doit rester ciblée, traçable, et justifiée. Dans `Pilotage manuel v2`, la raison est obligatoire dès
                  qu’une note est modifiée.
                </p>
              </SectionCard>
            </div>
          )}

          {tab === "transmission" && (
            <div className="space-y-4">
              <SectionCard title="1) Écrit / vocal (CSV Statbot)">
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  Pour les messages et vocaux Discord, utilisez la page d’import dédiée. Le parser accepte maintenant :
                  <strong> TAB</strong>, <strong>virgule</strong> ou <strong>point-virgule</strong>.
                </p>
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                  <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
                    Colonnes attendues
                  </p>
                  <p className="text-sm mt-1">`RANG`, `PSEUDO`, `DISCORD_ID` (optionnel), `VALEUR`</p>
                  <p className="text-xs mt-2" style={{ color: "var(--color-text-secondary)" }}>
                    Pour les vocaux, la valeur est en heures décimales (ex: 2.5).
                  </p>
                </div>
                <pre className="rounded-xl border p-3 text-xs overflow-x-auto" style={{ borderColor: "var(--color-border)", backgroundColor: "#0b1020" }}>
1,frostyquinn94,477791879866351623,1683
2;facebcd;1297107200623513645;1477
3\tpseudo_sans_id\t802
                </pre>
                <div>
                  <Link
                    href="/admin/evaluation/b/discord"
                    className="inline-flex rounded-lg px-3 py-2 text-sm font-medium"
                    style={{ backgroundColor: "#9146ff", color: "white" }}
                  >
                    Ouvrir l’import Discord
                  </Link>
                </div>
              </SectionCard>

              <SectionCard title="2) Informations qualitatives non automatisées">
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  Pour les cas qui ne passent pas par un flux (entraide, comportement, réactivité, cas staff), appliquez l’ajustement directement
                  via `Pilotage manuel v2` en renseignant la raison.
                </p>
                <pre className="rounded-xl border p-3 text-xs overflow-x-auto" style={{ borderColor: "var(--color-border)", backgroundColor: "#0b1020" }}>
Mois: 2026-03
Membre: twitch_login
Champ ajusté: bloc4 (Fiabilité)
Valeur auto: 2.50
Valeur finale: 3.25
Raison: Présence obligations + reactivité staff constatee hors signaux automatiques
Source: validation_staff
                </pre>
                <div>
                  <Link
                    href="/admin/evaluation/v2/pilotage?system=new"
                    className="inline-flex rounded-lg px-3 py-2 text-sm font-medium"
                    style={{ backgroundColor: "#0ea5e9", color: "white" }}
                  >
                    Ouvrir Pilotage manuel v2 (new)
                  </Link>
                </div>
              </SectionCard>

              <SectionCard title="3) Ordre recommandé">
                <ol className="list-decimal ml-5 space-y-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  <li>Importer d’abord les flux volumétriques (messages/vocaux via Statbot).</li>
                  <li>Rafraîchir `Évaluation v2 (new)` pour vérifier les alertes.</li>
                  <li>Finaliser uniquement les exceptions dans `Pilotage manuel v2` avec une raison claire.</li>
                </ol>
              </SectionCard>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
