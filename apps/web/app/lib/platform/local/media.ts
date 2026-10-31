import { randomUUID } from "node:crypto";
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { dataDir } from "../../journey-store";
import { publishingDisabled } from "../../publishing";
import { isProfileMediaFile, isUuid } from "../validation";
import type { MediaRef } from "../types";
import type { MediaStorage } from "../ports";

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Returns null for anything that is not a well-formed profile id / file name (blocks traversal). */
function resolve(profileId: string, file: string): string | null {
  if (!isUuid(profileId) || !isProfileMediaFile(file)) return null;
  return path.join(dataDir(), "uploads", "profiles", profileId, file);
}

export const mediaFileExists = (profileId: string, ref: MediaRef) => {
  const target = resolve(profileId, ref.file);
  return target !== null && existsSync(target);
};

export const localMedia: MediaStorage = {
  async save(profileId, bytes, mimeType) {
    const ext = EXT[mimeType];
    if (publishingDisabled()) throw new Error("Local storage writes are disabled in this environment.");
    if (!ext || !isUuid(profileId)) throw new Error("Unsupported media");
    const file = `${randomUUID()}.${ext}`;
    const target = resolve(profileId, file)!;
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, bytes, { mode: 0o600 });
    return { file, mimeType, size: bytes.length };
  },

  async read(profileId, file) {
    const target = resolve(profileId, file);
    if (!target) return null;
    try {
      return await fs.readFile(target);
    } catch {
      return null;
    }
  },
};
