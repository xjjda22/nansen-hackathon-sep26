import { BrandMark } from "@/components/brand";
import { CreditBar } from "@/components/credit-bar";
import { Nav } from "@/components/desk";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Rye, Source_Serif_4 } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Off Book",
  description: "Five questions from the Nansen board. No seed, no signature, no invented number.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-6 sm:px-6">
          <header className="mb-4 flex items-center gap-3">
            <BrandMark />
            <div>
              <p className="font-display text-2xl text-[#e7c56a]">Off Book</p>
              <p className="text-sm text-[#e7d3b0]">Five questions. Nansen is the index.</p>
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
