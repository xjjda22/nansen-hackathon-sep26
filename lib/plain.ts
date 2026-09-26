const EXACT: Record<string, string> = {
  "Four lists. Each one is split in two. Traits set the top of the list next to the rest. Insights set two deeper groups next to each other.":
    "There are four lists. Each list is cut into two groups. Traits puts the top next to everyone else. Insights puts two deeper groups next to each other.",
  "The largest smart-money moves in a day, set next to the quieter names on the same list. The rank is the size of the move. The lines under it are what that rank leaves out: how many wallets are in the name, how old it is, and how big it is.":
    "These are the coins where the most money moved today. We set the loud ones next to the quiet ones. The lines say who is in them, how old they are, and how big they are.",
  "The 50 Solana wallets that made the most in 30 days, set next to the other smart-money wallets on that same list. Eight habits. Profit does not say why a trade worked, when they bought, or which fill to copy. It says how their book differs from the wallets further down the list.":
    "These are the people who made the most money. We set them next to everyone else. Making money does not tell you what to copy. It tells you how their pile is different.",
  "Buys from the last 24 hours. How old the token was, and how big it was, when the wallets that made the most bought it, versus the other wallets that traded today. That is the when and the size. A wallet with no buy today is left out. This is not an order to copy.":
    "These are the coins people bought today. We check how old and how big the coin was when the winners bought it, and when everyone else bought it. If someone did not buy today, they are left out. This is not telling you to buy.",
  "Tokens the most smart-money wallets still hold, on every chain in the call. Wallet count only orders the list. The lines under it compare the crowded names with the thinner ones on this page.":
    "These are the coins the group still holds. The list is ordered by how many people hold each coin. The lines compare the crowded coins with the lonely ones.",
  "Enter up to five symbols or addresses. Each name is a short walk across netflow, holdings, today's tape, and the names the top wallets traded. Traits only.":
    "Type up to five coin names. We check each name on the lists. We only say what the lists show.",
  "The climb is the thinner names on this page. Wallet count only orders the list.":
    "The rest of the list is the coins fewer people hold. The order is how many people, not how big the coin is.",
  "The climb is the quieter names on this page. These six are what the 24h rank leaves out.":
    "The rest of the list is the quieter coins. The lines say what the size of today's move leaves out.",
  "The climb is the other wallets on today's tape. Age and cap are at the buy.":
    "The rest of the list is the other people who bought today. Age and size are from the moment they bought.",
  "The climb is the rest of this profit list. Profit is only the cut.":
    "The rest of the list is the people who made less. We only used profit to split the list.",
  "Four pages, one walk": "One walk through four lists.",
  "One walk, four pages": "One walk through four lists.",
  "Each page has two quests. Traits open on the line and the number that decided it. The comparison table is the next mark. Insights compare the two deeper groups.":
    "Each page has two walks. Traits starts with the line and the number. The table comes after that. Insights puts two deeper groups next to each other.",
  "No insight cleared the cut on this page.": "Nothing deeper showed up on this page.",
  Traits: "The comparison.",
  Insights: "The deeper reading.",
  Quest: "The walk.",
  Tokens: "Coins.",
  Traders: "People.",
  Prints: "Buys.",
  Holdings: "Still holding.",
  "Thin seat": "A little coin, lots of people.",
  "Small coin, fat seat": "A little coin, a big pile.",
  "The thin seat left the busiest chain": "The little coin lots of people share is on a different chain.",
  "Same ticker, different coin": "Same name, different coin.",
  "The address needs a chain": "Same address, two chains. You need both.",
  "Cap then, cap now": "Size when they bought it, and size now.",
  "Traders and holders disagree": "Buyers and holders are not the same count.",
  "The month column is the life of the token": "The month number is really just today.",
  "Where the money moved": "Where the money moved.",
  "What the profit list leaves out": "What making money does not tell you.",
  "When they bought": "When they bought.",
  "What the crowd still sits in": "What the group still holds.",
  "Check a name": "Check a coin.",
  "The gap": "What is different.",
  "Same either way": "What is the same.",
  "Move · netflow": "Who money moved toward.",
  "Wallets · leaderboard": "The people who made money.",
  "Prints · dex trades": "What they bought today.",
  "Holds · holdings": "What they still hold.",
  "Across the pages": "A coin on one list and missing from another.",
  "None.": "Nothing on this side.",
  "Mark read": "I read this.",
  "The page is read. None of these seats is an order.": "You read the page. None of this says buy or sell.",
};

