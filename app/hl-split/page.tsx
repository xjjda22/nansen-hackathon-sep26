import { Desk } from "@/components/desk";
import { HlSplitForm } from "@/components/hl-split-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Position split · Off Book" };

export default function Page() {
  return (
    <Desk
      tone="split"
      kicker="The split"
      title="Hyperliquid position split"
      lede="Smart HL Perps against Whales on one perp book. Opposite signs that clear the floor are SPLIT. The same sign is ALIGNED. A missing side is FLAT. Spot netflow is not this book."
    >
      <HlSplitForm />
    </Desk>
  );
}
