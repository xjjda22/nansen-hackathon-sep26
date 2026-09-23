"use client";

import { Status } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDesk, type Credits } from "@/components/use-desk";
import { formatUsd } from "@/lib/rules";
import { useState } from "react";

type Hit = {
  chain: string;
  tokenAddress: string;
  tokenSymbol: string;
  netFlow24hUsd: number;
  larger: boolean;
};

type TwoChains = {
  status: "absent" | "once" | "several";
  sentence: string;
  rows: Hit[];
  tied: boolean;
  floorUsd: number;
  pageCut: boolean;
  credits: Credits;
};

export function TwoChainsForm() {
  const { pending, error, run } = useDesk();
  const [symbol, setSymbol] = useState("");
  const [result, setResult] = useState<TwoChains | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const data = await run<TwoChains>("/api/two-chains", { symbol });
    if (!data) return;
    setResult(data);
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-sm font-semibold" htmlFor="symbol">
          One symbol
        </label>
        <Input
          id="symbol"
          value={symbol}
          onChange={(event) => setSymbol(event.target.value)}
          placeholder="PEPE"
          autoComplete="off"
        />
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Reading the board…" : "Check the symbol"}
        </Button>
      </form>
      <p className="text-sm leading-relaxed text-[#5c4632]">
        Exact symbol. ETH does not match WETH. Rows under 1% of the largest absolute 24h flow on the
        page are ignored. Stables and native gas tokens stay excluded.
      </p>
      {error ? <Status kind="error">{error}</Status> : null}
      {!result && !error ? <Status kind="empty">No symbol yet. The call runs when you submit.</Status> : null}
      {pending ? <Status kind="loading">One request is in flight. The button stays off until it returns.</Status> : null}
      {result ? (
        <div className="space-y-3">
          <p className="text-lg leading-relaxed">{result.sentence}</p>
          <p className="text-sm text-[#5c4632]">Floor on this page: {formatUsd(result.floorUsd)}.</p>
          {result.rows.length === 0 ? (
            <Status kind="empty">No row for that symbol cleared the floor on this page.</Status>
          ) : (
            <ul className="space-y-2">
              {result.rows.map((row) => (
                <li key={`${row.chain}:${row.tokenAddress}`} className="rounded-sm border border-[#e4d3b6] p-3 text-sm">
                  <p className="font-semibold">
                    {row.tokenSymbol} · {row.chain}
                    {row.larger ? " · larger absolute" : ""}
                    {result.tied && row.larger ? " · tied" : ""}
                  </p>
                  <p>24h net flow {formatUsd(row.netFlow24hUsd)}</p>
                  <p className="mt-1 break-all font-mono text-xs text-[#5c4632]">{row.tokenAddress}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
