import { Desk } from "@/components/desk";
import { GasLeadForm } from "@/components/gas-lead-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gas · Off Book" };

export default function Page() {
  return (
    <Desk
      tone="gas"
      kicker="The lamp"
      title="Who is paying the gas"
      lede="Seven days of EVM gas USD. The stamp says whether Ethereum still leads, and names the chain that does. Base and Arbitrum are printed when the page has them."
    >
      <GasLeadForm />
    </Desk>
  );
}
