"use client";

import { Shown } from "@/components/simple-mode";
import { useCallTally, type CallTally } from "@/components/use-desk";
import { useId, useState } from "react";

const PITCH =
  "Four Nansen smart-money lists, each split into the top and the rest. Read what sets them apart, one line at a time.";

const GLOSSARY: { term: string; body: string }[] = [
  { term: "Traits", body: "The top of one list set next to the rest of that same list." },
  { term: "Insights", body: "Two smaller groups, each picked by a stated rule, set next to each other." },
  { term: "Off the book", body: "In the largest netflow moves, but missing from the holdings page." },
  { term: "The red stamp", body: "The number that decided the line." },
  { term: "Mark read", body: "Opens the next line. The comparison table comes last." },
  { term: "Token names", body: "Click one to see its address and open it on Nansen or an explorer." },
];

export function tallyText(tally: CallTally): string {
  if (tally.calls === 0) return "Calling Nansen…";
  const calls = tally.calls === 1 ? "1 call" : `${tally.calls} calls`;
  const source =
    tally.cached === tally.calls ? "all from the disk cache, 0 credits" : tally.cached === 0 ? `${tally.used} credits` : `${tally.cached} from cache, ${tally.used} credits`;
  const left = tally.remaining != null ? `, ${tally.remaining} left on the account` : "";
  return `${calls}, ${source}${left}`;
}

export function WalkIntro({ className = "walk-intro" }: { className?: string }) {
  const tally = useCallTally();
  const [open, setOpen] = useState(false);
  const panel = useId();
  return (
    <div className={className}>
      <p className="walk-pitch"><Shown text={PITCH} /></p>
      <p className="walk-strip">
        <span className="walk-strip-dot" data-live={tally.calls > 0} aria-hidden="true" />
        <span>Nansen smart money · {tallyText(tally)}</span>
        <button type="button" className="walk-how" aria-expanded={open} aria-controls={panel} onClick={() => setOpen(!open)}>
          How to read this
        </button>
      </p>
      {open ? (
        <div id={panel} className="walk-glossary">
          <dl>
            {GLOSSARY.map((item) => (
              <div key={item.term}>
                <dt>{item.term}</dt>
                <dd>{item.body}</dd>
              </div>
            ))}
          </dl>
          <p className="walk-glossary-note">None of this is an order to trade.</p>
        </div>
      ) : null}
    </div>
  );
}
