// Security regression tests. Boots the production build (run `npm run build` first) and attacks it over HTTP.
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";

type Server = { child: ChildProcess; base: string; dir: string };

function stop(child: ChildProcess) {
  if (child.pid) process.kill(-child.pid);
}

async function start(port: number, env: Record<string, string>): Promise<Server> {
  const dir = mkdtempSync(path.join(tmpdir(), "dira-sec-"));
  const child = spawn("npx", ["next", "start", "-p", String(port)], {
    env: { ...process.env, DIRA_DATA_DIR: dir, ...env },
    stdio: "ignore",
    detached: true,
  });
  const base = `http://localhost:${port}`;
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base)).ok) return { child, base, dir };
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  stop(child);
  throw new Error("server did not start");
}

const FOREIGN = "https://evil.example";

class Client {
  cookie = "";
  base: string;
  constructor(base: string) {
    this.base = base;
  }
  /** origin: undefined = same-origin, null = header omitted, string = that value. */
  async req(method: string, url: string, body?: unknown, origin?: string | null) {
    const headers: Record<string, string> = {};
    if (origin !== null) headers.Origin = origin ?? this.base;
    if (this.cookie) headers.Cookie = this.cookie;
    let payload: BodyInit | undefined;
    if (body instanceof FormData) payload = body;
    else if (body !== undefined) {
      payload = JSON.stringify(body);
      headers["Content-Type"] = "application/json";
    }
    const response = await fetch(this.base + url, { method, headers, body: payload, redirect: "manual" });
    const set = response.headers.get("set-cookie");
    if (set) {
      const pair = set.split(";")[0];
      this.cookie = pair.endsWith("=") ? "" : pair;
    }
    return response;
  }
  json = async (method: string, url: string, body?: unknown, origin?: string | null) => {
    const response = await this.req(method, url, body, origin);
    return { status: response.status, body: await response.json().catch(() => ({})), headers: response.headers };
  };
}

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
const form = (bytes: Buffer, type: string, name = "a.png") => {
  const data = new FormData();
  data.append("file", new Blob([new Uint8Array(bytes)], { type }), name);
  return data;
};
const account = (n: string) => ({ fullName: `Test ${n}`, email: `${n}@example.com`, username: `user-${n}`, password: "correct-horse-9", terms: true });
const entry = (over: Record<string, unknown> = {}) => ({
  type: "Building", title: "Entry", description: "d", date: "2026-01-15", organization: "", tags: [], externalUrl: "",
  status: "published", visibility: "public", featured: false, currentMoment: false, media: null, ...over,
});