const GLOSS: Record<string, string> = {
  "Sign flip": "The week and the month point different ways. One group does this more than the other.",
  "Wallets in the name": "This is how many people traded the coin. The loud coins and the quiet coins do not have the same count.",
  "Age": "This is how old the coin is. One group is older than the other.",
  "Size now": "This is how big the coin is today. One group is bigger than the other.",
  "Sector": "This is the crowd the coin sits in. Both sides picked the same crowd.",
  Chain: "This is which chain the coin is on. Both sides picked the same chain.",
  "Names traded": "This is how many different coins they touched. The winners touched a different number than everyone else.",
  "Still holding": "This is the share of coins they still hold. The winners still hold more, or less, than everyone else.",
  "Still open": "This is the share of trades they have not closed.",
  "Already banked": "This is how much of the profit they already took home, instead of leaving it in the coin.",
  Wins: "This is how often a trade made money. The ranking is about dollars, not about this.",
  "Repeat buys": "This is how many times they went back to the same coin.",
  "Same names": "This is how often these people traded the same coins as each other.",
  When: "This is how old the coin was when they bought it.",
  "Size at the buy": "This is how big the coin was when they bought it, not how big it is now.",
  "Dollars on the print": "This is how much money was in the buy, not how big the coin is.",
  "What they sold": "This is how old the coin was that they sold.",
  "Prints today": "This is how many buys each person made today.",
  "The hour fights the day": "The last hour and the day point different ways.",
  "Bought, and still off the book": "People bought a coin that is moving and is not in the pile.",
  "Quiet on the move list, bought today": "Someone bought a coin the group still holds, even though it missed the move list.",
  "A big total, a small rate": "A person can make a lot of money and still get a poor return on each trade.",
  "What is still open returned more": "Money left in open trades returned more for the people who made the most.",
  "One mint in the traded list": "One coin shows up more often in the traded list of the people who made the most.",
  "Most of the profit cut is not on the tape": "Most of the people who made the most did not buy anything on this page.",
  "Names only the profit cut bought": "Some coins were bought by the people who made the most and not by the other buyers.",
  "A giant at the buy": "The people who made the most were more likely to buy a coin that was already huge.",
  "Dollars still there": "This is how much money is still sitting in the coin. The crowded coins hold more than the lonely ones.",
  Today: "This is how much the pile changed since yesterday.",
  "Share of the pile": "This is how much of everything they own sits in this one coin.",
  "On the move, off the book": "Some coins people are buying today are not in the pile they still hold.",
  "Off the book are Solana names in the largest moves that are missing from holdings. On the book are the ones that page still holds.":
    "One group is being bought today and is not in the pile. The other group is being bought and is still in the pile.",
  "Off the book": "Missing from the pile.",
  "On the book": "Still in the pile.",
  "Still sitting, quiet today": "Some coins they still hold did not move enough today to show up on the buy list.",
  "Printed and still held": "Some coins bought today are also still in the pile.",
  "Cap then and now": "The coin's size when they bought it is not the size it is now.",
  "Traded and on the move list": "A coin the winners traded is also on today's move list.",
  "Page against the book": "This page is only part of everything they hold.",
  "Two wallets or more": "These coins are held by more than one person.",
  "One wallet, on the page": "These coins are held by only one person.",
  "Off this page": "The list stopped. More coins did not fit on this page.",
  "Five names": "Five coins are most of the money on this page.",
  "The largest name": "One coin is the biggest pile on the page.",
  "Share of its own cap": "The pile they hold is a slice of the whole coin.",
  "Dollars per wallet": "The big piles have a lot of money for each person.",
  "One mint wears the tag": "A whole group label is really one coin.",
  "The next mint in the tag": "The second coin in that group is much smaller.",
  "The rest of the tag": "All the other coins in that group are the leftover.",
  "A sleeve that shares an age": "A bunch of coins launched around the same day, and they are not the big pile.",
  "One fresh prefix": "A bunch of brand new coins share the same starting mark.",
  "No sector on the batch": "Those new coins do not have a group label.",
  "The batch is not settled": "Those new coins are not a shared pile yet.",
  "A zero is untouched": "A change of zero means nobody moved that pile today.",
  "Already priced": "These coins are already big. Everyone can already see them.",
  "Thin overlap": "Lots of people hold a little. The pile is small.",
  "Fat seats": "These crowded coins are a big pile each.",
  "Still moving, or being cut": "Some crowded coins are still jumping. Some are being sold down.",
  "Four requests, one walk": "Four lists are loading.",
  "One request is in flight": "One list is loading.",
  "Age at the buy": "This is how old the coin was on the day they bought it.",
  "Size at the buy": "This is how big the coin was on the day they bought it.",
  "Positive 24h": "Money went into the coin today.",
  "Negative 24h": "Money came out of the coin today.",
  "Age under 7 days": "The coin is younger than a week.",
  "Cap under $1M": "The coin is smaller than one million dollars.",
  "Traders at least 20": "At least 20 people traded the coin.",
  "A green day against a red month": "Today money went in. Over the month more money came out.",
  "This page cannot show who left": "This list only shows coins people put money into.",
  "One chain holds the day's dollars": "Most of today's money is on one chain.",
  "Three names are the pile": "Three coins are most of the pile.",
  "Buying on the list, shrinking in the pile": "People are buying, and the pile of holders is getting smaller.",
  "Banked and still open": "Some people already took the money home. Some still have a trade open.",
  "Bought on day one": "They bought a coin that was brand new.",
};

