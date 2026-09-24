import { DeskMark, type DeskTone } from "@/components/marks";
import Link from "next/link";

const LINKS = [
  ["/", "Room"],
  ["/board", "Board"],
  ["/both-sides", "Blotter"],
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
  route,
  nansen,
  cost,
  children,
}: {
  title: string;
  lede: string;
  kicker: string;
  tone: DeskTone;
  route: string;
  nansen: string;
  cost: string;
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
      <p className="dev-strip">
        <span>{route}</span>
        <span aria-hidden="true">→</span>
        <span>{nansen}</span>
        <span className="dev-cost">{cost}</span>
      </p>
      {children}
    </article>
  );
}
