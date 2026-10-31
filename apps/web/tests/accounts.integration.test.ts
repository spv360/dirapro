// Boots the production build (run `npm run build` first) and exercises accounts, profiles and media over HTTP.
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";

type Server = { child: ChildProcess; base: string };

function stop(child: ChildProcess) {
  if (child.pid) process.kill(-child.pid);
}

async function start(port: number, env: Record<string, string>): Promise<Server> {
  const child = spawn("npx", ["next", "start", "-p", String(port)], {
    env: { ...process.env, DIRA_DATA_DIR: mkdtempSync(path.join(tmpdir(), "dira-acct-")), ...env },
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

/** Minimal browser: keeps the session cookie and sends a same-origin Origin header. */
class Client {
  cookie = "";
  base: string;
  constructor(base: string) {
    this.base = base;
  }

  async req(method: string, url: string, body?: unknown, extra: Record<string, string> = {}) {
    const headers: Record<string, string> = { Origin: this.base, ...extra };
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
  json = async (method: string, url: string, body?: unknown) => {
    const response = await this.req(method, url, body);
    return { status: response.status, body: await response.json().catch(() => ({})), headers: response.headers };
  };
}

// 1x1 PNG
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
const upload = (bytes: Buffer, type: string, name = "a.png") => {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(bytes)], { type }), name);
  return form;
};

const account = (n: string) => ({ fullName: `Test ${n}`, email: `${n}@example.com`, username: `user-${n}`, password: "correct-horse-9", terms: true });

describe("local accounts", () => {
  let server: Server;
  before(async () => { server = await start(3081, { DIRA_SESSION_TTL_SECONDS: "3" }); });
  after(() => stop(server.child));

  const a = () => new Client(server.base);
  let alice: Client;
  let bob: Client;
  let aliceProfileId = "";

  test("registration validates, creates a session and rejects duplicates", async () => {
    alice = a();
    assert.equal((await alice.json("POST", "/api/auth/register", { ...account("alice"), password: "short" })).status, 422);
    assert.equal((await alice.json("POST", "/api/auth/register", { ...account("alice"), username: "alex-morgan" })).status, 422);
    assert.equal((await alice.json("POST", "/api/auth/register", { ...account("alice"), terms: false })).status, 422);

    const created = await alice.json("POST", "/api/auth/register", account("alice"));
    assert.equal(created.status, 201);
    assert.ok(!JSON.stringify(created.body).includes("passwordHash"));
    const cookie = created.headers.get("set-cookie") ?? "";
    assert.match(cookie, /dira_session=/);
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=lax/i);

    assert.equal((await a().json("POST", "/api/auth/register", { ...account("alice"), username: "other-name" })).status, 409);
    assert.equal((await a().json("POST", "/api/auth/register", { ...account("zed"), email: "alice@example.com" })).status, 409);
    assert.equal((await a().json("POST", "/api/auth/register", { ...account("alice"), email: "new@example.com" })).status, 409);
  });

  test("cross-origin registration is rejected", async () => {
    const response = await fetch(server.base + "/api/auth/register", {
      method: "POST", headers: { Origin: "https://evil.example", "Content-Type": "application/json" }, body: JSON.stringify(account("evil")),
    });
    assert.equal(response.status, 403);
  });

  test("username availability endpoint", async () => {
    assert.equal((await a().json("GET", "/api/auth/username?u=user-alice")).body.available, false);
    assert.equal((await a().json("GET", "/api/auth/username?u=fresh-name")).body.available, true);
    assert.equal((await a().json("GET", "/api/auth/username?u=admin")).body.available, false);
  });

  test("login: wrong password is generic, email and username both work", async () => {
    const wrong = await a().json("POST", "/api/auth/login", { identifier: "alice@example.com", password: "wrong-password-1" });
    const unknown = await a().json("POST", "/api/auth/login", { identifier: "nobody@example.com", password: "wrong-password-1" });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.equal(wrong.body.error, unknown.body.error);

    const byEmail = a();
    assert.equal((await byEmail.json("POST", "/api/auth/login", { identifier: "ALICE@example.com", password: "correct-horse-9" })).status, 200);
    const byName = a();
    assert.equal((await byName.json("POST", "/api/auth/login", { identifier: "user-alice", password: "correct-horse-9" })).status, 200);
  });

  test("login is throttled after repeated failures", async () => {
    let last = 0;
    for (let i = 0; i < 7; i++) last = (await a().json("POST", "/api/auth/login", { identifier: "throttle@example.com", password: "nope-nope-1" })).status;
    assert.equal(last, 429);
  });

  test("profile API requires a session", async () => {
    assert.equal((await a().json("GET", "/api/profile")).status, 401);
    assert.equal((await a().json("PATCH", "/api/profile", { section: "about", data: {} })).status, 401);
    assert.equal((await a().json("POST", "/api/profile/publish", { published: true })).status, 401);
    assert.equal((await a().json("POST", "/api/profile/media")).status, 401);
    assert.equal((await a().req("GET", "/dashboard")).status, 307);
  });

  test("owner builds the profile; drafts stay private until published", async () => {
    const draft = await alice.json("GET", "/api/profile");
    assert.equal(draft.status, 200);
    aliceProfileId = draft.body.profile.profile.id;
    assert.equal(draft.body.profile.profile.status, "draft");

    // cannot publish without headline
    assert.equal((await alice.json("POST", "/api/profile/publish", { published: true })).status, 422);

    const identity = await alice.json("PATCH", "/api/profile", { section: "identity", data: { fullName: "Dr Alice Test", headline: "Cardiologist", username: "user-alice", location: "Pune", profileImage: null, coverImage: null } });
    assert.equal(identity.status, 200);
    assert.equal((await alice.json("PATCH", "/api/profile", { section: "about", data: { biography: "Alice is a cardiologist.", interests: ["Heart health"] } })).status, 200);
    const expertise = await alice.json("PATCH", "/api/profile", { section: "expertise", data: [{ name: "Cardiology", category: "domain" }] });
    assert.equal(expertise.status, 200);
    assert.equal((await alice.json("PATCH", "/api/profile", { section: "experience", data: [{ title: "Consultant", organization: "City Hospital", startDate: "2019-04", current: true }] })).status, 200);
    assert.equal((await alice.json("PATCH", "/api/profile", { section: "presence", data: [{ platform: "GitHub", label: "alice", url: "https://github.com/alice" }] })).status, 200);
    assert.equal((await alice.json("PATCH", "/api/profile", { section: "presence", data: [{ platform: "Website", url: "javascript:alert(1)" }] })).status, 422);
    assert.equal((await alice.json("PATCH", "/api/profile", { section: "nonsense", data: [] })).status, 400);

    // persisted across a fresh login (new session)
    const again = a();
    await again.json("POST", "/api/auth/login", { identifier: "user-alice", password: "correct-horse-9" });
    const reloaded = await again.json("GET", "/api/profile");
    assert.equal(reloaded.body.profile.expertise[0].name, "Cardiology");
    assert.equal(reloaded.body.profile.completion.percent > 0, true);

    // draft: owner 200, anonymous and other users 404
    assert.equal((await alice.req("GET", "/profile/user-alice")).status, 200);
    assert.equal((await a().req("GET", "/profile/user-alice")).status, 404);

    bob = a();
    assert.equal((await bob.json("POST", "/api/auth/register", account("bob"))).status, 201);
    assert.equal((await bob.req("GET", "/profile/user-alice")).status, 404);

    assert.equal((await alice.json("POST", "/api/profile/publish", { published: true })).status, 200);
    const publicPage = await a().req("GET", "/profile/user-alice");
    assert.equal(publicPage.status, 200);
    const html = await publicPage.text();
    assert.match(html, /Dr Alice Test/);
    assert.match(html, /Cardiology/);
    assert.match(html, /City Hospital/);
    assert.doesNotMatch(html, /alex morgan/i);

    assert.equal((await alice.json("POST", "/api/profile/publish", { published: false })).status, 200);
    assert.equal((await a().req("GET", "/profile/user-alice")).status, 404);
    await alice.json("POST", "/api/profile/publish", { published: true });
  });

  test("users cannot read or modify each other's data", async () => {
    const bobProfile = await bob.json("GET", "/api/profile");
    assert.equal(bobProfile.body.profile.expertise.length, 0);
    assert.notEqual(bobProfile.body.profile.profile.id, aliceProfileId);

    // Bob submits Alice's item id; it must not be reused or touch Alice's row.
    const aliceItemId = (await alice.json("GET", "/api/profile")).body.profile.expertise[0].id;
    const forged = await bob.json("PATCH", "/api/profile", { section: "expertise", data: [{ id: aliceItemId, name: "Forged" }] });
    assert.equal(forged.status, 200);
    assert.notEqual(forged.body.profile.expertise[0].id, aliceItemId);
    assert.equal((await alice.json("GET", "/api/profile")).body.profile.expertise[0].name, "Cardiology");

    // Bob cannot claim Alice's username or image
    assert.equal((await bob.json("PATCH", "/api/profile", { section: "identity", data: { fullName: "Bob", username: "user-alice" } })).status, 409);
    assert.equal(
      (await bob.json("PATCH", "/api/profile", { section: "identity", data: { fullName: "Bob", username: "user-bob", profileImage: { file: "00000000-0000-4000-8000-000000000000.png", mimeType: "image/png", size: 10 } } })).status,
      422,
    );
  });

  test("media: validation, ownership and visibility", async () => {
    assert.equal((await alice.req("POST", "/api/profile/media", upload(PNG, "image/gif", "a.gif"))).status, 415);
    assert.equal((await alice.req("POST", "/api/profile/media", upload(Buffer.from("not an image at all"), "image/png"))).status, 415);
    assert.equal((await alice.req("POST", "/api/profile/media", upload(Buffer.alloc(8 * 1024 * 1024 + 1, 1), "image/png"))).status, 413);
    assert.equal((await alice.req("POST", "/api/profile/media", new FormData())).status, 400);

    const ok = await alice.req("POST", "/api/profile/media", upload(PNG, "image/png"));
    assert.equal(ok.status, 201);
    const { media, url } = await ok.json();
    assert.match(url, new RegExp(`^/api/media/profile/${aliceProfileId}/`));

    // unreferenced upload: owner only
    assert.equal((await alice.req("GET", url)).status, 200);
    assert.equal((await a().req("GET", url)).status, 404);
    assert.equal((await bob.req("GET", url)).status, 404);

    // attach as profile photo; published profile makes it public
    const saved = await alice.json("PATCH", "/api/profile", { section: "identity", data: { fullName: "Dr Alice Test", headline: "Cardiologist", username: "user-alice", profileImage: media } });
    assert.equal(saved.status, 200);
    const publicImage = await a().req("GET", url);
    assert.equal(publicImage.status, 200);
    assert.equal(publicImage.headers.get("content-type"), "image/png");
    assert.equal(publicImage.headers.get("x-content-type-options"), "nosniff");

    // unpublished => private again
    await alice.json("POST", "/api/profile/publish", { published: false });
    assert.equal((await a().req("GET", url)).status, 404);
    assert.equal((await alice.req("GET", url)).status, 200);
    await alice.json("POST", "/api/profile/publish", { published: true });

    // traversal and malformed names never reach the filesystem
    for (const bad of [`/api/media/profile/${aliceProfileId}/..%2F..%2Fplatform.json`, `/api/media/profile/..%2F..%2F/x.png`, `/api/media/profile/${aliceProfileId}/x.png`]) {
      assert.equal((await alice.req("GET", bad)).status, 404, bad);
    }
  });

  test("Journey: account owner publishes to their own profile only", async () => {
    const entry = { type: "Building", title: "Cardiac registry", description: "Building a registry.", date: "2026-01-15", organization: "", tags: [], externalUrl: "", status: "published", visibility: "public", featured: false, currentMoment: false, media: null };
    assert.equal((await a().json("POST", "/api/journey", entry)).status, 401);
    const created = await alice.json("POST", "/api/journey", entry);
    assert.equal(created.status, 201);
    assert.equal(created.body.item.profileId, aliceProfileId);

    assert.match(await (await a().req("GET", "/profile/user-alice")).text(), /Cardiac registry/);
    assert.doesNotMatch(await (await a().req("GET", "/profile/alex-morgan")).text(), /Cardiac registry/);

    // Bob cannot see or delete Alice's item
    assert.equal((await bob.json("GET", "/api/journey")).body.items.length, 0);
    assert.equal((await bob.json("DELETE", `/api/journey/${created.body.item.id}`)).status, 404);
    assert.equal((await alice.json("GET", "/api/journey")).body.items.length, 1);
  });

  test("Journey media visibility follows item status, visibility and profile publication", async () => {
    const base = { type: "Building", description: "d", date: "2026-01-15", organization: "", tags: [], externalUrl: "", featured: false, currentMoment: false };
    const make = async (title: string, status: string, visibility: string) => {
      const up = await alice.json("POST", "/api/journey/media", upload(PNG, "image/png"));
      assert.equal(up.status, 201);
      const item = await alice.json("POST", "/api/journey", { ...base, title, status, visibility, media: up.body.media });
      assert.equal(item.status, 201, JSON.stringify(item.body));
      return { id: item.body.item.id as string, url: `/api/journey/media/${up.body.media.file}`, media: up.body.media, title };
    };
    const pub = await make("Pub", "published", "public");
    const priv = await make("Priv", "published", "private");
    const draft = await make("Draft", "draft", "public");
    const arch = await make("Arch", "archived", "public");
    const status = async (client: Client, url: string) => (await client.req("GET", url)).status;
    const anon = a();

    // profile is published (from earlier tests): only the published public item is public
    await alice.json("POST", "/api/profile/publish", { published: true });
    assert.equal(await status(anon, pub.url), 200);
    for (const hidden of [priv, draft, arch]) {
      assert.equal(await status(anon, hidden.url), 404, hidden.title);
      assert.equal(await status(bob, hidden.url), 404, `${hidden.title} (other user)`);
      assert.equal(await status(alice, hidden.url), 200, `${hidden.title} (owner)`);
    }

    // unpublishing the profile closes public media, owner keeps access
    assert.equal((await alice.json("POST", "/api/profile/publish", { published: false })).status, 200);
    assert.equal(await status(anon, pub.url), 404);
    assert.equal(await status(bob, pub.url), 404);
    assert.equal(await status(alice, pub.url), 200);

    // republishing restores it, and private stays private
    assert.equal((await alice.json("POST", "/api/profile/publish", { published: true })).status, 200);
    assert.equal(await status(anon, pub.url), 200);
    assert.equal(await status(anon, priv.url), 404);

    // moving the item out of public view closes it again
    await alice.json("PATCH", `/api/journey/${pub.id}`, { ...base, title: "Pub", status: "archived", visibility: "public", media: pub.media });
    assert.equal(await status(anon, pub.url), 404);
    assert.equal(await status(alice, pub.url), 200);
  });

  test("demo profile still renders", async () => {
    const response = await a().req("GET", "/profile/alex-morgan");
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Alex Morgan/);
    assert.equal((await a().req("GET", "/profile/does-not-exist")).status, 404);
  });

  test("logout destroys the session server-side", async () => {
    const saved = alice.cookie;
    const out = await alice.json("POST", "/api/auth/logout");
    assert.equal(out.status, 200);
    // the old token must be dead even if a client kept it
    const stale = a();
    stale.cookie = saved;
    assert.equal((await stale.json("GET", "/api/profile")).status, 401);
    assert.equal((await a().req("GET", "/logout")).status, 303);
  });

  test("sessions expire", async () => {
    const c = a();
    await c.json("POST", "/api/auth/login", { identifier: "user-bob", password: "correct-horse-9" });
    assert.equal((await c.json("GET", "/api/profile")).status, 200);
    await new Promise((resolve) => setTimeout(resolve, 3500));
    assert.equal((await c.json("GET", "/api/profile")).status, 401);
  });
});

