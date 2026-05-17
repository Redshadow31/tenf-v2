"use client";

import { ShieldCheck } from "lucide-react";
import ProfileSectionCard from "@/components/member/profil/ProfileSectionCard";
import StatusBadge from "@/components/member/ui/StatusBadge";

type StatusTone = "success" | "warning" | "neutral";

type ProfileValidationSectionProps = {
  status: string;
  label: string;
  tone: StatusTone;
};

export default function ProfileValidationSection({ status, label, tone }: ProfileValidationSectionProps) {
  return (
    <ProfileSectionCard
      id="validation"
      title="Validation TENF"
      description="État technique de ta fiche côté staff."
      icon={ShieldCheck}
      accentClassName="border-emerald-400/35 bg-emerald-500/10 text-emerald-200"
      rightSlot={<StatusBadge label={label} tone={tone} />}
    >
      <div className="space-y-[clamp(0.55rem,0.8vw,0.85rem)]">
        <p
          className="text-pretty leading-relaxed text-zinc-300"
          style={{ fontSize: "clamp(0.78rem,0.88vw,0.88rem)" }}
        >
          Statut actuel : <strong className="text-white">{status}</strong>. Tes envois depuis « Compléter mon profil »
          sont relus avant publication — pas d’automatisme, pas de jugement.
        </p>
        <div className="flex items-start gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-[clamp(0.65rem,0.9vw,1rem)] py-2.5 text-emerald-100/95">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
          <span style={{ fontSize: "clamp(0.74rem,0.82vw,0.82rem)" }}>
            Tes modifications passent déjà par le flux de validation staff — pas besoin de DM séparé.
          </span>
        </div>
      </div>
    </ProfileSectionCard>
  );
}
