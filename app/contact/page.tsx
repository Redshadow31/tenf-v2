import type { Metadata } from "next";
import { Suspense } from "react";
import ContactPageClient from "./ContactPageClient";
import { CONTACT_TOPICS } from "./topics";

export const metadata: Metadata = {
  title: "Contact — TENF",
  description:
    "Contacter TENF : question générale, signalement, partenariat, presse, soutien, problème technique. Formulaire sécurisé et délais de réponse réalistes.",
  alternates: {
    canonical: "https://tenf-community.com/contact",
  },
  openGraph: {
    title: "Contact — TENF",
    description:
      "Un seul endroit pour joindre TENF : question, signalement, partenariat, presse, soutien, technique. Formulaire simple et sécurisé.",
    url: "https://tenf-community.com/contact",
    type: "website",
  },
};

export default function ContactPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Quel est le délai de réponse TENF ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Entre 48 et 96 heures en général. TENF est gérée par des bénévoles.",
        },
      },
      {
        "@type": "Question",
        name: "Quels motifs de contact sont acceptés ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: CONTACT_TOPICS.map((t) => t.label).join(", "),
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Suspense fallback={null}>
        <ContactPageClient />
      </Suspense>
    </>
  );
}
