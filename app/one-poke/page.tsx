import { Desk } from "@/components/desk";
import { OnePokeForm } from "@/components/one-poke-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "One poke · Off Book" };

export default function Page() {
  return (
    <Desk
      tone="poke"
      kicker="Poke"
      title="One poke vs many callers"
      lede="Bet the 50% line on the buy page."
      route="POST /api/one-poke"
      nansen="POST /api/v1/tgm/who-bought-sold"
      cost="1"
    >
      <OnePokeForm />
    </Desk>
  );
}
