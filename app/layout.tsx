import { BrandMark } from "@/components/brand";
import { CreditBar } from "@/components/credit-bar";
import { Nav } from "@/components/desk";
import { SaloonGround } from "@/components/saloon-ground";
import { SimpleProvider } from "@/components/simple-mode";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Rye } from "next/font/google";
import "./globals.css";

const display = Rye({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-rye",
});

export const metadata: Metadata = {
  title: "After 50",
  description: "Four smart-money lists. Each one is split into two groups.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} h-full antialiased`}>
      <body className="min-h-full">
        <SaloonGround />
        <header className="topbar">
          <span>Meridian Buildathon</span>
        </header>
        <div className="shell mx-auto flex min-h-full w-full max-w-6xl flex-col px-4 py-6 sm:px-6">
          <header className="saloon-sign mb-4">
            <BrandMark />
            <p className="nameplate-title">After 50</p>
          </header>
          <SimpleProvider>
            <Nav />
            <CreditBar />
            <main className="room-main flex-1">{children}</main>
          </SimpleProvider>
          <footer className="site-footer">
            <p>
              Powered by the Nansen API.{" "}
              <a href="https://docs.nansen.ai/api/smart-money/netflows" target="_blank" rel="noreferrer">Netflow</a>
              {" · "}
              <a href="https://docs.nansen.ai/api/smart-money/pnl-leaderboard" target="_blank" rel="noreferrer">Leaderboard</a>
              {" · "}
              <a href="https://docs.nansen.ai/api/smart-money/dex-trades" target="_blank" rel="noreferrer">DEX trades</a>
              {" · "}
              <a href="https://docs.nansen.ai/api/smart-money/holdings" target="_blank" rel="noreferrer">Holdings</a>
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
