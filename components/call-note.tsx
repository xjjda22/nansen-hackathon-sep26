import type { Credits } from "@/components/use-desk";

export function CallNote({ credits }: { credits: Credits | null | undefined }) {
  if (!credits) return null;
  let text = "This click returned without a reported Nansen charge.";
  if (credits.cached) {
    text = "Served from the two-minute cache. Nansen was not called again for this click.";
  } else if (credits.used > 0) {
    text = `Called Nansen. This response charged ${credits.used} ${credits.used === 1 ? "credit" : "credits"}.`;
  }
  return <p className="call-note">{text}</p>;
}
