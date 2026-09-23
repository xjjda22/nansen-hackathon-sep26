"use client";

import { CallNote } from "@/components/call-note";
import { Status } from "@/components/status";
import { Button } from "@/components/ui/button";
import { useDesk, type Credits } from "@/components/use-desk";
import { formatUsd, type SectorSide } from "@/lib/rules";
import { useState } from "react";

type Weather = {
  sentence: string;
  entering: SectorSide | null;
  leaving: SectorSide | null;
  nothingLeaving: boolean;
  noWeather: boolean;
  unmapped: number;
  floorUsd: number;
  pageCut: boolean;
  sums: SectorSide[];
  credits: Credits;
};

export function SectorWeatherForm() {
  const { pending, error, run } = useDesk();
  const [weather, setWeather] = useState<Weather | null>(null);
  const [showSums, setShowSums] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const data = await run<Weather>("/api/sector-weather", {});
    if (!data) return;
    setWeather(data);
    setShowSums(false);
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="space-y-3">
        <p className="aside">
          There is no address box. A pasted contract does nothing here and costs nothing. Sectors are
          Nansen&apos;s <span className="font-mono">token_sectors</span> field.
        </p>
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Reading the board…" : "Read sector weather"}
        </Button>
      </form>
      {error ? <Status kind="error">{error}</Status> : null}
      {!weather && !error ? (
        <Status kind="empty">Sector weather has not been read. The button is one netflow call, five credits, cached for two minutes.</Status>
      ) : null}
      {pending ? <Status kind="loading">One request is in flight. The button stays off until it returns.</Status> : null}
      {weather ? (
        <div className="space-y-4">
          <p className="forecast">{weather.sentence}</p>
          <CallNote credits={weather.credits} />
          <dl className="hemispheres">
            <div className="hemisphere">
              <dt>Positive side</dt>
              <dd className="mt-1">{sideLine(weather.entering, weather.noWeather)}</dd>
            </div>
            <div className="hemisphere">
              <dt>Negative side</dt>
              <dd className="mt-1">
                {weather.nothingLeaving ? "Nothing is leaving." : sideLine(weather.leaving, weather.noWeather)}
              </dd>
            </div>
          </dl>
          <p className="aside">
            Unmapped rows: {weather.unmapped}. Floor on this page: {formatUsd(weather.floorUsd)}.
            {weather.pageCut ? " First page of 100 only." : " Last page."}
          </p>
          <Button type="button" variant="line" onClick={() => setShowSums((value) => !value)}>
            {showSums ? "Hide the sums" : "Show the sums"}
          </Button>
          {showSums ? (
            weather.sums.length === 0 ? (
              <Status kind="empty">No sector had a sum. Every row on the page was unmapped.</Status>
            ) : (
              <ul className="space-y-2 text-sm">
                {weather.sums.map((side) => (
                  <li key={side.sector} className="flex flex-wrap justify-between gap-2 border-b border-[#eadcc4] py-2">
                    <span>
                      {side.sector}
                      {side.oneToken ? " · one token, not a sector move" : ""}
                    </span>
                    <span>
                      {formatUsd(side.sumUsd)} · {side.topSymbol} on {side.topChain} · {Math.round(side.share * 1000) / 10}%
                    </span>
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function sideLine(side: SectorSide | null, noWeather: boolean) {
  if (noWeather || !side) return "No sector clears the floor.";
  if (side.oneToken) {
    return `${side.sector} · ${side.topSymbol} on ${side.topChain} is ${Math.round(side.share * 1000) / 10}% of the sum, so this is one token.`;
  }
  return `${side.sector} · ${side.topSymbol} on ${side.topChain} is ${Math.round(side.share * 1000) / 10}% of the sum.`;
}
