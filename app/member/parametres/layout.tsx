import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Paramètres — Espace membre",
  description:
    "Profil TENF, liaison Twitch, notifications et guides sécurité : hub des réglages pour les membres de la communauté.",
};

export default function MemberParametresLayout({ children }: { children: ReactNode }) {
  return children;
}
