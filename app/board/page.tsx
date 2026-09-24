import { BoardForm } from "@/components/board-form";
import { Desk } from "@/components/desk";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Netflow · Off Book" };

export default function Page() {
  return (
    <Desk
      tone="ledger"
      kicker="Board"
      title="One netflow page"
      lede="Tokens on this page, ranked by absolute 24h flow. The top 50 against the rest. Same body."
      route="POST /api/netflow"
      nansen="POST /api/v1/smart-money/netflow"
      cost="5"
    >
      <BoardForm />
    </Desk>
  );
}
