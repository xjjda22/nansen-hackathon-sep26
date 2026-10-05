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
        <SimpleProvider>{children}</SimpleProvider>
      </body>
    </html>
  );
}
