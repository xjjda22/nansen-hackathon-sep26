import { DeskMark, type DeskTone } from "@/components/marks";
import Link from "next/link";

const LINKS = [
  ["/", "Room"],
  ["/not-on-your-list", "Ledger"],
  ["/sector-weather", "Weather"],
  ["/both-sides", "Blotter"],
  ["/two-chains", "Rails"],
  ["/cohort-sign", "Wire"],
  ["/one-poke", "Poke"],
  ["/gas", "Gas"],
  ["/jup-dca", "Vault"],
  ["/hl-split", "Split"],
] as const;

export function Nav() {
  return (
    <nav className="rail" aria-label="Desks">
      {LINKS.map(([href, label]) => (
        <Link key={href} href={href}>
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function Desk({
  title,
  lede,
  kicker,
  tone,
  children,
}: {
  title: string;
  lede: string;
  kicker: string;
  tone: DeskTone;
  children: React.ReactNode;
}) {
  return (
    <article className={`desk desk-${tone}`} data-desk={tone}>
      <header className="desk-head">
        <DeskMark tone={tone} />
        <div>
          <p className="kicker">{kicker}</p>
          <h1>{title}</h1>
        </div>
      </header>
      <p className="desk-lede">{lede}</p>
      {children}
    </article>
  );
}
