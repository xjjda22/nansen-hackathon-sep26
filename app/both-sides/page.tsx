import { BothSidesForm } from "@/components/both-sides-form";
import { Desk } from "@/components/desk";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Both sides · Off Book" };

export default function Page() {
  return (
    <Desk
      tone="blotter"
      kicker="The blotter"
      title="Same names, both sides"
      lede="One buy page for one token. The sentence is how many of those buyers also have a sold volume on that same page. Labels stay off the page. The sell page is a second button."
    >
      <BothSidesForm />
    </Desk>
  );
}
