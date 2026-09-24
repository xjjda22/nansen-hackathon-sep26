# Off Book

Two screens. Each button is one Nansen call. The lines on that screen are read from that body. A figure the payload does not contain is not shown. The pages do not scan blocks, do not ask for a seed, and do not invent a number.

The rule set is [hackathon-edge-cases.md](../docs/hackathon-edge-cases.md). Where that note disagrees with [hackathon-ideas.md](../docs/hackathon-ideas.md), the edge-case note wins.

## Run it

You need Node 22 and npm. From this folder:

```bash
npm install
```

Create `.env.local` here with one line, `NANSEN_API_KEY=`, and your own key. `.env*` is gitignored.

```bash
npm run dev -- --port 43127 --hostname 127.0.0.1
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

`npm test` checks the rules and does not call Nansen.

## Board

Opening the board calls `POST /api/netflow`, which calls `POST /api/v1/smart-money/netflow` once (5 credits, page 1, 100 rows, 24h descending). The book and the rails symbol stay empty. The page ranks those tokens by absolute 24h net flow and shows them in a table: symbol, chain, 24h, 7d, 30d, trader count, sector, and age. Above the table, the first 50 are compared with the rest of the page: the leading sector and its share, the leading chain, the share whose 7d sign differs from 30d, and the median trader count, token age, and market cap when that field is present. A zero or a null window is not a sign difference. A null median is absent. If the page has fewer than 100 tokens, the lines say so. These rows are tokens. Trader count is a number on the token, not a list of wallets.

The same body also prints four lines: how many tokens have positive 24h flow, the leading sector and its sum, how many tokens flip sign between 7d and 30d with the trader count on the sharpest flip, and a two-chain pair when this page already has one. If it does not, the line says this page has no pair. A later click uses the same cache and does not pay again. Typing a book refines the ledger from that body. The route, path, and cost are on the page once.

From that body:

- Ledger: up to three positive 24h names not on the typed book. An empty book skips this line and says so. Weather and rails still run.
- Weather: which sector 24h flow is entering, and which it is leaving, from `token_sectors`, with the dollar sum and the token that moved that sector the most. A token in two sectors is counted in both. All positive: nothing leaving.
- Rails: for the typed symbol, the chain, the 24h figure, and the 1h, 7d, and 30d figures on this page. A tie stays a tie. One chain says so. No symbol skips this line.
- A picked row, with no extra call: symbol, chain, address, 1h, 24h, 7d, and 30d, whether 1h and 24h match, differ, are flat, or are absent, every sector, trader count, token age, and market cap when that field is present. A null field is absent. A numeric 0 stays 0.

Page 2 is not fetched. If `is_last_page` is false, the page says so.

## Blotter

`POST /api/both-sides` calls `POST /api/v1/tgm/who-bought-sold` once, BUY, ordered by bought USD, 25 rows. It prints how many of that page also sold, or sold volume absent, or no trades, and a page cut when `is_last_page` is false. There is no sell call.

A ticker with no address does not call. A known quote symbol is refused before the call. An address typed alone is not checked against that list.

## Credits

A successful body is cached for two minutes. The top line is credits spent in this server process, account remaining when Nansen sends it, and this click: last charge, cache, or no call. A refusal does not repeat the previous charge. If the account cannot cover a call, the page shows Nansen's error.

The response JSON is behind **Response**, collapsed.

The pages do not call profiler labels, `agent/fast`, flow intelligence, dex trades, holdings, or a second netflow.

`GET /api/board` reads the netflow cache and does not call Nansen. `GET /api/session` is the credit counter.

The audit of an earlier build is [devils-advocate.md](../docs/devils-advocate.md).

## Research notes

The notes sit next to this repo, in `../docs`:

- [hackathon-edge-cases.md](../docs/hackathon-edge-cases.md)
- [hackathon-ideas.md](../docs/hackathon-ideas.md)
- [built-projects.md](../docs/built-projects.md)
- [meridian-buildathon.md](../docs/meridian-buildathon.md)
- [ethskills-site-research.md](../docs/ethskills-site-research.md)
- [nansen-agent-product-research.md](../docs/nansen-agent-product-research.md)
