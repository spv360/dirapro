import { cookies } from "next/headers";
import { auth } from "../../../lib/platform";
import { ACCOUNT_COOKIE, accountCookieOptions, authorizeApi } from "../../../lib/platform/session";
import { validateRegistration } from "../../../lib/platform/validation";

export async function POST(request: Request) {
  const gate = await authorizeApi(request, { requireSession: false });
  if (gate instanceof Response) return gate;

  const parsed = validateRegistration(await request.json().catch(() => null));
  if (!parsed.ok) return Response.json({ errors: parsed.errors }, { status: 422 });

  const result = await auth.register(parsed.value);
  if (!result.ok) {
    const field = result.code === "EMAIL_TAKEN" ? "email" : "username";
    return Response.json({ code: result.code, error: result.message, errors: { [field]: result.message } }, { status: 409 });
  }

  (await cookies()).set(ACCOUNT_COOKIE, result.value.token, accountCookieOptions());
  return Response.json({ user: result.value.user }, { status: 201 });
}
