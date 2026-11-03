import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, test } from "node:test";
import { createSupabaseProfileRepository } from "../app/lib/platform/supabase/profiles.ts";
import type { SupabaseServerClient } from "../app/lib/platform/supabase/server.ts";

type Row = Record<string, unknown>;
type Result = { data: unknown; error: { code?: string; message: string } | null };
type Filter = { field: string; value: unknown; operator: "eq" | "in" };

class FakeQuery implements PromiseLike<Result> {
  private readonly client: FakeClient;
  private readonly table: string;
  private action: "select" | "insert" | "update" | "delete" = "select";
  private payload: Row | Row[] = {};
  private filters: Filter[] = [];
  private sortedBy: string | null = null;
  private returning = false;
  private selection = "";

  constructor(client: FakeClient, table: string) {
    this.client = client;
    this.table = table;
  }

  select(columns = "*") {
    this.returning = true;
    this.selection = columns;
    return this;
  }

  eq(field: string, value: unknown) {
    this.filters.push({ field, value, operator: "eq" });
    return this;
  }

  in(field: string, value: unknown[]) {
    this.filters.push({ field, value, operator: "in" });
    return this;
  }

  order(field: string) {
    this.sortedBy = field;
    return this;
  }

  update(value: Row) {
    this.action = "update";
    this.payload = value;
    return this;
  }

  insert(value: Row | Row[]) {
    this.action = "insert";
    this.payload = value;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  maybeSingle() {
    return this.execute().then(({ data, error }) => ({
      data: Array.isArray(data) ? data[0] ?? null : data,
      error,
    }));
  }

  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled ?? undefined, onrejected ?? undefined);
  }

  private matches(value: Row): boolean {
    return this.filters.every((filter) => {
      const actual = value[filter.field];
      return filter.operator === "eq"
        ? actual === filter.value
        : Array.isArray(filter.value) && filter.value.includes(actual);
    });
  }

  private async execute(): Promise<Result> {
    const tableRows = this.client.tables[this.table] ?? (this.client.tables[this.table] = []);
    if (
      this.client.denyOwnerColumnRead &&
      this.table === "profiles" &&
      this.action === "select" &&
      (this.selection.includes("owner_id") || this.selection === "*")
    ) {
      return { data: null, error: { code: "42501", message: "permission denied for column owner_id" } };
    }
    if (this.action === "insert") {
      const inserts = Array.isArray(this.payload) ? this.payload : [this.payload];
      const inserted: Row[] = inserts.map((value): Row => ({
        id: randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...value,
      }));
      if (inserted.some((value) => !this.client.ownsProfile(String(value.profile_id ?? "")))) {
        return { data: null, error: { code: "42501", message: "row-level security violation" } };
      }
      tableRows.push(...inserted);
      return { data: this.returning ? inserted : null, error: null };
    }

    const matches = tableRows.filter((item) => this.matches(item));
    if (this.action === "select") {
      const visible = matches.filter((item) => this.client.canRead(this.table, item));
      if (this.sortedBy) visible.sort((a, b) => Number(a[this.sortedBy!] ?? 0) - Number(b[this.sortedBy!] ?? 0));
      const projected = visible.map((item) => {
        if (this.table !== "profiles") return item;
        const publicColumns = { ...item };
        delete publicColumns.owner_id;
        return publicColumns;
      });
      return { data: projected, error: null };
    }
    if (this.action === "update") {
      const updated = matches.filter((item) => this.client.canWrite(this.table, item));
      updated.forEach((item) => Object.assign(item, this.payload));
      return { data: this.returning ? updated : null, error: null };
    }
    const removed = matches.filter((item) => this.client.canWrite(this.table, item));
    this.client.tables[this.table] = tableRows.filter((item) => !removed.includes(item));
    return { data: this.returning ? removed : null, error: null };
  }
}

