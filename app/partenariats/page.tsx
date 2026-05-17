import type { Metadata } from "next";
import Link from "next/link";
import AboutPageEnhancer from "@/components/about/AboutPageEnhancer";
import Hero from "./_components/Hero";
import WhyPartner from "./_components/WhyPartner";
import WhatTenfOffers from "./_components/WhatTenfOffers";
import WhatTenfLooksFor from "./_components/WhatTenfLooksFor";
import WhatTenfRefuses from "./_components/WhatTenfRefuses";
import UpaSpotlight from "./_components/UpaSpotlight";
import PartnersList from "./_components/PartnersList";
import ContactCta from "./_components/ContactCta";
import Faq from "./_components/Faq";
import { faq } from "./_data";

const PAGE_TITLE = "Partenariats — TENF";
const PAGE_DESCRIPTION =
  "Comment TENF construit ses partenariats : ce qu'on apporte, ce qu'on recherche, ce qu'on refuse. Bilan public du partenariat solidaire TENF × UPA au profit de la Ligue contre le cancer.";
const PAGE_URL = "https://tenf-community.com/partenariats";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    type: "website",
    siteName: "TENF — Twitch Entraide New Family",
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
  keywords: [
    "TENF partenariats",
    "partenariat Twitch",
    "TENF UPA",
    "UPA Events",
    "Ligue contre le cancer",
    "partenariat caritatif streaming",
    "collaboration communauté Twitch",
    "événement solidaire Twitch",
  ],
};

export default function PartenariatsPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <main
      className="home-page min-h-screen w-full"
      style={{
        paddingTop: "clamp(1rem, 0.6rem + 1.4vw, 3rem)",
        paddingBottom: "clamp(2rem, 1rem + 2.4vw, 5rem)",
        fontSize: "clamp(0.9375rem, 0.82rem + 0.4vw, 1.125rem)",
      }}
    >
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div
        className="home-page-inner mx-auto flex w-full flex-col"
        style={{
          maxWidth: "min(110rem, 100%)",
          paddingLeft: "clamp(0.75rem, 0.5rem + 1.6vw, 3rem)",
          paddingRight: "clamp(0.75rem, 0.5rem + 1.6vw, 3rem)",
          rowGap: "clamp(1.75rem, 1rem + 1.6vw, 3.5rem)",
        }}
      >
        {/* 1. Hero */}
        <Hero />

        {/* 2. Pourquoi TENF fait des partenariats */}
        <WhyPartner />

        {/* 3. Ce que TENF peut apporter */}
        <WhatTenfOffers />

        {/* 4. Ce que TENF recherche */}
        <WhatTenfLooksFor />

        {/* 5. Ce que TENF refuse */}
        <WhatTenfRefuses />

        {/* 6. Mise en avant UPA Events × Ligue contre le cancer */}
        <UpaSpotlight />

        {/* 7. Partenaires actuels et passés */}
        <PartnersList />

        {/* 8. Proposer un partenariat */}
        <ContactCta />

        {/* 9. FAQ courte */}
        <Faq />

        {/* Liens utiles */}
        <section className="about-fade-up home-section scroll-mt-28 space-y-4">
          <p className="home-kicker text-xs font-bold uppercase tracking-[0.16em] sm:text-sm">
            Pour aller plus loin
          </p>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
            <Link href="/charte" className="about-reveal home-step-card rounded-2xl border p-4 sm:p-5">
              <h3 className="text-sm font-bold sm:text-base">Charte communautaire</h3>
              <p className="home-muted mt-1.5 text-xs leading-snug sm:text-sm">
                Les valeurs et règles qui guident chaque partenariat TENF.
              </p>
            </Link>
            <Link href="/a-propos" className="about-reveal home-step-card rounded-2xl border p-4 sm:p-5">
              <h3 className="text-sm font-bold sm:text-base">À propos de TENF</h3>
              <p className="home-muted mt-1.5 text-xs leading-snug sm:text-sm">
                Mieux nous connaître avant d&apos;envoyer une proposition.
              </p>
            </Link>
            <Link href="/partenaire-tenf" className="about-reveal home-step-card rounded-2xl border p-4 sm:p-5">
              <h3 className="text-sm font-bold sm:text-base">Bilan TENF × UPA</h3>
              <p className="home-muted mt-1.5 text-xs leading-snug sm:text-sm">
                Le bilan complet de la première édition commune au profit de la Ligue contre le cancer.
              </p>
            </Link>
          </div>
        </section>
      </div>

      <AboutPageEnhancer />
    </main>
  );
}
