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
    href: "/board",
    tone: "ledger",
    kicker: "Board",
    title: "One netflow page",
    copy: "Ledger, weather, rails, and a picked row.",
  },
  {
    href: "/both-sides",
    tone: "blotter",
    kicker: "Blotter",
    title: "Buy page",
    copy: "Also sold, sold volume absent, or no trades.",
  },
];

export default function HomePage() {
  return (
    <section>
      <p className="kicker on-wood">Room</p>
      <h1 className="nameplate-title">One call, then the lines</h1>
      <p className="room-lede">Two screens. Each button is one Nansen call. The lines are that body.</p>
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