class FakeClient {
  readonly tables: Record<string, Row[]> = {};
  denyOwnerColumnRead = false;
  readonly rpcCalls: { name: string; args: Record<string, unknown> }[] = [];
  currentUserId: string | null;
  private readonly profileOnEnsure?: Row;
  readonly auth = {
    getUser: async () => ({
      data: { user: this.currentUserId ? { id: this.currentUserId } : null },
      error: null,
    }),
  };
  readonly storage = {
    from: () => ({ list: async () => ({ data: [], error: null }) }),
  };

  constructor(userId: string | null, profiles: Row[], profileOnEnsure?: Row) {
    this.currentUserId = userId;
    this.tables.profiles = profiles;
    this.profileOnEnsure = profileOnEnsure;
  }

  from(table: string) {
    return new FakeQuery(this, table);
  }

  ownsProfile(profileId: string) {
    return this.tables.profiles?.some((profile) => profile.id === profileId && profile.owner_id === this.currentUserId) ?? false;
  }

  canRead(table: string, value: Row) {
    if (table === "profiles") return value.status === "published" || value.owner_id === this.currentUserId;
    const profile = this.tables.profiles?.find((item) => item.id === value.profile_id);
    return Boolean(profile && (profile.status === "published" || profile.owner_id === this.currentUserId));
  }

  canWrite(table: string, value: Row) {
    if (table === "profiles") return value.owner_id === this.currentUserId;
    return this.ownsProfile(String(value.profile_id ?? ""));
  }

  async rpc(name: string, args: Record<string, unknown> = {}) {
    this.rpcCalls.push({ name, args });
    if (name === "ensure_my_profile") {
      if (!this.currentUserId) return { data: null, error: { code: "42501", message: "authentication required" } };
      let ownProfile = this.tables.profiles.find((item) => item.owner_id === this.currentUserId);
      if (!ownProfile && this.profileOnEnsure) {
        ownProfile = { ...this.profileOnEnsure, owner_id: this.currentUserId };
        this.tables.profiles.push(ownProfile);
      }
      return { data: ownProfile?.id ?? null, error: null };
    }

    if (name === "replace_profile_section") {
      const target = this.tables.profiles?.find((item) => item.id === args.p_profile_id);
      if (!target || target.owner_id !== this.currentUserId) {
        return { data: null, error: { code: "42501", message: "profile is not owned by current user" } };
      }
      const section = String(args.p_section);
      const table = section === "presence" ? "public_links" : section;
      const submitted = Array.isArray(args.p_items) ? args.p_items as Row[] : [];
      const existing = this.tables[table] ?? [];
      const next = submitted.map((item, sortOrder) => {
        const old = existing.find((candidate) => candidate.id === item.id && candidate.profile_id === target.id);
        const id = old?.id ?? randomUUID();
        const columns: Row =
          section === "knowledge"
            ? {
                title: item.title,
                description: item.description,
                relevant_topics: item.relevantTopics,
                url: item.url,
              }
            : section === "portfolio"
              ? {
                  title: item.title,
                  description: item.description,
                  media_path: item.media_path,
                  external_url: item.external_url,
                  category: item.category,
                }
              : { name: item.name, category: item.category };
        return { ...old, ...columns, id, profile_id: target.id, sort_order: sortOrder };
      });
      this.tables[table] = [...existing.filter((item) => item.profile_id !== target.id), ...next];
      return { data: null, error: null };
    }

    const profile = this.tables.profiles?.find((item) => item.id === args.p_profile_id);
    if (!profile || profile.owner_id !== this.currentUserId) {
      return { data: null, error: { code: "42501", message: "profile is not owned by current user" } };
    }
    profile.status = args.p_published ? "published" : "draft";
    profile.published_at = args.p_published ? new Date().toISOString() : profile.published_at;
    return { data: null, error: null };
  }
}

