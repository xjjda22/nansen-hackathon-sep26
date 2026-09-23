import { BrandMark } from "@/components/brand";
import { CreditBar } from "@/components/credit-bar";
import { Nav } from "@/components/desk";
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
  description: "Five questions from the Nansen board. No seed, no signature, no invented number.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${wire.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col px-4 py-6 sm:px-6">
          <header className="mb-4 flex items-center gap-3">
            <BrandMark />
            <div>
              <p className="nameplate-title text-[1.7rem] sm:text-3xl">Off Book</p>
              <p className="text-sm text-[#e7d3b0]">Five desks. Nansen is the index.</p>
            </div>
          </header>
          <Nav />
          <CreditBar />
          <main className="flex-1">{children}</main>
          <footer className="mt-8 text-sm leading-relaxed text-[#e7d3b0]">
            The server calls Nansen. This page does not scan blocks, does not ask for a seed or a
            signature, and does not invent a figure the API did not return.
          </footer>
        </div>
      </body>
    </html>
  );
}
