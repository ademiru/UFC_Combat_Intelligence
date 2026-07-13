import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";

import "./globals.css";

export const metadata: Metadata = {
  title: "Combat Intelligence",
  description: "UFC analiz, etkinlik ve dövüşçü istihbarat platformu",
  icons: {
    icon: "/brand/combat-mark.png",
    apple: "/brand/combat-mark.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="tr" className="dark">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

