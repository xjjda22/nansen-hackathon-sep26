"use client";

import { useEffect, useState } from "react";

const KEY = "offbook-score-v1";

export type Tally = { right: number; wrong: number };

function readTally(): Tally {
  if (typeof window === "undefined") return { right: 0, wrong: 0 };
  try {
    const parsed = JSON.parse(sessionStorage.getItem(KEY) || "") as Tally;
    if (typeof parsed.right === "number" && typeof parsed.wrong === "number") return parsed;
  } catch {
    /* empty session */
  }
  return { right: 0, wrong: 0 };
}

export function markRound(hit: boolean) {
  const tally = readTally();
  const next = hit ? { right: tally.right + 1, wrong: tally.wrong } : { right: tally.right, wrong: tally.wrong + 1 };
  sessionStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("offbook-score"));
}

export function useScore(): Tally {
  const [tally, setTally] = useState<Tally>({ right: 0, wrong: 0 });

  useEffect(() => {
    const sync = () => setTally(readTally());
    sync();
    window.addEventListener("offbook-score", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("offbook-score", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return tally;
}
