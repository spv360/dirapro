import { validateJourneyInput } from "../../../data/journey";
import { deleteItem, updateItem } from "../../../lib/journey-store";
import { guardOwner, ownedProfileId } from "../../../lib/owner-auth";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const denied = await guardOwner(request);
  if (denied) return denied;

  const { id } = await params;
  const result = validateJourneyInput(await request.json().catch(() => null));
  if (!result.ok) return Response.json({ errors: result.errors }, { status: 422 });

  try {
    const item = await updateItem(id, ownedProfileId, result.value);
    if (!item) return Response.json({ error: "Update not found." }, { status: 404 });
    return Response.json({ item });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 409 });
  }
}

export async function DELETE(request: Request, { params }: Context) {
  const denied = await guardOwner(request);
  if (denied) return denied;

  const { id } = await params;
  if (!(await deleteItem(id, ownedProfileId))) {
    return Response.json({ error: "Update not found." }, { status: 404 });
  }
  return Response.json({ ok: true });
}
