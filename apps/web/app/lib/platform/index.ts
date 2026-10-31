import { localAuth } from "./local/auth";
import { localMedia } from "./local/media";
import { localProfiles } from "./local/profiles";
import type { AuthService, MediaStorage, ProfileRepository } from "./ports";

/** Single switch point: swap these for Supabase-backed adapters later. */
export const auth: AuthService = localAuth;
export const profiles: ProfileRepository = localProfiles;
export const mediaStorage: MediaStorage = localMedia;
