---
cursor:
  subagentId: "bc-70bc21b1-c06d-5eeb-94a9-f01674e6ea50"
---

# Edge cases for the five ideas

Checked against the public Nansen docs on 23 Sep 2026 (`smart-money/netflow`, `tgm/flow-intelligence`, `tgm/who-bought-sold`) and against [built-projects.md](built-projects.md). The API was not called. Credit prices are the ones already in the build note: one POST costs that many credits, including a repeat. Nansen’s own response cache does not make the next click free.

The proposal list stays in [hackathon-ideas.md](hackathon-ideas.md). Where a rule below is tighter than that list, this note wins.

## What the docs change for every idea

`POST /api/v1/smart-money/netflow` requires `chains`. The path is singular. Default page size is 10, and there is no response cache. Stablecoins are off unless `include_stablecoins` is true. Native tokens (ETH, SOL, and the other gas tokens) are off unless `include_native_tokens` is true. Each row has `chain`, `token_address`, `token_symbol`, four net-flow windows, `token_sectors`, `trader_count`, and `token_age_days`. `market_cap_usd` can be absent. Positive net flow means buys net of sells, or CEX withdrawals net of deposits. It is not “someone bought on a DEX.”

`token_sectors` is Nansen’s field. A static sector map would disagree with it and make sector weather a lie.

`POST /api/v1/tgm/flow-intelligence` requires `chain` and `token_address`. Timeframes are `5m`, `1h`, `6h`, `12h`, `1d`, `7d`. Every cohort field can be null. Fresh-wallet dollars exist only on `1d` and `7d`. `exchange_wallet_count` is always 0. `fresh_wallets_wallet_count` is always 0 on `1d` and `7d`, and null on shorter windows. `hyperliquid` is not a chain on this endpoint. `hyperevm` is a different chain.

`POST /api/v1/tgm/who-bought-sold` requires `chain`, `token_address`, and a `date` range. `buy_or_sell` is `BUY` or `SELL` and defaults to `BUY`, so one call is one side. Only `address` is required on a row. Bought and sold volumes, and `address_label`, can be absent. Default page size is 10. `hyperliquid` is a legal chain here.

The agent screen these ideas came from is a Hyperliquid table. Netflow and flow-intelligence cannot query that chain. A demo that types `$PENGU` and answers from Ethereum or Solana is describing a different market.

A symbol match has to be exact. `ETH` must not match `WETH`. EVM addresses compare case-insensitively. Solana addresses do not. The same symbol on two chains is two rows.

Button mashing is a credit bug, not a style bug. One in-flight request, a disabled button, and a server cache of a few minutes. Show the session’s credit count. Do not turn paging, retries, or a second timeframe into an automatic loop.

## 1. Not on your list

Stands, with a tighter rule. The empty-input path in the proposal does not.

**Empty book.** The proposal says an empty field shows the three largest positive names. That is a smart-money leaderboard. It is the Muse connector’s `smart_traders_and_funds_netflow` (“who is accumulating”), and it is the board Zatto ranks from, without the burst math. The set-difference claim is false on that path. Empty input makes no call and asks for at least one symbol.

**Page of 10, and dust.** Without `order_by: net_flow_24h_usd DESC` and an explicit `per_page`, “the three largest” are three rows of an unordered page of 10. One call can ask for 100. If `is_last_page` is false, say the page was cut. Do not fetch page 2. Drop rows under a relative floor written on the page: absolute 24h flow below 1% of the largest absolute 24h flow on that page, and rows with `trader_count` under 2. If fewer than three rows survive the book and the floor, print that count. Do not pad with dust or with a negative row.

**Two chains, stables, addresses.** Key rows by `chain` + `token_address`. Drop every row whose symbol exactly matches the book, on every chain. If two survivors share a symbol, show both, with the chain in the label. Leave stables and natives excluded and say so. A contract address in the book matches `token_address` only. A pool or wallet address matches nothing and is listed as ignored, not treated as a holding. A bad string is ignored. None of these cases send a second netflow call.

**The sentence can lie.** Flow-intelligence is a different measurement from netflow, and its fields can be null. Call it only when a card is opened, one credit, `1d`, and only for a row that already survived. Name a cohort only when its net flow is non-null, same sign as the row’s 24h net flow, and the largest absolute value among the non-null cohorts. If none qualify, the line is “cohorts are flat or missing.” Do not say “buying.” Do not mention wallet counts. Do not call it for all three cards up front. Eight credits was the mashed-button case (5 + 3). First paint is 5, cached. A judge hitting the button for the whole 100-credit starter gets about twenty cached misses and then repeats.

