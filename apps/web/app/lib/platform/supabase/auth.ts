import type { AuthResult, AuthService } from "../ports.ts";
import type { PublicUser } from "../types.ts";
import type { SupabaseServerClient } from "./server.ts";

type AuthError = { code?: string; message: string; name?: string; status?: number };
type AuthClient = Pick<SupabaseServerClient, "auth" | "rpc">;

const bad = (code: string, message: string): AuthResult<never> => ({ ok: false, code, message });
const DUPLICATE_EMAIL = "An account with this email already exists.";
const INVALID_CREDENTIALS = "Incorrect email or password.";

function isNoSession(error: AuthError): boolean {
  return (
    error.name === "AuthSessionMissingError" ||
    ["session_not_found", "refresh_token_not_found", "bad_jwt", "jwt_expired"].includes(error.code ?? "")
  );
}

function isRateLimited(error: AuthError): boolean {
  return ["over_request_rate_limit", "too_many_requests"].includes(error.code ?? "");
}

function publicUser(user: { id: string; email?: string }): PublicUser {
  if (!user.email) throw new Error("Supabase Auth returned a user without an email address.");
  return { id: user.id, email: user.email };
}

async function usernameIsAvailable(client: AuthClient, username: string): Promise<boolean> {
  const { data, error } = await client.rpc("is_username_available", { p_username: username });
  if (error) throw new Error(`Supabase username availability check failed: ${error.message}`);
  if (typeof data !== "boolean") throw new Error("Supabase returned an invalid username availability result.");
  return data;
}

function registrationError(error: AuthError): AuthResult<never> {
  if (["email_exists", "user_already_exists"].includes(error.code ?? "")) {
    return bad("EMAIL_TAKEN", DUPLICATE_EMAIL);
  }
  if (isRateLimited(error)) return bad("RATE_LIMITED", "Too many attempts. Try again shortly.");
  if (error.code === "weak_password") return bad("WEAK_PASSWORD", "Choose a stronger password.");
  if (error.code === "signup_disabled") return bad("SIGNUP_DISABLED", "Registration is temporarily unavailable.");
  return bad("REGISTRATION_FAILED", "We could not create your account. Please try again.");
}

export function createSupabaseAuthService(
  getClient: (requireWritableCookies?: boolean) => Promise<AuthClient> = async (requireWritableCookies = false) => {
    const { createSupabaseServerClient } = await import("./server.ts");
    return createSupabaseServerClient({ requireWritableCookies });
  },
): AuthService {
  return {
    async register(input, options) {
      const client = await getClient(true);
      if (!(await usernameIsAvailable(client, input.username))) {
        return bad("USERNAME_TAKEN", "This username is already taken.");
      }

      const { data, error } = await client.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: { full_name: input.fullName, username: input.username },
          ...(options?.emailRedirectTo ? { emailRedirectTo: options.emailRedirectTo } : {}),
        },
      });

      if (error) {
        if (isRateLimited(error)) return registrationError(error);
        if (await usernameIsAvailable(client, input.username) === false) {
          return bad("USERNAME_TAKEN", "This username is already taken.");
        }
        return registrationError(error);
      }
      if (!data.user) throw new Error("Supabase Auth did not return a user after registration.");
      if (data.user.identities?.length === 0) return bad("EMAIL_TAKEN", DUPLICATE_EMAIL);

      const emailVerificationRequired = !data.session;
      return {
        ok: true,
        value: {
          user: publicUser(data.user),
          emailVerificationRequired,
          ...(emailVerificationRequired
            ? { message: "Check your email for a verification link before signing in." }
            : {}),
        },
      };
    },

    async login(identifier, password) {
      const email = identifier.trim().toLowerCase();
      if (!email.includes("@")) {
        return bad("EMAIL_REQUIRED", "Sign in with the email address used to create your account.");
      }

      const client = await getClient(true);
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.code === "email_not_confirmed") {
          return bad("EMAIL_NOT_VERIFIED", "Verify your email using the link we sent before signing in.");
        }
        if (isRateLimited(error)) return bad("RATE_LIMITED", "Too many attempts. Try again shortly.");
        if (error.code === "invalid_credentials" || error.status === 400 || error.status === 401) {
          return bad("INVALID_CREDENTIALS", INVALID_CREDENTIALS);
        }
        throw new Error(`Supabase sign-in failed: ${error.message}`);
      }
      if (!data.user) throw new Error("Supabase Auth did not return a user after sign-in.");
      return { ok: true, value: { user: publicUser(data.user) } };
    },

    async userForToken() {
      const client = await getClient();
      const { data, error } = await client.auth.getUser();
      if (error) {
        if (isNoSession(error) || error.status === 401) return null;
        throw new Error(`Supabase session validation failed: ${error.message}`);
      }
      return data.user ? publicUser(data.user) : null;
    },

    async logout() {
      const client = await getClient(true);
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error && !isNoSession(error)) throw new Error(`Supabase sign-out failed: ${error.message}`);
    },

    async usernameAvailable(username) {
      return usernameIsAvailable(await getClient(), username);
    },
  };
}

export const supabaseAuth = createSupabaseAuthService();
