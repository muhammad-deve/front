import { setSessionCookie, sha256Hex } from "../_lib"
import { getPocketBaseAuthorizationHeaderValue, pbBaseUrl } from "../../pb/_auth"

export const runtime = "nodejs"

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/g).filter(Boolean)
  const firstName = parts[0] ? parts[0][0]!.toUpperCase() + parts[0]!.slice(1) : "User"
  const lastName = parts.slice(1).join(" ")
  return { firstName, lastName }
}

function pbUserAvatarUrl(userId: string, avatarFilename: string): string {
  const fn = avatarFilename.trim()
  if (!fn) return ""
  return new URL(`/api/files/users/${userId}/${encodeURIComponent(fn)}`, pbBaseUrl()).toString()
}

async function pbAdminFetch(path: string, init?: RequestInit) {
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

async function pbFindUserByEmail(
  email: string,
): Promise<{ id: string; email: string; name?: string; avatar?: string } | null> {
  const safeEmail = email.replaceAll('"', "\\\"")
  const url = new URL("/api/collections/users/records", pbBaseUrl())
  url.searchParams.set("page", "1")
  url.searchParams.set("perPage", "1")
  url.searchParams.set("filter", `email=\"${safeEmail}\"`)
  url.searchParams.set("fields", "id,email,name,avatar")

  const res = await pbAdminFetch(url.pathname + url.search)
  if (!res.ok) return null
  const json = (await res.json().catch(() => null)) as {
    items?: Array<{ id?: unknown; email?: unknown; name?: unknown; avatar?: unknown }>
  } | null
  const item = json?.items?.[0]
  if (!item || typeof item.id !== "string" || typeof item.email !== "string") return null
  return {
    id: item.id,
    email: item.email,
    name: typeof item.name === "string" ? item.name : undefined,
    avatar: typeof item.avatar === "string" ? item.avatar : undefined,
  }
}

type WishlistRec = {
  movie_id?: string
  expand?: { movie_id?: { imdb_id?: string } }
}

async function pbGetWishlistImdbIds(userId: string): Promise<string[]> {
  const safeUserId = userId.replaceAll('"', "\\\"")
  const url = new URL("/api/collections/wishlist/records", pbBaseUrl())
  url.searchParams.set("page", "1")
  url.searchParams.set("perPage", "200")
  url.searchParams.set("filter", `user_id=\"${safeUserId}\"`)
  url.searchParams.set("expand", "movie_id")
  url.searchParams.set("fields", "movie_id,expand.movie_id.imdb_id")

  const res = await pbAdminFetch(url.pathname + url.search)
  if (!res.ok) return []
  const json = (await res.json().catch(() => null)) as { items?: WishlistRec[] } | null
  const out: string[] = []
  for (const r of json?.items || []) {
    const imdb = (r.expand?.movie_id?.imdb_id || "").trim()
    if (imdb) out.push(imdb)
  }
  return Array.from(new Set(out))
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as { email?: unknown; password?: unknown } | null

    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = typeof body?.password === "string" ? body.password : ""

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Invalid email" }, { status: 400 })
    }
    if (!password) {
      return Response.json({ error: "Invalid password" }, { status: 400 })
    }

    // Validate credentials using PB user auth endpoint (no OTP).
    const authUrl = new URL("/api/collections/users/auth-with-password", pbBaseUrl())
    const authRes = await fetch(authUrl.toString(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identity: email, password }),
      cache: "no-store",
    })

    if (!authRes.ok) {
      return Response.json({ error: "Invalid email or password" }, { status: 400 })
    }

    // Fetch user record details (id, name) using admin token.
    const pbUser = await pbFindUserByEmail(email)
    if (!pbUser?.id) {
      return Response.json({ error: "Account not found" }, { status: 400 })
    }

    const { firstName, lastName } = pbUser.name ? splitName(pbUser.name) : { firstName: "User", lastName: "" }
    const watchlist = await pbGetWishlistImdbIds(pbUser.id)
    const avatar = pbUser.avatar ? pbUserAvatarUrl(pbUser.id, pbUser.avatar) : undefined

    const user = {
      id: pbUser.id || sha256Hex(email).slice(0, 12),
      email,
      firstName,
      lastName,
      avatar,
      watchlist,
      watchHistory: [],
    }

    await setSessionCookie(user)

    return Response.json({ ok: true, user })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return Response.json({ error: message }, { status: 500 })
  }
}
