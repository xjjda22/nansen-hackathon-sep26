---
cursor:
  subagentId: "bc-70bc21b1-c06d-5eeb-94a9-f01674e6ea50"
---

# Five Meridian ideas

Edge cases, and the rules that keep these from lying: [hackathon-edge-cases.md](hackathon-edge-cases.md).

Proposals for a small tool we can still ship before 27 Sep 2026, 23:59 UTC. These are not recaps of the five CRT channels, and they are not clones of the builds already in public.

Judging is equal weight on Nansen data driving the logic, creativity, a demo that runs end to end, and a README plus recording another builder can follow in under 10 minutes. A simple tool that runs beats a bigger one that does not. Stay on the cheap endpoints already listed in the build note: `smart-money/netflow` (5), `smart-money/dex-trades` (5), `tgm/flow-intelligence` (1), `tgm/who-bought-sold` (1), `tgm/holders` (5), profiler `pnl-summary` / `pnl` / `current-balance` / `dex-trades` (1 each), `counterparties` (5), prediction-market screener and ohlcv (1 each). Do not call `profiler/address/labels` (100 / 500) or `agent/fast` (200).

Every idea below is one rule with a yes-or-no output. A demo run is 1 to 8 credits, so a 100-credit starter key can repeat it.

## What the two sites showed

