import { Desk } from "@/components/desk";
import { GasLeadForm } from "@/components/gas-lead-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gas · Off Book" };

export default function Page() {
  return (
    <Desk
      tone="gas"
      kicker="Gas"
      title="Who is paying the gas"
      lede="Bet whether Ethereum still leads 7-day EVM gas USD."
      route="POST /api/gas-lead"
      nansen="POST /api/v1/chains/chain-rank"
      cost="1"
    >
      <GasLeadForm />
    </Desk>
  );
}
