import "./globals.css";

import dynamic from "next/dynamic";
import type { Metadata } from "next";
import type { ReactNode } from "react";

const ClientLayout = dynamic(() => import("./layout.client"), { ssr: false });

export const metadata: Metadata = {
  title: "TENF V2",
  description: "Plateforme TENF V2 - sombre, moderne, professionnelle",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="fr">
      <body className="bg-[#0e0e10] text-[#e5e5e5]">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}

