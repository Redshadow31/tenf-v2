import "./globals.css";

import dynamic from "next/dynamic";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

const ClientLayout = dynamic(() => import("./layout.client"), { ssr: false });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 0.88,
  minimumScale: 0.5,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "TENF New Family",
    template: "%s | TENF New Family",
  },
  description: "Communaute d'entraide pour streamers, lives, evenements et accompagnement des createurs.",
  metadataBase: new URL("https://tenf-community.com"),
  openGraph: {
    title: "TENF New Family",
    description: "Communaute d'entraide pour streamers, lives, evenements et accompagnement des createurs.",
    url: "https://tenf-community.com",
    siteName: "TENF New Family",
    type: "website",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "TENF New Family",
    description: "Communaute d'entraide pour streamers et createurs.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/Tenf.png",
    shortcut: "/Tenf.png",
    apple: "/Tenf.png",
  },
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://tenf-community.com/#organization",
        name: "TENF New Family",
        url: "https://tenf-community.com",
        logo: "https://tenf-community.com/Tenf.png",
      },
      {
        "@type": "WebSite",
        "@id": "https://tenf-community.com/#website",
        name: "TENF New Family",
        url: "https://tenf-community.com",
        inLanguage: "fr-FR",
        publisher: {
          "@id": "https://tenf-community.com/#organization",
        },
      },
    ],
  };

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}

