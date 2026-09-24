"use client";

import { CallNote } from "@/components/call-note";
import { Status } from "@/components/status";
import { Button } from "@/components/ui/button";
import { useDesk, type Credits } from "@/components/use-desk";
import { formatUsd } from "@/lib/rules";
import { useState } from "react";

type Named = { chain: string; gasUsd: number | null; missing?: boolean };

type Gas = {
  verdict: "GAS_MISSING" | "MAINNET_STILL_BURNS_MOST" | "L2_BURNS_MOST";
  leader: string | null;
  sentence: string;
  named: Named[];
  credits: Credits;
};

export function GasLeadForm() {
  const { pending, error, run } = useDesk();
  const [result, setResult] = useState<Gas | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const data = await run<Gas>("/api/gas-lead", {});
    if (!data) return;
    setResult(data);
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit}>
        <p className="aside mb-3">
          No token box. One chain-rank call, EVM chains, seven days. This is not a gwei estimate and
          it does not say Ethereum is expensive.
        </p>
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Reading chain rank…" : "See who pays the gas"}
        </Button>
      </form>
      {error ? <Status kind="error">{error}</Status> : null}
      {!result && !error ? (
        <Status kind="empty">Gas has not been read. The button is one credit, cached for two minutes.</Status>
      ) : null}
      {pending ? <Status kind="loading">One request is in flight. The button stays off until it returns.</Status> : null}
      {result ? (
        <div className="space-y-3">
          <p className="stamp">{result.verdict.replaceAll("_", " ")}</p>
          <p className="verdict">{result.sentence}</p>
          <CallNote credits={result.credits} />
          <ul className="space-y-2">
            {result.named.map((row) => (
              <li key={row.chain} className="ticket text-sm">
                <span className="font-semibold">{row.chain}</span>
                {row.missing
                  ? " was not on the page."
                  : row.gasUsd === null
                    ? " gas USD was null."
                    : ` ${formatUsd(row.gasUsd)}`}
                {result.leader?.toLowerCase() === row.chain.toLowerCase() ? " · leads" : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