describe("security regressions (local development mode)", () => {
  let server: Server;
  before(async () => { server = await start(3083, { DIRA_SESSION_TTL_SECONDS: "600" }); });
  after(() => stop(server.child));

  const fresh = () => new Client(server.base);
  const register = async (n: string) => {
    const c = fresh();
    const r = await c.json("POST", "/api/auth/register", account(n));
    assert.equal(r.status, 201, JSON.stringify(r.body));
    return c;
  };

  test("cross-origin / missing Origin is rejected on every mutation endpoint; same-origin works", async () => {
    const owner = await register("origin");
    const created = await owner.json("POST", "/api/journey", entry());
    assert.equal(created.status, 201);
    const id = created.body.item.id as string;
    const identity = { section: "identity", data: { fullName: "Test origin", username: "user-origin", headline: "h", location: "" } };

    const mutations: [string, string, () => unknown][] = [
      ["POST", "/api/auth/register", () => account("victim")],
      ["POST", "/api/auth/login", () => ({ identifier: "user-origin", password: "correct-horse-9" })],
      ["POST", "/api/auth/logout", () => undefined],
      ["PATCH", "/api/profile", () => identity],
      ["POST", "/api/profile/publish", () => ({ published: true })],
      ["POST", "/api/profile/media", () => form(PNG, "image/png")],
      ["POST", "/api/journey", () => entry({ title: "x" })],
      ["PATCH", `/api/journey/${id}`, () => entry({ title: "hijacked" })],
      ["DELETE", `/api/journey/${id}`, () => undefined],
      ["POST", "/api/journey/media", () => form(PNG, "image/png")],
    ];
    for (const [method, url, body] of mutations) {
      for (const origin of [FOREIGN, null, "null"]) {
        const r = await owner.json(method, url, body(), origin);
        assert.equal(r.status, 403, `${method} ${url} origin=${origin}`);
      }
    }
    // nothing above had any effect
    assert.equal((await fresh().json("POST", "/api/auth/login", { identifier: "victim@example.com", password: "correct-horse-9" })).status, 401);
    const items = (await owner.json("GET", "/api/journey")).body.items;
    assert.equal(items.length, 1);
    assert.equal(items[0].title, "Entry");
    assert.equal((await owner.json("GET", "/api/profile")).status, 200, "cross-origin logout must not end the session");

    // same-origin equivalents succeed
    assert.equal((await owner.json("PATCH", "/api/profile", identity)).status, 200);
    assert.equal((await owner.json("POST", "/api/profile/media", form(PNG, "image/png"))).status, 201);
    assert.equal((await owner.json("POST", "/api/journey/media", form(PNG, "image/png"))).status, 201);
    assert.equal((await owner.json("PATCH", `/api/journey/${id}`, entry({ title: "Updated" }))).status, 200);
    assert.equal((await fresh().json("POST", "/api/auth/register", account("victim"))).status, 201);
    assert.equal((await fresh().json("POST", "/api/auth/login", { identifier: "user-origin", password: "correct-horse-9" })).status, 200);
    assert.equal((await owner.json("DELETE", `/api/journey/${id}`)).status, 200);
    assert.equal((await owner.json("POST", "/api/auth/logout")).status, 200);
  });

  test("login lockout: 5 failures -> 429, even the correct password is refused", async () => {
    await register("lock");
    const attacker = fresh();
    for (let i = 0; i < 5; i++) {
      assert.equal((await attacker.json("POST", "/api/auth/login", { identifier: "user-lock", password: "wrong-password-1" })).status, 401, `attempt ${i + 1}`);
    }
    const locked = await fresh().json("POST", "/api/auth/login", { identifier: "user-lock", password: "correct-horse-9" });
    assert.equal(locked.status, 429);
    assert.ok(!locked.headers.get("set-cookie"), "no session is issued while locked");
    // another account is unaffected
    await register("unlocked");
    assert.equal((await fresh().json("POST", "/api/auth/login", { identifier: "user-unlocked", password: "correct-horse-9" })).status, 200);
  });

  test("logout kills the session and a replayed token gets 401 on every owner API", async () => {
    const c = await register("replay");
    const token = c.cookie;
    assert.equal((await c.json("GET", "/api/profile")).status, 200);
    assert.equal((await c.json("POST", "/api/auth/logout")).status, 200);
    const replay = fresh();
    replay.cookie = token;
    for (const [method, url, body] of [
      ["GET", "/api/profile"],
      ["PATCH", "/api/profile", { section: "about", data: {} }],
      ["POST", "/api/profile/publish", { published: true }],
      ["POST", "/api/profile/media", form(PNG, "image/png")],
      ["GET", "/api/journey"],
      ["POST", "/api/journey", entry()],
      ["POST", "/api/journey/media", form(PNG, "image/png")],
    ] as [string, string, unknown?][]) {
      assert.equal((await replay.json(method, url, body)).status, 401, `${method} ${url}`);
    }
    assert.equal((await replay.req("GET", "/dashboard")).status, 307);
    // the browser form target also invalidates server-side
    const c2 = await register("replay2");
    const token2 = c2.cookie;
    assert.equal((await c2.req("POST", "/logout")).status, 303);
    const replay2 = fresh();
    replay2.cookie = token2;
    assert.equal((await replay2.json("GET", "/api/profile")).status, 401);
  });

  test("unauthenticated pages and owner routes are rejected or redirected", async () => {
    const owner = await register("pages");
    await owner.json("PATCH", "/api/profile", { section: "identity", data: { fullName: "Pages", username: "user-pages", headline: "h", location: "" } });
    await owner.json("POST", "/api/profile/publish", { published: true });
    const anon = fresh();
    for (const page of ["/dashboard", "/onboarding", "/dashboard/profile/identity", "/dashboard/profile/experience"]) {
      const r = await anon.req("GET", page);
      assert.equal(r.status, 307, page);
      assert.match(r.headers.get("location") ?? "", /\/login/, page);
    }
    // share workspace of a real profile redirects visitors to sign in; of an unknown one is 404
    const share = await anon.req("GET", "/profile/user-pages/share");
    assert.equal(share.status, 307);
    assert.match(share.headers.get("location") ?? "", /\/login/);
    assert.equal((await anon.req("GET", "/profile/nobody-here/share")).status, 404);
    // another signed-in user is not the owner either
    const other = await register("pages-other");
    const shared = await other.req("GET", "/profile/user-pages/share");
    assert.equal(shared.status, 307);
    // owner APIs
    for (const [method, url, body] of [
      ["GET", "/api/journey"], ["POST", "/api/journey", entry()], ["PATCH", "/api/journey/x", entry()],
      ["DELETE", "/api/journey/x"], ["POST", "/api/journey/media", form(PNG, "image/png")],
    ] as [string, string, unknown?][]) {
      assert.equal((await anon.json(method, url, body)).status, 401, `${method} ${url}`);
    }
  });

  test("media: oversized, fake, SVG and non-image uploads are rejected on both upload routes", async () => {
    const c = await register("upl");
    const big = Buffer.concat([PNG.subarray(0, 8), Buffer.alloc(8 * 1024 * 1024 + 1)]);
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>');
    for (const url of ["/api/profile/media", "/api/journey/media"]) {
      assert.equal((await c.json("POST", url, form(big, "image/png"))).status, 413, `${url} oversized`);
      assert.equal((await c.json("POST", url, form(Buffer.from("not an image"), "image/png"))).status, 415, `${url} fake png`);
      assert.equal((await c.json("POST", url, form(svg, "image/svg+xml", "a.svg"))).status, 415, `${url} svg mime`);
      assert.equal((await c.json("POST", url, form(svg, "image/png", "a.png"))).status, 415, `${url} svg as png`);
      assert.equal((await c.json("POST", url, form(Buffer.from("<html>"), "text/html", "a.html"))).status, 415, `${url} html`);
      assert.equal((await c.json("POST", url, new FormData())).status, 400, `${url} no file`);
    }
    assert.equal((await c.json("POST", "/api/profile/media", form(PNG, "image/png"))).status, 201);
  });

  test("media: path traversal and malformed names never resolve", async () => {
    const c = await register("trav");
    const up = await c.json("POST", "/api/profile/media", form(PNG, "image/png"));
    const profileId = up.body.url.split("/")[4] as string;
    const file = up.body.media.file as string;
    const jup = await c.json("POST", "/api/journey/media", form(PNG, "image/png"));
    const jfile = jup.body.media.file as string;
    const bad = [
      `/api/media/profile/${profileId}/..%2F..%2Fplatform.json`,
      `/api/media/profile/${profileId}/%2e%2e%2fplatform.json`,
      `/api/media/profile/..%2F..%2Fuploads/${file}`,
      `/api/media/profile/${profileId}/${file}%00.png`,
      `/api/media/profile/${profileId}/${file.replace(".png", ".svg")}`,
      `/api/media/profile/${profileId}/x.png`,
      `/api/journey/media/..%2Fplatform.json`,
      `/api/journey/media/%2e%2e%2fjourney.json`,
      `/api/journey/media/${jfile.replace(".png", ".html")}`,
      `/api/journey/media/not-a-uuid.png`,
    ];
    for (const url of bad) assert.equal((await c.req("GET", url)).status, 404, url);
    assert.equal((await c.req("GET", `/api/media/profile/${profileId}/${file}`)).status, 200);
    assert.equal((await fresh().req("GET", "/.data/platform.json")).status, 404);
  });

  test("isolation: cross-user edits, item ids, media and mass assignment", async () => {
    const alice = await register("iso-a");
    const bob = await register("iso-b");
    const aProfile = (await alice.json("GET", "/api/profile")).body.profile.profile;
    await alice.json("PATCH", "/api/profile", { section: "identity", data: { fullName: "Alice", username: "user-iso-a", headline: "Alice head", location: "" } });
    const aMedia = (await alice.json("POST", "/api/profile/media", form(PNG, "image/png"))).body;
    await alice.json("PATCH", "/api/profile", { section: "identity", data: { fullName: "Alice", username: "user-iso-a", headline: "Alice head", location: "", profileImage: aMedia.media } });
    const exp = await alice.json("PATCH", "/api/profile", { section: "experience", data: [{ title: "Alice job", organization: "A Corp" }] });
    const aExpId = exp.body.profile.experience[0].id as string;
    await alice.json("POST", "/api/profile/publish", { published: true });

    // Bob cannot edit Alice's profile: the API only ever addresses his own, and ids from Alice are not honoured
    const hijack = await bob.json("PATCH", "/api/profile", { section: "experience", data: [{ id: aExpId, title: "Hijack", organization: "B Corp" }] });
    assert.equal(hijack.status, 200);
    assert.notEqual(hijack.body.profile.experience[0].id, aExpId);
    const aliceNow = (await alice.json("GET", "/api/profile")).body.profile;
    assert.equal(aliceNow.experience.length, 1);
    assert.equal(aliceNow.experience[0].title, "Alice job");
    assert.equal(aliceNow.profile.headline, "Alice head");

    // client-supplied profile/owner identifiers are ignored
    const forged = await bob.json("PATCH", "/api/profile", { section: "about", profileId: aProfile.id, ownerId: aProfile.ownerId, data: { biography: "bob bio", profileId: aProfile.id, ownerId: aProfile.ownerId } });
    assert.equal(forged.status, 200);
    assert.equal((await alice.json("GET", "/api/profile")).body.profile.profile.biography, "");

    // Bob cannot take Alice's username nor attach her media
    assert.equal((await bob.json("PATCH", "/api/profile", { section: "identity", data: { fullName: "Bob", username: "user-iso-a" } })).status, 409);
    const steal = await bob.json("PATCH", "/api/profile", { section: "identity", data: { fullName: "Bob", username: "user-iso-b", profileImage: aMedia.media } });
    assert.equal(steal.status, 422);
    assert.equal((await bob.json("PATCH", "/api/profile", { section: "contributions", data: [{ title: "c", media: aMedia.media }] })).status, 422);

    // mass assignment of ownership/status is ignored
    await bob.json("PATCH", "/api/profile", { section: "about", data: { biography: "x", status: "published", ownerId: aProfile.ownerId, publishedAt: "2020-01-01" } });
    await bob.json("PATCH", "/api/profile", { section: "identity", status: "published", ownerId: aProfile.ownerId, data: { fullName: "Bob", username: "user-iso-b", status: "published", ownerId: aProfile.ownerId, id: aProfile.id } });
    const bobNow = (await bob.json("GET", "/api/profile")).body.profile.profile;
    assert.equal(bobNow.status, "draft");
    assert.notEqual(bobNow.ownerId, aProfile.ownerId);
    assert.notEqual(bobNow.id, aProfile.id);
    assert.equal(bobNow.publishedAt, null);
    assert.equal((await fresh().req("GET", "/profile/user-iso-b")).status, 404);

    // Journey: Bob cannot read, edit, delete or hijack Alice's item, and cannot attach her media
    const jm = (await alice.json("POST", "/api/journey/media", form(PNG, "image/png"))).body.media;
    const item = (await alice.json("POST", "/api/journey", entry({ title: "Alice private work", media: jm }))).body.item;
    assert.ok(!JSON.stringify((await bob.json("GET", "/api/journey")).body).includes("Alice private work"));
    assert.equal((await bob.json("PATCH", `/api/journey/${item.id}`, entry({ title: "pwn" }))).status, 404);
    assert.equal((await bob.json("DELETE", `/api/journey/${item.id}`)).status, 404);
    const reuse = await bob.json("POST", "/api/journey", entry({ title: "reuse", media: jm }));
    assert.equal(reuse.status, 409);
    const forgedItem = await bob.json("POST", "/api/journey", entry({ title: "forged", profileId: aProfile.id, id: item.id }));
    assert.equal(forgedItem.status, 201);
    assert.equal(forgedItem.body.item.profileId, bobNow.id);
    assert.notEqual(forgedItem.body.item.id, item.id);
    const aliceItems = (await alice.json("GET", "/api/journey")).body.items;
    assert.equal(aliceItems.length, 1);
    assert.equal(aliceItems[0].title, "Alice private work");
  });

  test("concurrent registration: one winner per username and per email", async () => {
    const names = await Promise.all(Array.from({ length: 10 }, (_, i) =>
      fresh().json("POST", "/api/auth/register", { ...account(`race${i}`), username: "contested-name" })));
    assert.equal(names.filter((r) => r.status === 201).length, 1, names.map((r) => r.status).join());
    assert.equal(names.filter((r) => r.status === 409).length, 9);
    const emails = await Promise.all(Array.from({ length: 10 }, (_, i) =>
      fresh().json("POST", "/api/auth/register", { ...account(`mail${i}`), email: "contested@example.com" })));
    assert.equal(emails.filter((r) => r.status === 201).length, 1);
    assert.equal(emails.filter((r) => r.status === 409).length, 9);
    // the single winner can sign in and the store stays consistent
    assert.equal((await fresh().json("GET", "/api/auth/username?u=contested-name")).body.available, false);
  });

  test("media visibility: draft, unpublished and other users, then immediate removal on unpublish", async () => {
    const alice = await register("vis-a");
    const bob = await register("vis-b");
    await alice.json("PATCH", "/api/profile", { section: "identity", data: { fullName: "Vis", username: "user-vis-a", headline: "h", location: "" } });
    const m = (await alice.json("POST", "/api/profile/media", form(PNG, "image/png"))).body;
    await alice.json("PATCH", "/api/profile", { section: "identity", data: { fullName: "Vis", username: "user-vis-a", headline: "h", location: "", profileImage: m.media } });
    const anon = fresh();
    const code = async (c: Client, url: string) => (await c.req("GET", url)).status;
    assert.deepEqual([await code(anon, m.url), await code(bob, m.url), await code(alice, m.url)], [404, 404, 200], "draft profile");
    await alice.json("POST", "/api/profile/publish", { published: true });
    assert.deepEqual([await code(anon, m.url), await code(bob, m.url)], [200, 200], "published profile");
    await alice.json("POST", "/api/profile/publish", { published: false });
    assert.deepEqual([await code(anon, m.url), await code(bob, m.url), await code(alice, m.url)], [404, 404, 200], "unpublished profile");
  });
});

