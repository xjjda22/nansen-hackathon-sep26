"use client";

import { BoardPicker, type BoardRow } from "@/components/board-picker";
import { CallNote } from "@/components/call-note";
import { labelOf, RawJson, recordRound, roundHit, RoundMark, StampPicker } from "@/components/play";
import { Status } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDesk, type Credits } from "@/components/use-desk";
import { QUARTER, TRADE_CHAINS } from "@/lib/constants";
import { useState } from "react";

const BETS = [
  { id: "ALSO_SOLD", label: "Also sold" },
  { id: "NONE", label: "None" },
  { id: "NO_TRADES", label: "No trades" },
  { id: "VOLUME_ABSENT", label: "Volume absent" },
];

type BuyResult = {
  verdict: "NO_TRADES" | "SOLD_VOLUME_ABSENT" | "COUNT";
  sentence: string;
  addresses: string[];
  counted: number;
  pageCut: boolean;
  credits: Credits;
  raw?: unknown;
};

type SellResult = {
  sentence: string;
  addresses: string[];
  rowCount: number;
  credits: Credits;
  raw?: unknown;
};

function stampOf(buy: BuyResult): string {
  if (buy.verdict === "NO_TRADES") return "NO_TRADES";
  if (buy.verdict === "SOLD_VOLUME_ABSENT") return "VOLUME_ABSENT";
  return buy.counted > 0 ? "ALSO_SOLD" : "NONE";
}

export function BothSidesForm() {
  const { pending, error, run } = useDesk();
  const [chain, setChain] = useState("ethereum");
  const [tokenAddress, setTokenAddress] = useState("");
  const [symbol, setSymbol] = useState("");
  const [bet, setBet] = useState("");
  const [buy, setBuy] = useState<BuyResult | null>(null);
  const [sell, setSell] = useState<SellResult | null>(null);

  function pick(row: BoardRow) {
    if (pending || buy) return;
    setChain(row.chain);
    setTokenAddress(row.tokenAddress);
    setSymbol(row.tokenSymbol);
  }

  async function onBuy(event: React.FormEvent) {
    event.preventDefault();
    if (!bet || buy) return;
    setSell(null);
    const data = await run<BuyResult>("/api/both-sides", { chain, tokenAddress, symbol, side: "BUY" });
    if (!data) return;
    recordRound(bet, stampOf(data), BETS, Boolean(data.credits.cached));
    setBuy(data);
  }

  async function onSell() {
    const data = await run<SellResult>("/api/both-sides", { chain, tokenAddress, symbol, side: "SELL" });
    if (!data) return;
    setSell(data);
  }

  function reset() {
    setBuy(null);
    setSell(null);
    setBet("");
  }

  const reveal = buy ? stampOf(buy) : "";

  return (
    <div className="space-y-5">
      <p className="rule-mark">
        {QUARTER}
        <small>Smaller side must be at least this share of the larger.</small>
      </p>
      <BoardPicker disabled={pending || Boolean(buy)} onPick={pick} />
      <form onSubmit={onBuy} className="space-y-3">
        <StampPicker label="Blotter bet" options={BETS} value={bet} disabled={pending || Boolean(buy)} onChange={setBet} />
        <label className="block text-sm font-semibold" htmlFor="trade-chain">
          Chain
        </label>
        <select
          id="trade-chain"
          value={chain}
          disabled={pending || Boolean(buy)}
          onChange={(event) => setChain(event.target.value)}
          className="field"
        >
          {TRADE_CHAINS.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <label className="block text-sm font-semibold" htmlFor="trade-address">
          Token address
        </label>
        <Input
          id="trade-address"
          value={tokenAddress}
          disabled={pending || Boolean(buy)}
          onChange={(event) => {
            setTokenAddress(event.target.value);
            setSymbol("");
          }}
          placeholder="0x… or a Solana mint"
          autoComplete="off"
          spellCheck={false}
        />
        {buy ? (
          <Button type="button" variant="line" onClick={reset}>
            New round
          </Button>
        ) : (
          <Button type="submit" disabled={pending || !bet} className="w-full sm:w-auto">
            {pending ? "Calling…" : "Call the buy page"}
          </Button>
        )}
      </form>
      {error ? <Status kind="error">{error}</Status> : null}
      {!buy && !error ? <Status kind="empty">Lock a stamp. A ticker with no address does not call.</Status> : null}
      {pending ? <Status kind="loading">One request is in flight.</Status> : null}
      {buy ? (
        <div className="space-y-4">
          <RoundMark hit={roundHit(bet, reveal, BETS)} you={labelOf(BETS, bet)} api={labelOf(BETS, reveal)} />
          {buy.verdict === "COUNT" ? (
            <p className="rule-mark">
              {buy.counted}
              <small>also sold</small>
            </p>
          ) : (
            <p className="stamp">{labelOf(BETS, reveal)}</p>
          )}
          <CallNote credits={buy.credits} />
          {buy.addresses.length > 0 ? (
            <ul className="space-y-1 break-all font-mono text-xs">
              {buy.addresses.map((address) => (
                <li key={address}>{address}</li>
              ))}
            </ul>
          ) : null}
          {buy.pageCut ? <p className="aside">Page cut.</p> : null}
          {buy.verdict === "COUNT" ? (
            <Button type="button" variant="line" disabled={pending} onClick={onSell}>
              {pending ? "Calling…" : "Call the sell page"}
            </Button>
          ) : (
            <Status kind="empty">Sell page stays closed.</Status>
          )}
          {sell ? (
            <div className="space-y-2">
              <p className="verdict">{sell.sentence}</p>
              <CallNote credits={sell.credits} />
              <RawJson value={sell.raw} />
            </div>
          ) : null}
          <RawJson value={buy.raw} />
        </div>
      ) : null}
    </div>
  );
}
