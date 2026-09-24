import { Desk } from "@/components/desk";
import { HlSplitForm } from "@/components/hl-split-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Position split · Off Book" };

export default function Page() {
  return (
    <Desk
      tone="split"
      kicker="Split"
      title="Hyperliquid position split"
      lede="Bet split, aligned, or flat. Smart HL Perps against Whales."
      route="POST /api/hl-split"
      nansen="POST /api/v1/tgm/position-intelligence"
      cost="1"
    >
      <HlSplitForm />
    </Desk>
  );
}
