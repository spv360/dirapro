import { promises as fs } from "node:fs";
import path from "node:path";
import { dataDir } from "../../journey-store";
import { publishingDisabled } from "../../publishing";
import type { ProfileAggregate, User } from "../types";

type Session = { hash: string; userId: string; expiresAt: number };
export type Db = { users: User[]; profiles: ProfileAggregate[]; sessions: Session[] };

const file = () => path.join(dataDir(), "platform.json");
const empty = (): Db => ({ users: [], profiles: [], sessions: [] });

// Serialises read-modify-write cycles within this process.
let chain: Promise<unknown> = Promise.resolve();

async function read(): Promise<Db> {
  try {
    return { ...empty(), ...(JSON.parse(await fs.readFile(file(), "utf8")) as Partial<Db>) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return empty();
    throw error;
  }
}

async function write(db: Db) {
  // Defense in depth: the filesystem is not durable on Vercel; route guards already 503 first.
  if (publishingDisabled()) throw new Error("Local storage writes are disabled in this environment.");
  await fs.mkdir(dataDir(), { recursive: true });
  const tmp = `${file()}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), { mode: 0o600 });
  await fs.rename(tmp, file());
}

export function readDb(): Promise<Db> {
  return chain.then(read);
}

/** Runs fn against the current database; persists only if fn returns a truthy `save` flag. */
export function transact<T>(fn: (db: Db) => { result: T; save: boolean }): Promise<T> {
  const run = chain.then(async () => {
    const db = await read();
    const { result, save } = fn(db);
    if (save) await write(db);
    return result;
  });
  chain = run.catch(() => undefined);
  return run;
}
