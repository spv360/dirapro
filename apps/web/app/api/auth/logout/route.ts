import { cookies } from "next/headers";
import { auth } from "../../../lib/platform";
import { ACCOUNT_COOKIE, authorizeApi } from "../../../lib/platform/session";

export async function POST(request: Request) {
  const gate = await authorizeApi(request, { requireSession: false });
  if (gate instanceof Response) return gate;

  const store = await cookies();
  await auth.logout(store.get(ACCOUNT_COOKIE)?.value ?? "");
  store.delete(ACCOUNT_COOKIE);
  return Response.json({ ok: true });
}
