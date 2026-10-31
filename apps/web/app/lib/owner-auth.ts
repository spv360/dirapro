import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { demoProfile } from "../data/profile";
import { currentProfile, sameOrigin } from "./platform/session";
import { publishingDisabled, publishingDisabledResponse } from "./publishing";

/**
 * Minimal owner authentication: a single owner passcode (env) exchanged for an
 * HMAC-signed, HttpOnly session cookie. It protects the one demo profile and is
 * the smallest real gate until a user/identity system exists.
 */
export const SESSION_COOKIE = "dira_owner";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

const passcode = () => process.env.DIRA_OWNER_PASSCODE ?? "";
const secret = () => process.env.DIRA_SESSION_SECRET ?? "";

export function ownerAuthConfigured(): boolean {
  return passcode().length >= 8 && secret().length >= 16;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyPasscode(candidate: string): boolean {
  if (!ownerAuthConfigured()) return false;
  // Compare digests so length differences do not leak.
  return safeEqual(sign(`pass:${candidate}`), sign(`pass:${passcode()}`));
}

export function createSessionToken(profileId: string): string {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `${profileId}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_SECONDS,
};

/** Returns the profile id the token owns, or null when invalid/expired. */
export function readSessionToken(token: string | undefined): string | null {
  if (!token || !ownerAuthConfigured()) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [profileId, expires, signature] = parts;
  if (!safeEqual(sign(`${profileId}.${expires}`), signature)) return null;
  if (Number(expires) < Date.now() / 1000) return null;
  return profileId;
}

/** True when the current request carries a valid owner session for this profile. */
export async function isProfileOwner(profileId: string): Promise<boolean> {
  const store = await cookies();
  return readSessionToken(store.get(SESSION_COOKIE)?.value) === profileId;
}

export const ownedProfileId = demoProfile.username;

/**
 * Profile id the current request may manage: the signed-in account's profile, or
 * the demo profile for a valid owner-passcode session. Null when neither.
 */
export async function resolveOwnerProfileId(): Promise<string | null> {
  const account = await currentProfile();
  if (account) return account.aggregate.profile.id;
  return (await isProfileOwner(ownedProfileId)) ? ownedProfileId : null;
}

/**
 * Guard for owner-only route handlers. Returns a Response when the request is
 * rejected, or the profile id the caller owns. Mutations must be same-origin.
 */
export async function authorizeOwner(request: Request): Promise<Response | { profileId: string }> {
  const mutating = !["GET", "HEAD"].includes(request.method);
  if (mutating && publishingDisabled()) return publishingDisabledResponse();

  if (mutating && !sameOrigin(request)) {
    return Response.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const profileId = await resolveOwnerProfileId();
  if (profileId) return { profileId };
  return Response.json({ error: "Sign in as the profile owner to continue." }, { status: 401 });
}
