import { cookies } from "next/headers";
import { publishingDisabled, publishingDisabledResponse } from "../../../lib/publishing";
import {
  SESSION_COOKIE,
  createSessionToken,
  ownedProfileId,
  ownerAuthConfigured,
  sessionCookieOptions,
  verifyPasscode,
} from "../../../lib/owner-auth";

let failures = 0;
let lockedUntil = 0;

export async function POST(request: Request) {
  if (publishingDisabled()) return publishingDisabledResponse();

  if (!ownerAuthConfigured()) {
    return Response.json({ error: "Owner publishing is not configured on this server." }, { status: 503 });
  }

  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).host !== request.headers.get("host")) {
    return Response.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  if (Date.now() < lockedUntil) {
    return Response.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { passcode?: unknown } | null;
  const candidate = typeof body?.passcode === "string" ? body.passcode : "";

  if (!verifyPasscode(candidate)) {
    failures += 1;
    if (failures >= 5) {
      failures = 0;
      lockedUntil = Date.now() + 60_000;
    }
    return Response.json({ error: "Incorrect passcode." }, { status: 401 });
  }

  failures = 0;
  (await cookies()).set(SESSION_COOKIE, createSessionToken(ownedProfileId), sessionCookieOptions);
  return Response.json({ ok: true });
}

export async function DELETE() {
  (await cookies()).delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
