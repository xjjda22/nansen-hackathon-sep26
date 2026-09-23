import { Desk } from "@/components/desk";
import Link from "next/link";

const DOORS = [
  {
    href: "/not-on-your-list",
    title: "Not on your list",
    copy: "Type the symbols you hold. Up to three names with positive 24h smart-money net flow that are not on that list. The cohort line waits until you open a card.",
  },
  {
    href: "/sector-weather",
    title: "Sector weather",
    copy: "One sentence from Nansen's token_sectors. The sums overlap. If nothing is negative, nothing is leaving.",
  },
  {
    href: "/both-sides",
    title: "Same names, both sides",
    copy: "Of the top page of buyers, how many also sold. If sold volume is missing, the page stops. It will not invent a direction.",
  },
  {
    href: "/two-chains",
    title: "Same ticker, two chains",
    copy: "One symbol. If the netflow page has it on more than one chain, which absolute 24h figure is larger. A tie stays a tie.",
  },
  {
    href: "/cohort-sign",
    title: "Cohort and sign",
    copy: "The largest absolute 1-day cohort and its sign, then AGREE, DISAGREE, or UNAVAILABLE. The price is not in the payload, so this desk does not explain one.",
  },
];

export default function HomePage() {
  return (
    <Desk
      title="The counter is open"
      lede="The in-app agent asks these questions and then asks you to sign up. This desk answers from the indexed board: one netflow page, a flow split, or a buy page. Credits are counted in the header."
    >
      <ul className="space-y-3">
        {DOORS.map((door) => (
          <li key={door.href}>
            <Link
              href={door.href}
              className="block rounded-sm border border-[#e4d3b6] p-4 transition-colors hover:border-rust"
            >
              <span className="font-display text-xl text-rust">{door.title}</span>
              <span className="mt-1 block text-sm leading-relaxed text-[#5c4632]">{door.copy}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Desk>
  );
}
