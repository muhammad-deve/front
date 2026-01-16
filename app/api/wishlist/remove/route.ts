import { getSessionUser, setSessionCookie } from "../../auth/_lib"
import { getPocketBaseAuthorizationHeaderValue, pbBaseUrl } from "../../pb/_auth"

export const runtime = "nodejs"

type PBListResp<T> = {
  items: T[]
}

type PBMovieRecord = {
  id: string
}

type WishlistRec = {
  id: string
  expand?: { movie_id?: { imdb_id?: string } }
}

async function pbFetch(path: string, init?: RequestInit) {
  const authorization = await getPocketBaseAuthorizationHeaderValue()
  return fetch(new URL(path, pbBaseUrl()).toString(), {
    ...init,
    cache: "no-store",
    headers: {
      ...(init?.headers || {}),
      Authorization: authorization,
    },
  })
}

async function pbFindMovieRecordIdByImdb(imdbId: string): Promise<string | null> {
  const safe = imdbId.replaceAll('"', "\\\"")
  const url = new URL("/api/collections/movies/records", pbBaseUrl())
  url.searchParams.set("page", "1")
  url.searchParams.set("perPage", "1")
  url.searchParams.set("filter", `imdb_id=\"${safe}\"`)
  url.searchParams.set("fields", "id")

  const res = await pbFetch(url.pathname + url.search)
  if (!res.ok) return null
  const json = (await res.json().catch(() => null)) as PBListResp<PBMovieRecord> | null
  const rec = json?.items?.[0]
  return typeof rec?.id === "string" ? rec.id : null
}

async function pbGetWishlistImdbIds(userId: string): Promise<string[]> {
  const safeUserId = userId.replaceAll('"', "\\\"")
  const url = new URL("/api/collections/wishlist/records", pbBaseUrl())
  url.searchParams.set("page", "1")
  url.searchParams.set("perPage", "200")
  url.searchParams.set("filter", `user_id=\"${safeUserId}\"`)
  url.searchParams.set("expand", "movie_id")
  url.searchParams.set("fields", "expand.movie_id.imdb_id")

  const res = await pbFetch(url.pathname + url.search)
  if (!res.ok) return []
  const json = (await res.json().catch(() => null)) as { items?: WishlistRec[] } | null

  const out: string[] = []
  for (const it of json?.items || []) {
    const imdb = (it.expand?.movie_id?.imdb_id || "").trim()
    if (imdb) out.push(imdb)
  }
  return Array.from(new Set(out))
}

async function pbFindWishlistRecordId(userId: string, movieRecordId: string): Promise<string | null> {
  const safeUserId = userId.replaceAll('"', "\\\"")
  const safeMovieId = movieRecordId.replaceAll('"', "\\\"")
  const url = new URL("/api/collections/wishlist/records", pbBaseUrl())
  url.searchParams.set("page", "1")
  url.searchParams.set("perPage", "1")
  url.searchParams.set("filter", `user_id=\"${safeUserId}\" && movie_id=\"${safeMovieId}\"`)
  url.searchParams.set("fields", "id")

  const res = await pbFetch(url.pathname + url.search)
  if (!res.ok) return null
  const json = (await res.json().catch(() => null)) as PBListResp<{ id?: unknown }> | null
  const rec = json?.items?.[0]
  return typeof rec?.id === "string" ? rec.id : null
}

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser()
    if (!sessionUser?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await req.json().catch(() => null)) as { imdbId?: unknown } | null
    const imdbId = typeof body?.imdbId === "string" ? body.imdbId.trim() : ""
    if (!imdbId) {
      return Response.json({ error: "Missing imdbId" }, { status: 400 })
    }

    const movieRecordId = await pbFindMovieRecordIdByImdb(imdbId)
    if (!movieRecordId) {
      return Response.json({ error: "Movie not found" }, { status: 404 })
    }

    const wishlistRecordId = await pbFindWishlistRecordId(sessionUser.id, movieRecordId)
    if (wishlistRecordId) {
      await pbFetch(`/api/collections/wishlist/records/${wishlistRecordId}`, { method: "DELETE" }).catch(() => {})
    }

    const watchlist = await pbGetWishlistImdbIds(sessionUser.id)
    await setSessionCookie({ ...sessionUser, watchlist })

    return Response.json({ ok: true, watchlist })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return Response.json({ error: message }, { status: 500 })
  }
}