Opened in a browser: [app.nansen.ai/?agent=true](https://app.nansen.ai/?agent=true). The page title is “What Are We Trading Today?” An “Ask Nansen AI” box sits on the Hyperliquid token table, with a Fast / Auto switch and a carousel of prompt pills. Clicking a pill does not answer. It opens a sign-up modal (Smart Money, AI Agent, PnL Performance, Smart Alerts). The agent product is real, and it is gated.

Pills read off that carousel:

- “Identify tokens with increasing whale accumulation”
- “Why is $PENGU up in the last 24h?”
- “Suggest 3 tokens that Smart Money holds but…” (the pill clips the rest)
- “Who are the top wallets buying $PENGU?”
- “Reset my portfolio”
- “What’s trending with Smart Money today?”
- “What sectors dominate Smart Money Holding…”
- “All Smart Money holding…”

The BTC trade page (`/token-god-mode`, Hyperliquid) has an order book and a Position Intelligence panel: “See how Smart Money is positioned,” naming Smart Money, Top PnL Traders, Public Figures, and Whales. Perp trading on that page is blocked in this region. The tokens table shows price, 24h change, volume, traders, open interest, funding, and a buy/sell pressure bar. The in-app API page offers 100 free credits, a 5-minute quickstart, copy-paste use-case templates, and a Meridian banner: purchases during the campaign deliver double credits.

[ethskills.com](https://ethskills.com/) is a pack of `SKILL.md` files for coding agents, not a Nansen product. The pages that matter here are wallets, concepts, indexing, standards, tools, and building-blocks. Wallets tells an agent to use a dedicated wallet with limited funds, and to show amount, destination, and gas and wait for a human “yes” before any send. Concepts says nothing onchain runs by itself: every transition needs a caller and a reason. Indexing says do not loop blocks or `eth_getLogs` to answer a historical question; use something that has already indexed it. Standards documents ERC-8004 (agent identity registry, live) and x402 (HTTP 402 payments). Zatto already settles 1 USDC on Base via x402, so a paywalled Nansen proxy is taken.

## Builds these ideas must not copy

| Build | What it already is |
| --- | --- |
| Time Machine | Cached historical simulator. Pick a past date, choose BUY / PASS / SHORT, then reveal the later move. 250 scenarios, a decision score, session “trader DNA.” |
| Polygraph | Polymarket crowd price against six Nansen cohorts, with a deception verdict and a calibration study on resolved markets. |
| labelme | Ten-card game. Four 30-day numbers, guess Smart Money / Exchange / Whale / Contract / Pool / Regular, reveal Nansen’s label. |
| ProofPulse | Investigation workspace. Three separate scores: direction, confidence, coordination risk, plus an evidence ledger. |
| Zatto | Copy-crowding meter. After a Smart Money buy, how many new buyers arrive in 10 minutes, and what a delayed copy returned. Token, wallet, and chain run. x402 on Base. |
| @CoolCriSyS | Live Nansen data inside Meta Muse. |
| @iAteUrSOL | Replay of the first hour of pump.fun launches. |
| @Malachy36 | Nansen data inside X, via a browser extension. |

Nansen’s own campaign prompts (SM Shell, Nansen Aquarium, Thesis Desk) are also skipped.

## 1. Not on your list

**Pitch.** You type the tokens you already hold. It prints exactly three tokens Smart Money is adding that are not on that list, each with one sentence on which cohort is buying.

**Where it comes from.** The agent carousel on “What Are We Trading Today?”: “Suggest 3 tokens that Smart Money holds but…” next to “Reset my portfolio.”

**Endpoints.** One `POST /api/v1/smart-money/netflow` (5) for the board. Then `POST /api/v1/tgm/flow-intelligence` (1) on each of the three names, timeframe `1d`. About 8 credits a run. Cache the netflow response for the session.

**The rule.** Keep tokens whose 24h smart-money net flow is positive. Drop any symbol the user typed. Take the three largest. The sentence names the cohort with the largest same-sign net flow (smart traders, top PnL, whales, fresh wallets, or public figures). Net flow is accumulation, not a holdings census. The pill says “holds”; this demo says “adding,” and the screen should say that in one line so it does not pretend to be a portfolio scan. `tgm/holders` per token would be the holdings version and gets expensive fast, so it stays out.

**Why it can win.** The output is a set difference, not a board. A judge types three tickers and gets three cards. Nansen decides membership and the sentence.

**Smallest demo.** One text field, one button, three cards, and the credit count. Empty input shows the three largest positive 24h names and says no book was subtracted. A bad symbol is dropped with a line, not a crash.

**Not a clone.** Not Zatto: Zatto measures the burst of new buyers in the ten minutes after a Smart Money fill and the return of copying it. This never looks at who arrived after a trade. Not Time Machine: no past date, no BUY / PASS / SHORT, no reveal of a later price.

## 2. Sector weather

**Pitch.** One sentence: which rough sector Smart Money’s 24h net flow is entering, and which it is leaving.

**Where it comes from.** The same carousel: “What sectors dominate Smart Money Holding…” The tokens page is a flat Hyperliquid table. It does not group by sector, so the grouping has to be ours, and the flow has to be Nansen’s.

**Endpoints.** One `smart-money/netflow` (5). Optional: one `tgm/flow-intelligence` (1) on the single token that moved the winning sector the most. 5 or 6 credits.

**The rule.** A short static map in the repo (a few dozen symbols into memes, majors, L2s, DeFi, perps). Sum 24h net flow by sector. Entering is the largest positive sum. Leaving is the largest negative sum. Print the two tokens inside those sectors that contributed the most. Say how many board symbols were unmapped. No chart.

**Why it can win.** The agent asks a sector question and will not answer without an account. The demo answers it with one call and a sentence a person can argue with. Creativity is the object (a weather line), not another token tape.

**Smallest demo.** Load the page. Read one sentence, the two deciding tokens, and the unmapped count. A “show the sums” toggle is enough for a judge to see the arithmetic.

**Not a clone.** Not Zatto’s chain run, which ranks tokens by post-buy crowd burst. Not Polygraph, which plots a Polymarket crowd against six cohort needles. Not SM Shell, Nansen’s own “terminal that tracks live token flow.” This is two sectors and one sentence.

## 3. Same names, both sides

**Pitch.** Paste a token. If the summarised buyers and the summarised sellers share addresses, it prints ROUND TRIP. If they do not, it prints ONE WAY.

**Where it comes from.** Two carousel pills: “Identify tokens with increasing whale accumulation” and “Who are the top wallets buying $PENGU?” Accumulation is a bad description when the same wallets are also the sellers. ethskills indexing says not to walk blocks with `eth_getLogs` to reconstruct that list. One indexed summary is the whole tool.

**Endpoints.** One `POST /api/v1/tgm/who-bought-sold` (1 credit).

**The rule.** Intersect the buyer addresses and the seller addresses in that response. Non-empty intersection: ROUND TRIP, plus the count and the first few shared addresses. Empty: ONE WAY. If the payload has no addresses, print NO ADDRESSES and stop. Do not invent a round trip from totals.

**Why it can win.** One credit, one bit, and the bit changes what “whale accumulation” means. A judge can run two tokens in a minute. The logic disappears if you remove Nansen.

**Smallest demo.** A token box, the verdict in one word, and the shared addresses under it. No score, no chart, no second call.

**Not a clone.** Not ProofPulse: that product keeps direction, confidence, and coordination risk as three scores and will expand `related-wallets` for an actor you pick. This has one bit and does not score conviction or relationships. Not Zatto: not a count of new buyers after a Smart Money fill. Not the pump.fun first-hour replay.

## 4. Agent-key gate

**Pitch.** Paste an address. It answers ATTACH or DON’T ATTACH: whether this looks like a small dedicated agent wallet or like someone’s real book.

**Where it comes from.** ethskills wallets: use a dedicated wallet with limited funds for agent operations, never the human’s main wallet, and do not move funds until a human has seen amount, destination, and gas. ethskills concepts: nothing happens until someone pokes it, so the poke before a signature is the product. The Nansen agent cannot be asked this without an account, and `agent/fast` is 200 credits, so the check is three profiler calls.

**Endpoints.** `profiler/address/current-balance` (1), `profiler/address/pnl-summary` (1), `profiler/address/counterparties` (5). 7 credits. No labels call.

**The rule.** Put the thresholds in the README and in the page, as constants. A starting set: DON’T ATTACH if current balance is above a stated USD cap, or if realised PnL shows a real trading book (non-trivial realised total and more than a handful of tokens traded), or if counterparties are scattered (no single counterparty is most of the flow). ATTACH only if the balance is under the cap and one counterparty is the majority. Anything missing in the payload stays missing and the verdict is DON’T ATTACH. The page never asks for a key, a seed, or a signature.

**Why it can win.** It is a gate an agent author actually needs, grounded in ethskills, with Nansen as the only input to the gate. Judges can run it on two public addresses in one sitting. It does not look like a dashboard.

**Smallest demo.** Two address fields. Two verdicts, each with the three numbers that decided it (balance, realised PnL, top-counterparty share). A worked example in the README uses public addresses only.

**Not a clone.** Not labelme: that game hides the label and asks you to guess Smart Money, Exchange, Whale, Contract / Pool, or Regular. This does not guess a class and does not reveal a label. The only outputs are ATTACH and DON’T ATTACH. Not @Malachy36’s X extension, and not @CoolCriSyS’s Meta Muse embed.

## 5. Why it’s up, two credits

**Pitch.** Type a ticker. Get one sentence on which cohort’s 1-day net flow is doing the buying, and whether the last 5 minutes agrees.

**Where it comes from.** The pill “Why is $PENGU up in the last 24h?” on the agent home. Submitting it hits the sign-up wall. Fast and Auto sit on that same box. The 200-credit `agent/fast` endpoint stays unused on purpose. The sentence also says whether the cohorts agree with each other, which is the “who is the caller” question from ethskills concepts, applied to a token move.

**Endpoints.** `tgm/flow-intelligence` twice, timeframes `1d` and `5m` (1 credit each). 2 credits.

**The rule.** On `1d`, name the cohort with the largest absolute net flow and its sign. On `5m`, say AGREE if that same cohort’s sign matches, else DISAGREE. The sentence is filled from those two facts only. No price target, no buy or sell instruction. If a cohort is missing, say so.

**Why it can win.** It is the question already on Nansen’s own front door, answered without the gated agent and without the expensive endpoint. Two credits means a judge can try PENGU and then whatever is on the board. The recording is one box and one sentence.

**Smallest demo.** Input defaults to PENGU, matching the pill. One paragraph. A footer: “2 credits. The in-app agent did not answer this without an account.”

**Not a clone.** Not ProofPulse: no direction score, no confidence score, no coordination score, no evidence ledger. Not Time Machine: live, no locked decision, no future price. Not Polygraph: no prediction-market crowd and no deception verdict.

## Site findings the earlier note did not have

- The agent is a shipped UI, not only an API route. Fast / Auto, the prompt carousel, and the sign-up wall are the product. Rebuilding one of those questions with a 1-credit call is the opening. Calling the agent is not.
- Position Intelligence on the Hyperliquid BTC page is a perp long/short panel. The cheap endpoint list has no perp-positioning call. Do not fake that panel from spot net flow.
- In-app API page: 100 free credits to start, use-case templates, double credits on purchases during Meridian.
- Academy FAQ, updated the same day as this note, adds a Points-hub claim of 1,000 credits, says the CLI counts because it is the API, allows one submission per account, says a trading bot must be shown with the builder’s own capital, and puts the winner announcement on 1 Oct 2026. Entry-call wording disagrees with the campaign page: the campaign still says 1,000 API calls, the academy FAQ says 100+ between 14 and 27 Sep. Treat 1,000 as the safer bar until Nansen says otherwise. These demos stay cheap either way.
- ethskills is how a coding agent is told to behave on Ethereum. The useful pieces are the dedicated-wallet rule, the ban on scanning blocks, and the warning that L2 DEX defaults are stale (Aero on Base, not Uniswap). ERC-8004 and x402 are real on that site. Zatto already uses x402, so paying to unlock Nansen is not an open lane.
- The five public repos are past the CRT sketch. Time Machine plays cached history. Polygraph is a Polymarket instrument with a calibration table. Zatto prices the copy, not just the print. ProofPulse refuses to collapse three questions into one score. labelme is a full game with an offline deck. A new tool has to be a different question, not a thinner version of one of those.
