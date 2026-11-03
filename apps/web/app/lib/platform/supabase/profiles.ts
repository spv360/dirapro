import {
  EXPERTISE_CATEGORIES,
  LINK_PLATFORMS,
  RECOGNITION_KINDS,
  CONTRIBUTION_TYPES,
  type AboutInput,
  type IdentityInput,
  type ListSection,
  type MediaRef,
  type ProfileAggregate,
  type SectionItems,
} from "../types.ts";
import type { AuthResult, ProfileRepository } from "../ports.ts";
import { canPublish, isProfileMediaFile, isUuid, PROFILE_IMAGE_RULES } from "../validation.ts";
import type { SupabaseServerClient } from "./server.ts";

type Row = Record<string, unknown>;
type DbError = { code?: string; message: string };
type SectionTable = Exclude<ListSection, "presence"> | "public_links";

const PROFILE_OWNER_COLUMNS =
  "id,username,full_name,headline,biography,known_for,career_focus,location,interests,profile_image_path,cover_image_path,status,onboarding_step,published_at,created_at,updated_at";
const PROFILE_PUBLIC_COLUMNS =
  "id,username,full_name,headline,biography,known_for,career_focus,location,interests,profile_image_path,cover_image_path,status,published_at";

const TABLE_BY_SECTION: Record<ListSection, SectionTable> = {
  expertise: "expertise",
  experience: "experience",
  education: "education",
  recognition: "recognition",
  contributions: "contributions",
  knowledge: "knowledge",
  portfolio: "portfolio",
  presence: "public_links",
};

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const bad = (code: string, message: string): AuthResult<never> => ({ ok: false, code, message });

function throwOnError(error: DbError | null, operation: string): void {
  if (error) throw new Error(`Supabase ${operation} failed: ${error.message}`);
}

