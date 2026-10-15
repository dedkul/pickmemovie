import { get, put } from "@vercel/blob";
import { cacheLife, cacheTag } from "next/cache";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { EMPTY_SNAPSHOT, type Snapshot } from "./snapshot";

// Vercel Blob when a store is connected (BLOB_STORE_ID with OIDC on Vercel, or
// a read-write token); otherwise a gitignored local file, so development needs
// no Vercel project.
const PATHNAME = "showtimes.json";
const LOCAL_FILE = ".data/showtimes.json";
const useBlob = () => Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);

export async function readSnapshot(): Promise<Snapshot> {
  let text: string | null = null;
  if (useBlob()) {
    const blob = await get(PATHNAME, { access: "private", useCache: false });
    if (blob?.stream) text = await new Response(blob.stream).text();
  } else {
    text = await readFile(LOCAL_FILE, "utf8").catch(() => null);
  }
  return text ? (JSON.parse(text) as Snapshot) : EMPTY_SNAPSHOT;
}

export async function writeSnapshot(snapshot: Snapshot): Promise<void> {
  const body = JSON.stringify(snapshot);
  if (useBlob()) {
    await put(PATHNAME, body, { access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true });
  } else {
    await mkdir(".data", { recursive: true });
    await writeFile(LOCAL_FILE, body);
  }
}

// What pages read. The refresh job calls revalidateTag("showtimes") after writing.
export async function getCachedSnapshot(): Promise<Snapshot> {
  "use cache";
  cacheLife("hours");
  cacheTag("showtimes");
  return readSnapshot();
}
