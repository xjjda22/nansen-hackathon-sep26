import Link from "next/link";

const LINKS = [
  ["/", "Desk"],
  ["/not-on-your-list", "Not on your list"],
  ["/sector-weather", "Sector weather"],
  ["/both-sides", "Both sides"],
  ["/two-chains", "Two chains"],
  ["/cohort-sign", "Cohort and sign"],
] as const;

export function Nav() {
  return (
    <nav className="mb-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#f0e2c8]">
      {LINKS.map(([href, label]) => (
        <Link key={href} href={href} className="underline-offset-4 hover:underline">
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function Desk({
  title,
  lede,
  children,
}: {
  title: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <article className="paper rounded-sm p-5 sm:p-8">
      <h1 className="font-display text-3xl leading-tight text-rust sm:text-4xl">{title}</h1>
      <p className="mt-3 mb-6 leading-relaxed">{lede}</p>
      {children}
    </article>
  );
}
