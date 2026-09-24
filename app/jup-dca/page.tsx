import { Desk } from "@/components/desk";
import { JupDcaForm } from "@/components/jup-dca-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Jupiter DCA · Off Book" };

export default function Page() {
  return (
    <Desk
      tone="dca"
      kicker="The vault"
      title="Jupiter DCA still filling"
      lede="One Solana mint. If any vault on the page is still Active, the stamp is STILL FILLING. All Closed is CLOSED. A missing list is NONE."
    >
      <JupDcaForm />
    </Desk>
  );
}
