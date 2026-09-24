import { BothSidesForm } from "@/components/both-sides-form";
import { Desk } from "@/components/desk";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Both sides · Off Book" };

export default function Page() {
  return (
    <Desk
      tone="blotter"
      kicker="Blotter"
      title="Buy page"
      lede="How many of this ordered page also sold. One call."
      route="POST /api/both-sides"
      nansen="POST /api/v1/tgm/who-bought-sold"
      cost="1"
    >
      <BothSidesForm />
    </Desk>
  );
}
