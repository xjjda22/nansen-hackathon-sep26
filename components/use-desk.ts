"use client";

import { useRef, useState, useSyncExternalStore } from "react";

export type Credits = {
  spentThisSession: number;
  remaining: number | null;
  used: number;
  cached: boolean;
};

export type CallTally = { calls: number; cached: number; used: number; remaining: number | null };

const EMPTY_TALLY: CallTally = { calls: 0, cached: 0, used: 0, remaining: null };
let tally = EMPTY_TALLY;
const listeners = new Set<() => void>();

export function publishCredits(credits: Credits) {
  tally = {
    calls: tally.calls + 1,
    cached: tally.cached + (credits.cached ? 1 : 0),
    used: tally.used + (credits.cached ? 0 : credits.used),
    remaining: credits.remaining ?? tally.remaining,
  };
  for (const listener of listeners) listener();
  window.dispatchEvent(new CustomEvent("offbook-credits", { detail: credits }));
}

/** Every Nansen response this tab has seen, counted once. */
export function useCallTally(): CallTally {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => tally,
    () => EMPTY_TALLY,
  );
}

export function useDesk() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);

  async function run<T>(url: string, body: unknown): Promise<T | null> {
    if (lock.current) return null;
    lock.current = true;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as T & { ok?: boolean; error?: string; credits?: Credits };
      if (data.credits) publishCredits(data.credits);
      if (!response.ok || data.ok === false) {
        setError(data.error ?? "The desk could not complete that.");
        return null;
      }
      return data;
    } catch {
      setError("The request failed before a result came back.");
      return null;
    } finally {
      lock.current = false;
      setPending(false);
    }
  }

  return { pending, error, setError, run };
}