**Where the clone claim fails.** It fails on the empty board, on a table of every row, and if the sentence becomes a buy or pass. It does not fail if the only output is the remainder of the user’s list. Not Time Machine: no date, no BUY / PASS / SHORT, no later price. Not Zatto: no post-fill burst. Not Déjà View: `token_age_days` is not a launch replay.

## 2. Sector weather

The static map dies. The idea stands on `token_sectors`.

**Our map against Nansen’s field.** The proposal groups symbols with a list we maintain. The netflow row already has `token_sectors`. Two sources will disagree, and the sentence would be ours, not Nansen’s. Drop the map. One netflow call, `per_page` 100, `order_by` 24h descending, stables and natives left at their defaults.

**Double count, one token, and a flat book.** A row can list several sectors. Putting the whole dollar amount into each sector it names is not a partition. The sentence has to say the sums overlap. If `token_sectors` is empty, the row is unmapped and out of both sides. “Leaving” requires a negative sum. If every sector is positive, the line is “nothing is leaving,” not the smallest gain. If one token is more than half of a sector’s sum, name that token and do not call it a sector move. If the best positive sum and the worst negative sum are both under the same 1% floor used above, the line is “no sector weather.”

**Chains, majors, mashing.** Do not merge two chains that share a symbol before summing. Wrapped majors (WBTC and the like) are not covered by `include_native_tokens: false` and can dominate a sector. The one-token rule is what catches them. There is no address box. A pasted contract does nothing and costs nothing. Five credits a load. Twenty uncached clicks spend the starter grant. Cache the body. Do not add the optional flow-intelligence call. That call is how this becomes a ProofPulse case.

**Where the clone claim fails.** It fails if the default view is the ranked token table (SM Shell, or Zatto’s chain run without the burst). The default is one sentence, the two sector names, the share of the top token in each, and the unmapped count. Sums sit behind a toggle. Not Polygraph: no crowd price, no six-cohort gap, no deception stamp.

## 3. Same names, both sides

Stands only if it stops claiming the two full lists were intersected.

**One call is the buy side.** `buy_or_sell` defaults to `BUY`. A missing `date` is a 422, which is a crash, not a verdict. The request always sends `chain`, `token_address`, and a rolling day ending at request time. There is no date picker. A picker is Time Machine. Volumes on a buy row can be null, so an intersection that reads `sold_volume_usd` off the buy page can come back empty and then print ONE WAY, which is a lie. If every sold volume on that page is null, the verdict is `SOLD VOLUME ABSENT` and the demo stops. A second SELL call is a separate button, one more credit, never automatic.

**Dust and the wrong address.** A row counts only when both USD volumes are present and the smaller is at least a quarter of the larger. The quarter is a constant printed on the page, not a law. Rows under the same relative floor as idea 1 do not count. The words are “of the top page of buyers, K also sold,” with the page size on screen (`per_page` 25, still one credit). They are not “this market is a round trip.” Empty `data` is `NO TRADES`. A wallet, a pool, or a ticker with no address is `NO TRADES` only after a real empty token response. A ticker with no chain and no address makes no call. Hide `address_label`. Showing it is labelme’s reveal.

**Stables, Hyperliquid, mashing.** USDC and WETH will look like round trips because they are the quote leg. Refuse a short denylist of symbols before the call when the row came from netflow. When the input is only an address, the page cannot know it is USDC. Say that. `hyperliquid` is legal here and illegal on netflow, so this is the one idea that can be pointed at the agent screen, and only with a token address plus that chain. One credit a click. Cache by chain, address, and the UTC day. Do not walk pages.

**Where the clone claim fails.** A table of buyers with volumes is ProofPulse’s evidence ledger. A queue of the largest buyers, a timeline, or a young-token cast is Déjà View. The standing output is the count, at most three addresses, and no label. Not Zatto: no burst after a smart-money fill, no 24h return.

## 4. Agent-key gate

This one dies.

**A new agent wallet fails the gate.** The proposal treats missing balance, missing PnL, and missing counterparties as DON’T ATTACH. The wallet ethskills tells an agent to use is a fresh, small, unused address. That address has nothing for those three calls to return, so the safe wallet is rejected and the demo looks broken. Dust plus a large realised book is the opposite case and must not pass, but “missing” and “a book” cannot share a verdict.

