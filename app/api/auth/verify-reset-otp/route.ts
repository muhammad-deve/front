import { verifyOtp } from "../_lib"
import { clearResetCookie, setResetCookie } from "../_reset"
import { getPocketBaseAuthorizationHeaderValue, pbBaseUrl } from "../../pb/_auth"

export const runtime = "nodejs"

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

async function pbUserExists(email: string): Promise<boolean> {
  const safeEmail = email.replaceAll('"', "\\\"")
  const url = new URL("/api/collections/users/records", pbBaseUrl())
  url.searchParams.set("page", "1")
  url.searchParams.set("perPage", "1")
  url.searchParams.set("filter", `email=\"${safeEmail}\"`)
  url.searchParams.set("fields", "id")

  const res = await pbFetch(url.pathname + url.search)
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`PocketBase user lookup failed: ${res.status} ${text}`)
  }
  const json = (await res.json().catch(() => null)) as { items?: Array<{ id?: unknown }> } | null
  return typeof json?.items?.[0]?.id === "string"
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as { email?: unknown; otp?: unknown } | null

    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
    const otp = typeof body?.otp === "string" ? body.otp.trim() : ""

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Invalid email" }, { status: 400 })
    }
    if (!/^\d{5}$/.test(otp)) {
      return Response.json({ error: "Invalid OTP" }, { status: 400 })
    }

    const exists = await pbUserExists(email)
    if (!exists) {
      await clearResetCookie()
      return Response.json({ error: "Account not found" }, { status: 400 })
    }

    const ok = await verifyOtp(email, "reset", otp)
    if (!ok) {
      await clearResetCookie()
      return Response.json({ error: "Invalid or expired OTP" }, { status: 400 })
    }

    await setResetCookie(email)
    return Response.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return Response.json({ error: message }, { status: 500 })
  }
}
