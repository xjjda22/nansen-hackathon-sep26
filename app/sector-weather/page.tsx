import { Desk } from "@/components/desk";
import { SectorWeatherForm } from "@/components/sector-weather-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sector weather · Off Book" };

export default function Page() {
  return (
    <Desk
      tone="weather"
      kicker="Weather"
      title="Sector weather"
      lede="Bet leaving, nothing leaving, or no weather."
      route="POST /api/sector-weather"
      nansen="POST /api/v1/smart-money/netflow"
      cost="5"
    >
      <SectorWeatherForm />
    </Desk>
  );
}
