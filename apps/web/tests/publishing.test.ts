import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PUBLISHING_DISABLED_CODE,
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