describe("production (VERCEL=1): nothing is written", () => {
  let server: Server;
  before(async () => { server = await start(3084, { VERCEL: "1" }); });
  after(() => stop(server.child));

  const files = (dir: string) => (existsSync(dir) ? readdirSync(dir, { recursive: true }).map(String) : []);

  test("every write is refused and leaves no profile, Journey, media or session behind", async () => {
    const c = new Client(server.base);
    const id = "11111111-1111-4111-8111-111111111111";
    const writes: [string, string, unknown?][] = [
      ["POST", "/api/auth/register", account("prod")],
      ["POST", "/api/auth/login", { identifier: "user-prod", password: "correct-horse-9" }],
      ["POST", "/api/auth/logout"],
      ["PATCH", "/api/profile", { section: "about", data: { biography: "x" } }],
      ["POST", "/api/profile/publish", { published: true }],
      ["POST", "/api/profile/media", form(PNG, "image/png")],
      ["POST", "/api/journey", entry()],
      ["PATCH", `/api/journey/${id}`, entry()],
      ["DELETE", `/api/journey/${id}`],
      ["POST", "/api/journey/media", form(PNG, "image/png")],
      ["POST", "/api/owner/session", { passcode: "whatever-passcode" }],
    ];
    // includes hostile / missing Origins: the production guard must answer first
    for (const origin of [undefined, FOREIGN, null]) {
      for (const [method, url, body] of writes) {
        const r = await c.json(method, url, body, origin);
        assert.equal(r.status, 503, `${method} ${url} origin=${origin}`);
        assert.ok(["ACCOUNTS_DISABLED", "PUBLISHING_DISABLED"].includes(r.body.code), `${method} ${url} code=${r.body.code}`);
        assert.ok(!r.headers.get("set-cookie"), `${method} ${url} must not set a cookie`);
      }
    }
    // a forged session cookie does not open anything either
    c.cookie = "dira_session=forged-token";
    assert.equal((await c.json("PATCH", "/api/profile", { section: "about", data: {} })).status, 503);

    // public reads work and the demo is untouched
    for (const url of ["/", "/profile/alex-morgan"]) assert.equal((await c.req("GET", url)).status, 200, url);
    assert.match(await (await c.req("GET", "/profile/alex-morgan")).text(), /Alex Morgan/);
    assert.equal((await c.req("GET", "/profile/user-prod")).status, 404);
    assert.equal((await c.req("GET", "/api/media/profile/" + id + "/" + id + ".png")).status, 404);
    assert.equal((await c.req("GET", "/dashboard")).status, 307);

    // nothing was persisted: no platform/journey database, no uploads, no users or sessions
    assert.ok(!existsSync(path.join(server.dir, "platform.json")), "platform.json must not exist");
    assert.ok(!existsSync(path.join(server.dir, "journey.json")), "journey.json must not exist");
    assert.deepEqual(files(path.join(server.dir, "uploads")), [], "no media written");
    assert.deepEqual(files(server.dir).filter((f) => !f.startsWith("uploads")), [], "data dir must stay empty");
  });
});
