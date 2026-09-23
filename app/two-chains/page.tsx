import { Desk } from "@/components/desk";
import { TwoChainsForm } from "@/components/two-chains-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Two chains · Off Book" };

export default function Page() {
  return (
    <Desk
      tone="rails"
      kicker="The twin rails"
      title="Same ticker, two chains"
      lede="One symbol on the netflow page. If it survives on more than one chain, the desk prints each chain, address, and 24h figure, and marks the larger absolute. If the board does not include it, that is the answer."
    >
      <TwoChainsForm />
    </Desk>
  );
}
