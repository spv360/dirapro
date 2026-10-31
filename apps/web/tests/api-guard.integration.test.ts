// Boots the production build (run `npm run build` first) and checks the publishing guard over HTTP.
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";

const owner = {
  DIRA_OWNER_PASSCODE: "test-passcode-1",
  DIRA_SESSION_SECRET: "0123456789abcdef0123",
};

// Kills the whole process group so the Next server started by npx does not outlive the test.
function stop(child: ChildProcess) {
  if (child.pid) process.kill(-child.pid);
}

async function start(port: number, env: Record<string, string>) {
  const child = spawn("npx", ["next", "start", "-p", String(port)], {
    env: { ...process.env, DIRA_DATA_DIR: mkdtempSync(path.join(tmpdir(), "dira-")), ...env },
    stdio: "ignore",
    detached: true,
  });
  const base = `http://localhost:${port}`;
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base)).ok) return { child, base };
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  stop(child);
  throw new Error("server did not start");
}

const send = (base: string, method: string, url: string, body?: BodyInit, headers: Record<string, string> = {}) =>
  fetch(base + url, { method, body, headers: { Origin: base, ...headers } });

describe("production (VERCEL=1) with owner credentials configured", () => {
  let server: { child: ChildProcess; base: string };
  before(async () => { server = await start(3071, { VERCEL: "1", ...owner }); });
  after(() => stop(server.child));

  const json = { "Content-Type": "application/json" };
  const writes: [string, string][] = [
    ["POST", "/api/journey"],
    ["PATCH", "/api/journey/x"],
    ["PUT", "/api/journey/x"],
    ["DELETE", "/api/journey/x"],
    ["POST", "/api/journey/media"],
    ["POST", "/api/owner/session"],
  ];

  for (const [method, url] of writes) {
    test(`${method} ${url} -> 503 PUBLISHING_DISABLED`, async () => {
      const response = await send(server.base, method, url, "{}", json);
      // PUT is not implemented by the route and must never succeed either.
      if (method === "PUT") return assert.ok(response.status === 405 || response.status === 503);
      assert.equal(response.status, 503);
      assert.equal(((await response.json()) as { code: string }).code, "PUBLISHING_DISABLED");
    });
  }

  test("public profile still renders", async () => {
    const response = await fetch(`${server.base}/profile/alex-morgan`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Current Moment|CURRENT MOMENT/i);
  });

  test("share page explains publishing is unavailable", async () => {
    assert.match(await (await fetch(`${server.base}/profile/alex-morgan/share`)).text(), /temporarily unavailable/);
  });

  test("public media for unknown file is 404 and owner list is rejected", async () => {
    assert.equal((await fetch(`${server.base}/api/journey/media/00000000-0000-0000-0000-000000000000.png`)).status, 404);
    assert.notEqual((await fetch(`${server.base}/api/journey`)).status, 200);
  });
});

describe("local development (no VERCEL)", () => {
  let server: { child: ChildProcess; base: string };
  before(async () => { server = await start(3072, { VERCEL: "", ...owner }); });
  after(() => stop(server.child));

  test("write endpoints enforce auth instead of the production guard", async () => {
    const response = await send(server.base, "POST", "/api/journey", "{}", { "Content-Type": "application/json" });
    assert.equal(response.status, 401);
  });

  test("owner can sign in", async () => {
    const response = await send(server.base, "POST", "/api/owner/session", JSON.stringify({ passcode: owner.DIRA_OWNER_PASSCODE }), { "Content-Type": "application/json" });
    assert.equal(response.status, 200);
  });
});
