import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

type CacheFile = {
  generatedAt: number
  genres: Record<string, { name: string; count: number }>
}

const CACHE_DIR = path.join(process.cwd(), "cache")
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

function toDisplayGenreName(name: string): string {
  const n = name.trim()
  if (!n) return n
  const lower = n.toLowerCase()
  if (lower === "sci-fi" || lower === "scifi" || lower === "sci fi") return "Sci-Fi"
  return lower.replace(/\b\w/g, (c) => c.toUpperCase())
}

async function fetchGenreNameById(): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  const u = new URL("/api/pb/genres", siteUrl())
  u.searchParams.set("page", "1")
  u.searchParams.set("perPage", "200")
  u.searchParams.set("fields", "id,name")
  u.searchParams.set("skipTotal", "1")

  const res = await fetch(u.toString(), { cache: "no-store" })
  if (!res.ok) return out

  const json = (await res.json()) as { items?: Array<{ id?: unknown; name?: unknown }> }
  const items = Array.isArray(json.items) ? json.items : []
  for (const it of items) {
    const id = typeof it?.id === "string" ? it.id.trim() : ""
    const raw = typeof it?.name === "string" ? it.name.trim() : ""
    if (!id || !raw) continue
    out[id] = toDisplayGenreName(raw)
  }
  return out
}

async function readCacheFile(): Promise<CacheFile | null> {
  try {
    const raw = await readFile(CACHE_FILE, "utf8")
    const parsed = JSON.parse(raw) as any
    if (!parsed || typeof parsed.generatedAt !== "number") return null

    if (parsed.genres && typeof parsed.genres === "object") {
      return parsed as CacheFile
    }

    if (parsed.counts && typeof parsed.counts === "object") {
      const counts = parsed.counts as Record<string, number>
      const genres: CacheFile["genres"] = {}
      for (const [id, count] of Object.entries(counts)) {
        const key = String(id || "").trim()
        const c = typeof count === "number" ? count : 0
        if (!key || c <= 0) continue
        genres[key] = { name: key, count: c }
      }
      return { generatedAt: parsed.generatedAt, genres }
    }

    return null
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

async function computeGenresFromPocketBase(): Promise<CacheFile["genres"]> {
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

  const nameById = await fetchGenreNameById().catch(() => ({} as Record<string, string>))
  const genres: CacheFile["genres"] = {}
  for (const [id, count] of Object.entries(counts)) {
    const key = String(id || "").trim()
    if (!key) continue
    genres[key] = { name: nameById[key] || key, count }
  }

  return genres
}

export async function getGenreCountsCached(): Promise<CacheFile["genres"]> {
  if (memoryCache && isFresh(memoryCache)) return memoryCache.genres

  const fileCache = await readCacheFile()
  const fileGenres = fileCache?.genres || {}
  if (fileCache && isFresh(fileCache)) {
    const needsNames = Object.entries(fileGenres).some(([id, v]) => !v?.name || v.name.trim() === "" || v.name === id)
    if (needsNames) {
      const nameById = await fetchGenreNameById().catch(() => ({} as Record<string, string>))
      const enriched: CacheFile["genres"] = {}
      for (const [id, v] of Object.entries(fileGenres)) {
        const key = String(id || "").trim()
        if (!key) continue
        const count = typeof v?.count === "number" ? v.count : 0
        enriched[key] = { name: nameById[key] || (v?.name || key), count }
      }
      const next: CacheFile = { generatedAt: fileCache.generatedAt, genres: enriched }
      memoryCache = next
      await writeCacheFile(next)
      return enriched
    }

    memoryCache = fileCache
    return fileGenres
  }

  const genres = await computeGenresFromPocketBase().catch(() => (fileGenres ? fileGenres : {}))
  const next: CacheFile = { generatedAt: nowMs(), genres }
  memoryCache = next
  await writeCacheFile(next)
  return genres
}
