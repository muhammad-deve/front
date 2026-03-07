import { clearResetCookie, getResetEmailFromCookie } from "../_reset"
import { getPocketBaseAuthorizationHeaderValue, pbBaseUrl } from "../../pb/_auth"

export const runtime = "nodejs"

function isPasswordValid(password: string): boolean {
  if (password.length < 8 || password.length > 64) return false
  if (!/[A-Za-z]/.test(password)) return false
  if (!/\d/.test(password)) return false
  return true
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

async function pbFindUserIdByEmail(email: string): Promise<string | null> {
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
  const id = json?.items?.[0]?.id
  return typeof id === "string" ? id : null
}

export async function POST(req: Request) {
  try {
    const resetEmail = await getResetEmailFromCookie()
    if (!resetEmail) {
      return Response.json({ error: "Password reset session expired. Start again." }, { status: 401 })
    }

    const body = (await req.json().catch(() => null)) as
      | { email?: unknown; password?: unknown; confirmPassword?: unknown }
      | null

    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = typeof body?.password === "string" ? body.password : ""
    const confirmPassword = typeof body?.confirmPassword === "string" ? body.confirmPassword : ""

    if (email && email !== resetEmail) {
      return Response.json({ error: "Email does not match verified reset session" }, { status: 400 })
    }
    if (!isPasswordValid(password)) {
      return Response.json({ error: "Password must be 8-64 chars with letters and numbers" }, { status: 400 })
    }
    if (confirmPassword && confirmPassword !== password) {
      return Response.json({ error: "Passwords do not match" }, { status: 400 })
    }

    const userId = await pbFindUserIdByEmail(resetEmail)
    if (!userId) {
      await clearResetCookie()
      return Response.json({ error: "Account not found" }, { status: 400 })
    }

    const updateRes = await pbFetch(`/api/collections/users/records/${userId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        password,
        passwordConfirm: password,
      }),
    })

    if (!updateRes.ok) {
      const text = await updateRes.text().catch(() => "")
      return Response.json({ error: `Failed to reset password: ${updateRes.status} ${text}` }, { status: 400 })
    }

    await clearResetCookie()
    return Response.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return Response.json({ error: message }, { status: 500 })
  }
}
