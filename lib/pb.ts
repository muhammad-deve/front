import type { Content, Person, VideoSources, Channel } from "./types"

type PBListResp<T> = {
  page: number
  perPage: number
  totalItems: number
  totalPages: number
  items: T[]
}

export async function listFeaturedHero(opts?: {
  perPage?: number
  sort?: string
}): Promise<Content[]> {
  const perPage = opts?.perPage ?? 5

  const featuredResp = await pbGetJSON<PBListResp<PBFeaturedRecord>>(pbApiBasePath() + "/featured", {
    page: 1,
    perPage,
    sort: opts?.sort,
    fields: "id,movie_id,background_url,created",
  })

  const featured = featuredResp.items || []
  const movieIds = featured.map((f) => (f.movie_id || "").trim()).filter(Boolean)
  if (movieIds.length === 0) return []

  const idFilter = buildOrEqualsFilter("id", movieIds)
  if (!idFilter) return []

  const { items: movies } = await listContent({
    page: 1,
    perPage: 200,
    filter: idFilter,
  })

  const byId = new Map(movies.map((m) => [m.imdb_id, m] as const))
  const byRecordId = new Map<string, Content>()

  // listContent() returns Content keyed by imdb_id, but we need to map by PB record id.
  // We re-fetch minimal mapping from PB for the selected record ids.
  const resp = await pbGetJSON<PBListResp<PBMovieRecord>>(pbApiBasePath() + "/content", {
    page: 1,
    perPage: 200,
    filter: idFilter,
    fields: "id,imdb_id",
  })

  for (const r of resp.items || []) {
    const imdb = (r.imdb_id || "").trim()
    if (!imdb) continue
    const c = byId.get(imdb)
    if (c) byRecordId.set(r.id, c)
  }

  const out: Content[] = []
  for (const f of featured) {
    const mid = (f.movie_id || "").trim()
    if (!mid) continue
    const c = byRecordId.get(mid)
    if (!c) continue

    const bg = (f.background_url || "").trim()
    out.push(
      bg
        ? {
          ...c,
          backdropImage: { url: bg, width: 0, height: 0 },
        }
        : c,
    )
  }

  return out
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
  id: string
  content_id?: string
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
  genre_id?: string[]
  country_id?: string[]
  expand?: PBMovieExpand
}

type PBPersonRecord = {
  id: string
  imdb_id?: string
  name?: string
  professions?: string[]
  profession?: string
  "professions_as________________"?: string
  img_url?: string
  img_width?: number
  img_height?: number
  movie_id?: string | string[]
  contents?: string | string[]
}

type PBGenreRecord = {
  id: string
  name?: string
}

type PBChannelRecord = {
  id: string
  title?: string
  logo_url?: string
  quality?: string
  stream_url?: string
  expand?: {
    category?: Array<{ name?: string }>
    country?: { name?: string; code?: string }
  }
}

type PBFeaturedRecord = {
  id: string
  movie_id?: string
  background_url?: string
}

let peopleHasContentsField: boolean | null = null

function pbBaseUrl(): string {
  return process.env.NEXT_PUBLIC_PB_URL || process.env.PB_URL || "http://127.0.0.1:8090"
}

function pbApiBasePath(): string {
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

  const genreIds = Array.isArray(r.genre_id)
    ? r.genre_id.map((g) => (typeof g === "string" ? g.trim() : "")).filter(Boolean)
    : []

  const countryIds = Array.isArray(r.country_id)
    ? r.country_id.map((cc) => (typeof cc === "string" ? cc.trim() : "")).filter(Boolean)
    : []

  const primaryVideo: VideoSources | undefined = c
    ? {
      vidsrc_url: c.vidsrc_url || undefined,
      vidlink_pro_url: c.vidlink_url || undefined,
      autoembed_url: c.autoembed_url || undefined,
      gomo_url: c.gomo_url || undefined,
      moviesapi_url: c.moviesapi_url || undefined,
    }
    : undefined

  const genresRaw = (exp.genre_id || [])
    .map((g) => (g.name || "").trim())
    .filter(Boolean)
    .map(toDisplayGenreName)

  const genres = Array.from(
    new Map(genresRaw.map((g) => [g.toLowerCase(), g] as const)).values(),
  )

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
    genreIds: genreIds.length > 0 ? genreIds : undefined,
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
    countryIds: countryIds.length > 0 ? countryIds : undefined,
  }
}

