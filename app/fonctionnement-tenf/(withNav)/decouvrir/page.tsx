import Link from "next/link";
import { ArrowRight, Radio } from "lucide-react";
import styles from "../../fonctionnement.module.css";
import DecouvrirTenfInteractive from "@/components/fonctionnement/DecouvrirTenfInteractive";
import { FonctionnementPageHeader } from "@/components/fonctionnement/FonctionnementPageHeader";

export const metadata = {
  title: "Découvrir TENF — Fonctionnement",
  description:
    "TENF expliqué pour le grand public et les membres : promesse, quatre piliers interactifs, parcours express en trois mouvements, carte des pages utiles (événements, lives, progression) et accès Discord.",
};

export default function DecouvrirTenfPage() {
  return (
    <div className="about-fade-up space-y-12">
      <FonctionnementPageHeader
        eyebrow="Parcours guidé · Twitch Entraide New Family"
        title="Découvrir TENF"
        subtitle="Une communauté de streamers et de viewers qui avancent ensemble : cadre lisible pour les curieux, raccourcis concrets pour les membres — puis quatre piliers à explorer, un résumé du parcours et une carte des pages à garder sous la main."
        icon={Radio}
        actions={
          <>
            <Link href="/fonctionnement-tenf/comment-ca-marche" className={styles.fnBtnPrimary}>
              Voir les 3 étapes
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            </Link>
            <Link href="https://discord.gg/WnpazgcZHk" target="_blank" rel="noopener noreferrer" className={styles.fnBtnGhost}>
              Discord TENF
            </Link>
            <Link href="/events2" className={styles.fnBtnGhost}>
              Calendrier public
            </Link>
          </>
        }
      />

      <DecouvrirTenfInteractive />
    </div>
  );
}
