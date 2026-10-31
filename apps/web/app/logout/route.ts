import { cookies } from "next/headers";
import { auth } from "../lib/platform";
import { ACCOUNT_COOKIE, accountsDisabled, sameOrigin } from "../lib/platform/session";

// Browser form target for the dashboard's sign-out button.
export async function POST(request: Request) {
  const url = new URL("/login", request.url);
  if (accountsDisabled() || !sameOrigin(request)) return Response.redirect(url, 303);
  const store = await cookies();
  await auth.logout(store.get(ACCOUNT_COOKIE)?.value ?? "");
  store.delete(ACCOUNT_COOKIE);
  return Response.redirect(url, 303);
}

export function GET(request: Request) {
  return Response.redirect(new URL("/login", request.url), 303);
}
