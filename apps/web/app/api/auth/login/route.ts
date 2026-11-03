import { cookies } from "next/headers";
import { auth } from "../../../lib/platform";
import { ACCOUNT_COOKIE, accountCookieOptions, authorizeApi } from "../../../lib/platform/session";

export async function POST(request: Request) {
  const gate = await authorizeApi(request, { requireSession: false });
  if (gate instanceof Response) return gate;

  const body = (await request.json().catch(() => null)) as { identifier?: unknown; password?: unknown } | null;
  const identifier = typeof body?.identifier === "string" ? body.identifier.trim().slice(0, 254) : "";
  const password = typeof body?.password === "string" ? body.password.slice(0, 128) : "";
  if (!identifier || !password) {
    return Response.json({ error: "Enter your email or username and password." }, { status: 422 });
  }

  const result = await auth.login(identifier, password);
  if (!result.ok) {
    const status =
      result.code === "RATE_LIMITED" ? 429 :
      result.code === "EMAIL_REQUIRED" ? 422 :
      result.code === "EMAIL_NOT_VERIFIED" ? 403 : 401;
    return Response.json(
      { code: result.code, error: result.message },
      { status, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  if (result.value.token) {
    (await cookies()).set(ACCOUNT_COOKIE, result.value.token, accountCookieOptions());
  }
  return Response.json(
    { user: result.value.user },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