function keepCounts(rest: string): string {
  const body = rest.replace(/^\.\s*/, "").trim();
  if (!body) return "";
  return body
    .replaceAll("Biggest moves", "The loud coins")
    .replaceAll("Quieter names", "The quiet coins")
    .replaceAll("First 50", "The loud group")
    .replaceAll("The others", "The quiet group");
}

function stripMarks(text: string): string {
  return text.replace(/\u001ft\u001f[^\u001f]*\u001f[^\u001f]*\u001f([^\u001f]*)/g, "$1").replace(/\u001fw\u001f[^\u001f]*\u001f[^\u001f]*/g, "a wallet");
}

/** Beginner reading of a line already shown in the technical voice. */
export function plainReading(text: string): string {
  const clean = stripMarks(text).trim();
  const exact = EXACT[clean];
  if (exact) return exact;
  const key = Object.keys(GLOSS)
    .filter((item) => clean.startsWith(item))
    .sort((a, b) => b.length - a.length)[0];
  if (key) return `${GLOSS[key] ?? ""} ${keepCounts(clean.slice(key.length))}`.trim();
  const stamp = stampReading(clean);
  if (stamp) return stamp;
  if (clean.includes("largest 24h moves")) return "The loud coins are on top. The quiet coins are underneath. The order is how big today's move was.";
  if (clean.includes("made the most")) return "The people who made the most money are on top. Everyone else is underneath.";
  if (clean.includes("buys in the last 24 hours")) return "These are the buys on this page. The winners are one group. The other buyers are the other group.";
  if (clean.includes("wallets still hold")) return "The coins the most people still hold are on top. The coins fewer people hold are underneath.";
  if (clean.length <= 48 && !clean.includes(".")) return clean;
  return "Two groups are side by side. One is the top of the list. The other is everyone else.";
}

function stampReading(clean: string): string | null {
  const off = clean.match(/^(\d+) of (\d+) Solana names in the largest moves are not on the holdings page\. (.+) is one\./);
  if (off) return `${off[1]} of ${off[2]} coins on the biggest moves are not in the pile. ${off[3]} is one.`;
  const cap = clean.match(/^(.+) was (\$[\d,]+) at the buy\. (.+)\. The tape is the cap then\.$/);
  if (cap) {
    const now = cap[3].replaceAll("netflow ", "the move list ").replaceAll("holdings ", "the pile ");
    return `${cap[1]} was ${cap[2]} when they bought it. Now ${now}.`;
  }
  const tag = clean.match(/^(.+?) is (\d+) names and (\$[\d,]+)\. (.+) is (\S+) of that tag\.$/);
  if (tag) return `${tag[4]} is ${tag[5]} of the ${tag[1]} label. That label is ${tag[2]} coins, ${tag[3]}.`;
  const sleeve = clean.match(/^(.+?) is (\d+) names and (\$[\d,]+)\. (\d+) of (\d+) names with at least \d+ wallets are (\d+) days old, within 2 days\./);
  if (sleeve) return `${sleeve[4]} of ${sleeve[5]} ${sleeve[1]} coins are about ${sleeve[6]} days old. They are not the big pile.`;
  const prefix = clean.match(/^(\d+) of (\d+) names aged \d+ days or less share the prefix ("[^"]+")\.$/);
  if (prefix) return `${prefix[1]} of ${prefix[2]} new coins start with ${prefix[3]}.`;
  const zero = clean.match(/^(\d+) of (\d+) names show a 24h change of exactly 0, (\$[\d,]+)\./);
  if (zero) return `${zero[1]} of ${zero[2]} coins did not move today, ${zero[3]}.`;
  const priced = clean.match(/^(\d+) names have at least (\d+) wallets and a market cap of (\$[\d,]+) or more\. (\$[\d,]+) of this page sits there\.$/);
  if (priced) return `${priced[1]} coins already have ${priced[2]} wallets and are ${priced[3]} or bigger. ${priced[4]} of this page is in them.`;
  const thin = clean.match(/^(\d+) names, (\$[\d,]+)\. At least \d+ wallets,/);
  if (thin) return `${thin[1]} coins, ${thin[2]}. Lots of wallets, small pile.`;
  if (clean === "No sector tag on this page is mostly one mint.") return "No group label on this page is really one coin.";
  if (clean.startsWith("No sector on this page shares one age")) return "No group of coins here launched around the same day.";
  if (clean.startsWith("Names aged ") && clean.endsWith("do not share one prefix.")) return "New coins do not share one starting mark.";
  return null;
}
