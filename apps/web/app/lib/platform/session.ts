import { cookies } from "next/headers";
import { publishingDisabled } from "../publishing";
import { auth, profiles } from "./index";
import type { ProfileAggregate, PublicUser } from "./types";

export const ACCOUNT_COOKIE = "dira_session";
export const ACCOUNTS_DISABLED_CODE = "ACCOUNTS_DISABLED";
export const ACCOUNTS_DISABLED_MESSAGE =
  "Accounts are not available yet. Dira is preparing production storage, so registration and sign-in are temporarily disabled.";

export const accountsDisabled = () => publishingDisabled();

export function accountsDisabledResponse(): Response {
  return Response.json({ code: ACCOUNTS_DISABLED_CODE, error: ACCOUNTS_DISABLED_MESSAGE }, { status: 503 });
}

export function accountCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Number(process.env.DIRA_SESSION_TTL_SECONDS) || 7 * 24 * 3600,
  };
}

export async function currentUser(): Promise<PublicUser | null> {
  if (accountsDisabled()) return null;
  const token = (await cookies()).get(ACCOUNT_COOKIE)?.value;
  return token ? auth.userForToken(token) : null;
}

export async function currentProfile(): Promise<{ user: PublicUser; aggregate: ProfileAggregate } | null> {
  const user = await currentUser();
  if (!user) return null;
  const aggregate = await profiles.getByOwner(user.id);
  return aggregate ? { user, aggregate } : null;
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * Guard for account API routes. Order: Vercel disablement (503) → same-origin on
 * mutations (403) → session (401). Returns a Response when rejected.
 */
export async function authorizeApi(
  request: Request,
  options: { requireSession: boolean } = { requireSession: true },
): Promise<Response | { user: PublicUser | null }> {
  const mutating = !["GET", "HEAD"].includes(request.method);
  if (accountsDisabled() && (mutating || options.requireSession)) return accountsDisabledResponse();
  if (mutating && !sameOrigin(request)) {
    return Response.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }
  const user = await currentUser();
  if (options.requireSession && !user) {
    return Response.json({ error: "Sign in to continue." }, { status: 401 });
  }
  return { user };
}
