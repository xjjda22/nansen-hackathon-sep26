"use client";

import type { Credits } from "@/components/use-desk";
import { useEffect, useState } from "react";

export function CreditBar() {
  const [credits, setCredits] = useState<Credits | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/session")
      .then((response) => response.json())
      .then((data: { credits?: Credits }) => {
        if (!cancelled && data.credits) setCredits(data.credits);
      })
      .catch(() => {
        if (!cancelled) setCredits(null);
      });
    const onCredits = (event: Event) => {
      const detail = (event as CustomEvent<Credits>).detail;
      if (detail) setCredits(detail);
    };
    window.addEventListener("offbook-credits", onCredits);
    return () => {
      cancelled = true;
      window.removeEventListener("offbook-credits", onCredits);
    };
  }, []);

  const remaining =
    credits && credits.remaining != null
      ? `${credits.remaining} remaining on the Nansen account`
      : "account remaining not reported";

  const last = !credits
    ? "Waiting for the session counter."
    : credits.spentThisSession === 0 && credits.used === 0 && !credits.cached
      ? "No click has been charged in this process yet."
      : credits.cached
        ? `Last click was served from cache and charged ${credits.used}.`
        : `Last click charged ${credits.used}.`;

  return (
    <p className="plaque" aria-live="polite">
      This server process has spent {credits ? credits.spentThisSession : "…"} credits. {remaining}. {last}{" "}
      That figure is the session, not a campaign total.
    </p>
  );
}
