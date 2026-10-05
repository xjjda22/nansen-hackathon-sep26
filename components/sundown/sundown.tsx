"use client";

import { BoardForm } from "@/components/board-form";
import { CacheSwitch } from "@/components/credit-bar";
import { TraitQuest } from "@/components/holding-board";
import { Shown, useSetSimple, useSimpleOn } from "@/components/simple-mode";
import { Status } from "@/components/status";
import { useWalk } from "@/components/use-walk";
import { WalkIntro } from "@/components/walk-intro";
import {
  Mug,
  walletCount,
  wantedNote,
  type WantedFace,
} from "@/components/wanted-board";
import type { QuestSection, QuestTrait, SectionQuests } from "@/lib/rules";
import { formatUsd } from "@/lib/rules";
import { leadFigure, nansenTokenUrl } from "@/lib/token-ref";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import "./sundown.css";

const PHASES = ["dawn", "noon", "dusk", "night"] as const;
const WOOD = [
  "#a0522d",
  "#8b5a3c",
  "#b5793f",
  "#7a4b2a",
  "#c08a55",
  "#6f4e37",
  "#94643f",
];
const SURVEY_LOTS = 5;
/** How far a lot turns at the edge of the street view; lots in between turn in proportion, so the row reads as a curve. */
const MAX_TURN_DEG = 34;
/** How deep each building box runs, in px. */
const DEPTH = 48;

type Phase = (typeof PHASES)[number];
type QuestKind = "traits" | "insights";

function steps(section: QuestSection): number {
  return (section.table ? 1 : 0) + section.traits.length;
}

const HEIGHTS = [150, 190, 130, 170, 140, 180];

function firstTrait(pair: SectionQuests): QuestTrait | null {
  return pair.traits.traits[0] ?? null;
}

/** The day runs with the open quest: dawn when it opens, night once every line is read. */
function phaseOf(done: number, total: number): Phase {
  if (total === 0) return "dawn";
  return PHASES[
    Math.min(PHASES.length - 1, Math.floor((done / total) * PHASES.length))
  ]!;
}

function signOf(title: string): string {
  return title.split(" · ")[0] ?? title;
}

function woodOf(seed: string): string {
  let value = 0;
  for (let index = 0; index < seed.length; index += 1)
    value = (value * 31 + seed.charCodeAt(index)) >>> 0;
  return WOOD[value % WOOD.length]!;
}