function personRecordToPerson(r: PBPersonRecord): Person | null {
  const displayName = (r.name || "").trim()
  if (!displayName) return null
  const id = (r.imdb_id || "").trim() || r.id
  return {
    id,
    displayName,
    primaryImage:
      r.img_url && typeof r.img_url === "string" && r.img_url.trim()
        ? {
          url: r.img_url.trim(),
          width: typeof r.img_width === "number" ? r.img_width : 0,
          height: typeof r.img_height === "number" ? r.img_height : 0,
        }
        : undefined,
    professions: extractProfessions(r),
  }
}

function normalizeProfessionToken(token: string): string | null {
  const t = token.trim().toLowerCase()
  if (!t) return null
  if (t === "actor" || t === "actress" || t === "cast") return "actor"
  if (t === "director" || t === "directing") return "director"
  if (t === "writer" || t === "screenwriter" || t === "scenarist" || t === "writing") return "writer"
  if (t === "producer" || t === "executive producer" || t === "executive_producer") return "producer"
  return t
}

function extractProfessions(r: PBPersonRecord): string[] {
  const out: string[] = []

  if (Array.isArray(r.professions)) {
    for (const it of r.professions) {
      if (typeof it !== "string") continue
      const n = normalizeProfessionToken(it)
      if (n) out.push(n)
    }
  }

  if (typeof r.profession === "string") {
    const n = normalizeProfessionToken(r.profession)
    if (n) out.push(n)
  }

  if (typeof r["professions_as________________"] === "string" && r["professions_as________________"].trim()) {
    const raw = r["professions_as________________"].trim()
    for (const it of raw.split(/[,/|]/g)) {
      const n = normalizeProfessionToken(it)
      if (n) out.push(n)
    }
  }

  return Array.from(new Set(out))
}

async function listPeopleByMovieRecordId(movieRecordId: string, imdbId?: string): Promise<{
  directors: Person[]
  writers: Person[]
  stars: Person[]
}> {
  const id = movieRecordId.trim()
  if (!id) return { directors: [], writers: [], stars: [] }

  const fetchWithFilter = async (filter: string) =>
    pbGetJSON<PBListResp<PBPersonRecord>>(pbApiBasePath() + "/people", {
      page: 1,
      perPage: 200,
      filter,
      sort: "name",
      fields: "id,imdb_id,name,professions,profession,professions_as________________,img_url,img_width,img_height",
    })

  const candidates = [id, (imdbId || "").trim()].filter(Boolean)
  const ops = [
    (v: string) => `movie_id="${v}"`,
    (v: string) => `movie_id ?= "${v}"`,
    (v: string) => `movie_id ~ "${v}"`,
  ]

  let resp: PBListResp<PBPersonRecord> = { page: 1, perPage: 200, totalItems: 0, totalPages: 0, items: [] }
  outer: for (const cand of candidates) {
    const escaped = cand.replaceAll('"', "\\\"")
    for (const op of ops) {
      try {
        const r = await fetchWithFilter(op(escaped))
        if (r.items && r.items.length > 0) {
          resp = r
          break outer
        }
      } catch {
        continue
      }
    }
  }

  const directors: Person[] = []
  const writers: Person[] = []
  const stars: Person[] = []

  for (const r of resp.items) {
    const p = personRecordToPerson(r)
    if (!p) continue

    const profSet = new Set(p.professions || [])
    const hasDirector = profSet.has("director")
    const hasWriter = profSet.has("writer")
    const hasActor = profSet.has("actor")

    if (hasDirector) directors.push(p)
    else if (hasWriter && !hasActor) writers.push(p)
    else if (hasActor) stars.push(p)
    else stars.push(p)
  }

  return { directors, writers, stars }
}

