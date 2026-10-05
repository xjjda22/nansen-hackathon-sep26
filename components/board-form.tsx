"use client";

import { Status } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { publishCredits, type Credits } from "@/components/use-desk";
import { loadHoldings, TraitQuest } from "@/components/holding-board";
import { loadTape } from "@/components/print-board";
import { loadTraders } from "@/components/trader-board";
import { TokenFace } from "@/components/token-mark";
import { probeQuest, type HoldMark, type QuestSection } from "@/lib/rules";
import { boardSuggestions, type Suggestion } from "@/lib/suggest";
import { deskFetch } from "@/lib/static-desk";
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
        const response = await deskFetch("/api/netflow", {
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
  const [holds, setHolds] = useState<HoldMark[]>([]);

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("q");
    if (raw) setProbe(raw);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadBoard().then((outcome) => {
      if (cancelled) return;
      setLoad(outcome.data);
      setLoadError(outcome.error);
    });
    loadHoldings().then((outcome) => {
      if (!cancelled) setHolds(outcome.data?.marks ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function onProbe(event: React.FormEvent) {
    event.preventDefault();
    runProbe(probe);
  }

  function pickSuggestion(item: Suggestion) {
    const query = /^[A-Za-z0-9.]+$/.test(item.symbol) ? item.symbol : item.address;
    setProbe(query);
    runProbe(query);
  }

  function runProbe(query: string) {
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
        query,
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
      {load ? <Suggestions flow={load.rows} holds={holds} onPick={pickSuggestion} /> : null}
      {probeError ? <Status kind="error">{probeError}</Status> : null}
      {loadError ? <Status kind="error">{loadError}</Status> : null}
      {!load && !loadError ? <Status kind="loading">One request is in flight.</Status> : null}
      {probeNote ? <p>{probeNote}</p> : null}
      {probeSections && probeSections.length > 0 ? <TraitQuest sections={probeSections} title="Your names" /> : null}
    </div>
  );
}

function Suggestions({ flow, holds, onPick }: { flow: PickRow[]; holds: HoldMark[]; onPick: (item: Suggestion) => void }) {
  const { offBook, held } = boardSuggestions(flow, holds);
  if (offBook.length + held.length === 0) return null;
  return (
    <section className="board-suggest" aria-label="Names to try">
      <p className="board-suggest-title">Try one of these</p>
      <SuggestionRow label="On the move, off the book" items={offBook} onPick={onPick} />
      <SuggestionRow label="Most held" items={held} onPick={onPick} />
    </section>
  );
}

function SuggestionRow({ label, items, onPick }: { label: string; items: Suggestion[]; onPick: (item: Suggestion) => void }) {
  if (items.length === 0) return null;
  return (
    <div className="board-suggest-row">
      <span className="board-suggest-label">{label}</span>
      <ul>
        {items.map((item) => (
          <li key={`${item.chain}-${item.address}`}>
            <button type="button" className="token-chip board-suggest-chip" onClick={() => onPick(item)} title={`Check ${item.symbol} on ${item.chain}`}>
              <TokenFace symbol={item.symbol} chain={item.chain} address={item.address} />
              <small>{item.why}</small>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
