import type { Credits } from "@/components/use-desk";

export function CallNote({ credits }: { credits: Credits | null | undefined }) {
  if (!credits) return null;
  const text = credits.cached ? "Cache · 0" : `Charged ${credits.used}`;
  return <p className="call-note">{text}</p>;
}
