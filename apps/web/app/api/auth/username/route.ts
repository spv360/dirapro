import { auth } from "../../../lib/platform";
import { accountsDisabledResponse, accountsDisabled } from "../../../lib/platform/session";
import { validateUsername } from "../../../lib/platform/validation";

export async function GET(request: Request) {
  if (accountsDisabled()) return accountsDisabledResponse();
  const username = (new URL(request.url).searchParams.get("u") ?? "").toLowerCase();
  const problem = validateUsername(username);
  if (problem) return Response.json({ available: false, reason: problem });
  const available = await auth.usernameAvailable(username);
  return Response.json({ available, reason: available ? null : "This username is already taken." });
}
