import { CohortSignForm } from "@/components/cohort-sign-form";
import { Desk } from "@/components/desk";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cohort and sign · Off Book" };

export default function Page() {
  return (
    <Desk
      tone="wire"
      kicker="Wire"
      title="Cohort and sign"
      lede="Bet agree, disagree, flat, or unavailable."
      route="POST /api/cohort-sign"
      nansen="POST /api/v1/tgm/flow-intelligence"
      cost="1–2"
    >
      <CohortSignForm />
    </Desk>
  );
}
