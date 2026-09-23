"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Status } from "@/components/status";
import { formatUsd } from "@/lib/rules";
import { useMemo, useState } from "react";

export type BoardRow = {
  chain: string;
  tokenAddress: string;
  tokenSymbol: string;
  netFlow24hUsd: number;
};

export function BoardPicker({
  disabled,
  onPick,
}: {
  disabled: boolean;
  onPick: (row: BoardRow) => void;
}) {
  const [rows, setRows] = useState<BoardRow[] | null>(null);
  const [ready, setReady] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (pending || disabled) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/board");
      const data = (await response.json()) as { ready?: boolean; rows?: BoardRow[]; error?: string };
      if (!response.ok) {
        setError(data.error ?? "The cached board could not be read.");
        setRows(null);
        setReady(false);
        return;
      }
      setReady(Boolean(data.ready));
      setRows(data.rows ?? []);
    } catch {
      setError("The cached board could not be read.");
    } finally {
      setPending(false);
    }
  }

  const shown = useMemo(() => {
    if (!rows) return [];
    const query = filter.trim().toUpperCase();
    if (!query) return rows.slice(0, 12);
    return rows.filter((row) => row.tokenSymbol.toUpperCase().includes(query)).slice(0, 12);
  }, [rows, filter]);

  return (
    <div className="space-y-3">
      <Button type="button" variant="line" disabled={disabled || pending} onClick={load}>
        {pending ? "Checking the cache…" : "Show cached board rows"}
      </Button>
      {error ? <Status kind="error">{error}</Status> : null}
      {ready === false && !error ? (
        <Status kind="empty">
          The board is not in cache. Read sector weather, or submit a symbol on the two-chain desk.
          Those are the netflow calls. This button does not spend a credit.
        </Status>
      ) : null}
      {ready && rows ? (
        <div className="space-y-2">
          <label className="block text-sm text-[#5c4632]" htmlFor="board-filter">
            Filter the cached page by symbol
          </label>
          <Input
            id="board-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="PEPE"
          />
          {shown.length === 0 ? (
            <Status kind="empty">No cached row matches that filter.</Status>
          ) : (
            <ul className="max-h-64 space-y-2 overflow-auto">
              {shown.map((row) => (
                <li key={`${row.chain}:${row.tokenAddress}`}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onPick(row)}
                    className="w-full rounded-sm border border-[#e4d3b6] px-3 py-2 text-left text-sm hover:border-rust disabled:opacity-50"
                  >
                    <span className="font-semibold">{row.tokenSymbol}</span>
                    <span className="text-[#5c4632]"> · {row.chain} · {formatUsd(row.netFlow24hUsd)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
