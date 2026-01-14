import type { Content, VideoSources } from "./types"

type PBListResp<T> = {
  page: number
  perPage: number
  totalItems: number
  totalPages: number
  items: T[]
}

type PBMovieExpand = {
  content_id?: {
    poster_url?: string
    poster_width?: number
    poster_height?: number
    vidsrc_url?: string
    vidlink_url?: string
    autoembed_url?: string
    gomo_url?: string
    moviesapi_url?: string
  }
  genre_id?: Array<{ name?: string }>
  country_id?: Array<{ name?: string; code?: string }>
}

type PBMovieRecord = {
  imdb_id?: string
  tmdb_id?: string
  title?: string
  plot?: string
  type?: "movie" | "serie"
  quality?: string
  released_year?: number
  duration?: number
  imdb_rating?: number
  vote_count?: number
  expand?: PBMovieExpand
}

type PBGenreRecord = {
  id: string
  name?: string
}

function pbBaseUrl(): string {
  return process.env.NEXT_PUBLIC_PB_URL || process.env.PB_URL || "http://127.0.0.1:8090"
}

function pbApiBasePath(): string {
	// Use Next.js API proxy to avoid CORS when called from the browser.
	// Server components can also use this safely.
	return "/api/pb"
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

function movieRecordToContent(r: PBMovieRecord): Content {
  const imdb = (r.imdb_id || "").trim()
  const exp = r.expand || {}
  const c = exp.content_id

  const primaryVideo: VideoSources | undefined = c
    ? {
        vidsrc_url: c.vidsrc_url || undefined,
        vidlink_pro_url: c.vidlink_url || undefined,
        autoembed_url: c.autoembed_url || undefined,
        gomo_url: c.gomo_url || undefined,
        moviesapi_url: c.moviesapi_url || undefined,
      }
    : undefined

  const genres = (exp.genre_id || [])
    .map((g) => (g.name || "").trim())
    .filter(Boolean)
    .map(toDisplayGenreName)

  const countries = (exp.country_id || [])
    .map((cc) => (cc.name || cc.code || "").trim())
    .filter(Boolean)

  const ratingValue = typeof r.imdb_rating === "number" ? r.imdb_rating : 0
  const voteCount = typeof r.vote_count === "number" ? r.vote_count : 0

  return {
    imdb_id: imdb,
    tmdb_id: (r.tmdb_id || "").trim() || undefined,
    title: (r.title || "").trim() || imdb,
    type: r.type === "serie" ? "tv" : "movie",
    quality: (r.quality || "").trim() || undefined,
    startYear: typeof r.released_year === "number" ? r.released_year : undefined,
    runtimeSeconds: typeof r.duration === "number" ? r.duration : undefined,
    genres,
    rating: ratingValue > 0 || voteCount > 0 ? { aggregateRating: ratingValue, voteCount } : undefined,
    plot: (r.plot || "").trim() || undefined,
    primaryImage:
      c && c.poster_url
        ? {
            url: c.poster_url,
            width: typeof c.poster_width === "number" ? c.poster_width : 0,
            height: typeof c.poster_height === "number" ? c.poster_height : 0,
          }
        : undefined,
    primaryVideo: primaryVideo && Object.values(primaryVideo).some(Boolean) ? primaryVideo : undefined,
    directors: [],
    writers: [],
    stars: [],
    originCountries: countries,
  }
}

async function pbGetJSON<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const isProxy = path.startsWith("/api/pb/")
	const isServer = typeof window === "undefined"
	const base = isProxy ? (isServer ? siteUrl() : "http://localhost") : pbBaseUrl()

  const u = new URL(path, base)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === "") continue
      u.searchParams.set(k, String(v))
    }
  }

  const urlStr = isProxy ? (isServer ? u.toString() : u.pathname + u.search) : u.toString()
  const res = await fetch(urlStr, { cache: "no-store" })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`PocketBase request failed: ${res.status} ${text}`)
  }
  return (await res.json()) as T
}

export async function listContent(opts?: {
  page?: number
  perPage?: number
  filter?: string
  sort?: string
}): Promise<{ items: Content[]; totalItems: number; totalPages: number; page: number; perPage: number }> {
  const page = opts?.page ?? 1
  const perPage = opts?.perPage ?? 24

  const resp = await pbGetJSON<PBListResp<PBMovieRecord>>(pbApiBasePath() + "/content", {
    page,
    perPage,
    filter: opts?.filter,
    sort: opts?.sort,
    expand: "content_id,genre_id,country_id",
  })

  return {
    items: resp.items.map(movieRecordToContent).filter((c) => c.imdb_id),
    totalItems: resp.totalItems,
    totalPages: resp.totalPages,
    page: resp.page,
    perPage: resp.perPage,
  }
}

export async function getContentByImdb(imdbId: string): Promise<Content | null> {
  const id = imdbId.trim()
  if (!id) return null

  const resp = await pbGetJSON<PBListResp<PBMovieRecord>>("/api/pb/content", {
    page: 1,
    perPage: 1,
    filter: `imdb_id="${id.replaceAll('"', "\\\"")}"`,
    expand: "content_id,genre_id,country_id",
  })

  const rec = resp.items[0]
  if (!rec) return null
  const c = movieRecordToContent(rec)
  return c.imdb_id ? c : null
}

export async function listGenres(): Promise<Array<{ id: string; name: string }>> {
  const resp = await pbGetJSON<PBListResp<PBGenreRecord>>(pbApiBasePath() + "/genres", {
    page: 1,
    perPage: 200,
    sort: "name",
  })

  return resp.items
    .map((g) => ({ id: g.id, name: toDisplayGenreName((g.name || "").trim()) }))
    .filter((g) => g.id && g.name)
}

export async function findGenreBySlug(slug: string): Promise<{ id: string; name: string } | null> {
  const s = slug.trim().toLowerCase()
  if (!s) return null

  const resp = await pbGetJSON<PBListResp<PBGenreRecord>>("/api/pb/genres", {
    page: 1,
    perPage: 1,
    filter: `name="${s.replaceAll('"', "\\\"")}"`,
  })

  const g = resp.items[0]
  if (!g?.id || !g.name) return null
  return { id: g.id, name: toDisplayGenreName(g.name) }
}
