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

  return (
    <p className="mb-6 text-sm text-[#e7d3b0]" aria-live="polite">
      Session credits spent: {credits ? credits.spentThisSession : "…"}. {remaining}. A cached
      click spends 0. Last action: {credits ? credits.used : 0}
      {credits?.cached ? ", from cache" : ""}.
    </p>
  );
}
