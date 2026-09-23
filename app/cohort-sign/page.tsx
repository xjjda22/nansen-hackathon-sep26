import { CohortSignForm } from "@/components/cohort-sign-form";
import { Desk } from "@/components/desk";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cohort and sign · Off Book" };

export default function Page() {
  return (
    <Desk
      tone="wire"
      kicker="The wire"
      title="Cohort and sign"
      lede="The question on the agent door asks why a ticker is up. Flow intelligence has no price, so this desk does not answer that. It names the largest absolute 1-day cohort and its sign, then says whether the 5-minute sign matches."
    >
      <CohortSignForm />
    </Desk>
  );
}
