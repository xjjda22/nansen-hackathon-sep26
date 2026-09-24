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
    kicker: "Ledger",
    title: "Not on your list",
    copy: "A name off your book, or none. Empty book does not call.",
  },
  {
    href: "/sector-weather",
    tone: "weather",
    kicker: "Weather",
    title: "Sector weather",
    copy: "Leaving, nothing leaving, or no weather.",
  },
  {
    href: "/both-sides",
    tone: "blotter",
    kicker: "Blotter",
    title: "Same names, both sides",
    copy: "Also sold, none, no trades, or volume absent.",
  },
  {
    href: "/two-chains",
    tone: "rails",
    kicker: "Rails",
    title: "Same ticker, two chains",
    copy: "Two chains, one chain, or not on the page.",
  },
  {
    href: "/cohort-sign",
    tone: "wire",
    kicker: "Wire",
    title: "Cohort and sign",
    copy: "Agree, disagree, flat, or unavailable.",
  },
];

export default function HomePage() {
  return (
    <section>
      <p className="kicker on-wood">Room</p>
      <h1 className="nameplate-title">Commit, then call</h1>
      <p className="room-lede">
        Lock a stamp. The desk calls Nansen and scores that stamp against the response. Wrong and right
        come from the payload.
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
