import "./globals.css";
import type { Metadata } from "next";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Lauf Manager",
  description: "Laufgruppe HAW Kiel – Termine & Anmeldung",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <Header />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}