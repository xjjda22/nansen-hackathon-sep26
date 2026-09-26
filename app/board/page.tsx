import { BoardForm } from "@/components/board-form";
import { Desk } from "@/components/desk";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Netflow · After 50" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = params.q;
  const query = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
  return (
    <Desk
      tone="ledger"
      kicker="Board"
      title="Check a name"
      lede="Enter up to five symbols or addresses. Each name is a short walk across netflow, holdings, today's tape, and the names the top wallets traded. Traits only."
      route="Four posts"
      nansen="netflow, leaderboard, dex trades, holdings"
      cost="5 each"
    >
      <BoardForm initialQuery={query} />
    </Desk>
  );
}
