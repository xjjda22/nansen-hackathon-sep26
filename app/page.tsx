import { DeskMark, type DeskTone } from "@/components/marks";
import Link from "next/link";

const DOORS: {
  href: string;
  tone: DeskTone;
  kicker: string;
  title: string;
  copy: string;
}[] = [
  {
    href: "/not-on-your-list",
    tone: "ledger",
    kicker: "The book",
    title: "Not on your list",
    copy: "Write the symbols you already hold. The ledger keeps up to three names with positive 24h smart-money net flow that are absent from that list. An empty book makes no call.",
  },
  {
    href: "/sector-weather",
    tone: "weather",
    kicker: "The barometer",
    title: "Sector weather",
    copy: "One sentence from Nansen's token_sectors. A token in two sectors is counted in full in both. If every sector is positive, nothing is leaving.",
  },
  {
    href: "/both-sides",
    tone: "blotter",
    kicker: "The blotter",
    title: "Same names, both sides",
    copy: "Of the top page of buyers, how many also sold. If sold volume is missing, the blotter stops. It will not print a direction.",
  },
  {
    href: "/two-chains",
    tone: "rails",
    kicker: "The twin rails",
    title: "Same ticker, two chains",
    copy: "One symbol. If the netflow page still has it on more than one chain, which absolute 24h figure is larger. A tie stays a tie.",
  },
  {
    href: "/cohort-sign",
    tone: "wire",
    kicker: "The wire",
    title: "Cohort and sign",
    copy: "The largest absolute 1-day cohort and its sign, then AGREE, DISAGREE, or UNAVAILABLE. This desk does not explain a price.",
  },
  {
    href: "/one-poke",
    tone: "poke",
    kicker: "The poke",
    title: "One poke vs many callers",
    copy: "On the buy page, is one kept wallet at least half the USD, or are the callers spread out. No sell call, and no wallet table.",
  },
  {
    href: "/gas",
    tone: "gas",
    kicker: "The lamp",
    title: "Who is paying the gas",
    copy: "Seven days of EVM gas USD. Does Ethereum still lead, and which chain name decides it.",
  },
  {
    href: "/jup-dca",
    tone: "dca",
    kicker: "The vault",
    title: "Jupiter DCA still filling",
    copy: "A Solana mint. Still filling, closed, or none. A missing list is not a made-up vault.",
  },
  {
    href: "/hl-split",
    tone: "split",
    kicker: "The split",
    title: "Hyperliquid position split",
    copy: "Smart HL Perps against Whales on that perp book. Split, aligned, or flat. Not a spot netflow guess.",
  },
];

export default function HomePage() {
  return (
    <section>
      <p className="kicker on-wood">The room</p>
      <h1 className="nameplate-title">Nine desks, one board</h1>
      <p className="room-lede">
        The in-app agent asks these questions and then asks you to sign up. Each desk answers from
        one Nansen call: a netflow page, a flow split, a buy page, chain gas, a Jupiter vault, or a
        Hyperliquid book. The line under the nav is the credit counter for this server process.
      </p>
      <ul className="door-grid">
        {DOORS.map((door) => (
          <li key={door.href} className={`door-slot door-slot-${door.tone}`}>
            <Link href={door.href} className={`door door-${door.tone}`}>
              <DeskMark tone={door.tone} />
              <span className="kicker">{door.kicker}</span>
              <span className="door-title">{door.title}</span>
              <span className="door-copy">{door.copy}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
