import type {
  AboutInput,
  IdentityInput,
  ListSection,
  MediaRef,
  ProfileAggregate,
  PublicUser,
  SectionItems,
} from "./types.ts";

/** Adapter interfaces. Local JSON/filesystem today; Supabase Auth/Postgres/Storage later. */

export type AuthResult<T> = { ok: true; value: T } | { ok: false; code: string; message: string };

export interface AuthService {
  register(input: { fullName: string; email: string; username: string; password: string }): Promise<AuthResult<{ user: PublicUser; profileId: string; token: string }>>;
  login(identifier: string, password: string): Promise<AuthResult<{ user: PublicUser; token: string }>>;
  userForToken(token: string): Promise<PublicUser | null>;
  logout(token: string): Promise<void>;
  usernameAvailable(username: string): Promise<boolean>;
}

export interface ProfileRepository {
  /** Owner's own profile, any status. */
  getByOwner(ownerId: string): Promise<ProfileAggregate | null>;
  /** Unfiltered lookup for access decisions made by the caller (media serving). */
  getById(profileId: string): Promise<ProfileAggregate | null>;
  /** Drafts are returned only when viewerId owns the profile. */
  getByUsernameForViewer(username: string, viewerId: string | null): Promise<ProfileAggregate | null>;
  updateIdentity(ownerId: string, input: IdentityInput): Promise<AuthResult<ProfileAggregate>>;
  updateAbout(ownerId: string, input: AboutInput): Promise<AuthResult<ProfileAggregate>>;
  setOnboardingStep(ownerId: string, step: number): Promise<void>;
  replaceSection<S extends ListSection>(ownerId: string, section: S, items: SectionItems[S]): Promise<AuthResult<ProfileAggregate>>;
  setPublished(ownerId: string, published: boolean): Promise<AuthResult<ProfileAggregate>>;
}

export interface MediaStorage {
  save(profileId: string, bytes: Buffer, mimeType: string): Promise<MediaRef>;
  read(profileId: string, file: string): Promise<Buffer | null>;
}
