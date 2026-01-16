import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

type CacheFile = {
  generatedAt: number
  counts: Record<string, number>
}

const CACHE_DIR = path.join(process.cwd(), ".cache")
const CACHE_FILE = path.join(CACHE_DIR, "genre-counts.json")

const MAX_AGE_MS = 1000 * 60 * 60 * 12

let memoryCache: CacheFile | null = null

function nowMs(): number {
  return Date.now()
}

function isFresh(cache: CacheFile): boolean {
  return nowMs() - cache.generatedAt < MAX_AGE_MS
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000"
}

async function readCacheFile(): Promise<CacheFile | null> {
  try {
    const raw = await readFile(CACHE_FILE, "utf8")
    const parsed = JSON.parse(raw) as CacheFile
    if (!parsed || typeof parsed.generatedAt !== "number" || typeof parsed.counts !== "object") return null
    return parsed
  } catch {
    return null
  }
}

async function writeCacheFile(cache: CacheFile): Promise<void> {
  try {
    await mkdir(CACHE_DIR, { recursive: true })
    await writeFile(CACHE_FILE, JSON.stringify(cache), "utf8")
  } catch {
    // ignore
  }
}

async function computeCountsFromPocketBase(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}

  const perPage = 200
  let page = 1

  while (true) {
    const u = new URL("/api/pb/content", siteUrl())
    u.searchParams.set("page", String(page))
    u.searchParams.set("perPage", String(perPage))
    u.searchParams.set("fields", "genre_id")
    u.searchParams.set("skipTotal", "1")

    const res = await fetch(u.toString(), { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to fetch content")

    const json = (await res.json()) as { items?: Array<{ genre_id?: unknown }> }
    const items = Array.isArray(json.items) ? json.items : []
    if (items.length === 0) break

    for (const it of items) {
      const v = (it as any)?.genre_id
      const ids: string[] = Array.isArray(v) ? v : typeof v === "string" && v.trim() ? [v.trim()] : []
      for (const id of ids) {
        const key = String(id || "").trim()
        if (!key) continue
        counts[key] = (counts[key] || 0) + 1
      }
    }

    if (items.length < perPage) break
    page += 1
  }

  return counts
}

export async function getGenreCountsCached(): Promise<Record<string, number>> {
  if (memoryCache && isFresh(memoryCache)) return memoryCache.counts

  const fileCache = await readCacheFile()
  if (fileCache && isFresh(fileCache)) {
    memoryCache = fileCache
    return fileCache.counts
  }

  const counts = await computeCountsFromPocketBase().catch(() => (fileCache?.counts ? fileCache.counts : {}))
  const next: CacheFile = { generatedAt: nowMs(), counts }
  memoryCache = next
  await writeCacheFile(next)
  return counts
}
