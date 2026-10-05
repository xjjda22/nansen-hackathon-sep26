import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { nansenPost, setFileCache } from "./nansen";

const KEY = "test:cache-off:v1";
const FILE = path.join(process.cwd(), "data", "nansen", "test-cache-off-v1.json");

test("with Disk cache off every call goes to Nansen, and the response is still saved", async () => {
  const realFetch = globalThis.fetch;
  const realKey = process.env.NANSEN_API_KEY;
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    return new Response(JSON.stringify({ data: [calls] }), {
      status: 200,
      headers: { "x-nansen-credits-used": "5" },
    });
  }) as typeof fetch;
  process.env.NANSEN_API_KEY = "test";
  await rm(FILE, { force: true });
  try {
    setFileCache(false);
    const first = await nansenPost("/test", {}, 5, KEY);
    assert.equal(first.cached, false);
    assert.ok(existsSync(FILE), "the off call wrote data/nansen");

    const second = await nansenPost("/test", {}, 5, KEY);
    assert.equal(second.cached, false);
    assert.deepEqual(second.body, { data: [2] });
    assert.equal(calls, 2);

    setFileCache(true);
    const third = await nansenPost("/test", {}, 5, KEY);
    assert.equal(third.cached, true);
    assert.equal(third.creditsUsed, 0);
    assert.deepEqual(third.body, { data: [2] }, "on reads the newest saved body");
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = realFetch;
    if (realKey === undefined) delete process.env.NANSEN_API_KEY;
    else process.env.NANSEN_API_KEY = realKey;
    setFileCache(true);
    await rm(FILE, { force: true });
  }
});
