import type { ReactNode } from "react";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: AdminLayoutProps) {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <section className="mt-4">{children}</section>
    </main>
  );
}
