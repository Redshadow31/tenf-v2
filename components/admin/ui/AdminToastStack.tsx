import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export type AdminToastType = "success" | "warning" | "info";

export interface AdminToastItem {
  id: string;
  type: AdminToastType;
  title: string;
  description?: string;
}

interface AdminToastStackProps {
  toasts: AdminToastItem[];
  onClose: (id: string) => void;
}

function toneStyles(type: AdminToastType): { border: string; icon: JSX.Element } {
  if (type === "success") {
    return {
      border: "border-emerald-500/40",
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-300" />,
    };
  }
  if (type === "warning") {
    return {
      border: "border-amber-500/40",
      icon: <AlertTriangle className="h-4 w-4 text-amber-300" />,
    };
  }
  return {
    border: "border-sky-500/40",
    icon: <Info className="h-4 w-4 text-sky-300" />,
  };
}

export default function AdminToastStack({ toasts, onClose }: AdminToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-[60] flex w-[360px] flex-col gap-2">
      {toasts.map((toast) => {
        const tone = toneStyles(toast.type);
        return (
          <div
            key={toast.id}
            className={`rounded-xl border bg-[#141419]/95 px-3 py-2 shadow-xl backdrop-blur ${tone.border}`}
          >
            <div className="flex items-start gap-2">
              <div className="pt-0.5">{tone.icon}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-0.5 text-xs text-gray-300">{toast.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => onClose(toast.id)}
                className="rounded p-1 text-gray-400 transition hover:bg-white/10 hover:text-gray-200"
                aria-label="Fermer la notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

