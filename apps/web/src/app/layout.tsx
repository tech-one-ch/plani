import "@plani/ui/globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Plani",
  description:
    "Open-source self-hosted collaborative visual planning — tasks, board, calendar, notes and canvas in one project space.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