function profile(id: string, ownerId: string, username: string, status = "draft"): Row {
  return {
    id,
    owner_id: ownerId,
    username,
    full_name: "Dr Test User",
    headline: "Researcher",
    biography: "",
    known_for: "",
    interests: [],
    career_focus: "",
    location: "",
    profile_image_path: null,
    cover_image_path: null,
    status,
    onboarding_step: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    published_at: status === "published" ? "2026-01-01T00:00:00.000Z" : null,
  };
}

function repository(client: FakeClient) {
  return createSupabaseProfileRepository(async () => client as unknown as SupabaseServerClient);
}

describe("Supabase profile repository", () => {
  test("creates or retrieves the authenticated user's profile without selecting owner_id", async () => {
    const newProfile = profile("33333333-3333-4333-8333-333333333333", "owner-new", "new-user");
    const client = new FakeClient("owner-new", [], newProfile);
    const profiles = repository(client);

    const initial = await profiles.getByOwner("owner-new");
    assert.equal(initial?.profile.username, "new-user");
    assert.equal(initial?.profile.ownerId, "owner-new");
    assert.equal(client.rpcCalls[0]?.name, "ensure_my_profile");
    assert.equal(client.tables.profiles.length, 1);
    client.denyOwnerColumnRead = true;

    const updated = await profiles.updateIdentity("owner-new", {
      fullName: "Dr Updated User",
      headline: "Professor",
      username: "updated-user",
      location: "Delhi",
      profileImage: null,
      coverImage: null,
    });
    assert.equal(updated.ok, true);
    if (!updated.ok) return;
    assert.equal(updated.value.profile.fullName, "Dr Updated User");
  });

  test("replaces expertise, knowledge and portfolio atomically through the owner-checked RPC", async () => {
    const client = new FakeClient("owner-1", [profile("11111111-1111-4111-8111-111111111111", "owner-1", "test-user")]);
    const profiles = repository(client);

    const knowledgeWrite = await profiles.replaceSection("owner-1", "knowledge", [{
      title: "Research methods",
      description: "An overview.",
      relevantTopics: ["research"],
      url: "https://example.com/research",
    }]);
    assert.equal(knowledgeWrite.ok, true);
    if (!knowledgeWrite.ok) return;
    const knowledgeId = knowledgeWrite.value.knowledge[0]?.id;
    assert.equal(knowledgeWrite.value.knowledge[0]?.title, "Research methods");

    const knowledgeUpdate = await profiles.replaceSection("owner-1", "knowledge", [{
      id: knowledgeId,
      title: "Updated research",
      description: "Updated details.",
      relevantTopics: ["research", "methods"],
      url: "",
    }]);
    assert.equal(knowledgeUpdate.ok, true);
    if (!knowledgeUpdate.ok) return;
    assert.equal(knowledgeUpdate.value.knowledge.length, 1);
    assert.equal(knowledgeUpdate.value.knowledge[0]?.id, knowledgeId);
    assert.equal(knowledgeUpdate.value.knowledge[0]?.title, "Updated research");

    const expertiseWrite = await profiles.replaceSection("owner-1", "expertise", [{
      name: "Public health",
      category: "domain",
    }]);
    assert.equal(expertiseWrite.ok, true);
    if (!expertiseWrite.ok) return;
    assert.equal(expertiseWrite.value.expertise[0]?.name, "Public health");

    const portfolioWrite = await profiles.replaceSection("owner-1", "portfolio", [{
      title: "Selected work",
      description: "A public collection.",
      media: null,
      url: "https://example.com/work",
      category: "Research",
    }]);
    assert.equal(portfolioWrite.ok, true);
    if (!portfolioWrite.ok) return;
    assert.equal(portfolioWrite.value.portfolio[0]?.url, "https://example.com/work");

    const deletion = await profiles.replaceSection("owner-1", "knowledge", []);
    assert.equal(deletion.ok, true);
    if (deletion.ok) assert.deepEqual(deletion.value.knowledge, []);
    assert.equal(client.rpcCalls.filter((call) => call.name === "replace_profile_section").length, 5);
  });

  test("saves profile details and publishes through the existing guarded publication RPC", async () => {
    const client = new FakeClient("owner-1", [
      profile("11111111-1111-4111-8111-111111111111", "owner-1", "test-user"),
    ]);
    const profiles = repository(client);
    const about = await profiles.updateAbout("owner-1", {
      biography: "A professional biography.",
      knownFor: "Public health research",
      interests: ["research"],
      careerFocus: "Health systems",
    });
    assert.equal(about.ok, true);
    if (!about.ok) return;
    assert.equal(about.value.profile.biography, "A professional biography.");

    const published = await profiles.setPublished("owner-1", true);
    assert.equal(published.ok, true);
    if (published.ok) {
      assert.equal(published.value.profile.status, "published");
      assert.ok(published.value.profile.publishedAt);
    }
    assert.equal(client.rpcCalls.some((call) => call.name === "set_profile_published"), true);
  });

  test("rejects a mismatched owner and does not expose another user's draft", async () => {
    const client = new FakeClient("owner-1", [
      profile("11111111-1111-4111-8111-111111111111", "owner-1", "owner-one"),
      profile("22222222-2222-4222-8222-222222222222", "owner-2", "owner-two"),
    ]);
    const profiles = repository(client);

    assert.equal(await profiles.getByOwner("owner-2"), null);
    assert.equal(await profiles.getByUsernameForViewer("owner-two", "owner-1"), null);
    const result = await profiles.replaceSection("owner-2", "expertise", [{ name: "Restricted", category: "expertise" }]);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "NOT_FOUND");
    assert.deepEqual(client.tables.expertise ?? [], []);
    assert.equal(client.rpcCalls.some((call) => call.name === "replace_profile_section"), false);
  });

  test("public lookup returns published data but omits ownership for anonymous viewers", async () => {
    const client = new FakeClient(null, [
      profile("11111111-1111-4111-8111-111111111111", "owner-1", "private-user"),
      profile("22222222-2222-4222-8222-222222222222", "owner-2", "public-user", "published"),
    ]);
    client.tables.expertise = [{
      id: "33333333-3333-4333-8333-333333333333",
      profile_id: "22222222-2222-4222-8222-222222222222",
      sort_order: 0,
      name: "Public expertise",
      category: "domain",
    }];
    const profiles = repository(client);

    assert.equal(await profiles.getByUsernameForViewer("private-user", null), null);
    const publicProfile = await profiles.getByUsernameForViewer("public-user", null);
    assert.equal(publicProfile?.profile.username, "public-user");
    assert.equal(publicProfile?.profile.ownerId, "");
    assert.equal(publicProfile?.expertise[0]?.name, "Public expertise");
  });

  test("returns an owner's own draft through the secure profile identifier", async () => {
    const client = new FakeClient("owner-1", [
      profile("11111111-1111-4111-8111-111111111111", "owner-1", "owner-draft"),
      profile("22222222-2222-4222-8222-222222222222", "owner-2", "other-draft"),
    ]);
    const profiles = repository(client);

    const ownDraft = await profiles.getByUsernameForViewer("owner-draft", "owner-1");
    assert.equal(ownDraft?.profile.status, "draft");
    assert.equal(ownDraft?.profile.ownerId, "owner-1");
    assert.equal(await profiles.getByUsernameForViewer("other-draft", "owner-1"), null);
  });

  test("does not select the protected owner_id column", async () => {
    const client = new FakeClient("owner-1", [
      profile("11111111-1111-4111-8111-111111111111", "owner-1", "test-user"),
    ]);
    client.denyOwnerColumnRead = true;
    const ownerProfile = await repository(client).getByOwner("owner-1");
    assert.equal(ownerProfile?.profile.username, "test-user");
  });
});