function normalizePBRelationIds(v: unknown): string[] {
  if (typeof v === "string") {
    const s = v.trim()
    return s ? [s] : []
  }
  if (Array.isArray(v)) {
    const out: string[] = []
    for (const it of v) {
      if (typeof it === "string" && it.trim()) out.push(it.trim())
    }
    return out
  }
  return []
}

function buildOrEqualsFilter(field: string, ids: string[]): string {
  const parts = ids
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => `${field}="${id.replaceAll('"', "\\\"")}"`)
  if (parts.length === 0) return ""
  if (parts.length === 1) return parts[0]
  return `(${parts.join(" || ")})`
}

async function listPeopleByContentRecordId(contentRecordId: string): Promise<PBPersonRecord[]> {
  const cid = contentRecordId.trim()
  if (!cid) return []

  if (peopleHasContentsField === false) return []

  const fetchWithFilter = async (filter: string) =>
    pbGetJSON<PBListResp<PBPersonRecord>>(pbApiBasePath() + "/people", {
      page: 1,
      perPage: 200,
      filter,
      sort: "name",
      fields: "id,imdb_id,name,professions,profession,professions_as________________,img_url,img_width,img_height,movie_id",
    })

  try {
    let resp = await fetchWithFilter(`contents="${cid.replaceAll('"', "\\\"")}"`)
    if (!resp.items || resp.items.length === 0) {
      resp = await fetchWithFilter(`contents ?= "${cid.replaceAll('"', "\\\"")}"`)
    }

    if (peopleHasContentsField === null) peopleHasContentsField = true

    return resp.items || []
  } catch (err) {
    const msg = err instanceof Error ? err.message : ""
    if (/unknown field\s+"contents"/i.test(msg) || /invalid left operand\s+"contents"/i.test(msg)) {
      peopleHasContentsField = false
    }
    return []
  }
}

async function listPeopleForMovie(movieRecordId: string, imdbId?: string, contentRecordId?: string): Promise<{
  directors: Person[]
  writers: Person[]
  stars: Person[]
}> {
  const moviePeople = await listPeopleByMovieRecordId(movieRecordId, imdbId)
  if (!contentRecordId) return moviePeople

  if (moviePeople.directors.length > 0 || moviePeople.writers.length > 0 || moviePeople.stars.length > 0) {
    return moviePeople
  }

  const extra = await listPeopleByContentRecordId(contentRecordId)
  if (extra.length === 0) return moviePeople

  const seen = new Set<string>()
  const directors: Person[] = []
  const writers: Person[] = []
  const stars: Person[] = []

  const pushUnique = (arr: Person[], p: Person) => {
    if (seen.has(p.id)) return
    seen.add(p.id)
    arr.push(p)
  }

  for (const p of moviePeople.directors) pushUnique(directors, p)
  for (const p of moviePeople.writers) pushUnique(writers, p)
  for (const p of moviePeople.stars) pushUnique(stars, p)

  for (const r of extra) {
    const p = personRecordToPerson(r)
    if (!p) continue

    const profSet = new Set(p.professions || [])
    const hasDirector = profSet.has("director")
    const hasWriter = profSet.has("writer")
    const hasActor = profSet.has("actor")

    if (hasDirector) pushUnique(directors, p)
    else if (hasWriter && !hasActor) pushUnique(writers, p)
    else if (hasActor) pushUnique(stars, p)
    else pushUnique(stars, p)
  }

  return { directors, writers, stars }
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
  if (!c.imdb_id) return null

  const people = await listPeopleForMovie(rec.id, id, rec.content_id)
  return {
    ...c,
    directors: people.directors,
    writers: people.writers,
    stars: people.stars,
  }
}

export async function getPersonById(idOrImdb: string): Promise<{ person: Person; movieIds: string[] } | null> {
  const q = idOrImdb.trim()
  if (!q) return null

  const escaped = q.replaceAll('"', "\\\"")
  const resp = await pbGetJSON<PBListResp<PBPersonRecord>>(pbApiBasePath() + "/people", {
    page: 1,
    perPage: 1,
    filter: `id="${escaped}" || imdb_id="${escaped}"`,
    fields: "id,imdb_id,name,professions,profession,professions_as________________,img_url,img_width,img_height,movie_id",
  })

  const rec = resp.items[0]
  if (!rec) return null
  const person = personRecordToPerson(rec)
  if (!person) return null

  return {
    person,
    movieIds: normalizePBRelationIds(rec.movie_id),
  }
}

