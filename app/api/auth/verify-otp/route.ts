import { setSessionCookie, verifyOtp, sha256Hex } from "../_lib"
import { getPocketBaseAuthorizationHeaderValue, pbBaseUrl } from "../../pb/_auth"

export const runtime = "nodejs"

function emailToNameParts(email: string): { firstName: string; lastName: string } {
  const local = email.split("@")[0] || "User"
  const base = local.replaceAll(/[._-]+/g, " ").trim()
  const parts = base.split(/\s+/g).filter(Boolean)
  const first = parts[0] ? parts[0][0].toUpperCase() + parts[0].slice(1) : "User"
  const last = parts.slice(1).join(" ")
  return { firstName: first, lastName: last }
}

function isPasswordValid(password: string): boolean {
  if (password.length < 8 || password.length > 64) return false
  if (!/[A-Za-z]/.test(password)) return false
  if (!/\d/.test(password)) return false
  return true
}

function pbUserAvatarUrl(userId: string, avatarFilename: string): string {
  const fn = avatarFilename.trim()
  if (!fn) return ""
  return new URL(`/api/files/users/${userId}/${encodeURIComponent(fn)}`, pbBaseUrl()).toString()
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

async function pbFindUserByEmail(
  email: string,
): Promise<{ id: string; email: string; name?: string; avatar?: string } | null> {
  const safeEmail = email.replaceAll('"', "\\\"")
  const url = new URL("/api/collections/users/records", pbBaseUrl())
  url.searchParams.set("page", "1")
  url.searchParams.set("perPage", "1")
  url.searchParams.set("filter", `email=\"${safeEmail}\"`)
  url.searchParams.set("fields", "id,email,name,avatar")

  const res = await pbFetch(url.pathname + url.search)
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`PocketBase user lookup failed: ${res.status} ${text}`)
  }
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

async function pbCreateUser(opts: {
  email: string
  password: string
  firstName: string
  lastName: string
}): Promise<{ id: string; email: string; name?: string } | null> {
  const name = `${opts.firstName} ${opts.lastName}`.trim()
  const res = await pbFetch("/api/collections/users/records", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: opts.email,
      password: opts.password,
      passwordConfirm: opts.password,
      name,
    }),
  })

  if (!res.ok) return null
  const json = (await res.json().catch(() => null)) as { id?: unknown; email?: unknown; name?: unknown } | null
  if (!json || typeof json.id !== "string" || typeof json.email !== "string") return null
  return { id: json.id, email: json.email, name: typeof json.name === "string" ? json.name : undefined }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | {
          email?: unknown
          purpose?: unknown
          otp?: unknown
          firstName?: unknown
          lastName?: unknown
          password?: unknown
        }
      | null

    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
    const purpose = typeof body?.purpose === "string" ? body.purpose : "signin"
    const otp = typeof body?.otp === "string" ? body.otp.trim() : ""

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Invalid email" }, { status: 400 })
    }
    if (purpose !== "signup" && purpose !== "signin") {
      return Response.json({ error: "Invalid purpose" }, { status: 400 })
    }
    if (!/^\d{5}$/.test(otp)) {
      return Response.json({ error: "Invalid OTP" }, { status: 400 })
    }

    const ok = await verifyOtp(email, purpose, otp)
    if (!ok) {
      return Response.json({ error: "Invalid or expired OTP" }, { status: 400 })
    }

    const nameFromEmail = emailToNameParts(email)
    const firstName =
      typeof body?.firstName === "string" && body.firstName.trim() ? body.firstName.trim() : nameFromEmail.firstName
    const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : nameFromEmail.lastName

    let pbUserId: string | null = null
    if (purpose === "signup") {
      const password = typeof body?.password === "string" ? body.password : ""
      if (!isPasswordValid(password)) {
        return Response.json({ error: "Invalid password" }, { status: 400 })
      }

      const existing = await pbFindUserByEmail(email)
      if (existing?.id) {
        return Response.json({ error: "Email already registered" }, { status: 400 })
      }

      const created = await pbCreateUser({ email, password, firstName, lastName })
      if (!created) {
        return Response.json({ error: "Failed to create account" }, { status: 400 })
      }
      pbUserId = created.id
    } else {
      const existing = await pbFindUserByEmail(email)
      if (!existing?.id) {
        return Response.json({ error: "Account not found" }, { status: 400 })
      }
      pbUserId = existing.id
    }

    const found = await pbFindUserByEmail(email)
    const avatar = found?.avatar && pbUserId ? pbUserAvatarUrl(pbUserId, found.avatar) : undefined

    const user = {
      id: pbUserId || sha256Hex(email).slice(0, 12),
      email,
      firstName,
      lastName,
      avatar,
      watchlist: [],
      watchHistory: [],
    }

    await setSessionCookie(user)

    return Response.json({ ok: true, user })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return Response.json({ error: message }, { status: 500 })
  }
}
