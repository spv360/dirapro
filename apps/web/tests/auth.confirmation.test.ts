import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  createConfirmationHandlers,
  safeConfirmationDestination,
  type ConfirmationClient,
} from "../app/lib/platform/supabase/confirmation.ts";

class FakeConfirmationClient implements ConfirmationClient {
  verified: { token_hash: string; type: "signup" } | null = null;
  exchangedCode: string | null = null;
  session: { access_token: string; refresh_token: string } | null = null;

  readonly auth = {
    verifyOtp: async (input: { token_hash: string; type: "signup" }) => {
      this.verified = input;
      return { error: null };
    },
    exchangeCodeForSession: async (code: string) => {
      this.exchangedCode = code;
      return { error: null };
    },
    setSession: async (input: { access_token: string; refresh_token: string }) => {
      this.session = input;
      return { error: null };
    },
  };
}

function handlers(client: FakeConfirmationClient, disabled = false) {
  return createConfirmationHandlers({
    accountsDisabled: () => disabled,
    createClient: async () => client,
  });
}

function request(path: string, method = "GET", body?: unknown) {
  return new Request(`https://dira.example${path}`, {
    method,
    headers: {
      ...(method === "POST" ? { Origin: "https://dira.example", Host: "dira.example", "Content-Type": "application/json" } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe("Supabase email confirmation callback", () => {
  test("preserves token_hash/type=signup verification", async () => {
    const client = new FakeConfirmationClient();
    const response = await handlers(client).GET(request("/auth/confirm?token_hash=otp-token&type=signup&next=%2Fdashboard"));

    assert.equal(response.status, 303);
    assert.equal(response.headers.get("location"), "https://dira.example/dashboard");
    assert.deepEqual(client.verified, { token_hash: "otp-token", type: "signup" });
  });

  test("accepts Supabase's ConfirmationURL redirect and establishes its fragment session", async () => {
    const client = new FakeConfirmationClient();
    const callback = handlers(client);
    const page = await callback.GET(request("/auth/confirm?next=%2Fonboarding"));
    const html = await page.text();

    assert.equal(page.status, 200);
    assert.match(html, /location\.hash/);
    assert.match(html, /access_token/);
    assert.match(html, /refresh_token/);

    const response = await callback.POST(request("/auth/confirm", "POST", {
      access_token: "confirmation-access-token",
      refresh_token: "confirmation-refresh-token",
      next: "/onboarding",
    }));
    assert.equal(response.status, 200);
    assert.deepEqual(client.session, {
      access_token: "confirmation-access-token",
      refresh_token: "confirmation-refresh-token",
    });
    assert.deepEqual(await response.json(), { redirectTo: "/onboarding" });
  });

  test("supports a Supabase PKCE code callback", async () => {
    const client = new FakeConfirmationClient();
    const response = await handlers(client).GET(request("/auth/confirm?code=auth-code"));

    assert.equal(response.status, 303);
    assert.equal(response.headers.get("location"), "https://dira.example/onboarding");
    assert.equal(client.exchangedCode, "auth-code");
  });

  test("rejects open redirects and cross-origin session establishment", async () => {
    const callback = handlers(new FakeConfirmationClient());
    const destinationRequest = request("/auth/confirm");
    assert.equal(safeConfirmationDestination(destinationRequest, "https://attacker.example"), "/onboarding");
    assert.equal(safeConfirmationDestination(destinationRequest, "//attacker.example"), "/onboarding");

    for (const origin of ["https://attacker.example", "http://dira.example", "not a URL"]) {
      const response = await callback.POST(new Request("https://dira.example/auth/confirm", {
        method: "POST",
        headers: { Origin: origin, Host: "dira.example", "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: "a", refresh_token: "r" }),
      }));
      assert.equal(response.status, 403);
    }
  });

  test("confirmation respects production account disablement", async () => {
    const client = new FakeConfirmationClient();
    const callback = handlers(client, true);
    const get = await callback.GET(request("/auth/confirm?token_hash=otp-token&type=signup"));
    const post = await callback.POST(request("/auth/confirm", "POST", {
      access_token: "access",
      refresh_token: "refresh",
    }));

    assert.equal(get.headers.get("location"), "https://dira.example/login?verification=unavailable");
    assert.equal(post.status, 503);
    assert.equal(client.verified, null);
    assert.equal(client.session, null);
  });
});