**It is labelme’s card, and Muse’s wallet tools.** The calls are `current-balance`, `pnl-summary`, and `counterparties`: three of labelme’s four clues. labelme already runs a threshold rule over those numbers and reveals a class. A judge who has played `/r/meridian1933` is looking at the same card with the labels renamed ATTACH and DON’T ATTACH. The Muse connector already wraps `wallet_pnl_summary` and `address_portfolio`. A contract or a pool with a large balance becomes DON’T ATTACH for the same reason labelme’s Contract / Pool class exists. Splitting the verdict into EMPTY, BOOK, and ONE DESK does not fix that. The data path is still the guessing game.

**Cost.** Seven credits for one address, fourteen if the demo’s two boxes both fire, and a mash spends the starter grant in under ten clicks. Counterparties is five of the seven and is the clue that makes the page a labelme tell. Cutting it leaves a balance-and-PnL card, which is still the game.

No tighter rule keeps it. Do not build it.

### Replacement: same ticker, two chains

The edge that kept breaking ideas 1, 3, and 5 is the question.

**Pitch.** One symbol. If the netflow board has it on more than one chain, show those rows and which chain’s 24h smart-money net flow is larger. If it has the symbol once, say so. If it has it nowhere, say the board did not include it.

**Rule.** One netflow call, 5 credits, `per_page` 100, 24h sort, stables and natives left excluded, cache it. Exact symbol match. Ignore rows under the 1% floor. If two or more rows remain, print each chain, address, and 24h figure, and mark the larger absolute value. Do not say buy, sell, or copy. If the two absolutes are inside the floor of each other, say they are tied. If `is_last_page` is false, say the scan is the first page only and do not fetch another. No flow-intelligence call, so this cannot grow a cohort paragraph.

**Why it is not the others.** Time Machine locks a side and reveals a later price. Polygraph compares a Polymarket crowd with six cohorts. labelme guesses a wallet class. ProofPulse scores one token three ways. Zatto counts new buyers after a fill. Déjà View replays a launch hour. Muse can call netflow, but this screen only answers the collision, and it refuses to answer when there is no collision. The agent’s Hyperliquid table stays out of scope, because netflow has no `hyperliquid` chain. Say that on the empty result.

**Smallest demo.** A symbol box. One sentence. The matching rows under it, chain included. Empty and unknown symbols make the one cached call only on submit, then read the cache.

## 5. Why it’s up, two credits

Stands only with the causation taken out. It is the weakest of the five, because the clone line is one sentence away.

**The price is not in the payload.** The pill asks why `$PENGU` is up. Flow-intelligence has no price. The largest cohort can be selling while the price rises, and the sentence “who is buying” is then false. The title cannot be “why it’s up.” The line is the cohort with the largest absolute non-null `1d` net flow, its sign, and whether that same cohort’s `5m` sign matches. Null is not zero. If the `1d` winner is fresh wallets, `5m` has no fresh-wallet field: the second line is `UNAVAILABLE`, not `DISAGREE`. If every `1d` cohort is null or under the floor, the line is `FLAT`. Two flat windows do not “agree.”

**Ticker, chain, and the agent screen.** The endpoint requires `chain` and `token_address`. A default of `PENGU` either crashes or silently picks a spot market. The Hyperliquid screen cannot be queried here at all. The input is a chain and an address, or a row chosen from the cached netflow board so the symbol is known. A symbol-only submit makes no call. Do not weight the cohorts. A weighted composite is Time Machine’s signal (35 / 25 / 25 / 15) without the reveal. Do not list all six cohorts. That list is ProofPulse’s flow row and Polygraph’s informed needle.

**Stables, mash, labels.** A known stable or native address is refused before the call when it came from the netflow board, which already dropped them. Two credits a token (`1d` and `5m`), cached as a pair. Do not fire `5m` if `1d` returned an error or an empty `data` array. Empty data is “no flow,” not a cohort. Fifty uncached clicks spend the starter grant.

**Where the clone claim fails.** It fails if the sentence explains the price, offers a side, or shows the six bars. It holds only as two lines: the `1d` cohort and its sign, and `AGREE`, `DISAGREE`, or `UNAVAILABLE`. Not Déjà View, not Zatto, not the Muse connector’s open-ended “recent flows” prompt, as long as the user cannot type a free question.

## What to build

1 and 2 still stand. 3 stands if the verdict is “of this page of buyers, how many also sold.” 4 is replaced by the two-chain symbol check. 5 stands only as the two-line flow check, and it should lose a slot to 1, 2, or the replacement if only one demo gets finished.
