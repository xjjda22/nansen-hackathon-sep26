# Off Book

Five desks that answer questions from the Nansen smart-money board. The pages are thin. Each answer comes from a server route that calls Nansen, or from a refusal that does not call. The desk does not scan blocks, does not ask for a seed or a signature, and does not invent a number the API did not return.

The rule set is [hackathon-edge-cases.md](../docs/hackathon-edge-cases.md). Where that note disagrees with [hackathon-ideas.md](../docs/hackathon-ideas.md), the edge-case note wins. The fourth desk is the two-chain symbol check. The agent-key gate is not built.

## Run it

You need Node 22 and npm. From this folder (the git root):

```bash
npm install
```

Create `.env.local` here with one line. The name is `NANSEN_API_KEY`. Put your own Nansen API key after the equals sign. The server reads that name. The key is not in this file, and `.env*` is gitignored.

```bash
npm run dev -- --port 43127 --hostname 127.0.0.1
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

`npm test` checks the rules and does not call Nansen.

## What to click

Start with **Sector weather**. That is one netflow call, 5 credits, and it fills a two-minute cache shared with the ledger and the twin rails. While that cache is warm, those two desks spend 0.

Then:

1. **Not on your list.** Leave the book empty and submit. That refuses and does not call. Type a symbol you do not hold, such as a nonsense ticker, and submit. Up to three names come back. Open a card for the 1-day cohort line. That open is a separate 1-credit call.
2. **Same names, both sides.** A ticker with no address does not call. Paste a chain and a token address, or pick a cached board row, then read the buy page (1 credit, page of 25). The sell page is a second button. If sold volume is missing, that button stays closed.
3. **Same ticker, two chains.** Submit one symbol. The sentence is the chains on the netflow page, or that the page did not include it.
4. **Cohort and sign.** A symbol alone does not call. A chain and an address return the largest 1-day cohort and whether the 5-minute sign matches. That pair is 1 credit each. A flat day does not print AGREE, and the 5-minute call is skipped when the day is flat, empty, or a fresh-wallet winner.

The brass line under the nav is this server process only: credits spent since the process started, and the account remaining when Nansen sends that header. It is not a campaign total. A cached click charges 0. Each result says whether that click called Nansen or came from the two-minute cache.

If the account cannot cover a call, the desk shows Nansen's error. It does not fill in a sentence.

## The five routes

| Desk | Route |
| --- | --- |
| Not on your list | `POST /api/not-on-your-list` |
| Sector weather | `POST /api/sector-weather` |
| Same names, both sides | `POST /api/both-sides` |
| Same ticker, two chains | `POST /api/two-chains` |
| Cohort and sign | `POST /api/cohort-sign` |

Opening a card on the first desk sends `action: "cohort"` to the same route. The sell page on the third desk sends `side: "SELL"` to the same route. Neither fires by itself.

Netflow is 5 credits. Flow intelligence and who-bought-sold are 1 credit each. A successful response is cached for two minutes. One in-flight request is shared per cache key, and the button stays disabled while it runs.

`GET /api/board` reads that cache and does not call Nansen. `GET /api/session` is the credit counter.

The desk does not call profiler labels or `agent/fast`, and it does not walk pages.

## Research notes

The notes sit next to this repo, in `../docs`:

- [hackathon-edge-cases.md](../docs/hackathon-edge-cases.md)
- [hackathon-ideas.md](../docs/hackathon-ideas.md)
- [built-projects.md](../docs/built-projects.md)
- [meridian-buildathon.md](../docs/meridian-buildathon.md)
- [ethskills-site-research.md](../docs/ethskills-site-research.md)
- [nansen-agent-product-research.md](../docs/nansen-agent-product-research.md)
