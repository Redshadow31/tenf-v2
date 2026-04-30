import FonctionnementShell from "@/components/fonctionnement/FonctionnementShell";

export default function FonctionnementWithNavLayout({ children }: { children: React.ReactNode }) {
  return <FonctionnementShell>{children}</FonctionnementShell>;
}
