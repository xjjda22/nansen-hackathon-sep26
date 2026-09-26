"use client";

import { TechFoot } from "@/components/desk";
import { Ladder } from "@/components/ladder";
import { SplitReadout } from "@/components/split-readout";
import { Status } from "@/components/status";
import { loadTraders } from "@/components/trader-board";
import { publishCredits, type Credits } from "@/components/use-desk";
import { buyComparisons, printMeasures, type DexBuy, type TokenMeasure, type TraderRead } from "@/lib/rules";
import { useEffect, useState } from "react";

type Tape = {
  buys: DexBuy[];
  isLastPage: boolean;
  credits: Credits;
  raw?: unknown;
};

let tapeLoad: Promise<{ data: Tape | null; error: string | null }> | null = null;

export function loadTape(): Promise<{ data: Tape | null; error: string | null }> {
  if (!tapeLoad) {
    tapeLoad = (async () => {
      try {
        const response = await fetch("/api/dex-trades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        const data = (await response.json()) as Tape & { ok?: boolean; error?: string };
        if (data.credits) publishCredits(data.credits);
        if (!response.ok || data.ok === false || !Array.isArray(data.buys)) {
          return { data: null, error: data.error ?? "The desk could not complete that." };
        }
        return { data, error: null };
      } catch {
        return { data: null, error: "The request failed before a result came back." };
      }
    })();
  }
  return tapeLoad;
}

export function PrintBoard() {
  const [read, setRead] = useState<TraderRead | null>(null);
  const [measures, setMeasures] = useState<TokenMeasure[]>([]);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [raw, setRaw] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadTraders(), loadTape()]).then(([traders, tape]) => {
      if (cancelled) return;
      if (tape.error || !tape.data) {
        setError(tape.error ?? "The print page could not be read.");
        return;
      }
      setCredits(tape.data.credits);
      setRaw(tape.data.raw);
      const addresses = traders.data?.topAddresses ?? [];
      setRead(buyComparisons(addresses, tape.data.buys, tape.data.isLastPage));
      setMeasures(printMeasures(addresses, tape.data.buys));
      if (traders.error && addresses.length === 0) setError(traders.error);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const compared = read != null && read.common.length + read.meaningful.length > 0;
  return (
    <div className="space-y-5">
      {error ? <Status kind="error">{error}</Status> : null}
      {!read && !error ? <Status kind="loading">One request is in flight.</Status> : null}
      {read ? (
        <SplitReadout
          frame={read.frame}
          common={read.common}
          meaningful={read.meaningful}
          unscored={read.unscored}
          compared={compared}
        />
      ) : null}
      {read ? (
        <Ladder
          topTitle="Top 50"
          rows={measures}
          caption="The climb is the other wallets on today's tape. Age and cap are at the buy."
        />
      ) : null}
      <TechFoot credits={credits} raw={raw} />
    </div>
  );
}
