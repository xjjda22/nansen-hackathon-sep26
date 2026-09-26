import assert from "node:assert/strict";
import test from "node:test";
import { plainReading } from "./plain";

test("simple reading keeps a known line and covers an unknown one", () => {
  assert.match(plainReading("Dollars still there. First 50: $1. The others: $2."), /crowded coins/);
  assert.match(plainReading("Dollars still there. First 50: $1. The others: $2."), /\$1/);
  assert.match(plainReading("Some brand new sentence the desk has not named."), /Two groups/);
  assert.equal(plainReading("None."), "Nothing on this side.");
  assert.equal(
    plainReading("8 of 50 Solana names in the largest moves are not on the holdings page. FIREMAKING is one. This page is not the whole book."),
    "8 of 50 coins on the biggest moves are not in the pile. FIREMAKING is one.",
  );
  assert.equal(
    plainReading("12 names, $40,000. At least 9 wallets, cohort value under $50,000. The label is not an order."),
    "12 coins, $40,000. Lots of wallets, small pile.",
  );
  assert.equal(plainReading("The address needs a chain"), "Same address, two chains. You need both.");
  assert.equal(plainReading("The thin seat left the busiest chain"), "The little coin lots of people share is on a different chain.");
});
