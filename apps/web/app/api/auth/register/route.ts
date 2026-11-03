import { cookies } from "next/headers";
import { auth } from "../../../lib/platform";
import { ACCOUNT_COOKIE, accountCookieOptions, authorizeApi } from "../../../lib/platform/session";
import { validateRegistration } from "../../../lib/platform/validation";

export async function POST(request: Request) {
  const gate = await authorizeApi(request, { requireSession: false });
  if (gate instanceof Response) return gate;

  const parsed = validateRegistration(await request.json().catch(() => null));
  if (!parsed.ok) return Response.json({ errors: parsed.errors }, { status: 422 });

  const emailRedirectTo = new URL("/auth/confirm", request.url).toString();
  const result = await auth.register(parsed.value, { emailRedirectTo });
  if (!result.ok) {
    const field =
      result.code === "EMAIL_TAKEN" ? "email" :
      result.code === "USERNAME_TAKEN" ? "username" : undefined;
    const status =
      result.code === "EMAIL_TAKEN" || result.code === "USERNAME_TAKEN" ? 409 :
      result.code === "RATE_LIMITED" ? 429 :
      result.code === "SIGNUP_DISABLED" ? 503 : 422;
    return Response.json(
      { code: result.code, error: result.message, ...(field ? { errors: { [field]: result.message } } : {}) },
      { status, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  if (result.value.token) {
    (await cookies()).set(ACCOUNT_COOKIE, result.value.token, accountCookieOptions());
  }
  const verificationRequired = result.value.emailVerificationRequired === true;
  return Response.json(
    {
      user: result.value.user,
      emailVerificationRequired: verificationRequired,
      ...(result.value.message ? { message: result.value.message } : {}),
    },
    {
      status: verificationRequired ? 202 : 201,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
