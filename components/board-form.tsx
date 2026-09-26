"use client";

import { Status } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { publishCredits, type Credits } from "@/components/use-desk";
import { loadHoldings, TraitQuest } from "@/components/holding-board";
import { loadTape } from "@/components/print-board";
import { loadTraders } from "@/components/trader-board";
import { probeQuest, type QuestSection } from "@/lib/rules";
import { useEffect, useState } from "react";

type PickRow = {
  chain: string;
  tokenAddress: string;
  tokenSymbol: string;
  netFlow1hUsd: number | null;
  netFlow24hUsd: number;
  netFlow7dUsd: number | null;
  netFlow30dUsd: number | null;
  traderCount: number | null;
  tokenAgeDays: number | null;
  marketCapUsd: number | null;
  sectors: string[];
};

type BoardResult = {
  rows: PickRow[];
  credits: Credits;
};

let boardLoad: Promise<{ data: BoardResult | null; error: string | null }> | null = null;

function loadBoard(): Promise<{ data: BoardResult | null; error: string | null }> {
  if (!boardLoad) {
    boardLoad = (async () => {
      try {
        const response = await fetch("/api/netflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ book: "", symbol: "" }),
        });
        const data = (await response.json()) as BoardResult & { ok?: boolean; error?: string };
        if (data.credits) publishCredits(data.credits);
        if (!response.ok || data.ok === false) {
          return { data: null, error: data.error ?? "The desk could not complete that." };
        }
        return { data, error: null };
      } catch {
        return { data: null, error: "The request failed before a result came back." };
      }
    })();
  }
  return boardLoad;
}

function asFlow(rows: PickRow[]) {
  return rows.map((row) => ({ ...row, tokenSectors: row.sectors }));
}

export function BoardForm({ initialQuery }: { initialQuery: string }) {
  const [probe, setProbe] = useState(initialQuery);
  const [probeNote, setProbeNote] = useState<string | null>(null);
  const [probeSections, setProbeSections] = useState<QuestSection[] | null>(null);
  const [probeError, setProbeError] = useState<string | null>(null);
  const [load, setLoad] = useState<BoardResult | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadBoard().then((outcome) => {
      if (cancelled) return;
      setLoad(outcome.data);
      setLoadError(outcome.error);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function onProbe(event: React.FormEvent) {
    event.preventDefault();
    if (!load) return;
    setProbeError(null);
    setProbeSections(null);
    Promise.all([loadTraders(), loadTape(), loadHoldings()]).then(([traders, tape, holds]) => {
      const missing = [traders.error, tape.error, holds.error].filter((item): item is string => item != null);
      if (missing.length === 3) {
        setProbeError(missing[0] ?? "The other pages did not load.");
        return;
      }
      const read = probeQuest({
        query: probe,
        flow: asFlow(load.rows),
        holds: holds.data?.marks ?? [],
        buys: tape.data?.buys ?? [],
        traded: traders.data?.tradedKeys ?? [],
        keyKind: traders.data?.keyKind ?? null,
      });
      setProbeNote(read.note);
      setProbeSections(read.sections);
    });
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onProbe} className="space-y-3">
        <label className="block text-sm font-semibold" htmlFor="probe">
          Up to five tokens or addresses
        </label>
        <Input
          id="probe"
          value={probe}
          disabled={!load}
          onChange={(event) => setProbe(event.target.value)}
          placeholder="PEPE, So111…, 0x…"
          autoComplete="off"
          spellCheck={false}
        />
        <Button type="submit" disabled={!load} className="w-full sm:w-auto">
          Read traits
        </Button>
      </form>
      {probeError ? <Status kind="error">{probeError}</Status> : null}
      {loadError ? <Status kind="error">{loadError}</Status> : null}
      {!load && !loadError ? <Status kind="loading">One request is in flight.</Status> : null}
      {probeNote ? <p>{probeNote}</p> : null}
      {probeSections && probeSections.length > 0 ? <TraitQuest sections={probeSections} title="Your names" /> : null}
    </div>
  );
}
