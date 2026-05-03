import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Formations — Espace membre",
  description:
    "Catalogue des formations TENF, inscriptions aux sessions, archive thématique et suivi des formations validées pour les membres Academy.",
};

export default function MemberFormationsLayout({ children }: { children: ReactNode }) {
  return children;
}