export async function listContentByPersonCredits(credits: {
  movieIds: string[]
}): Promise<Content[]> {
  const idFilter = buildOrEqualsFilter("id", credits.movieIds)

  if (!idFilter) return []

  const { items } = await listContent({
    page: 1,
    perPage: 200,
    filter: idFilter,
    sort: "-vote_count",
  })

  return items
}

export async function listGenres(): Promise<Array<{ id: string; name: string }>> {
  const resp = await pbGetJSON<PBListResp<PBGenreRecord>>(pbApiBasePath() + "/genres", {
    page: 1,
    perPage: 200,
    sort: "name",
  })

  const out: Array<{ id: string; name: string }> = []
  const seen = new Set<string>()
  for (const g of resp.items) {
    const name = toDisplayGenreName((g.name || "").trim())
    if (!g.id || !name) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ id: g.id, name })
  }
  return out
}

export async function listChannels(opts?: {
  page?: number
  perPage?: number
  filter?: string
  sort?: string
}): Promise<{ items: Channel[]; totalItems: number; totalPages: number; page: number; perPage: number }> {
  const page = opts?.page ?? 1
  const perPage = opts?.perPage ?? 200

  const resp = await pbGetJSON<PBListResp<PBChannelRecord>>(pbApiBasePath() + "/channels", {
    page,
    perPage,
    filter: opts?.filter,
    sort: opts?.sort || "title",
    expand: "category,country",
    fields: "id,title,logo_url,quality,stream_url,expand.category,expand.country",
  })

  const items: Channel[] = []
  for (const r of resp.items) {
    const name = (r.title || "").trim()
    const url = (r.stream_url || "").trim()
    if (!name || !url) continue

    const categories = (r.expand?.category || [])
      .map((c) => (typeof c?.name === "string" ? c.name.trim() : ""))
      .filter(Boolean)

    const category = categories[0] || undefined
    const country = typeof r.expand?.country?.name === "string" ? r.expand.country.name.trim() : undefined

    items.push({
      id: r.id,
      name,
      logo: (r.logo_url || "").trim() || undefined,
      quality: (r.quality || "").trim() || undefined,
      url,
      category: category || undefined,
      categories: categories.length > 0 ? categories : undefined,
      country: country || undefined,
    })
  }

  return {
    items,
    totalItems: resp.totalItems,
    totalPages: resp.totalPages,
    page: resp.page,
    perPage: resp.perPage,
  }
}

export async function findGenreBySlug(slug: string): Promise<{ id: string; name: string } | null> {
  const s = slug.trim().toLowerCase()
  if (!s) return null

  // First try exact match with lowercase
  let resp = await pbGetJSON<PBListResp<PBGenreRecord>>("/api/pb/genres", {
    page: 1,
    perPage: 1,
    filter: `name="${s.replaceAll('"', '\\"')}"`,
  })

  // If no result, try case-insensitive like match
  if (!resp.items || resp.items.length === 0) {
    resp = await pbGetJSON<PBListResp<PBGenreRecord>>("/api/pb/genres", {
      page: 1,
      perPage: 1,
      filter: `name~"${s.replaceAll('"', '\\"')}"`,
    })
  }

  // If still no result, get all genres and find case-insensitive match
  if (!resp.items || resp.items.length === 0) {
    const allGenres = await pbGetJSON<PBListResp<PBGenreRecord>>("/api/pb/genres", {
      page: 1,
      perPage: 200,
    })
    const match = allGenres.items.find(
      (g) => g.name && g.name.toLowerCase() === s
    )
    if (match?.id && match?.name) {
      return { id: match.id, name: toDisplayGenreName(match.name) }
    }
    return null
  }

  const g = resp.items[0]
  if (!g?.id || !g.name) return null
  return { id: g.id, name: toDisplayGenreName(g.name) }
}
