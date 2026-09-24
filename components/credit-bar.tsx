"use client";

import { useScore } from "@/components/score";
import type { Credits } from "@/components/use-desk";
import { useEffect, useState } from "react";

export function CreditBar() {
  const [credits, setCredits] = useState<Credits | null>(null);
  const score = useScore();

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

  const spent = credits ? String(credits.spentThisSession) : "…";
  const left = credits && credits.remaining != null ? String(credits.remaining) : "—";
  const last = !credits
    ? "—"
    : credits.cached
      ? "Cache"
      : credits.used > 0
        ? `Last charge ${credits.used}`
        : "No call";

  return (
    <p className="plaque" aria-live="polite">
      <span>Spent {spent}</span>
      <span aria-hidden="true">·</span>
      <span>Left {left}</span>
      <span aria-hidden="true">·</span>
      <span>{last}</span>
      <span aria-hidden="true">·</span>
      <span>
        {score.right} right · {score.wrong} wrong
      </span>
    </p>
  );
}