export function Sundown({
  fontClass,
  boardOpenAtStart = false,
}: {
  fontClass: string;
  boardOpenAtStart?: boolean;
}) {
  const { pairs, wanted, error } = useWalk();
  const simple = useSimpleOn();
  const setSimple = useSetSimple();
  const [pick, setPick] = useState<{ id: string; kind: QuestKind } | null>(
    null,
  );
  const [done, setDone] = useState(0);
  const [finished, setFinished] = useState<string[]>([]);
  const [boardOpen, setBoardOpen] = useState(boardOpenAtStart);

  const chosen = pairs?.find((pair) => pair.id === pick?.id) ?? pairs?.[0];
  const kind = pick?.kind ?? "traits";
  const section = chosen
    ? kind === "traits"
      ? chosen.traits
      : chosen.insights
    : null;
  const total = section ? steps(section) : 0;
  const phase = phaseOf(done, total);
  const lead = pairs?.[0] ? firstTrait(pairs[0]) : null;
  const leadNumber = lead ? leadFigure(lead.line) : null;

  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    if (frame.current != null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      root.current?.style.setProperty("--mx", (x * 2).toFixed(3));
      root.current?.style.setProperty("--my", (y * 2).toFixed(3));
    });
  };
  const row = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const street = row.current;
    if (!street) return;
    let pending: number | null = null;
    const turn = () => {
      pending = null;
      const box = street.getBoundingClientRect();
      const centre = box.left + box.width / 2;
      const half = Math.max(box.width / 2, 1);
      for (const lot of street.querySelectorAll<HTMLElement>(".sd-lot")) {
        const rect = lot.getBoundingClientRect();
        const offset = (rect.left + rect.width / 2 - centre) / half;
        const degrees = Math.max(-1, Math.min(1, offset)) * MAX_TURN_DEG;
        lot.style.setProperty("--tilt", `${degrees.toFixed(1)}deg`);
      }
    };
    const schedule = () => {
      if (pending == null) pending = requestAnimationFrame(turn);
    };
    turn();
    street.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      street.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (pending != null) cancelAnimationFrame(pending);
    };
  }, [pairs]);

  const tray = useRef<HTMLElement>(null);
  const openLead = (id: string) => {
    choose(id, "traits");
    tray.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const choose = (id: string, next: QuestKind) => {
    setPick({ id, kind: next });
    setDone(0);
  };
  const onProgress = (count: number, of: number) => {
    setDone(count);
    if (count < of || !chosen) return;
    const key = `${chosen.id}:${kind}`;
    setFinished((current) =>
      current.includes(key) ? current : [...current, key],
    );
  };

  return (
    <div ref={root} className={`sd ${fontClass}`} onPointerMove={onPointerMove}>
      <div className="sd-world" data-phase={phase}>
        <div className="sd-sky" />
        <div className="sd-sun" />
        <div className="sd-stars" />
      </div>

      <header className="sd-hud">
        <Coin />
        <div className="sd-brand">
          <span className="sd-brand-name">Dry Creek</span>
          <span className="sd-brand-day">After 50 · {phase}</span>
        </div>
        <dl className="sd-pills">
          <Pill
            label="Lines read"
            value={section ? `${Math.min(done, total)}/${total}` : "…"}
          />
          <Pill
            label="Quests done"
            value={pairs ? `${finished.length}/${pairs.length * 2}` : "…"}
          />
        </dl>
        <div className="sd-hud-actions">
          <button
            type="button"
            className="sd-btn sd-btn-toggle"
            aria-pressed={simple}
            onClick={() => setSimple(!simple)}
          >
            Simple {simple ? "on" : "off"}
          </button>
          <button
            type="button"
            className="sd-btn sd-btn-go"
            aria-expanded={boardOpen}
            onClick={() => setBoardOpen(!boardOpen)}
          >
            Sheriff&rsquo;s board
          </button>
        </div>
      </header>

      <div className="sd-banner-row">
        {lead && pairs?.[0] ? (
          <button
            type="button"
            className="sd-banner"
            onClick={() => openLead(pairs[0]!.id)}
            title="Open this line in the tray"
          >
            <span className="sd-banner-kicker">
              <Shown text={signOf(pairs[0].title)} />
            </span>
            <span className="sd-banner-title">
              <Shown text={lead.title} />
            </span>
            {leadNumber ? <span className="sd-banner-figure">{leadNumber}</span> : null}
          </button>
        ) : null}
      </div>

      <main className="sd-street" aria-label="Main street" data-phase={phase}>
        <svg
          className="sd-mesa sd-mesa-far"
          viewBox="0 0 1600 300"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 300 L0 190 L120 190 L150 150 L310 150 L340 190 L520 200 L560 120 L700 120 L730 180 L980 190 L1010 140 L1180 140 L1220 200 L1400 190 L1440 160 L1600 160 L1600 300 Z" />
        </svg>
        <svg
          className="sd-mesa sd-mesa-near"
          viewBox="0 0 1600 300"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 300 L0 240 L200 230 L240 200 L380 200 L410 240 L760 250 L820 215 L900 215 L940 250 L1300 240 L1330 210 L1450 210 L1480 245 L1600 240 L1600 300 Z" />
        </svg>
        <div ref={row} className="sd-row">
          {pairs
            ? pairs.map((pair, index) => {
                const lit = [`${pair.id}:traits`, `${pair.id}:insights`].filter(
                  (key) => finished.includes(key),
                ).length;
                const trait = firstTrait(pair);
                const figure = trait ? leadFigure(trait.line) : null;
                return (
                    <button
                      key={pair.id}
                      type="button"
                      className="sd-lot"
                      aria-pressed={pair.id === chosen?.id}
                      aria-label={`${pair.title}. ${trait ? `${trait.title}${figure ? `: ${figure}` : ""}. ` : ""}${lit} of 2 quests read`}
                      onClick={() => choose(pair.id, "traits")}
                    >
                      <span className="sd-rig">
                        {trait ? (
                          <span className="sd-placard">
                            {figure ? <strong>{figure}</strong> : null}
                            <span>{trait.title}</span>
                          </span>
                        ) : null}
                        <Building
                          sign={signOf(pair.title)}
                          seed={pair.id}
                          height={HEIGHTS[index % HEIGHTS.length]!}
                          lit={lit}
                        />
                      </span>
                    </button>
                );
              })
            : Array.from({ length: SURVEY_LOTS }, (_, index) => (
                <div key={index} className="sd-lot sd-lot-open">
                  <Stake />
                  <span>{error ? "No survey" : "Surveying"}</span>
                </div>
              ))}
        </div>
        <div className="sd-boardwalk" />
        <div className="sd-road" aria-hidden="true" />
      </main>

      <footer ref={tray} className="sd-tray">
        <WalkIntro className="walk-intro sd-intro" />
        <div className="sd-tray-head">
          <h2>{chosen ? <Shown text={chosen.title} /> : "The walk"}</h2>
          <p>
            <Shown
              text={
                kind === "traits"
                  ? "Traits: the top of the page next to the rest. The comparison table comes after the lines."
                  : "Insights: two deeper groups next to each other."
              }
            />
          </p>
        </div>
        {error ? <Status kind="error">{error}</Status> : null}
        {!pairs && !error ? (
          <Status kind="loading">Four requests, one walk.</Status>
        ) : null}
        {pairs && pairs.length === 0 ? (
          <Status kind="error">
            The four pages came back with no gap to walk.
          </Status>
        ) : null}
        {chosen && section ? (
          <div className="sd-tray-grid">
            <section className="sd-paper">
              <div className="sd-tabs" role="tablist" aria-label="Quest">
                {(["traits", "insights"] as const).map((option) => {
                  const count =
                    option === "traits"
                      ? chosen.traits.traits.length
                      : chosen.insights.traits.length;
                  return (
                    <button
                      key={option}
                      type="button"
                      role="tab"
                      aria-selected={kind === option}
                      data-done={finished.includes(`${chosen.id}:${option}`)}
                      onClick={() => choose(chosen.id, option)}
                    >
                      {option === "traits" ? "Traits" : "Insights"} ({count})
                    </button>
                  );
                })}
              </div>
              {section.traits.length === 0 && !section.table ? (
                <p>
                  <Shown text="No insight cleared the cut on this page." />
                </p>
              ) : (
                <TraitQuest
                  key={`${chosen.id}-${kind}`}
                  sections={[section]}
                  title={kind === "traits" ? "Traits" : "Insights"}
                  hideSections
                  tableLast
                  onProgress={onProgress}
                />
              )}
            </section>
            {wanted.length > 0 ? <WantedPost faces={wanted} /> : null}
          </div>
        ) : null}
        <p className="sd-foot">
          Powered by the Nansen API: netflow, leaderboard, DEX trades, holdings.{" "}
          <CacheSwitch className="sd-cache" />
        </p>
      </footer>

      {boardOpen ? (
        <aside className="sd-board" aria-label="Sheriff's board">
          <header>
            <div>
              <p className="sd-board-kicker">Board</p>
              <h2>
                <Shown text="Check a name" />
              </h2>
            </div>
            <button
              type="button"
              className="sd-x"
              aria-label="Close"
              onClick={() => setBoardOpen(false)}
            >
              ×
            </button>
          </header>
          <p className="sd-board-lede">
            <Shown text="Enter up to five symbols or addresses. Each name is a short walk across netflow, holdings, today's tape, and the names the top wallets traded. Traits only." />
          </p>
          <BoardForm initialQuery="" />
        </aside>
      ) : null}
    </div>
  );
}

