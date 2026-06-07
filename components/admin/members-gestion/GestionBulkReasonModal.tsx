"use client";

import { type ChangeEvent } from "react";
import type { GestionModalCopy } from "@/lib/admin/members-gestion/gestionCopyModel";
import GestionModalShell, {
  gestionModalGhostBtnClass,
  gestionModalPrimaryBtnClass,
  gestionModalTextareaClass,
} from "@/components/admin/members-gestion/GestionModalShell";

type GestionBulkReasonModalProps = {
  open: boolean;
  copy: GestionModalCopy;
  accentHex?: string;
  draft: string;
  loading: boolean;
  onDraftChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function GestionBulkReasonModal({
  open,
  copy,
  accentHex = "#8b5cf6",
  draft,
  loading,
  onDraftChange,
  onCancel,
  onConfirm,
}: GestionBulkReasonModalProps) {
  return (
    <GestionModalShell
      open={open}
      onClose={onCancel}
      title={copy.title}
      subtitle={copy.subtitle}
      size="sm"
      accentHex={accentHex}
      disableClose={loading}
      ariaLabelledBy="bulk-audit-reason-title"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={loading} className={gestionModalGhostBtnClass}>
            {copy.cancel}
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className={gestionModalPrimaryBtnClass}>
            {loading ? copy.confirmLoading : copy.confirm}
          </button>
        </div>
      }
    >
      <textarea
        className={gestionModalTextareaClass}
        rows={4}
        value={draft}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onDraftChange(e.target.value)}
        placeholder={copy.placeholder}
        autoFocus
        aria-label="Motif d'audit pour l'action de masse"
      />
    </GestionModalShell>
  );
}
