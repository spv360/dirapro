import { profiles } from "../../lib/platform";
import { authorizeApi } from "../../lib/platform/session";
import { profileCompletion, validateAbout, validateIdentity, validateList } from "../../lib/platform/validation";
import type { ListSection, ProfileAggregate } from "../../lib/platform/types";

const LIST_SECTIONS: ListSection[] = ["expertise", "experience", "education", "recognition", "contributions", "presence"];

const view = (agg: ProfileAggregate) => ({ ...agg, completion: profileCompletion(agg) });

export async function GET(request: Request) {
  const gate = await authorizeApi(request);
  if (gate instanceof Response) return gate;
  const agg = await profiles.getByOwner(gate.user!.id);
  return agg ? Response.json({ profile: view(agg) }) : Response.json({ error: "Profile not found." }, { status: 404 });
}

export async function PATCH(request: Request) {
  const gate = await authorizeApi(request);
  if (gate instanceof Response) return gate;
  const ownerId = gate.user!.id;

  const body = (await request.json().catch(() => null)) as { section?: unknown; data?: unknown; step?: unknown } | null;
  const section = typeof body?.section === "string" ? body.section : "";

  if (typeof body?.step === "number") await profiles.setOnboardingStep(ownerId, body.step);

  if (section === "progress") {
    const agg = await profiles.getByOwner(ownerId);
    return agg ? Response.json({ profile: view(agg) }) : Response.json({ error: "Profile not found." }, { status: 404 });
  }

  let result;
  if (section === "identity") {
    const parsed = validateIdentity(body?.data);
    if (!parsed.ok) return Response.json({ errors: parsed.errors }, { status: 422 });
    result = await profiles.updateIdentity(ownerId, parsed.value);
  } else if (section === "about") {
    const parsed = validateAbout(body?.data);
    if (!parsed.ok) return Response.json({ errors: parsed.errors }, { status: 422 });
    result = await profiles.updateAbout(ownerId, parsed.value);
  } else if ((LIST_SECTIONS as string[]).includes(section)) {
    const parsed = validateList(section as ListSection, body?.data);
    if (!parsed.ok) return Response.json({ errors: parsed.errors }, { status: 422 });
    result = await profiles.replaceSection(ownerId, section as ListSection, parsed.value as never);
  } else {
    return Response.json({ error: "Unknown section." }, { status: 400 });
  }

  if (!result.ok) {
    const status = result.code === "USERNAME_TAKEN" ? 409 : result.code === "NOT_FOUND" ? 404 : 422;
    const errors = result.code === "USERNAME_TAKEN" || result.code === "INVALID_USERNAME" ? { username: result.message } : undefined;
    return Response.json({ code: result.code, error: result.message, errors }, { status });
  }
  return Response.json({ profile: view(result.value) });
}
