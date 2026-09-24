import { BrandMark } from "@/components/brand";
import { CreditBar } from "@/components/credit-bar";
import { Nav } from "@/components/desk";
import { SaloonGround } from "@/components/saloon-ground";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Rye, Source_Serif_4, Special_Elite } from "next/font/google";
import "./globals.css";

const display = Rye({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-rye",
});

const body = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
});

const wire = Special_Elite({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-wire",
});

export const metadata: Metadata = {
  title: "Off Book",
  description: "One Nansen call per screen. The lines come from that body.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${wire.variable} h-full antialiased`}>
      <body className="min-h-full">
        <SaloonGround />
        <header className="topbar">
          <span>Off Book</span>
          <span>Meridian Buildathon</span>
        </header>
        <div className="shell mx-auto flex min-h-full w-full max-w-6xl flex-col px-4 py-6 sm:px-6">
          <header className="mb-4 flex items-center gap-3">
            <BrandMark />
            <div>
              <p className="nameplate-title text-[1.7rem] sm:text-3xl">Off Book</p>
              <p className="text-sm text-[#5c3d28]">Two calls. One body each.</p>
            </div>
          </header>
          <Nav />
          <CreditBar />
          <main className="room-main flex-1">{children}</main>
          <footer className="site-footer">
            Server-side Nansen. No block scan. No seed. No invented figure.
          </footer>
        </div>
      </body>
    </html>
  );
}
