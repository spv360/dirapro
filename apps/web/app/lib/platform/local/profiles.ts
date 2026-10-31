import { randomUUID } from "node:crypto";
import { canPublish, validateUsername } from "../validation";
import type { Db } from "./store";
import { readDb, transact } from "./store";
import type { MediaRef, ProfileAggregate } from "../types";
import type { AuthResult, ProfileRepository } from "../ports";
import { mediaFileExists } from "./media";

const bad = (code: string, message: string): AuthResult<never> => ({ ok: false, code, message });
const clone = <T,>(value: T): T => structuredClone(value);
const find = (db: Db, ownerId: string) => db.profiles.find((p) => p.profile.ownerId === ownerId);

// A media reference is only accepted when the file exists in this profile's own upload folder.
const mediaExists = (profileId: string, ref: MediaRef) => mediaFileExists(profileId, ref);

const SECTION_KEY = {
  expertise: "expertise", experience: "experience", education: "education",
  recognition: "recognition", contributions: "contributions", presence: "links",
} as const;

export const localProfiles: ProfileRepository = {
  async getByOwner(ownerId) {
    const agg = find(await readDb(), ownerId);
    return agg ? clone(agg) : null;
  },

  async getById(profileId) {
    const agg = (await readDb()).profiles.find((p) => p.profile.id === profileId);
    return agg ? clone(agg) : null;
  },

  async getByUsernameForViewer(username, viewerId) {
    const agg = (await readDb()).profiles.find((p) => p.profile.username === username);
    if (!agg) return null;
    const isOwner = viewerId !== null && agg.profile.ownerId === viewerId;
    return agg.profile.status === "published" || isOwner ? clone(agg) : null;
  },

  async updateIdentity(ownerId, input) {
    return transact<AuthResult<ProfileAggregate>>((db) => {
      const agg = find(db, ownerId);
      if (!agg) return { result: bad("NOT_FOUND", "Profile not found."), save: false };
      if (validateUsername(input.username) && input.username !== agg.profile.username) {
        return { result: bad("INVALID_USERNAME", "This username is not allowed."), save: false };
      }
      if (db.profiles.some((p) => p !== agg && p.profile.username === input.username)) {
        return { result: bad("USERNAME_TAKEN", "This username is already taken."), save: false };
      }
      for (const ref of [input.profileImage, input.coverImage]) {
        if (ref && !mediaExists(agg.profile.id, ref)) return { result: bad("INVALID_MEDIA", "Image not found."), save: false };
      }
      Object.assign(agg.profile, {
        fullName: input.fullName, headline: input.headline, username: input.username,
        location: input.location, profileImage: input.profileImage, coverImage: input.coverImage,
        updatedAt: new Date().toISOString(),
      });
      return { result: { ok: true as const, value: clone(agg) }, save: true };
    });
  },

  async updateAbout(ownerId, input) {
    return transact<AuthResult<ProfileAggregate>>((db) => {
      const agg = find(db, ownerId);
      if (!agg) return { result: bad("NOT_FOUND", "Profile not found."), save: false };
      Object.assign(agg.profile, { ...input, updatedAt: new Date().toISOString() });
      return { result: { ok: true as const, value: clone(agg) }, save: true };
    });
  },

  async setOnboardingStep(ownerId, step) {
    await transact((db) => {
      const agg = find(db, ownerId);
      if (!agg) return { result: undefined, save: false };
      agg.profile.onboardingStep = Math.max(0, Math.min(8, Math.floor(step)));
      return { result: undefined, save: true };
    });
  },

  async replaceSection(ownerId, section, items) {
    return transact<AuthResult<ProfileAggregate>>((db) => {
      const agg = find(db, ownerId);
      if (!agg) return { result: bad("NOT_FOUND", "Profile not found."), save: false };
      const key = SECTION_KEY[section];
      const existing = new Set((agg[key] as { id: string }[]).map((e) => e.id));
      const next = (items as unknown as Record<string, unknown>[]).map((item, sortOrder) => {
        const media = item.media as MediaRef | null | undefined;
        if (media && !mediaExists(agg.profile.id, media)) throw new Error("INVALID_MEDIA");
        // Ids are only honoured when they already belong to this profile.
        const id = typeof item.id === "string" && existing.has(item.id) ? item.id : randomUUID();
        return { ...item, id, profileId: agg.profile.id, sortOrder };
      });
      (agg as unknown as Record<string, unknown[]>)[key] = next;
      agg.profile.updatedAt = new Date().toISOString();
      return { result: { ok: true as const, value: clone(agg) }, save: true };
    }).catch((error: Error): AuthResult<ProfileAggregate> => {
      if (error.message === "INVALID_MEDIA") return bad("INVALID_MEDIA", "Image not found.");
      throw error;
    });
  },

  async setPublished(ownerId, published) {
    return transact<AuthResult<ProfileAggregate>>((db) => {
      const agg = find(db, ownerId);
      if (!agg) return { result: bad("NOT_FOUND", "Profile not found."), save: false };
      if (published && !canPublish(agg as ProfileAggregate)) {
        return { result: bad("INCOMPLETE", "Add your name and headline before publishing."), save: false };
      }
      const now = new Date().toISOString();
      agg.profile.status = published ? "published" : "draft";
      if (published) agg.profile.publishedAt = agg.profile.publishedAt ?? now;
      agg.profile.updatedAt = now;
      return { result: { ok: true as const, value: clone(agg) }, save: true };
    });
  },
};
