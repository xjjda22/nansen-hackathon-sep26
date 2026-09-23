---
cursor:
  subagentId: "bc-c8f5b8c2-853b-5841-9430-8d4e1876c2f5"
---

# Meridian reel: what the post shows, and what the API can power

## The post

[Nansen’s post](https://x.com/nansen_ai/status/2102583495277375860) (23 Sep 2026, 02:19 UTC) is an 8-second video, not a product launch. The copy is: builders are already turning Nansen data into unexpected things, $10,000 is up for grabs, and a few Meridian builds are worth checking out. On screen: “Meridian Buildathon · Sep 14–27”, “Things we didn’t expect”, “Five Meridian builds made with Nansen data”, “1st place $10,000 USDC”, “Submissions close Sep 27”. Five green CRT monitors turn on under “NOW SHOWING · CH 01–05”. There is no thread of extra product detail. The post has replies and one quote; they do not name the five builds. The names below are read off those monitors. Only channel 03 is corroborated by a published write-up.

The campaign page is [nansen.ai/campaigns/meridian-buildathon](https://nansen.ai/campaigns/meridian-buildathon). The academy note is [Nansen Meridian Buildathon (Sep 14–27)](https://academy.nansen.ai/articles/3540155-nansen-meridian-buildathon-sep-14-27). Nansen’s own suggested ideas on that page (SM Shell, Nansen Aquarium, Thesis Desk) are prompts, not the five builds in the video.

## Hackathon constraints

- Window: 14 Sep 2026 through 27 Sep 2026, 23:59 UTC.
- Prize: $10,000 USDC for first. Second and third are hardware. Honorable mentions get API credits.
- Entry: a Nansen API key, 1,000+ API calls in the window, an X post tagging @nansen_ai with a 30–60s recording and a GitHub link, then the entry form (email, X URL, GitHub).
- Judging, equal weight: data integration (Nansen data drives the logic), creativity, a working end-to-end demo, and a README plus recording another builder can run in under 10 minutes.
- Nansen’s own line: a simple tool that runs beats an impressive one that doesn’t. Games, agents, and visualizations count. A dashboard that only decorates with numbers does not.

## The five builds

### CH 01 — Time Machine

A decision desk. The monitor shows three actions: Buy, Pass, Short. The handle on the bezel is hard to read; it looks like @sykaralood. Nothing public under that name turned up.

A version of this is a rule over live flow, not a model. `POST /api/v1/smart-money/netflow` (5 credits) gives 1h, 24h, 7d, and 30d net flow per token. `POST /api/v1/tgm/flow-intelligence` (1 credit) splits a token’s net flow across smart traders, top PnL, whales, exchanges, fresh wallets, and public figures, with timeframes `5m`, `1h`, `6h`, `12h`, `1d`, `7d`. `POST /api/v1/tgm/indicators` (5 credits) adds Nansen’s risk and reward scores if a later pass wants them. The read has to be a sentence a person can argue with. Buy / pass / short is the output of that rule, not a separate score.

### CH 02 — Polygraph

Two area charts, Crowd in red and Wallets in green. The handle looks like @cifreKnet. No public repo matched the name.

This is a divergence view: one series for the crowd, one for labeled wallets. Flow intelligence already splits those cohorts, so the cheap version plots fresh wallets and public figures against smart traders and top PnL on `5m` and `1d`. A prediction-market version uses `POST /api/v1/prediction-market/market-screener`, `prediction-market/ohlcv`, and `prediction-market/top-holders` (1, 1, and 5 credits) to put the crowd’s price next to the largest holders. That second version is a different product from a token tape.

### CH 03 — Wallet label game

@edycutjong. Confirmed outside the reel. The monitor shows PnL, Trades, Balance, Counterparties, the words “wallet label game”, and a question mark. The write-up is [Four numbers, five labels](https://dev.to/edycutjong/four-numbers-five-labels-how-far-can-you-read-a-crypto-wallet-without-a-model-4mh5). The playable round is [labelme.edycu.dev](https://labelme.edycu.dev). Code is [github.com/edycutjong/labelme](https://github.com/edycutjong/labelme).

A card hides the label and shows four 30-day numbers. The player picks Smart Money, Exchange, Whale, Contract / Pool, or Regular. The reveal is Nansen’s own grouping, not the builder’s opinion. Clue calls, about 1 credit each: `profiler/address/pnl-summary`, `profiler/address/pnl` or `profiler/dex-trades`, `profiler/address/current-balance`, `profiler/address/counterparties`. Sourcing the deck uses `tgm/holders`, `smart-money/dex-trades`, and `tgm/who-bought-sold`. The common labels endpoint is 100 credits and the premium one is 500, so a free-tier key should not reveal by calling labels. Edy’s deck stores the label from the cheaper sourcing call and replays offline.

### CH 04 — ProofPulse

Three rows: Flows, Evidence, Coordination, each with a mark on a line. The handle looks like @Chaos_dev_. No public repo matched.

Flows are the cohort net flows from `tgm/flow-intelligence`. Evidence is named activity: `smart-money/dex-trades` for prints already on the tape, or `tgm/who-bought-sold` (1 credit) for a summarised buyer and seller list. Coordination is whether more than one labeled wallet is on the same side. Flow intelligence returns smart-trader, whale, and top-PnL wallet counts. Exchange and fresh-wallet counts are always 0 even when the dollar flow is not; the API says so in a warning. `profiler/address/related-wallets` and `profiler/address/counterparties` can go further, but that is one call per wallet.

### CH 05 — Zatto

“Smart money buys”, a small chart, and the clocks +18 min and +24 h. The handle looks like @zawtnyh. This is the slice already in the app.

`smart-money/netflow` is the 24-hour board (the API’s short window is 1 hour, not 18 minutes). `smart-money/dex-trades` is the print tape; the 18-minute clock is a filter on `block_timestamp`. The endpoint returns the latest page of trades, not every swap in the day. Stables and majors are hidden when they are the asset bought.

## Usable endpoints on a small credit balance

All of these are `POST` on `https://api.nansen.ai` with the key in the `apikey` header, from the server only.

| Endpoint | Credits | Powers |
| --- | --- | --- |
| `/api/v1/smart-money/netflow` | 5 | Zatto’s 24h board; Time Machine’s slow clock |
| `/api/v1/smart-money/dex-trades` | 5 | Zatto’s prints; ProofPulse evidence |
| `/api/v1/tgm/flow-intelligence` | 1 | ProofPulse flows; Polygraph cohorts; Time Machine read |
| `/api/v1/tgm/who-bought-sold` | 1 | Buyer and seller evidence; label-game sourcing |
| `/api/v1/tgm/holders` | 5, or 150 with premium labels | Label-game answer key |
| `/api/v1/profiler/address/pnl-summary`, `pnl`, `current-balance`, `dex-trades` | 1 each | Label-game clues |
| `/api/v1/profiler/address/counterparties` | 5 | Label-game counterparty mix; coordination |
| `/api/v1/profiler/address/labels` | 100 common, 500 premium | Too expensive for a free key |
| `/api/v1/prediction-market/market-screener`, `ohlcv` | 1 each | A real Polygraph, if it is about Polymarket |
| `/api/v1/agent/fast` | 200 | Not viable on a small balance |

Net flow sign, from Nansen’s docs: positive means that cohort bought more than it sold. Exchange wallet count and fresh-wallet count are not tracked.

## Recommended build order

1. **Zatto tape.** Done. It is the discovery surface: what smart money bought, on an 18-minute print clock and a 24-hour net-flow clock.
2. **ProofPulse case plus a Time Machine read, on the token you select.** Highest-value gap. The tape says a name was bought. It does not say whether smart traders, top PnL, and whales agree, or whether that agreement is one wallet or several. One `flow-intelligence` call (1 credit) plus the prints already loaded can do both. This is the slice to build next, inside the same app.
3. **Polygraph on that same case.** A second series, fresh wallets against smart traders, once the case exists. Two timeframes (`5m` and `1d`) if credits allow. Do not start a separate prediction-market app until this token view is solid.
4. **Label game, offline by default.** Fun, and it matches channel 03, but a live round spends a handful of profiler credits per card and must not call the 100-credit labels endpoint. Ship it only after the case is cheap and cached.

Do not add the agent endpoints, premium labels, or a second standalone product. The reel is five sketches of one question: given Nansen’s numbers, what do you do with a name. The tape finds the name. The case answers the question.
