import { Desk } from "@/components/desk";
import { NotOnYourListForm } from "@/components/not-on-your-list-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Not on your list · Off Book" };

export default function Page() {
  return (
    <Desk
      title="Not on your list"
      lede="You name what you already hold. The desk keeps positive 24h net flow, drops your symbols on every chain, and prints at most three survivors. Open a card for the one cohort line. That line is a separate credit."
    >
      <NotOnYourListForm />
    </Desk>
  );
}
