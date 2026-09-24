import { BothSidesForm } from "@/components/both-sides-form";
import { Desk } from "@/components/desk";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Both sides · Off Book" };

export default function Page() {
  return (
    <Desk
      tone="blotter"
      kicker="Blotter"
      title="Same names, both sides"
      lede="Bet how the buy page comes back. The sell page is a second call."
      route="POST /api/both-sides"
      nansen="POST /api/v1/tgm/who-bought-sold"
      cost="1"
    >
      <BothSidesForm />
    </Desk>
  );
}