function shortFlow(flow24hUsd: number | null): string {
  if (flow24hUsd == null) return "Off netflow";
  return `${flow24hUsd > 0 ? "+" : ""}${formatUsd(flow24hUsd)} 24h`;
}

function WantedPost({ faces }: { faces: WantedFace[] }) {
  return (
    <aside className="sd-wanted" aria-label={`Wanted. ${wantedNote(faces)}`}>
      <div className="sd-wanted-rig">
        <div className="sd-noticeboard">
          <span className="sd-noticeboard-head">Wanted</span>
          <ul>
            {faces.map((face) => (
              <li key={`${face.chain}-${face.address}`}>
                <a
                  className="sd-mini-poster"
                  href={nansenTokenUrl(face.chain, face.address)}
                  target="_blank"
                  rel="noreferrer"
                  title={`${face.symbol} on ${face.chain}: ${walletCount(face.holders)}, ${shortFlow(face.flow24hUsd)}. Opens Nansen.`}
                >
                  <Mug face={face} size={48} className="sd-mini-mug" />
                  <strong>{face.symbol}</strong>
                  <span>{walletCount(face.holders)}</span>
                  <em data-off={face.flow24hUsd == null}>
                    {shortFlow(face.flow24hUsd)}
                  </em>
                </a>
              </li>
            ))}
          </ul>
          <p className="sd-noticeboard-note">{wantedNote(faces)}</p>
        </div>
        <span className="sd-noticeboard-legs" aria-hidden="true" />
      </div>
    </aside>
  );
}

