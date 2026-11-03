import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createSupabaseAuthService } from "../app/lib/platform/supabase/auth.ts";
import type { SupabaseServerClient } from "../app/lib/platform/supabase/server.ts";

type AuthResponse = {
  data: Record<string, unknown>;
  error: { code?: string; message: string; name?: string; status?: number } | null;
};

class FakeSupabaseAuth {
  usernameAvailable = true;
  signupResponse: AuthResponse = {
    data: {
      user: { id: "supabase-user-id", email: "doctor@example.com", identities: [{ id: "identity-1" }] },
      session: null,
    },
    error: null,
  };
  loginResponse: AuthResponse = {
    data: {
      user: { id: "supabase-user-id", email: "doctor@example.com" },
      session: { access_token: "must-not-be-returned" },
    },
    error: null,
  };
  userResponse: AuthResponse = {
    data: { user: { id: "supabase-user-id", email: "doctor@example.com" } },
    error: null,
  };
  signupInput: Record<string, unknown> | null = null;
  signOutScope: string | null = null;

  readonly auth = {
    signUp: async (input: Record<string, unknown>) => {
      this.signupInput = input;
      return this.signupResponse;
    },
    signInWithPassword: async () => this.loginResponse,
    getUser: async () => this.userResponse,
    signOut: async (input: { scope: string }) => {
      this.signOutScope = input.scope;
      return { error: null };
    },
  };

  readonly rpc = async (name: string) => {
    assert.equal(name, "is_username_available");
    return { data: this.usernameAvailable, error: null };
  };
}

function service(fake: FakeSupabaseAuth) {
  return createSupabaseAuthService(async () => fake as unknown as Pick<SupabaseServerClient, "auth" | "rpc">);
}

const registration = {
  fullName: "Dr Test User",
  email: "doctor@example.com",
  username: "test-doctor",
  password: "secure-password-1",
};

describe("Supabase authentication", () => {
  test("registration sends profile metadata and returns verification-required status without exposing tokens", async () => {
    const fake = new FakeSupabaseAuth();
    const result = await service(fake).register(registration, { emailRedirectTo: "https://dira.example/auth/confirm" });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.value.user.id, "supabase-user-id");
    assert.equal(result.value.emailVerificationRequired, true);
    assert.equal(result.value.token, undefined);
    assert.deepEqual(fake.signupInput, {
      email: registration.email,
      password: registration.password,
      options: {
        data: { full_name: registration.fullName, username: registration.username },
        emailRedirectTo: "https://dira.example/auth/confirm",
      },
    });
  });

  test("registration handles duplicate email and username", async () => {
    const duplicateEmail = new FakeSupabaseAuth();
    duplicateEmail.signupResponse = {
      data: { user: { id: "existing", email: registration.email, identities: [] }, session: null },
      error: null,
    };
    const emailResult = await service(duplicateEmail).register(registration);
    assert.equal(emailResult.ok, false);
    if (!emailResult.ok) assert.equal(emailResult.code, "EMAIL_TAKEN");

    const duplicateUsername = new FakeSupabaseAuth();
    duplicateUsername.usernameAvailable = false;
    const usernameResult = await service(duplicateUsername).register(registration);
    assert.equal(usernameResult.ok, false);
    if (!usernameResult.ok) assert.equal(usernameResult.code, "USERNAME_TAKEN");
    assert.equal(duplicateUsername.signupInput, null);
  });

  test("login only accepts email and maps invalid credentials and unverified email safely", async () => {
    const fake = new FakeSupabaseAuth();
    const auth = service(fake);

    const username = await auth.login("test-doctor", "secure-password-1");
    assert.equal(username.ok, false);
    if (!username.ok) assert.equal(username.code, "EMAIL_REQUIRED");

    fake.loginResponse = {
      data: { user: null },
      error: { code: "invalid_credentials", message: "Auth rejected." },
    };
    const invalid = await auth.login(registration.email, "wrong-password");
    assert.equal(invalid.ok, false);
    if (!invalid.ok) assert.equal(invalid.message, "Incorrect email or password.");

    fake.loginResponse = {
      data: { user: null },
      error: { code: "email_not_confirmed", message: "Not verified." },
    };
    const unverified = await auth.login(registration.email, registration.password);
    assert.equal(unverified.ok, false);
    if (!unverified.ok) assert.equal(unverified.code, "EMAIL_NOT_VERIFIED");
  });

  test("login uses Supabase Auth session, user validation and session-scoped logout", async () => {
    const fake = new FakeSupabaseAuth();
    const auth = service(fake);

    const loggedIn = await auth.login("DOCTOR@example.com", registration.password);
    assert.equal(loggedIn.ok, true);
    if (loggedIn.ok) {
      assert.equal(loggedIn.value.user.email, "doctor@example.com");
      assert.equal(loggedIn.value.token, undefined);
    }

    const user = await auth.userForToken();
    assert.equal(user?.id, "supabase-user-id");
    await auth.logout();
    assert.equal(fake.signOutScope, "local");
  });

  test("username availability uses the restricted database function", async () => {
    const fake = new FakeSupabaseAuth();
    fake.usernameAvailable = false;
    assert.equal(await service(fake).usernameAvailable("already-used"), false);
  });
});
