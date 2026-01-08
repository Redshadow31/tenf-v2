import "./globals.css";

import dynamic from "next/dynamic";
import type { Metadata } from "next";
import type { ReactNode } from "react";

const ClientLayout = dynamic(() => import("./layout.client"), { ssr: false });

export const metadata: Metadata = {
  title: "TENF V2",
  description: "Plateforme TENF V2 - sombre, moderne, professionnelle",
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
  return (
    <html lang="fr">
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
      </head>
      <body style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}

