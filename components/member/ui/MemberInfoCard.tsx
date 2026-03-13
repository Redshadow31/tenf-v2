import type { ReactNode } from "react";

type MemberInfoCardProps = {
  title: string;
  children: ReactNode;
};

export default function MemberInfoCard({ title, children }: MemberInfoCardProps) {
  return (
    <section className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
      <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
