// src/app/layout.tsx
import type { Metadata } from "next";
import Image from "next/image";
import "./globals.css";

const base =
  process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "Laufgruppe – HAW Kiel",
  description:
    "Termine & Anmeldung der Laufgruppe an der HAW Kiel. Viel Weißraum, klare Linien, FH-Blau.",
  metadataBase: new URL(base),
  applicationName: "Laufgruppe – HAW Kiel",
  keywords: ["HAW Kiel", "Laufgruppe", "Termine", "Anmeldung"],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className="h-full">
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased">
        {/* Schmale Markenleiste */}
        <div className="w-full border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2">
            <Image
              src="/brand/haw-logo.png" // <— Datei muss unter /public/brand/haw-logo.png liegen
              alt="HAW Kiel"
              width={160}
              height={40}
              priority
              className="h-8 w-auto"
            />
            <div className="ml-auto text-xs text-slate-500">
              Laufgruppe
            </div>
          </div>
        </div>

        {/* Seite */}
        <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Fußzeile */}
        <footer className="mt-16 border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-slate-500">
            © {new Date().getFullYear()} HAW Kiel – Laufgruppe
          </div>
        </footer>
      </body>
    </html>
  );
}