describe("production (VERCEL=1): accounts disabled", () => {
  let server: Server;
  before(async () => { server = await start(3082, { VERCEL: "1" }); });
  after(() => stop(server.child));

  test("registration, login and every mutation return 503 ACCOUNTS_DISABLED", async () => {
    const c = new Client(server.base);
    const calls: [string, string, unknown?][] = [
      ["POST", "/api/auth/register", account("prod")],
      ["POST", "/api/auth/login", { identifier: "x", password: "y" }],
      ["POST", "/api/auth/logout"],
      ["GET", "/api/auth/username?u=abc"],
      ["GET", "/api/profile"],
      ["PATCH", "/api/profile", { section: "about", data: {} }],
      ["POST", "/api/profile/publish", { published: true }],
      ["POST", "/api/profile/media", upload(PNG, "image/png")],
    ];
    for (const [method, url, body] of calls) {
      const response = await c.json(method, url, body);
      assert.equal(response.status, 503, `${method} ${url}`);
      assert.equal(response.body.code, "ACCOUNTS_DISABLED", `${method} ${url}`);
    }
  });

  test("Journey writes are still PUBLISHING_DISABLED", async () => {
    const response = await new Client(server.base).json("POST", "/api/journey", {});
    assert.equal(response.status, 503);
    assert.equal(response.body.code, "PUBLISHING_DISABLED");
  });

  test("pages degrade gracefully and public reads still work", async () => {
    const c = new Client(server.base);
    for (const page of ["/login", "/register"]) {
      const response = await c.req("GET", page);
      assert.equal(response.status, 200);
      assert.match(await response.text(), /Accounts are not available yet/);
    }
    assert.equal((await c.req("GET", "/dashboard")).status, 307);
    assert.equal((await c.req("GET", "/profile/alex-morgan")).status, 200);
    assert.equal((await c.req("GET", "/profile/nobody")).status, 404);
  });
});
