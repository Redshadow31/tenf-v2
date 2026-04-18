"use client";

type CharityProgressBarProps = {
  raised: number;
  displayGoal: number;
  currency: string;
};

export default function CharityProgressBar({ raised, displayGoal, currency }: CharityProgressBarProps) {
  const safeGoal = displayGoal > 0 ? displayGoal : 1;
  const pct = Math.min(100, Math.max(0, (raised / safeGoal) * 100));
  const fmt = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency.length === 3 ? currency : "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-bold tabular-nums tracking-tight" style={{ color: "#fef3c7" }}>
            {fmt(raised)}
          </p>
          <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>
            synchronise avec Streamlabs Charity
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums" style={{ color: "#f5df9d" }}>
            palier barre {fmt(displayGoal)}
          </p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
            {pct >= 100 ? "Palier barre atteint" : `${Math.round(pct)} % du palier`}
          </p>
        </div>
      </div>
      <p className="text-[11px] leading-snug" style={{ color: "rgba(255,255,255,0.58)" }}>
        Merci pour chaque don et chaque message d&apos;encouragement : votre générosité et votre bienveillance font une
        réelle différence, avec toute notre gratitude.
      </p>
      <div
        className="h-4 w-full overflow-hidden rounded-full border"
        style={{
          borderColor: "rgba(212,175,55,0.45)",
          backgroundColor: "rgba(0,0,0,0.45)",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.35)",
        }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${pct}%`,
            minWidth: raised > 0 && pct < 2 ? "4px" : undefined,
            background: "linear-gradient(90deg, #b8860b, #f5d978 55%, #fff8e1)",
            boxShadow: "0 0 18px rgba(245,217,120,0.45)",
          }}
        />
      </div>
    </div>
  );
}
