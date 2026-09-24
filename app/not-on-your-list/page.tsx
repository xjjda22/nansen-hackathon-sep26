import { Desk } from "@/components/desk";
import { NotOnYourListForm } from "@/components/not-on-your-list-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Not on your list · Off Book" };

export default function Page() {
  return (
    <Desk
      tone="ledger"
      kicker="Ledger"
      title="Not on your list"
      lede="Bet a name off your book, or none."
      route="POST /api/not-on-your-list"
      nansen="POST /api/v1/smart-money/netflow"
      cost="5"
    >
      <NotOnYourListForm />
    </Desk>
  );
}
