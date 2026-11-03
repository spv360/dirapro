import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PUBLISHING_DISABLED_CODE,
  accountWritesDisabled,
  publishingDisabled,
  publishingDisabledResponse,
} from "../app/lib/publishing.ts";

test("publishing is disabled on Vercel", () => {
  assert.equal(publishingDisabled({ VERCEL: "1" }), true);
  assert.equal(publishingDisabled({ VERCEL: "1", DIRA_OWNER_PASSCODE: "configured-passcode" }), true);
});

test("publishing can be disabled explicitly", () => {
  assert.equal(publishingDisabled({ DIRA_PUBLISHING_DISABLED: "true" }), true);
});

test("local development keeps publishing enabled", () => {
  assert.equal(publishingDisabled({}), false);
  assert.equal(publishingDisabled({ DIRA_PUBLISHING_DISABLED: "false" }), false);
});

test("disabled response is a 503 with PUBLISHING_DISABLED", async () => {
  const response = publishingDisabledResponse();
  assert.equal(response.status, 503);
  const body = (await response.json()) as { code: string; error: string };
  assert.equal(body.code, PUBLISHING_DISABLED_CODE);
  assert.ok(body.error.length > 20);
});

const supabase = {
  DIRA_BACKEND: "supabase",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
};

test("account writes: local development stays enabled", () => {
  assert.equal(accountWritesDisabled({}), false);
  assert.equal(accountWritesDisabled({ DIRA_PUBLISHING_DISABLED: "true" }), true);
});

test("account writes: Preview with Supabase is enabled, Journey/media stay blocked", () => {
  const env = { VERCEL: "1", VERCEL_ENV: "preview", ...supabase };
  assert.equal(accountWritesDisabled(env), false);
  assert.equal(publishingDisabled(env), true);
});

test("account writes: Preview fails closed without valid Supabase setup", () => {
  assert.equal(accountWritesDisabled({ VERCEL: "1", VERCEL_ENV: "preview" }), true);
  assert.equal(accountWritesDisabled({ VERCEL: "1", VERCEL_ENV: "preview", DIRA_BACKEND: "local" }), true);
  assert.equal(accountWritesDisabled({ VERCEL: "1", VERCEL_ENV: "preview", DIRA_BACKEND: "supabase" }), true);
  assert.equal(
    accountWritesDisabled({ VERCEL: "1", VERCEL_ENV: "preview", DIRA_BACKEND: "supabase", NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co" }),
    true,
  );
  assert.equal(accountWritesDisabled({ VERCEL: "1", ...supabase }), true);
});

test("account writes: Production and unknown Vercel environments stay disabled", () => {
  assert.equal(accountWritesDisabled({ VERCEL: "1", VERCEL_ENV: "production", ...supabase }), true);
  assert.equal(accountWritesDisabled({ VERCEL: "1", VERCEL_ENV: "development", ...supabase }), true);
  assert.equal(publishingDisabled({ VERCEL: "1", VERCEL_ENV: "production", ...supabase }), true);
});

test("explicit disablement overrides Preview", () => {
  assert.equal(accountWritesDisabled({ VERCEL: "1", VERCEL_ENV: "preview", DIRA_PUBLISHING_DISABLED: "true", ...supabase }), true);
});

test("account writes: Preview requires a strictly valid Supabase URL and key", () => {
  const base = { VERCEL: "1", VERCEL_ENV: "preview", DIRA_BACKEND: "supabase", NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon" };
  const url = (u: string) => ({ ...base, NEXT_PUBLIC_SUPABASE_URL: u });
  assert.equal(accountWritesDisabled(url("https://example.supabase.co")), false);
  for (const bad of [
    "http://example.supabase.co",
    "not a url",
    "example.supabase.co",
    "https://user:pass@example.supabase.co",
    "https://user@example.supabase.co",
    "ftp://example.supabase.co",
    "https://",
    "",
  ]) {
    assert.equal(accountWritesDisabled(url(bad)), true, bad);
  }
  const good = { ...base, NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co" };
  assert.equal(accountWritesDisabled({ ...good, NEXT_PUBLIC_SUPABASE_ANON_KEY: "  " }), true);
  assert.equal(accountWritesDisabled({ ...good, NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined }), true);
  assert.equal(
    accountWritesDisabled({ ...good, NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x" }),
    false,
  );
  assert.equal(accountWritesDisabled({ ...good, VERCEL_ENV: "Preview" }), true);
  assert.equal(accountWritesDisabled({ ...good, DIRA_BACKEND: "Supabase" }), true);
});
