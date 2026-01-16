import { getSessionUser, setSessionCookie } from "../_lib"
import { getPocketBaseAuthorizationHeaderValue, pbBaseUrl } from "../../pb/_auth"

export const runtime = "nodejs"

type WishlistRec = {
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

export async function GET() {
  const user = await getSessionUser()
  if (!user?.id) return Response.json({ user })

  const watchlist = await pbGetWishlistImdbIds(user.id)
  const hydrated = { ...user, watchlist }
  await setSessionCookie(hydrated)
  return Response.json({ user: hydrated })
}
