import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";

import "./globals.css";

export const metadata: Metadata = {
  title: "UFC Panel | Combat Intelligence",
  description: "Local-first UFC analytics and fighter comparison desktop app",
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

