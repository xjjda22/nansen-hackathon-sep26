import { Desk } from "@/components/desk";
import { SectorWeatherForm } from "@/components/sector-weather-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sector weather · Off Book" };

export default function Page() {
  return (
    <Desk
      title="Sector weather"
      lede="Which of Nansen's sectors has the strongest positive 24h smart-money net flow, and which has the strongest negative. A token in two sectors is counted in full in both. The sums sit behind the toggle."
    >
      <SectorWeatherForm />
    </Desk>
  );
}
