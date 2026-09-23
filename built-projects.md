---
cursor:
  subagentId: "bc-a6762e25-44f8-5cfc-ab9f-750809a4823c"
---

# Eight Meridian builds, checked against the live page and the code

Checked 23 Sep 2026. Live pages and public GitHub were opened. Nansen itself was not called. No API keys were read out of env files or printed. Where a page only renders after its own server calls Nansen, that readout was left unloaded and the note says so.

Verified means it was on the live page, in a committed source file, or on a public post. Guess means it was not.

## 1. @bykaralord — Nansen Time Machine

A point-in-time trading drill. You pick one of 250 historical Ethereum snapshots, see the Nansen flows that belong to that date, lock BUY, PASS, or SHORT, and only then get the +1d / +7d / +30d price. The live site is [nansen-time-machine.onrender.com](https://nansen-time-machine.onrender.com/). The repo is [bykaralord25/nansen-time-machine](https://github.com/bykaralord25/nansen-time-machine).

**Nansen data the code actually uses.** The dataset builder plans exactly 1,000 calls: 25 tokens × 10 dates × 4 calls. One call is `POST /api/v1beta1/tgm/historical-token-flow-summary` for the 7 days ending on the snapshot date. The other three are `POST /api/v1/tgm/token-ohlcv` (daily): the 7 days before the date, the 7 days after, and day 8 through day 30. The scenario builder reads `smart_trader_net_flow_usd`, `whale_net_flow_usd`, `top_pnl_net_flow_usd`, and `exchange_net_flow_usd`, then a composite weighted 35% / 25% / 25% / 15% with the exchange sign flipped. The public Flask app never calls Nansen. `GET /health` on the live host returned `{"dataset":"production.json","ok":true,"scenarios":250}`. `GET /api/scenarios` returned those 250 rows and omitted `future` and `answer_note`. The committed `production.json` has the futures. Symbols: 1INCH, AAVE, APE, BAL, COMP, CRV, ENA, ENS, GRT, IMX, LDO, LINK, MANA, ONDO, PENDLE, PEPE, RPL, SAND, SHIB, SNX, SUSHI, UNI, WBTC, WETH, YFI. Dates: the 15th of each month from 2025-10-15 through 2026-07-15, all `ethereum`. AAVE on 2025-10-15 is in that file as Strong Accumulation 100/100, entry 242.46, and a 7-day close that is −10.61%.

**What the demo lets you do.** The landing page loaded with the four flow slots, a 0–100 signal, BUY / PASS / SHORT, “Lock decision & reveal future,” and “Next snapshot.” Trader DNA starts at 0 decisions. A round is: pick a cached snapshot, decide, reveal, get a decision score, and accumulate a session profile. Local play needs no key.

**Gap.** The answer key ships in the public repo. The list API hides the future, and `production.json` contains every future price. Raw Nansen responses and the call ledger are not in the repo, so the “1,000 calls” figure is the plan plus a derived file.

## 2. @cifreXnet — Polygraph

A divergence meter for BTC, ETH, and SOL. One needle is what Polymarket prices imply. Six other needles are Nansen cohort flows in the spot token. The gap is scored ALIGNED, TENSION, or DECEPTION, and DECEPTION is allowed only at high confidence. Live: [polygraph-ochre.vercel.app](https://polygraph-ochre.vercel.app/). Repo: [bek01/polygraph](https://github.com/bek01/polygraph). The GitHub account is `bek01`.

**Nansen data the code actually uses.** The live snapshot in `src/lib/polygraph.ts` calls three endpoints per asset: `prediction-market/market-screener` (active markets, ordered by `volume_1wk`), `tgm/token-ohlcv` (1h candles, 3 days, for spot), and `tgm/flow-intelligence` at `1d` and `7d`. Three assets × those calls is the “12 Nansen calls” the refresh button documents. The backfill script and `data/backfill-report.json` add the calibration corpus: 1,219 calls from 2026-09-15T22:55Z to 22:59Z, 3 errors, 3,580 observations. Breakdown: `prediction-market/ohlcv` 982, `top-holders` 66, `pnl-by-market` 62, `trades-by-market` 61, `market-screener` 21, `tgm/flow-intelligence` 18, `tgm/token-ohlcv` 9. Informed stance weights Top PnL 0.40, Smart Traders 0.35, Whales 0.25, each normalized to its own 7-day pace. The README also lists `smart-money/netflow`. That path appears in the README, in `docs/API-NOTES.md`, and as a type comment in `src/lib/types.ts`. No application or backfill file calls it.

**What the demo lets you do.** The live HTML is the product shell: the lie-detector pitch, a client readout, asset switcher, verdict stamp, cohort table, crowd ladder, calibration panel, and a refresh that bypasses cache. The page tells the browser to pull `/api/polygraph`, which calls Nansen, so that readout was not loaded. A cold `GET /api/stats` returned `apiCallsThisInstance: 0` and pointed at the committed backfill log. Serverless instances do not keep the cumulative counter. Calibration is served from the committed corpus unless `?live=1` is set on `/api/backtest`.

**Gap.** It compares a prediction-market crowd to spot-token cohort flow. The README says the original idea, joining each Polymarket bettor to their own bags, was dropped because Polymarket positions sit in Polygon proxy contracts. The two needles are different populations.

## 3. @edycutjong — Label Me

A ten-card guessing game. Each card is a real Ethereum wallet. You see 30-day PnL, top trades, balance mix, and counterparty classes, then pick Smart Money, Exchange, Whale, Contract / Pool, or Regular. The reveal is Nansen’s own label group plus a one-line “tell” built from those numbers. Live: [labelme.edycu.dev](https://labelme.edycu.dev/). Repo: [edycutjong/labelme](https://github.com/edycutjong/labelme). The site links the X submission [x.com/edycutjong/status/2101620241763831915](https://x.com/edycutjong/status/2101620241763831915).

**Nansen data the code actually uses.** Deck sourcing: `tgm/holders` with `label_type` smart_money and exchange, a free-tag holders page, `tgm/who-bought-sold` with all 17 label groups excluded (the Regular class), and `smart-money/dex-trades`. Clues: `profiler/address/pnl-summary`, `profiler/address/pnl`, `profiler/address/current-balance`, `profiler/address/counterparties`. Entity names on the reveal use `profiler/address/transactions` plus transaction-with-token-transfer lookup. The live homepage showed the recorded card `0x5aad…0f6e`: realised +$12K, 67% win rate, 472 trades, 10 tokens, 97% DEX counterparties, revealed as Smart Money via `smart-money/dex-trades`, replayed at 0 credits from a fixture dated 2026-09-18. The call rail listed those four profiler calls with response hashes.

**What the demo lets you do.** Play the shared round `/r/meridian1933` with no key. Guess with keys 1–5, see the reveal and the tell, then a score next to a deterministic house rule (README: 50/62 on the recorded deck). “Draw fresh” is the live path: one unseen wallet, about 13 credits, five calls streamed with latency. The page says the deck is 62 cards and the house rule reads 50 of them.

**Gap.** The round a judge can finish with zero credits is a recording from 18 Sep 2026, Ethereum only. Regular means “in none of the 17 label groups.” Public Figure was dropped. The house-rule thresholds were set on this same deck.

## 4. @Chaos_dev_ — ProofPulse

An investigation page for one token. It keeps three questions apart: Direction (−100 to +100, are cohort flows accumulating or distributing), Confidence (0–100, is the evidence complete and fresh), and Coordination risk (0–100, are the actors concentrated or linked). Every sentence is supposed to expand to the Nansen row behind it. Repo: [mrchaosdev/proofpulse](https://github.com/mrchaosdev/proofpulse). The README says it is not deployed. No live URL was found.

**Nansen data the code actually uses.** `src/integrations/nansen/nansen-endpoints.ts` catalogues `POST /api/v1/token-screener` (liquidity, and a second call for liquidity peers), `/api/v1/tgm/flow-intelligence` (Smart Traders, Top PnL, Whales, Fresh wallets, Public figures, Exchanges), `/api/v1/tgm/who-bought-sold`, `/api/v1/profiler/address/related-wallets` (only after you expand an actor), and `/api/v1/tgm/flows` (7-day smart-money history, label `smart_money`). Chains the README says were checked live: Ethereum, Solana, Base. A core investigation is four credits; a relationship expansion is one. Exchange flow is stored and shown, and its weight in Direction is zero because the sign convention was left unverified. Fixture mode replays captured responses and caps Confidence at 69.

**What the demo lets you do.** Without a key, `npm run build && npm run start` and open `/investigate/ethereum/0x514910771af9ca656af840dff83e8264ecf986ca?timeframe=1d&mode=fixture` (LINK). The landing page code renders that fixture through the same scorer as live mode, with a form for chain, token, and timeframe. Screenshots in `docs/screenshots/` show cohort bars, a relationship map, an evidence ledger, and a phone layout. The model brief pipeline exists and every brief currently renders the deterministic template.

**Gap.** There is no public deployment. `docs/10-demo-and-submission.md` still has “Deployed URL works in incognito and mobile” unchecked. Coordination stays “not assessed” until a relationship fetch, and the score formula is labelled `score-v0.1`, uncalibrated.

## 5. @sawinyh — Zatto

A copy-crowding meter for Base. Paste a token and it lists Smart Money buys, counts distinct new buyers in the 10 minutes after each buy versus that token’s prior hour, and shows how often tokens at that burst were higher 24 hours later. A wallet page does the same for one address. A chain run ranks tokens. Live: [zatto.nsawinyh.workers.dev](https://zatto.nsawinyh.workers.dev/). Repo: [sneg55/zatto](https://github.com/sneg55/zatto).

**Nansen data the code actually uses.** Four endpoints, all under `https://api.nansen.ai/api/v1/`, with credit costs in `lib/nansen/credits.ts`: `token-screener` (Smart Money, `trader_type: "sm"`, buy volume, a fresh half capped at 14 days old), `tgm/dex-trades` (`only_smart_money` for the token’s buys; unfiltered pages for the tape around each buy), `profiler/dex-trades` (a wallet’s own buys), and `tgm/token-ohlcv` (1-minute candles, carried forward up to 60 minutes). `GET /api/health` at 2026-09-23T12:59:01Z reported `lifetime_ok_calls: 6841`, 375 successful credit charges that UTC day, 1 failed, a daily budget of 6,000, and 28 finished jobs. That counter is theirs. This check did not send a token lookup.

**What the demo lets you do.** The homepage loaded with a Base address box and a base-rate table. Live numbers at check time: under 1× the normal rate, 180 of 449 buys higher at 24h, median −3.5%; 1–2×, 92 of 186, median −0.2%; 2–3×, 24 of 56, median −6.3%; 3–5×, 15 of 31, median −0.3%; 5× and up, 25 of 32, median +26.2%. The README’s 16 Sep table is smaller (263 / 104 / 25 / 16 / 21), so the live board has grown since that write-up. `POST /api/scan/base` is an x402 endpoint: 1 USDC on Base, then a background run. Wallet and copied-leaderboard pages are in the app; this check stayed on the homepage.

**Gap.** The “best” cell on the live table is a lottery print: +111,162.8% in the under-1× band, beside a −100% worst. The median and the “higher at 24h” count are the usable columns. The README’s own chain runs also found no wallet whose buys were mostly crowded; crowding sat in a handful of tokens. A full chain scan that fails after payment is refunded by hand.

## 6. @CoolCriSyS — Nansen inside Meta Muse

No URL was given. The match is [CoolCriSyS/nansen-muse-connector](https://github.com/CoolCriSyS/nansen-muse-connector), pushed 2026-09-18, description: “Nansen smart-money API as a custom connector for Meta Muse.” The X account [CoolCriSyS](https://x.com/CoolCriSyS) exists. Web search did not surface a Muse thread; the repo is the evidence.

**What it does.** A setup guide so Meta Muse can talk to Nansen’s official MCP at `https://mcp.nansen.ai/ra/mcp` over streamable HTTP, with the key in the `NANSEN-API-KEY` header (`mcp-config.json` uses `${NANSEN_API_KEY}`, not a literal key). `CURATED-TOOLS.md` picks 12 read-only tools: `smart_traders_and_funds_netflow`, `smart_traders_and_funds_dex_trades`, `smart_traders_and_funds_token_balances`, `smart_traders_and_funds_pnl_leaderboard`, `wallet_pnl_summary`, `wallet_pnl_for_token`, `address_portfolio`, `token_discovery_screener`, `token_who_bought_sold`, `token_recent_flows_summary`, `token_quant_scores`, and `smart_traders_and_funds_perp_trades`. Example prompts include a morning brief, “who is accumulating NEAR,” and “best wallet this month.”

**What a demo would let you do.** Ask Muse, in the Muse app, after you create the custom connector and supply your own key. There is no hosted page. `examples.md` is described in the README as scripted, illustrative conversations. `USAGE-PLAN.md` is a schedule (a brief every 2–3 hours, about 12 tool calls each) aimed at the 1,000-call rule. It is a plan, not a ledger.

**Gap.** The repository does not call Nansen. It points Muse at Nansen’s MCP and hopes usage will add up. The same GitHub user also has `fresh-token-radar`, `smart-money-flows-tracker`, and `poly-edge-scanner`, with Vercel homepages on the first two. Those were not reviewed.

## 7. @iAteUrSOL — first hour of a pump.fun launch

No repo was given under that handle. [iAteUrSol](https://github.com/iAteUrSol) on GitHub has no Nansen project. The project is [MicroQuack/dejaview](https://github.com/MicroQuack/dejaview), “Replay a pump.fun launch's first hour as a club night,” and the README points at the post [x.com/iAteUrSOL/status/2100539163883847883](https://x.com/iAteUrSOL/status/2100539163883847883). That post was fetched: “Déjà View. Same faces, different places,” tagging @nansen_ai, linking `github.com/MicroQuack/dejaview`, with a video. Live site: [dejaview-delta.vercel.app](https://dejaview-delta.vercel.app/).

**Nansen data the product path uses.** `launch_data.py` and `reflex.py` call `POST /api/v1/tgm/token-information`, `/api/v1/tgm/dex-trades` (launch moment and first-hour buyers), `/api/v1/profiler/dex-trades` (each buyer’s prior 30 days), and `/api/v1/tgm/token-ohlcv` (the first-hour price line). `spike_runner.py` and `d3.py` also call `/api/v1/token-screener` and beta historical routes (`/api/v1beta1/tgm/historical-dex-trades`, `historical-token-ohlcv`, `token-screener/historical`). Those are the research scripts, not the replay the public site plays. The README’s usage receipt says 22,416 successful requests and 22,660 credits between 14 and 16 Sep 2026, from a local ledger that was not re-run here.

**What the demo lets you do.** The live page is a club-night player: a 60:00 timeline, 1×/2×/4×, sound, and a buyer queue. `GET /api/replays` is 404, so the page falls back to static files. The button label becomes “Watch PAID,” and the input placeholder says saved launches only. Five replays are in `replays/index.json`: PAID (T0 2026-09-15), HYPED (09-16), ELON (09-16), BRAIN (09-14), PVE (09-13). PAID’s saved event file returned 200. Launch moment is the first time trading reaches $5,000. The cast is the eight largest buyers of at least $500 in the next hour, excluding labelled exchanges, bots, and wallets with more than 25 buys that hour. Labels are VIP, strong record, known, new face, or “we could not check.” An echo is an earlier launch where two or more of tonight’s buyers were also early inside a six-hour window.

**Gap.** The public site cannot scan a new pump.fun mint. A live scan is local, takes a few minutes, and the README prices it at roughly 300–500 credits. Launch Reflex is a percentile against 37 reference buyers, and the README calls the frozen retest a modest persistence effect.

## 8. @Malachy36 — Nansen data on X via a browser extension

No URL and no repo were given. Nothing matching that product was found.

**Verified.** [x.com/Malachy36](https://x.com/Malachy36) is a real account, display name Sacura, bio “$IPX @aztecnetwork,” website `t.me/Sacura0276`, joined May 2022. GitHub user search for `Malachy36` and `malachy36` returned zero users. Repository search for that handle plus Nansen returned zero. Web search for the handle with Nansen, Meridian, Chrome, and “extension” returned no project page, no Chrome Web Store listing, and no GitHub repo. A fxtwitter lookup could not retrieve a timeline.

**Guess.** None. A Nansen-on-X extension under this handle was not found, so there is no endpoint list and no demo to describe. Nearby extensions that did appear (generic X labelers, a Raycast Nansen extension, PolySmart) are other people’s products and are not attributed to this account.
