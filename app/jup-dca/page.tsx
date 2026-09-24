import { Desk } from "@/components/desk";
import { JupDcaForm } from "@/components/jup-dca-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Jupiter DCA · Off Book" };

export default function Page() {
  return (
    <Desk
      tone="dca"
      kicker="Vault"
      title="Jupiter DCA still filling"
      lede="Bet still filling, closed, or none."
      route="POST /api/jup-dca"
      nansen="POST /api/v1/tgm/jup-dca"
      cost="1"
    >
      <JupDcaForm />
    </Desk>
  );
}
