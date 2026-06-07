"use client";

type RaidDeclareToastProps = {
  toast: { type: "success" | "error"; message: string } | null;
};

export default function RaidDeclareToast({ toast }: RaidDeclareToastProps) {
  if (!toast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[60] max-w-sm">
      <div
        className={`rounded-2xl border px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur-md ${
          toast.type === "success"
            ? "border-emerald-500/40 bg-emerald-950/90 text-emerald-100"
            : "border-red-500/40 bg-red-950/90 text-red-100"
        }`}
        role="status"
      >
        {toast.message}
      </div>
    </div>
  );
}
