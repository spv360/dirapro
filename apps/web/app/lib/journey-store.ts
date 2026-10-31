import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { JourneyInput, JourneyItem } from "../data/journey";

/**
 * File-backed persistence for Journey items. It is durable across refreshes,
 * sessions and restarts on any host with a persistent disk. Serverless hosts
 * (e.g. Vercel) need this module swapped for a database + object storage; the
 * exported functions are the only surface the rest of the app depends on.
 */
const dataDir = () => process.env.DIRA_DATA_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), ".data");
const dbFile = () => path.join(dataDir(), "journey.json");
export const uploadsDir = () => path.join(dataDir(), "uploads");

let queue: Promise<unknown> = Promise.resolve();

// Serializes read-modify-write cycles so concurrent requests cannot lose updates.
function locked<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

async function readAll(): Promise<JourneyItem[]> {
  try {
    const parsed = JSON.parse(await fs.readFile(dbFile(), "utf8")) as { items?: JourneyItem[] };
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeAll(items: JourneyItem[]) {
  await fs.mkdir(dataDir(), { recursive: true });
  const temp = `${dbFile()}.${randomUUID()}.tmp`;
  await fs.writeFile(temp, JSON.stringify({ items }, null, 2));
  await fs.rename(temp, dbFile());
}

export async function saveUpload(name: string, bytes: Buffer) {
  await fs.mkdir(uploadsDir(), { recursive: true });
  await fs.writeFile(path.join(/*turbopackIgnore: true*/ uploadsDir(), name), bytes);
}

async function removeMediaFile(file: string | undefined) {
  if (!file) return;
  await fs.rm(path.join(uploadsDir(), file), { force: true });
}

function sortNewest(items: JourneyItem[]) {
  return [...items].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export const isPublic = (item: JourneyItem) =>
  item.status === "published" && item.visibility === "public";

export async function listAll(profileId: string): Promise<JourneyItem[]> {
  return sortNewest((await readAll()).filter((item) => item.profileId === profileId));
}

export async function listPublic(profileId: string): Promise<JourneyItem[]> {
  return (await listAll(profileId)).filter(isPublic);
}

export async function findByMediaFile(file: string): Promise<JourneyItem | null> {
  return (await readAll()).find((item) => item.media?.file === file) ?? null;
}

function apply(item: JourneyItem, input: JourneyInput, now: string): JourneyItem {
  const publishedAt =
    input.status === "published" ? (item.publishedAt ?? now) : item.publishedAt;

  return {
    ...item,
    type: input.type,
    title: input.title,
    description: input.description,
    date: input.date,
    media: input.media,
    tags: input.tags,
    organization: input.organization,
    externalUrl: input.externalUrl,
    visibility: input.visibility,
    status: input.status,
    featured: input.featured,
    currentMomentReference: input.currentMoment
      ? (item.currentMomentReference ?? { featuredAt: now })
      : null,
    publishedAt,
    updatedAt: now,
  };
}

// Only one item can be featured at a time.
function enforceSingleFeatured(items: JourneyItem[], keep: JourneyItem) {
  if (!keep.featured) return;
  for (const item of items) {
    if (item.id !== keep.id && item.profileId === keep.profileId) item.featured = false;
  }
}

async function assertMediaAvailable(input: JourneyInput, items: JourneyItem[], selfId?: string) {
  if (!input.media) return;
  const inUse = items.some((item) => item.id !== selfId && item.media?.file === input.media?.file);
  if (inUse) throw new Error("Media is already attached to another update.");
  try {
    await fs.access(path.join(uploadsDir(), input.media.file));
  } catch {
    throw new Error("Uploaded media was not found. Upload it again.");
  }
}

export function createItem(profileId: string, input: JourneyInput): Promise<JourneyItem> {
  return locked(async () => {
    const items = await readAll();
    await assertMediaAvailable(input, items);
    const now = new Date().toISOString();
    const blank = {
      id: randomUUID(),
      profileId,
      createdAt: now,
      publishedAt: null,
      currentMomentReference: null,
    } as JourneyItem;
    const item = apply(blank, input, now);
    enforceSingleFeatured(items, item);
    await writeAll([...items, item]);
    return item;
  });
}

export function updateItem(id: string, profileId: string, input: JourneyInput): Promise<JourneyItem | null> {
  return locked(async () => {
    const items = await readAll();
    const index = items.findIndex((item) => item.id === id && item.profileId === profileId);
    if (index === -1) return null;
    await assertMediaAvailable(input, items, id);
    const previous = items[index];
    const item = apply(previous, input, new Date().toISOString());
    items[index] = item;
    enforceSingleFeatured(items, item);
    await writeAll(items);
    if (previous.media && previous.media.file !== item.media?.file) {
      await removeMediaFile(previous.media.file);
    }
    return item;
  });
}

export function deleteItem(id: string, profileId: string): Promise<boolean> {
  return locked(async () => {
    const items = await readAll();
    const target = items.find((item) => item.id === id && item.profileId === profileId);
    if (!target) return false;
    await writeAll(items.filter((item) => item.id !== id));
    await removeMediaFile(target.media?.file);
    return true;
  });
}
