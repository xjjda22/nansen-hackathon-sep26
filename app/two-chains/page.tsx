import { Desk } from "@/components/desk";
import { TwoChainsForm } from "@/components/two-chains-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Two chains · Off Book" };

export default function Page() {
  return (
    <Desk
      tone="rails"
      kicker="Rails"
      title="Same ticker, two chains"
      lede="Bet two chains, one chain, or not on the page."
      route="POST /api/two-chains"
      nansen="POST /api/v1/smart-money/netflow"
      cost="5"
    >
      <TwoChainsForm />
    </Desk>
  );
}
