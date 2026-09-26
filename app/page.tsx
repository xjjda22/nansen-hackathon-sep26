import { CombinedQuest } from "@/components/combined-quest";
import { Desk } from "@/components/desk";
import { HoldingBoard } from "@/components/holding-board";
import { PrintBoard } from "@/components/print-board";
import { TokenBoard } from "@/components/token-board";
import { TraderBoard } from "@/components/trader-board";
import { SHOW_SOURCE_DESKS } from "@/lib/constants";

export default function HomePage() {
  return (
    <div className="room-stack">
      <Desk
        tone="ledger"
        title="Four pages, one walk"
        route="Four posts"
        nansen="netflow, leaderboard, dex trades, holdings"
        cost="5 each"
      >
        <CombinedQuest />
      </Desk>
      {SHOW_SOURCE_DESKS ? <SourceDesks /> : null}
    </div>
  );
}

function SourceDesks() {
  return (
    <>
      <Desk
        tone="ledger"
        kicker="Tokens"
        title="Where the money moved"
        lede="The largest smart-money moves in a day, set next to the quieter names on the same list. The rank is the size of the move. The lines under it are what that rank leaves out: how many wallets are in the name, how old it is, and how big it is."
        route="POST /api/netflow"
        nansen="POST /api/v1/smart-money/netflow"
        cost="5"
      >
        <TokenBoard />
      </Desk>
      <Desk
        tone="weather"
        kicker="Traders"
        title="What the profit list leaves out"
        lede="The 50 Solana wallets that made the most in 30 days, set next to the other smart-money wallets on that same list. Eight habits. Profit does not say why a trade worked, when they bought, or which fill to copy. It says how their book differs from the wallets further down the list."
        route="POST /api/leaderboard"
        nansen="POST /api/v1/smart-money/pnl-leaderboard"
        cost="5"
      >
        <TraderBoard />
      </Desk>
      <Desk
        tone="wire"
        kicker="Prints"
        title="When they bought"
        lede="Buys from the last 24 hours. How old the token was, and how big it was, when the wallets that made the most bought it, versus the other wallets that traded today. That is the when and the size. A wallet with no buy today is left out. This is not an order to copy."
        route="POST /api/dex-trades"
        nansen="POST /api/v1/smart-money/dex-trades"
        cost="5"
      >
        <PrintBoard />
      </Desk>
      <Desk
        tone="rails"
        kicker="Holdings"
        title="What the crowd still sits in"
        lede="Tokens the most smart-money wallets still hold, on every chain in the call. Wallet count only orders the list. The lines under it compare the crowded names with the thinner ones on this page."
        route="POST /api/holdings"
        nansen="POST /api/v1/smart-money/holdings"
        cost="5"
      >
        <HoldingBoard />
      </Desk>
    </>
  );
}
