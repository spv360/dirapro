import { localAuth } from "./local/auth";
import { localMedia } from "./local/media";
import { localProfiles } from "./local/profiles";
import type { AuthService, MediaStorage, ProfileRepository } from "./ports";
import { supabaseAuth } from "./supabase/auth";
import { supabaseProfiles } from "./supabase/profiles";

export const platformBackend = process.env.DIRA_BACKEND ?? "local";
if (platformBackend !== "local" && platformBackend !== "supabase") {
  throw new Error(`Unsupported DIRA_BACKEND "${platformBackend}". Use "local" or "supabase".`);
}

export const auth: AuthService = platformBackend === "supabase" ? supabaseAuth : localAuth;
export const profiles: ProfileRepository = platformBackend === "supabase" ? supabaseProfiles : localProfiles;
export const mediaStorage: MediaStorage = localMedia;