/** A gold coin turning in the HUD. Layers stacked in depth make its rim. */
function Coin() {
  return (
    <span className="sd-coin" aria-hidden="true">
      <span className="sd-coin-spin">
        {Array.from({ length: 6 }, (_, index) => (
          <span
            key={index}
            className="sd-coin-rim"
            style={{ transform: `translateZ(${index - 2.5}px)` }}
          />
        ))}
        <span className="sd-coin-face sd-coin-front">50</span>
        <span className="sd-coin-face sd-coin-back">★</span>
      </span>
    </span>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="sd-pill">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Stake() {
  return (
    <svg viewBox="0 0 60 70" className="sd-stake" aria-hidden="true">
      <rect x="27" y="22" width="6" height="48" />
      <rect x="6" y="6" width="48" height="24" rx="2" />
      <text x="30" y="22" textAnchor="middle">
        SURVEY
      </text>
    </svg>
  );
}

/** Each finished quest lights another set of windows. */
function Building({
  sign,
  seed,
  height,
  lit,
}: {
  sign: string;
  seed: string;
  height: number;
  lit: number;
}) {
  const floors = height >= 170 ? 2 : 1;
  const wood = woodOf(seed);
  const bodyTop = 30;
  const doorTop = height - 44;
  const band = (doorTop - bodyTop - 44) / floors;
  const box = {
    "--wood": wood,
    "--body": `${height - bodyTop}px`,
    "--depth": `${DEPTH}px`,
  } as CSSProperties;
  return (
    <span className="sd-box" style={box}>
      <span className="sd-face sd-face-left" aria-hidden="true" />
      <span className="sd-face sd-face-right" aria-hidden="true" />
      <span className="sd-face sd-face-roof" aria-hidden="true" />
      <svg
        className="sd-building"
        viewBox={`0 0 170 ${height}`}
        width={170}
        height={height}
        aria-hidden="true"
      >
        <rect x="40" y="0" width="90" height="34" fill={wood} />
        <rect
          x="10"
          y={bodyTop}
          width="150"
          height={height - bodyTop}
          fill={wood}
        />
        <rect
          x="10"
          y={bodyTop}
          width="150"
          height={height - bodyTop}
          fill="url(#sd-grain)"
          opacity="0.25"
        />
        <rect x="18" y="8" width="134" height="30" rx="2" className="sd-sign" />
        <text
          x="85"
          y="29"
          textAnchor="middle"
          className="sd-sign-text"
          textLength={sign.length > 10 ? 120 : undefined}
          lengthAdjust="spacingAndGlyphs"
        >
          {sign}
        </text>
        {Array.from({ length: floors }, (_, floor) =>
          [30, 74, 118].map((x, column) => (
            <rect
              key={`${floor}-${x}`}
              x={x}
              y={bodyTop + 22 + floor * band + (band - 26) / 2}
              width="22"
              height="26"
              className="sd-window"
              data-lit={lit === 2 || (lit === 1 && column !== 1)}
            />
          )),
        )}
        <rect
          x="4"
          y={doorTop - 10}
          width="162"
          height="7"
          className="sd-awning"
        />
        <rect
          x="10"
          y={doorTop - 3}
          width="5"
          height={height - doorTop + 3}
          className="sd-post"
        />
        <rect
          x="155"
          y={doorTop - 3}
          width="5"
          height={height - doorTop + 3}
          className="sd-post"
        />
        <rect
          x="71"
          y={doorTop + 4}
          width="28"
          height={40}
          className="sd-door"
        />
        <defs>
          <pattern
            id="sd-grain"
            width="170"
            height="8"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="7.5"
              x2="170"
              y2="7.5"
              stroke="#000"
              strokeWidth="1"
            />
          </pattern>
        </defs>
      </svg>
    </span>
  );
}
