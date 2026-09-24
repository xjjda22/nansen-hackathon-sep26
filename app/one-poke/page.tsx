import { Desk } from "@/components/desk";
import { OnePokeForm } from "@/components/one-poke-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "One poke · Off Book" };

export default function Page() {
  return (
    <Desk
      tone="poke"
      kicker="The poke"
      title="One poke vs many callers"
      lede="One buy page. If the largest kept wallet is at least half the kept buy USD, the stamp is ONE POKE. Otherwise MANY CALLERS. The sell side is not called."
    >
      <OnePokeForm />
    </Desk>
  );
}
