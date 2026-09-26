"use client";

import { TechFoot } from "@/components/desk";
import { Ladder } from "@/components/ladder";
import { SplitReadout } from "@/components/split-readout";
import { Status } from "@/components/status";
import { publishCredits, type Credits } from "@/components/use-desk";
import { type QuestTable, type TokenMeasure } from "@/lib/rules";
import { useEffect, useState } from "react";

type Load = {
  frame: string;
  common: string[];
  meaningful: string[];
  unscored: string | null;
  topAddresses: string[];
  tradedKeys: string[];
  keyKind: "address" | "symbol" | null;
  table: QuestTable | null;
  measures: TokenMeasure[];
  credits: Credits;
  raw?: unknown;
};

let traderLoad: Promise<{ data: Load | null; error: string | null }> | null = null;

export function loadTraders(): Promise<{ data: Load | null; error: string | null }> {
  if (!traderLoad) {
    traderLoad = (async () => {
      try {
        const response = await fetch("/api/leaderboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        const data = (await response.json()) as Load & { ok?: boolean; error?: string };
        if (data.credits) publishCredits(data.credits);
        if (!response.ok || data.ok === false || !data.frame) {
          return { data: null, error: data.error ?? "The desk could not complete that." };
        }
        return { data, error: null };
      } catch {
        return { data: null, error: "The request failed before a result came back." };
      }
    })();
  }
  return traderLoad;
}

export function TraderBoard() {
  const [load, setLoad] = useState<Load | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadTraders().then((outcome) => {
      if (cancelled) return;
      setLoad(outcome.data);
      setError(outcome.error);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const compared = load != null && load.common.length + load.meaningful.length > 0;
  return (
    <div className="space-y-5">
      {error ? <Status kind="error">{error}</Status> : null}
      {!load && !error ? <Status kind="loading">One request is in flight.</Status> : null}
      {load ? (
        <SplitReadout
          frame={load.frame}
          common={load.common}
          meaningful={load.meaningful}
          unscored={load.unscored}
          compared={compared}
        />
      ) : null}
      {load ? (
        <Ladder
          topTitle="Top 50"
          rows={load.measures ?? []}
          caption="The climb is the rest of this profit list. Profit is only the cut."
        />
      ) : null}
      <TechFoot credits={load?.credits} raw={load?.raw} />
    </div>
  );
}