function row(value: unknown, label: string): Row {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Supabase returned an invalid ${label} record.`);
  }
  return value as Row;
}

function rows(value: unknown, label: string): Row[] {
  if (value === null) return [];
  if (!Array.isArray(value)) throw new Error(`Supabase returned an invalid ${label} list.`);
  return value.map((item) => row(item, label));
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function number(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function boolean(value: unknown): boolean {
  return value === true;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new Error("Supabase returned an invalid text array.");
  }
  return value;
}

function enumValue<const T extends readonly string[]>(value: unknown, values: T, label: string): T[number] {
  if (typeof value !== "string" || !(values as readonly string[]).includes(value)) {
    throw new Error(`Supabase returned an invalid ${label}.`);
  }
  return value as T[number];
}

function mediaPath(profileId: string, ref: MediaRef | null): string | null {
  if (!ref) return null;
  if (!isProfileMediaFile(ref.file) || MIME_BY_EXT[ref.file.split(".").at(-1) ?? ""] !== ref.mimeType) {
    throw new Error("INVALID_MEDIA");
  }
  return `profile/${profileId}/${ref.file}`;
}

function mediaFromStorage(profileId: string, storagePath: string, file: Row): MediaRef {
  const prefix = `profile/${profileId}/`;
  const name = storagePath.startsWith(prefix) ? storagePath.slice(prefix.length) : "";
  const mimeType = MIME_BY_EXT[name.split(".").at(-1) ?? ""];
  if (!name || !isProfileMediaFile(name) || !mimeType) {
    throw new Error("Supabase returned an invalid profile media path.");
  }

  const metadataValue: unknown = file.metadata;
  const metadata =
    metadataValue && typeof metadataValue === "object" && !Array.isArray(metadataValue)
      ? (metadataValue as Row)
      : {};
  const storedMimeType = text(metadata.mimetype, text(metadata.mimeType, mimeType));
  const sizeValue = Number(metadata.size);
  if (
    storedMimeType !== mimeType ||
    !Number.isSafeInteger(sizeValue) ||
    sizeValue <= 0 ||
    sizeValue > PROFILE_IMAGE_RULES.maxBytes
  ) {
    throw new Error("Supabase profile media metadata is missing or invalid.");
  }
  return { file: name, mimeType, size: sizeValue };
}

async function listProfileMedia(
  client: SupabaseServerClient,
  profileId: string,
  paths: string[],
): Promise<Map<string, MediaRef>> {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  if (!uniquePaths.length) return new Map();

  const { data, error } = await client.storage.from("dira-media").list(`profile/${profileId}`, { limit: 1000 });
  throwOnError(error, "profile media lookup");
  const files = rows(data, "profile media");
  const result = new Map<string, MediaRef>();
  for (const storagePath of uniquePaths) {
    const prefix = `profile/${profileId}/`;
    const fileName = storagePath.startsWith(prefix) ? storagePath.slice(prefix.length) : "";
    const file = files.find((candidate) => text(candidate.name) === fileName);
    if (!file) throw new Error(`Referenced profile media object is missing: ${storagePath}`);
    result.set(storagePath, mediaFromStorage(profileId, storagePath, file));
  }
  return result;
}

async function validateMediaRef(
  client: SupabaseServerClient,
  profileId: string,
  ref: MediaRef | null,
): Promise<string | null> {
  const storagePath = mediaPath(profileId, ref);
  if (!storagePath || !ref) return null;
  const stored = await listProfileMedia(client, profileId, [storagePath]);
  const actual = stored.get(storagePath);
  if (!actual || actual.mimeType !== ref.mimeType || actual.size !== ref.size) throw new Error("INVALID_MEDIA");
  return storagePath;
}

async function getSectionRows(client: SupabaseServerClient, table: SectionTable, profileId: string): Promise<Row[]> {
  const { data, error } = await client.from(table).select("*").eq("profile_id", profileId).order("sort_order", { ascending: true });
  throwOnError(error, `${table} read`);
  return rows(data, table);
}

function mapSection(
  section: ListSection,
  value: Row,
  media: Map<string, MediaRef>,
): SectionItems[ListSection][number] {
  const base = {
    id: text(value.id),
    profileId: text(value.profile_id),
    sortOrder: number(value.sort_order),
  };
  switch (section) {
    case "expertise":
      return {
        ...base,
        name: text(value.name),
        category: enumValue(value.category, EXPERTISE_CATEGORIES, "expertise category"),
      };
    case "experience":
      return {
        ...base,
        organization: text(value.organization),
        title: text(value.title),
        employmentType: text(value.employment_type),
        location: text(value.location),
        startDate: text(value.start_date),
        endDate: text(value.end_date),
        current: boolean(value.is_current),
        description: text(value.description),
      };
    case "education":
      return {
        ...base,
        institution: text(value.institution),
        qualification: text(value.qualification),
        fieldOfStudy: text(value.field_of_study),
        startDate: text(value.start_date),
        endDate: text(value.end_date),
        description: text(value.description),
      };
    case "recognition":
      return {
        ...base,
        kind: enumValue(value.kind, RECOGNITION_KINDS, "recognition kind"),
        title: text(value.title),
        issuer: text(value.issuer),
        issueDate: text(value.issue_date),
        credentialUrl: text(value.credential_url),
        description: text(value.description),
      };
    case "contributions": {
      const path = value.media_path === null ? null : text(value.media_path);
      return {
        ...base,
        title: text(value.title),
        type: enumValue(value.type, CONTRIBUTION_TYPES, "contribution type"),
        description: text(value.description),
        url: text(value.url),
        media: path ? media.get(path) ?? null : null,
      };
    }
    case "knowledge":
      return {
        ...base,
        title: text(value.title),
        description: text(value.description),
        relevantTopics: stringArray(value.relevant_topics),
        url: text(value.url),
      };
    case "portfolio": {
      const path = value.media_path === null ? null : text(value.media_path);
      return {
        ...base,
        title: text(value.title),
        description: text(value.description),
        media: path ? media.get(path) ?? null : null,
        url: text(value.external_url),
        category: text(value.category),
      };
    }
    case "presence":
      return {
        ...base,
        platform: enumValue(value.platform, LINK_PLATFORMS, "public link platform"),
        label: text(value.label),
        url: text(value.url),
      };
  }
}

function mapProfile(value: Row, ownerId: string, media: Map<string, MediaRef>): ProfileAggregate["profile"] {
  const profileId = text(value.id);
  const profileImagePath = value.profile_image_path === null ? null : text(value.profile_image_path);
  const coverImagePath = value.cover_image_path === null ? null : text(value.cover_image_path);
  return {
    id: profileId,
    ownerId: text(value.owner_id, ownerId),
    username: text(value.username),
    fullName: text(value.full_name),
    headline: text(value.headline),
    biography: text(value.biography),
    knownFor: text(value.known_for),
    interests: stringArray(value.interests),
    careerFocus: text(value.career_focus),
    location: text(value.location),
    profileImage: profileImagePath ? media.get(profileImagePath) ?? null : null,
    coverImage: coverImagePath ? media.get(coverImagePath) ?? null : null,
    status: enumValue(value.status, ["draft", "published"] as const, "profile status"),
    onboardingStep: number(value.onboarding_step),
    createdAt: text(value.created_at),
    updatedAt: text(value.updated_at),
    publishedAt: typeof value.published_at === "string" ? value.published_at : null,
  };
}

async function aggregateFromRow(
  client: SupabaseServerClient,
  profileRow: Row,
  ownerId = "",
): Promise<ProfileAggregate> {
  const profileId = text(profileRow.id);
  if (!profileId) throw new Error("Supabase returned a profile without an id.");

  const sections = Object.keys(TABLE_BY_SECTION) as ListSection[];
  const sectionResults = await Promise.all(
    sections.map((section) => getSectionRows(client, TABLE_BY_SECTION[section], profileId)),
  );
  const sectionRows = Object.fromEntries(sections.map((section, index) => [section, sectionResults[index]!])) as Record<
    ListSection,
    Row[]
  >;
  const paths = [
    profileRow.profile_image_path,
    profileRow.cover_image_path,
    ...sectionRows.contributions.map((item) => item.media_path),
    ...sectionRows.portfolio.map((item) => item.media_path),
  ].filter((path): path is string => typeof path === "string");
  const media = await listProfileMedia(client, profileId, paths);

  return {
    profile: mapProfile(profileRow, ownerId, media),
    expertise: sectionRows.expertise.map((item) => mapSection("expertise", item, media)) as ProfileAggregate["expertise"],
    experience: sectionRows.experience.map((item) => mapSection("experience", item, media)) as ProfileAggregate["experience"],
    education: sectionRows.education.map((item) => mapSection("education", item, media)) as ProfileAggregate["education"],
    recognition: sectionRows.recognition.map((item) => mapSection("recognition", item, media)) as ProfileAggregate["recognition"],
    contributions: sectionRows.contributions.map((item) => mapSection("contributions", item, media)) as ProfileAggregate["contributions"],
    knowledge: sectionRows.knowledge.map((item) => mapSection("knowledge", item, media)) as ProfileAggregate["knowledge"],
    portfolio: sectionRows.portfolio.map((item) => mapSection("portfolio", item, media)) as ProfileAggregate["portfolio"],
    links: sectionRows.presence.map((item) => mapSection("presence", item, media)) as ProfileAggregate["links"],
  };
}

async function currentUserId(client: SupabaseServerClient): Promise<string | null> {
  const { data, error } = await client.auth.getUser();
  if (error?.name === "AuthSessionMissingError") return null;
  throwOnError(error, "authenticated user lookup");
  return data.user?.id ?? null;
}

async function ownerProfile(client: SupabaseServerClient): Promise<Row | null> {
  const { data: profileId, error: rpcError } = await client.rpc("ensure_my_profile");
  throwOnError(rpcError, "authenticated profile lookup");
  if (typeof profileId !== "string" || !isUuid(profileId)) {
    throw new Error("Supabase returned an invalid authenticated profile identifier.");
  }
  const { data, error } = await client
    .from("profiles")
    .select(PROFILE_OWNER_COLUMNS)
    .eq("id", profileId)
    .maybeSingle();
  throwOnError(error, "owner profile lookup");
  return data ? row(data, "profile") : null;
}

function resultError(error: DbError, publication = false): AuthResult<never> | null {
  if (error.code === "23505") return bad("USERNAME_TAKEN", "This username is already taken.");
  if (error.code === "42501" || error.code === "PGRST116") return bad("NOT_FOUND", "Profile not found.");
  if (publication && error.code === "23514") return bad("INCOMPLETE", "Add your name and headline before publishing.");
  if (["22023", "23514", "23502", "22P02"].includes(error.code ?? "")) {
    return bad("INVALID_SECTION", "The profile section contains invalid data.");
  }
  return null;
}

export function createSupabaseProfileRepository(
  getClient: () => Promise<SupabaseServerClient> = async () => {
    const { createSupabaseServerClient } = await import("./server.ts");
    return createSupabaseServerClient();
  },
): ProfileRepository {
  return {
    async getByOwner(ownerId) {
      const client = await getClient();
      if ((await currentUserId(client)) !== ownerId) return null;
      const profile = await ownerProfile(client);
      return profile ? aggregateFromRow(client, profile, ownerId) : null;
    },

    async getById(profileId) {
      const client = await getClient();
      const { data, error } = await client
        .from("profiles")
        .select(PROFILE_PUBLIC_COLUMNS)
        .eq("id", profileId)
        .maybeSingle();
      throwOnError(error, "profile lookup");
      if (!data) return null;
      const userId = await currentUserId(client);
      let ownerId = "";
      if (userId) {
        const ownProfile = await ownerProfile(client);
        if (ownProfile && text(ownProfile.id) === profileId) ownerId = userId;
      }
      return aggregateFromRow(client, row(data, "profile"), ownerId);
    },

    async getByUsernameForViewer(username, viewerId) {
      const client = await getClient();
      const userId = await currentUserId(client);
      if (viewerId && viewerId === userId) {
        const ownedProfile = await ownerProfile(client);
        if (ownedProfile && text(ownedProfile.username) === username) {
          return aggregateFromRow(client, ownedProfile, userId);
        }
      }
      const { data, error } = await client
        .from("profiles")
        .select(PROFILE_PUBLIC_COLUMNS)
        .eq("username", username)
        .maybeSingle();
      throwOnError(error, "public profile lookup");
      return data ? aggregateFromRow(client, row(data, "profile")) : null;
    },

    async updateIdentity(ownerId, input: IdentityInput) {
      const client = await getClient();
      if ((await currentUserId(client)) !== ownerId) return bad("NOT_FOUND", "Profile not found.");
      const profile = await ownerProfile(client);
      if (!profile) return bad("NOT_FOUND", "Profile not found.");
      const profileId = text(profile.id);
      let profileImagePath: string | null;
      let coverImagePath: string | null;
      try {
        [profileImagePath, coverImagePath] = await Promise.all([
          validateMediaRef(client, profileId, input.profileImage),
          validateMediaRef(client, profileId, input.coverImage),
        ]);
      } catch (error) {
        if (error instanceof Error && error.message === "INVALID_MEDIA") return bad("INVALID_MEDIA", "Image not found.");
        throw error;
      }

      const { data, error } = await client
        .from("profiles")
        .update({
          full_name: input.fullName,
          headline: input.headline,
          username: input.username,
          location: input.location,
          profile_image_path: profileImagePath,
          cover_image_path: coverImagePath,
        })
        .eq("id", profileId)
        .select(PROFILE_OWNER_COLUMNS)
        .maybeSingle();
      if (error) {
        const mapped = resultError(error);
        if (mapped) return mapped;
        throwOnError(error, "identity update");
      }
      if (!data) return bad("NOT_FOUND", "Profile not found.");
      return { ok: true, value: await aggregateFromRow(client, row(data, "profile"), ownerId) };
    },

    async updateAbout(ownerId, input: AboutInput) {
      const client = await getClient();
      if ((await currentUserId(client)) !== ownerId) return bad("NOT_FOUND", "Profile not found.");
      const profile = await ownerProfile(client);
      if (!profile) return bad("NOT_FOUND", "Profile not found.");
      const { data, error } = await client
        .from("profiles")
        .update({
          biography: input.biography,
          known_for: input.knownFor,
          interests: input.interests,
          career_focus: input.careerFocus,
        })
        .eq("id", text(profile.id))
        .select(PROFILE_OWNER_COLUMNS)
        .maybeSingle();
      if (error) throwOnError(error, "about update");
      if (!data) return bad("NOT_FOUND", "Profile not found.");
      return { ok: true, value: await aggregateFromRow(client, row(data, "profile"), ownerId) };
    },

    async setOnboardingStep(ownerId, step) {
      const client = await getClient();
      if ((await currentUserId(client)) !== ownerId) throw new Error("Profile not found or not owned by the current user.");
      const profile = await ownerProfile(client);
      if (!profile) throw new Error("Profile not found or not owned by the current user.");
      const { data, error } = await client
        .from("profiles")
        .update({ onboarding_step: Math.max(0, Math.min(8, Math.floor(step))) })
        .eq("id", text(profile.id))
        .select("id")
        .maybeSingle();
      throwOnError(error, "onboarding progress update");
      if (!data) throw new Error("Profile not found or not owned by the current user.");
    },

    async replaceSection<S extends ListSection>(ownerId: string, section: S, items: SectionItems[S]) {
      const client = await getClient();
      if ((await currentUserId(client)) !== ownerId) return bad("NOT_FOUND", "Profile not found.");
      const profile = await ownerProfile(client);
      if (!profile) return bad("NOT_FOUND", "Profile not found.");

      if (section !== "expertise" && section !== "knowledge" && section !== "portfolio") {
        return bad("SECTION_NOT_SUPPORTED", `Supabase profile editing does not support the ${section} section yet.`);
      }

      const profileId = text(profile.id);
      let payload: Row[];
      try {
        payload = await (async (): Promise<Row[]> => {
          switch (section) {
            case "expertise":
              return (items as SectionItems["expertise"]).map((item) => ({
                ...(item.id ? { id: item.id } : {}),
                name: item.name,
                category: item.category,
              }));
            case "knowledge":
              return (items as SectionItems["knowledge"]).map((item) => ({
                ...(item.id ? { id: item.id } : {}),
                title: item.title,
                description: item.description,
                relevantTopics: item.relevantTopics,
                url: item.url,
              }));
            case "portfolio":
              return Promise.all((items as SectionItems["portfolio"]).map(async (item) => ({
                ...(item.id ? { id: item.id } : {}),
                title: item.title,
                description: item.description,
                media_path: await validateMediaRef(client, profileId, item.media),
                external_url: item.url,
                category: item.category,
              })));
            default:
              throw new Error(`Unsupported profile section: ${section}`);
          }
        })();
      } catch (error) {
        if (error instanceof Error && error.message === "INVALID_MEDIA") return bad("INVALID_MEDIA", "Image not found.");
        throw error;
      }

      const { error } = await client.rpc("replace_profile_section", {
        p_profile_id: profileId,
        p_section: section,
        p_items: payload,
      });
      if (error) {
        const mapped = resultError(error);
        if (mapped) return mapped;
        throwOnError(error, `${section} section replacement`);
      }
      const updatedProfile = await ownerProfile(client);
      if (!updatedProfile) return bad("NOT_FOUND", "Profile not found.");
      return { ok: true, value: await aggregateFromRow(client, updatedProfile, ownerId) };
    },

    async setPublished(ownerId, published) {
      const client = await getClient();
      if ((await currentUserId(client)) !== ownerId) return bad("NOT_FOUND", "Profile not found.");
      const profile = await ownerProfile(client);
      if (!profile) return bad("NOT_FOUND", "Profile not found.");
      const current = await aggregateFromRow(client, profile, ownerId);
      if (published && !canPublish(current)) {
        return bad("INCOMPLETE", "Add your name and headline before publishing.");
      }
      const { error } = await client.rpc("set_profile_published", {
        p_profile_id: text(profile.id),
        p_published: published,
      });
      if (error) {
        const mapped = resultError(error, true);
        if (mapped) return mapped;
        throwOnError(error, "profile publication");
      }
      const updatedProfile = await ownerProfile(client);
      if (!updatedProfile) return bad("NOT_FOUND", "Profile not found.");
      return { ok: true, value: await aggregateFromRow(client, updatedProfile, ownerId) };
    },
  };
}

export const supabaseProfiles = createSupabaseProfileRepository();
